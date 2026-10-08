import CenterAlign from "&src/components/CenterAlign";
import StatusChipOrSelect from "&src/components/StatusChipOrSelect";
import { APPLICATION_ROUTES_URLS } from "&src/routes/routesConfig";
import { formatDateAndTime } from "&src/utils";
import { DashboardRounded, Groups2, HelpCenterRounded, Description as DescriptionIcon, RateReview as RateReviewIcon, ForwardToInbox as ForwardToInboxIcon, Upload as UploadIcon, Calculate as CalculateIcon, ThumbUpAlt as ThumbUpAltIcon, FactCheck as FactCheckIcon } from "@mui/icons-material";
import { TextField } from "@mui/material";

export const user_Id = sessionStorage.getItem('userId');


export const user_role = sessionStorage.getItem('role');

export const isBO = user_role === 'BO'
export const isRO = user_role === 'RO'
export const isZO = user_role === 'ZO'
export const isCO = user_role === 'CO' || user_role === 'ADMIN'
export const isAdmin = user_role === 'ADMIN'

// =========== ROLE-BASED NAVIGATION WITH ICONS ==============
export const ROLE_NAV_ACCESS = {
  ADMIN: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Manage Aggregator', icon: <Groups2 />, path: APPLICATION_ROUTES_URLS.MANAGE_AGGREGRATOR },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
    { label: 'Annexures', icon: <DescriptionIcon />, path: APPLICATION_ROUTES_URLS.ANNEXURES },
  ],

  CO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Manage Aggregator', icon: <Groups2 />, path: APPLICATION_ROUTES_URLS.MANAGE_AGGREGRATOR },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
    { label: 'Annexures', icon: <DescriptionIcon />, path: APPLICATION_ROUTES_URLS.ANNEXURES },
  ],

  ZO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
    { label: 'Annexures', icon: <DescriptionIcon />, path: APPLICATION_ROUTES_URLS.ANNEXURES },
  ],

  RO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
    { label: 'Annexures', icon: <DescriptionIcon />, path: APPLICATION_ROUTES_URLS.ANNEXURES },
  ],

  BO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
    { label: 'Annexures', icon: <DescriptionIcon />, path: APPLICATION_ROUTES_URLS.ANNEXURES },
  ],
};

// =========== CENTRAL BANK OF INDIA MASTER LOCATION CONSTANTS ==============
export const CBI_ZONES = [
  'West Zone',
  'MMZO (Mumbai Metro)',
  'North Zone',
  'South Zone',
  'East Zone',
  'Central Zone',
  'FGMO Pune',
  'FGMO Ahmedabad',
  'FGMO Bhopal',
  'FGMO Kolkata',
  'FGMO Delhi',
  'FGMO Patna',
  'FGMO Lucknow',
  'FGMO Hyderabad',
  'FGMO Chennai',
];

export const CBI_REGIONS = [
  'Mumbai Region',
  'Thane Region',
  'Pune Region',
  'Nagpur Region',
  'Nashik Region',
  'Ahmedabad Region',
  'Delhi North Region',
  'Delhi South Region',
  'Bangalore Region',
  'Chennai Region',
  'Hyderabad Region',
  'Kolkata Region',
  'Patna Region',
  'Lucknow Region',
  'Bhopal Region',
  'Jaipur Region',
  'Chandigarh Region',
];

