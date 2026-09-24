"""
Central Bank of India - Payment Aggregator Portal
Email Dispatch Service
"""

import smtplib
import ssl
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional, Union, Any, Dict
from app.core import config
from app.services.email_templates import (
    render_quote_request_email,
    render_po_issuance_email,
    render_quote_regret_email,
    render_aggregator_onboarding_email,
    render_password_reset_confirmation_email,
    render_quote_submitted_confirmation_email,
)

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
        cc_emails: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Sends an HTML/text email using configured SMTP settings, with optional file attachments.
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
            logger.info(f"[MOCK EMAIL] Email is disabled in config. Would send to {recipients} | Subject: '{subject}' | Attachments: {len(attachments or [])}")
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

        # Single dynamic preview file only if explicitly requested for debug inspection (no multiple timestamped files)
        if getattr(config, "SAVE_EMAIL_PREVIEW_FILE", False):
            try:
                from pathlib import Path
                preview_file = Path(__file__).resolve().parents[2] / "sent_emails" / "latest_email_preview.html"
                preview_file.parent.mkdir(parents=True, exist_ok=True)
                with open(preview_file, "w", encoding="utf-8") as f:
                    f.write(f"<!-- TO: {', '.join(recipients)} | SUBJECT: {subject} -->\n")
                    f.write(html_content or f"<pre>{text_content}</pre>")
                logger.info(f"💾 [LOCAL PREVIEW] Single preview saved to: {preview_file}")
            except Exception as save_err:
                logger.debug(f"Could not save debug preview: {save_err}")

        # If SMTP credentials are not configured, treat as local dev mode and succeed gracefully
        if not smtp_user or not smtp_password:
            logger.info(f"📧 [DEV MOCK MODE] No SMTP credentials in .env. Email simulated successfully to {recipients} with subject: '{subject}' (Attached: {len(attachments or [])} files)")
            return True

        try:
            if attachments:
                msg = MIMEMultipart("mixed")
                msg["Subject"] = subject
                msg["From"] = f"{from_name} <{from_email}>"
                msg["To"] = ", ".join(recipients)
                if cc_list:
                    msg["Cc"] = ", ".join(cc_list)

                # Inner alternative container for body
                body_part = MIMEMultipart("alternative")
                if text_content:
                    body_part.attach(MIMEText(text_content, "plain", "utf-8"))
                if html_content:
                    body_part.attach(MIMEText(html_content, "html", "utf-8"))
                msg.attach(body_part)

                # Attach each file
                for att in attachments:
                    att_name = att.get("filename", "document.docx")
                    att_bytes = att.get("content", b"")
                    part = MIMEApplication(att_bytes, Name=att_name)
                    part["Content-Disposition"] = f'attachment; filename="{att_name}"'
                    msg.attach(part)
            else:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{from_name} <{from_email}>"
                msg["To"] = ", ".join(recipients)
                if cc_list:
                    msg["Cc"] = ", ".join(cc_list)

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
        aggregator_email: Union[str, List[str]],
        contact_person: Optional[str],
        application: Any,
        end_date_str: Optional[str] = None,
        projections: Optional[Any] = None,
        custom_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Dispatches quotation request notification email to a specific Payment Aggregator,
        including merchant summary and payment channel projections.
        """
        if not aggregator_email:
            logger.warning(f"No email address found for aggregator '{aggregator_name}'. Skipping email notification.")
            return False

        # If string, check non-empty
        if isinstance(aggregator_email, str) and not aggregator_email.strip():
            logger.warning(f"Empty email address found for aggregator '{aggregator_name}'. Skipping email notification.")
            return False

        rendered = render_quote_request_email(
            aggregator_name=aggregator_name,
            contact_person=contact_person,
            application=application,
            end_date_str=end_date_str,
            portal_url=config.PORTAL_BASE_URL,
            projections=projections,
            custom_data=custom_data
        )

        return cls.send_email(
            to_emails=aggregator_email,
            subject=rendered["subject"],
            html_content=rendered["html_content"],
            text_content=rendered["text_content"]
        )

    @classmethod
    def send_po_issuance_email(
        cls,
        aggregator_name: str,
        aggregator_email: Optional[str],
        contact_person: Optional[str],
        application: Any,
        po_data: Dict[str, Any],
        po_docx_bytes: bytes
    ) -> bool:
        """
        Dispatches Purchase Order email to the selected finalized payment aggregator
        attaching the generated PO .docx file upon final approval.
        """
        if not aggregator_email or not aggregator_email.strip():
            logger.warning(f"No email address found for aggregator '{aggregator_name}'. Cannot send PO email.")
            return False

        rendered = render_po_issuance_email(
            aggregator_name=aggregator_name,
            contact_person=contact_person,
            application=application,
            po_data=po_data,
            portal_url=config.PORTAL_BASE_URL
        )

        cust_name = getattr(application, "customerName", "Merchant") or "Merchant"
        po_number = getattr(application, "purchaseOrderId", None) or f"PO-{getattr(application, 'applicationId', '')}"
        filename = f"CP_Certificate_{cust_name.replace(' ', '_')}_{po_number}.docx"

        attachments = [{
            "filename": filename,
            "content": po_docx_bytes,
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }]

        return cls.send_email(
            to_emails=aggregator_email.strip(),
            subject=rendered["subject"],
            html_content=rendered["html_content"],
            text_content=rendered["text_content"],
            attachments=attachments
        )

    @classmethod
    def send_quote_regret_email(
        cls,
        aggregator_name: str,
        aggregator_email: Optional[str],
        contact_person: Optional[str],
        application: Any
    ) -> bool:
        """
        Dispatches a non-selection / regret notification email to an aggregator
        whose quote was not selected upon Final Approval / PO generation.
        """
        if not aggregator_email or not aggregator_email.strip():
            logger.warning(f"No email address found for non-selected aggregator '{aggregator_name}'. Skipping regret email.")
            return False

        rendered = render_quote_regret_email(
            aggregator_name=aggregator_name,
            contact_person=contact_person,
            application=application,
            portal_url=config.PORTAL_BASE_URL
        )

        return cls.send_email(
            to_emails=aggregator_email.strip(),
            subject=rendered["subject"],
            html_content=rendered["html_content"],
            text_content=rendered["text_content"]
        )

    @classmethod
    def send_aggregator_onboarding_email(
        cls,
        aggregator_name: str,
        contact_person: Optional[str],
        email: str,
        temp_password: str,
        portal_url: Optional[str] = None
    ) -> bool:
        """
        Dispatches account onboarding credentials email to a newly created aggregator.
        """
        if not email or not email.strip():
            logger.warning(f"No email address found for aggregator '{aggregator_name}'. Skipping onboarding email.")
            return False

        portal = portal_url or getattr(config, "AGGREGATOR_PORTAL_URL", "http://localhost:5174")
        rendered = render_aggregator_onboarding_email(
            aggregator_name=aggregator_name,
            contact_person=contact_person,
            email=email.strip(),
            temp_password=temp_password,
            portal_url=portal
        )

        return cls.send_email(
            to_emails=email.strip(),
            subject=rendered["subject"],
            html_content=rendered["html_content"],
            text_content=rendered["text_content"]
        )

    @classmethod
    def send_password_reset_confirmation_email(
        cls,
        aggregator_name: str,
        contact_person: Optional[str],
        email: str
    ) -> bool:
        """
        Dispatches security notification confirming that password was reset.
        """
        if not email or not email.strip():
            return False

        rendered = render_password_reset_confirmation_email(
            aggregator_name=aggregator_name,
            contact_person=contact_person,
            email=email.strip()
        )

        return cls.send_email(
            to_emails=email.strip(),
            subject=rendered["subject"],
            html_content=rendered["html_content"],
            text_content=rendered["text_content"]
        )

    @classmethod
    def send_quote_submitted_confirmation_email(
        cls,
        aggregator_name: str,
        contact_person: Optional[str],
        email: str,
        application: Any,
        sum_of_rate: Optional[float] = None
    ) -> bool:
        """
        Dispatches acknowledgement email to the aggregator confirming quote submission.
        """
        if not email or not email.strip():
            return False

        rendered = render_quote_submitted_confirmation_email(
            aggregator_name=aggregator_name,
            contact_person=contact_person,
            application=application,
            sum_of_rate=sum_of_rate
        )

        return cls.send_email(
            to_emails=email.strip(),
            subject=rendered["subject"],
            html_content=rendered["html_content"],
            text_content=rendered["text_content"]
        )


