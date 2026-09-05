from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Numeric,
    DateTime,
    Text,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "Internal Sales Rep", "Sales Manager", "Finance", "Customer"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # relationships can be added later


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Numeric(precision=10, scale=2), nullable=False)
    unit = Column(String, nullable=False)  # e.g., "each", "kg", "license"
    tax = Column(Numeric(precision=5, scale=2), nullable=False, default=0)
    is_subscription = Column(Boolean, default=False)


class DiscountTier(Base):
    __tablename__ = "discount_tiers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "Bronze", "Silver", "Gold"
    category = Column(String, nullable=True)  # category-specific; null means applies to all
    max_discount_percent = Column(Numeric(precision=5, scale=2), nullable=False)


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    billing_frequency = Column(String, nullable=False)  # "monthly", "quarterly", "annually"
    proration_rule = Column(String, nullable=False)  # "full", "pro_rata", "none"
    price = Column(Numeric(precision=10, scale=2), nullable=False)