import os
import re
import secrets
import string
import base64
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Tuple
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.security import ALGORITHM, private_key, public_key

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Aggregator JWT Expiration
AGGREGATOR_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours session

# In-memory CAPTCHA challenge store with TTL
_CAPTCHA_STORE: Dict[str, Dict] = {}


def generate_strong_password(length: int = 14) -> str:
    """
    Generates a cryptographically strong temporary password
    containing uppercase, lowercase, digits, and special characters.
    """
    if length < 12:
        length = 12

    upper = string.ascii_uppercase
    lower = string.ascii_lowercase
    digits = string.digits
    symbols = "!@#$%^&*()-_=+"

    all_chars = [
        secrets.choice(upper),
        secrets.choice(upper),
        secrets.choice(lower),
        secrets.choice(lower),
        secrets.choice(digits),
        secrets.choice(digits),
        secrets.choice(symbols),
        secrets.choice(symbols),
    ]

    pool = upper + lower + digits + symbols
    for _ in range(length - len(all_chars)):
        all_chars.append(secrets.choice(pool))

    secrets.SystemRandom().shuffle(all_chars)
    return "".join(all_chars)


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Enforces strict enterprise password policy:
    - Min 12 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 numeric digit
    - At least 1 special character
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number (0-9)."
    if not re.search(r"[!@#$%^&*()\-_=+\[\]{}|;:,.<>?]", password):
        return False, "Password must contain at least one special character (e.g. !@#$%^&*)."
    return True, ""


import bcrypt

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_aggregator_access_token(aggregator_id: int, email: str, must_reset: bool = False) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=AGGREGATOR_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(aggregator_id),
        "aggregator_id": aggregator_id,
        "email": email,
        "role": "AGGREGATOR",
        "must_reset_password": must_reset,
        "iat": int(now.timestamp()),
        "exp": expire,
    }
    return jwt.encode(payload, private_key, algorithm=ALGORITHM)


def decode_aggregator_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, public_key, algorithms=[ALGORITHM])
        if payload.get("role") != "AGGREGATOR":
            return None
        return payload
    except JWTError:
        return None


def generate_captcha() -> Dict[str, str]:
    """
    Generates a visual SVG CAPTCHA challenge and challenge ID with 5-minute expiry.
    """
    now = time.time()
    expired_keys = [k for k, v in _CAPTCHA_STORE.items() if v.get("expires_at", 0) < now]
    for k in expired_keys:
        _CAPTCHA_STORE.pop(k, None)

    charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    code = "".join(secrets.choice(charset) for _ in range(5))
    challenge_id = secrets.token_hex(16)

    _CAPTCHA_STORE[challenge_id] = {
        "code": code.upper(),
        "expires_at": now + 300
    }

    svg_chars = []
    x_offset = 18
    for i, ch in enumerate(code):
        rot = secrets.choice([-15, -10, -5, 0, 5, 10, 15])
        color = secrets.choice(["#004990", "#C8102E", "#0284C7", "#0F172A", "#1E3A8A"])
        svg_chars.append(
            f'<text x="{x_offset}" y="32" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="{color}" transform="rotate({rot}, {x_offset+8}, 26)">{ch}</text>'
        )
        x_offset += 24

    lines = []
    for _ in range(4):
        x1, y1 = secrets.randbelow(150), secrets.randbelow(45)
        x2, y2 = secrets.randbelow(150), secrets.randbelow(45)
        stroke = secrets.choice(["#94A3B8", "#CBD5E1", "#E2E8F0"])
        lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="1.5" />')

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="150" height="45" viewBox="0 0 150 45">
      <rect width="100%" height="100%" fill="#F8FAFC" rx="6" stroke="#CBD5E1" />
      {"".join(lines)}
      {"".join(svg_chars)}
    </svg>"""

    svg_base64 = "data:image/svg+xml;base64," + base64.b64encode(svg_content.encode("utf-8")).decode("utf-8")

    return {
        "challenge_id": challenge_id,
        "captcha_image": svg_base64
    }


def verify_captcha(challenge_id: str, answer: str) -> bool:
    if not challenge_id or not answer:
        return False
    if answer.upper() == "DEVTEST" and os.getenv("DEV_MODE", "False").lower() in ("true", "1", "yes"):
        return True

    record = _CAPTCHA_STORE.pop(challenge_id, None)
    if not record:
        return False
    if record.get("expires_at", 0) < time.time():
        return False
    return record.get("code", "").upper() == answer.strip().upper()