export const CBI_DEFAULT_LOCATIONS = {
  CO: {
    zoneName: 'Central Office',
    zoneId: 0,
    regionName: 'Central Office',
    regionId: 0,
    branchName: 'Central Office',
    branchId: 0,
    locationType: 'CO',
  },
  ADMIN: {
    zoneName: 'Central Office',
    zoneId: 0,
    regionName: 'Central Office',
    regionId: 0,
    branchName: 'Central Office',
    branchId: 0,
    locationType: 'ADMIN',
  },
  ZO: {
    zoneName: 'West Zone',
    zoneId: 1,
    regionName: 'Mumbai Region',
    regionId: 10,
    branchName: 'Zonal Office Mumbai',
    branchId: 1000,
    locationType: 'ZO',
  },
  RO: {
    zoneName: 'West Zone',
    zoneId: 1,
    regionName: 'Mumbai Region',
    regionId: 10,
    branchName: 'Regional Office Mumbai',
    branchId: 1001,
    locationType: 'RO',
  },
  BO: {
    zoneName: 'West Zone',
    zoneId: 1,
    regionName: 'Mumbai Region',
    regionId: 10,
    branchName: 'Chembur Branch',
    branchId: 1002,
    locationType: 'BO',
  },
};


export const WORK_FLOW_STATUS = [
  'applicationSubmitted',
  'quotesubmission',
  'reviewquote',
  'finalapproval',
  'approvedbyro',
  'approvedbyzo',
  'approvedbyco',
  'rejectedbyro',
  'rejectedbyzo',
  'rejectedbyco',
]

export const WORK_FLOW_OPTIONS = {
  SUBMIT_APPLICATION: 'applicationSubmitted',
  REVIEW_BY_RO: 'approvedbyro',   //  used as "review by RO" also
  REVIEW_BY_ZO: 'approvedbyzo',   //  used as "review by ZO" also
  QUOTE_SUBMISSION: 'quotesubmission',
  REVIEW_QUOTE: 'reviewquote',
  FINAL_APPROVAL: 'finalapproval',

  //  Approvals
  APPROVED_BY_RO: 'approvedbyro',
  APPROVED_BY_ZO: 'approvedbyzo',
  APPROVED_BY_CO: 'approvedbyco',

  //  Rejections
  REJECTED_BY_RO: 'rejectedbyro',
  REJECTED_BY_ZO: 'rejectedbyzo',
  REJECTED_BY_CO: 'rejectedbyco',
};

export const deriveApplicationStatus = (app) => {
  if (!app) return "applicationSubmitted";

  const statusLower = (app.status || "").toLowerCase();
  if (statusLower === "rejected" || app.reasonOfRejection) {
    if (statusLower.startsWith("rejectedby")) return app.status;
    return "rejectedbyco";
  }

  if (app.isFinalApproved || statusLower === "finalapproval" || statusLower === "completed") {
    return "finalapproval";
  }

  if (app.isQuoteAcceptRO || statusLower === "quoteaccepted") {
    return "quoteaccepted";
  }

  if (app.isQuoteReviewCO || app.isMarkUpAddedCO || statusLower === "reviewquote") {
    return "reviewquote";
  }

  if (app.isQuoteAddedPA || statusLower === "quotesubmitted") {
    return "quotesubmitted";
  }

  if (app.isAggregatorAdded || statusLower === "quoterequested") {
    return "quoterequested";
  }

  if (app.isReviewByCO || statusLower === "approvedbyco" || statusLower === "sendtoaggregators") {
    return "approvedbyco";
  }

  if (app.isReviewByZO || statusLower === "approvedbyzo") {
    return "approvedbyzo";
  }

  if (app.isReviewByRO || statusLower === "approvedbyro") {
    return "approvedbyro";
  }

  return app.status || "applicationSubmitted";
};

export const CONSENT_TEXT = "I confirm that I have verified and recommend this application.";

// export const CONSENT_TEXT_FOR_BR = "I confirm that the application details are correct and have been clarified with the customer.";

export const CONSENT_TEXT_FOR_BR = "I confirm that all the details and documents are correct. I understand that once submitted, no further changes will be allowed.";

