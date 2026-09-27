"""
routes/admin.py - Admin-only endpoints for analytics and user management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from database import get_db
import models
import schemas
from auth.jwt_handler import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin dashboard with platform analytics."""
    total_users = db.query(func.count(models.User.id)).scalar()
    total_products = db.query(func.count(models.Product.id)).filter(
        models.Product.is_active == True
    ).scalar()
    total_orders = db.query(func.count(models.Order.id)).filter(
        models.Order.status == models.OrderStatus.paid
    ).scalar()
    total_revenue = db.query(func.sum(models.Order.total_amount)).filter(
        models.Order.status == models.OrderStatus.paid
    ).scalar() or 0.0

    # Last 10 paid orders
    recent_orders = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product),
        joinedload(models.Order.user)
    ).filter(
        models.Order.status == models.OrderStatus.paid
    ).order_by(models.Order.created_at.desc()).limit(10).all()

    return schemas.DashboardStats(
        total_users=total_users,
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        recent_orders=recent_orders
    )


@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin: List all users."""
    return db.query(models.User).offset(skip).limit(limit).all()


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    update_data: schemas.AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin: Update any user's details."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/orders", response_model=List[schemas.OrderResponse])
def list_all_orders(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin: View all orders across all users."""
    query = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product),
        joinedload(models.Order.user)
    )
    if status:
        query = query.filter(models.Order.status == status)

    return query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/products", response_model=List[schemas.ProductDetailResponse])
def list_all_products(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin: List all products including inactive ones."""
    return db.query(models.Product).order_by(
        models.Product.created_at.desc()
    ).offset(skip).limit(limit).all()
