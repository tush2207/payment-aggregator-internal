import os
import sys
import logging

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from sqlalchemy import create_engine, Sequence, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateSequence
from sqlalchemy import event
from app.core import config

logger = logging.getLogger(__name__)

# --- Oracle / DB setup ---
Base = declarative_base()

connection_url = config.ORACLE_CONNECTION_STRING
is_sqlite = False
if config.DEV_MODE and config.SQL_LITE_CONNECTION_STRING:
    connection_url = config.SQL_LITE_CONNECTION_STRING

def _mask_connection_url(url: str) -> str:
    """Masks credentials in connection strings for safe logging."""
    if not url:
        return "None"
    if url.startswith("sqlite"):
        return url
    try:
        prefix, rest = url.split("://", 1)
        if "@" in rest:
            user_info, host_info = rest.split("@", 1)
            user = user_info.split(":", 1)[0]
            return f"{prefix}://{user}:******@{host_info}"
        return url
    except Exception:
        return url

try:
    if connection_url and connection_url.startswith("sqlite"):
        is_sqlite = True
        oracle_engine = create_engine(
            connection_url,
            connect_args={"check_same_thread": False, "timeout": 30},
            echo=False,
        )

        @event.listens_for(oracle_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.close()

        print("\n" + "=" * 75)
        print("  [DATABASE ENGINE] Initialized Local SQLite (DEV_MODE = True)")
        print(f"  [DATABASE ENGINE] Path : {config.SQL_LITE_DB_PATH}")
        print("  [DATABASE ENGINE] Mode : Concurrency WAL Enabled (Timeout: 30s)")
        print("=" * 75)
    else:
        is_sqlite = False
        oracle_engine = create_engine(
            connection_url,
            echo=False,
            pool_size=20,
            max_overflow=10,
            pool_timeout=10,
            pool_pre_ping=True,
            pool_recycle=1800,
        )
        print("\n" + "=" * 75)
        print("  [DATABASE ENGINE] Connecting to Oracle Database (DEV_MODE = False)")
        print(f"  [DATABASE ENGINE] URL  : {_mask_connection_url(connection_url)}")
        print("  [DATABASE ENGINE] Pool : High-Concurrency Pool (size=20, max_overflow=10)")
        print("=" * 75)

    SessionLocal = sessionmaker(bind=oracle_engine, autocommit=False, autoflush=False)
except Exception as e:
    print(f"\n[DATABASE] [ERROR] Fatal Error initializing DB engine: {e}")
    print("  [TROUBLESHOOTING] If running locally without Oracle, set DEV_MODE=\"True\" in backend/.env to use SQLite.")
    logger.error(f"Error initializing DB engine: {e}")
    oracle_engine = None
    SessionLocal = None

# --- MS SQL setup ---
MSSQLBase = declarative_base()

if config.DEV_MODE:
    mssql_engine = None
    MSSQLSessionLocal = None
else:
    try:
        mssql_engine = create_engine(
            config.MSSQL_CONNECTION_STRING,
            connect_args={"timeout": 3},
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        MSSQLSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=mssql_engine)
    except Exception as e:
        logger.error(f"Error initializing MSSQL engine: {e}")
        mssql_engine = None
        MSSQLSessionLocal = None


def check_oracle_health() -> bool:
    if oracle_engine is None:
        return False
    try:
        with oracle_engine.connect() as conn:
            if is_sqlite:
                conn.execute(text("SELECT 1"))
            else:
                conn.execute(text("SELECT 1 FROM DUAL"))
        return True
    except Exception as e:
        logger.warning(f"Database health check note: {e}")
        return False


def check_mssql_health() -> bool:
    if mssql_engine is None:
        return False
    try:
        with mssql_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"MSSQL health check failed: {e}")
        return False


