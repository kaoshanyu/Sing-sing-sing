"""Voice timbre conversion service.

Two approaches:
1. Spectral envelope matching (librosa only, CPU, fast)
2. Seed-VC neural conversion (PyTorch MPS/CUDA, high quality)
"""
import json
import os
import shutil
import subprocess
import time
import uuid
from pathlib import Path
from typing import Optional

import librosa
import numpy as np
import soundfile as sf
from scipy.ndimage import gaussian_filter1d

from result_response import Result, create_validation_error, create_internal_error

VOICE_DATA_DIR = Path(__file__).resolve().parent.parent / "voice_data"
PROFILES_DIR = VOICE_DATA_DIR / "profiles"
UPLOADS_DIR = VOICE_DATA_DIR / "uploads"
OUTPUTS_DIR = VOICE_DATA_DIR / "outputs"
SEEDVC_DIR = VOICE_DATA_DIR / "seedvc"

for d in [PROFILES_DIR, UPLOADS_DIR, OUTPUTS_DIR, SEEDVC_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Default processing params
SAMPLE_RATE = 44100
N_FFT = 2048
HOP_LENGTH = 256


# ========== Spectral Envelope Approach ==========

def extract_tone_profile(audio_path: str, name: str = "default") -> Result[dict]:
    """Extract spectral envelope + MFCC profile from reference audio.

    Returns dict with keys: name, f0_median, f0_range, profile_path.
    """
    try:
        if not os.path.exists(audio_path):
            return Result.from_error(create_validation_error(f"Audio file not found: {audio_path}"))

        y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
        y, _ = librosa.effects.trim(y, top_db=35)
        y = librosa.util.normalize(y)

        S = np.abs(librosa.stft(y, n_fft=N_FFT, hop_length=HOP_LENGTH)) + 1e-7
        log_S = np.log(S)
        spectral_envelope = gaussian_filter1d(log_S.mean(axis=1), sigma=3)

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20, n_fft=N_FFT, hop_length=HOP_LENGTH)
        f0, _, _ = librosa.pyin(
            y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C6"),
            sr=sr, frame_length=N_FFT, hop_length=HOP_LENGTH,
        )
        voiced_f0 = f0[np.isfinite(f0)]

        profile = {
            "sample_rate": SAMPLE_RATE,
            "n_fft": N_FFT,
            "hop_length": HOP_LENGTH,
            "spectral_envelope": spectral_envelope,
            "mfcc_mean": mfcc.mean(axis=1),
            "mfcc_std": mfcc.std(axis=1) + 1e-6,
            "f0_median": float(np.nanmedian(voiced_f0)) if voiced_f0.size else 0.0,
            "f0_p10": float(np.nanpercentile(voiced_f0, 10)) if voiced_f0.size else 0.0,
            "f0_p90": float(np.nanpercentile(voiced_f0, 90)) if voiced_f0.size else 0.0,
        }

        safe_name = name.replace(" ", "_").replace("/", "_")
        profile_path = PROFILES_DIR / f"{safe_name}.npz"
        np.savez(profile_path, **profile)

        return Result.success({
            "name": safe_name,
            "f0_median": profile["f0_median"],
            "f0_range": [profile["f0_p10"], profile["f0_p90"]],
            "profile_path": str(profile_path),
        })
    except Exception as e:
        return Result.from_error(create_internal_error(f"Tone profile extraction failed: {str(e)}"))


def load_profile(name: str = "default") -> dict:
    """Load a tone profile by name."""
    safe_name = name.replace(" ", "_").replace("/", "_")
    profile_path = PROFILES_DIR / f"{safe_name}.npz"
    if not profile_path.exists():
        raise FileNotFoundError(f"Profile '{name}' not found at {profile_path}")
    return dict(np.load(profile_path))


def list_profiles() -> list:
    """List all saved tone profiles."""
    profiles = []
    for f in PROFILES_DIR.glob("*.npz"):
        try:
            data = np.load(f)
            profiles.append({
                "name": f.stem,
                "f0_median": float(data.get("f0_median", 0)),
                "f0_range": [
                    float(data.get("f0_p10", 0)),
                    float(data.get("f0_p90", 0)),
                ],
            })
        except Exception:
            profiles.append({"name": f.stem, "error": "corrupted"})
    return profiles


def convert_voice(
    audio_path: str,
    profile_name: str = "default",
    strength: float = 0.72,
) -> Result[np.ndarray]:
    """Convert voice timbre using spectral envelope matching.

    Returns the converted audio array.
    """
    try:
        if not os.path.exists(audio_path):
            return Result.from_error(create_validation_error(f"Audio file not found: {audio_path}"))

        profile = load_profile(profile_name)
        reference_envelope = profile["spectral_envelope"]
        n_fft = int(profile.get("n_fft", N_FFT))
        hop_length = int(profile.get("hop_length", HOP_LENGTH))
        sr = int(profile.get("sample_rate", SAMPLE_RATE))

        y, _ = librosa.load(audio_path, sr=sr, mono=True)

        stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
        mag = np.abs(stft) + 1e-7
        phase = np.angle(stft)

        target_envelope = gaussian_filter1d(np.log(mag).mean(axis=1), sigma=3)
        gain = np.exp((reference_envelope - target_envelope) * strength)
        gain = gaussian_filter1d(gain, sigma=2)
        gain = np.clip(gain, 0.25, 4.0)

        converted_mag = mag * gain[:, None]
        converted = librosa.istft(converted_mag * np.exp(1j * phase), hop_length=hop_length, length=len(y))
        converted = librosa.util.normalize(converted)

        return Result.success(converted)
    except FileNotFoundError as e:
        return Result.from_error(create_validation_error(str(e)))
    except Exception as e:
        return Result.from_error(create_internal_error(f"Voice conversion failed: {str(e)}"))


