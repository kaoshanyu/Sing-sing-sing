from typing import Dict, Any
import os

from jwt import exceptions as jwt_exceptions
import bcrypt
import jwt
import pendulum

JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-in-production")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
def create_access_token(user_id: int, username: str, role: str) -> str:
    """Creates JWT access token with expiration using JWT environment variables.
    Args:
        user_id (int): User database ID, must be positive integer
        username (str): User login name for token payload
        role (str): User role (ADMIN or USER) for authorization
    Returns:
        str: JWT token string encoded for Authorization header
    """
    expire = pendulum.now().add(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": expire,
    }
    encoded_jwt = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    return encoded_jwt
def verify_token(token: str) -> Dict[str, Any]:
    """Verifies and decodes JWT token using JWT environment variables with proper exception handling.
    Args:
        token (str): JWT token string from Authorization header
    Returns:
        Dict[str, Any]: Token payload with keys:
            - 'user_id' (int): User ID from token payload (converted from sub claim)
            - 'username' (str): Username from token payload
            - 'role' (str): User role from token payload
            - 'exp' (int): Token expiration timestamp
    Raises:
        jwt.ExpiredSignatureError: When token has expired
        jwt.InvalidTokenError: When token is invalid or malformed
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        sub = payload.get("sub")
        if sub is None:
            raise jwt_exceptions.InvalidTokenError("Invalid token: missing user ID")
        return {
            "user_id": int(sub),
            "username": payload.get("username"),
            "role": payload.get("role"),
            "exp": payload.get("exp"),
        }
    except jwt_exceptions.ExpiredSignatureError:
        raise jwt_exceptions.ExpiredSignatureError("Token has expired")
    except jwt_exceptions.PyJWTError:
        raise jwt_exceptions.InvalidTokenError("Invalid token")
def hash_password(password: str) -> str:
    """Hash password using bcrypt.
    Args:
        password (str): Plain text password to hash
    Returns:
        str: Hashed password string (bcrypt hash)
    """
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.
    Args:
        plain_password (str): Plain text password to verify
        hashed_password (str): Hashed password to check against
    Returns:
        bool: True if password matches, False otherwise
    """
    password_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)