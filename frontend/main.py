from fastapi import FastAPI, Depends,status,File,UploadFile,Form
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse,FileResponse
import json
from typing import List
from typing import Any
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import StreamingResponse
from datetime import date
import io
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, DateTime, Float, and_, Sequence, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker,Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.schema import CreateSequence
from sqlalchemy.exc import DBAPIError
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta,timezone
import base64
import jinja2
from fastapi.responses import HTMLResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
from fastapi.responses import FileResponse
from sqlalchemy import Table
import os
import pdfkit
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from ldap3 import Server, Connection, ALL, NTLM, ALL_ATTRIBUTES
from typing import Optional
from sqlalchemy.sql import func
import config
from fastapi.templating import Jinja2Templates
# import fitz
# import pdfplumber

from fastapi.staticfiles import StaticFiles
app = FastAPI(docs_url=None, redoc_url=None)
from fastapi.openapi.docs import get_swagger_ui_html

origins = [
    "http://localhost:5173",      # React local dev
    "http://127.0.0.1:5173",
    "http://yourserverip:5173",   # If frontend runs on same server IP
    "https://yourdomain.com"      # If you have a deployed domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # or ["*"] to allow all (not for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/dist", StaticFiles(directory="dist"), name="dist")
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# --------------------- LDAP Code starts -------------------
security = HTTPBasic()

# -------------------- LDAP Config --------------------
LDAP_SERVER = config.LDAP_SERVER
LDAP_BASE_DN = "DC=CBI,DC=CO,DC=IN"
LDAP_USER_DN = "CN=Users," + LDAP_BASE_DN  # adjust as per your LDAP tree

# Example: if your users log in as `username@example.com` or `EXAMPLE\\username`
# configure accordingly


# -------------------- Helper Function --------------------
def ldap_authenticate(username: str, password: str) -> bool:
    """
    Try to authenticate a user against the LDAP server.
    Returns True if successful, False otherwise.
    """
    user_dn = f"CN={username},{LDAP_USER_DN}"  # change this based on your LDAP structure
    server = Server(LDAP_SERVER, get_info=ALL)

    try:
        # Attempt bind (login)
        # conn = Connection(server, user=user_dn, password=password, authentication=NTLM, auto_bind=True)
        # conn.search(LDAP_BASE_DN, f"(sAMAccountName={username})", attributes=ALL_ATTRIBUTES)
        # conn.unbind()
        # return True
        server = Server('ldaps://CBI.CO.IN', get_info=ALL , use_ssl= True)
        user = f'CBI\\{username}'
        conn= Connection(server,user=user,password=password,auto_bind=True)
        print(f'ladP CONNECTION :{conn}')
        return True
    except Exception as e:
        print(f"LDAP auth failed for user: {e}")
        return False ## revert to False on go live


# -------------------- Dependency --------------------
def authenticate_user(credentials: HTTPBasicCredentials = Depends(security)):
    if not ldap_authenticate(credentials.username, credentials.password):
        raise HTTPException(status_code=401, detail="Invalid LDAP credentials")
    return credentials.username
# -------------------- Routes --------------------



@app.get("/secure-data")
def secure_data(user: str = Depends(authenticate_user)):
    return {"message": f"Hello {user}, you are authenticated via LDAP!"}


@app.post("/ldaplogin")
def login(username: str = Form(...), password: str = Form(...)):
    if ldap_authenticate(username, password):
        return {"message": f"Welcome {username}, authentication successful!"}
    raise HTTPException(status_code=401, detail="Invalid LDAP credentials")

# --------------------- LDAP Code ends -------------------
@app.get("/")
async def serve_react():
    return FileResponse("dist/index.html")

@app.get ("/docs" , include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
    openapi_url = app.openapi_url,
    title="PAWS api docs",
    swagger_js_url="/static/swagger-ui-bundle.js",
    swagger_css_url="/static/swagger-ui.css"
    )

# SQLAlchemy model
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, Sequence('user_id_seq'), primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))

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
    status = Column(String(255))
    quoteStatus = Column(String(255))
    sumOfRate = Column(Float, nullable=True)

class ManageAggregatorInDB(Base):
    __tablename__ = 'manage_aggregators'
    aggregatorId = Column(Integer, Sequence('manage_aggregator_id_seq'), primary_key=True)
    aggregatorName = Column(String(255))
    email = Column(String(255))
    mobileNo = Column(Integer)
    location = Column(String(255))
    services = Column(String(255))
    isDeleted = Column(Boolean, default=False)

