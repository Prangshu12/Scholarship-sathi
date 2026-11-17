"""
Scholarship Sathi — Authentication Helpers
==========================================
Module : backend/auth.py

Handles password hashing and JWT token creation/verification.
"""

import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

# Secret key — in production, set via environment variable
SECRET_KEY = os.environ.get("JWT_SECRET", "scholarship_sathi_dev_secret_2026")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 24


def hash_password(plain: str) -> str:
    """Return bcrypt hash of the plain-text password."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int, email: str) -> str:
    """
    Create a signed JWT containing the user's id and email.
    Expires after TOKEN_EXPIRE_HOURS hours.
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT. Returns the payload dict.
    Raises JWTError on invalid or expired tokens.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
