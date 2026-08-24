"""
Central Bank of India - Payment Aggregator Portal
Email Dispatch Service
"""

import smtplib
import ssl
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Union, Any
from app.core import config
from app.services.email_templates import render_quote_request_email

logger = logging.getLogger("email_service")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [EmailService] %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)


class EmailService:
    @staticmethod
    def send_email(
        to_emails: Union[str, List[str]],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc_emails: Optional[Union[str, List[str]]] = None
    ) -> bool:
        """
        Sends an HTML/text email using configured SMTP settings.
        Returns True on success, False otherwise.
        """
        if not to_emails:
            logger.warning("No recipient email specified. Skipping email dispatch.")
            return False

        # Convert to list if single string
        recipients = [to_emails] if isinstance(to_emails, str) else list(to_emails)
        recipients = [e.strip() for e in recipients if e and e.strip()]

        cc_list = []
        if cc_emails:
            cc_list = [cc_emails] if isinstance(cc_emails, str) else list(cc_emails)
            cc_list = [e.strip() for e in cc_list if e and e.strip()]

        all_recipients = recipients + cc_list

        if not recipients:
            logger.warning("No valid recipient addresses found.")
            return False

        # If email is disabled or mock mode
        if not config.EMAIL_ENABLED:
            logger.info(f"[MOCK EMAIL] Email is disabled in config. Would send to {recipients} | Subject: '{subject}'")
            return True

        # Check SMTP Host
        smtp_host = config.SMTP_HOST
        smtp_port = config.SMTP_PORT
        smtp_user = (config.SMTP_USER or "").strip()
        smtp_password = (config.SMTP_PASSWORD or "").replace(" ", "").strip()
        from_email = (config.SMTP_FROM_EMAIL or config.SMTP_USER or "no-reply.papg@cbi.co.in").strip()
        from_name = config.SMTP_FROM_NAME or "Central Bank of India - Payment Aggregator Portal"

        if not smtp_host:
            logger.warning("[EMAIL] SMTP_HOST not configured. Skipping email dispatch.")
            return False

        # Always save a local copy to sent_emails directory for instant local testing/preview
        try:
            from pathlib import Path
            from datetime import datetime
            sent_dir = Path(__file__).resolve().parents[2] / "sent_emails"
            sent_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_recip = recipients[0].replace("@", "_at_").replace(".", "_")
            out_file = sent_dir / f"email_{timestamp}_{safe_recip}.html"
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(f"<!-- TO: {', '.join(recipients)} | SUBJECT: {subject} | TIME: {datetime.now()} -->\n")
                f.write(html_content or f"<pre>{text_content}</pre>")
            logger.info(f"💾 [LOCAL PREVIEW SAVED] Email saved to: {out_file}")
        except Exception as save_err:
            logger.warning(f"Could not save local email preview file: {save_err}")

        # If SMTP credentials are not configured, treat as local dev mode and succeed gracefully
        if not smtp_user or not smtp_password:
            logger.info(f"📧 [DEV MOCK MODE] No SMTP credentials in .env. Email simulated successfully to {recipients} with subject: '{subject}'")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = ", ".join(recipients)
            if cc_list:
                msg["Cc"] = ", ".join(cc_list)

            # Attach plain text and HTML versions
            if text_content:
                msg.attach(MIMEText(text_content, "plain", "utf-8"))
            if html_content:
                msg.attach(MIMEText(html_content, "html", "utf-8"))

            logger.info(f"Connecting to SMTP server {smtp_host}:{smtp_port} (TLS={config.SMTP_USE_TLS}, SSL={config.SMTP_USE_SSL})...")

            if config.SMTP_USE_SSL:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=15) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(from_email, all_recipients, msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                    if config.SMTP_USE_TLS:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    server.login(smtp_user, smtp_password)
                    server.sendmail(from_email, all_recipients, msg.as_string())

            logger.info(f"✅ Email successfully dispatched via SMTP to {recipients} with subject: '{subject}'")
            return True

        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error(f"SMTP Authentication Error sending email to {recipients}: {auth_err}")
            return False
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {recipients}: {e}", exc_info=True)
            return False

    @classmethod
    def send_quote_request_email(
        cls,
        aggregator_name: str,
        aggregator_email: Optional[str],
        contact_person: Optional[str],
        application: Any,
        end_date_str: Optional[str] = None,
        projections: Optional[Any] = None
    ) -> bool:
        """
        Dispatches quotation request notification email to a specific Payment Aggregator,
        including merchant summary and payment channel projections.
        """
        if not aggregator_email or not aggregator_email.strip():
            logger.warning(f"No email address found for aggregator '{aggregator_name}'. Skipping email notification.")
            return False

        rendered = render_quote_request_email(
            aggregator_name=aggregator_name,
            contact_person=contact_person,
            application=application,
            end_date_str=end_date_str,
            portal_url=config.PORTAL_BASE_URL,
            projections=projections
        )

        return cls.send_email(
            to_emails=aggregator_email.strip(),
            subject=rendered["subject"],
            html_content=rendered["html_content"],
            text_content=rendered["text_content"]
        )