export const PROJECTION_CAL_DETAILS = [
  {
    order: 1,
    id: 1,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "10%",
    transactionValue: "27%",
    transactionType: "Internet banking",
    transactionTypePercent: "100%",
    isIB: false,
    allow: false,
    rate: 0,
    unit: "₹",
    bankUnit: "₹",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 2,
    id: 2,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "SBI",
    transactionTypePercent: "68.61%",
    isIB: true,
    allow: true,
    rate: 0,
    unit: "₹",
    bankUnit: "₹",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 3,
    id: 3,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "HDFC",
    transactionTypePercent: "10.78%",
    isIB: true,
    allow: true,
    rate: 0,
    unit: "₹",
    bankUnit: "₹",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 4,
    id: 4,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "ICICI",
    transactionTypePercent: "5.57%",
    isIB: true,
    allow: true,
    rate: 0,
    unit: "₹",
    bankUnit: "₹",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 5,
    id: 5,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "AXIS",
    transactionTypePercent: "4.47%",
    isIB: true,
    allow: true,
    rate: 0,
    unit: "₹",
    bankUnit: "₹",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 6,
    id: 6,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "OTHERS",
    transactionTypePercent: "10.56%",
    isIB: true,
    allow: true,
    rate: 0,
    unit: "₹",
    bankUnit: "₹",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 7,
    id: 7,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "20%",
    transactionValue: "13%",
    transactionType: "UPI",
    transactionTypePercent: "13%",
    isIB: false,
    allow: false,
    rate: 0,
    unit: "%",
    bankUnit: "%",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 8,
    id: 8,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "25%",
    transactionValue: "23%",
    transactionType: "Debit card - Rupay",
    transactionTypePercent: "23%",
    isIB: false,
    allow: false,
    rate: 0,
    unit: "%",
    bankUnit: "%",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 9,
    id: 9,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "40%",
    transactionValue: "25%",
    transactionType: "Debit card - Master/Visa (Upto 2000)",
    transactionTypePercent: "25%",
    isIB: false,
    allow: true,
    rate: 0,
    unit: "%",
    bankUnit: "%",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 10,
    id: 10,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "Debit card - Master/Visa (Above 2000)",
    transactionTypePercent: "",
    isIB: false,
    allow: true,
    rate: 0,
    unit: "%",
    bankUnit: "%",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  },
  {
    order: 11,
    id: 11,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "5%",
    transactionValue: "12%",
    transactionType: "Credit cards",
    transactionTypePercent: "12%",
    isIB: false,
    allow: true,
    rate: 0,
    unit: "%",
    bankUnit: "%",
    chargesProposed: 0,
    grossAmount: 0,
    vendorShare: 0,
    expectedRevenue: 0,
    estimatedTransactions: 0,
    aggregateAmount: 0,
    isDeleted: false,
    quoteVersion: 1,
    revisionRemarks: null,
  }
];

export const PO_FORM_VALUES = {
  branchName: '',
  regionName: '',
  rccMailId: '',
  rccMobileNo: null,
  rccContactPersonName: '',

  authorisedPersonName: '',
  authorisedPersonDesignation: ''
};

export const APPLICATION_FORM_VALUES = {
  // Customer Application Details
  userType: 'existing',
  customerName: '',
  accountNo: '',
  averageBalance: '',
  email: '',
  mobileNo: '',
  address: '',
  integrateWith: '',
  category: '',
  businessCategory: '',
  customerAcceptanceRequired: true,
  projection: '',
  avgTransactionYearly: '',
  avgTransactionSize: '',
  accountBalanceToday: '',
  isDeleted: false,
  // Files Details
  //BO file
  kycFile: null,
  customerApplicationFile: null,
  //RO file
  rhRecommendationFile: null,

  zhRecommendationFile: null,
  customerAcceptanceFile: null,
  status: "applicationSubmitted",
  // Work Flow Status Details
  isApplicationSubmittedBR: true,
  isReviewByRO: null,
  isReviewByZO: null,
  isAggregatorAdded: null,
  isReviewByCO: null,
  isQuoteAddedPA: null,
  isQuoteReviewCO: null,
  isMarkUpAddedCO: null,
  isQuoteAcceptRO: null,
  isQuoteAcceptReviewByCO: null,
  isFinalApproved: null,
  //For Accepted Quotation Details,
  finalizedAggregatorId: null,
  finalizedAggregatorName: "",
  purchaseOrderId: null,
  createdByBRId: null,
  approvedByROId: null,
  approvedByZOId: null,
  approvedByQuoteId: null,
  approvedByBRId: null,
  ...PO_FORM_VALUES
};

