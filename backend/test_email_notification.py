"""
Test script to verify email templates and email service dispatch
"""
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core import config
from app.services.email_templates import render_quote_request_email
from app.services.email_service import EmailService

class MockApp:
    applicationId = 23
    customerName = "Terna Engineering College"
    category = "Education & Training"
    integrateWith = "Payment Gateway (Web & Mobile SDK)"
    avgTransactionSize = 3500.0
    avgTransactionYearly = 50000000.0
    totalAnnualTransaction = 50000000.0

def run_tests():
    print("=== 1. Testing Email Template Rendering ===")
    app = MockApp()
    rendered = render_quote_request_email(
        aggregator_name="Razorpay Software Pvt Ltd",
        contact_person="Rohan Sharma",
        application=app,
        end_date_str="2026-08-28T18:30:00.000Z",
        portal_url="http://localhost:5173"
    )

    print(f"Subject: {rendered['subject']}")
    print(f"HTML Content Length: {len(rendered['html_content'])} characters")
    print(f"--- Plain Text Preview ---\n{rendered['text_content']}\n--------------------------")
    
    assert "Central Bank of India" in rendered["subject"]
    assert "Terna Engineering College" in rendered["html_content"]
    assert "₹ 3,500.00" in rendered["html_content"]
    assert "₹ 50,000,000.00" in rendered["html_content"]
    assert "Razorpay" in rendered["html_content"]
    assert "Rohan Sharma" in rendered["html_content"]
    print("[SUCCESS] Email template rendered all expected fields accurately!")

    print("\n=== 2. Testing Email Service with Mock / Disabled Config ===")
    config.EMAIL_ENABLED = False
    res = EmailService.send_quote_request_email(
        aggregator_name="Razorpay",
        aggregator_email="merchant.support@razorpay.test",
        contact_person="Rohan Sharma",
        application=app,
        end_date_str="2026-08-28T18:30:00.000Z"
    )
    print(f"Email service mock response: {res}")
    assert res is True
    print("[SUCCESS] EmailService safely handled mock/disabled dispatch test!")

if __name__ == "__main__":
    run_tests()