class ApplicationsInDB(Base):
    __tablename__ = "applications"  # Name of the database table

    applicationId = Column(Integer,Sequence('applications_id_seq'), primary_key=True)  # Add a primary key for good practice

    userType = Column(String(255), nullable=True)
    customerName = Column(String(255), nullable=True)
    accountNo = Column(Integer, nullable=True)  
    averageBalance = Column(Integer, nullable=True)
    email = Column(String(255), nullable=True)
    mobileNo = Column(Integer, nullable=True)
    address = Column(String(255), nullable=True)
    integrateWith = Column(String(255), nullable=True)
    category = Column(String(255), nullable=True)
    avgTransactionYearly = Column(Integer, nullable=True)
    avgTransactionSize = Column(Integer, nullable=True)
    accountBalanceToday = Column(Integer, nullable=True)
    customerApplicationFile = Column(Integer, nullable=True)
    status = Column(String(255), nullable=True)
    rhRecommendationFile = Column(Integer, nullable=True)
    zhRecommendationFile = Column(Integer, nullable=True)
    customerAcceptanceFile = Column(Integer, nullable=True)
    kycFile = Column(Integer, nullable=True)
    projection= Column(String(255), nullable=True)
    isApplicationSubmittedBR = Column(Boolean, nullable=True)
    isReviewByRO = Column(Boolean, nullable=True)
    isReviewByZO = Column(Boolean, nullable=True)
    isReviewByCO = Column(Boolean, nullable=True)
    isAggregatorAdded = Column(Boolean, nullable=True)
    isQuoteAddedPA = Column(Boolean, nullable=True)
    isQuoteReviewCO = Column(Boolean, nullable=True)
    isMarkUpAddedCO = Column(Boolean, nullable=True)
    isQuoteAcceptRO = Column(Boolean, nullable=True)
    isQuoteAcceptReviewByCO = Column(Boolean, nullable=True)
    isFinalApproved = Column(Boolean, nullable=True)
    isDeleted = Column(Boolean, nullable=True)
    totalAnnualTransaction = Column(Integer, nullable=True)
    totalBankCollection = Column(Integer, nullable=True)
    aggregateDepositAmt = Column(Integer, nullable=True)
    finalizedAggregatorId = Column(Integer, nullable=True)
    finalizedAggregatorName = Column(String(255), nullable=True)
    purchaseOrderId =  Column(Integer, nullable=True)
    createdByBRId = Column(String(255), nullable=True)
    approvedByROId  = Column(String(255), nullable=True)
    approvedByZOId  = Column(String(255), nullable=True)
    approvedByCOId  = Column(String(255), nullable=True)
    approvedByQuoteId  = Column(String(255), nullable=True)
    selectedAggregatorId  = Column(Integer, nullable=True)
    selectedAggregatorName  = Column(String(255), nullable=True)
    reasonOfRejection  = Column(String(255), nullable=True)
    regionId = Column(Integer, nullable=True)
    branchId = Column(Integer, nullable=True)
    zoneId = Column(Integer, nullable=True)
    createdAt = Column( DateTime(timezone=True), server_default = func.current_timestamp())

class ProjectionDetailsInDB(Base):
    __tablename__ = 'projection_details'
    id = Column(Integer,Sequence('projection_details_id_seq'), primary_key=True)  # Add a primary key for good practice
    
    transactionCount= Column(String(255), nullable=True)
    transactionValue= Column(String(255), nullable=True)
    transactionType= Column(String(255), nullable=True)
    transactionTypePercent= Column(String(255), nullable=True)
    isIB = Column(Boolean, nullable=True)
    # ibAggregateAmount = Column(Float, nullable=True)
    # ibEstimatedTransactions = Column(Float, nullable=True)
    estimatedTransactions = Column(Float, nullable=True)
    aggregateAmount = Column(Float, nullable=True)
    rate= Column(Float, nullable=True)
    unit= Column(String(255), nullable=True)
    chargesProposed= Column(Float, nullable=True)
    grossAmount= Column(Float, nullable=True)
    vendorShare= Column(Float, nullable=True)
    expectedRevenue= Column(Float, nullable=True)
    isDeleted= Column(Boolean, nullable=True)
    applicationId= Column(Integer, nullable=True)
    aggregatorId= Column(Integer, nullable=True)
    order = Column(Integer, nullable=True)
    allow = Column(Boolean, nullable=True)

class FileStoreInDB(Base):
    __tablename__ = "files"
    fileId = Column(Integer,Sequence('fileStore_id_seq'), primary_key=True)
    filename = Column(String(256))
    content_type = Column(String(128))
    uploaded_at = Column(DateTime, default=datetime.now)
    file_contents = Column(LargeBinary)
    file_size = Column(Integer)

# Pydantic models

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

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
    email : str
    mobileNo : int
    location : str
    services : str
    isDeleted : bool
    
class ManageAggregatorUpdate(BaseModel):
    aggregatorName : Optional[str] = None
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
    projection : str = None
    isApplicationSubmittedBR : Optional[bool] = None
    isReviewByRO : Optional[bool] = None
    isReviewByZO : Optional[bool] = None
    isReviewByCO : Optional[bool] = None
    isAggregatorAdded : Optional[bool] = None # chnaged from : Optional[bool]l to Any
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

class ProjectionDetails(BaseModel):
    transactionCount : Any
    transactionValue : Any
    transactionType : str
    transactionTypePercent : Any
    isIB : bool
    # ibAggregateAmount : float
    # ibEstimatedTransactions : float
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

class ProjectionDetailsUpdate(BaseModel):
    transactionCount: Optional[str] = None
    transactionValue: Optional[str] = None
    transactionType: Optional[str] = None
    transactionTypePercent: Optional[str] = None
    isIB: Optional[bool] = False
    # ibAggregateAmount: Optional[float] = None
    # ibEstimatedTransactions: Optional[float] = None
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

# Security
with open("private_key.pem", "rb") as f:
    private_key = f.read()
with open("public_key.pem", "rb") as f:
    public_key = f.read()
ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database setup
# Oracle database connection setup
engine = create_engine(config.ORACLE_CONNECTION_STRING,echo=True)
Base.metadata.create_all(engine)

try:
    with engine.connect() as connection:
        trans = connection.begin()
        connection.execute(CreateSequence(Sequence('user_id_seq')))
        connection.execute(CreateSequence(Sequence('payment_aggregator_id_seq')))
        trans.commit()
except DBAPIError as e:
    if "ORA-00955" in str(e):
        # name is already used by an existing object, ignore.
        pass
    else:
        raise

SessionLocal = sessionmaker(bind=engine, autocommit = False , autoflush = False)

# --- MS SQL CONNECTION ---
# Using ODBC connection string
# MSSQL_DATABASE_URL = (
#     "mssql+pyodbc://username:password@server_name:1433/database_name"
#     "?driver=ODBC+Driver+17+for+SQL+Server"
# )
MSSQL_DATABASE_URL = (
    config.MSSQL_CONNECTION_STRING
)

mssql_engine = create_engine(MSSQL_DATABASE_URL)
MSSQLSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=mssql_engine)
MSSQLBase = declarative_base()

class VEmployeeAllDetailsInDB(MSSQLBase):
    __tablename__ = "VEmployeeAllDetails"
    __table_args__ = {"schema":"dbo"}

    Name = Column(String)
    EmployeeId = Column(Integer,primary_key=True)
    Branch_Name = Column(String)
    LocationType = Column(String)      # key = role in response json
    Locationid = Column(Integer)
    RegionId = Column(Integer)
    Region_Name = Column(String)
    ZoneId =  Column(Integer)
    Zone_Name = Column(String)
    email_addr = Column(String)
    phone = Column(String)
    deptDescription  = Column(String) # key = location in response json
    Designation = Column(String)
    GRADE = Column(String)
    Active = Column(String)


# ----------------------------------------------
def get_mssql_db():
    db = MSSQLSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# ----------------------------------------------
# Security functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, private_key, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_mssql_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, public_key, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(VEmployeeAllDetailsInDB).filter(
        VEmployeeAllDetailsInDB.EmployeeId == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def decode_base64(data: str) -> str:
    # Decode from base64
    decoded_bytes = base64.b64decode(data)
    # Convert bytes to string (utf-8) after decoding
    return decoded_bytes.decode('utf-8')

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    decoded_username = decode_base64(form_data.username)
    decoded_password = decode_base64(form_data.password)
    if not ldap_authenticate(decoded_username, decoded_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": decoded_username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=UserCreate)
def create_user(user: UserCreate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return user

# Central Bank users apis start 

@app.get("/api/get-user-details/{pfId}")
def read_employees(pfId,db: Session = Depends(get_mssql_db),current_user: User = Depends(get_current_user)):
        employee = db.query(VEmployeeAllDetailsInDB).filter(and_(
            VEmployeeAllDetailsInDB.EmployeeId == pfId,VEmployeeAllDetailsInDB.Active == 'Y')).first()
    
        response_dict = {
            "employeeName": employee.Name ,
            "pfId": employee.EmployeeId ,
            "role": employee.LocationType ,
            "branchId" : employee.Locationid,
            "branchName": employee.Branch_Name ,
            "regionId": employee.RegionId,
            "regionName": employee.Region_Name,
            "zoneId" : employee.ZoneId,
            "zoneName": employee.Zone_Name,
            "email": employee.email_addr,
            "mobileNo": employee.phone,
            "department": employee.deptDescription,
            "scale": employee.GRADE,
            "designation" : employee.Designation
        }
        # Return the response as a JSONResponse
        return response_dict
      

# Central Bank users apis end 

# ManageAggregator CRUD operations api start

@app.post('/api/manage-aggregator',status_code=status.HTTP_201_CREATED)
def create_manageAggregator(manageAggregator:ManageAggregator, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    new_manageAggregator = ManageAggregatorInDB(**manageAggregator.dict())
    db.add(new_manageAggregator)
    db.commit()
    db.refresh(new_manageAggregator)

    response_dict = {
        "aggregatorId": new_manageAggregator.aggregatorId,
        "aggregatorName": new_manageAggregator.aggregatorName,
        "email": new_manageAggregator.email,
        "mobileNo": new_manageAggregator.mobileNo,
        "location": new_manageAggregator.location,
        "services": new_manageAggregator.services,
        "isDeleted": new_manageAggregator.isDeleted,
        "status" : "Created"
    }
    return JSONResponse(content=response_dict, media_type="application/json")


@app.get('/api/single-manage-aggregator/{manageAggregatorId}')
def get_single_manageAggregator(manageAggregatorId, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.isDeleted == False , ManageAggregatorInDB.aggregatorId == manageAggregatorId)).first()
    return manageAggregator

@app.get('/api/all-manage-aggregator')
def get_all_manageAggregator(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    manageAggregator = db.query(ManageAggregatorInDB).filter(and_(ManageAggregatorInDB.isDeleted == False)).all()
    #paymentAggregators = db.query(PaymentAggregator).all()
    return manageAggregator

@app.delete('/api/manage-aggregator/{id}')
def delete_manageAggregator(id, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    existing_manageAggregator = db.query(ManageAggregatorInDB).filter(ManageAggregatorInDB.aggregatorId == id).first()
    existing_manageAggregator.isDeleted = True
    db.commit()
    db.refresh(existing_manageAggregator)
    response_dict = {
        "aggregatorCode": existing_manageAggregator.aggregatorId,
        "status" : "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@app.put('/api/manage-aggregator/{id}')
def update_manageAggregator(id, new_manageAggregator: ManageAggregatorUpdate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    existing_manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.aggregatorId == id, ManageAggregatorInDB.isDeleted == False)).first()
    if not existing_manageAggregator:
        raise HTTPException(status_code=404, detail="Manage Aggregator not found")

    # Update the values from new_blog
    for key, value in new_manageAggregator.__dict__.items():
        if value is not None:  # Only update if a value is provided in the request
            setattr(existing_manageAggregator, key, value)

    db.commit()
    db.refresh(existing_manageAggregator)
    
    response_dict = {
        "aggregatorCode": existing_manageAggregator.aggregatorId,
        "status" : "Updated"
    }

    return JSONResponse(content=response_dict, media_type="application/json")

# ManageAggregator CRUD operations api end

# PaymentAggregator CRUD operations api start

@app.post('/api/applications/payment-aggregators',status_code=status.HTTP_201_CREATED)
def create_paymentAggregator(paymentAggregatorsList:List[PaymentAggregator], db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    db_objects = []
        
    for aggregator in paymentAggregatorsList:
        db_object = PaymentAggregatorInDB(**aggregator.dict())
        db_objects.append(db_object)

    db.add_all(db_objects)
    db.commit()
    
    for aggregator in db_objects:
        db.refresh(aggregator)
    
    return db_objects

# @app.get('/api/applications/{applicationId}/aggregators') #rolled back
@app.get('/api/all-payment-aggregator/{applicationId}')  
def get_all_paymentAggregator(applicationId,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId )).all()

    for aggregator in paymentAggregators:
        # print("************************************")
        # print(aggregator.endDate)
        # print(aggregator.status)
        # print("************************************")
        dt1_str = aggregator.endDate # dt1_str is enddate value from db table row
        dt1 = datetime.strptime(dt1_str,"%Y-%m-%dT%H:%M:%S.%fZ")
        dt1 = dt1.replace(tzinfo=timezone.utc)
        dt2 = datetime.now(timezone.utc)
        if dt1 < dt2:
            aggregator.status = "expired"

        # print(aggregator.__dict__)

    db.commit()
    
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId )).all()

    return paymentAggregators


@app.get('/api/single-payment-aggregator/{paymentAggregatorId}')
def get_single_paymentAggregator(paymentAggregatorId, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    paymentAggregator = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False , PaymentAggregatorInDB.aggregatorId == paymentAggregatorId)).first()
    #paymentAggregators = db.query(PaymentAggregator).all()
    return paymentAggregator


@app.delete('/api/payment-aggregator/{id}')
def delete_paymentAggregator(id, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    existing_PaymentAggregator = db.query(PaymentAggregatorInDB).filter(PaymentAggregatorInDB.aggregatorId == id).first()
    existing_PaymentAggregator.isDeleted = True
    db.commit()
    db.refresh(existing_PaymentAggregator)
    response_dict = {
        "aggregatorCode": existing_PaymentAggregator.id,
        "status" : "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@app.put('/api/payment-aggregator/application/{applicationId}/aggregator/{aggregatorId}')
def update_paymentAggregator(applicationId,aggregatorId, new_PaymentAggregator: PaymentAggregatorUpdate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    existing_PaymentAggregator = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.applicationId == applicationId,PaymentAggregatorInDB.aggregatorId == aggregatorId,PaymentAggregatorInDB.isDeleted == False)).first()
    if not existing_PaymentAggregator:
        raise HTTPException(status_code=404, detail="PaymentAggregator not found")

    # Update the values from new_blog
    for key, value in new_PaymentAggregator.__dict__.items():
        if value is not None:  # Only update if a value is provided in the request
            setattr(existing_PaymentAggregator, key, value)

    db.commit()
    db.refresh(existing_PaymentAggregator)
    
    response_dict = {
        "aggregatorCode": existing_PaymentAggregator.id,
        "status" : "Updated"
    }

    return JSONResponse(content=response_dict, media_type="application/json")
 
# PaymentAggregator CRUD operations api end

# Applications CRUD operations api start 

@app.post('/api/applications',status_code=status.HTTP_201_CREATED)
def create_application(application:Applications, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    print("Applications request structure "+str(application))
    new_application = ApplicationsInDB(**application.dict())
    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    response_dict = {
        "applicationId": new_application.applicationId,
        "status": "Submitted"
    }

    return JSONResponse(content=response_dict, media_type="application/json")

@app.get('/api/get-single-applications/{applicationId}')
def get_single_application(applicationId, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId== applicationId)  ).first()
    return application


@app.get('/api/get-all-applications/{zoneId}')
def get_all_application(zoneId,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
# def get_all_application(db: Session = Depends(get_db)):
    if zoneId == "00000":
        applications = db.query(ApplicationsInDB).filter(ApplicationsInDB.isDeleted == False).order_by(ApplicationsInDB.createdAt.desc()).all()
    else:
        applications = db.query(ApplicationsInDB).filter( and_(ApplicationsInDB.isDeleted == False,ApplicationsInDB.zoneId == zoneId ) ).order_by(ApplicationsInDB.createdAt.desc()).all()
    return applications

@app.delete('/api/applications/{id}')
def delete_applications(id, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    existing_Applications = db.query(ApplicationsInDB).filter(ApplicationsInDB.applicationId == id).first()
    existing_Applications.isDeleted = True
    db.commit()
    response_dict = {
        "applicationId": existing_Applications.applicationId,
        "status" : "Deleted"
    }
    return JSONResponse(content=response_dict, media_type="application/json")

@app.put('/api/applications/{id}')
def update_applications(id, new_application: ApplicationsUpdate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    existing_Applications = db.query(ApplicationsInDB).filter(
        and_(ApplicationsInDB.applicationId == id, ApplicationsInDB.isDeleted == False)).first()
    if not existing_Applications:
        raise HTTPException(status_code=404, detail="Applications not found")

    # Update the values from new_blog
    for key, value in new_application.__dict__.items():
        if value is not None:
            setattr(existing_Applications, key, value)

    db.commit()
    db.refresh(existing_Applications)

    # Code for marking application accepted/rejected status in payment aggregator table.
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId== id)  ).first()

    print(application.__dict__)
    
    if application.finalizedAggregatorId is not None and application.isFinalApproved == True :
        print("**************calling payment aggregator table******************")
        paymentAggregators = db.query(PaymentAggregatorInDB).filter(
            and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == id )).all()
        print("**************found all payment aggregator list******************")
        for aggregator in paymentAggregators:
            if aggregator.aggregatorId == application.finalizedAggregatorId:
                print("*************set status as accepted*************")
                aggregator.quoteStatus = "accepted"
            else:
                print("*************set status as rejected*************")
                aggregator.quoteStatus = "rejected"
            db.commit()

    return existing_Applications 

@app.put('/api/applications/test/{id}')
def update_applications(id, db: Session = Depends(get_db)):
# def update_applications(id, new_application: ApplicationsUpdate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    
    # Code for marking application accepted/rejected status in payment aggregator table.
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId== id)  ).first()

    print(application.__dict__)
    
    if application.finalizedAggregatorId is not None and application.isFinalApproved == True :
        print("**************calling payment aggregator table******************")
        paymentAggregators = db.query(PaymentAggregatorInDB).filter(
            and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == id )).all()
        print("**************found all payment aggregator list******************")
        for aggregator in paymentAggregators:
            if aggregator.aggregatorId == application.finalizedAggregatorId:
                print("*************set status as accepted*************")
                aggregator.quoteStatus = "accepted" 
            else:
                print("*************set status as rejected*************")
                aggregator.quoteStatus = "rejected"
            db.commit()
            
    

