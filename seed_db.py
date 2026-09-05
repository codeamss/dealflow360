#!/usr/bin/env python3
"""
Database Seeding Script for DealFlow360
Populates the configured database (PostgreSQL or SQLite) with initial catalog,
warehouses, inventory, discount tiers, and demo users.
"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from database import engine, SessionLocal, Base
from models import User, Product, Warehouse, Inventory, DiscountTier

def seed_database():
    print("[INFO] Creating all tables according to SQLAlchemy models...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("[INFO] Seeding demo users...")
            demo_users = [
                User(
                    email="alex@dealflow360.com",
                    hashed_password="pbkdf2:sha256:260000$demo123$demo_hash_1",
                    role="Internal Sales Rep",
                    is_active=True
                ),
                User(
                    email="sarah@dealflow360.com",
                    hashed_password="pbkdf2:sha256:260000$demo123$demo_hash_2",
                    role="Sales Manager",
                    is_active=True
                ),
                User(
                    email="marcus@dealflow360.com",
                    hashed_password="pbkdf2:sha256:260000$demo123$demo_hash_3",
                    role="Finance",
                    is_active=True
                ),
                User(
                    email="procurement@acme.com",
                    hashed_password="pbkdf2:sha256:260000$demo123$demo_hash_4",
                    role="Customer",
                    is_active=True
                ),
            ]
            db.add_all(demo_users)
            db.commit()
            print(f"[SUCCESS] Added {len(demo_users)} demo users.")

        if db.query(Product).count() == 0:
            print("[INFO] Seeding commercial products...")
            catalog = [
                Product(name="Enterprise Server Rack", category="Hardware", price=12500.00, unit="each", tax=0.08, is_subscription=False),
                Product(name="Cloud Backup Solution", category="Services", price=450.00, unit="monthly", tax=0.08, is_subscription=True),
                Product(name="Network Switch Pro", category="Hardware", price=3200.00, unit="each", tax=0.08, is_subscription=False),
                Product(name="Security Monitoring", category="Services", price=1200.00, unit="monthly", tax=0.08, is_subscription=True),
                Product(name="Workstation Laptop", category="Hardware", price=2800.00, unit="each", tax=0.08, is_subscription=False),
                Product(name="Support Plan Gold", category="Services", price=950.00, unit="monthly", tax=0.08, is_subscription=True),
            ]
            db.add_all(catalog)
            db.commit()
            print(f"[SUCCESS] Added {len(catalog)} products.")

        if db.query(Warehouse).count() == 0:
            print("[INFO] Seeding regional fulfillment warehouses...")
            wh_east = Warehouse(name="East Coast Warehouse", location="New York, NY")
            wh_west = Warehouse(name="West Coast Warehouse", location="San Francisco, CA")
            wh_central = Warehouse(name="Central Distribution", location="Chicago, IL")
            db.add_all([wh_east, wh_west, wh_central])
            db.commit()

            p1 = db.query(Product).filter(Product.name == "Enterprise Server Rack").first()
            p3 = db.query(Product).filter(Product.name == "Network Switch Pro").first()
            p5 = db.query(Product).filter(Product.name == "Workstation Laptop").first()

            if p1 and p3 and p5:
                stock_items = [
                    Inventory(warehouse_id=wh_east.id, product_id=p1.id, quantity=15),
                    Inventory(warehouse_id=wh_east.id, product_id=p3.id, quantity=28),
                    Inventory(warehouse_id=wh_east.id, product_id=p5.id, quantity=42),
                    Inventory(warehouse_id=wh_west.id, product_id=p1.id, quantity=8),
                    Inventory(warehouse_id=wh_west.id, product_id=p3.id, quantity=15),
                    Inventory(warehouse_id=wh_west.id, product_id=p5.id, quantity=23),
                    Inventory(warehouse_id=wh_central.id, product_id=p1.id, quantity=12),
                    Inventory(warehouse_id=wh_central.id, product_id=p3.id, quantity=20),
                    Inventory(warehouse_id=wh_central.id, product_id=p5.id, quantity=35),
                ]
                db.add_all(stock_items)
                db.commit()
                print("[SUCCESS] Added 3 warehouses with regional inventory.")

        if db.query(DiscountTier).count() == 0:
            print("[INFO] Seeding governance discount policy tiers...")
            tiers = [
                DiscountTier(name="Standard Hardware Cap", category="Hardware", max_discount_percent=10.00),
                DiscountTier(name="Services Floor", category="Services", max_discount_percent=15.00),
                DiscountTier(name="Global Executive Fallback", category=None, max_discount_percent=12.00),
            ]
            db.add_all(tiers)
            db.commit()
            print(f"[SUCCESS] Added {len(tiers)} governance discount tiers.")

        print("\n[COMPLETE] Database is ready and synchronized!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database seeding failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
