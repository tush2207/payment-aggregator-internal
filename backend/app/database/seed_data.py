import logging
from datetime import datetime, timezone, timedelta
from app.core.aggregator_security import hash_password

logger = logging.getLogger(__name__)

def seed_default_data(db):
    """
    Seeds initial reference data for development & testing
    if database tables are currently empty.
    """
    try:
        from app.model.models import (
            User,
            ManageAggregatorInDB,
            ApplicationsInDB,
            PaymentAggregatorInDB,
            ProjectionDetailsInDB
        )
        # 1. Seed Default Admin User
        if db.query(User).count() == 0:
            default_user = User(
                username="12345",
                hashed_password=hash_password("Admin@12345")
            )
            db.add(default_user)

        # 2. Seed Standard Payment Aggregators
        if db.query(ManageAggregatorInDB).count() == 0:
            sample_aggregators = [
                {
                    "aggregatorId": 1,
                    "aggregatorName": "Razorpay Software Pvt Ltd",
                    "contactPersonName": "Aakash Verma",
                    "email": "aakash.verma@razorpay.com",
                    "alternateEmail": "cbi.rfq@razorpay.com",
                    "mobileNo": 9820112233,
                    "location": "Bengaluru, Karnataka",
                    "services": "Credit Cards|Debit Cards|Net Banking|UPI|Auto-Debit",
                    "status": "active",
                    "hashed_password": hash_password("Partner@12345!"),
                    "must_reset_password": False,
                    "failed_login_attempts": 0
                },
                {
                    "aggregatorId": 2,
                    "aggregatorName": "PayU Payments India",
                    "contactPersonName": "Pooja Sharma",
                    "email": "pooja.sharma@payu.in",
                    "alternateEmail": "cbi.quotes@payu.in",
                    "mobileNo": 9811223344,
                    "location": "Gurugram, Haryana",
                    "services": "Credit Cards|Debit Cards|Net Banking|UPI",
                    "status": "active",
                    "hashed_password": hash_password("Partner@12345!"),
                    "must_reset_password": False,
                    "failed_login_attempts": 0
                },
                {
                    "aggregatorId": 3,
                    "aggregatorName": "BillDesk (IndiaIdeas.com)",
                    "contactPersonName": "Rohan Deshmukh",
                    "email": "rohan.deshmukh@billdesk.com",
                    "alternateEmail": "banking.rfq@billdesk.com",
                    "mobileNo": 9833445566,
                    "location": "Mumbai, Maharashtra",
                    "services": "Net Banking|Credit Cards|Debit Cards|UPI|Bharat QR",
                    "status": "active",
                    "hashed_password": hash_password("Partner@12345!"),
                    "must_reset_password": False,
                    "failed_login_attempts": 0
                }
            ]
            for agg in sample_aggregators:
                db.add(ManageAggregatorInDB(**agg))

        # 3. Seed Sample Applications for RFQ Workflow
        if db.query(ApplicationsInDB).count() == 0:
            sample_apps = [
                {
                    "applicationId": 1001,
                    "customerName": "Tata Memorial Cancer Research Hospital",
                    "category": "Private",
                    "businessCategory": "Healthcare & Trust",
                    "avgTransactionSize": 4500.0,
                    "avgTransactionYearly": 2500000.0,
                    "integrateWith": "Credit cards/Debit cards/ Netbanking/ UPI",
                    "status": "quoterequested",
                    "isAggregatorAdded": True,
                    "customerAcceptanceRequired": True,
                    "branchName": "Mumbai Main Branch",
                    "regionName": "Mumbai Metro",
                    "zoneName": "West Zone",
                    "currentQuoteVersion": 1,
                    "isDeleted": False
                },
                {
                    "applicationId": 1002,
                    "customerName": "National Highways Authority of India (FASTag)",
                    "category": "Government",
                    "businessCategory": "Toll & Transportation",
                    "avgTransactionSize": 750.0,
                    "avgTransactionYearly": 12000000.0,
                    "integrateWith": "UPI/Netbanking/Credit cards",
                    "status": "quoterequested",
                    "isAggregatorAdded": True,
                    "customerAcceptanceRequired": True,
                    "branchName": "New Delhi Corporate Branch",
                    "regionName": "Delhi Metro",
                    "zoneName": "North Zone",
                    "currentQuoteVersion": 1,
                    "isDeleted": False
                }
            ]
            for app_data in sample_apps:
                db.add(ApplicationsInDB(**app_data))

            # Link Sample Aggregators to Applications
            sample_pas = [
                # App 1001 -> Razorpay & PayU
                {
                    "applicationId": 1001,
                    "aggregatorId": 1,
                    "aggregatorName": "Razorpay Software Pvt Ltd",
                    "status": "quoterequested",
                    "quoteStatus": "quoterequested",
                    "isDeleted": False
                },
                {
                    "applicationId": 1001,
                    "aggregatorId": 2,
                    "aggregatorName": "PayU Payments India",
                    "status": "quoterequested",
                    "quoteStatus": "quoterequested",
                    "isDeleted": False
                },
                # App 1002 -> Razorpay & BillDesk
                {
                    "applicationId": 1002,
                    "aggregatorId": 1,
                    "aggregatorName": "Razorpay Software Pvt Ltd",
                    "status": "quoterequested",
                    "quoteStatus": "quoterequested",
                    "isDeleted": False
                },
                {
                    "applicationId": 1002,
                    "aggregatorId": 3,
                    "aggregatorName": "BillDesk (IndiaIdeas.com)",
                    "status": "quoterequested",
                    "quoteStatus": "quoterequested",
                    "isDeleted": False
                }
            ]
            for pa_data in sample_pas:
                db.add(PaymentAggregatorInDB(**pa_data))

            # Initial Projection Templates for commercial rate bidding
            instruments = ["Credit Card (Domestic)", "Debit Card (Visa/Mastercard)", "Net Banking (SBI/HDFC/ICICI)", "UPI / QR Code"]
            for app_id in (1001, 1002):
                for agg_id in (1, 2, 3):
                    for inst in instruments:
                        db.add(ProjectionDetailsInDB(
                            applicationId=app_id,
                            aggregatorId=agg_id,
                            transactionType=inst,
                            rate=0.0,
                            unit="%",
                            chargesProposed=0.0,
                            vendorShare=0.0,
                            expectedRevenue=0.0,
                            quoteVersion=1,
                            isDeleted=False
                        ))

        db.commit()
        logger.info("Default seed data initialized successfully.")
    except Exception as e:
        logger.warning(f"Seed data note: {e}")
        db.rollback()
