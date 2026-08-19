import { applicationSubmission, coforward, customerAcceptance, finalApproval, quoteEvaluation, quoteSubmission, review } from "&src/assets";
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
export const isCO = user_role === 'CO'

// =========== ROLE-BASED NAVIGATION WITH ICONS ==============
export const ROLE_NAV_ACCESS = {
  CO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Manage Aggregator', icon: <Groups2 />, path: APPLICATION_ROUTES_URLS.MANAGE_AGGREGRATOR },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
  ],

  ZO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
  ],

  RO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
  ],


  BO: [
    { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
    { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
  ],
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
  REVIEW_BY_RO: 'approvedbyro',   // ⚠️ used as "review by RO" also
  REVIEW_BY_ZO: 'approvedbyzo',   // ⚠️ used as "review by ZO" also
  QUOTE_SUBMISSION: 'quotesubmission',
  REVIEW_QUOTE: 'reviewquote',
  FINAL_APPROVAL: 'finalapproval',

  // ✅ Approvals
  APPROVED_BY_RO: 'approvedbyro',
  APPROVED_BY_ZO: 'approvedbyzo',
  APPROVED_BY_CO: 'approvedbyco',

  // ❌ Rejections
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
    applicationId: "",
    aggregatorId: "",
    transactionCount: "10%",
    transactionValue: "27%",
    transactionType: "Internet banking",
    transactionTypePercent: "100%",
    isIB: false,
  },
  {
    order: 2,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "SBI",
    transactionTypePercent: "68.61%",
    isIB: true,
    allow: true,
  },
  {
    order: 3,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "HDFC",
    transactionTypePercent: "10.78%",
    isIB: true,
    allow: true,
  },
  {
    order: 4,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "ICICI",
    transactionTypePercent: "5.57%",
    isIB: true,
    allow: true,
  },
  {
    order: 5,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "AXIS",
    transactionTypePercent: "4.47%",
    isIB: true,
    allow: true,
  },
  {
    order: 6,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "OTHERS",
    transactionTypePercent: "10.56%",
    isIB: true,
    allow: true,
  },
  {
    order: 7,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "20%",
    transactionValue: "13%",
    transactionType: "UPI",
    transactionTypePercent: "13%",
    isIB: false,
  },
  {
    order: 8,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "25%",
    transactionValue: "23%",
    transactionType: "Debit card - Rupay",
    isIB: false,
  },
  {
    order: 9,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "",
    transactionValue: "",
    transactionType: "Debit card - Master/Visa (Upto 2000)",
    isIB: false,
    allow: true,
  },
  {
    order: 10,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "40%",
    transactionValue: "25%",
    transactionType: "Debit card - Master/Visa (Above 2000)",
    isIB: false,
    allow: true,
  },
  {
    order: 11,
    applicationId: null,
    aggregatorId: null,
    transactionCount: "5%",
    transactionValue: "12%",
    transactionType: "Credit cards",
    isIB: false,
    allow: true,
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
  mobileNo: '',
  location: '',
  services: '',
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

const safeFormatDate = (dateStr, isCompleted = false, fallbackBaseDate = null) => {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return formatDateAndTime(dateStr);
    }
  }
  if (isCompleted || fallbackBaseDate) {
    const base = fallbackBaseDate ? new Date(fallbackBaseDate) : new Date();
    if (!isNaN(base.getTime())) {
      return formatDateAndTime(base);
    }
    return formatDateAndTime(new Date());
  }
  return null;
};

