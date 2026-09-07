import logging
from sqlalchemy import create_engine, Sequence, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateSequence
from app.core import config

logger = logging.getLogger(__name__)

# --- Oracle setup ---
Base = declarative_base()

try:
    oracle_engine = create_engine(
        config.ORACLE_CONNECTION_STRING,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=3600,
    )
    SessionLocal = sessionmaker(bind=oracle_engine, autocommit=False, autoflush=False)
except Exception as e:
    logger.error(f"Error initializing Oracle engine: {e}")
    oracle_engine = None
    SessionLocal = None

# --- MS SQL setup ---
MSSQLBase = declarative_base()

try:
    mssql_engine = create_engine(
        config.MSSQL_CONNECTION_STRING,
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
            conn.execute(text("SELECT 1 FROM DUAL"))
        return True
    except Exception as e:
        logger.warning(f"Oracle health check failed: {e}")
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
    if oracle_engine is not None:
        try:
            with oracle_engine.begin() as connection:
                for seq_name in [
                    "user_id_seq",
                    "payment_aggregator_id_seq",
                    "manage_aggregator_id_seq",
                    "applications_id_seq",
                    "projection_details_id_seq",
                    "fileStore_id_seq",
                    "helpdesk_details_id_seq",
                ]:
                    try:
                        connection.execute(CreateSequence(Sequence(seq_name)))
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"Oracle DB Sequence init warning: {e}")

        try:
            Base.metadata.create_all(bind=oracle_engine)
            logger.info("Oracle DB tables verified.")
        except Exception as e:
            logger.warning(f"Oracle DB create_all warning: {e}")

    if mssql_engine is not None:
        try:
            MSSQLBase.metadata.create_all(bind=mssql_engine)
            logger.info("MSSQL DB tables verified.")
        except Exception as e:
            logger.warning(f"MSSQL DB create_all warning: {e}")
