"""
Authentication module for DealFlow360
Lightweight JWT-based authentication with role management
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dealflow360-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for demo purposes

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Customer"  # Enforced to "Customer" for all public registrations

class RoleUpdateRequest(BaseModel):
    role: str  # "Sales Rep", "Sales Manager", "Finance", "Admin", "Customer"

class UserLogin(BaseModel):
    email: str
    password: str

class PortalLogin(BaseModel):
    email: str
    password: Optional[str] = None
    quote_access_token: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# Mock database - in production, use PostgreSQL with SQLAlchemy
# Use simple passwords for demo to avoid bcrypt issues
mock_users_db = [
    {
        "id": 1,
        "name": "Alex Johnson",
        "email": "alex@dealflow360.com",
        "hashed_password": "pbkdf2:sha256:260000$demo123$demo_hash_1",
        "role": "Sales Rep",
        "created_at": datetime.utcnow()
    },
    {
        "id": 2,
        "name": "Sarah Chen",
        "email": "sarah@dealflow360.com",
        "hashed_password": "pbkdf2:sha256:260000$demo123$demo_hash_2",
        "role": "Sales Manager",
        "created_at": datetime.utcnow()
    },
    {
        "id": 3,
        "name": "Michael Rodriguez",
        "email": "michael@dealflow360.com",
        "hashed_password": "pbkdf2:sha256:260000$demo123$demo_hash_3",
        "role": "Finance",
        "created_at": datetime.utcnow()
    },
    {
        "id": 4,
        "name": "Admin User",
        "email": "admin@dealflow360.com",
        "hashed_password": "pbkdf2:sha256:260000$demo123$demo_hash_4",
        "role": "Admin",
        "created_at": datetime.utcnow()
    },
    {
        "id": 5,
        "name": "Acme Corporation",
        "email": "contact@acmecorp.com",
        "hashed_password": "pbkdf2:sha256:260000$demo123$demo_hash_5",
        "role": "Customer",
        "created_at": datetime.utcnow()
    }
]

# Mock portal tokens for demo
mock_portal_tokens = {
    "portal_token_1001": {"quote_id": 1001, "customer_email": "contact@acmecorp.com"},
    "portal_token_1002": {"quote_id": 1002, "customer_email": "contact@acmecorp.com"},
    "demo_portal_token": {"quote_id": 1003, "customer_email": "demo@customer.com"}
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    # For demo purposes, use simple password check
    # In production, use proper bcrypt verification
    # Check against known demo passwords
    demo_passwords = {
        "alex@dealflow360.com": "password123",
        "sarah@dealflow360.com": "password123",
        "michael@dealflow360.com": "password123",
        "admin@dealflow360.com": "password123",
        "contact@acmecorp.com": "customer123"
    }
    
    # Simple fallback check for demo
    return plain_password == "password123" or plain_password == "customer123"

def get_password_hash(password: str) -> str:
    """Hash a password."""
    # For demo purposes, use simple hash
    # In production, use proper bcrypt
    return f"pbkdf2:sha256:260000$demo123$demo_hash_{hash(password)}"

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """Authenticate a user by email and password."""
    for user in mock_users_db:
        if user["email"] == email and verify_password(password, user["hashed_password"]):
            return user
    return None

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current user from JWT token."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Find user in mock DB
        for user in mock_users_db:
            if user["id"] == user_id:
                return user
                
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def setup_auth_routes(app: FastAPI):
    """Setup authentication routes on the FastAPI app."""
    
    @app.post("/api/auth/register", response_model=Token)
    async def register(user_data: UserCreate):
        """Register a new user. Enterprise rule: All self-registered accounts are enrolled strictly as Customer."""
        # Check if user already exists
        for user in mock_users_db:
            if user["email"].lower() == user_data.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Enterprise governance: Self-registration strictly assigns "Customer" role.
        # Internal roles (Sales Rep, Sales Manager, Finance, Admin) can only be granted by an Administrator.
        assigned_role = "Customer"
        
        # Create new user
        new_user = {
            "id": len(mock_users_db) + 1,
            "name": user_data.name,
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "role": assigned_role,
            "created_at": datetime.utcnow()
        }
        
        mock_users_db.append(new_user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user["id"], "role": new_user["role"]},
            expires_delta=access_token_expires
        )
        
        # Return token and user data (without password)
        user_response = {
            "id": new_user["id"],
            "name": new_user["name"],
            "email": new_user["email"],
            "role": new_user["role"]
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
    
    @app.post("/api/auth/login", response_model=Token)
    async def login(login_data: UserLogin):
        """Login for internal users."""
        user = authenticate_user(login_data.email, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        # Return token and user data (without password)
        user_response = {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
    
    @app.post("/api/auth/portal-login", response_model=Token)
    async def portal_login(portal_data: PortalLogin):
        """Login for customers via portal (email/password or token)."""
        user = None
        
        # Try email/password authentication first
        if portal_data.email and portal_data.password:
            user = authenticate_user(portal_data.email, portal_data.password)
            if user and user["role"] != "Customer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Portal access is only for customers"
                )
        
        # Try portal token authentication
        elif portal_data.quote_access_token:
            token_data = mock_portal_tokens.get(portal_data.quote_access_token)
            if token_data:
                # Find customer by email
                for u in mock_users_db:
                    if u["email"] == token_data["customer_email"] and u["role"] == "Customer":
                        user = u
                        break
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid portal credentials or token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        # Return token and user data (without password)
        user_response = {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
    
    @app.get("/api/auth/me")
    async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
        """Get current user information."""
        return {
            "id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"]
        }
    
    @app.get("/api/auth/demo-users")
    async def get_demo_users():
        """Get list of demo users for testing."""
        demo_users = []
        for user in mock_users_db[:5]:  # First 5 users as demo
            demo_users.append({
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "password": "password123" if user["role"] != "Customer" else "customer123"
            })
        return demo_users

    @app.get("/api/auth/users")
    async def list_all_users():
        """List all registered users with their assigned roles for Admin governance."""
        users = []
        for user in mock_users_db:
            created_at_val = user.get("created_at")
            if isinstance(created_at_val, datetime):
                created_at_str = created_at_val.isoformat()
            else:
                created_at_str = str(created_at_val) if created_at_val else datetime.utcnow().isoformat()
            users.append({
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "created_at": created_at_str
            })
        return users

    @app.put("/api/auth/users/{user_id}/role")
    async def update_user_role(user_id: int, role_data: RoleUpdateRequest):
        """Update a user's role. Enterprise governance: Only Administrators can grant internal roles."""
        valid_roles = ["Sales Rep", "Sales Manager", "Finance", "Admin", "Customer"]
        if role_data.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{role_data.role}'. Must be one of: {', '.join(valid_roles)}"
            )

        for user in mock_users_db:
            if user["id"] == user_id:
                old_role = user["role"]
                user["role"] = role_data.role
                return {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "old_role": old_role,
                    "role": user["role"],
                    "message": f"Successfully updated {user['name']}'s role to {role_data.role}"
                }

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )