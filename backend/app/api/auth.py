from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    Token,
    TokenData,
)
from app.core.deps import get_current_active_user
from app.core.database import get_db
from app.schemas.schemas import UserSchema, RegisterRequest
from app.models.models import User

router = APIRouter()


@router.post("/register", response_model=Token)
async def register(
    body: RegisterRequest,          # ← JSON body instead of query params
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = get_password_hash(body.password)
    new_user = User(
        email=body.email,
        password_hash=hashed_password,
        full_name=body.full_name,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": new_user.id}, expires_delta=timedelta(minutes=30)
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Login user and return access token."""
    # Find user by email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)."""
    # In a more secure implementation, we might add the token to a blacklist
    # For now, we just return success and let the client handle token removal
    return {"msg": "Successfully logged out"}


@router.get("/me", response_model=UserSchema)
async def read_users_me(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user information."""
    return current_user


@router.get("/refresh")
async def refresh_token(
    current_user: User = Depends(get_current_active_user),
):
    """Refresh access token."""
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": current_user.id}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")