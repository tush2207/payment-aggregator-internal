from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Sequence, LargeBinary, BigInteger, Text
from sqlalchemy.sql import func
from datetime import datetime
from app.database.engine import Base, MSSQLBase

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    username = Column(String(255), unique=True)
    hashedPassword = Column(String(255))

    @property
    def hashed_password(self):
        return self.hashedPassword

    @hashed_password.setter
    def hashed_password(self, value):
        self.hashedPassword = value

class PaymentAggregatorInDB(Base):
    __tablename__ = 'payment_aggregators'
    id = Column(Integer, Sequence('payment_aggregator_id_seq'), primary_key=True)
    aggregatorId = Column(Integer)
    aggregatorName = Column(String(255))
    createdAt = Column(String(255))
    endDate = Column(String(255))
    isDeleted = Column(Boolean, default=False)
    applicationId = Column(Integer)
    totalEstimatedTransactions = Column(Float)
    totalAggregateAmount = Column(Float)
    totalGrossAmount = Column(Float)
    totalVendorShare = Column(Float)
    totalExpectedRevenue = Column(Float)
    status = Column(String(255))
    quoteStatus = Column(String(255))
    sumOfRate = Column(Float, nullable=True)
    email = Column(String(255), nullable=True)
    avgTransactionYearly = Column(Float, nullable=True)
    avgTransactionSize = Column(Float, nullable=True)
    category = Column(String(255), nullable=True)

class ManageAggregatorInDB(Base):
    __tablename__ = 'manage_aggregators'
    aggregatorId = Column(Integer, Sequence('manage_aggregator_id_seq'), primary_key=True)
    aggregatorName = Column(String(255))
    contactPersonName = Column(String(255))
    email = Column(String(255))
    mobileNo = Column(BigInteger)
    location = Column(String(255))
    services = Column(String(255))
    alternateEmail = Column(String(255), nullable=True)
    status = Column(String(50), default="active", nullable=True)
    isDeleted = Column(Boolean, default=False)
    hashedPassword = Column(String(255), nullable=True)
    mustResetPassword = Column(Boolean, default=True, nullable=True)
    failedLoginAttempts = Column(Integer, default=0, nullable=True)
    lockedUntil = Column(DateTime(timezone=True), nullable=True)
    lastLoginAt = Column(DateTime(timezone=True), nullable=True)
    lastLoginIp = Column(String(255), nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.current_timestamp(), nullable=True)

    # Backward compatibility properties
    @property
    def hashed_password(self):
        return self.hashedPassword

    @hashed_password.setter
    def hashed_password(self, value):
        self.hashedPassword = value

    @property
    def must_reset_password(self):
        return self.mustResetPassword

    @must_reset_password.setter
    def must_reset_password(self, value):
        self.mustResetPassword = value

    @property
    def failed_login_attempts(self):
        return self.failedLoginAttempts

    @failed_login_attempts.setter
    def failed_login_attempts(self, value):
        self.failedLoginAttempts = value

    @property
    def locked_until(self):
        return self.lockedUntil

    @locked_until.setter
    def locked_until(self, value):
        self.lockedUntil = value

    @property
    def last_login_at(self):
        return self.lastLoginAt

    @last_login_at.setter
    def last_login_at(self, value):
        self.lastLoginAt = value

    @property
    def last_login_ip(self):
        return self.lastLoginIp

    @last_login_ip.setter
    def last_login_ip(self, value):
        self.lastLoginIp = value

    @property
    def created_at(self):
        return self.createdAt

    @created_at.setter
    def created_at(self, value):
        self.createdAt = value

