from __future__ import annotations

import math
import sys
import wave
from pathlib import Path


SAMPLE_RATE = 44_100
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from services.rhythm_service import ASSET_BASE_URL, RHYTHM_TRACKS

ASSET_DISK_SUBDIR = ASSET_BASE_URL.removeprefix("/static/").strip("/")
OUT_DIR = ROOT / "static" / ASSET_DISK_SUBDIR
SOUNDS_DIR = OUT_DIR / "sounds"


def _write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max(0.01, max(abs(sample) for sample in samples))
    scale = 0.92 / peak
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            value = int(max(-1.0, min(1.0, sample * scale)) * 32767)
            frames.extend(value.to_bytes(2, byteorder="little", signed=True))
        wav.writeframes(frames)


def _silence(duration_ms: int) -> list[float]:
    return [0.0] * int(SAMPLE_RATE * duration_ms / 1000)


def _add_tone(samples: list[float], start_ms: float, freq: float, duration_ms: float, amp: float = 0.8) -> None:
    start = int(SAMPLE_RATE * start_ms / 1000)
    length = int(SAMPLE_RATE * duration_ms / 1000)
    for i in range(length):
        idx = start + i
        if idx >= len(samples):
            break
        env = math.exp(-6 * i / max(1, length))
        samples[idx] += math.sin(2 * math.pi * freq * i / SAMPLE_RATE) * amp * env


def _add_noise(samples: list[float], start_ms: float, duration_ms: float, amp: float = 0.35) -> None:
    start = int(SAMPLE_RATE * start_ms / 1000)
    length = int(SAMPLE_RATE * duration_ms / 1000)
    seed = int(start_ms * 997) % 2147483647
    for i in range(length):
        idx = start + i
        if idx >= len(samples):
            break
        seed = (1103515245 * seed + 12345) & 0x7FFFFFFF
        noise = ((seed / 0x7FFFFFFF) * 2.0) - 1.0
        env = math.exp(-10 * i / max(1, length))
        samples[idx] += noise * amp * env


def _beat_ms(track: dict) -> int:
    return int(60_000 / track["bpm"])


def _offsets_to_ms(track: dict, offsets: list[float]) -> list[int]:
    beat_ms = _beat_ms(track)
    lead = float(track.get("lead_in_beats", 0))
    return [int(round((offset + lead) * beat_ms)) for offset in offsets if int(round((offset + lead) * beat_ms)) <= track["duration_ms"]]


def _beats_to_ms(track: dict, beats: list[int]) -> list[int]:
    beat_ms = _beat_ms(track)
    lead = float(track.get("lead_in_beats", 0))
    return [int(round((beat + lead) * beat_ms)) for beat in beats if int(round((beat + lead) * beat_ms)) <= track["duration_ms"]]


def _beat_grid(track: dict, step: float = 1.0) -> list[int]:
    beat_ms = _beat_ms(track)
    out = []
    current = 0.0
    while current * beat_ms <= track["duration_ms"]:
        out.append(int(round(current * beat_ms)))
        current += step
    return out


def _note_offsets(track: dict) -> list[float]:
    durations = {
        "WHOLE": 4.0,
        "HALF": 2.0,
        "QUARTER": 1.0,
        "EIGHTH": 0.5,
        "SIXTEENTH": 0.25,
        "REST": 1.0,
    }
    offset = 0.0
    starts = []
    for note_type in track["correct_sequence"]:
        if note_type != "REST":
            starts.append(offset)
        offset += durations[note_type]
    return starts


def _render_meter(track: dict) -> list[float]:
    samples = _silence(track["duration_ms"] + 500)
    beat_ms = _beat_ms(track)
    numerator = int(track["time_signature"].split("/")[0])
    group = 3 if track["time_signature"].endswith("/8") else 1
    for index, start_ms in enumerate(_beat_grid(track, 1 / group)):
        if track["time_signature"].endswith("/8"):
            eighth_index = index
            is_accent = eighth_index % 3 == 0
            is_bar = eighth_index % numerator == 0
        else:
            is_accent = index % numerator == 0
            is_bar = is_accent
        freq = 1040 if is_bar else 760 if is_accent else 420
        amp = 0.85 if is_bar else 0.62 if is_accent else 0.28
        _add_tone(samples, start_ms, freq, 70, amp)
        if not track["time_signature"].endswith("/8"):
            _add_tone(samples, start_ms + beat_ms * 0.5, 300, 35, 0.16)
    return samples


def _render_accent(track: dict) -> list[float]:
    samples = _silence(track["duration_ms"] + 500)
    targets = set(track.get("expected_beat_offsets") and _offsets_to_ms(track, track["expected_beat_offsets"]) or _beats_to_ms(track, track["expected_beats"]))
    grid_step = 0.5 if track["time_signature"].endswith("/8") else 1.0
    for start_ms in _beat_grid(track, grid_step):
        _add_tone(samples, start_ms, 360, 42, 0.22)
        if start_ms in targets:
            _add_tone(samples, start_ms, 980, 80, 0.85)
    return samples


