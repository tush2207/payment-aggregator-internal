from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.api.deps.dependencies import get_db, authenticate_user, ldap_authenticate
from app.core import config
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.schemas.schemas import Token, DevLoginRequest
from app.utils.helpers import decode_base64

router = APIRouter()

@router.get("/secure-data")
def secure_data(user: str = Depends(authenticate_user)):
    return {"message": f"Hello {user}, you are authenticated via LDAP!"}

@router.post("/ldaplogin")
def login(username: str = Form(...), password: str = Form(...)):
    if ldap_authenticate(username, password):
        return {"message": f"Welcome {username}, authentication successful!"}
    raise HTTPException(status_code=401, detail="Invalid LDAP credentials")

@router.post("/api/dev-login")
async def dev_login(request: DevLoginRequest):
    if not config.DEV_MODE:
        raise HTTPException(
            status_code=404,
            detail="Endpoint not available"
        )
    access_token = create_access_token(
        data={"sub": request.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "success": True,
        "message": "Development login successful.",
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "employeeId": request.username,
            "employeeName": "Tushar Kasbe",
            "email": "tushar.kasbe@centerlbank.co.in",
            "mobileNo": "9876543210",
            "role": "CO",
            "department": "Information Technology",
            "designation": "Software Developer",
            "branchId": 1001,
            "branchName": "Mumbai Main Branch",
            "regionId": 10,
            "regionName": "Mumbai Region",
            "zoneId": 1,
            "zoneName": "West Zone",
            "locationType": "CO",
            "grade": "Scale-II",
            "departmentCode": "IT001",
            "active": True
        }
    }

@router.post("/api/token", response_model=Token)
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
