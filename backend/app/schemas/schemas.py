from pydantic import BaseModel
from typing import Optional, Any

class Base64Request(BaseModel):
    data: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DevLoginRequest(BaseModel):
    username: Optional[str] = "145538"
    password: Optional[str] = None
    role: Optional[str] = "CO"
    pfId: Optional[str] = None

class PaymentAggregator(BaseModel):
    aggregatorId : int
    aggregatorName : str
    createdAt : Optional[str] = None
    endDate : Optional[str] = None
    isDeleted : bool = False
    applicationId : int
    totalEstimatedTransactions: Optional[float] = 0.0
    totalAggregateAmount: Optional[float] = 0.0
    totalGrossAmount: Optional[float] = 0.0
    totalVendorShare: Optional[float] = 0.0
    totalExpectedRevenue: Optional[float] = 0.0
    status : Optional[str] = "pending"
    quoteStatus: Optional[str] = None
    sumOfRate : Optional[float] = 0.0
    email: Optional[str] = None
    avgTransactionYearly: Optional[float] = None
    avgTransactionSize: Optional[float] = None
    category: Optional[str] = None

    class Config:
        extra = "allow"

class PaymentAggregatorUpdate(BaseModel):
    aggregatorCode: Optional[int] = None
    aggregatorName : Optional[str] = None
    createdAt: Optional[str] = None
    endDate: Optional[str] = None
    isDeleted: Optional[bool] = False
    applicationId: Optional[int] = None
    totalEstimatedTransactions: Optional[float] = None
    totalAggregateAmount: Optional[float] = None
    totalGrossAmount: Optional[float] = None
    totalVendorShare: Optional[float] = None
    totalExpectedRevenue: Optional[float] = None
    status: Optional[str] = None
    quoteStatus: Optional[str] = None
    sumOfRate : Optional[float] = None

class ManageAggregator(BaseModel):
    aggregatorName : str
    contactPersonName :str
    email : str
    mobileNo : int
    location : str
    services : str
    alternateEmail : Optional[str] = None
    status : Optional[str] = "active"
    isDeleted : bool = False
    
class ManageAggregatorUpdate(BaseModel):
    aggregatorName : Optional[str] = None
    contactPersonName:  Optional[str] = None
    email : Optional[str] = None
    mobileNo : Optional[int] = None
    location : Optional[str] = None
    services : Optional[str] = None
    alternateEmail : Optional[str] = None
    status : Optional[str] = None
    isDeleted : Optional[bool] = False
    
class Applications(BaseModel):
    userType: Optional[str] = None
    customerName: Optional[str] = None
    accountNo: Optional[Any] = None
    averageBalance: Optional[Any] = None
    email: Optional[str] = None
    mobileNo: Optional[Any] = None
    address: Optional[str] = None
    integrateWith: Optional[str] = None
    category: Optional[str] = None
    businessCategory: Optional[str] = None
    customerAcceptanceRequired: Optional[bool] = True
    poMailStatus: Optional[str] = None
    poMailSentAt: Optional[Any] = None
    poMailRecipient: Optional[str] = None
    rejectedBy: Optional[str] = None
    rejectedRole: Optional[str] = None
    rejectedDate: Optional[Any] = None
    avgTransactionYearly: Optional[Any] = None
    avgTransactionSize: Optional[Any] = None 
    accountBalanceToday: Optional[Any] = None
    projection: Optional[str] = None
    customerApplicationFile: Optional[Any] = None
    status: Optional[str] = None
    rhRecommendationFile: Optional[Any] = None
    zhRecommendationFile: Optional[Any] = None
    customerAcceptanceFile: Optional[Any] = None
    kycFile: Optional[Any] = None
    isApplicationSubmittedBR: Optional[bool] = None
    isReviewByRO: Optional[bool] = None
    isReviewByZO: Optional[bool] = None
    isReviewByCO: Optional[bool] = None
    isProjectionAdded: Optional[bool] = None
    isSendForQuoteAccpcetance: Optional[bool] = None
    isAggregatorAdded: Optional[bool] = None
    isQuoteAddedPA: Optional[bool] = None
    isQuoteReviewCO: Optional[bool] = None
    isMarkUpAddedCO: Optional[bool] = None
    isQuoteAcceptRO: Optional[bool] = None
    isQuoteAcceptReviewByCO: Optional[bool] = None
    isFinalApproved: Optional[bool] = None
    isDeleted: Optional[bool] = None
    totalAnnualTransaction: Optional[Any] = None
    totalBankCollection: Optional[Any] = None
    aggregateDepositAmt: Optional[Any] = None
    finalizedAggregatorId: Optional[Any] = None
    finalizedAggregatorName: Optional[str] = None
    purchaseOrderId: Optional[Any] = None
    createdByBRId: Optional[Any] = None
    approvedByROId: Optional[Any] = None
    approvedByZOId: Optional[Any] = None
    approvedByCOId: Optional[Any] = None
    approvedByQuoteId: Optional[Any] = None
    approvedByBRId: Optional[Any] = None
    selectedAggregatorId: Optional[Any] = None
    selectedAggregatorName: Optional[str] = None
    reasonOfRejection: Optional[str] = None
    regionId: Optional[Any] = None
    branchId: Optional[Any] = None
    zoneId: Optional[Any] = None
    rccMailId: Optional[str] = None
    rccMobileNo: Optional[Any] = None
    rccContactPersonName: Optional[str] = None
    authorisedPersonName: Optional[str] = None
    authorisedPersonDesignation: Optional[str] = None
    branchName: Optional[str] = None
    regionName: Optional[str] = None
    zoneName: Optional[str] = None
    approvedByRODate: Optional[Any] = None
    approvedByCODate: Optional[Any] = None
    quoteAddedPADate: Optional[Any] = None
    quoteReviewCODate: Optional[Any] = None
    quoteAcceptRODate: Optional[Any] = None
    finalApprovedDate: Optional[Any] = None

class ApplicationsUpdate(BaseModel):
    userType: Optional[str] = None
    customerName: Optional[str] = None
    accountNo: Optional[Any] = None
    averageBalance: Optional[Any] = None
    email: Optional[str] = None
    mobileNo: Optional[Any] = None
    address: Optional[str] = None
    integrateWith: Optional[str] = None
    category: Optional[str] = None
    businessCategory: Optional[str] = None
    customerAcceptanceRequired: Optional[bool] = None
    poMailStatus: Optional[str] = None
    poMailSentAt: Optional[Any] = None
    poMailRecipient: Optional[str] = None
    rejectedBy: Optional[str] = None
    rejectedRole: Optional[str] = None
    rejectedDate: Optional[Any] = None
    avgTransactionYearly: Optional[Any] = None
    avgTransactionSize: Optional[Any] = None
    accountBalanceToday: Optional[Any] = None
    projection: Optional[str] = None
    customerApplicationFile: Optional[Any] = None
    status: Optional[str] = None
    rhRecommendationFile: Optional[Any] = None
    zhRecommendationFile: Optional[Any] = None
    customerAcceptanceFile: Optional[Any] = None
    currentQuoteVersion: Optional[int] = None
    isNegotiationRequested: Optional[bool] = None
    negotiationRemarks: Optional[str] = None
    negotiationRequestedBy: Optional[str] = None
    negotiationRequestedDate: Optional[Any] = None
    kycFile: Optional[Any] = None
    isApplicationSubmittedBR: Optional[bool] = None
    isReviewByRO: Optional[bool] = None
    isReviewByZO: Optional[bool] = None
    isReviewByCO: Optional[bool] = None
    isProjectionAdded: Optional[bool] = None
    isAggregatorAdded: Optional[bool] = None    
    isQuoteAddedPA: Optional[bool] = None
    isQuoteReviewCO: Optional[bool] = None
    isMarkUpAddedCO: Optional[bool] = None
    isQuoteAcceptRO: Optional[bool] = None
    isQuoteAcceptReviewByCO: Optional[bool] = None
    isFinalApproved: Optional[bool] = None
    isDeleted: Optional[bool] = None
    totalAnnualTransaction: Optional[Any] = None
    totalBankCollection: Optional[Any] = None
    aggregateDepositAmt: Optional[Any] = None
    finalizedAggregatorId: Optional[Any] = None
    finalizedAggregatorName: Optional[str] = None
    purchaseOrderId: Optional[Any] = None
    createdByBRId: Optional[Any] = None
    approvedByROId: Optional[Any] = None
    approvedByZOId: Optional[Any] = None
    approvedByCOId: Optional[Any] = None
    approvedByQuoteId: Optional[Any] = None
    approvedByBRId: Optional[Any] = None
    selectedAggregatorId: Optional[Any] = None
    selectedAggregatorName: Optional[str] = None
    reasonOfRejection: Optional[str] = None
    regionId: Optional[Any] = None
    branchId: Optional[Any] = None
    zoneId: Optional[Any] = None
    rccMailId: Optional[str] = None
    rccMobileNo: Optional[Any] = None
    rccContactPersonName: Optional[str] = None
    authorisedPersonName: Optional[str] = None
    authorisedPersonDesignation: Optional[str] = None
    branchName: Optional[str] = None
    regionName: Optional[str] = None
    zoneName: Optional[str] = None
    approvedByRODate: Optional[Any] = None
    approvedByCODate: Optional[Any] = None
    quoteAddedPADate: Optional[Any] = None
    quoteReviewCODate: Optional[Any] = None
    quoteAcceptRODate: Optional[Any] = None
    finalApprovedDate: Optional[Any] = None

