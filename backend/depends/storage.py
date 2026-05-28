from typing import Any, Dict
import os

from all_enums import StorageCategoryEnum
from fastapi import HTTPException, UploadFile, status

from utils.file_helpers import (
generate_static_url,
generate_unique_filename,
validate_audio_file,
validate_image_file,
)

STATIC_DIR = "static/"
UPLOAD_CATEGORIES: Dict[str, str] = {
    StorageCategoryEnum.AVATAR: "avatar",
    StorageCategoryEnum.AUDIO: "audio",
}
async def save_uploaded_file(file: UploadFile, category: str) -> Dict[str, Any]:
    """Save uploaded file to local storage and return file metadata."""
    subdir = UPLOAD_CATEGORIES.get(category)
    if subdir is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid storage category: {category}",
        )
    try:
        content = await file.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to read uploaded file",
        )
    file_size = len(content)
    original_filename = file.filename or "upload"
    if category == StorageCategoryEnum.AVATAR:
        validation = validate_image_file(original_filename, file_size)
    elif category == StorageCategoryEnum.AUDIO:
        validation = validate_audio_file(original_filename, file_size)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported storage category: {category}",
        )
    if not validation.get("valid"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation.get("error", "Invalid file format or size"),
        )
    unique_filename = generate_unique_filename(original_filename, category)
    category_dir = os.path.join(STATIC_DIR, subdir)
    try:
        os.makedirs(category_dir, exist_ok=True)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create storage directory",
        )
    file_path = os.path.join(category_dir, unique_filename)
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file to storage",
        )
    file_url = generate_static_url(subdir, unique_filename)
    relative_file_path = os.path.join(subdir, unique_filename)
    return {
        "filename": unique_filename,
        "file_path": relative_file_path,
        "file_url": file_url,
        "file_size": file_size,
    }
def get_file_path(category: str, filename: str) -> str:
    """Get absolute file system path for a stored file."""
    return os.path.join(STATIC_DIR, category, filename)