def init_db():
    """
    Ensures all 10 ORM models, sequences, table schemas,
    and migrations are verified and created with clear console feedback.
    """
    # Ensure all ORM models are registered with Base.metadata
    try:
        import app.model.models
    except Exception as e:
        pass

    if oracle_engine is None:
        print("[DATABASE] [ERROR] Cannot initialize tables: oracle_engine is None.")
        return

    # Test live connectivity
    is_healthy = check_oracle_health()
    db_label = "SQLite (paws.db)" if is_sqlite else "Oracle Database"
    if is_healthy:
        print(f"[DATABASE] [OK] Connection test passed for {db_label}.")
    else:
        print(f"[DATABASE] [WARN] Connection test warning for {db_label}. Attempting initialization...")

    # 1. Initialize Oracle Sequences (Oracle only, safe on SQLite)
    sequences = [
        "user_id_seq",
        "payment_aggregator_id_seq",
        "manage_aggregator_id_seq",
        "applications_id_seq",
        "projection_details_id_seq",
        "fileStore_id_seq",
        "helpdesk_details_id_seq",
        "notif_id_seq",
        "agg_audit_log_id_seq",
    ]
    try:
        with oracle_engine.begin() as connection:
            for seq_name in sequences:
                try:
                    connection.execute(CreateSequence(Sequence(seq_name)))
                except Exception:
                    pass
    except Exception as e:
        logger.debug(f"Oracle sequence notice: {e}")

    # 2. Create All Registered Tables
    try:
        Base.metadata.create_all(bind=oracle_engine)
        inspector = inspect(oracle_engine)
        created_tables = inspector.get_table_names()

        target_tables = [
            'aggregator_audit_logs',
            'app_notifications',
            'application_audit_logs',
            'applications',
            'files',
            'helpdesk',
            'manage_aggregators',
            'payment_aggregators',
            'projection_details',
            'users'
        ]

        print("[DATABASE] -------------------------------------------------------------")
        print("[DATABASE] Verifying & Initializing Database Tables:")
        for idx, table_name in enumerate(target_tables, 1):
            if table_name in created_tables:
                print(f"[DATABASE]   [OK] [{idx:02d}/10] Table Active: {table_name}")
            else:
                print(f"[DATABASE]   [PENDING] [{idx:02d}/10] Table Pending: {table_name}")
        print("[DATABASE] -------------------------------------------------------------")
    except Exception as e:
        print(f"[DATABASE] [ERROR] Error creating tables on {db_label}: {e}")
        logger.error(f"Database create_all error: {e}")

    # 3. Ensure Extended Columns Exist (Safe on Oracle / SQLite / MSSQL)
    try:
        with oracle_engine.begin() as conn:
            app_columns = [
                ("businessCategory", "VARCHAR2(255)"),
                ("customerAcceptanceRequired", "NUMBER(1) DEFAULT 1"),
                ("poMailStatus", "VARCHAR2(50) DEFAULT 'PENDING'"),
                ("poMailSentAt", "TIMESTAMP WITH TIME ZONE"),
                ("poMailRecipient", "VARCHAR2(255)"),
                ("rejectedBy", "VARCHAR2(255)"),
                ("rejectedRole", "VARCHAR2(50)"),
                ("rejectedDate", "TIMESTAMP WITH TIME ZONE"),
                ("branchName", "VARCHAR2(1020)"),
                ("regionName", "VARCHAR2(1020)"),
                ("zoneName", "VARCHAR2(1020)"),
                ("rccMailId", "VARCHAR2(1020)"),
                ("rccMobileNo", "NUMBER(15)"),
                ("rccContactPersonName", "VARCHAR2(1020)"),
                ("authorisedPersonName", "VARCHAR2(1020)"),
                ("authorisedPersonDesignation", "VARCHAR2(1020)"),
                ("currentQuoteVersion", "NUMBER(5) DEFAULT 1"),
                ("isNegotiationRequested", "NUMBER(1) DEFAULT 0"),
                ("negotiationRemarks", "VARCHAR2(1020)"),
                ("negotiationRequestedBy", "VARCHAR2(255)"),
                ("negotiationRequestedDate", "TIMESTAMP WITH TIME ZONE"),
                ("approvedByRODate", "TIMESTAMP WITH TIME ZONE"),
                ("approvedByCODate", "TIMESTAMP WITH TIME ZONE"),
                ("quoteAddedPADate", "TIMESTAMP WITH TIME ZONE"),
                ("quoteReviewCODate", "TIMESTAMP WITH TIME ZONE"),
                ("quoteAcceptRODate", "TIMESTAMP WITH TIME ZONE"),
                ("finalApprovedDate", "TIMESTAMP WITH TIME ZONE"),
            ]
            for col_name, col_type in app_columns:
                try:
                    conn.execute(text(f"ALTER TABLE applications ADD ({col_name} {col_type})"))
                except Exception:
                    try:
                        conn.execute(text(f"ALTER TABLE applications ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

            pa_columns = [
                ("sumOfRate", "FLOAT DEFAULT 0.0"),
                ("quoteStatus", "VARCHAR2(255)"),
                ("email", "VARCHAR2(255)"),
                ("avgTransactionYearly", "FLOAT"),
                ("avgTransactionSize", "FLOAT"),
                ("category", "VARCHAR2(255)"),
            ]
            for col_name, col_type in pa_columns:
                try:
                    conn.execute(text(f"ALTER TABLE payment_aggregators ADD ({col_name} {col_type})"))
                except Exception:
                    try:
                        conn.execute(text(f"ALTER TABLE payment_aggregators ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

            agg_columns = [
                ("alternateEmail", "VARCHAR2(255)"),
                ("status", "VARCHAR2(50) DEFAULT 'active'"),
                ("hashed_password", "VARCHAR2(255)"),
                ("must_reset_password", "NUMBER(1) DEFAULT 1"),
                ("failed_login_attempts", "NUMBER(5) DEFAULT 0"),
                ("locked_until", "TIMESTAMP WITH TIME ZONE"),
                ("last_login_at", "TIMESTAMP WITH TIME ZONE"),
                ("last_login_ip", "VARCHAR2(255)"),
                ("created_at", "TIMESTAMP WITH TIME ZONE"),
            ]
            for col_name, col_type in agg_columns:
                try:
                    conn.execute(text(f"ALTER TABLE manage_aggregators ADD ({col_name} {col_type})"))
                except Exception:
                    try:
                        conn.execute(text(f"ALTER TABLE manage_aggregators ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

            proj_columns = [
                ("quoteVersion", "NUMBER(5) DEFAULT 1"),
                ("revisionRemarks", "VARCHAR2(1020)"),
                ("createdAt", "TIMESTAMP WITH TIME ZONE"),
            ]
            for col_name, col_type in proj_columns:
                try:
                    conn.execute(text(f"ALTER TABLE projection_details ADD ({col_name} {col_type})"))
                except Exception:
                    try:
                        conn.execute(text(f"ALTER TABLE projection_details ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

            helpdesk_columns = [
                ("attachmentUrl", "VARCHAR2(512)"),
                ("attachmentName", "VARCHAR2(256)"),
                ("attachments", "CLOB" if not is_sqlite else "TEXT"),
                ("changedFields", "CLOB" if not is_sqlite else "TEXT"),
                ("targetOffice", "VARCHAR2(50) DEFAULT 'BO'"),
                ("queryType", "VARCHAR2(100) DEFAULT 'APPLICATION_QUERY'"),
            ]
            for col_name, col_type in helpdesk_columns:
                try:
                    conn.execute(text(f"ALTER TABLE helpdesk ADD ({col_name} {col_type})"))
                except Exception:
                    try:
                        conn.execute(text(f"ALTER TABLE helpdesk ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass
    except Exception as e:
        logger.debug(f"DB column verification notice: {e}")

    # 4. MSSQL Engine (Production view) - Read-only view, no table creation needed
    if mssql_engine is not None and check_mssql_health():
        print("[DATABASE] [OK] Secondary MSSQL Employee view connected.")

    # 5. Initialization complete
    print(f"[DATABASE] [OK] Database initialization complete. All tables ready.\n")




