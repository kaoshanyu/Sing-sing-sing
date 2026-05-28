from typing import List
import os

from all_enums import AccuracyLevelEnum
from fastapi import UploadFile
from result_response import Result, create_validation_error, create_internal_error
import librosa
import numpy as np

from depends.storage import save_uploaded_file as storage_save_file

class FilesService:
    """File upload and audio pitch analysis service."""
    @staticmethod
    async def save_uploaded_file(file: UploadFile, category: str) -> Result[dict]:
        """Saves uploaded file to storage and returns file metadata.
        Delegates to storage.save_uploaded_file for file saving.
        Returns dict with keys: file_url, filename, file_path, file_size, content_type.
        """
        try:
            file_metadata = await storage_save_file(file, category)
            content_type = file.content_type or "application/octet-stream"
            result_data = {
                "file_url": file_metadata["file_url"],
                "filename": file_metadata["filename"],
                "file_path": file_metadata["file_path"],
                "file_size": file_metadata["file_size"],
                "content_type": content_type
            }
            return Result.success(result_data)
        except Exception as e:
            return Result.from_error(create_internal_error(f"Failed to save uploaded file: {str(e)}"))
    @staticmethod
    async def analyze_pitch_accuracy(file_path: str, reference_melody: List[int]) -> Result[dict]:
        """Analyzes pitch accuracy of singing recording using librosa.
        Loads audio with librosa, extracts pitch using librosa.pyin, segments into syllables
        via onset detection, calculates average pitch per syllable, converts to MIDI note numbers,
        compares with reference_melody, calculates deviation in cents, classifies accuracy
        (ACCURATE <50 cents, SLIGHTLY_OFF 50-100 cents, OFF >100 cents), calculates overall
        score (0-100) and stars_earned (0-3).
        Returns dict with keys: score (int 0-100), stars_earned (int 0-3),
        feedback_data (dict with syllables list and overall_pitch_accuracy float).
        """
        try:
            if not os.path.exists(file_path):
                return Result.from_error(create_validation_error(f"Audio file not found: {file_path}"))
            if not reference_melody or len(reference_melody) == 0:
                return Result.from_error(create_validation_error("Reference melody cannot be empty"))
            try:
                y, sr = librosa.load(file_path, sr=None)
            except Exception as e:
                return Result.from_error(create_internal_error(f"Failed to load audio file: {str(e)}"))
            try:
                f0, voiced_flag, voiced_probs = librosa.pyin(
                    y,
                    fmin=librosa.note_to_hz('C2'),
                    fmax=librosa.note_to_hz('C7'),
                    sr=sr
                )
            except Exception as e:
                return Result.from_error(create_internal_error(f"Failed to extract pitch: {str(e)}"))
            try:
                onset_frames = librosa.onset.onset_detect(y=y, sr=sr, units='frames')
                onset_times = librosa.frames_to_time(onset_frames, sr=sr)
            except Exception as e:
                return Result.from_error(create_internal_error(f"Failed to detect onsets: {str(e)}"))
            if len(onset_times) == 0:
                onset_times = np.array([0.0])
            audio_duration = librosa.get_duration(y=y, sr=sr)
            onset_times = np.append(onset_times, audio_duration)
            syllable_pitches = []
            for i in range(len(onset_times) - 1):
                start_time = onset_times[i]
                end_time = onset_times[i + 1]
                start_frame = librosa.time_to_frames(start_time, sr=sr)
                end_frame = librosa.time_to_frames(end_time, sr=sr)
                syllable_f0 = f0[start_frame:end_frame]
                valid_f0 = syllable_f0[~np.isnan(syllable_f0)]
                if len(valid_f0) > 0:
                    avg_freq = np.mean(valid_f0)
                    midi_note = librosa.hz_to_midi(avg_freq)
                    syllable_pitches.append(midi_note)
                else:
                    syllable_pitches.append(np.nan)
            num_syllables = min(len(syllable_pitches), len(reference_melody))
            syllables_feedback = []
            total_deviation = 0.0
            valid_syllable_count = 0
            for i in range(num_syllables):
                expected_note = reference_melody[i]
                detected_note = syllable_pitches[i]
                if np.isnan(detected_note):
                    syllables_feedback.append({
                        "syllable_index": i,
                        "expected_note": expected_note,
                        "detected_note": 0.0,
                        "deviation_cents": 0.0,
                        "accuracy_level": AccuracyLevelEnum.OFF
                    })
                    continue
                deviation_cents = abs((detected_note - expected_note) * 100.0)
                if deviation_cents < 50:
                    accuracy_level = AccuracyLevelEnum.ACCURATE
                elif deviation_cents < 100:
                    accuracy_level = AccuracyLevelEnum.SLIGHTLY_OFF
                else:
                    accuracy_level = AccuracyLevelEnum.OFF
                syllables_feedback.append({
                    "syllable_index": i,
                    "expected_note": expected_note,
                    "detected_note": float(detected_note),
                    "deviation_cents": float(deviation_cents),
                    "accuracy_level": accuracy_level
                })
                total_deviation += deviation_cents
                valid_syllable_count += 1
            if valid_syllable_count > 0:
                avg_deviation = total_deviation / valid_syllable_count
                overall_pitch_accuracy = max(0.0, min(100.0, 100.0 * np.exp(-avg_deviation / 50.0)))
            else:
                overall_pitch_accuracy = 0.0
            score = int(round(overall_pitch_accuracy))
            if score >= 90:
                stars_earned = 3
            elif score >= 70:
                stars_earned = 2
            elif score >= 50:
                stars_earned = 1
            else:
                stars_earned = 0
            feedback_data = {
                "syllables": syllables_feedback,
                "overall_pitch_accuracy": float(overall_pitch_accuracy)
            }
            result_data = {
                "score": score,
                "stars_earned": stars_earned,
                "feedback_data": feedback_data
            }
            return Result.success(result_data)
        except Exception as e:
            return Result.from_error(create_internal_error(f"Pitch analysis failed: {str(e)}"))