export const AGGREGATOR_FORM_VALUES = {
  aggregatorName: '',
  contactPersonName: '',
  email: '',
  alternateEmail: '',
  mobileNo: '',
  location: '',
  services: '',
  status: 'active',
  password: '',
  is_logged_in: '',
  password_history: '',
  failed_login_attempts: '',
  lockout_until: '',
};

export const HELP_DESK_FORM_VALUES = {
  ticketName: '',
  priority: 'low',
  customerName: '',
  customerEmail: '',
  customerMobileNo: '',
  accountNo: '',
  branchName: '',
  zoneName: '',
  regionName: '',
  description: '',
  status: 'open',
  applicationNo: '',
  remark: ''
};

export const DESIGNATIONS = [
  "Assistant Manager",
  "Manager",
  "Senior Manager",
  "Chief Manager",
  "Assistant General Manager (AGM)",
  "Deputy General Manager (DGM)",
  "General Manager (GM)",

  // Top-level (not scale-based)
  "Chief General Manager",
  "Executive Director",
  "Chairman & Managing Director"
];


export const PAYMENT_PROJECTIONS = [
  'Internet banking',
  'UPI',
  'Credit card',
  'Debit card'
];

/**
 * Helper to safely format ISO/string dates into Bank Standard format (DD-MM-YYYY hh:mm A).
 * Ensures that if a stage is pending or hasn't recorded its own timestamp, it returns null
 * rather than improperly falling back to the initial application creation date.
 *
 * @param {string|Date|null} dateStr - Raw date string or timestamp.
 * @returns {string|null} Formatted date or null if not present/invalid.
 */
const safeFormatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return formatDateAndTime(dateStr);
  }
  return null;
};

/**
 * Derives the 7-stage Payment Aggregator Workflow pipeline with individual stage
 * completion status, genuine stage-specific audit timestamps, and acting authority IDs.
 *
 * @business_rule CBI-PAPG Workflow Standard Operating Procedure:
 * Stage 1: Branch submission (BR/BO)
 * Stage 2: Regional/Zonal recommendation & verification (RO/ZO)
 * Stage 3: Central Office verification & forward to Aggregators (CO)
 * Stage 4: Payment Aggregator quotation submission (AEPA)
 * Stage 5: Central Office commercial analysis & markup application (CO)
 * Stage 6: Customer term acceptance & recommendation (RO/Customer)
 * Stage 7: Competent Authority final sanction & Purchase Order issuance (CO)
 *
 * @param {Object} applicationStatus - The active application data record.
 * @returns {Array<Object>} List of structured stage descriptors for Steppers and audit logs.
 */