def mix_with_accompaniment(
    vocals: np.ndarray,
    accompaniment_path: str,
    vocal_gain: float = 0.95,
    accompaniment_gain: float = 0.85,
    target_sr: int = SAMPLE_RATE,
) -> Result[np.ndarray]:
    """Mix converted vocals with accompaniment."""
    try:
        if not os.path.exists(accompaniment_path):
            return Result.from_error(create_validation_error(f"Accompaniment not found: {accompaniment_path}"))

        music, music_sr = librosa.load(accompaniment_path, sr=target_sr, mono=True)
        n = min(len(vocals), len(music))
        mix = music[:n] * accompaniment_gain + vocals[:n] * vocal_gain

        peak = float(np.max(np.abs(mix)))
        if peak > 0.98:
            mix = mix / (peak / 0.98)

        return Result.success(mix)
    except Exception as e:
        return Result.from_error(create_internal_error(f"Mixing failed: {str(e)}"))


# ========== Seed-VC Approach ==========

def run_seedvc_conversion(
    source_audio: str,
    reference_prompt: str,
    output_dir: str,
    diffusion_steps: int = 8,
    length_adjust: float = 1.0,
    cfg_rate: float = 0.8,
    f0_condition: bool = True,
    auto_f0_adjust: bool = False,
    semi_tone_shift: int = 0,
    fp16: bool = True,
) -> Result[dict]:
    """Run Seed-VC neural voice conversion via subprocess.

    Returns dict with keys: output_path, duration_sec.
    """
    seedvc_dir = Path(__file__).resolve().parent.parent.parent / "singing_coach" / "seed-vc"
    if not seedvc_dir.exists():
        return Result.from_error(create_internal_error(
            "Seed-VC not found at singing_coach/seed-vc. "
            "Make sure the singing_coach project is in the parent directory."
        ))

    checkpoint_dir = seedvc_dir.parent / "models" / "seedvc"
    checkpoint = checkpoint_dir / "DiT_seed_v2_uvit_whisper_base_f0_44k_bigvgan_pruned_ft_ema_v2.pth"
    config_file = checkpoint_dir / "config_dit_mel_seed_uvit_whisper_base_f0_44k.yml"

    if not checkpoint.exists():
        return Result.from_error(create_internal_error(
            f"Seed-VC checkpoint not found at {checkpoint}. "
            "Download from HuggingFace: Plachta/Seed-VC"
        ))

    inference_script = seedvc_dir / "inference.py"
    if not inference_script.exists():
        return Result.from_error(create_internal_error(f"inference.py not found at {inference_script}"))

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["HF_ENDPOINT"] = "https://hf-mirror.com"
    env["PYTHONPATH"] = str(seedvc_dir) + os.pathsep + env.get("PYTHONPATH", "")

    cmd = [
        "python", str(inference_script),
        "--source", source_audio,
        "--target", reference_prompt,
        "--output", str(out_dir),
        "--diffusion-steps", str(diffusion_steps),
        "--length-adjust", str(length_adjust),
        "--inference-cfg-rate", str(cfg_rate),
        "--f0-condition", str(f0_condition),
        "--auto-f0-adjust", str(auto_f0_adjust),
        "--semi-tone-shift", str(semi_tone_shift),
        "--checkpoint", str(checkpoint),
        "--config", str(config_file),
        "--fp16", str(fp16),
    ]

    try:
        start = time.time()
        result = subprocess.run(cmd, cwd=str(seedvc_dir), env=env,
                                capture_output=True, text=True, timeout=600)
        elapsed = time.time() - start

        if result.returncode != 0:
            return Result.from_error(create_internal_error(
                f"Seed-VC failed (exit {result.returncode}): {result.stderr[:500]}"
            ))

        # Find output file
        out_files = list(out_dir.glob("*.wav"))
        if not out_files:
            return Result.from_error(create_internal_error(
                "Seed-VC completed but no output file found"
            ))

        return Result.success({
            "output_path": str(out_files[0]),
            "duration_sec": round(elapsed, 1),
            "stdout": result.stdout[-200:],
        })
    except subprocess.TimeoutExpired:
        return Result.from_error(create_internal_error("Seed-VC timed out (>10 min)"))
    except FileNotFoundError as e:
        return Result.from_error(create_internal_error(
            f"Python not found. Make sure PyTorch is installed: {str(e)}"
        ))
    except Exception as e:
        return Result.from_error(create_internal_error(f"Seed-VC error: {str(e)}"))


def check_seedvc_available() -> dict:
    """Check if Seed-VC dependencies are available."""
    result = {
        "torch": False,
        "mps": False,
        "cuda": False,
        "model_files": False,
        "ready": False,
    }
    try:
        import torch
        result["torch"] = True
        result["cuda"] = torch.cuda.is_available()
        result["mps"] = torch.backends.mps.is_available()

        seedvc_dir = Path(__file__).resolve().parent.parent.parent / "singing_coach" / "models" / "seedvc"
        checkpoint = seedvc_dir / "DiT_seed_v2_uvit_whisper_base_f0_44k_bigvgan_pruned_ft_ema_v2.pth"
        result["model_files"] = checkpoint.exists()
        result["ready"] = result["torch"] and result["model_files"]
    except ImportError:
        pass
    return result
