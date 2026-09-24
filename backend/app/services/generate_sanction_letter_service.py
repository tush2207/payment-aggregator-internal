"""
Central Bank of India - Payment Aggregator Portal
Official Standard Sanction Letter Generator (.docx)
"""

import io
from datetime import date
from pathlib import Path
from typing import Dict, Any, Optional

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls


class SanctionLetterService:
    FONT_FAMILY = "Calibri"
    FONT_NORMAL = Pt(10)
    FONT_SUBTITLE = Pt(11)
    FONT_TITLE = Pt(12)
    PAGE_MARGIN = Inches(0.75)

    def __init__(self):
        self.logo_path = Path(__file__).resolve().parent.parent / "assets" / "centralbanklogo.png"

    def generate_sanction_letter(self, data: Dict[str, Any], logo_path: Optional[str] = None) -> bytes:
        doc = Document()
        self._setup_page_margins(doc)

        actual_logo = logo_path or (str(self.logo_path) if self.logo_path.exists() else None)
        if actual_logo:
            self._add_logo(doc, actual_logo)

        self._add_department_header(doc)
        self._add_meta(doc, data)
        self._add_recipient_and_subject(doc, data)
        self._add_intro_paragraph(doc, data)
        self._add_charges_table(doc, data)
        self._add_notes_and_instructions(doc, data)
        self._add_signatory(doc, data)

        stream = io.BytesIO()
        doc.save(stream)
        stream.seek(0)
        return stream.read()

    # -------------------------------------------------------------
    # PAGE SETUP
    # -------------------------------------------------------------
    def _setup_page_margins(self, doc: Document):
        for section in doc.sections:
            section.top_margin = self.PAGE_MARGIN
            section.bottom_margin = self.PAGE_MARGIN
            section.left_margin = self.PAGE_MARGIN
            section.right_margin = self.PAGE_MARGIN

    # -------------------------------------------------------------
    # LOGO
    # -------------------------------------------------------------
    def _add_logo(self, doc: Document, logo_path: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(logo_path, width=Inches(3.2))

    # -------------------------------------------------------------
    # DEPARTMENT HEADER
    # -------------------------------------------------------------
    def _add_department_header(self, doc: Document):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)

        run = p.add_run("Neo Banking & Emerging Technologies Department, Central Office")
        run.bold = True
        run.font.name = self.FONT_FAMILY
        run.font.size = self.FONT_SUBTITLE
        run.font.color.rgb = RGBColor(15, 23, 42)

        self._add_paragraph_border(p, top=True, bottom=True)

    def _add_paragraph_border(self, paragraph, top=True, bottom=True):
        pPr = paragraph._p.get_or_add_pPr()
        borders = OxmlElement("w:pBdr")
        if top:
            b_top = OxmlElement("w:top")
            b_top.set(qn("w:val"), "single")
            b_top.set(qn("w:sz"), "6")
            b_top.set(qn("w:space"), "2")
            b_top.set(qn("w:color"), "000000")
            borders.append(b_top)
        if bottom:
            b_bottom = OxmlElement("w:bottom")
            b_bottom.set(qn("w:val"), "single")
            b_bottom.set(qn("w:sz"), "6")
            b_bottom.set(qn("w:space"), "2")
            b_bottom.set(qn("w:color"), "000000")
            borders.append(b_bottom)
        pPr.append(borders)

    # -------------------------------------------------------------
    # META (CO Ref & Date)
    # -------------------------------------------------------------
    def _add_meta(self, doc: Document, data: Dict[str, Any]):
        table = doc.add_table(rows=1, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = True

        fy = data.get("currentFinancialYear", "2026-27")
        current_date_str = data.get("currentDate") or date.today().strftime("%d.%m.%Y")
        if "-" in current_date_str:
            parts = current_date_str.split("-")
            if len(parts) == 3 and len(parts[0]) == 2:
                current_date_str = f"{parts[0]}.{parts[1]}.{parts[2]}"

        left_cell = table.rows[0].cells[0]
        p_left = left_cell.paragraphs[0]
        p_left.paragraph_format.space_after = Pt(4)
        run_left = p_left.add_run(f"CO: NB&ET: {fy}:")
        run_left.bold = True
        run_left.font.name = self.FONT_FAMILY
        run_left.font.size = Pt(10.5)

        right_cell = table.rows[0].cells[1]
        p_right = right_cell.paragraphs[0]
        p_right.paragraph_format.space_after = Pt(4)
        p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run_right = p_right.add_run(f"Date: {current_date_str}")
        run_right.bold = True
        run_right.font.name = self.FONT_FAMILY
        run_right.font.size = Pt(10.5)

    # -------------------------------------------------------------
    # RECIPIENT & SUBJECT
    # -------------------------------------------------------------
    def _add_recipient_and_subject(self, doc: Document, data: Dict[str, Any]):
        region_name = data.get("regionName", "Coimbatore")
        if not region_name.endswith("Region") and not region_name.endswith("Office"):
            region_disp = f"{region_name} Region"
        else:
            region_disp = region_name

        p_rec = doc.add_paragraph()
        p_rec.paragraph_format.space_before = Pt(6)
        p_rec.paragraph_format.space_after = Pt(8)
        run_rh = p_rec.add_run(f"Regional Head,\n{region_disp}\n")
        run_rh.bold = True
        run_rh.font.name = self.FONT_FAMILY
        run_rh.font.size = Pt(10.5)

        p_sub = doc.add_paragraph()
        p_sub.paragraph_format.space_before = Pt(4)
        p_sub.paragraph_format.space_after = Pt(8)

        cust_name = data.get("customerName", "Merchant Entity")
        acct_no = str(data.get("accountNo", "N/A") or "N/A")
        branch_name = data.get("branchName", "Main")
        city_loc = data.get("branchLocation") or data.get("location") or region_name or "Mumbai"

        sub_text = f"Reg: Sanction Letter for Payment Aggregator Services to M/s {cust_name}, {city_loc} (Account Number {acct_no}) Branch- {branch_name}."
        run_sub = p_sub.add_run(sub_text)
        run_sub.bold = True
        run_sub.underline = True
        run_sub.font.name = self.FONT_FAMILY
        run_sub.font.size = Pt(10.5)

    # -------------------------------------------------------------
    # INTRO PARAGRAPH
    # -------------------------------------------------------------
    def _add_intro_paragraph(self, doc: Document, data: Dict[str, Any]):
        cust_name = data.get("customerName", "Merchant Entity")
        agg_name = data.get("finalizedAggregatorName") or data.get("aggregatorName") or "Payment Aggregator"
        legal_agg_name = data.get("legalAggregatorName") or (f"M/s {agg_name}" if not agg_name.startswith("M/s") else agg_name)

        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15

        r1 = p.add_run(
            f"Apropos of the above, your proposal for providing Payment Aggregator Services to M/s {cust_name} "
            f"through {legal_agg_name} has been approved.\n\n"
            f"The details of the charges are given as below: -"
        )
        r1.font.name = self.FONT_FAMILY
        r1.font.size = Pt(10)

    # -------------------------------------------------------------
    # 5-COLUMN STANDARD CHARGES TABLE
    # -------------------------------------------------------------
    def _add_charges_table(self, doc: Document, data: Dict[str, Any]):
        table = doc.add_table(rows=0, cols=5)
        table.style = "Table Grid"
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        col_widths = [Inches(0.55), Inches(2.2), Inches(1.3), Inches(1.85), Inches(1.3)]

        agg_short = data.get("aggregatorShortName") or data.get("finalizedAggregatorName") or data.get("aggregatorName") or "Aggregator"
        if " " in agg_short:
            agg_short = agg_short.split()[0]
        agg_col_header = f"Commission share of\nM/s {agg_short}"

        hdr_row = table.add_row()
        hdr_titles = [
            "Sl\nNo",
            "Item",
            "Charges\nrecovered\nfrom\ncustomer",
            agg_col_header,
            "Bank's Share"
        ]
        for idx, text in enumerate(hdr_titles):
            cell = hdr_row.cells[idx]
            cell.text = text
            self._format_cell(cell, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=Pt(9.5), bg_color="F8FAFC")

        def add_row(sl_no, item, charges, comm_share, bank_share, item_bold=False):
            r = table.add_row()
            cells = r.cells
            cells[0].text = str(sl_no)
            cells[1].text = str(item)
            cells[2].text = str(charges)
            cells[3].text = str(comm_share)
            cells[4].text = str(bank_share)

            self._format_cell(cells[0], align=WD_ALIGN_PARAGRAPH.CENTER, size=Pt(9.5))
            self._format_cell(cells[1], align=WD_ALIGN_PARAGRAPH.LEFT, bold=item_bold, size=Pt(9.5))
            self._format_cell(cells[2], align=WD_ALIGN_PARAGRAPH.CENTER, size=Pt(9.5))
            self._format_cell(cells[3], align=WD_ALIGN_PARAGRAPH.CENTER, size=Pt(9.5))
            self._format_cell(cells[4], align=WD_ALIGN_PARAGRAPH.CENTER, size=Pt(9.5))
            return cells

        def add_section_header(title):
            r = table.add_row()
            cell = r.cells[0]
            cell.merge(r.cells[4])
            cell.text = title
            self._format_cell(cell, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=Pt(9.5), bg_color="FFFFFF")

        # 1. System Integration Fees
        add_row("1", "System\nIntegration Fees", "NA", "NA", "NA")

        # 2. AMC
        add_row("2", "AMC", "NA", "NA", "NA")

        sl_no = 3

        # Net Banking Transactions
        if data.get("hasNetBanking", True):
            add_section_header("Net Banking Transactions")
            ib_charge = self._fmt_val(data.get("ibChargePurposed", "2.50%"), is_rate=True, default="2.50%")
            hdfc_rate = self._fmt_val(data.get("hdfcRate", "1.60%"), is_rate=True, default="1.60%")
            sbi_rate = self._fmt_val(data.get("sbiRate", "1.20%"), is_rate=True, default="1.20%")
            others_rate = self._fmt_val(data.get("othersRate", "0.60%"), is_rate=True, default="0.60%")

            hdfc_bshare = self._fmt_val(data.get("hdfcBankShare", "0.90%"), is_rate=True, default="0.90%")
            sbi_bshare = self._fmt_val(data.get("sbiBankShare", "1.30%"), is_rate=True, default="1.30%")
            others_bshare = self._fmt_val(data.get("othersBankShare", "1.90%"), is_rate=True, default="1.90%")

            comm_nb = f"HDFC/ICICI- {hdfc_rate}\nSBI/AXIS/Kotak- {sbi_rate}\nAll other banks-{others_rate}"
            bshare_nb = f"HDFC/ICICI- {hdfc_bshare}\nSBI/AXIS/Kotak- {sbi_bshare}\nAll other banks-\n{others_bshare}"

            add_row(str(sl_no), "Net Banking", ib_charge, comm_nb, bshare_nb)
            sl_no += 1

        # Credit Card Transactions
        if data.get("hasCreditCard", True) or data.get("hasAmex", True):
            add_section_header("Credit Card Transactions")
            has_header_num = False
            if data.get("hasCreditCard", True):
                cd_charge = self._fmt_val(data.get("cdChargePurposed", "1.75%"), is_rate=True, default="1.75%")
                cd_rate = self._fmt_val(data.get("cdRate", "1.25%"), is_rate=True, default="1.25%")
                cd_bshare = self._fmt_val(data.get("cdBankShare", "0.50%"), is_rate=True, default="0.50%")
                add_row(str(sl_no), "Visa/MasterCard/\nRupay (domestic)", cd_charge, cd_rate, cd_bshare)
                has_header_num = True

            if data.get("hasAmex", True):
                amex_charge = self._fmt_val(data.get("amexChargePurposed", "1.85%"), is_rate=True, default="1.85%")
                amex_rate = self._fmt_val(data.get("amexRate", "1.35%"), is_rate=True, default="1.35%")
                amex_bshare = self._fmt_val(data.get("amexBankShare", "0.50%"), is_rate=True, default="0.50%")
                add_row("" if has_header_num else str(sl_no), "Amex/Diner", amex_charge, amex_rate, amex_bshare)

            sl_no += 1

        # Debit Card Transactions
        if data.get("hasDebitCard", True):
            add_section_header("Debit Card Transactions")
            r_dc_sub = table.add_row()
            c_dc = r_dc_sub.cells[0]
            c_dc.merge(r_dc_sub.cells[4])
            c_dc.text = "Visa/MasterCard (Domestic)"
            self._format_cell(c_dc, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=Pt(9.5))

            has_dc_num = False
            if data.get("hasDebitUpto2k", True):
                ddupto_charge = self._fmt_val(data.get("ddupto2kChargePurposed", "0.40%"), is_rate=True, default="0.40%")
                ddupto_rate = self._fmt_val(data.get("ddupto2kRate", "0.25%"), is_rate=True, default="0.25%")
                ddupto_bshare = self._fmt_val(data.get("ddupto2kBankShare", "0.15%"), is_rate=True, default="0.15%")
                add_row(str(sl_no), "Upto 2000", ddupto_charge, ddupto_rate, ddupto_bshare)
                has_dc_num = True

            if data.get("hasDebitAbove2k", True):
                ddabove_charge = self._fmt_val(data.get("ddabove2kChargePurposed", "0.90%"), is_rate=True, default="0.90%")
                ddabove_rate = self._fmt_val(data.get("ddabove2kRate", "0.75%"), is_rate=True, default="0.75%")
                ddabove_bshare = self._fmt_val(data.get("ddabove2kBankShare", "0.25%"), is_rate=True, default="0.25%")
                add_row("" if has_dc_num else str(sl_no), "Above 2000", ddabove_charge, ddabove_rate, ddabove_bshare)
                has_dc_num = True

            if data.get("hasRupayDebit", True):
                add_row("" if has_dc_num else str(sl_no), "Rupay Card\n(Domestic)", "Nil", "Nil", "NA")

            sl_no += 1

        # UPI
        if data.get("hasUpi", True):
            add_row(str(sl_no), "UPI", "Nil", "Nil", "NA")
            sl_no += 1

        # Wallet
        if data.get("hasWallet", True):
            w_charge = self._fmt_val(data.get("walletChargePurposed", "1.60%"), is_rate=True, default="1.60%")
            w_rate = self._fmt_val(data.get("walletRate", "1.50%"), is_rate=True, default="1.50%")
            w_bshare = self._fmt_val(data.get("walletBankShare", "0.10%"), is_rate=True, default="0.10%")
            add_row(str(sl_no), "Wallet", w_charge, w_rate, w_bshare)
            sl_no += 1

        # NEFT/RTGS/Challan
        if data.get("hasNeft", True):
            neft_charge = self._fmt_val(data.get("neftChargePurposed", "₹ 7/-"), is_rate=False, default="₹ 7/-")
            neft_rate = self._fmt_val(data.get("neftRate", "₹ 5/-"), is_rate=False, default="₹ 5/-")
            neft_bshare = self._fmt_val(data.get("neftBankShare", "₹ 2/-"), is_rate=False, default="₹ 2/-")
            add_row(str(sl_no), "NEFT/RTGS/Cha\nllan", neft_charge, neft_rate, neft_bshare)
            sl_no += 1

        # International Cards
        if data.get("hasIntl", True):
            intl_charge = self._fmt_val(data.get("intlChargePurposed", "2.60%"), is_rate=True, default="2.60%")
            intl_rate = self._fmt_val(data.get("intlRate", "2.50%"), is_rate=True, default="2.50%")
            intl_bshare = self._fmt_val(data.get("intlBankShare", "0.10%"), is_rate=True, default="0.10%")
            add_row(str(sl_no), "International\nCards", intl_charge, intl_rate, intl_bshare)
            sl_no += 1

        # EMI
        if data.get("hasEmi", True):
            emi_charge = self._fmt_val(data.get("emiChargePurposed", "1.95%"), is_rate=True, default="1.95%")
            emi_rate = self._fmt_val(data.get("emiRate", "1.85%"), is_rate=True, default="1.85%")
            emi_bshare = self._fmt_val(data.get("emiBankShare", "0.10%"), is_rate=True, default="0.10%")
            add_row(str(sl_no), "EMI", emi_charge, emi_rate, emi_bshare)
            sl_no += 1

        for row in table.rows:
            for idx, width in enumerate(col_widths):
                if idx < len(row.cells):
                    row.cells[idx].width = width

    def _format_cell(self, cell, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT, size=Pt(9.5), bg_color=None):
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        for p in cell.paragraphs:
            p.alignment = align
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.05
            for run in p.runs:
                run.bold = bold
                run.font.name = self.FONT_FAMILY
                run.font.size = size
                run.font.color.rgb = RGBColor(0, 0, 0)

        if bg_color:
            shading_xml = f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>'
            cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

    def _fmt_val(self, val, is_rate=True, default="0.00%"):
        if val is None or str(val).strip() in ("", "0", "0.0", "0%", "0.0%", "0.00%", "NA", "None"):
            return default
        s = str(val).strip()
        if is_rate:
            try:
                num = float(s.replace("%", "").replace("₹", "").strip())
                if num == 0.0:
                    return default
                return f"{num:.2f}%"
            except Exception:
                return f"{s}%" if not s.endswith("%") else s
        else:
            if not s.startswith("₹"):
                return f"₹ {s}/-" if not s.endswith("/-") else f"₹ {s}"
            return s

    # -------------------------------------------------------------
    # NOTES & INSTRUCTIONS
    # -------------------------------------------------------------
    def _add_notes_and_instructions(self, doc: Document, data: Dict[str, Any]):
        p_note = doc.add_paragraph()
        p_note.paragraph_format.space_before = Pt(8)
        p_note.paragraph_format.space_after = Pt(4)
        r_n = p_note.add_run("Note - The above charges are exclusive of taxes.")
        r_n.bold = True
        r_n.font.name = self.FONT_FAMILY
        r_n.font.size = Pt(10)

        points = [
            "Regional office shall review the payment aggregator service on a yearly basis to verify that the actual numbers of transactions are in conformity with the expected number of transactions and submit the review report to Central office NBET Department.",
            "Regional Office is also requested to inform us (smit1dptb@centralbank.bank.in) the date of implementation, after one successful transaction has been completed.",
        ]

        for pt in points:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            run = p.add_run(pt)
            run.font.name = self.FONT_FAMILY
            run.font.size = Pt(10)

        agg_name = data.get("finalizedAggregatorName") or data.get("aggregatorName") or "Payment Aggregator"
        legal_agg_name = data.get("legalAggregatorName") or (f"M/s {agg_name}" if not agg_name.startswith("M/s") else agg_name)
        agg_contact = data.get("contactPersonName") or data.get("aggregatorContactPerson") or "Mr. Karan Batra"
        agg_mobile = str(data.get("mobileNo") or data.get("aggregatorMobile") or "8965078278")
        agg_email = data.get("email") or data.get("aggregatorEmail") or "karan.batra@mobikwik.com"

        p_coord = doc.add_paragraph()
        p_coord.paragraph_format.space_before = Pt(4)
        p_coord.paragraph_format.space_after = Pt(12)
        p_coord.paragraph_format.line_spacing = 1.15
        r_coord = p_coord.add_run(
            f"Kindly advise RCC team to coordinate with {agg_contact}, Mobile {agg_mobile}, Email id: {agg_email} "
            f"from {legal_agg_name}, for executing the necessary integration and agreement. "
            f"Necessary agreement needs to be executed with the Client."
        )
        r_coord.font.name = self.FONT_FAMILY
        r_coord.font.size = Pt(10)

    # -------------------------------------------------------------
    # SIGNATORY
    # -------------------------------------------------------------
    def _add_signatory(self, doc: Document, data: Dict[str, Any]):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(4)

        person = data.get("authorisedPersonName") or "Roshan Singh"
        desig = data.get("authorisedPersonDesignation") or "Chief Manager"

        r1 = p.add_run(f"({person})\n")
        r1.bold = True
        r1.font.name = self.FONT_FAMILY
        r1.font.size = Pt(10.5)

        r2 = p.add_run(f"{desig}")
        r2.bold = True
        r2.font.name = self.FONT_FAMILY
        r2.font.size = Pt(10.5)