# Applications CRUD operations api end


# Projection details CRUD operation api start here

# Update projections - add new projections in the database table,delete the older projections
@app.post('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections',status_code=status.HTTP_201_CREATED)
def create_projectionDetails(applicationId,aggregatorId,projectionDetails:List[ProjectionDetails], db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):

    projectionDetailsOld = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
         ProjectionDetailsInDB.applicationId == applicationId, 
         ProjectionDetailsInDB.aggregatorId == aggregatorId )).all()
    
    for projectionDetail in projectionDetailsOld:
        projectionDetail.isDeleted = True

    db.commit()

    for projectionDetail in projectionDetails:
        new_projectionDetail = ProjectionDetailsInDB(**projectionDetail.dict())
        db.add(new_projectionDetail)

    db.commit()

    projectionDetailsNew = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False, 
        ProjectionDetailsInDB.applicationId == applicationId, 
        ProjectionDetailsInDB.aggregatorId == aggregatorId )).all()
    
    # Return the response as a JSONResponse
    return projectionDetailsNew


@app.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def get_single_projectionDetails(projectionId, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    projectionDetail = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False, ProjectionDetailsInDB.id == projectionId)).first()
    return projectionDetail

@app.get('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections')
def get_all_projectionDetails(applicationId,aggregatorId,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
        ProjectionDetailsInDB.applicationId == applicationId,
        ProjectionDetailsInDB.aggregatorId == aggregatorId )).all()
    return projectionDetails

@app.delete('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def delete_projectionDetails(projectionId, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        ProjectionDetailsInDB.id == projectionId).first()
    projectionDetails.isDeleted = True
    db.commit()
    return "done"

@app.put('/api/applications/{applicationId}/aggregators/{aggregatorId}/projections/{projectionId}')
def update_projectionDetails(applicationId,aggregatorId, projectionId , new_projectionDetails: ProjectionDetailsUpdate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    existing_projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.id == projectionId,
             ProjectionDetailsInDB.isDeleted == False)).first()
    
    if not existing_projectionDetails:
        raise HTTPException(status_code=404, detail="ProjectionDetails not found")
    print(str(existing_projectionDetails.__dict__))
    # Update the values from new_blog
    for key, value in new_projectionDetails.__dict__.items():
        if value is not None:
            setattr(existing_projectionDetails, key, value)

    db.commit()
    db.refresh(existing_projectionDetails)

    response_dict = {
        "projectionId": existing_projectionDetails.id,
        "status" : "Updated"
    }
    # Return the response as a JSONResponse
    return JSONResponse(content=response_dict, media_type="application/json")


@app.post('/api/applications/bulk-update-charges/{applicationId}')
async def bulk_update_charges(applicationId: int, request:Request, db: Session = Depends(get_db)):

    projectionUpdates = await request.json()

    print("************Projection Updates object ***************")
    print(projectionUpdates
    )
    existing_projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
        ProjectionDetailsInDB.applicationId == applicationId
       )).all()

    print('**********************existing projection Details**********',len(existing_projectionDetails))
    for existingProjection in existing_projectionDetails:
        print(existingProjection.__dict__)

    for projectionUpdate in projectionUpdates:
        for existingProjection in existing_projectionDetails:
            if(projectionUpdate["transactionType"] == existingProjection.transactionType):
                if(projectionUpdate["chargesProposed"] is not ""):
                    existingProjection.chargesProposed = float(projectionUpdate["chargesProposed"])
    
    db.commit()

    return {
        "status": "success",
        "applicationId": applicationId,
        
    }
    
# Create initial projections in the database table
@app.post('/api/applications/aggregators/complex-projections',status_code=status.HTTP_201_CREATED)
async def create_complex_projectionDetails(request:Request, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):

    print('********************create_complex_projectionDetails*************************')
    
    projectionDetails = await request.json() # list of the projection details 
    # print(projectionDetails)
    # print("size of the array "+str(len(projectionDetails)))
    # print(projectionDetails[0])
    # print()
    applicationId = projectionDetails[0]["applicationId"]
    # print("applicaiton id is "+ str(applicationId))
    paymentAggregators = db.query(PaymentAggregatorInDB).filter(
        and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId )).all()
    # print(paymentAggregators)
    # print("size of the array "+str(len(paymentAggregators)))
    aggregator_codes = []

    for item in paymentAggregators:
        aggregator_codes.append(item.aggregatorId)

    # print(aggregator_codes)

    new_projections = []
    for code in aggregator_codes:
        for projection in projectionDetails:
            new_projection = projection.copy()  # Create a copy to avoid modifying the original
            new_projection["aggregatorId"] = code
            # new_projections.append(new_projection)
            # print(new_projection)
            # print("application id is : "+ str(new_projection["applicationId"]))
                    
            new_projectionDetails = ProjectionDetailsInDB(applicationId=new_projection["applicationId"],
            order = new_projection["order"],
            allow=new_projection["allow"],
            aggregatorId=new_projection["aggregatorId"],
            transactionCount=new_projection["transactionCount"],
            transactionValue=new_projection["transactionValue"],
            transactionType=new_projection["transactionType"],
            transactionTypePercent=new_projection.get("transactionTypePercent") or "", 
            isIB=new_projection["isIB"],
            # ibAggregateAmount=new_projection["ibAggregateAmount"],
            # ibEstimatedTransactions=new_projection["ibEstimatedTransactions"],
            estimatedTransactions=new_projection["estimatedTransactions"],
            aggregateAmount=new_projection["aggregateAmount"],
            rate=new_projection["rate"],
            unit=new_projection["unit"],
            chargesProposed=new_projection["chargesProposed"],
            grossAmount=new_projection["grossAmount"],
            vendorShare=new_projection["vendorShare"],
            expectedRevenue=new_projection["expectedRevenue"],
            isDeleted=new_projection["isDeleted"]
            )
            # print('new projection details are **************************************')
            # print(new_projectionDetails.__dict__)
            db.add(new_projectionDetails)
            new_projections.append(new_projectionDetails)
            # db.commit()
            # db.refresh(new_projectionDetails)
            # print(new_projectionDetails.__dict__)
            # new_projections.append(new_projectionDetails)

    db.commit()

    for projection in new_projections:
        db.refresh(projection)

    # print(new_projections)
    return new_projections


