"""
routes/auth.py - Authentication endpoints (signup, login, me)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.password import hash_password, verify_password
from auth.jwt_handler import create_access_token, get_current_user
import re

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_slug_from_email(email: str) -> str:
    """Generate a basic username from email for display."""
    return email.split("@")[0]


@router.post("/signup", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if email already registered
    existing = db.query(models.User).filter(
        models.User.email == user_data.email.lower()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = models.User(
        name=user_data.name,
        email=user_data.email.lower(),
        hashed_password=hash_password(user_data.password),
        role=models.UserRole.user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create and return JWT
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(
        access_token=token,
        user=schemas.UserResponse.model_validate(user)
    )


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(models.User).filter(
        models.User.email == credentials.email.lower()
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact support."
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(
        access_token=token,
        user=schemas.UserResponse.model_validate(user)
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Get current authenticated user's profile."""
    return current_user


@router.put("/me", response_model=schemas.UserResponse)
def update_me(
    update_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile."""
    if update_data.name:
        current_user.name = update_data.name
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user
