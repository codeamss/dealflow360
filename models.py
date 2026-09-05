from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Numeric,
    DateTime,
    Text,
    ForeignKey
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "Internal Sales Rep", "Sales Manager", "Finance", "Customer"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # relationships
    quotations_as_customer = relationship("Quotation", foreign_keys="[Quotation.customer_id]", back_populates="customer")
    quotations_as_rep = relationship("Quotation", foreign_keys="[Quotation.rep_id]", back_populates="rep")
    approval_logs = relationship("ApprovalLog", back_populates="reviewer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Numeric(precision=10, scale=2), nullable=False)
    unit = Column(String, nullable=False)  # e.g., "each", "kg", "license"
    tax = Column(Numeric(precision=5, scale=2), nullable=False, default=0)
    is_subscription = Column(Boolean, default=False)

    # relationships
    quotation_lines = relationship("QuotationLine", back_populates="product")
    inventory = relationship("Inventory", back_populates="product")


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


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)

    # relationships
    inventory = relationship("Inventory", back_populates="warehouse")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(precision=12, scale=2), nullable=False, default=0)

    # relationships
    warehouse = relationship("Warehouse", back_populates="inventory")
    product = relationship("Product", back_populates="inventory")


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rep_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="Draft")
    blended_risk_score = Column(Numeric(precision=5, scale=2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

    # relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="quotations_as_customer")
    rep = relationship("User", foreign_keys=[rep_id], back_populates="quotations_as_rep")
    lines = relationship("QuotationLine", back_populates="quotation")
    approval_logs = relationship("ApprovalLog", back_populates="quotation")


class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(precision=12, scale=2), nullable=False)
    applied_discount = Column(Numeric(precision=5, scale=2), nullable=False, default=0)
    is_subscription = Column(Boolean, nullable=False, default=False)

    # relationships
    quotation = relationship("Quotation", back_populates="lines")
    product = relationship("Product", back_populates="quotation_lines")


class ApprovalLog(Base):
    __tablename__ = "approval_logs"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    reason = Column(Text, nullable=True)

    # relationships
    quotation = relationship("Quotation", back_populates="approval_logs")
    reviewer = relationship("User", back_populates="approval_logs")