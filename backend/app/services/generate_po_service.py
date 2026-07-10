import io
from datetime import date
from pathlib import Path
from typing import Dict, Any

from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

class PurchaseOrderService:

    FONT_NORMAL = Pt(11)
    FONT_HEADER = Pt(14)
    PAGE_MARGIN = Inches(1)

    def __init__(self):
        self.static_path = Path(__file__).resolve().parent.parent / "static"

    def generate_purchase_order(self, po_data: Dict[str, Any], logo_path: str = None) -> bytes:
        doc = Document()
        self._setup_page_margins(doc)

        if logo_path:
            self._add_logo(doc, logo_path)
        self._add_header(doc)
        self._add_meta(doc, po_data)
        self._add_address_section(doc, po_data)
        self._add_po_table(doc, po_data)
        self._add_note_section(doc, po_data)
        # self._add_signature_section(doc)

        stream = io.BytesIO()
        doc.save(stream)
        stream.seek(0)
        return stream.read()

    # -------------------------------------------------------------
    # PAGE SETUP
    # -------------------------------------------------------------
    def _setup_page_margins(self, doc):
        for section in doc.sections:
            section.top_margin = self.PAGE_MARGIN
            section.bottom_margin = self.PAGE_MARGIN
            section.left_margin = self.PAGE_MARGIN
            section.right_margin = self.PAGE_MARGIN

    # -------------------------------------------------------------
    # LOGO
    # -------------------------------------------------------------
    def _add_logo(self, doc, logo_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(logo_path, width=Inches(3))

    # -------------------------------------------------------------
    # HEADER
    # -------------------------------------------------------------
    def _add_header(self, doc):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("Digital Payment & Transaction Banking Department, Central Office")
        run.bold = True
        run.font.size = self.FONT_HEADER

        # Border above & below
        self._add_paragraph_border(p)

    def _add_paragraph_border(self, paragraph):
        p = paragraph._p
        pPr = p.get_or_add_pPr()
        borders = OxmlElement("w:pBdr")

        for border_type in ["top", "bottom"]:
            border = OxmlElement(f"w:{border_type}")
            border.set(qn("w:val"), "single")
            border.set(qn("w:sz"), "8")
            border.set(qn("w:space"), "1")
            border.set(qn("w:color"), "000000")
            borders.append(border)

        pPr.append(borders)

    # -------------------------------------------------------------
    # META INFORMATION
    # -------------------------------------------------------------
    
    def _add_meta(self, doc, data):
        table = doc.add_table(rows=1, cols=2)
        table.autofit = True

        # Remove borders
        tbl = table._tbl
        # LEFT → CO/DP&TB/FY
        left_cell = table.rows[0].cells[0]
        p_left = left_cell.paragraphs[0]
        run_left = p_left.add_run(f"CO/DP&TB/{data.get('currentFinancialYear', '')}")
        run_left.bold = True
        run_left.font.size = self.FONT_NORMAL

        # RIGHT → Date
        right_cell = table.rows[0].cells[1]
        p_right = right_cell.paragraphs[0]
        p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run_right = p_right.add_run(f"Date: {data.get('currentDate', '')}")
        run_right.bold = True
        run_right.font.size = self.FONT_NORMAL
        
    # -------------------------------------------------------------
    # ADDRESS SECTION
    # -------------------------------------------------------------
    def _add_address_section(self, doc, data):

        table = doc.add_table(rows=2, cols=3)
        table.autofit = True

        # Remove borders
        tbl = table._tbl
        left_cell = table.rows[0].cells[0]
        p_left = left_cell.paragraphs[0]
        run_left = p_left.add_run(data.get('aggregatorName', ''))
        run_left.bold = True
        run_left.font.size = self.FONT_NORMAL

        left_cell = table.rows[1].cells[0]
        p_left = left_cell.paragraphs[0]
        run_left = p_left.add_run(data.get('location', ''))
        run_left.bold = True
        run_left.font.size = self.FONT_NORMAL
        # doc.add_paragraph("")  # spacing
    # -------------------------------------------------------------
    # PURCHASE ORDER TABLE
    # -------------------------------------------------------------
    def _add_po_table(self, doc, data):
        table = doc.add_table(rows=0, cols=5)
        table.style = "Table Grid"

        # ---------------------------------------
        # HEADER ROW
        # ---------------------------------------
        header = table.add_row().cells
        headers = [
            "Sl No",
            "Item",
            "Charges recovered from customer",
            "Commission shares",
            "Bank’s Share",
        ]
        for i, text in enumerate(headers):
            header[i].text = text

        # ---------------------------------------
        # ROW 1 – System Integration Fees
        # ---------------------------------------
        r1 = table.add_row().cells
        r1[0].text = "1"
        r1[1].text = "System Integration Fees"
        r1[2].text = "NA"
        r1[3].text = "NA"
        r1[4].text = "NA"

        # ---------------------------------------
        # ROW 2 – PAN
        # ---------------------------------------
        r2 = table.add_row().cells
        r2[0].text = "2"
        r2[1].text = "PAN"
        r2[2].text = "NA"
        r2[3].text = "NA"
        r2[4].text = "NA"

        # ---------------------------------------
        # SECTION HEADER – Net Banking
        # ---------------------------------------
        nb = table.add_row().cells
        nb[0].merge(nb[-1])
        nb[0].text = "Net Banking Transactions"

        # ---------------------------------------
        # ROW 3 – Net Banking Rates
        # ---------------------------------------
        r3 = table.add_row().cells
        r3[0].text = "3"
        r3[1].text = "Net Banking"
        r3[2].text = str(data.get("ibChargePurposed", ""))

        r3[3].text = (
            f"SBI ₹ {data.get('sbiRate','')}/-\n"
            f"HDFC ₹ {data.get('hdfcRate','')}/-\n"
            f"ICICI ₹ {data.get('iciciRate','')}/-\n"
            f"AXIS ₹ {data.get('axisRate','')}/-\n"
            f"Other banks ₹ {data.get('othersRate','')}/-"
        )

        r3[4].text = (
            f"SBI ₹ {data.get('sbiBankShare','')}/-\n"
            f"HDFC ₹ {data.get('hdfcBankShare','')}/-\n"
            f"ICICI ₹ {data.get('iciciBankShare','')}/-\n"
            f"AXIS ₹ {data.get('axisBankShare','')}/-\n"
            f"Other banks ₹ {data.get('othersBankShare','')}/-"
        )

        # ---------------------------------------
        # SECTION HEADER – Credit Card
        # ---------------------------------------
        cc = table.add_row().cells
        cc[0].merge(cc[-1])
        cc[0].text = "Credit Card Transactions"

        # ---------------------------------------
        # ROW 4 – Credit Card Rates
        # ---------------------------------------
        r4 = table.add_row().cells
        r4[0].text = "4"
        r4[1].text = "Visa/MasterCard/Rupay (Domestic)"
        r4[2].text = f"{data.get('cdChargePurposed','')}%"
        r4[3].text = f"{data.get('cdRate','')}%"
        r4[4].text = f"{data.get('cdBankShare','')}%"

        # ---------------------------------------
        # SECTION HEADER – Debit Card
        # ---------------------------------------
        dc = table.add_row().cells
        dc[0].merge(dc[-1])
        dc[0].text = "Debit Card Transactions"

        # ---------------------------------------
        # ROW 5 – Upto 2000
        # ---------------------------------------
        r5 = table.add_row().cells
        r5[0].text = "5"
        r5[1].text = "Upto ₹2000"
        r5[2].text = f"{data.get('ddupto2kChargePurposed','')}%"
        r5[3].text = f"{data.get('ddupto2kRate','')}%"
        r5[4].text = f"{data.get('ddupto2kBankShare','')}%"

        # ---------------------------------------
        # ROW – Above 2000
        # ---------------------------------------
        r6 = table.add_row().cells
        r6[0].text = ""
        r6[1].text = "Above ₹2000"
        r6[2].text = f"{data.get('ddabove2kChargePurposed','')}%"
        r6[3].text = f"{data.get('ddabove2kRate','')}%"
        r6[4].text = f"{data.get('ddabove2kBankShare','')}%"

        # ---------------------------------------
        # ROW – Rupay Domestic
        # ---------------------------------------
        r7 = table.add_row().cells
        r7[0].text = ""
        r7[1].text = "Rupay Card (Domestic)"
        r7[2].text = "Nil"
        r7[3].text = "Nil"
        r7[4].text = "NA"

        # ---------------------------------------
        # ROW – UPI
        # ---------------------------------------
        r8 = table.add_row().cells
        r8[0].text = "6"
        r8[1].text = "UPI"
        r8[2].text = "Nil"
        r8[3].text = "Nil"
        r8[4].text = "NA"

        # ---- Font Size Fix ----
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.font.size = Pt(11)
    # -------------------------------------------------------------
    # NOTES
    # -------------------------------------------------------------
    
    def _add_note_section(self, doc, data):
        doc.add_paragraph()  # spacing
        # -------------------------
        # MAIN NOTE LINE
        # -------------------------
        p = doc.add_paragraph()
        run = p.add_run("Note - The above charges are exclusive of taxes.")
        run.font.size = self.FONT_NORMAL

        # -------------------------
        # ITALIC MDR NOTE
        # -------------------------
        p1 = doc.add_paragraph()
        run1 = p1.add_run(
            "MDR on Debit card transactions are regulated by RBI and can't be more than "
            "0.40% for transaction amount up to Rs. 2000 & 0.90% above Rs. 2000. "
            "Charges for UPI and Rupay Debit Card have been waived by Govt."
        )
        run1.italic = True
        run1.font.size = self.FONT_NORMAL

        # -------------------------
        # ADDITIONAL NOTE
        # -------------------------
        p2 = doc.add_paragraph(
            "There will be no charges levied on UPI and Rupay debit card transaction as platform fee."
        )
        for run in p2.runs:
            run.font.size = self.FONT_NORMAL

        # doc.add_paragraph()  # spacing

        # -------------------------
        # CONTACT DETAILS
        # -------------------------
        contact = doc.add_paragraph()
        contact_run = contact.add_run(
            "Please ensure to complete the necessary integration within 7 days after the date of issuance of this PO. " f"Kindly communicate with Mail - {data.get('rccMailId','')}, " f"Mobile Number - {data.get('rccMobileNo','')}, " f"Contact Person - {data.get('rccContactPersonName','')}."
        )
        contact_run.font.size = self.FONT_NORMAL

        doc.add_paragraph()  # spacing before signature

        # -------------------------
        # SIGNATURE (RIGHT ALIGNED)
        # -------------------------
        sig = doc.add_paragraph()
        sig.alignment = WD_ALIGN_PARAGRAPH.LEFT     

        run_sig1 = sig.add_run(f"{data.get('authorisedPersonName','')}\n")
        run_sig1.bold = True
        run_sig1.font.size = self.FONT_NORMAL

        run_sig2 = sig.add_run(f"{data.get('authorisedPersonDesignation','')}")
        run_sig2.font.size = self.FONT_NORMAL

