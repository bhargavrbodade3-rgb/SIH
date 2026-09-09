from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "ENTREPRENEUR"
    phone: Optional[str] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