@app.get('/api/applications/trial-api')
async def application_trial_api(request:Request, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    print("printing api contents **************************************** ")
    application = await request.json()
    print(application["aggregatorDetails"])
    print("************************************************")
    for aggregatorDetail in application["aggregatorDetails"]:
        print(aggregatorDetail["projectionDetails"])
    return "done"


# Projection details CRUD operation api end here k


# FileDetails CRUD operation api start here

@app.post("/api/files/upload")
async def uploadFile(file: UploadFile = File(...),db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    content = await file.read()
    filename = file.filename
    content_type=file.content_type

    db_file = FileStoreInDB(
        filename = file.filename,
        content_type = file.content_type,
        file_contents = content,
        file_size = file.size
    )
    # print(content)
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return{"fileId":db_file.fileId,"filename":db_file.filename, "type":db_file.content_type, "size":len(content),"uploaded_at":db_file.uploaded_at}


@app.get("/api/files/download/{file_id}")
def downloadFile(file_id: int, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    db_file = db.query(FileStoreInDB).filter(FileStoreInDB.fileId == file_id).first()
    if not db_file:
        return {"error": "File not found"}

    return StreamingResponse(
        io.BytesIO(db_file.file_contents),
        media_type=db_file.content_type,
        headers={"Content-Disposition": f"attachment; filename={db_file.filename}"}
    )


# FileDetails CRUD operation api end here
class Invoice:
    def __init__(self, name, email, amount):
        self.name = name
        self.email = email
        self.amount = amount

    def __str__(self):
        return f"Invoice for {self.name} at {self.email}\nAmount: ${self.amount:.2f}"

# overlay_utils.py
# from reportlab.pdfgen import canvas
# from reportlab.lib.pagesizes import letter
# from PyPDF2 import PdfReader, PdfWriter
# from fastapi.responses import FileResponse

def create_overlay(data, overlay_path):
    """
    data: dict with coordinates
    Example: {"name": (100, 700, "John Doe"), "amount": (100, 650, "1500")}
    overlay_path: output path for overlay PDF
    """
    c = canvas.Canvas(overlay_path, pagesize=letter)
    c.setFont("Helvetica-Bold",20)

    for field, (x, y, value) in data.items():
        c.drawString(x, y, str(value))

    c.save()


# pdf_utils.py
# from PyPDF2 import PdfReader, PdfWriter

def merge_pdfs(template_path, overlay_path, output_path):
    template_pdf = PdfReader(template_path)
    overlay_pdf = PdfReader(overlay_path)
    writer = PdfWriter()

    # Overlay page 0 with template page 0 (expand if multiple pages needed)
    template_page = template_pdf.pages[0]
    overlay_page = overlay_pdf.pages[0]

    template_page.merge_page(overlay_page)
    writer.add_page(template_page)

    with open(output_path, "wb") as f:
        writer.write(f)


# main.py

# from fastapi.responses import FileResponse
# from db import SessionLocal, Invoice
# from overlay_utils import create_overlay
# from pdf_utils import merge_pdfs

@app.get("/api/generate-overlay-pdf/{invoice_id}")
def generate_overlay_pdf(invoice_id: int):
    # session = SessionLocal()
    # invoice = session.query(Invoice).filter(Invoice.id == invoice_id).first()
    # session.close()

    # if not invoice:
        # return {"error": "Invoice not found"}

    # Prepare coordinates for fields
    # (x, y, value)
    print("this shoudl be printer ************************************************")
    invoice = Invoice("John Doe", "john@example.com", 100.00)
    
    data = {
        "name": (50, 50, invoice.name),
        "email": (300, 480, invoice.email),
        "amount": (300, 260, f"{invoice.amount}")
    }

    print(data)

    overlay_path = f"output/overlay_{invoice_id}.pdf"
    output_path = f"output/invoice_{invoice_id}.pdf"
    template_path = "templates/invoice_template.pdf"

    print(overlay_path)
    print(output_path)
    print(template_path)

    # Create overlay PDF
    create_overlay(data, overlay_path)

    # Merge overlay with template
    merge_pdfs(template_path, overlay_path, output_path)

    return FileResponse(output_path, media_type="application/pdf", filename=f"invoice_{invoice_id}.pdf")
# --------------------------------------------------------

# ----------------------Purchase Order Creation apis start ----------------------------------

def to_dict(obj,keys):
    return {key: getattr(obj,key) for key in keys}


# @app.get("/api/generate-purchase-order/applicationId/{applicationId}/aggregatorId/{aggregatorId}")
# def create_purchase_order_details_for_print(applicationId,aggregatorId,db: Session = Depends(get_db)):
#     application = db.query(ApplicationsInDB).filter( 
#         and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId== applicationId)).first()

#     # print(application.__dict__)
#     application_dict = to_dict(application,["customerName","address","finalizedAggregatorId","finalizedAggregatorName"])
#     # print("**********printing application_dict **********")
#     # print(application_dict)
#     # print(application_dict["finalizedAggregatorId"])

#     manageAggregator = db.query(ManageAggregatorInDB).filter(
#         and_(ManageAggregatorInDB.isDeleted == False , ManageAggregatorInDB.aggregatorId == application_dict["finalizedAggregatorId"])).first()
    
#     aggregator_dict = to_dict(manageAggregator,["aggregatorId","aggregatorName","location"])
    
#     today =date.today()
#     year = today.year
    
#     current_financial_year = str(year) + str("-") + str(year+1)

#     current_date = today.strftime("%d-%m-%Y")


#     projectionDetails = db.query(ProjectionDetailsInDB).filter(
#         and_(ProjectionDetailsInDB.isDeleted == False,
#         ProjectionDetailsInDB.applicationId == applicationId,
#         ProjectionDetailsInDB.aggregatorId == aggregatorId )).all()

#     # Initialize result dictionary
#     result = {
#         "ibChargePurposed": 0,
#         "ibRate": 0,
#         "ibBankShare": 0,
#         "cdChargePurposed": 0,
#         "cdRate": 0,
#         "cdBankShare": 0,
#         "ddupto2kChargePurposed": 0,
#         "ddupto2kRate": 0,
#         "ddupto2kBankShare": 0,
#         "ddabove2kChargePurposed": 0,
#         "ddabove2kRate": 0,
#         "ddabove2kBankShare": 0,
#         "ibOthersChargePurposed": 0,
#         "ibOthersRate": 0,
#         "ibOthersBankShare": 0,
#     }

    
#     # pdfkit configuration: point to wkhtmltopdf if not on PATH
#     config = pdfkit.configuration(wkhtmltopdf=r"E:\PAWS_VENV\wkhtmltopdf\wkhtmltopdf.exe")

#     for item in projectionDetails:
#         item = item.__dict__
#         ttype = item.get("transactionType", "").lower()
#         ibtype = item.get("isIB")


#         # Internet Banking
#         if ttype == "sbi" and ibtype ==  True:
#             result["ibChargePurposed"] = item.get("chargesProposed", 0)
#             result["ibRate"] = item.get("rate", 0)
#             result["ibBankShare"] = result["ibChargePurposed"] - result["ibRate"]

#         # Credit Cards
#         elif "credit cards" in ttype:
#             result["cdChargePurposed"] = item.get("chargesProposed", 0)
#             result["cdRate"] = item.get("rate", 0)
#             ccresult = result["cdChargePurposed"] - result["cdRate"]
#             result["cdBankShare"] = round(ccresult, 2)

#         # Debit Cards upto 2000
#         elif "debit card - master/visa (upto 2000)" in ttype:
#             result["ddupto2kChargePurposed"] = item.get("chargesProposed", 0)
#             result["ddupto2kRate"] = item.get("rate", 0)
#             ddresult = result["ddupto2kChargePurposed"] - result["ddupto2kRate"]
#             result["ddupto2kBankShare"] = round(ddresult, 2)

#         # Debit Cards above 2000
#         elif "debit card - master/visa (above 2000)" in ttype:
#             result["ddabove2kChargePurposed"] = item.get("chargesProposed", 0)
#             result["ddabove2kRate"] = item.get("rate", 0)
#             ddresult = result["ddabove2kChargePurposed"] - result["ddabove2kRate"]
#             result["ddabove2kBankShare"] = round(ddresult, 2)

#         if ttype == "others" and ibtype ==  True:
#             result["ibOthersChargePurposed"] = item.get("chargesProposed", 0)
#             result["ibOthersRate"] = item.get("rate", 0)
#             result["ibOthersBankShare"] = result["ibOthersChargePurposed"] - result["ibOthersRate"]
        

#     # Print the result
#     # print(json.dumps(result, indent=4))
#     logo_path = os.path.abspath('static/cbilogo.png')


#     poDetails ={**application_dict, **aggregator_dict, 
#         "currentFinancialYear":current_financial_year,
#         "currentDate":current_date,**result,
#         "branchLocation":"Mumbai"
#         }  # Change this location dynamically based on location id of branch from user table

#     # templates = Jinja2Templates(directory="templates")


#     template_loader = jinja2.FileSystemLoader(searchpath="templates")

#     template_env = jinja2.Environment(loader=template_loader)

#     template = template_env.get_template("po_template.html")
#     # print(logo_path)

#     html_content = template.render(**poDetails, logo_path = logo_path)
    
#     pdf_options = {
#         "page-size": "A4",
#         "margin-top": "25mm",
#         "margin-bottom": "25mm",
#         "margin-left": "25mm",
#         "margin-right": "25mm",
#         "encoding": "UTF-8",
#         "enable-local-file-access": True , # necessary for local static css when using wkhtmltopdf
#         "load-error-handling":"ignore",
#         "load-media-error-handling":"ignore"
#     }

#     try:
#         pdf_bytes = pdfkit.from_string(html_content, False, options=pdf_options, configuration=config)
#         # --------------------------------------------- 
#         # template = templates.get_template("po_template.html")
#         # html = template.render()

#         # pdf_file = "generated/output.pdf"
#         # pdfkit.from_string(html, pdf_file, options={
#         #     "enable-local-file-access": ""
#         # })

#         # --------------------------------------------- 

#     except Exception as e:
#         # Optional fallback: save HTML to file to debug
#         open("last_render.html", "w", encoding="utf-8").write(html_content)
#         raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}. Saved last_render.html for debugging.")
    
#     with open("output.pdf","wb") as f:
#         f.write(pdf_bytes)

#     # Return as streaming response
#     return StreamingResponse(io.BytesIO(pdf_bytes),
#                              media_type="application/pdf",
#                              headers={"Content-Disposition": f"attachment; filename=PO_{poDetails.get('customerName','po')}.pdf"})

    # return HTMLResponse(content=html_content)

    # print(aggregator_dict)
    # paymentAggregators = db.query(PaymentAggregatorInDB).filter(
    #     and_(PaymentAggregatorInDB.isDeleted == False, PaymentAggregatorInDB.applicationId == applicationId )).all()
    
    # aggregator_list = []

    # for paymentAggr in paymentAggregators:
    #     manageAggregator = db.query(ManageAggregatorInDB).filter(
    #     and_(ManageAggregatorInDB.isDeleted == False , ManageAggregatorInDB.aggregatorId == paymentAggr.aggregatorId)).first()
    #     aggregator = to_dict(manageAggregator,["aggregatorId","aggregatorName","location"])
    #     aggregator_list.append(aggregator)
    #     # print(manageAggregator.__dict__)
    
    # print(aggregator_list)
    # return poDetails

# ----------------------Purchase Order Creation apis end ----------------------------------

# ---------------------  Insert email code here -----------------------------

#-------------------#
@app.get("/api/generate-purchase-order/applicationId/{applicationId}/aggregatorId/{aggregatorId}")
def create_purchase_order_details_for_print(applicationId,aggregatorId,db: Session = Depends(get_db)):
    application = db.query(ApplicationsInDB).filter( 
        and_(ApplicationsInDB.isDeleted == False, ApplicationsInDB.applicationId== applicationId)).first()

    # print(application.__dict__)
    application_dict = to_dict(application,["customerName","address","finalizedAggregatorId","finalizedAggregatorName"])
    # print("**********printing application_dict **********")
    # print(application_dict)
    # print(application_dict["finalizedAggregatorId"])

    manageAggregator = db.query(ManageAggregatorInDB).filter(
        and_(ManageAggregatorInDB.isDeleted == False , ManageAggregatorInDB.aggregatorId == application_dict["finalizedAggregatorId"])).first()
    
    aggregator_dict = to_dict(manageAggregator,["aggregatorId","aggregatorName","location"])
    
    today =date.today()
    year = today.year
    
    current_financial_year = str(year) + str("-") + str(year+1)

    current_date = today.strftime("%d-%m-%Y")


    projectionDetails = db.query(ProjectionDetailsInDB).filter(
        and_(ProjectionDetailsInDB.isDeleted == False,
        ProjectionDetailsInDB.applicationId == applicationId,
        ProjectionDetailsInDB.aggregatorId == aggregatorId )).all()

    # Initialize result dictionary
    result = {
        "ibChargePurposed": 0,
        "ibRate": 0,
        "ibBankShare": 0,
        "cdChargePurposed": 0,
        "cdRate": 0,
        "cdBankShare": 0,
        "ddupto2kChargePurposed": 0,
        "ddupto2kRate": 0,
        "ddupto2kBankShare": 0,
        "ddabove2kChargePurposed": 0,
        "ddabove2kRate": 0,
        "ddabove2kBankShare": 0,
        "ibOthersChargePurposed": 0,
        "ibOthersRate": 0,
        "ibOthersBankShare": 0,
    }

    
    # pdfkit configuration: point to wkhtmltopdf if not on PATH
    config = pdfkit.configuration(wkhtmltopdf=r"E:\PAWS_VENV\wkhtmltopdf\wkhtmltopdf.exe")

    for item in projectionDetails:
        item = item.__dict__
        ttype = item.get("transactionType", "").lower()
        ibtype = item.get("isIB")


        # Internet Banking
        if ttype == "sbi" and ibtype ==  True:
            result["ibChargePurposed"] = item.get("chargesProposed", 0)
            result["ibRate"] = item.get("rate", 0)
            result["ibBankShare"] = result["ibChargePurposed"] - result["ibRate"]

        # Credit Cards
        elif "credit cards" in ttype:
            result["cdChargePurposed"] = item.get("chargesProposed", 0)
            result["cdRate"] = item.get("rate", 0)
            ccresult = result["cdChargePurposed"] - result["cdRate"]
            result["cdBankShare"] = round(ccresult, 2)

        # Debit Cards upto 2000
        elif "debit card - master/visa (upto 2000)" in ttype:
            result["ddupto2kChargePurposed"] = item.get("chargesProposed", 0)
            result["ddupto2kRate"] = item.get("rate", 0)
            ddresult = result["ddupto2kChargePurposed"] - result["ddupto2kRate"]
            result["ddupto2kBankShare"] = round(ddresult, 2)

        # Debit Cards above 2000
        elif "debit card - master/visa (above 2000)" in ttype:
            result["ddabove2kChargePurposed"] = item.get("chargesProposed", 0)
            result["ddabove2kRate"] = item.get("rate", 0)
            ddresult = result["ddabove2kChargePurposed"] - result["ddabove2kRate"]
            result["ddabove2kBankShare"] = round(ddresult, 2)

        if ttype == "others" and ibtype ==  True:
            result["ibOthersChargePurposed"] = item.get("chargesProposed", 0)
            result["ibOthersRate"] = item.get("rate", 0)
            result["ibOthersBankShare"] = result["ibOthersChargePurposed"] - result["ibOthersRate"]
        

    # Print the result
    # print(json.dumps(result, indent=4))
    # logo_path = os.path.abspath('static/cbilogo.png')
    logo_path = os.path.abspath('static/cbilogo.png')
    logo_path = f"file:///{logo_path.replace('\\','/')}"
    
    poDetails ={**application_dict, **aggregator_dict, 
        "currentFinancialYear":current_financial_year,
        "currentDate":current_date,**result,
        "branchLocation":"Mumbai"
        }  # Change this location dynamically based on location id of branch from user table

    templates = Jinja2Templates(directory="templates")

    template = templates.get_template("po_template.html")
     

    html_content = template.render(**poDetails, logo_path = logo_path)
    pdf_options = {
        "page-size": "A4",
        "margin-top": "25mm",
        "margin-bottom": "25mm",
        "margin-left": "25mm",
        "margin-right": "25mm",
        "encoding": "UTF-8",
        "enable-local-file-access": "" , # necessary for local static css when using wkhtmltopdf
    }

    try:
        pdf_bytes = pdfkit.from_string(html_content, False, options=pdf_options, configuration=config)
        
        # --------------------------------------------- 
        # template = templates.get_template("po_template.html")
        # html = template.render()

        # pdf_file = "generated/output.pdf"
        # pdfkit.from_string(html, pdf_file, options={
        #     "enable-local-file-access": ""
        # })

        # --------------------------------------------- 

    except Exception as e:
        # Optional fallback: save HTML to file to debug
        open("last_render.html", "w", encoding="utf-8").write(html_content)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}. Saved last_render.html for debugging.")
    
    with open("output.pdf","wb") as f:
        f.write(pdf_bytes)

    # Return as streaming response
    return StreamingResponse(io.BytesIO(pdf_bytes),
                             media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename=PO_{poDetails.get('customerName','po')}.pdf"})
#-------------------#
# # -------------------Send email ends here ----------------------------------
@app.get("/{full_path:path}")
async def serve_react_spa(full_path: str):
    return FileResponse("dist/index.html")