export const PAYMENT_AGGREGATOR_WORKFLOW = (applicationStatus) => {
  if (!applicationStatus) return [];

  // Stage 1: Branch Submission
  const isStage1Completed = Boolean(applicationStatus.isApplicationSubmittedBR ?? true);
  const stage1Date = safeFormatDate(applicationStatus.submittedAt || applicationStatus.createdAt);

  // Stage 2: RO / ZO Review
  const isStage2Completed = Boolean(applicationStatus.isReviewByRO || applicationStatus.isReviewByZO);
  const stage2Date = safeFormatDate(
    applicationStatus.approvedByRODate ||
    applicationStatus.approvedByZODate ||
    applicationStatus.roReviewDate ||
    applicationStatus.zoReviewDate ||
    applicationStatus.reviewedAtRO ||
    applicationStatus.reviewedAtZO
  );

  // Stage 3: CO Review
  const isStage3Completed = Boolean(applicationStatus.isReviewByCO);
  const stage3Date = safeFormatDate(
    applicationStatus.approvedByCODate ||
    applicationStatus.coReviewDate ||
    applicationStatus.forwardedToAggregatorDate ||
    applicationStatus.reviewedAtCO
  );

  // Stage 4: Quote Submission by Aggregator
  const isStage4Completed = Boolean(applicationStatus.isQuoteAddedPA || applicationStatus.isAggregatorAdded);
  const stage4Date = safeFormatDate(
    applicationStatus.quoteAddedPADate ||
    applicationStatus.quoteSubmissionDate ||
    applicationStatus.aggregatorQuoteDate
  );

  // Stage 5: Quote Analysis & Markup
  const isStage5Completed = Boolean(applicationStatus.isQuoteReviewCO || applicationStatus.isMarkUpAddedCO);
  const stage5Date = safeFormatDate(
    applicationStatus.quoteReviewCODate ||
    applicationStatus.markupAddedDate ||
    applicationStatus.markupDate
  );

  // Stage 6: Customer Acceptance
  const isStage6Completed = Boolean(applicationStatus.isQuoteAcceptRO);
  const stage6Date = safeFormatDate(
    applicationStatus.quoteAcceptRODate ||
    applicationStatus.customerAcceptanceDate ||
    applicationStatus.acceptedAtRO
  );

  // Stage 7: Final Approval & PO Issuance
  const isStage7Completed = Boolean(applicationStatus.isFinalApproved);
  const stage7Date = safeFormatDate(
    applicationStatus.finalApprovedDate ||
    applicationStatus.poGeneratedDate ||
    applicationStatus.finalApprovalDate ||
    applicationStatus.completedAt
  );

  return [
    {
      role: 'BO / RO / ZO / CO',
      label: 'Application Submission',
      description: 'Branch submits application and documents.',
      icon: <DescriptionIcon />,
      status: isStage1Completed,
      date: stage1Date,
      approvedBy: applicationStatus.createdByBRId ? `ID: ${applicationStatus.createdByBRId}` : 'Branch User',
    },
    {
      role: 'BO / RO / ZO / CO',
      label: 'RO / ZO Review',
      description: 'RO / ZO reviews and uploads RH / ZH Recommendation.',
      icon: <RateReviewIcon />,
      status: isStage2Completed,
      date: stage2Date,
      approvedBy: applicationStatus.approvedByROId
        ? `ID: ${applicationStatus.approvedByROId}`
        : applicationStatus.approvedByZOId
        ? `ID: ${applicationStatus.approvedByZOId}`
        : isStage2Completed
        ? 'RO / ZO User'
        : null,
    },
    {
      role: 'BO / RO / ZO / CO',
      label: 'CO Review',
      description: 'CO reviews and forwards details to Aggregator.',
      icon: <ForwardToInboxIcon />,
      status: isStage3Completed,
      date: stage3Date,
      approvedBy: applicationStatus.approvedByCOId
        ? `ID: ${applicationStatus.approvedByCOId}`
        : isStage3Completed
        ? 'CO User'
        : null,
    },
    {
      role: 'AEPA',
      label: 'Quote Submission',
      description: 'Aggregator submits quotes.',
      icon: <UploadIcon />,
      status: isStage4Completed,
      date: stage4Date,
      approvedBy: applicationStatus.finalizedAggregatorName || (isStage4Completed ? 'Payment Aggregator' : null),
    },
    {
      role: 'CO',
      label: 'Quote Analysis',
      description: 'CO selects suitable quote and applies mark-up.',
      icon: <CalculateIcon />,
      status: isStage5Completed,
      date: stage5Date,
      approvedBy: applicationStatus.approvedByQuoteId
        ? `ID: ${applicationStatus.approvedByQuoteId}`
        : applicationStatus.approvedByCOId
        ? `ID: ${applicationStatus.approvedByCOId}`
        : isStage5Completed
        ? 'CO User'
        : null,
    },
    {
      role: 'RO / CO',
      label: 'Customer Acceptance',
      description: 'Customer accepts terms.',
      icon: <ThumbUpAltIcon />,
      status: isStage6Completed,
      date: stage6Date,
      approvedBy: applicationStatus.customerAcceptedBy || (isStage6Completed ? 'Customer / Branch' : null),
    },
    {
      role: 'BO / RO / ZO / CO',
      label: 'Final Approval',
      description: 'CO verifies and issues PO.',
      icon: <FactCheckIcon />,
      status: isStage7Completed,
      date: stage7Date,
      approvedBy: applicationStatus.finalApprovedBy || (applicationStatus.approvedByCOId ? `ID: ${applicationStatus.approvedByCOId}` : isStage7Completed ? 'CO User' : null),
    },
  ];
};

