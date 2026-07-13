import io
import re
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

def generate_excel_workbook(headers, rows, sheet_name="Report", title="Report", filters=None):
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name

    # Styles
    title_font = Font(name="Calibri", size=16, bold=True, color="1F4E79")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    border_side = Side(border_style="thin", color="D9D9D9")
    thin_border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
    
    current_row = 1

    # Title
    ws.cell(row=current_row, column=1, value=title).font = title_font
    current_row += 2

    # Filters (if any)
    if filters:
        filter_font = Font(name="Calibri", size=10, italic=True)
        ws.cell(row=current_row, column=1, value="Filters applied:").font = Font(name="Calibri", size=10, bold=True)
        current_row += 1
        for k, v in filters.items():
            if v is not None and v != "":
                ws.cell(row=current_row, column=1, value=f"{k}: {v}").font = filter_font
                current_row += 1
        current_row += 1

    # Headers
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=current_row, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border
    
    ws.row_dimensions[current_row].height = 28
    current_row += 1

    # Rows
    for row_data in rows:
        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.border = thin_border
            if isinstance(val, (int, float)):
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")
        current_row += 1

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            # Avoid using title or filters row for length calculations
            if cell.row < 4:
                continue
            if cell.value is not None:
                max_len = max(max_len, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    # Save to buffer
    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    return excel_file
