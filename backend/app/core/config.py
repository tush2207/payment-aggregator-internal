"""
Central Bank of India - Payment Aggregator & RFQ Portal (PAPG)
Core System Configuration Module

This module dynamically loads environment variables from backend/.env
and exposes strongly-typed configuration settings for all backend services.
"""

import os
from pathlib import Path

# Base backend directory: d:/Projects/PAPG-INTERNAL/backend
BASE_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

# Load variables from backend/.env file dynamically
env_path = BASE_BACKEND_DIR / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                try:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip(' "\'')
                except ValueError:
                    pass

# ─────────────────────────────────────────────────────────────────────────────
# 1. DEVELOPMENT MODE & DATABASE SWITCH
# ─────────────────────────────────────────────────────────────────────────────
# DEV_MODE:
#   - False: Uses Oracle Database (via ORACLE_CONNECTION_STRING).
#   - True : Uses local SQLite file database (paws.db).
DEV_MODE: bool = os.getenv("DEV_MODE", "False").lower() in ("true", "1", "t", "yes", "y")

# Oracle Database connection string (e.g. oracle+oracledb://PAWS_USER:Password1234@localhost:1521/?service_name=FREEPDB1)
ORACLE_CONNECTION_STRING: str = os.getenv("ORACLE_CONNECTION_STRING", "")

# SQLite Database path & connection URI (used when DEV_MODE = True)
SQL_LITE_DB_PATH: Path = BASE_BACKEND_DIR / "paws.db"
SQL_LITE_CONNECTION_STRING: str = os.getenv("SQL_LITE_CONNECTION_STRING") or f"sqlite:///{SQL_LITE_DB_PATH.as_posix()}"
if SQL_LITE_CONNECTION_STRING.startswith("sqlite:///./") or SQL_LITE_CONNECTION_STRING == "sqlite:///./paws.db":
    SQL_LITE_CONNECTION_STRING = f"sqlite:///{SQL_LITE_DB_PATH.as_posix()}"

# ─────────────────────────────────────────────────────────────────────────────
# 2. SECONDARY MASTER DATABASE (MSSQL Employee Directory)
# ─────────────────────────────────────────────────────────────────────────────
# MSSQL Connection string for VEmployeeAllDetails view.
# Bypassed automatically when DEV_MODE = True.
MSSQL_CONNECTION_STRING: str = os.getenv("MSSQL_CONNECTION_STRING", "")

# ─────────────────────────────────────────────────────────────────────────────
# 3. BANK ACTIVE DIRECTORY & LDAP AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────────
LDAP_SERVER: str = os.getenv("LDAP_SERVER", "ldaps://DRCSVR1.CBI.CO.IN")
LDAP_BASE_DN: str = os.getenv("LDAP_BASE_DN", "DC=CBI,DC=CO,DC=IN")
LDAP_USER_DN: str = f"CN=Users,{LDAP_BASE_DN}" if LDAP_BASE_DN else ""

# Department code representing Central Office (CO) administrators
CENTRAL_OFFICE_DEPARTMENT_CODE: str = os.getenv("CENTRAL_OFFICE_DEPARTMENT_CODE", "CO08646")

# Admin Users allowed to perform full administrative actions and unmasked view
# Parsed from comma-separated string in .env (e.g. "139822,115019,CE25000014,138922")
_raw_admin_users = os.getenv("ADMIN_USERS", "139822,115019,CE25000014,138922")
ADMIN_USERS: list = [u.strip() for u in _raw_admin_users.split(",") if u.strip()]

# ─────────────────────────────────────────────────────────────────────────────
# 4. EMAIL & SMTP NOTIFICATION DISPATCH SERVICE
# ─────────────────────────────────────────────────────────────────────────────
# Set to False to mock email dispatch in console; True to send real SMTP emails
ENABLE_MAIL: bool = os.getenv("ENABLE_MAIL", os.getenv("EMAIL_ENABLED", "True")).lower() in ("true", "1", "t", "yes", "y")
EMAIL_ENABLED: bool = ENABLE_MAIL

SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER: str = os.getenv("SMTP_USER", "")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "no-reply.papg@cbi.co.in")
SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Central Bank of India - Payment Aggregator Portal")
SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "t", "yes", "y")
SMTP_USE_SSL: bool = os.getenv("SMTP_USE_SSL", "False").lower() in ("true", "1", "t", "yes", "y")

# ─────────────────────────────────────────────────────────────────────────────
# 5. FRONTEND PORTAL URLS
# ─────────────────────────────────────────────────────────────────────────────
# Admin Portal Base URL (Used in links sent to Bank Approvers)
PORTAL_BASE_URL: str = os.getenv("PORTAL_BASE_URL", "http://localhost:5173")

# Vendor RFQ Portal Base URL (Used in quotation request emails sent to Payment Aggregators)
AGGREGATOR_PORTAL_URL: str = os.getenv("AGGREGATOR_PORTAL_URL", "http://localhost:5174")

# ─────────────────────────────────────────────────────────────────────────────
# 6. AES-256 DATA & PAYLOAD ENCRYPTION
# ─────────────────────────────────────────────────────────────────────────────
# 32-byte secret key (or passphrase) used for AES-256-GCM data encryption/decryption
ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "CBI_PAPG_SECURE_AES256_KEY_2026_PROD#!")
DATA_ENCRYPTION_ENABLED: bool = os.getenv("DATA_ENCRYPTION_ENABLED", "True").lower() in ("true", "1", "t", "yes", "y")
E2E_PAYLOAD_ENCRYPTION_FORCE: bool = os.getenv("E2E_PAYLOAD_ENCRYPTION_FORCE", "False").lower() in ("true", "1", "t", "yes", "y")