export const CUSTOMERS_APPLICATION_TABLE_COLUMNS = [
  {
    field: 'id',
    headerName: 'Sr No.',
    width: '10%',
    flex: 0.3,
    align: 'center',
  },
  {
    field: 'customer',
    headerName: 'Customer / Institution',
    width: '25%',
    flex: 1
  },
  {
    field: 'accountNo',
    headerName: 'Account No.',
    width: '10%',
    flex: 1
  },
  // {
  //   field: 'portal',
  //   headerName: 'Portal',
  //   width: '10%',
  //   flex: 1
  // },
  // {
  //   field: 'Projection',
  //   headerName: 'Projection',
  //   width: '10%',
  //   flex: 1,
  // },
  {
    field: 'status',
    headerName: 'Status',
    width: '10%',
    flex: 1,
    renderCell: (params) => (
      <StatusChipOrSelect
        value={params?.row?.status}
        type="workflow"
      />
    ),
  },
];

export const APPLICATION_COLUMNS = [
  "Sr No",
  "Date & Time",
  "Customer Name",
  "Account No",
  "Category",
  "Projections",
  // "Average Transaction",
  // "Average Ticket Size",
  // "Total Annual Transaction",
  // "Total Bank Collection",
  // "Agg Deposit Amount",
  "Status",
  "Actions"
]

export const AGGREGATOR_COLUMNS = [
  "Sr No",
  "Aggregator Code",
  "Aggregator Name",
  // "Average Transaction Yearly",
  // "Average Ticket Size",
  // "Total Estimated Transactions",
  // "Total Aggregate Amount",
  "Total Gross Amount",
  "Total vendor Share",
  "Total Expected Revenue",
  // "Projection Category",
  // "Projections",
  // "Quote Submission",
  "Quote Status",
  // "Actions",
];

export const PROJECTION_COLUMNS_FOR_CO = [
  "Sr No",
  "Share Transaction Count (%)",
  "Share Transaction Value (%)",
  "Type of Transaction",
  "Estimated No of Transactions",
  "Aggregate amount  (%)",
  "Charges proposed",
  "Gross Amount Received",
  "Rate",
  "Vendor Commission Share",
  "Expected Revenue to Bank",
];

export const ACCEPTED_PROJECTION_COLUMNS_FOR_RO = [
  "Sr No",
  "Type of Transaction",
  "Charges proposed",
];

export const PROJECTION_COLUMNS_FOR_RO = [
  "Sr No",
  "Estimated No of Transactions",
  "Charges proposed",
];

export const PROJECTION_COLUMNS_FOR_PA = [
  "Sr No",
  "Transactions Types",
  "Rate",
];

export const UPDATE_PROJECTION_COLUMNS = [
  "Sr No",
  "Type of Transaction",
  "Share Transaction Count (%)",
  "Share Transaction Value (%)",
]

