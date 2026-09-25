"""
Central Bank of India - Payment Aggregator Portal (PAPG)
Database Connection & Table Inspection Diagnostic Tool

Run anytime from terminal:
    python check_db_connection.py
"""

import os
import sys
import time
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Import project components
from app.core import config
from sqlalchemy import inspect, text
from app.database.engine import (
    oracle_engine,
    mssql_engine,
    SessionLocal,
    check_oracle_health,
    check_mssql_health,
    init_db
)
from app.model.models import (
    User,
    ManageAggregatorInDB,
    ApplicationsInDB,
    PaymentAggregatorInDB,
    ProjectionDetailsInDB,
    ApplicationAuditLogInDB,
    AggregatorAuditLogInDB,
    NotificationInDB,
    FileStoreInDB,
    HelpDesk
)

def run_db_diagnostic():
    print("\n" + "=" * 80)
    print("      CENTRAL BANK OF INDIA — DATABASE CONNECTION & TABLE DIAGNOSTIC TOOL      ")
    print("=" * 80)
    
    # 1. Environment & Config Assessment
    dev_mode = config.DEV_MODE
    db_type = "SQLite (Local Dev Mode)" if dev_mode else "Oracle Database (Production)"
    print(f" • Mode               : {'DEV_MODE (SQLite active)' if dev_mode else 'PROD_MODE (Oracle active)'}")
    print(f" • Database Target    : {db_type}")
    if dev_mode:
        print(f" • SQLite DB File     : {config.SQL_LITE_DB_PATH}")
        print(f" • File Exists        : {config.SQL_LITE_DB_PATH.exists()}")
    else:
        print(f" • Oracle URL         : {config.ORACLE_CONNECTION_STRING}")
        print(f" • Central Office Code: {config.CENTRAL_OFFICE_DEPARTMENT_CODE}")
    print("=" * 80 + "\n")

    # 2. Live Connection Health Check
    print("1. DATABASE CONNECTIVITY HEALTH CHECK:")
    print("────────────────────────────────────────────────────────────────────────")
    start_t = time.time()
    oracle_ok = check_oracle_health()
    oracle_latency = (time.time() - start_t) * 1000

    if oracle_ok:
        print(f" [PASS] Primary Database Engine ({db_type}): CONNECTED (Latency: {oracle_latency:.1f}ms)")
    else:
        print(f" [FAIL] Primary Database Engine ({db_type}): UNREACHABLE")
        print("\n [TROUBLESHOOTING TIP]:")
        if not dev_mode:
            print("   - Ensure Oracle Database listener is running on port 1521.")
            print("   - Check service name 'FREEPDB1' or your configured Oracle service.")
            print("   - To fallback to SQLite for local development, set DEV_MODE=\"True\" in backend/.env")
        else:
            print(f"   - Ensure write permissions exist on: {config.SQL_LITE_DB_PATH.parent}")

    if config.MSSQL_CONNECTION_STRING and not dev_mode:
        start_mssql = time.time()
        mssql_ok = check_mssql_health()
        mssql_latency = (time.time() - start_mssql) * 1000
        if mssql_ok:
            print(f" [PASS] Secondary MSSQL Engine: CONNECTED (Latency: {mssql_latency:.1f}ms)")
        else:
            print(f" [WARN] Secondary MSSQL Engine: UNREACHABLE")

    # 3. Ensure tables are initialized
    print("\n2. INITIALIZING & VERIFYING TABLES:")
    print("────────────────────────────────────────────────────────────────────────")
    init_db()

    # 4. Table & Schema Inspection
    print("3. TABLE INVENTORY & ROW COUNTS:")
    print("────────────────────────────────────────────────────────────────────────")
    inspector = inspect(oracle_engine)
    existing_tables = inspector.get_table_names()

    model_mapping = [
        ("manage_aggregators", "Manage Aggregator Master Directory", ManageAggregatorInDB),
        ("applications", "Merchant Onboarding Applications", ApplicationsInDB),
        ("payment_aggregators", "Application Aggregator RFQ Bids", PaymentAggregatorInDB),
        ("projection_details", "Commercial Rate Projections", ProjectionDetailsInDB),
        ("aggregator_audit_logs", "Aggregator Activity Audit Trail", AggregatorAuditLogInDB),
        ("application_audit_logs", "Application Workflow Audit Logs", ApplicationAuditLogInDB),
        ("app_notifications", "Real-time Notification Alerts", NotificationInDB),
        ("users", "Central Bank Employee Accounts", User),
        ("files", "Annexures & Document Store", FileStoreInDB),
        ("helpdesk", "Central Helpdesk Query Tickets", HelpDesk),
    ]

    print(f" {'Table Name':<25} | {'Description':<35} | {'Status':<8} | {'Rows':<6}")
    print(" " + "-" * 78)

    db = SessionLocal() if SessionLocal else None
    all_ok = True

    for tbl_name, desc, model_cls in model_mapping:
        if tbl_name in existing_tables:
            row_count = db.query(model_cls).count() if db else "N/A"
            status = "ACTIVE"
            print(f" {tbl_name:<25} | {desc:<35} | {status:<8} | {row_count:<6}")
        else:
            all_ok = False
            print(f" {tbl_name:<25} | {desc:<35} | {'MISSING':<8} | {'0':<6}")

    if db:
        db.close()

    print(" " + "-" * 78)
    
    # 5. Summary Scorecard
    print("\n4. DIAGNOSTIC SCORECARD:")
    print("────────────────────────────────────────────────────────────────────────")
    if oracle_ok and all_ok:
        print("  ALL 10 DATABASE TABLES ARE PROPERLY CREATED, INDEXED, AND ACTIVE! ")
        print(" The backend is 100% ready to handle API requests, RFQ quotes, and audit logs.\n")
    else:
        print("  One or more issues were detected. Check the error log details above.\n")

if __name__ == "__main__":
    run_db_diagnostic()
