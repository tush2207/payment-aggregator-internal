from sqlalchemy import create_engine, Sequence
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateSequence
from sqlalchemy.exc import DBAPIError
from app.core import config

# --- Oracle setup ---
Base = declarative_base()

oracle_engine = create_engine(config.ORACLE_CONNECTION_STRING, echo=False)
SessionLocal = sessionmaker(bind=oracle_engine, autocommit=False, autoflush=False)

# --- MS SQL setup ---
MSSQLBase = declarative_base()
mssql_engine = create_engine(config.MSSQL_CONNECTION_STRING)
MSSQLSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=mssql_engine)

def init_db():
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
        print(f"Warning: Oracle DB Sequence init failed: {e}")

    try:
        Base.metadata.create_all(bind=oracle_engine)
    except Exception as e:
        print(f"Warning: Oracle DB create_all failed: {e}")
        
    try:
        MSSQLBase.metadata.create_all(bind=mssql_engine)
    except Exception as e:
        print(f"Warning: MSSQL DB create_all failed: {e}")
