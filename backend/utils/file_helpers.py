from typing import Dict, Any
import os
import random
import re

import pendulum
import string

ALLOWED_AUDIO_EXTENSIONS = {".wav"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}
MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024
MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024
RANDOM_SUFFIX_LENGTH = 8
STATIC_BASE_PATH = "/static"
def validate_audio_file(filename: str, file_size: int) -> Dict[str, Any]:
    """Validates audio file format and size for librosa pitch analysis compatibility.
    Args:
        filename (str): Original filename with extension
        file_size (int): File size in bytes
    Returns:
        Dict[str, Any]: Validation result with keys:
            - 'valid' (bool): Whether file is valid
            - 'extension' (str): Normalized file extension (e.g., '.wav')
            - 'error' (Optional[str]): Error message if validation fails, absent if valid
    """
    _, ext = os.path.splitext(filename)
    extension = ext.lower()
    if extension not in ALLOWED_AUDIO_EXTENSIONS:
        return {
            "valid": False,
            "extension": extension,
            "error": f"Invalid audio format '{extension}'. Only WAV files are supported for pitch analysis.",
        }
    if file_size <= 0:
        return {
            "valid": False,
            "extension": extension,
            "error": "File size must be greater than 0 bytes.",
        }
    if file_size > MAX_AUDIO_FILE_SIZE:
        return {
            "valid": False,
            "extension": extension,
            "error": f"File size exceeds maximum allowed size of {MAX_AUDIO_FILE_SIZE // (1024 * 1024)}MB.",
        }
    return {
        "valid": True,
        "extension": extension,
    }
def validate_image_file(filename: str, file_size: int) -> Dict[str, Any]:
    """Validates image file format and size for avatar uploads.
    Args:
        filename (str): Original filename with extension
        file_size (int): File size in bytes
    Returns:
        Dict[str, Any]: Validation result with keys:
            - 'valid' (bool): Whether file is valid
            - 'extension' (str): Normalized file extension (e.g., '.jpg')
            - 'error' (Optional[str]): Error message if validation fails, absent if valid
    """
    _, ext = os.path.splitext(filename)
    extension = ext.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return {
            "valid": False,
            "extension": extension,
            "error": f"Invalid image format '{extension}'. Allowed formats: jpg, jpeg, png, gif.",
        }
    if file_size <= 0:
        return {
            "valid": False,
            "extension": extension,
            "error": "File size must be greater than 0 bytes.",
        }
    if file_size > MAX_IMAGE_FILE_SIZE:
        return {
            "valid": False,
            "extension": extension,
            "error": f"File size exceeds maximum allowed size of {MAX_IMAGE_FILE_SIZE // (1024 * 1024)}MB.",
        }
    return {
        "valid": True,
        "extension": extension,
    }
def _sanitize_filename(filename: str) -> str:
    """Sanitizes a filename by removing unsafe characters.
    Args:
        filename (str): Original filename to sanitize
    Returns:
        str: Sanitized filename safe for storage
    """
    sanitized = re.sub(r"[^\w.\-]", "_", filename)
    sanitized = re.sub(r"_+", "_", sanitized)
    sanitized = sanitized.strip("_.")
    return sanitized if sanitized else "file"
def generate_unique_filename(original_filename: str, category: str) -> str:
    """Generates unique filename with timestamp and random suffix.
    Args:
        original_filename (str): Original uploaded filename
        category (str): Storage category from StorageCategoryEnum (AVATAR or AUDIO)
    Returns:
        str: Unique filename string with format: {timestamp}_{random}_{sanitized_original}
    """
    timestamp = pendulum.now().format("YYYYMMDDHHmmss")
    random_suffix = "".join(
        random.choices(string.ascii_lowercase + string.digits, k=RANDOM_SUFFIX_LENGTH)
    )
    sanitized_original = _sanitize_filename(original_filename)
    return f"{timestamp}_{random_suffix}_{sanitized_original}"
def generate_static_url(category: str, filename: str) -> str:
    """Generates static file URL following /static/{category}/{filename} pattern.
    Args:
        category (str): Storage category (avatar or audio), case-insensitive
        filename (str): Stored filename
    Returns:
        str: Complete static URL string (e.g., '/static/avatar/123456_user.jpg')
    """
    category_lower = category.lower()
    return f"{STATIC_BASE_PATH}/{category_lower}/{filename}"