def _render_puzzle(track: dict) -> list[float]:
    samples = _silence(track["duration_ms"] + 500)
    beat_ms = _beat_ms(track)
    for start_ms in _beat_grid(track, 1.0):
        _add_tone(samples, start_ms, 300, 35, 0.13)
    for start_ms in _offsets_to_ms(track, _note_offsets(track)):
        _add_tone(samples, start_ms, 880, 95, 0.78)
        _add_tone(samples, start_ms, 1760, 35, 0.18)
    return samples


def _render_upbeat(track: dict) -> list[float]:
    samples = _silence(track["duration_ms"] + 500)
    for start_ms in _beat_grid(track, 1.0):
        _add_tone(samples, start_ms, 260, 60, 0.34)
    for start_ms in _offsets_to_ms(track, track["expected_beat_offsets"]):
        _add_tone(samples, start_ms, 1040, 85, 0.82)
    return samples


def _render_distraction(track: dict) -> list[float]:
    samples = _silence(track["duration_ms"] + 500)
    targets = set(_beats_to_ms(track, track["expected_beats"]))
    for start_ms in _beat_grid(track, 0.5):
        if start_ms in targets:
            _add_tone(samples, start_ms, 950, 90, 0.82)
        else:
            _add_tone(samples, start_ms, 310, 35, 0.18)
    for start_ms in _beat_grid(track, 0.75):
        _add_noise(samples, start_ms + 45, 40, 0.12)
    return samples


def _render_split(track: dict) -> list[float]:
    samples = _silence(track["duration_ms"] + 500)
    for start_ms in _offsets_to_ms(track, track["left_beat_offsets"]):
        _add_tone(samples, start_ms, 260, 70, 0.55)
    for start_ms in _offsets_to_ms(track, track["right_beat_offsets"]):
        _add_tone(samples, start_ms, 920, 60, 0.45)
    return samples


def _render_loop(track: dict) -> list[float]:
    samples = _silence(track["duration_ms"] + 500)
    beat_ms = _beat_ms(track)
    for start_ms in _beat_grid(track, 1.0):
        beat_index = round(start_ms / beat_ms)
        _add_tone(samples, start_ms, 220 if beat_index % 4 == 0 else 300, 80, 0.36)
    for start_ms in _beat_grid(track, 0.5):
        _add_noise(samples, start_ms, 28, 0.08)
    for bar in range(0, 4):
        base = bar * 4 * beat_ms
        _add_tone(samples, base, 523.25, 180, 0.14)
        _add_tone(samples, base + beat_ms, 659.25, 180, 0.14)
        _add_tone(samples, base + 2 * beat_ms, 783.99, 180, 0.14)
        _add_tone(samples, base + 3 * beat_ms, 659.25, 180, 0.14)
    return samples


def _render_track(track: dict) -> list[float]:
    qtype = track["question_type"]
    if qtype == "RHYTHM_CLASSIFICATION":
        return _render_meter(track)
    if qtype == "ACCENT_DETECTION":
        return _render_accent(track)
    if qtype in {"RHYTHM_PUZZLE", "RHYTHM_ECHO"}:
        return _render_puzzle(track)
    if qtype == "UPBEAT_TRAINING":
        return _render_upbeat(track)
    if qtype == "ANTI_DISTRACTION":
        return _render_distraction(track)
    if qtype == "SPLIT_BRAIN":
        return _render_split(track)
    return _render_loop(track)


def _write_instrument_sounds() -> None:
    sounds = {
        "kick.wav": lambda s: _add_tone(s, 0, 115, 140, 0.95),
        "snare.wav": lambda s: _add_noise(s, 0, 120, 0.55),
        "hat.wav": lambda s: _add_noise(s, 0, 45, 0.32),
        "clap.wav": lambda s: (_add_noise(s, 0, 35, 0.25), _add_noise(s, 28, 45, 0.36)),
        "wood.wav": lambda s: _add_tone(s, 0, 1180, 70, 0.75),
        "rim.wav": lambda s: (_add_tone(s, 0, 1660, 45, 0.75), _add_tone(s, 4, 940, 30, 0.35)),
        "shaker.wav": lambda s: (_add_noise(s, 0, 70, 0.18), _add_noise(s, 42, 55, 0.12)),
        "cowbell.wav": lambda s: (_add_tone(s, 0, 760, 105, 0.65), _add_tone(s, 0, 1140, 90, 0.45)),
        "tom_low.wav": lambda s: _add_tone(s, 0, 170, 185, 0.85),
        "tom_high.wav": lambda s: _add_tone(s, 0, 260, 145, 0.82),
        "crash.wav": lambda s: (_add_noise(s, 0, 260, 0.42), _add_tone(s, 0, 620, 180, 0.16)),
    }
    for filename, renderer in sounds.items():
        samples = _silence(350)
        renderer(samples)
        _write_wav(SOUNDS_DIR / filename, samples)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    _write_instrument_sounds()
    for track in RHYTHM_TRACKS:
        _write_wav(OUT_DIR / track["file"], _render_track(track))
        print(f"generated {track['file']}")


if __name__ == "__main__":
    main()
