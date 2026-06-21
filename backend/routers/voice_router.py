"""Voice timbre conversion API router.

Runs locally (not on Vercel) — provides endpoints for:
- Tone profile extraction from reference audio
- Spectral envelope voice conversion
- Seed-VC neural voice conversion
"""
import os
import uuid
from pathlib import Path

import soundfile as sf
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from result_response import ApiResponse, create_validation_error, create_internal_error

from services.voice_service import (
    VOICE_DATA_DIR,
    UPLOADS_DIR,
    OUTPUTS_DIR,
    convert_voice,
    extract_tone_profile,
    list_profiles,
    load_profile,
    mix_with_accompaniment,
    run_seedvc_conversion,
    check_seedvc_available,
)

router = APIRouter(tags=["voice"])


@router.get("/voice/status")
async def voice_status():
    """Check if voice server is running and what features are available."""
    seedvc = check_seedvc_available()
    profiles = list_profiles()
    return ApiResponse.success(data={
        "server": "running",
        "seedvc": seedvc,
        "profiles_count": len(profiles),
        "profiles": profiles,
    })


@router.get("/voice/profiles")
async def get_profiles():
    """List all saved tone profiles."""
    return ApiResponse.success(data=list_profiles())


@router.post("/voice/profile")
async def create_profile(
    file: UploadFile = File(...),
    name: str = Form("default"),
):
    """Upload reference audio and extract tone profile."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".wav", ".mp3", ".m4a", ".ogg", ".flac"):
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {ext}")

    safe_name = name.replace(" ", "_").replace("/", "_")
    upload_path = UPLOADS_DIR / f"ref_{safe_name}_{uuid.uuid4().hex[:8]}{ext}"
    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    result = extract_tone_profile(str(upload_path), name)
    if not result.is_success:
        os.remove(upload_path)
        raise HTTPException(status_code=400, detail=result.error.message)

    return ApiResponse.success(data={
        **result.data,
        "uploaded_file": str(upload_path),
    })


@router.post("/voice/convert")
async def convert_audio(
    vocals: UploadFile = File(...),
    accompaniment: UploadFile = File(None),
    profile_name: str = Form("default"),
    strength: float = Form(0.72),
):
    """Apply tone profile to target vocals.

    - vocals: target vocal audio file
    - accompaniment: optional backing track for mixing
    - profile_name: which tone profile to use
    - strength: conversion strength (0.0-1.0, default 0.72)
    """
    # Save uploaded vocals
    ext = os.path.splitext(vocals.filename or "audio.wav")[1] or ".wav"
    vocals_path = UPLOADS_DIR / f"target_{uuid.uuid4().hex[:8]}{ext}"
    content = await vocals.read()
    with open(vocals_path, "wb") as f:
        f.write(content)

    # Convert
    conv_result = convert_voice(str(vocals_path), profile_name, strength)
    if not conv_result.is_success:
        os.remove(vocals_path)
        raise HTTPException(status_code=400, detail=conv_result.error.message)

    converted = conv_result.data

    # Save converted vocals
    output_vocals = OUTPUTS_DIR / f"converted_{uuid.uuid4().hex[:8]}.wav"
    sf.write(str(output_vocals), converted, 44100)

    result_data = {
        "converted_vocals_url": f"/static/voice/outputs/{output_vocals.name}",
        "duration_sec": round(len(converted) / 44100, 1),
    }

    # Mix with accompaniment if provided
    if accompaniment and accompaniment.filename:
        acc_path = UPLOADS_DIR / f"acc_{uuid.uuid4().hex[:8]}{os.path.splitext(accompaniment.filename)[1] or '.wav'}"
        acc_content = await accompaniment.read()
        with open(acc_path, "wb") as f:
            f.write(acc_content)

        mix_result = mix_with_accompaniment(converted, str(acc_path))
        if mix_result.is_success:
            mix_audio = mix_result.data
            output_mix = OUTPUTS_DIR / f"mixed_{uuid.uuid4().hex[:8]}.wav"
            sf.write(str(output_mix), mix_audio, 44100)
            result_data["mixed_url"] = f"/static/voice/outputs/{output_mix.name}"

    return ApiResponse.success(data=result_data)


@router.post("/voice/seedvc/convert")
async def seedvc_convert(
    source: UploadFile = File(...),
    reference_prompt: UploadFile = File(...),
    diffusion_steps: int = Form(8),
    cfg_rate: float = Form(0.8),
):
    """Deep voice conversion using Seed-VC neural model.

    - source: target vocal audio to convert
    - reference_prompt: ~25s reference of the target voice
    - diffusion_steps: quality/speed tradeoff (default 8)
    """
    # Check availability
    seedvc_status = check_seedvc_available()
    if not seedvc_status["ready"]:
        missing = []
        if not seedvc_status["torch"]:
            missing.append("PyTorch (pip install torch torchaudio)")
        if not seedvc_status["model_files"]:
            missing.append("Seed-VC checkpoint files")
        raise HTTPException(
            status_code=503,
            detail=f"Seed-VC not ready. Missing: {', '.join(missing)}"
        )

    # Save uploaded files
    src_ext = os.path.splitext(source.filename or "source.wav")[1] or ".wav"
    src_path = SEEDVC_DIR / f"source_{uuid.uuid4().hex[:8]}{src_ext}"
    content = await source.read()
    with open(src_path, "wb") as f:
        f.write(content)

    ref_ext = os.path.splitext(reference_prompt.filename or "ref.wav")[1] or ".wav"
    ref_path = SEEDVC_DIR / f"ref_{uuid.uuid4().hex[:8]}{ref_ext}"
    ref_content = await reference_prompt.read()
    with open(ref_path, "wb") as f:
        f.write(ref_content)

    output_dir = SEEDVC_DIR / f"out_{uuid.uuid4().hex[:8]}"
    result = run_seedvc_conversion(
        source_audio=str(src_path),
        reference_prompt=str(ref_path),
        output_dir=str(output_dir),
        diffusion_steps=diffusion_steps,
        cfg_rate=cfg_rate,
    )

    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error.message)

    return ApiResponse.success(data=result.data)