class ApplicationsInDB(Base):
    __tablename__ = "applications"
    applicationId = Column(Integer, Sequence('applications_id_seq'), primary_key=True)
    userType = Column(String(1020), nullable=True)
    customerName = Column(String(1020), nullable=True)
    accountNo = Column(BigInteger, nullable=True)  
    averageBalance = Column(BigInteger, nullable=True)
    email = Column(String(1020), nullable=True)
    mobileNo = Column(BigInteger, nullable=True)
    address = Column(String(1020), nullable=True)
    integrateWith = Column(String(1020), nullable=True)
    category = Column(String(1020), nullable=True)
    businessCategory = Column(String(255), nullable=True)
    customerAcceptanceRequired = Column(Boolean, default=True, nullable=True)
    poMailStatus = Column(String(50), default="PENDING", nullable=True)
    poMailSentAt = Column(DateTime(timezone=True), nullable=True)
    poMailRecipient = Column(String(255), nullable=True)
    rejectedBy = Column(String(255), nullable=True)
    rejectedRole = Column(String(50), nullable=True)
    rejectedDate = Column(DateTime(timezone=True), nullable=True)
    avgTransactionYearly = Column(BigInteger, nullable=True)
    avgTransactionSize = Column(BigInteger, nullable=True)
    accountBalanceToday = Column(BigInteger, nullable=True)
    customerApplicationFile = Column(Integer, nullable=True)
    status = Column(String(1020), nullable=True)
    rhRecommendationFile = Column(Integer, nullable=True)
    zhRecommendationFile = Column(Integer, nullable=True)
    customerAcceptanceFile = Column(Integer, nullable=True)
    kycFile = Column(Integer, nullable=True)
    projection = Column(String(1020), nullable=True)
    isApplicationSubmittedBR = Column(Boolean, nullable=True)
    isReviewByRO = Column(Boolean, nullable=True)
    isReviewByZO = Column(Boolean, nullable=True)
    isReviewByCO = Column(Boolean, nullable=True)
    isProjectionAdded = Column(Boolean, nullable=True)
    isAggregatorAdded = Column(Boolean, nullable=True)
    isQuoteAddedPA = Column(Boolean, nullable=True)
    isQuoteReviewCO = Column(Boolean, nullable=True)
    isMarkUpAddedCO = Column(Boolean, nullable=True)
    isQuoteAcceptRO = Column(Boolean, nullable=True)
    isQuoteAcceptReviewByCO = Column(Boolean, nullable=True)
    isFinalApproved = Column(Boolean, nullable=True)
    isDeleted = Column(Boolean, nullable=True)
    totalAnnualTransaction = Column(BigInteger, nullable=True)
    totalBankCollection = Column(BigInteger, nullable=True)
    aggregateDepositAmt = Column(BigInteger, nullable=True)
    finalizedAggregatorId = Column(Integer, nullable=True)
    finalizedAggregatorName = Column(String(1020), nullable=True)
    purchaseOrderId = Column(Integer, nullable=True)
    createdByBRId = Column(String(1020), nullable=True)
    approvedByROId = Column(String(1020), nullable=True)
    approvedByZOId = Column(String(1020), nullable=True)
    approvedByCOId = Column(String(1020), nullable=True)
    approvedByQuoteId = Column(String(1020), nullable=True)
    selectedAggregatorId = Column(Integer, nullable=True)
    selectedAggregatorName = Column(String(1020), nullable=True)
    reasonOfRejection = Column(String(1020), nullable=True)
    regionId = Column(Integer, nullable=True)
    branchId = Column(Integer, nullable=True)
    zoneId = Column(Integer, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.current_timestamp())
    rccMailId = Column(String(1020), nullable=True)
    rccMobileNo = Column(BigInteger, nullable=True)
    rccContactPersonName = Column(String(1020), nullable=True)
    authorisedPersonName = Column(String(1020), nullable=True)
    authorisedPersonDesignation = Column(String(1020), nullable=True)
    branchName = Column(String(1020), nullable=True)
    regionName = Column(String(1020), nullable=True)
    zoneName = Column(String(1020), nullable=True)
    currentQuoteVersion = Column(Integer, default=1)
    isNegotiationRequested = Column(Boolean, default=False)
    negotiationRemarks = Column(String(1020), nullable=True)
    negotiationRequestedBy = Column(String(255), nullable=True)
    negotiationRequestedDate = Column(DateTime(timezone=True), nullable=True)
    approvedByRODate = Column(DateTime(timezone=True), nullable=True)
    approvedByCODate = Column(DateTime(timezone=True), nullable=True)
    quoteAddedPADate = Column(DateTime(timezone=True), nullable=True)
    quoteReviewCODate = Column(DateTime(timezone=True), nullable=True)
    quoteAcceptRODate = Column(DateTime(timezone=True), nullable=True)
    finalApprovedDate = Column(DateTime(timezone=True), nullable=True)
    
class ProjectionDetailsInDB(Base):
    __tablename__ = 'projection_details'
    id = Column(Integer, Sequence('projection_details_id_seq'), primary_key=True)
    transactionCount = Column(String(255), nullable=True)
    transactionValue = Column(String(255), nullable=True)
    transactionType = Column(String(255), nullable=True)
    transactionTypePercent = Column(String(255), nullable=True)
    isIB = Column(Boolean, nullable=True)
    estimatedTransactions = Column(Float, nullable=True)
    aggregateAmount = Column(Float, nullable=True)
    rate = Column(Float, nullable=True)
    unit = Column(String(255), nullable=True)
    chargesProposed = Column(Float, nullable=True)
    grossAmount = Column(Float, nullable=True)
    vendorShare = Column(Float, nullable=True)
    expectedRevenue = Column(Float, nullable=True)
    isDeleted = Column(Boolean, nullable=True)
    applicationId = Column(Integer, nullable=True)
    aggregatorId = Column(Integer, nullable=True)
    order = Column(Integer, nullable=True)
    allow = Column(Boolean, nullable=True)
    bankUnit = Column(String(255), nullable=True)
    quoteVersion = Column(Integer, default=1)
    revisionRemarks = Column(String(1020), nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.current_timestamp())

