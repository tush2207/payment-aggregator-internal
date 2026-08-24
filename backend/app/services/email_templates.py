"""
Central Bank of India - Payment Aggregator Portal
Email Templates & HTML Renderers
"""

from typing import Dict, Any, Optional
from datetime import datetime


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
    projections: Optional[Any] = None
) -> Dict[str, str]:
    """
    Renders subject, HTML content, and Plain Text content for Send for Quote stage,
    including detailed Merchant Application details and Payment Projection Breakdown.
    """
    recipient_name = contact_person.strip() if contact_person and contact_person.strip() else f"{aggregator_name} Partner Team"
    
    app_id = getattr(application, "applicationId", "N/A")
    cust_name = getattr(application, "customerName", "N/A") or "N/A"
    category = getattr(application, "category", "N/A") or "N/A"
    integrate_with = getattr(application, "integrateWith", "Payment Gateway (Web / Mobile)") or "Payment Gateway (Web / Mobile)"
    avg_ticket = format_currency_inr(getattr(application, "avgTransactionSize", None))
    avg_yearly = format_currency_inr(getattr(application, "avgTransactionYearly", None))
    total_annual = format_currency_inr(getattr(application, "totalAnnualTransaction", None))
    
    # Format deadline nicely if provided
    deadline_display = "Within 48 Hours"
    if end_date_str:
        try:
            # Handle ISO format strings like 2026-08-28T18:30:00.000Z
            clean_date = end_date_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_date)
            deadline_display = dt.strftime("%d %B %Y, %I:%M %p UTC")
        except Exception:
            deadline_display = str(end_date_str)

    # Build list of requested channels / modes
    raw_proj = getattr(application, "projection", "") or ""
    channels = []
    if projections and len(projections) > 0:
        for p in projections:
            t_type = getattr(p, "transactionType", None) or (p.get("transactionType") if isinstance(p, dict) else None)
            if t_type and t_type not in channels:
                channels.append(t_type)
    elif raw_proj:
        channels = [c.strip() for c in str(raw_proj).split("|") if c.strip()]
    
    if not channels:
        channels = ["UPI", "Internet Banking", "Debit Card - Rupay", "Debit Card - Master/Visa", "Credit Cards"]

    channel_rows_html = ""
    channel_rows_text = ""
    for idx, ch in enumerate(channels):
        channel_rows_html += f"""
        <tr>
          <td style="padding: 7px 8px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-align: center;">{idx + 1}</td>
          <td style="padding: 7px 8px; font-size: 12.5px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #0E4F8D;">{ch}</td>
          <td style="padding: 7px 8px; font-size: 11px; font-weight: 700; text-align: center; border-bottom: 1px solid #e2e8f0;">
            <span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 12px; border: 1px solid #bbf7d0;">Quote Required</span>
          </td>
        </tr>
        """
        channel_rows_text += f"  {idx + 1}. {ch}\n"

    channels_section_html = f"""
    <div class="card-box" style="margin-top: 16px;">
      <div class="card-title">Requested Payment Modes / Projection Channels for Quotation</div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <thead>
          <tr style="background-color: #e0f2fe;">
            <th style="padding: 6px 8px; font-size: 11px; font-weight: 800; color: #0369a1; text-align: center; width: 35px;">#</th>
            <th style="padding: 6px 8px; font-size: 11px; font-weight: 800; color: #0369a1; text-align: left;">Payment Channel / Mode</th>
            <th style="padding: 6px 8px; font-size: 11px; font-weight: 800; color: #0369a1; text-align: center; width: 130px;">Quotation Status</th>
          </tr>
        </thead>
        <tbody>
          {channel_rows_html}
        </tbody>
      </table>
    </div>
    """

    quote_action_url = f"{portal_url.rstrip('/')}/aggregator-dashboard"
    subject = f"[Action Required] Request for Quotation: Application #{app_id} ({category}) [Due: {deadline_display}] - Central Bank of India"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request for Quotation - Central Bank of India</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #f4f7fb;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }}
    .email-wrapper {{
      width: 100%;
      background-color: #f4f7fb;
      padding: 28px 12px;
    }}
    .email-container {{
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(14, 79, 141, 0.08);
      border: 1px solid #e2e8f0;
    }}
    .header-bar {{
      background: linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%);
      padding: 24px 28px;
      text-align: left;
      border-bottom: 4px solid #CE0F3E;
    }}
    .bank-title {{
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0;
      text-transform: uppercase;
    }}
    .sub-dept {{
      color: #e0f2fe;
      font-size: 12px;
      font-weight: 600;
      margin-top: 4px;
      letter-spacing: 0.3px;
    }}
    .badge-bar {{
      background: #f8fafc;
      padding: 12px 28px;
      border-bottom: 1px solid #edf2f7;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background-color: #fef2f2;
      color: #CE0F3E;
      border: 1px solid #fecaca;
    }}
    .badge-ref {{
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: #0E4F8D;
    }}
    .content-body {{
      padding: 28px;
    }}
    .salutation {{
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }}
    .paragraph {{
      font-size: 13.5px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 18px;
    }}
    .card-box {{
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      padding: 18px;
      margin: 20px 0;
    }}
    .card-title {{
      font-size: 13px;
      font-weight: 800;
      color: #0E4F8D;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0;
      margin-bottom: 14px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 8px;
    }}
    .details-table {{
      width: 100%;
      border-collapse: collapse;
    }}
    .details-table td {{
      padding: 7px 4px;
      font-size: 13px;
      vertical-align: top;
    }}
    .details-table .label {{
      color: #64748b;
      font-weight: 600;
      width: 45%;
    }}
    .details-table .value {{
      color: #0f172a;
      font-weight: 700;
      width: 55%;
    }}
    .deadline-box {{
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 18px 0;
      font-size: 13px;
      color: #92400e;
    }}
    .deadline-box b {{
      color: #78350f;
    }}
    .btn-container {{
      text-align: center;
      margin: 28px 0 20px 0;
    }}
    .cta-btn {{
      display: inline-block;
      background: linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.4px;
      box-shadow: 0 4px 12px rgba(23, 111, 193, 0.3);
    }}
    .steps-box {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 18px 0;
    }}
    .steps-box ol {{
      margin: 0;
      padding-left: 20px;
    }}
    .steps-box li {{
      font-size: 12.5px;
      color: #475569;
      margin-bottom: 6px;
    }}
    .footer {{
      background-color: #0f172a;
      color: #94a3b8;
      padding: 24px 28px;
      font-size: 11.5px;
      line-height: 1.5;
      text-align: center;
    }}
    .footer a {{
      color: #38bdf8;
      text-decoration: none;
    }}
    .disclaimer {{
      margin-top: 14px;
      font-size: 10.5px;
      color: #64748b;
      line-height: 1.4;
      border-top: 1px solid #334155;
      padding-top: 12px;
    }}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Top Brand Header -->
      <div class="header-bar">
        <h1 class="bank-title">Central Bank of India</h1>
        <div class="sub-dept">Neo Banking & Emerging Technologies &bull; Payment Aggregator Portal</div>
      </div>

      <!-- Reference & Status Bar -->
      <div class="badge-bar">
        <span class="badge-ref">Application Reference: #APP-{app_id}</span>
        <span class="badge">Quote Request Pending</span>
      </div>

      <!-- Main Email Content -->
      <div class="content-body">
        <div class="salutation">Dear {recipient_name},</div>
        <p class="paragraph">
          Central Bank of India has initiated a commercial quotation request for a merchant onboarding application assigned to <b>{aggregator_name}</b>.
        </p>
        <p class="paragraph">
          Kindly review the merchant details and payment channel projection schedule below and provide your most competitive <b>Merchant Discount Rate (MDR)</b> schedule on our official portal.
        </p>

        <!-- Business & Application Details Table -->
        <div class="card-box">
          <div class="card-title">Merchant Application Summary</div>
          <table class="details-table">
            <tr>
              <td class="label">Application ID:</td>
              <td class="value">#{app_id}</td>
            </tr>
            <tr>
              <td class="label">Business Category:</td>
              <td class="value">{category}</td>
            </tr>
            <tr>
              <td class="label">Integration Channel:</td>
              <td class="value">{integrate_with}</td>
            </tr>
            <tr>
              <td class="label">Average Ticket Size:</td>
              <td class="value">{avg_ticket}</td>
            </tr>
            <tr>
              <td class="label">Estimated Annual Volume:</td>
              <td class="value">{avg_yearly if avg_yearly != "N/A" else total_annual}</td>
            </tr>
          </table>
        </div>

        <!-- Requested Payment Modes / Channels Table -->
        {channels_section_html}

        <!-- Submission Deadline Banner -->
        <div class="deadline-box">
          &#9200; <b>Quotation Submission Deadline:</b> {deadline_display}
        </div>

        <!-- How to Submit Instructions -->
        <div class="steps-box">
          <div style="font-size: 12px; font-weight: 700; color: #0E4F8D; margin-bottom: 6px;">Instructions for Submission:</div>
          <ol>
            <li>Access the <b>Payment Aggregator Portal</b> using the link below.</li>
            <li>Locate <b>Application #{app_id}</b> in your quotation worklist.</li>
            <li>Submit proposed channel rates (UPI, Net Banking, Credit / Debit Cards, Wallets).</li>
            <li>Confirm and submit before the expiration deadline.</li>
          </ol>
        </div>

        <!-- Primary CTA Button -->
        <div class="btn-container">
          <a href="{quote_action_url}" class="cta-btn" target="_blank">Access Portal & Submit Quote &rarr;</a>
        </div>

        <p class="paragraph" style="font-size: 12px; color: #64748b; margin-top: 24px;">
          For any clarifications regarding this request or merchant integration specifications, please reach out to the Central Office Payment Aggregator Desk at <a href="mailto:co.papg@cbi.co.in" style="color: #0E4F8D; font-weight: 600;">co.papg@cbi.co.in</a>.
        </p>
      </div>

      <!-- Institutional Footer -->
      <div class="footer">
        <div><b>Central Bank of India</b> &bull; Chandermukhi, Nariman Point, Mumbai - 400021</div>
        <div style="margin-top: 4px;">Digital Banking & Neo Banking Department</div>
        <div class="disclaimer">
          <b>CONFIDENTIALITY NOTICE:</b> This electronic mail and any attachments are intended solely for the partner organization named above. It contains privileged and proprietary commercial information. If you have received this message in error, please immediately notify the sender and delete all copies.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

    text_content = f"""
CENTRAL BANK OF INDIA - PAYMENT AGGREGATOR PORTAL
Neo Banking & Emerging Technologies
------------------------------------------------------------
REQUEST FOR COMMERCIAL QUOTATION: APPLICATION #{app_id}
Subject: [Action Required] Request for Quotation: Application #{app_id} ({category}) [Due: {deadline_display}] - Central Bank of India
Status: Quote Request Pending

Dear {recipient_name},

Central Bank of India has initiated a commercial quotation request for a merchant onboarding application assigned to {aggregator_name}.

MERCHANT APPLICATION SUMMARY:
- Application ID: #{app_id}
- Category: {category}
- Integration Channel: {integrate_with}
- Average Ticket Size: {avg_ticket}
- Estimated Annual Volume: {avg_yearly if avg_yearly != "N/A" else total_annual}

REQUESTED PAYMENT MODES & CHANNELS:
{channel_rows_text}
SUBMISSION DEADLINE: {deadline_display}

PORTAL ACCESS LINK:
{quote_action_url}

INSTRUCTIONS:
1. Log in to the Payment Aggregator Portal.
2. Locate Application #{app_id} in your worklist.
3. Submit proposed channel rates (UPI, Net Banking, Cards, Wallets).
4. Confirm and submit before the stated deadline.

For support, contact: co.papg@cbi.co.in
Central Bank of India | Neo Banking & Emerging Technologies
"""

    return {
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content.strip()
    }
