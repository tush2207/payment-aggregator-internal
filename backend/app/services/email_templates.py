"""
Central Bank of India - Payment Aggregator Portal
Email Templates & HTML Renderers
"""

from typing import Dict, Any, Optional
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
    """Format numeric values as INR currency string."""
    try:
        if value is None or value == "":
            return "N/A"
        num = float(value)
        # Format standard Indian currency format if positive
        return f"₹ {num:,.2f}"
    except (ValueError, TypeError):
        return str(value) if value is not None else "N/A"


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
    Renders responsive HTML & Plain text email for the Quotation Request stage
    issued by Central Bank of India - Neo Banking & Emerging Technologies Department.
    """
    c_data = custom_data or {}

    recipient_name = c_data.get("recipient_name") or (contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Team")
    app_id = c_data.get("applicationId") or getattr(application, "applicationId", "N/A")
    cust_name = getattr(application, "customerName", "N/A") or "N/A"
    category = c_data.get("category") or getattr(application, "category", "standard") or "standard"
    bus_cat = c_data.get("businessCategory") or getattr(application, "businessCategory", "") or category or "standard"
    avg_ticket = c_data.get("avgTransactionSize") or format_currency_inr(getattr(application, "avgTransactionSize", None))
    avg_yearly = c_data.get("avgTransactionYearly") or str(getattr(application, "avgTransactionYearly", "standard"))
    
    # Intro message
    intro_text = (
        c_data.get("introText") or 
        c_data.get("intro_text") or 
        "We request you to share the quotation for merchant onboarding whose details are mentioned below:"
    ).strip()

    modes_of_collection = c_data.get("modesOfCollection") or "Credit cards / Debit cards / Netbanking / UPI / Any Other mode (optional case to case basis)"
    
    # Conditional rows
    who_bears_charges = (c_data.get("whoBearsCharges") or "").strip()
    if who_bears_charges and who_bears_charges != "optional-case to case basis":
        who_bears_charges_row_html = f"""
          <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #1e293b; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; width: 44%;">Who Will Bear Charges</td>
            <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; width: 56%;">{who_bears_charges}</td>
          </tr>"""
        who_bears_charges_row_text = f"Who will bear charges: {who_bears_charges}\n"
    else:
        who_bears_charges_row_html = ""
        who_bears_charges_row_text = ""

    additional_details = (c_data.get("additionalDetails") or "").strip()
    if additional_details and additional_details != "optional-case to case basis":
        additional_details_row_html = f"""
          <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #1e293b; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; width: 44%;">Additional Details If Any</td>
            <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; width: 56%;">{additional_details}</td>
          </tr>"""
        additional_details_row_text = f"Additional Details if Any: {additional_details}\n"
    else:
        additional_details_row_html = ""
        additional_details_row_text = ""
    
    # Deadline formatting
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

    submission_email = c_data.get("submissionEmail") or "smit1dptb@centralbank.bank.in"
    manager_name = c_data.get("managerName") or "Shraddha Saxena"
    manager_desig = c_data.get("managerDesignation") or "Manager"
    manager_dept = c_data.get("managerDept") or "Neo Banking & Emerging Technologies"
    manager_office = c_data.get("managerOffice") or "Central Office, Mumbai"
    manager_phone = c_data.get("managerPhone") or "022-49197333"

    custom_notes = c_data.get("customNotes") or c_data.get("custom_notes") or ""
    custom_notes_html = ""
    custom_notes_text = ""
    if custom_notes and custom_notes.strip():
        notes_lines = [ln.strip() for ln in custom_notes.strip().split("\n") if ln.strip()]
        custom_notes_html = "".join([f"<li style='margin-bottom: 6px; color: #0E4F8D; font-weight: 600;'>{l}</li>" for l in notes_lines])
        custom_notes_text = "\n".join([f"* {l}" for l in notes_lines]) + "\n"

    is_revision = bool(c_data.get("isRevision") or getattr(application, "isNegotiationRequested", False))
    negotiation_remarks = (c_data.get("negotiationRemarks") or getattr(application, "negotiationRemarks", "") or "").strip()
    revision_version = c_data.get("quoteVersion") or getattr(application, "currentQuoteVersion", 2)

    negotiation_alert_html = f"""
      <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-left: 5px solid #D97706; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
        <div style="font-weight: 700; color: #92400E; font-size: 13.5px;">Revised Quotation Request / Rate Negotiation</div>
        <div style="color: #78350F; font-size: 13px; margin-top: 6px; line-height: 1.5;">
          The merchant has reviewed the initial proposal and requested negotiated rates. Please consider the feedback below and submit your revised quotation:
          <br><strong style="color: #92400E; display: inline-block; margin-top: 4px;">"{negotiation_remarks}"</strong>
        </div>
      </div>
    """ if (is_revision and negotiation_remarks) else ""

    if is_revision and negotiation_remarks:
        subject = c_data.get("subject") or f"[Revised Quotation Request - Rev #{revision_version}] Commercial Quotation for Merchant Onboarding (App #{app_id}) - Central Bank of India"
    else:
        subject = c_data.get("subject") or f"Quotation Request for Merchant Onboarding Application (Application ID-{app_id}) - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      line-height: 1.6;
      margin: 0;
      padding: 20px 10px;
    }}
    .email-container {{
      max-width: 680px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 16px rgba(0, 73, 144, 0.07);
    }}
    .top-accent-bar {{
      height: 4px;
      background: linear-gradient(90deg, #004990 0%, #176FC1 50%, #C8102E 100%);
    }}
    .header-table {{
      width: 100%;
      border-collapse: collapse;
      padding: 22px 28px 18px 28px;
      border-bottom: 2px solid #004990;
      background-color: #ffffff;
    }}
    .bank-title-hindi {{
      font-size: 18px;
      font-weight: 800;
      color: #004990;
      line-height: 1.2;
      margin: 0;
    }}
    .bank-title-eng {{
      font-size: 15px;
      font-weight: 800;
      color: #004990;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 3px 0 0 0;
    }}
    .bank-tagline {{
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      margin-top: 3px;
    }}
    .dept-badge {{
      display: inline-block;
      background-color: #f0f7ff;
      color: #004990;
      font-size: 11.5px;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 6px;
      border: 1px solid #bae6fd;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      text-align: right;
    }}
    .dept-sub {{
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      text-align: right;
    }}
    .automated-banner {{
      background-color: #eff6ff;
      border-bottom: 1px solid #dbeafe;
      padding: 8px 28px;
      font-size: 11.5px;
      color: #1e40af;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .notice-bar {{
      background-color: #f8fafc;
      padding: 12px 28px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .notice-title {{
      font-size: 13.5px;
      font-weight: 800;
      color: #004990;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .notice-app-id {{
      font-size: 13px;
      font-weight: 800;
      color: #C8102E;
      background-color: #fef2f2;
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid #fecaca;
    }}
    .content-section {{
      padding: 24px 28px;
    }}
    .salutation {{
      font-size: 14.5px;
      margin: 0 0 16px 0;
      color: #1e293b;
    }}
    .intro-card {{
      font-size: 13.5px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 20px;
      padding: 12px 16px;
      background-color: #f8fafc;
      border-left: 4px solid #004990;
      border-radius: 0 6px 6px 0;
    }}
    .details-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }}
    .details-table th {{
      background: linear-gradient(135deg, #004990 0%, #176FC1 100%);
      color: #ffffff;
      padding: 10px 14px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }}
    .details-table td {{
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }}
    .key-col {{
      font-weight: 600;
      color: #1e293b;
      background-color: #f8fafc;
      width: 44%;
    }}
    .val-col {{
      color: #0f172a;
      width: 56%;
    }}
    .val-highlight {{
      font-weight: 700;
      color: #C8102E;
    }}
    .val-amount {{
      font-weight: 700;
      color: #004990;
    }}
    .deadline-card {{
      background-color: #fef2f2;
      border: 1.5px solid #fecaca;
      border-left: 5px solid #C8102E;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 22px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .deadline-label {{
      font-size: 11.5px;
      font-weight: 800;
      color: #991b1b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .deadline-desc {{
      font-size: 13px;
      color: #374151;
      margin-top: 3px;
    }}
    .deadline-badge {{
      font-size: 15px;
      font-weight: 800;
      color: #C8102E;
      background-color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid #fca5a5;
    }}
    .instructions-card {{
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 22px 0;
    }}
    .instructions-title {{
      font-size: 12.5px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }}
    .instructions-list {{
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      color: #0f172a;
      line-height: 1.6;
    }}
    .signoff-section {{
      margin-top: 26px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      font-size: 13.5px;
      line-height: 1.5;
      color: #334155;
    }}
    .signoff-name {{
      margin: 4px 0 0 0;
      font-weight: 800;
      color: #004990;
      font-size: 14.5px;
    }}
    .signoff-meta {{
      margin: 0;
      color: #475569;
      font-size: 12.5px;
    }}
    .signoff-phone {{
      margin: 4px 0 0 0;
      color: #004990;
      font-weight: 600;
      font-size: 13px;
    }}
    .footer-section {{
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 18px 28px;
      font-size: 11.5px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }}
    .footer-automated-note {{
      font-weight: 700;
      color: #004990;
      margin-bottom: 4px;
    }}
    .footer-sub {{
      color: #475569;
      margin: 2px 0;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="top-accent-bar"></div>

    <!-- Official CBI Corporate Header (Logo-free clean typography) -->
    <div style="padding: 22px 28px 18px 28px; border-bottom: 2px solid #004990; background-color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle; text-align: left;">
            <div class="bank-title-hindi">सेन्ट्रल बैंक ऑफ़ इण्डिया</div>
            <div class="bank-title-eng">Central Bank of India</div>
            <div class="bank-tagline">1911 से आपके लिए 'केन्द्रित' | 'Central' To You Since 1911</div>
          </td>
          <td style="vertical-align: middle; text-align: right; width: 45%;">
            <div class="dept-badge">NEO BANKING &amp; EMERGING TECHNOLOGIES</div>
            <div class="dept-sub">Central Office, Mumbai</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Automated System Notification Banner -->
    <div class="automated-banner">
      <span>Automated RFQ Notification &bull; Central Bank of India PAPG System</span>
      <span style="color: #64748b; font-size: 10.5px;">Auto-Generated</span>
    </div>

    <!-- Notice / Reference Bar -->
    <div class="notice-bar">
      <div class="notice-title">Commercial Quotation Request</div>
      <div class="notice-app-id">Application #{app_id}</div>
    </div>

    <div class="content-section">
      <!-- Salutation -->
      <p class="salutation">Dear <strong style="color: #004990;">{recipient_name}</strong>,</p>

      <!-- Dynamic Editable Intro Message -->
      <div class="intro-card">
        {intro_text}
      </div>

      {negotiation_alert_html}

      <!-- Merchant Specification Table -->
      <table class="details-table">
        <thead>
          <tr>
            <th>Parameter / Field</th>
            <th>Details / Requirement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="key-col">Application ID</td>
            <td class="val-col val-highlight">#{app_id}</td>
          </tr>
          <tr>
            <td class="key-col">Mode of Collection of Fee/Payment</td>
            <td class="val-col">{modes_of_collection}</td>
          </tr>
          <tr>
            <td class="key-col">Type of Business / Entity Category</td>
            <td class="val-col" style="font-weight: 600;">{bus_cat}</td>
          </tr>
          <tr>
            <td class="key-col">Category (Private / Govt)</td>
            <td class="val-col">{category}</td>
          </tr>
          <tr>
            <td class="key-col">Average Ticket Size</td>
            <td class="val-col val-amount">{avg_ticket}</td>
          </tr>
          <tr>
            <td class="key-col">Expected Annual Online Transactions</td>
            <td class="val-col" style="font-weight: 600;">{avg_yearly}</td>
          </tr>{who_bears_charges_row_html}{additional_details_row_html}
        </tbody>
      </table>

      <!-- Submission Deadline Card -->
      <div class="deadline-card">
        <div>
          <div class="deadline-label">&#9200; Quotation Submission Deadline</div>
          <div class="deadline-desc">Kindly submit your competitive quotes on or before:</div>
        </div>
        <div class="deadline-badge">
          {submission_deadline}
        </div>
      </div>

      <!-- Instructions for Submission -->
      <div class="instructions-card">
        <div class="instructions-title">Instructions for Submission:</div>
        <ul class="instructions-list">
          <li style="margin-bottom: 6px;"><strong>System Integration Fee &amp; AMC Charges</strong> must be <strong>NIL</strong>. Kindly confirm the same in your quotation.</li>
          {custom_notes_html}
          <li>Aggregator is requested to submit quotes via email to: <a href="mailto:{submission_email}" style="color: #004990; font-weight: 700; text-decoration: underline;">{submission_email}</a></li>
        </ul>
      </div>

      <!-- Signoff Section -->
      <div class="signoff-section">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p class="signoff-name">{manager_name}</p>
        <p class="signoff-meta">{manager_desig}</p>
        <p class="signoff-meta">{manager_dept}</p>
        <p class="signoff-meta">{manager_office}</p>
        <p class="signoff-phone">Tel: {manager_phone}</p>
      </div>
    </div>

    <!-- Official Clean Footer -->
    <div class="footer-section">
      <div class="footer-automated-note">This is an automated notification generated by Central Bank of India Payment Aggregator &amp; RFQ System.</div>
      <div class="footer-sub">Please do not reply directly to this automated sender address. All quotes and queries should be directed to: <a href="mailto:{submission_email}" style="color: #004990; font-weight: 700;">{submission_email}</a></div>
      <div class="footer-sub" style="margin-top: 6px; font-size: 11px; color: #94a3b8;">Neo Banking &amp; Emerging Technologies Department &bull; Central Office, Mumbai &bull; &copy; 2026 Central Bank of India. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
"""

    text_content = f"""Central Bank of India - Quotation Request
Neo Banking & Emerging Technologies Department, Central Office, Mumbai
=====================================================================================================
[AUTOMATED RFQ NOTIFICATION]

Dear {recipient_name},

{intro_text}

-----------------------------------------------------------------------------------------------------
Application ID: #{app_id}
Mode of collection of fee/payment: {modes_of_collection}
Type of Business / Entity Category (In Brief): {bus_cat}
Category (Private / Govt): {category}
Average Ticket Size: {avg_ticket}
Expected Number of online transactions per annum: {avg_yearly}
{who_bears_charges_row_text}{additional_details_row_text}-----------------------------------------------------------------------------------------------------

Quotation Submission Deadline: {submission_deadline}

Instructions for Submission:
* System Integration Fee and AMC charges will be NIL. Kindly mention the same in your quotation.
{custom_notes_text}* Kindly submit your quotes via email to: {submission_email}

Thanks & Regards,
{manager_name}
{manager_desig}
{manager_dept}
{manager_office}
Tel: {manager_phone}

-----------------------------------------------------------------------------------------------------
This is an automated notification. Please do not reply directly to this address.
Neo Banking & Emerging Technologies Department | Central Office, Mumbai
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content
    }


def render_po_issuance_email(
    aggregator_name: str,
    contact_person: Optional[str],
    application: Any,
    po_data: Dict[str, Any],
    portal_url: str = "http://localhost:5173"
) -> Dict[str, str]:
    """
    Renders email subject, HTML and plain text for the Purchase Order Issuance stage
    upon final approval by Central Office. The generated PO .docx is attached to this email.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Onboarding & Merchant Operations Team"
    app_id = getattr(application, "applicationId", "N/A")
    cust_name = getattr(application, "customerName", "N/A") or "N/A"
    po_number = getattr(application, "purchaseOrderId", None) or f"PO-{app_id}"
    business_cat = getattr(application, "businessCategory", "Private") or "Private"
    account_no = getattr(application, "accountNo", "N/A") or "N/A"
    branch_name = getattr(application, "branchName", "Respective Branch") or "Respective Branch"
    region_name = getattr(application, "regionName", "Regional Office") or "Regional Office"
    total_volume = format_currency_inr(getattr(application, "totalAnnualTransaction", 0))

    subject = f"[PO Issued] Official Purchase Order: M/s {cust_name} (App #{app_id} / {po_number}) - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }}
    .header {{ background: linear-gradient(135deg, #176FC1 0%, #0E4F8D 60%, #941A2E 100%); color: #ffffff; padding: 24px 32px; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; }}
    .header p {{ margin: 4px 0 0; font-size: 12px; opacity: 0.85; }}
    .badge {{ display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; margin-top: 10px; text-transform: uppercase; }}
    .body {{ padding: 28px 32px; }}
    .card-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 18px 0; }}
    .card-title {{ font-size: 13px; font-weight: 800; color: #0E4F8D; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; }}
    .detail-row {{ display: flex; justify-content: space-between; padding: 5px 0; font-size: 12.5px; border-bottom: 1px dashed #e2e8f0; }}
    .detail-row:last-child {{ border-bottom: none; }}
    .detail-label {{ color: #64748b; font-weight: 600; }}
    .detail-value {{ font-weight: 700; color: #0f172a; text-align: right; }}
    .attachment-box {{ background-color: #ecfdf5; border: 1.5px dashed #10b981; border-radius: 8px; padding: 14px 18px; margin: 18px 0; display: flex; align-items: center; }}
    .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; font-size: 11px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>सेन्ट्रल बैंक ऑफ़ इंडिया / CENTRAL BANK OF INDIA</h1>
      <p>Digital Payment & Transaction Banking Department, Central Office, Mumbai</p>
      <span class="badge">Purchase Order Issued</span>
    </div>
    <div class="body">
      <p style="font-size: 14px; margin-top: 0;">Dear <strong>{recipient_name}</strong>,</p>
      <p style="font-size: 13px; line-height: 1.6;">
        We are pleased to inform you that the Competent Authority at Central Bank of India has accorded <strong>Final Approval</strong>
        for onboarding <strong>M/s {cust_name}</strong> with your payment aggregator gateway platform.
      </p>
      <p style="font-size: 13px; line-height: 1.6;">
        The formal Purchase Order document has been finalized and is <strong>attached to this email as an editable document (.docx)</strong>.
      </p>

      <div class="card-box">
        <div class="card-title">Purchase Order & Merchant Summary</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <tr><td style="padding: 5px 0; color: #64748b; font-weight: 600;">PO Number:</td><td style="font-weight: 700; color: #0E4F8D;">{po_number}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b; font-weight: 600;">Application ID:</td><td style="font-weight: 700;">#{app_id}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b; font-weight: 600;">Merchant Name:</td><td style="font-weight: 700;">{cust_name}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b; font-weight: 600;">Business Category:</td><td style="font-weight: 700;">{business_cat}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b; font-weight: 600;">Settlement A/c No:</td><td style="font-weight: 700;">{account_no}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b; font-weight: 600;">Branch / Region:</td><td style="font-weight: 700;">{branch_name} / {region_name}</td></tr>
          <tr><td style="padding: 5px 0; color: #64748b; font-weight: 600;">Expected Annual Volume:</td><td style="font-weight: 700; color: #16a34a;">{total_volume}</td></tr>
        </table>
      </div>

      <div class="attachment-box">
        <div>
          <strong style="color: #065f46; font-size: 13px;"> Attached Document:</strong><br/>
          <span style="font-size: 12px; color: #047857;">{f"CP_Certificate_{cust_name}_{po_number}.docx"} &bull; Formal Purchase Order Document</span>
        </div>
      </div>

      <p style="font-size: 12.5px; line-height: 1.5; color: #475569;">
        <strong>Next Steps:</strong><br/>
        1. Please verify the commercial schedules and MID/TID setup parameters outlined in the attached PO.<br/>
        2. Initiate the merchant onboarding, KYC validation, and sandbox/production credential dispatch to the merchant.<br/>
        3. Notify the Bank's integration team upon completion of live gateway setup.
      </p>

      <p style="font-size: 12.5px; margin-bottom: 0;">
        Warm regards,<br/>
        <strong>Digital Payment & Transaction Banking Department</strong><br/>
        Central Bank of India, Central Office, Mumbai
      </p>
    </div>
    <div class="footer">
      <div><b>Central Bank of India</b> &bull; Chandermukhi, Nariman Point, Mumbai - 400021</div>
      <div style="margin-top: 4px;">CONFIDENTIAL NOTICE: This email and attached documents are intended solely for {aggregator_name}.</div>
    </div>
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
Digital Payment & Transaction Banking Department, Central Office, Mumbai
------------------------------------------------------------
PURCHASE ORDER ISSUED: APPLICATION #{app_id} ({po_number})
Merchant: {cust_name}
Selected Aggregator: {aggregator_name}

Dear {recipient_name},

We are pleased to inform you that Central Bank of India has accorded Final Approval for onboarding M/s {cust_name} with your payment aggregator gateway platform.

PO SUMMARY:
- PO Number: {po_number}
- Application ID: #{app_id}
- Merchant: {cust_name}
- Business Category: {business_cat}
- Settlement A/c: {account_no}
- Branch: {branch_name}
- Region: {region_name}
- Expected Volume: {total_volume}

The official Purchase Order (.docx) is attached to this email. Please proceed with merchant onboarding and MID/TID integration.

Central Bank of India | Digital Payment & Transaction Banking Department
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


def render_quote_regret_email(
    aggregator_name: str,
    contact_person: Optional[str],
    application: Any,
    portal_url: str = "http://localhost:5173"
) -> Dict[str, str]:
    """
    Renders official notification email for non-selected aggregators when final
    selection and PO generation occurs for an application.
    """
    app_id = getattr(application, "applicationId", "N/A")
    cust_name = getattr(application, "customerName", "Merchant") or "Merchant"
    category = getattr(application, "category", "Commercial Merchant") or "Commercial Merchant"
    recipient_name = (contact_person.strip() if contact_person and contact_person.strip() else f"Team {aggregator_name}")
    subject = f"Quotation Outcome Update: Application #{app_id} ({cust_name}) - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{subject}</title>
  <style>
    body {{
      font-family: Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      margin: 0;
      padding: 24px;
      background-color: #f8fafc;
    }}
    .container {{
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }}
    .header {{
      background: linear-gradient(135deg, #176FC1 0%, #135FA6 45%, #9B0A2E 85%, #CE0F3E 100%);
      color: #ffffff;
      padding: 24px 30px;
      text-align: left;
    }}
    .header h2 {{
      margin: 0 0 6px 0;
      font-size: 19px;
      letter-spacing: 0.3px;
    }}
    .header p {{
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }}
    .content {{
      padding: 30px;
    }}
    .greeting {{
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #0f172a;
    }}
    .notice-box {{
      background: #f1f5f9;
      border-left: 4px solid #64748b;
      padding: 16px 20px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13.5px;
      color: #334155;
    }}
    .details-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13.5px;
    }}
    .details-table td {{
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
    }}
    .details-table .key {{
      color: #64748b;
      font-weight: 600;
      width: 38%;
      background: #f8fafc;
    }}
    .details-table .val {{
      color: #0f172a;
      font-weight: 500;
    }}
    .footer {{
      background: #f8fafc;
      padding: 18px 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Central Bank of India</h2>
      <p>Digital Payment & Transaction Banking Department | Central Office, Mumbai</p>
    </div>
    <div class="content">
      <div class="greeting">Dear {recipient_name},</div>
      <p>Thank you for submitting your quotation for the merchant onboarding opportunity referenced below:</p>

      <table class="details-table">
        <tr>
          <td class="key">Application ID</td>
          <td class="val">#{app_id}</td>
        </tr>
        <tr>
          <td class="key">Merchant Institution</td>
          <td class="val">{cust_name}</td>
        </tr>
        <tr>
          <td class="key">Merchant Category</td>
          <td class="val">{category}</td>
        </tr>
        <tr>
          <td class="key">Procurement Stage</td>
          <td class="val">Quotation Evaluation & Final Aggregator Selection</td>
        </tr>
      </table>

      <div class="notice-box">
        Following comprehensive financial evaluation and merchant rate alignment, another payment aggregator has been selected for this specific merchant application.
      </div>

      <p>We sincerely appreciate your prompt responsiveness, competitive rate proposal, and ongoing partnership with Central Bank of India. We look forward to your active participation in upcoming merchant onboarding mandates.</p>

      <p style="margin-top: 24px; font-size: 13.5px;">
        Warm regards,<br>
        <strong>Digital Payment & Transaction Banking Department</strong><br>
        Central Bank of India, Central Office, Mumbai
      </p>
    </div>
    <div class="footer">
      This is an automated communication dispatched from the Central Bank of India Payment Aggregator Gateway Portal ({portal_url}). Please do not reply directly to this automated email.
    </div>
  </div>
</body>
</html>"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
Digital Payment & Transaction Banking Department, Central Office, Mumbai
------------------------------------------------------------
QUOTATION OUTCOME UPDATE: APPLICATION #{app_id} ({cust_name})

Dear {recipient_name},

Thank you for submitting your quotation for Merchant Onboarding Application #{app_id} ({cust_name} - {category}).

Following comprehensive financial evaluation and merchant alignment, another payment aggregator has been selected for this specific merchant application.

We sincerely appreciate your prompt responsiveness, competitive rate proposal, and ongoing collaboration with Central Bank of India. We look forward to your continued participation in upcoming merchant opportunities.

Digital Payment & Transaction Banking Department
Central Bank of India, Central Office, Mumbai
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


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
    Renders Onboarding Credentials Email for newly created Payment Aggregator vendor.
    Contains username, temporary random password, login link, and mandatory reset instructions.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Partner"
    subject = f"Welcome to Central Bank of India RFQ Portal - Account Login Credentials ({aggregator_name})"
    logo_b64 = get_cbi_logo_base64()
    logo_img_tag = f'<img src="data:image/png;base64,{logo_b64}" alt="Central Bank of India" style="height: 48px; max-height: 48px; width: auto; object-fit: contain; vertical-align: middle; margin-right: 14px;" />' if logo_b64 else ''

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px 12px; }}
    .email-container {{ max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #dbeafe; box-shadow: 0 4px 20px rgba(0, 73, 144, 0.08); }}
    .top-accent-bar {{ height: 5px; background: linear-gradient(90deg, #004990 0%, #176FC1 50%, #C8102E 100%); }}
    .header-section {{ padding: 22px 28px 18px 28px; border-bottom: 2px solid #004990; display: flex; align-items: center; justify-content: space-between; }}
    .notice-bar {{ background-color: #f8fafc; padding: 12px 28px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; font-weight: 800; color: #004990; text-transform: uppercase; }}
    .content-section {{ padding: 24px 28px; }}
    .cred-box {{ background-color: #f0f9ff; border: 1.5px solid #0284c7; border-radius: 8px; padding: 18px 22px; margin: 20px 0; }}
    .cred-row {{ margin: 8px 0; font-size: 14px; }}
    .cred-label {{ font-weight: 700; color: #0369a1; width: 140px; display: inline-block; }}
    .cred-val {{ font-family: 'Consolas', 'Courier New', monospace; font-size: 15px; font-weight: 700; color: #0f172a; background: #ffffff; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; }}
    .warning-box {{ background-color: #fef2f2; border-left: 4px solid #C8102E; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #991b1b; border-radius: 0 6px 6px 0; }}
    .btn-login {{ display: inline-block; background: linear-gradient(135deg, #004990 0%, #176FC1 100%); color: #ffffff !important; font-weight: 700; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin: 16px 0; text-align: center; }}
    .footer-section {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 11px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="top-accent-bar"></div>
    <div class="header-section">
      <div>
        {logo_img_tag}
        <span style="font-size: 16px; font-weight: 800; color: #004990;">Central Bank of India</span>
      </div>
      <div style="font-size: 11px; font-weight: 800; color: #0369a1; background: #e0f2fe; padding: 4px 8px; border-radius: 4px;">
        PARTNER ONBOARDING
      </div>
    </div>
    <div class="notice-bar">Aggregator Portal - Account Onboarding & Access Credentials</div>
    <div class="content-section">
      <p style="font-size: 14.5px;">Dear <strong style="color: #004990;">{recipient_name}</strong> ({aggregator_name}),</p>
      <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
        Welcome to the <strong>Central Bank of India Request for Quote (RFQ) & Commercial Proposal Portal</strong>. Your organization has been onboarded as an authorized Payment Aggregator partner.
      </p>

      <div class="cred-box">
        <div style="font-weight: 800; color: #004990; font-size: 14px; margin-bottom: 12px; text-transform: uppercase;">
           Your Portal Login Credentials
        </div>
        <div class="cred-row">
          <span class="cred-label">Login User ID:</span>
          <span class="cred-val">{email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Password:</span>
          <span class="cred-val">{temp_password}</span>
        </div>
        <div class="cred-row" style="margin-top: 12px;">
          <span class="cred-label">Portal URL:</span>
          <a href="{portal_url}" style="color: #004990; font-weight: 700;">{portal_url}</a>
        </div>
      </div>

      <div class="warning-box">
        <strong> Mandatory Security Action Required:</strong><br>
        This temporary password is provided for first-time account initialization. Upon your initial login, the system will prompt you to set your own private, permanent password. You will not be able to access the dashboard until this step is completed.
      </div>

      <div style="text-align: center;">
        <a href="{portal_url}/login" class="btn-login">Login to Aggregator Portal &rarr;</a>
      </div>

      <div style="margin-top: 26px; border-top: 1px dashed #cbd5e1; padding-top: 18px; font-size: 13px; color: #475569;">
        <p style="margin: 0; font-weight: 600;">Thanks &amp; Regards,</p>
        <p style="margin: 4px 0 0 0; font-weight: 800; color: #004990;">{manager_name}</p>
        <p style="margin: 0; font-size: 12px;">{manager_desig} | {manager_dept}</p>
        <p style="margin: 0; font-size: 12px;">Central Bank of India, {manager_office}</p>
      </div>
    </div>
    <div class="footer-section">
      This is an automated confidential communication from Central Bank of India. Please do not share your credentials with unauthorized personnel.
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Central Bank of India - Payment Aggregator Portal Onboarding
============================================================

Dear {recipient_name} ({aggregator_name}),

Welcome to Central Bank of India Request for Quote (RFQ) Portal. Your account has been initialized.

LOGIN CREDENTIALS:
- User ID / Email: {email}
- Temporary Password: {temp_password}
- Portal URL: {portal_url}/login

NOTE: You will be required to set a new permanent password on your first login.

Thanks & Regards,
{manager_name} ({manager_desig})
{manager_dept}, {manager_office}
Central Bank of India
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


def render_password_reset_confirmation_email(
    aggregator_name: str,
    contact_person: Optional[str],
    email: str,
    manager_name: str = "Shraddha Saxena",
    manager_dept: str = "Neo Banking & Emerging Technologies"
) -> Dict[str, str]:
    """
    Renders security confirmation email when an aggregator successfully resets their password.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Partner"
    subject = f"Security Alert: Password Updated Successfully - Central Bank of India Portal"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px 12px; }}
    .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #dbeafe; }}
    .top-accent-bar {{ height: 5px; background: #16a34a; }}
    .content-section {{ padding: 24px 28px; }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="top-accent-bar"></div>
    <div class="content-section">
      <div style="font-size: 16px; font-weight: 800; color: #16a34a; margin-bottom: 12px;">
         Password Changed Successfully
      </div>
      <p style="font-size: 14px;">Dear <strong style="color: #004990;">{recipient_name}</strong>,</p>
      <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
        This email confirms that the password for your Central Bank of India Aggregator Portal account (<strong>{email}</strong>) was successfully changed on <strong>{datetime.now().strftime('%d/%m/%Y at %I:%M %p')}</strong>.
      </p>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        If you performed this action, no further steps are needed. If you did not authorize this change, please contact the Central Bank of India security desk immediately.
      </p>
      <div style="margin-top: 22px; border-top: 1px dashed #cbd5e1; padding-top: 14px; font-size: 12.5px; color: #475569;">
        Thanks &amp; Regards,<br>
        <strong>{manager_name}</strong> | {manager_dept}<br>
        Central Bank of India, Central Office, Mumbai
      </div>
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Security Alert: Password Updated Successfully
=================================================
Dear {recipient_name},

The password for your Central Bank of India Aggregator account ({email}) was successfully changed on {datetime.now().strftime('%d/%m/%Y at %I:%M %p')}.

If you did not perform this change, please contact Central Bank of India immediately.

Thanks & Regards,
{manager_name} | {manager_dept}
Central Bank of India
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


def render_quote_submitted_confirmation_email(
    aggregator_name: str,
    contact_person: Optional[str],
    application: Any,
    sum_of_rate: Optional[float] = None
) -> Dict[str, str]:
    """
    Renders acknowledgement email to the aggregator confirming their quote submission.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Team"
    app_id = getattr(application, "applicationId", "N/A")
    cust_name = getattr(application, "customerName", "Merchant") or "Merchant"
    subject = f"Quotation Received Acknowledgement: Application #{app_id} ({cust_name}) - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px 12px; }}
    .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #dbeafe; }}
    .top-accent-bar {{ height: 5px; background: #004990; }}
    .content-section {{ padding: 24px 28px; }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="top-accent-bar"></div>
    <div class="content-section">
      <div style="font-size: 16px; font-weight: 800; color: #004990; margin-bottom: 12px;">
         Quotation Submission Received
      </div>
      <p style="font-size: 14px;">Dear <strong style="color: #004990;">{recipient_name}</strong>,</p>
      <p style="font-size: 13.5px; color: #334155; line-height: 1.6;">
        We have successfully received your commercial quote submission for <strong>Merchant Application #{app_id} ({cust_name})</strong>.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px;">
        <div><strong>Application ID:</strong> #{app_id}</div>
        <div><strong>Submission Time:</strong> {datetime.now().strftime('%d/%m/%Y %I:%M %p')}</div>
        <div><strong>Status:</strong> Under Review (Central Office)</div>
      </div>
      <p style="font-size: 13px; color: #475569;">
        Our team will evaluate the proposals and communicate further status updates via the portal.
      </p>
      <div style="margin-top: 22px; border-top: 1px dashed #cbd5e1; padding-top: 14px; font-size: 12.5px; color: #475569;">
        Thanks &amp; Regards,<br>
        <strong>Neo Banking &amp; Emerging Technologies Department</strong><br>
        Central Bank of India, Central Office, Mumbai
      </div>
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Quotation Submission Received
=============================
Dear {recipient_name},

Your quotation for Merchant Application #{app_id} ({cust_name}) was successfully received on {datetime.now().strftime('%d/%m/%Y %I:%M %p')}.

Status: Under Review (Central Office)

Thanks & Regards,
Central Bank of India
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }


