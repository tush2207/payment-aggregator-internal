from pydantic import BaseModel
from typing import Optional, Any

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DevLoginRequest(BaseModel):
    username: str

class PaymentAggregator(BaseModel):
    aggregatorId : int
    aggregatorName : str
    createdAt : str = None
    endDate : str
    isDeleted : bool = False
    applicationId : int
    totalEstimatedTransactions: float
    totalAggregateAmount: float
    totalGrossAmount: float
    totalVendorShare: float
    totalExpectedRevenue: float
    status : str
    quoteStatus: Optional[str] = None
    sumOfRate : float

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
    isDeleted : bool
    
class ManageAggregatorUpdate(BaseModel):
    aggregatorName : Optional[str] = None
    contactPersonName:  Optional[str] = None
    email : Optional[str] = None
    mobileNo : Optional[int] = None
    location : Optional[str] = None
    services : Optional[str] = None
    isDeleted : Optional[bool] = False
    
class Applications(BaseModel):
    userType: str
    customerName: str
    accountNo: int
    averageBalance : int
    email: str
    mobileNo : int
    address : str
    integrateWith : str
    category : str
    avgTransactionYearly : int
    avgTransactionSize : int 
    accountBalanceToday : int
    projection : str = None
    customerApplicationFile : Optional[Any] = None
    status : str
    rhRecommendationFile : Optional[Any] = None
    zhRecommendationFile : Optional[Any] = None
    customerAcceptanceFile : Optional[Any] = None
    kycFile : Optional[Any] = None
    isApplicationSubmittedBR : Optional[bool] = None
    isReviewByRO : Optional[bool] = None
    isReviewByZO : Optional[bool] = None
    isReviewByCO : Optional[bool] = None
    isAggregatorAdded : Optional[bool] = None
    isQuoteAddedPA : Optional[bool] = None
    isQuoteReviewCO : Optional[bool] = None
    isMarkUpAddedCO : Optional[bool] = None
    isQuoteAcceptRO : Optional[bool] = None
    isQuoteAcceptReviewByCO : Optional[bool] = None
    isFinalApproved : Optional[bool] = None
    isDeleted : Optional[bool] = None
    totalAnnualTransaction : int = None
    totalBankCollection:int = None
    aggregateDepositAmt:int = None
    finalizedAggregatorId:  Optional[Any] = None
    finalizedAggregatorName :  Optional[str] = None
    purchaseOrderId : Optional[Any] = None
    createdByBRId : Optional[Any] = None
    approvedByROId : Optional[Any] = None
    approvedByZOId : Optional[Any] = None
    approvedByCOId : Optional[Any] = None
    approvedByQuoteId : Optional[Any] = None
    selectedAggregatorId : Optional[Any] = None
    selectedAggregatorName : Optional[str] = None
    reasonOfRejection: Optional[str] = None
    regionId :  Optional[Any] = None
    branchId :  Optional[Any] = None
    zoneId :  Optional[Any] = None
    rccMailId: Optional[str] = None
    rccMobileNo: Optional[int] = None
    rccContactPersonName: Optional[str] = None
    authorisedPersonName: Optional[str] = None
    authorisedPersonDesignation: Optional[str] = None
    branchName:  Optional[str] = None
    regionName:  Optional[str] = None

class ApplicationsUpdate(BaseModel):
    userType: Optional[str] = None
    customerName: Optional[str] = None
    accountNo: Optional[int] = None
    averageBalance: Optional[int] = None
    email: Optional[str] = None
    mobileNo: Optional[int] = None
    address: Optional[str] = None
    integrateWith: Optional[str] = None
    category: Optional[str] = None
    avgTransactionYearly: Optional[int] = None
    avgTransactionSize: Optional[int] = None
    accountBalanceToday: Optional[int] = None
    projection: Optional[str] = None
    customerApplicationFile: Optional[Any] = None
    status: Optional[str] = None
    rhRecommendationFile: Optional[Any] = None
    zhRecommendationFile: Optional[Any] = None
    customerAcceptanceFile : Optional[Any] = None
    kycFile: Optional[Any] = None
    isApplicationSubmittedBR: Optional[bool] = None
    isReviewByRO: Optional[bool] = None
    isReviewByZO: Optional[bool] = None
    isReviewByCO: Optional[bool] = None
    isAggregatorAdded: Optional[bool] = None    
    isQuoteAddedPA: Optional[bool] = None
    isQuoteReviewCO: Optional[bool] = None
    isMarkUpAddedCO: Optional[bool] = None
    isQuoteAcceptRO: Optional[bool] = None
    isQuoteAcceptReviewByCO: Optional[bool] = None
    isFinalApproved: Optional[bool] = None
    isDeleted: Optional[bool] = None
    totalAnnualTransaction: Optional[int] = None
    totalBankCollection: Optional[int] = None
    aggregateDepositAmt: Optional[int] = None
    finalizedAggregatorId: Optional[Any] = None
    finalizedAggregatorName: Optional[str] = None
    purchaseOrderId: Optional[Any] = None
    createdByBRId : Optional[Any] = None
    approvedByROId : Optional[Any] = None
    approvedByZOId : Optional[Any] = None
    approvedByCOId : Optional[Any] = None
    approvedByQuoteId : Optional[Any] = None
    selectedAggregatorId : Optional[Any] = None
    selectedAggregatorName : Optional[str] = None
    reasonOfRejection: Optional[str] = None
    regionId :  Optional[Any] = None
    branchId :  Optional[Any] = None
    zoneId :  Optional[Any] = None
    rccMailId: Optional[str] = None
    rccMobileNo: Optional[int] = None
    rccContactPersonName: Optional[str] = None
    authorisedPersonName: Optional[str] = None
    authorisedPersonDesignation: Optional[str] = None
    branchName:  Optional[str] = None
    regionName:  Optional[str] = None

class ProjectionDetails(BaseModel):
    transactionCount : Any
    transactionValue : Any
    transactionType : str
    transactionTypePercent : Any
    isIB : bool
    estimatedTransactions : float
    aggregateAmount : float
    rate : float
    unit : str
    chargesProposed : float
    grossAmount : float
    vendorShare : float
    expectedRevenue : float
    isDeleted : Optional[bool] = False
    applicationId : Optional[int] = None
    aggregatorId : Optional[int] = None
    order : Optional[int] = None
    allow : bool = False
    bankUnit: str

class ProjectionDetailsUpdate(BaseModel):
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
    customerName: str
    branchName: str
    zoneName: str
    regionName: str
    accountNo: int
    customerEmail: Optional[str] = None
    customerMobileNo: Optional[int] = None
    description: str
    priority : str
    status : str
    applicationNo: int
    chats: Optional[str] = None
    remark: Optional[str] = None

class HelpDeskUpdate(BaseModel):
    ticketName: Optional[str] = None
    customerName: Optional[str] = None
    branchName: Optional[str] = None
    zoneName: Optional[str] = None
    regionName: Optional[str] = None
    accountNo: Optional[int] = None
    applicationNo: Optional[int] = None
    chats: Optional[str] = None
    customerEmail: Optional[str] = None
    customerMobileNo: Optional[int] = None
    description: Optional[str] = None
    priority : Optional[str] = None
    status : Optional[str] = None
    remark: Optional[str] = None

class HelpDeskCreate(HelpDeskBase):
    pass

class HelpDeskResponse(HelpDeskBase):
    id: int
    class Config:
        orm_mode = True
