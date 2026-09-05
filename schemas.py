from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    role: str
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    unit: str
    tax: float = 0.0
    is_subscription: bool = False


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True


class DiscountTierBase(BaseModel):
    name: str
    category: Optional[str] = None
    max_discount_percent: float


class DiscountTierCreate(DiscountTierBase):
    pass


class DiscountTier(DiscountTierBase):
    id: int

    class Config:
        from_attributes = True


class SubscriptionPlanBase(BaseModel):
    name: str
    billing_frequency: str
    proration_rule: str
    price: float


class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass


class SubscriptionPlan(SubscriptionPlanBase):
    id: int

    class Config:
        from_attributes = True