export const MANAGE_AGGREGATOR_TABLE_COLUMNS = [
  {
    field: 'id',
    headerName: 'Sr No.',
    flex: 0.2,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      const index = params.api.getAllRowIds().indexOf(params.id);
      return index + 1;
    },
  },
  {
    field: 'aggregatorName',
    headerName: 'Aggregator Name',
    flex: 0.6,
  },
  {
    field: 'contactPersonName',
    headerName: 'Contact Person Name',
    flex: 0.6,
  },
  {
    field: 'email',
    headerName: 'Contact Person Email',
    flex: 0.5,
  },
  {
    field: 'mobileNo',
    headerName: 'Mobile Number',
    flex: 0.5,
  },
  {
    field: 'services',
    headerName: 'Services',
    flex: 1,
    renderCell: (params) => {
      // Ensure params.value is an array
      const servicesArray = params?.value || [];
      return servicesArray?.length > 0 ? servicesArray?.replace(/\|/g, ", ") : "-"
    },
  },
];

export const HELP_DESK_TABLE_COLUMNS = [
  {
    field: 'id',
    headerName: 'Sr No.',
    flex: 0.2,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      const index = params.api.getAllRowIds().indexOf(params.id);
      return index + 1;
    },
  },
  {
    field: 'createdAt',
    headerName: 'Created At',
    flex: 1,
    renderCell: (params) => (
      formatDateAndTime(params.row.createdAt)
    )
  },
  {
    field: 'ticketName',
    headerName: 'Ticket / Issue / Query',
    flex: 1,
  },
  { field: "accountNo", headerName: "A/C No", flex: 0.5 },
  { field: "customerName", headerName: "Customer Name", flex: 1 },
  { field: "description", headerName: "Description", flex: 2 },
  {
    field: 'priority',
    headerName: 'Priority',
    flex: 0.7,
    renderCell: (params) => (
      <CenterAlign>
        <StatusChipOrSelect value={params?.row?.priority} type="priority" />
      </CenterAlign>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.7,
    renderCell: (params) => (
      <CenterAlign>
        <StatusChipOrSelect value={params?.value} />
      </CenterAlign>
    )
  }
];

export const AGGREGRATOR_DASHBOARD_TABLE_COLUMNS = [
  {
    field: 'id',
    headerName: 'Sr No.',
    flex: 0.3,
    align: 'center',
  },
  {
    field: 'portal',
    headerName: 'Aggregrator',
    flex: 0.6,
  },
  {
    field: 'startDate',
    headerName: 'Start Date',
    flex: 0.5,
  },
  {
    field: 'endDate',
    headerName: 'End Date',
    flex: 0.5,
  },
  // {
  //   field: 'validity',
  //   headerName: 'Validity (Months)',
  //   flex: 0.4,
  // },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.4,
    renderCell: (params) => (
      <StatusChipOrSelect value={params?.row?.status} type="status" />
    ),
  },
];

export const PROJECTION_TABLE_COLUMNS = [
  {
    field: 'id',
    headerName: 'Sr No.',
    flex: 0.3,
    align: 'center',
    renderCell: (params) => {
      const index = params.api.getAllRowIds().indexOf(params.id);
      return index + 1;
    },
  },
  {
    field: 'channels',
    headerName: 'Channels',
    flex: 1,
  },
  {
    field: 'rate',
    headerName: 'Rate',
    flex: 1,
    renderCell: (params) => <TextField sx={{
      marginTop: '5px',
    }} size="small" placeholder="Enter Rate" value={params?.row?.rate} />

  },
];

export const BUSINESS_CATEGORIES = [
  "All",
  "Agriculture",
  "Automotive",
  "Banking & Finance",
  "Construction & Real Estate",
  "Consulting",
  "Consumer Goods",
  "E-commerce",
  "Education & Training",
  "Energy & Utilities",
  "Entertainment & Media",
  "Fashion & Apparel",
  "Food & Beverage",
  "Healthcare & Pharmaceuticals",
  "Hospitality & Travel",
  "Information Technology",
  "Legal Services",
  "Logistics & Transportation",
  "Manufacturing",
  "Marketing & Advertising",
  "Non-Profit & NGOs",
  "Professional Services",
  "Retail",
  "Telecommunications",
  "Textiles",
  "Wholesale & Distribution",
  "Other"
];

export const ENTITY_BUSINESS_CATEGORIES = [
  "Private",
  "Government"
];