export const PAYMENT_AGGREGATOR_WORKFLOW = (applicationStatus) => [
  {
    role: 'BO / RO / ZO / CO',
    label: 'Application Submission',
    description: 'Branch submits application and documents.',
    icon: <DescriptionIcon />,
    status: applicationStatus?.isApplicationSubmittedBR ?? true,
    date: safeFormatDate(applicationStatus?.createdAt, true),
    approvedBy: applicationStatus?.createdByBRId ? `ID: ${applicationStatus.createdByBRId}` : 'Branch User',
  },
  {
    role: 'BO / RO / ZO / CO',
    label: 'RO / ZO Review',
    description: 'RO / ZO reviews and uploads RH / ZH Recommendation.',
    icon: <RateReviewIcon />,
    status: applicationStatus?.isReviewByRO || applicationStatus?.isReviewByZO,
    date: safeFormatDate(applicationStatus?.approvedByRODate || applicationStatus?.approvedByZODate || (applicationStatus?.isReviewByRO ? applicationStatus?.createdAt : null), applicationStatus?.isReviewByRO || applicationStatus?.isReviewByZO, applicationStatus?.createdAt),
    approvedBy: applicationStatus?.approvedByROId ? `ID: ${applicationStatus.approvedByROId}` : applicationStatus?.approvedByZOId ? `ID: ${applicationStatus.approvedByZOId}` : 'RO User',
  },
  {
    role: 'BO / RO / ZO / CO',
    label: 'CO Review',
    description: 'CO reviews and forwards details to Aggregator.',
    icon: <ForwardToInboxIcon />,
    status: applicationStatus?.isReviewByCO,
    date: safeFormatDate(applicationStatus?.approvedByCODate || (applicationStatus?.isReviewByCO ? applicationStatus?.createdAt : null), applicationStatus?.isReviewByCO, applicationStatus?.createdAt),
    approvedBy: applicationStatus?.approvedByCOId ? `ID: ${applicationStatus.approvedByCOId}` : 'CO User',
  },
  {
    role: 'AEPA',
    label: 'Quote Submission',
    description: 'Aggregator submits quotes.',
    icon: <UploadIcon />,
    status: applicationStatus?.isQuoteAddedPA || applicationStatus?.isAggregatorAdded,
    date: safeFormatDate(applicationStatus?.quoteAddedPADate || ((applicationStatus?.isQuoteAddedPA || applicationStatus?.isAggregatorAdded) ? applicationStatus?.createdAt : null), (applicationStatus?.isQuoteAddedPA || applicationStatus?.isAggregatorAdded), applicationStatus?.createdAt),
    approvedBy: applicationStatus?.finalizedAggregatorName || 'Aggregator (PA)',
  },
  {
    role: 'CO',
    label: 'Quote Analysis',
    description: 'CO selects suitable quote and applies mark-up.',
    icon: <CalculateIcon />,
    status: applicationStatus?.isQuoteReviewCO || applicationStatus?.isMarkUpAddedCO,
    date: safeFormatDate(applicationStatus?.quoteReviewCODate || ((applicationStatus?.isQuoteReviewCO || applicationStatus?.isMarkUpAddedCO) ? applicationStatus?.createdAt : null), (applicationStatus?.isQuoteReviewCO || applicationStatus?.isMarkUpAddedCO), applicationStatus?.createdAt),
    approvedBy: applicationStatus?.approvedByQuoteId ? `ID: ${applicationStatus.approvedByQuoteId}` : applicationStatus?.approvedByCOId ? `ID: ${applicationStatus.approvedByCOId}` : 'CO User',
  },
  {
    role: 'RO / CO',
    label: 'Customer Acceptance',
    description: 'Customer accepts terms.',
    icon: <ThumbUpAltIcon />,
    status: applicationStatus?.isQuoteAcceptRO,
    date: safeFormatDate(applicationStatus?.quoteAcceptRODate || (applicationStatus?.isQuoteAcceptRO ? applicationStatus?.createdAt : null), applicationStatus?.isQuoteAcceptRO, applicationStatus?.createdAt),
    approvedBy: applicationStatus?.approvedByROId ? `ID: ${applicationStatus.approvedByROId}` : 'Customer',
  },
  {
    role: 'BO / RO / ZO / CO',
    label: 'Final Approval',
    description: 'CO verifies and issues PO.',
    icon: <FactCheckIcon />,
    status: applicationStatus?.isFinalApproved,
    date: safeFormatDate(applicationStatus?.finalApprovedDate || (applicationStatus?.isFinalApproved ? applicationStatus?.createdAt : null), applicationStatus?.isFinalApproved, applicationStatus?.createdAt),
    approvedBy: applicationStatus?.approvedByCOId ? `ID: ${applicationStatus.approvedByCOId}` : 'CO User',
  },
];

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