class ProjectionDetails(BaseModel):
    id: Optional[Any] = None
    transactionCount: Optional[Any] = None
    transactionValue: Optional[Any] = None
    transactionType: Optional[str] = None
    transactionTypePercent: Optional[Any] = None
    isIB: Optional[bool] = False
    estimatedTransactions: Optional[Any] = 0.0
    aggregateAmount: Optional[Any] = 0.0
    rate: Optional[Any] = 0.0
    unit: Optional[str] = "₹"
    chargesProposed: Optional[Any] = 0.0
    grossAmount: Optional[Any] = 0.0
    vendorShare: Optional[Any] = 0.0
    expectedRevenue: Optional[Any] = 0.0
    isDeleted: Optional[bool] = False
    applicationId: Optional[int] = None
    aggregatorId: Optional[int] = None
    order: Optional[Any] = None
    allow: Optional[bool] = False
    bankUnit: Optional[str] = "₹"
    quoteVersion: Optional[int] = 1
    revisionRemarks: Optional[str] = None

    class Config:
        extra = "allow"

class ProjectionDetailsUpdate(BaseModel):
    quoteVersion: Optional[int] = None
    revisionRemarks: Optional[str] = None
    transactionCount: Optional[str] = None
    transactionValue: Optional[str] = None
    transactionType: Optional[str] = None
    transactionTypePercent: Optional[str] = None
    isIB: Optional[bool] = False
    estimatedTransactions: Optional[float] = None
    aggregateAmount: Optional[float] = None
    rate: Optional[float] = None
    unit: Optional[str] = None
    chargesProposed: Optional[float] = None
    grossAmount: Optional[float] = None
    vendorShare: Optional[float] = None
    expectedRevenue: Optional[float] = None
    isDeleted: Optional[bool] = None
    applicationId: Optional[int] = None
    aggregatorId: Optional[int] = None
    order : Optional[int] = None
    allow : Optional[bool] = False
    bankUnit: Optional[str] = None

class HelpDeskBase(BaseModel):
    ticketName: str
    customerName: Optional[str] = "Customer"
    branchName: Optional[str] = None
    zoneName: Optional[str] = None
    regionName: Optional[str] = None
    accountNo: Optional[Any] = None
    customerEmail: Optional[str] = None
    customerMobileNo: Optional[Any] = None
    description: Optional[str] = ""
    priority : Optional[str] = "Medium"
    status : Optional[str] = "Open"
    applicationNo: Optional[int] = None
    chats: Optional[str] = None
    remark: Optional[str] = None
    attachmentUrl: Optional[str] = None
    attachmentName: Optional[str] = None

class HelpDeskUpdate(BaseModel):
    ticketName: Optional[str] = None
    customerName: Optional[str] = None
    branchName: Optional[str] = None
    zoneName: Optional[str] = None
    regionName: Optional[str] = None
    accountNo: Optional[Any] = None
    applicationNo: Optional[int] = None
    chats: Optional[str] = None
    customerEmail: Optional[str] = None
    customerMobileNo: Optional[Any] = None
    description: Optional[str] = None
    priority : Optional[str] = None
    status : Optional[str] = None
    remark: Optional[str] = None
    attachmentUrl: Optional[str] = None
    attachmentName: Optional[str] = None

class HelpDeskCreate(HelpDeskBase):
    pass

class HelpDeskResponse(HelpDeskBase):
    id: int
    class Config:
        from_attributes = True

class AuditLogCreate(BaseModel):
    applicationId: Optional[int] = None
    action: str
    stage: Optional[str] = None
    performedBy: Optional[str] = None
    userRole: Optional[str] = None
    details: Optional[str] = None
    ipAddress: Optional[str] = None

class AuditLogResponse(AuditLogCreate):
    id: int
    createdAt: Optional[Any] = None
    class Config:
        from_attributes = True

class AggregatorAuditLogCreate(BaseModel):
    aggregatorId: Optional[int] = None
    aggregatorName: Optional[str] = None
    action: str
    performedBy: Optional[str] = None
    userRole: Optional[str] = "ADMIN"
    details: Optional[str] = None
    ipAddress: Optional[str] = None

class AggregatorAuditLogResponse(AggregatorAuditLogCreate):
    id: int
    createdAt: Optional[Any] = None
    class Config:
        from_attributes = True

