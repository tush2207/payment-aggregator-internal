/**
 * ============================================================================
 * Central Bank of India - Payment Aggregator Portal
 * Excel Export Utilities using SheetJS (xlsx) and FileSaver
 * Generates structured, professional Excel workbooks (.xlsx) with auto-column sizing.
 * ============================================================================
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Format date string to Indian standard DD/MM/YYYY HH:mm
 */
const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '-';
  }
};

/**
 * Auto-adjust column widths based on cell content lengths
 */
const fitToColumn = (dataRows, headerKeys) => {
  const colWidths = {};
  headerKeys.forEach((key) => {
    colWidths[key] = key.length;
  });

  dataRows.forEach((row) => {
    headerKeys.forEach((key) => {
      const val = row[key];
      const len = val !== null && val !== undefined ? String(val).length : 0;
      if (len > (colWidths[key] || 0)) {
        colWidths[key] = len;
      }
    });
  });

  return headerKeys.map((key) => ({
    wch: Math.max((colWidths[key] || 10) + 4, 12),
  }));
};

/**
 * Export Customer Applications to Excel (.xlsx)
 */
export const exportApplicationsToExcel = (
  applications = [],
  fileName = `CBI_Customer_Applications_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
) => {
  if (!applications || applications.length === 0) {
    throw new Error('No application records available to export.');
  }

  const exportRows = applications.map((app, index) => {
    const statusStr = String(app.status || 'Pending Review').toUpperCase();
    const annualVol =
      app.totalAnnualTransaction ||
      app.aggregateDepositAmt ||
      (app.avgTransactionYearly || 0) * (app.avgTransactionSize || 0) ||
      0;

    return {
      'Sr No.': index + 1,
      'Date & Time': formatDateTime(app.createdAt),
      'Application ID': app.applicationId || '-',
      'Customer / Merchant Name': app.customerName || '-',
      'Account Number': app.accountNo || '-',
      'Category': app.category || '-',
      'Business Category': app.businessCategory || app.merchantCategory || '-',
      'Entity Type': app.entityType || app.businessType || '-',
      'Branch Name': app.branchName ? `${app.branchName} (${app.branchId || '-'})` : (app.branchId ? `Branch ${app.branchId}` : '-'),
      'Region': app.regionName || (app.regionId ? `Region ${app.regionId}` : '-'),
      'Zone': app.zoneName || (app.zoneId ? `Zone ${app.zoneId}` : '-'),
      'Workflow Status': statusStr,
      'Finalized Aggregator': app.finalizedAggregatorName || 'Pending Finalization',
      'Avg Ticket Size (Rs)': app.avgTransactionSize !== null && app.avgTransactionSize !== undefined ? Number(app.avgTransactionSize) : 0,
      'Expected Annual Txns': app.avgTransactionYearly !== null && app.avgTransactionYearly !== undefined ? Number(app.avgTransactionYearly) : 0,
      'Expected Annual Volume (Rs)': Number(annualVol),
      'Rejection Reason': app.reasonOfRejection || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const headerKeys = Object.keys(exportRows[0] || {});
  worksheet['!cols'] = fitToColumn(exportRows, headerKeys);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications Report');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  saveAs(dataBlob, fileName);
  return true;
};

/**
 * Export Payment Aggregators Directory to Excel (.xlsx)
 */
export const exportAggregatorsToExcel = (
  aggregators = [],
  fileName = `CBI_Payment_Aggregators_${new Date().toISOString().slice(0, 10)}.xlsx`
) => {
  if (!aggregators || aggregators.length === 0) {
    throw new Error('No aggregator records available to export.');
  }

  const exportRows = aggregators.map((item, index) => ({
    'Sr No.': index + 1,
    'Aggregator Name': item.aggregatorName || '-',
    'Contact Person': item.contactPersonName || '-',
    'Email Address': item.email || '-',
    'Mobile Number': item.mobileNo || '-',
    'Location': item.location || '-',
    'Active Services': item.services ? item.services.replace(/\|/g, ', ') : '-',
    'Account Status': (item.status || 'Active').toUpperCase(),
    'Onboarded Date': formatDateTime(item.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const headerKeys = Object.keys(exportRows[0] || {});
  worksheet['!cols'] = fitToColumn(exportRows, headerKeys);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Aggregators');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  saveAs(dataBlob, fileName);
  return true;
};

/**
 * Export Help Desk Tickets to Excel (.xlsx)
 */
export const exportHelpDeskToExcel = (
  tickets = [],
  fileName = `CBI_HelpDesk_Tickets_${new Date().toISOString().slice(0, 10)}.xlsx`
) => {
  if (!tickets || tickets.length === 0) {
    throw new Error('No ticket records available to export.');
  }

  const exportRows = tickets.map((item, index) => ({
    'Sr No.': index + 1,
    'Ticket ID': item.ticketId || item.id || '-',
    'Created Date': formatDateTime(item.createdAt),
    'Subject / Issue': item.ticketName || item.subject || '-',
    'Customer / Merchant': item.customerName || '-',
    'Account Number': item.accountNo || '-',
    'Branch Details': item.branchName || '-',
    'Region': item.regionName || '-',
    'Zone': item.zoneName || '-',
    'Priority': (item.priority || 'Medium').toUpperCase(),
    'Status': (item.status || 'Open').toUpperCase(),
    'Assigned To': item.assignedTo || 'Unassigned',
    'Description': item.description || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const headerKeys = Object.keys(exportRows[0] || {});
  worksheet['!cols'] = fitToColumn(exportRows, headerKeys);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Help Desk Tickets');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  saveAs(dataBlob, fileName);
  return true;
};
