"""
Central Bank of India - Payment Aggregator Portal (PAPG)
Professional Email Templates & Responsive HTML Renderers
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import os
import base64

_CBI_LOGO_BASE64: Optional[str] = None

def get_cbi_logo_base64() -> str:
    """Load and cache base64 encoding of the official Central Bank of India logo."""
    global _CBI_LOGO_BASE64
    if _CBI_LOGO_BASE64 is None:
        try:
            asset_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "centralbanklogo.png")
            if os.path.exists(asset_path):
                with open(asset_path, "rb") as f:
                    _CBI_LOGO_BASE64 = base64.b64encode(f.read()).decode("utf-8")
            else:
                _CBI_LOGO_BASE64 = ""
        except Exception as e:
            print(f"Warning: Could not load CBI logo asset: {e}")
            _CBI_LOGO_BASE64 = ""
    return _CBI_LOGO_BASE64


def format_currency_inr(value: Any) -> str:
    """Format numeric values as standard INR currency string."""
    try:
        if value is None or value == "":
            return "N/A"
        num = float(value)
        return f"₹ {num:,.2f}"
    except (ValueError, TypeError):
        return str(value) if value is not None else "N/A"


def _render_cbi_header(stage_badge: str, stage_color: str = "#004990") -> str:
    """Renders the standard bilingual Central Bank of India email header."""
    return f"""
    <!-- Top Accent Color Bar -->
    <div style="height: 5px; background: linear-gradient(90deg, #004990 0%, #176FC1 50%, #C8102E 100%);"></div>

    <!-- Official Bank Header -->
    <div style="padding: 22px 28px 18px 28px; border-bottom: 2px solid #004990; background-color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle; text-align: left;">
            <div style="font-size: 18px; font-weight: 800; color: #004990; line-height: 1.2; margin: 0;">सेन्ट्रल बैंक ऑफ़ इण्डिया</div>
            <div style="font-size: 15px; font-weight: 800; color: #004990; letter-spacing: 0.5px; text-transform: uppercase; margin: 3px 0 0 0;">Central Bank of India</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 3px;">1911 से आपके लिए 'केन्द्रित' | 'Central' To You Since 1911</div>
          </td>
          <td style="vertical-align: middle; text-align: right; width: 45%;">
            <div style="display: inline-block; background-color: #f0f7ff; color: #004990; font-size: 11.5px; font-weight: 800; padding: 5px 12px; border-radius: 6px; border: 1px solid #bae6fd; text-transform: uppercase; letter-spacing: 0.3px; text-align: right;">
              TRANSACTION BANKING &amp; PAPG
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; text-align: right;">Central Office, Mumbai</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Automated Notification Banner -->
    <div style="background-color: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 8px 28px; font-size: 11.5px; color: #1e40af; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
      <span>Automated Notification &bull; Central Bank of India PAPG System</span>
      <span style="background-color: {stage_color}; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; text-transform: uppercase;">
        {stage_badge}
      </span>
    </div>
    """


def _render_cbi_footer(portal_url: str = "http://localhost:5173") -> str:
    """Renders the standard Central Bank of India email footer."""
    return f"""
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; font-size: 11.5px; color: #64748b; text-align: center; line-height: 1.6;">
      <div style="font-weight: 700; color: #004990; margin-bottom: 4px;">
        Central Bank of India &bull; Chandermukhi, Nariman Point, Mumbai - 400021
      </div>
      <div style="color: #475569; margin: 2px 0;">
        Payment Aggregator &amp; RFQ Automation Portal ({portal_url})
      </div>
      <div style="color: #94a3b8; font-size: 10.5px; margin-top: 6px;">
        CONFIDENTIALITY NOTICE: This communication contains proprietary information intended solely for the authorized recipient.
      </div>
    </div>
    """


# ─────────────────────────────────────────────────────────────────────────────
# 1. QUOTATION REQUEST (RFP) EMAIL TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

def render_quote_request_email(
    aggregator_name: str,
    contact_person: Optional[str],
    application: Any,
    end_date_str: Optional[str] = None,
    portal_url: str = "http://localhost:5173",
    projections: Optional[Any] = None,
    custom_data: Optional[Dict[str, Any]] = None
) -> Dict[str, str]:
    """
    Renders official Quotation Request email sent to Payment Aggregators.
    """
    c_data = custom_data or {}
    recipient_name = c_data.get("recipient_name") or (contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Partnerships Team")
    app_id = c_data.get("applicationId") or getattr(application, "applicationId", "N/A")
    cust_name = getattr(application, "customerName", "N/A") or "N/A"
    category = c_data.get("category") or getattr(application, "category", "Commercial") or "Commercial"
    bus_cat = c_data.get("businessCategory") or getattr(application, "businessCategory", "") or category
    avg_ticket = c_data.get("avgTransactionSize") or format_currency_inr(getattr(application, "avgTransactionSize", None))
    avg_yearly = c_data.get("avgTransactionYearly") or str(getattr(application, "avgTransactionYearly", "N/A"))
    total_volume = format_currency_inr(getattr(application, "totalAnnualTransaction", None))

    intro_text = (
        c_data.get("introText") or 
        c_data.get("intro_text") or 
        "We request you to share your competitive commercial quotation for merchant onboarding under Central Bank of India payment gateway arrangement:"
    ).strip()

    modes_of_collection = c_data.get("modesOfCollection") or "Credit Cards / Debit Cards / Net Banking / UPI / Standard Channels"

    raw_deadline = c_data.get("submissionDeadline") or end_date_str or ""
    if "T+ 2" in raw_deadline:
        raw_deadline = raw_deadline.replace("T+ 2 Days (", "").replace("T+ 2 Days", "").replace(")", "").strip()
    if raw_deadline and "T" in raw_deadline and "-" in raw_deadline:
        try:
            dt = datetime.fromisoformat(raw_deadline.replace("Z", "+00:00"))
            raw_deadline = dt.strftime("%d/%m/%Y")
        except Exception:
            pass
    submission_deadline = raw_deadline or datetime.now().strftime("%d/%m/%Y")

    manager_name = c_data.get("managerName") or "Shraddha Saxena"
    manager_desig = c_data.get("managerDesignation") or "Manager"
    manager_dept = c_data.get("managerDept") or "Neo Banking & Emerging Technologies"
    manager_office = c_data.get("managerOffice") or "Central Office, Mumbai"
    manager_phone = c_data.get("managerPhone") or "022-49197333"

    is_revision = bool(c_data.get("isRevision") or getattr(application, "isNegotiationRequested", False))
    negotiation_remarks = (c_data.get("negotiationRemarks") or getattr(application, "negotiationRemarks", "") or "").strip()
    revision_version = c_data.get("quoteVersion") or getattr(application, "currentQuoteVersion", 2)

    if is_revision and negotiation_remarks:
        subject = f"[Revised Quotation Request - Rev #{revision_version}] Commercial Quotation: M/s {cust_name} (App #{app_id}) - Central Bank of India"
    else:
        subject = f"Commercial Quotation Request: M/s {cust_name} (App #{app_id}) - Central Bank of India"

    # Extract active non-zero projection payment modes
    raw_projs = projections or c_data.get("projections") or []
    if raw_projs:
        active_names = []
        for p in raw_projs:
            is_ib = p.get("isIB", False) if isinstance(p, dict) else getattr(p, "isIB", False)
            if is_ib:
                continue

            t_type = (p.get("transactionType", "") if isinstance(p, dict) else getattr(p, "transactionType", "")) or ""
            cnt_raw = p.get("transactionCount", "") if isinstance(p, dict) else getattr(p, "transactionCount", "")
            val_raw = p.get("transactionValue", "") if isinstance(p, dict) else getattr(p, "transactionValue", "")
            amt_raw = p.get("aggregateAmount", "") if isinstance(p, dict) else getattr(p, "aggregateAmount", "")
            est_cnt_raw = p.get("estimatedTransactions", "") if isinstance(p, dict) else getattr(p, "estimatedTransactions", "")

            def to_num(val):
                if val is None or val == "":
                    return 0.0
                try:
                    return float(str(val).replace("%", "").replace("₹", "").replace(",", "").strip())
                except (ValueError, TypeError):
                    return 0.0

            if to_num(cnt_raw) > 0 or to_num(val_raw) > 0 or to_num(amt_raw) > 0 or to_num(est_cnt_raw) > 0:
                if t_type and t_type not in active_names:
                    active_names.append(t_type)

        if active_names and (not c_data.get("modesOfCollection") or c_data.get("modesOfCollection") == "Credit Cards / Debit Cards / Net Banking / UPI / Standard Channels"):
            modes_of_collection = " / ".join(active_names)

    who_bears_charges = (c_data.get("whoBearsCharges") or "").strip()
    additional_details = (c_data.get("additionalDetails") or "").strip()
    custom_notes = (c_data.get("customNotes") or c_data.get("custom_notes") or "").strip()

    extra_rows_html = ""
    if who_bears_charges:
        extra_rows_html += f"""
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b;">Who Will Bear Charges:</td>
          <td style="padding: 9px 14px; font-weight: 600; color: #0f172a;">{who_bears_charges}</td>
        </tr>
        """
    if additional_details:
        extra_rows_html += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b;">Additional Details:</td>
          <td style="padding: 9px 14px; font-weight: 600; color: #0f172a;">{additional_details}</td>
        </tr>
        """

    custom_notes_html = f"""
    <div style="background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
      <div style="font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 6px;">
        Special Instructions / Specific Terms
      </div>
      <div style="font-size: 12.5px; color: #14532d; line-height: 1.5;">
        {custom_notes}
      </div>
    </div>
    """ if custom_notes else ""

    revision_banner = f"""
    <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-left: 5px solid #D97706; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
      <div style="font-weight: 700; color: #92400E; font-size: 13.5px;">Revised Quotation Request / Rate Negotiation (Version #{revision_version})</div>
      <div style="color: #78350F; font-size: 13px; margin-top: 6px; line-height: 1.5;">
        Customer Feedback / Negotiation Remarks: <strong>"{negotiation_remarks}"</strong>
      </div>
    </div>
    """ if (is_revision and negotiation_remarks) else ""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px 12px; }}
    .container {{ max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0, 73, 144, 0.08); }}
    .notice-bar {{ background-color: #f8fafc; padding: 12px 28px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }}
    .content-section {{ padding: 24px 28px; }}
  </style>
</head>
<body>
  <div class="container">
    {_render_cbi_header("RFQ QUOTATION REQUEST", "#004990")}

    <div class="notice-bar">
      <span style="font-size: 13px; font-weight: 800; color: #004990; text-transform: uppercase;">Quotation Request Notice</span>
      <span style="font-size: 13px; font-weight: 800; color: #C8102E; background-color: #fef2f2; padding: 3px 10px; border-radius: 4px; border: 1px solid #fecaca;">App #{app_id}</span>
    </div>

    <div class="content-section">
      <p style="font-size: 14.5px; margin-top: 0;">Dear <strong style="color: #004990;">{recipient_name}</strong>,</p>
      
      {revision_banner}

      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        {intro_text}
      </p>

      <!-- Merchant Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; font-size: 12.5px;">
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b; width: 42%;">Merchant Institution Name:</td>
          <td style="padding: 9px 14px; font-weight: 700; color: #004990; width: 58%;">{cust_name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b;">Business / Entity Category:</td>
          <td style="padding: 9px 14px; font-weight: 600; color: #0f172a;">{bus_cat} ({category})</td>
        </tr>
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b;">Average Ticket Size:</td>
          <td style="padding: 9px 14px; font-weight: 700; color: #0f172a;">{avg_ticket}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b;">Expected Annual Transactions:</td>
          <td style="padding: 9px 14px; font-weight: 600; color: #0f172a;">{avg_yearly}</td>
        </tr>
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b;">Estimated Annual Volume:</td>
          <td style="padding: 9px 14px; font-weight: 700; color: #16a34a;">{total_volume}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 9px 14px; font-weight: 600; color: #64748b;">Modes of Collection:</td>
          <td style="padding: 9px 14px; font-weight: 700; color: #004990;">{modes_of_collection}</td>
        </tr>
        {extra_rows_html}
      </table>

      {custom_notes_html}

      <!-- Deadline & Instructions Box -->
      <div style="background-color: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 8px;">
          Quotation Submission Guidelines
        </div>
        <ul style="margin: 0; padding-left: 18px; font-size: 12.5px; color: #0f172a; line-height: 1.6;">
          <li><strong>Submission Deadline:</strong> <span style="color: #C8102E; font-weight: 800;">{submission_deadline}</span></li>
          <li>System Integration Fee and AMC charges will be <strong>NIL</strong>. Kindly specify the same in your quotation.</li>
          <li>Please submit your rate proposals via the <strong>Central Bank of India Aggregator Portal</strong>.</li>
        </ul>
      </div>

      <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12.5px; color: #475569;">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #004990; font-size: 13.5px;">{manager_name}</p>
        <p style="margin: 0; font-size: 12px;">{manager_desig} | {manager_dept}</p>
        <p style="margin: 0; font-size: 12px;">Central Bank of India, {manager_office} | Tel: {manager_phone}</p>
      </div>
    </div>

    {_render_cbi_footer(portal_url)}
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
Digital Payment & Transaction Banking Department, Central Office, Mumbai
----------------------------------------------------------------------
QUOTATION REQUEST: M/s {cust_name} (Application #{app_id})

Dear {recipient_name},

{intro_text}

MERCHANT DETAILS:
- Application ID: #{app_id}
- Merchant Name: {cust_name}
- Business Category: {bus_cat} ({category})
- Average Ticket Size: {avg_ticket}
- Expected Annual Transactions: {avg_yearly}
- Estimated Annual Volume: {total_volume}
- Modes of Collection: {modes_of_collection}
- Submission Deadline: {submission_deadline}

Please log in to the Central Bank of India Aggregator Portal to submit your commercial rate quotation.

Thanks & Regards,
{manager_name} ({manager_desig})
{manager_dept}, Central Bank of India
Central Office, Mumbai | Tel: {manager_phone}
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. QUOTATION ACCEPTED (SUCCESS) EMAIL TEMPLATE (FOR SELECTED AGGREGATOR)
# ─────────────────────────────────────────────────────────────────────────────

def render_po_issuance_email(
    aggregator_name: str,
    contact_person: Optional[str],
    application: Any,
    po_data: Dict[str, Any] = None,
    portal_url: str = "http://localhost:5173"
) -> Dict[str, str]:
    """
    Renders clean Quotation Accepted email displaying only Application ID and Quote Outcome Status.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Team"
    app_id = getattr(application, "applicationId", "N/A")

    subject = f"Quotation Accepted - Application #{app_id} - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b; }}
    .container {{ max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0, 73, 144, 0.08); }}
    .notice-bar {{ background-color: #f0fdf4; padding: 12px 28px; border-bottom: 1px solid #bbf7d0; display: flex; justify-content: space-between; align-items: center; }}
    .content-section {{ padding: 28px 28px; }}
    .card-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 18px 0; }}
  </style>
</head>
<body>
  <div class="container">
    {_render_cbi_header("QUOTATION ACCEPTED", "#16a34a")}

    <div class="notice-bar">
      <span style="font-size: 13.5px; font-weight: 800; color: #15803d; text-transform: uppercase;">Quotation Accepted</span>
      <span style="font-size: 13px; font-weight: 800; color: #15803d; background-color: #dcfce7; padding: 3px 10px; border-radius: 4px; border: 1px solid #86efac;">App #{app_id}</span>
    </div>

    <div class="content-section">
      <p style="font-size: 14.5px; margin-top: 0;">Dear <strong style="color: #004990;">{recipient_name}</strong> ({aggregator_name}),</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #1e293b;">
        We are pleased to inform you that your commercial quotation for <strong>Application #{app_id}</strong> has been <strong>ACCEPTED</strong> by Central Bank of India.
      </p>

      <div class="card-box">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 45%;">Application ID:</td>
            <td style="font-weight: 700; color: #004990; width: 55%;">#{app_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Quote Outcome Status:</td>
            <td style="font-weight: 800; color: #16a34a;">Accepted</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #14532d; border-radius: 0 6px 6px 0;">
        Kindly proceed with the onboarding and payment gateway integration setup.
      </div>

      <div style="margin-top: 26px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12.5px; color: #475569;">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #004990; font-size: 13.5px;">Digital Payment &amp; Transaction Banking Department</p>
        <p style="margin: 0; font-size: 12px;">Central Bank of India, Central Office, Mumbai</p>
      </div>
    </div>

    {_render_cbi_footer(portal_url)}
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
Digital Payment & Transaction Banking Department, Central Office, Mumbai
----------------------------------------------------------------------
QUOTATION ACCEPTED: APPLICATION #{app_id}

Dear {recipient_name} ({aggregator_name}),

We are pleased to inform you that your commercial quotation for Application #{app_id} has been ACCEPTED by Central Bank of India.

DETAILS:
- Application ID: #{app_id}
- Quote Outcome Status: Accepted

Kindly proceed with the onboarding and payment gateway integration setup.

Thanks & Regards,
Digital Payment & Transaction Banking Department
Central Bank of India, Central Office, Mumbai
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. QUOTATION REJECTED EMAIL TEMPLATE (FOR OTHER AGGREGATORS)
# ─────────────────────────────────────────────────────────────────────────────

def render_quote_regret_email(
    aggregator_name: str,
    contact_person: Optional[str],
    application: Any,
    portal_url: str = "http://localhost:5173"
) -> Dict[str, str]:
    """
    Renders clean Quotation Rejected email displaying only Application ID and Quote Outcome Status.
    """
    app_id = getattr(application, "applicationId", "N/A")
    recipient_name = (contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Team")

    subject = f"Quotation Rejected - Application #{app_id} - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b; }}
    .container {{ max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0, 73, 144, 0.08); }}
    .notice-bar {{ background-color: #fef2f2; padding: 12px 28px; border-bottom: 1px solid #fecaca; display: flex; justify-content: space-between; align-items: center; }}
    .content-section {{ padding: 28px 28px; }}
    .card-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 18px 0; }}
  </style>
</head>
<body>
  <div class="container">
    {_render_cbi_header("QUOTATION REJECTED", "#DC2626")}

    <div class="notice-bar">
      <span style="font-size: 13.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase;">Quotation Rejected</span>
      <span style="font-size: 13px; font-weight: 800; color: #b91c1c; background-color: #fee2e2; padding: 3px 10px; border-radius: 4px; border: 1px solid #fca5a5;">App #{app_id}</span>
    </div>

    <div class="content-section">
      <p style="font-size: 14.5px; margin-top: 0;">Dear <strong style="color: #004990;">{recipient_name}</strong> ({aggregator_name}),</p>
      
      <p style="font-size: 14px; line-height: 1.6; color: #1e293b;">
        Thank you for submitting your quotation for <strong>Application #{app_id}</strong>.
      </p>

      <div class="card-box">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 45%;">Application ID:</td>
            <td style="font-weight: 700; color: #004990; width: 55%;">#{app_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Quote Outcome Status:</td>
            <td style="font-weight: 800; color: #dc2626;">Rejected</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #991b1b; border-radius: 0 6px 6px 0; line-height: 1.5;">
        We regret to inform you that your quotation was not selected for this application as another aggregator has been finalized.
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        We appreciate your participation and look forward to working with you on future opportunities.
      </p>

      <div style="margin-top: 26px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12.5px; color: #475569;">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #004990; font-size: 13.5px;">Digital Payment &amp; Transaction Banking Department</p>
        <p style="margin: 0; font-size: 12px;">Central Bank of India, Central Office, Mumbai</p>
      </div>
    </div>

    {_render_cbi_footer(portal_url)}
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
Digital Payment & Transaction Banking Department, Central Office, Mumbai
----------------------------------------------------------------------
QUOTATION REJECTED: APPLICATION #{app_id}

Dear {recipient_name} ({aggregator_name}),

Thank you for submitting your quotation for Application #{app_id}.

DETAILS:
- Application ID: #{app_id}
- Quote Outcome Status: Rejected

We regret to inform you that your quotation was not selected for this application as another aggregator has been finalized.

We appreciate your participation and look forward to collaborating on future opportunities.

Thanks & Regards,
Digital Payment & Transaction Banking Department
Central Bank of India, Central Office, Mumbai
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. AGGREGATOR ONBOARDING & PORTAL CREDENTIALS TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

def render_aggregator_onboarding_email(
    aggregator_name: str,
    contact_person: Optional[str],
    email: str,
    temp_password: str,
    portal_url: str = "http://localhost:5174",
    manager_name: str = "Shraddha Saxena",
    manager_desig: str = "Manager",
    manager_dept: str = "Neo Banking & Emerging Technologies",
    manager_office: str = "Central Office, Mumbai"
) -> Dict[str, str]:
    """
    Renders Onboarding Credentials Email for newly registered Payment Aggregators.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Partner"
    subject = f"Welcome to Central Bank of India RFQ Portal - Account Login Credentials ({aggregator_name})"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b; }}
    .container {{ max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0, 73, 144, 0.08); }}
    .notice-bar {{ background-color: #f8fafc; padding: 12px 28px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }}
    .content-section {{ padding: 24px 28px; }}
    .cred-box {{ background-color: #f0f9ff; border: 1.5px solid #0284c7; border-radius: 8px; padding: 18px 22px; margin: 20px 0; }}
    .btn-login {{ display: inline-block; background: linear-gradient(135deg, #004990 0%, #176FC1 100%); color: #ffffff !important; font-weight: 700; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin: 16px 0; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    {_render_cbi_header("PARTNER ONBOARDING", "#0284c7")}

    <div class="notice-bar">
      <span style="font-size: 13px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Portal Account Credentials</span>
      <span style="font-size: 12px; font-weight: 700; color: #004990;">Authorized Aggregator</span>
    </div>

    <div class="content-section">
      <p style="font-size: 14.5px; margin-top: 0;">Dear <strong style="color: #004990;">{recipient_name}</strong> ({aggregator_name}),</p>
      
      <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
        Welcome to the <strong>Central Bank of India Request for Quote (RFQ) &amp; Commercial Proposal Portal</strong>. Your organization has been successfully onboarded as an authorized Payment Aggregator partner.
      </p>

      <div class="cred-box">
        <div style="font-weight: 800; color: #004990; font-size: 13.5px; margin-bottom: 12px; text-transform: uppercase;">
          Your Secure Portal Login Credentials
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #0369a1; width: 35%;">User ID (Email):</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; width: 65%; font-family: monospace; font-size: 14px;">{email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #0369a1;">Temporary Password:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-family: monospace; font-size: 14px; background-color: #ffffff; display: inline-block; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">{temp_password}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 700; color: #0369a1;">Portal Web Link:</td>
            <td style="padding: 6px 0;"><a href="{portal_url}" style="color: #004990; font-weight: 700;">{portal_url}</a></td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #C8102E; padding: 12px 16px; margin: 18px 0; font-size: 12.5px; color: #991b1b; border-radius: 0 6px 6px 0; line-height: 1.5;">
        <strong>Mandatory Security Action:</strong><br/>
        This temporary password is provided for initial account setup. Upon first login, you will be prompted to create your own permanent password.
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="{portal_url}/login" class="btn-login">Login to Aggregator Portal &rarr;</a>
      </div>

      <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12.5px; color: #475569;">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #004990; font-size: 13.5px;">{manager_name}</p>
        <p style="margin: 0; font-size: 12px;">{manager_desig} | {manager_dept}</p>
        <p style="margin: 0; font-size: 12px;">Central Bank of India, {manager_office}</p>
      </div>
    </div>

    {_render_cbi_footer(portal_url)}
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
Partner Onboarding & Credentials Notice
----------------------------------------------------------------------
Dear {recipient_name} ({aggregator_name}),

Welcome to Central Bank of India RFQ Portal. Your account has been initialized.

LOGIN CREDENTIALS:
- User ID / Email: {email}
- Temporary Password: {temp_password}
- Portal URL: {portal_url}/login

NOTE: You will be required to set a permanent password upon first login.

Thanks & Regards,
{manager_name} ({manager_desig})
{manager_dept}, Central Bank of India, {manager_office}
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. PASSWORD RESET NOTIFICATION TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

def render_password_reset_confirmation_email(
    aggregator_name: str,
    contact_person: Optional[str],
    email: str,
    manager_name: str = "Shraddha Saxena",
    manager_dept: str = "Neo Banking & Emerging Technologies"
) -> Dict[str, str]:
    """
    Renders password change confirmation security email.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Partner"
    subject = f"Security Alert: Password Updated Successfully - Central Bank of India Portal"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b; }}
    .container {{ max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0, 73, 144, 0.08); }}
    .content-section {{ padding: 24px 28px; }}
  </style>
</head>
<body>
  <div class="container">
    {_render_cbi_header("SECURITY NOTIFICATION", "#16a34a")}

    <div class="content-section">
      <div style="font-size: 15px; font-weight: 800; color: #16a34a; margin-bottom: 12px;">
        Account Password Changed Successfully
      </div>
      <p style="font-size: 14px; margin-top: 0;">Dear <strong style="color: #004990;">{recipient_name}</strong>,</p>
      
      <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
        This email confirms that the password for your Central Bank of India Aggregator Portal account (<strong>{email}</strong>) was successfully updated on <strong>{datetime.now().strftime('%d/%m/%Y at %I:%M %p')}</strong>.
      </p>
      
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        If you performed this action, no further steps are needed. If you did not authorize this change, please contact the Central Bank of India IT security desk immediately.
      </p>
      
      <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12.5px; color: #475569;">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #004990; font-size: 13.5px;">{manager_name}</p>
        <p style="margin: 0; font-size: 12px;">{manager_dept} | Central Bank of India, Central Office, Mumbai</p>
      </div>
    </div>

    {_render_cbi_footer()}
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - SECURITY NOTIFICATION
----------------------------------------------------------------------
Dear {recipient_name},

The password for your account ({email}) was successfully updated on {datetime.now().strftime('%d/%m/%Y at %I:%M %p')}.

If you did not perform this change, please contact Central Bank of India security desk immediately.

Thanks & Regards,
{manager_name} | {manager_dept}
Central Bank of India
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. QUOTATION SUBMISSION CONFIRMATION TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

def render_quote_submitted_confirmation_email(
    aggregator_name: str,
    contact_person: Optional[str],
    application: Any,
    sum_of_rate: Optional[float] = None
) -> Dict[str, str]:
    """
    Renders confirmation email when an aggregator submits a quote proposal.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Team"
    app_id = getattr(application, "applicationId", "N/A")
    cust_name = getattr(application, "customerName", "Merchant") or "Merchant"
    subject = f"Quotation Received Acknowledgement: Application #{app_id} ({cust_name}) - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b; }}
    .container {{ max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 18px rgba(0, 73, 144, 0.08); }}
    .content-section {{ padding: 24px 28px; }}
  </style>
</head>
<body>
  <div class="container">
    {_render_cbi_header("SUBMISSION ACKNOWLEDGEMENT", "#004990")}

    <div class="content-section">
      <div style="font-size: 15px; font-weight: 800; color: #004990; margin-bottom: 12px;">
        Commercial Quotation Received Successfully
      </div>
      <p style="font-size: 14px; margin-top: 0;">Dear <strong style="color: #004990;">{recipient_name}</strong>,</p>
      
      <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
        We have successfully received your commercial quote proposal for <strong>Merchant Application #{app_id} ({cust_name})</strong>.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 13px;">
        <div style="margin-bottom: 6px;"><strong>Application Reference ID:</strong> #{app_id}</div>
        <div style="margin-bottom: 6px;"><strong>Merchant Name:</strong> {cust_name}</div>
        <div style="margin-bottom: 6px;"><strong>Submission Timestamp:</strong> {datetime.now().strftime('%d/%m/%Y %I:%M %p')}</div>
        <div><strong>Current Stage:</strong> Under Review (Central Office)</div>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        Our commercial evaluation committee will review the submissions and communicate further status updates via the portal.
      </p>

      <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12.5px; color: #475569;">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #004990; font-size: 13.5px;">Digital Payment &amp; Transaction Banking Department</p>
        <p style="margin: 0; font-size: 12px;">Central Bank of India, Central Office, Mumbai</p>
      </div>
    </div>

    {_render_cbi_footer()}
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
----------------------------------------------------------------------
QUOTATION SUBMISSION RECEIVED: APPLICATION #{app_id} ({cust_name})

Dear {recipient_name},

Your quotation for Merchant Application #{app_id} ({cust_name}) was successfully received on {datetime.now().strftime('%d/%m/%Y %I:%M %p')}.

Status: Under Review (Central Office)

Thanks & Regards,
Digital Payment & Transaction Banking Department
Central Bank of India, Central Office, Mumbai
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }
