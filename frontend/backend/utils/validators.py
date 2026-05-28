from typing import Any, Dict, List
import re

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
)
PASSWORD_MIN_LENGTH = 6
def validate_email(email: str) -> Dict[str, Any]:
    """Validates email format using regex patterns synchronously.
    Args:
        email (str): Email address string to validate
    Returns:
        Dict[str, Any]: Validation result with keys:
            - 'valid' (bool): Whether email format is valid
            - 'normalized' (str): Normalized email string (lowercase, trimmed)
            - 'error' (Optional[str]): Error message if validation fails, absent if valid
    """
    normalized = email.strip().lower()
    if not normalized:
        return {
            "valid": False,
            "normalized": normalized,
            "error": "Email address cannot be empty",
        }
    if not EMAIL_REGEX.match(normalized):
        return {
            "valid": False,
            "normalized": normalized,
            "error": "Invalid email format",
        }
    return {
        "valid": True,
        "normalized": normalized,
    }
def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validates password meets minimum security requirements.
    Args:
        password (str): Password string to validate
    Returns:
        Dict[str, Any]: Validation result with keys:
            - 'valid' (bool): Whether password meets requirements
            - 'errors' (List[str]): List of validation error messages, empty if valid
    """
    errors: List[str] = []
    if not password:
        errors.append("Password cannot be empty")
        return {
            "valid": False,
            "errors": errors,
        }
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(
            f"Password must be at least {PASSWORD_MIN_LENGTH} characters long"
        )
    return {
        "valid": len(errors) == 0,
        "errors": errors,
    }