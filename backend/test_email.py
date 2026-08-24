"""
Email Dispatch Testing Utility
Usage: python test_email.py [recipient@example.com]
"""
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core import config
from app.services.email_service import EmailService

def main():
    recipient = sys.argv[1] if len(sys.argv) > 1 else "tusharkasbe2207@gmail.com"
    
    print("=" * 60)
    print("  CENTRAL BANK OF INDIA - SMTP CONFIGURATION DIAGNOSTICS")
    print("=" * 60)
    print(f"  SMTP Host:       {config.SMTP_HOST}")
    print(f"  SMTP Port:       {config.SMTP_PORT}")
    print(f"  SMTP User:       {config.SMTP_USER or '(NOT SET - Empty)'}")
    print(f"  SMTP Password:   {'*' * len(config.SMTP_PASSWORD) if config.SMTP_PASSWORD else '(NOT SET - Empty)'}")
    print(f"  From Email:      {config.SMTP_FROM_EMAIL}")
    print(f"  Use TLS:         {config.SMTP_USE_TLS}")
    print(f"  Use SSL:         {config.SMTP_USE_SSL}")
    print(f"  Email Enabled:   {config.EMAIL_ENABLED}")
    print(f"  Test Recipient:  {recipient}")
    print("=" * 60)
    
    if not config.SMTP_USER or not config.SMTP_PASSWORD:
        print("\n⚠️  WARNING: SMTP_USER or SMTP_PASSWORD is empty in backend/.env!")
        print("   If using smtp.gmail.com, Gmail will reject the email without an App Password.\n")

    print(f"Attempting to send test email to {recipient}...")
    
    html = """
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #0E4F8D; border-radius: 8px;">
      <h2 style="color: #0E4F8D;">Central Bank of India - SMTP Test Successful! ✅</h2>
      <p>This is a test email dispatched from your local Payment Aggregator Portal environment.</p>
      <p><b>Application Reference:</b> #61</p>
      <p><b>Status:</b> Ready for commercial quote dispatch.</p>
    </div>
    """
    
    text = (
        "Central Bank of India - SMTP Test Successful!\n\n"
        "This is a test email dispatched from your local Payment Aggregator Portal environment.\n"
        "Application Reference: #61\n"
    )
    
    success = EmailService.send_email(
        to_emails=recipient,
        subject="[Test] Central Bank of India - Payment Aggregator Portal Email Test",
        html_content=html,
        text_content=text
    )
    
    print("\n" + "=" * 60)
    if success:
        print(f"🎉 SUCCESS! Email dispatched successfully to {recipient}!")
        print("   Please check your inbox (or spam folder).")
    else:
        print(f"❌ FAILED: Email could not be sent to {recipient}.")
        print("   Please check the error log above and verify your SMTP credentials in backend/.env.")
    print("=" * 60)

if __name__ == "__main__":
    main()