class FileStoreInDB(Base):
    __tablename__ = "files"
    fileId = Column(Integer, Sequence('fileStore_id_seq'), primary_key=True)
    filename = Column(String(256))
    content_type = Column(String(128))
    uploaded_at = Column(DateTime, default=datetime.now)
    file_contents = Column(LargeBinary)
    file_size = Column(Integer)

class HelpDesk(Base):
    __tablename__ = "helpdesk"
    id = Column(Integer, Sequence('helpdesk_details_id_seq'), primary_key=True)
    ticketName = Column(String(150))
    customerName = Column(String(150), nullable=True)
    branchName = Column(String(150), nullable=True)
    zoneName = Column(String(150), nullable=True)
    regionName = Column(String(150), nullable=True)
    accountNo = Column(BigInteger, nullable=True)
    customerEmail = Column(String(150), nullable=True)
    customerMobileNo = Column(BigInteger, nullable=True)
    description = Column(Text, nullable=True)
    priority = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)
    createdAt = Column(DateTime, server_default=func.current_timestamp())
    updatedAt = Column(DateTime, onupdate=func.current_timestamp())
    applicationNo = Column(Integer, nullable=True)
    chats = Column(Text, nullable=True)
    remark = Column(Text, nullable=True)
    attachmentUrl = Column("ATTACHMENTURL", String(512), nullable=True)
    attachmentName = Column("ATTACHMENTNAME", String(256), nullable=True)
    attachments = Column(Text, nullable=True) # JSON array of {fileId, fileName, url, size}
    changedFields = Column(Text, nullable=True) # JSON of fields modified or clarifications made
    targetOffice = Column(String(50), default="BO", nullable=True) # 'BO', 'RO', 'ZO', 'CO'
    queryType = Column(String(100), default="APPLICATION_QUERY", nullable=True)

class VEmployeeAllDetailsInDB(MSSQLBase):
    __tablename__ = "VEmployeeAllDetails"
    __table_args__ = {"schema": "dbo"}
    Name = Column(String)
    EmployeeId = Column(Integer, primary_key=True)
    Branch_Name = Column(String)
    LocationType = Column(String)
    Locationid = Column(Integer)
    RegionId = Column(Integer)
    Region_Name = Column(String)
    ZoneId = Column(Integer)
    Zone_Name = Column(String)
    email_addr = Column(String)
    phone = Column(String)
    deptDescription = Column(String)
    Designation = Column(String)
    GRADE = Column(String)
    Active = Column(String)
    deptCd = Column(String)

class ApplicationAuditLogInDB(Base):
    __tablename__ = 'application_audit_logs'
    id = Column(Integer, Sequence('audit_log_id_seq'), primary_key=True)
    applicationId = Column(Integer, nullable=True)
    action = Column(String(255), nullable=False)
    stage = Column(String(255), nullable=True)
    performedBy = Column(String(255), nullable=True)
    userRole = Column(String(255), nullable=True)
    details = Column(String(2000), nullable=True)
    ipAddress = Column(String(255), nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.current_timestamp())

class NotificationInDB(Base):
    __tablename__ = 'app_notifications'
    id = Column(Integer, Sequence('notif_id_seq'), primary_key=True)
    applicationId = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(String(1020), nullable=False)
    type = Column(String(50), default="info")  # 'info', 'success', 'warning', 'error'
    stage = Column(String(100), nullable=True)
    targetRole = Column(String(50), nullable=True)  # 'BO', 'RO', 'ZO', 'CO', 'ALL'
    targetUserId = Column(String(255), nullable=True)
    branchName = Column(String(255), nullable=True)
    regionName = Column(String(255), nullable=True)
    zoneName = Column(String(255), nullable=True)
    isRead = Column(Boolean, default=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.current_timestamp())

class AggregatorAuditLogInDB(Base):
    __tablename__ = 'aggregator_audit_logs'
    id = Column(Integer, Sequence('agg_audit_log_id_seq'), primary_key=True)
    aggregatorId = Column(Integer, nullable=True)
    aggregatorName = Column(String(255), nullable=True)
    action = Column(String(255), nullable=False)
    performedBy = Column(String(255), nullable=True)
    userRole = Column(String(50), nullable=True)
    details = Column(String(2000), nullable=True)
    ipAddress = Column(String(255), nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.current_timestamp())

# Automatically ensure all tables and migrations are initialized whenever models are loaded
try:
    from app.database.engine import init_db
    init_db()
except Exception as _e:
    pass



