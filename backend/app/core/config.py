import os
from pathlib import Path

# Load variables from .env file dynamically
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                try:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip(' "\'')
                except ValueError:
                    pass
ORACLE_CONNECTION_STRING = os.getenv("ORACLE_CONNECTION_STRING")
MSSQL_CONNECTION_STRING = os.getenv("MSSQL_CONNECTION_STRING")
LDAP_SERVER = os.getenv("LDAP_SERVER")
SQL_LITE_CONNECTION_STRING = os.getenv("SQL_LITE_CONNECTION_STRING")

CENTRAL_OFFICE_DEPARTMENT_CODE = os.getenv("CENTRAL_OFFICE_DEPARTMENT_CODE", "CO08646")

DEV_MODE = os.getenv("DEV_MODE", "False").lower() in ("true", "1", "t", "yes", "y")

LDAP_BASE_DN = os.getenv("LDAP_BASE_DN")
# Construct the LDAP_USER_DN dynamically if LDAP_BASE_DN is present
LDAP_USER_DN = f"CN=Users,{LDAP_BASE_DN}" if LDAP_BASE_DN else ""

# ---------------- Email & SMTP Configuration ----------------
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "no-reply.papg@cbi.co.in")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Central Bank of India - Payment Aggregator Portal")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "t", "yes", "y")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "False").lower() in ("true", "1", "t", "yes", "y")
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "True").lower() in ("true", "1", "t", "yes", "y")
PORTAL_BASE_URL = os.getenv("PORTAL_BASE_URL", "http://localhost:5173")

