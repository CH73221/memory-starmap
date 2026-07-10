from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar: Optional[str] = None
    created_at: datetime
    # XP / 等级系统
    total_xp: int = 0
    level: int = 1
    streak: int = 0
    last_review_date: Optional[date] = None
    next_level_xp: int = 0
    current_level_xp: int = 0

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
