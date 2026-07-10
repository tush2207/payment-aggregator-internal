from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, HTTPBasic
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional

security = HTTPBasic()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

with open(BASE_DIR / "private_key.pem", "rb") as f:
    private_key = f.read()
with open(BASE_DIR / "public_key.pem", "rb") as f:
    public_key = f.read()
    
ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, private_key, algorithm=ALGORITHM)
    return encoded_jwt
