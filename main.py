# ---------------------------------------------------------------
#  main.py – FastAPI app + all endpoints
# ---------------------------------------------------------------
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import calendar

# Direct imports since we're running as a script
from database import engine, SessionLocal, Base
from models import (
    Quotation,
    QuotationLine,
    Product,
    Inventory,
    Warehouse,
    DiscountTier,
    SubscriptionPlan,
    ApprovalLog,
)
from schemas import SplitFulfillmentRequest
from auth import setup_auth_routes

# -----------------------------------------------------------------
# FastAPI instance
# -----------------------------------------------------------------
app = FastAPI(
    title="DealFlow360 – B2B Sales Platform",
    version="0.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_tags=[
        {
            "name": "authentication",
            "description": "User authentication and registration endpoints",
        },
        {
            "name": "quotations",
            "description": "Quotation management and risk calculation",
        },
        {
            "name": "products",
            "description": "Product and upsell management",
        },
    ]
)

# -----------------------------------------------------------------
# Setup authentication routes
# -----------------------------------------------------------------
setup_auth_routes(app)

# -----------------------------------------------------------------
# Helper: get a SQLAlchemy session per request
# -----------------------------------------------------------------
def get_db() -> Session:
    """Yield a SQLAlchemy session, guaranteeing it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -----------------------------------------------------------------
# Optional: create tables on first start (remove after first migration)
# -----------------------------------------------------------------
# Base.metadata.create_all(bind=engine)

# -----------------------------------------------------------------
# Helper: stock available for a product in a warehouse
# -----------------------------------------------------------------
def _stock_for(product_id: int, warehouse_id: int, db: Session) -> int:
    """Return the quantity on hand (int). Returns 0 if no row."""
    row = db.execute(
        select(Inventory.quantity)
        .where(Inventory.warehouse_id == warehouse_id)
        .where(Inventory.product_id == product_id)
    ).scalar()
    return int(row) if row else 0

# -----------------------------------------------------------------
# Endpoint: GET /api/quotations
# -----------------------------------------------------------------
@app.get("/api/quotations", response_model=list, tags=["quotations"])
def list_quotations(db: Session = Depends(get_db)):
    """Return all quotations (used by the Pipeline Kanban)."""
    quotations = db.query(Quotation).all()
    return quotations

# -----------------------------------------------------------------
# Endpoint: POST /api/quotations/{id}/calculate-risk
# ---------------------------------------------------------------
@app.post(
    "/quotations/{quotation_id}/calculate-risk",
    response_model=dict,
    tags=["quotations"],
)
def calculate_risk(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    """
    Recalculate the blended discount‑risk score for a quotation.

    * For every line we look at the product’s category.
    * We fetch the DiscountTier that applies to that category
      (category‑specific tier or a global tier where category IS NULL).
    * If the line’s Applied_Discount exceeds the tier’s max_discount_percent,
      the excess is added to the total risk score.
    * Based on the final score we decide the approval level:
        - 0  → quotation already approved (status = "Approved")
        - 1‑20 → Sales Manager approval required (status = "Pending")
        - >20  → Manager + Finance approval required (status = "Pending Review")
    * The quotation status and an initial ApprovalLog entry are written.
    """
    # -----------------------------------------------------------------
    # 1️⃣  Load the quotation (404 if missing)
    # -----------------------------------------------------------------
    quotation = db.get(Quotation, quotation_id)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quotation #{quotation_id} not found",
        )

    # -----------------------------------------------------------------
    # 2️⃣  Gather all lines and compute the risk score
    # -----------------------------------------------------------------
    risk_score = 0

    for line in quotation.lines:                     # relationship "lines" from Quotation
        product = db.get(Product, line.product_id)
        if not product:
            continue

        # -------------------------------------------------------------
        # Find the DiscountTier that governs this product's category
        # -------------------------------------------------------------
        tier = (
            db.execute(
                select(DiscountTier).where(
                    DiscountTier.category == product.category
                )
            )
            .scalars()
            .first()
        )

        # 2) fall back to a global tier (category IS NULL) if nothing matched
        if not tier:
            tier = (
                db.execute(
                    select(DiscountTier).where(DiscountTier.category.is_(None))
                )
                .scalars()
                .first()
            )

        # If no tier exists at all we treat the discount as unrestricted
        if not tier:
            continue   # no risk added

        max_discount = float(tier.max_discount_percent)   # e.g. 15.0 means 15 %
        applied = float(line.applied_discount)           # e.g. 18.5 means 18.5 %

        # Excess over the limit (if any) contributes to the risk score
        if applied > max_discount:
            risk_score += applied - max_discount   # 1 point per 1 % over the limit

    # -----------------------------------------------------------------
    # 3️⃣  Determine approval level and new quotation status
    # -----------------------------------------------------------------
    if risk_score == 0:
        new_status = "Approved"                # no discount over‑run → auto‑approve
        approval_action = "Auto‑approved (risk = 0)"
    elif 1 <= risk_score <= 20:
        new_status = "Pending"                 # Sales Manager needs to sign‑off
        approval_action = f"Risk calculated – score {risk_score}; Sales Manager approval required"
    else:  # risk_score > 20
        new_status = "Pending Review"          # Manager + Finance must sign‑off
        approval_action = f"Risk calculated – score {risk_score}; Manager & Finance approval required"

    # -----------------------------------------------------------------
    # 4️⃣  Persist changes
    # -----------------------------------------------------------------
    quotation.status = new_status          # assume Quotation.status is a String column
    db.add(quotation)

    # Initial ApprovalLog entry – reviewer can be the system user (id=1) or None
    log_entry = ApprovalLog(
        quotation_id=quotation.id,
        reviewer_id=1,                     # <-- replace with real user id if you have auth
        action="Risk Calculated",
        reason=approval_action,
        timestamp=datetime.now(),
    )
    db.add(log_entry)
    db.commit()
    db.refresh(quotation)
    db.refresh(log_entry)

    # -----------------------------------------------------------------
    # 5️⃣  Return a concise response
    # -----------------------------------------------------------------
    return {
        "quotation_id": quotation.id,
        "risk_score": risk_score,
        "new_status": new_status,
        "approval_action": approval_action,
        "approval_log_id": log_entry.id,
    }

# -----------------------------------------------------------------
# Endpoint: POST /api/quotations/{id}/split-fulfillment
# ---------------------------------------------------------------
@app.post(
    "/quotations/{quotation_id}/split-fulfillment",
    response_model=dict,
    tags=["quotations"],
)
def split_fulfillment(
    quotation_id: int,
    payload: SplitFulfillmentRequest,
    db: Session = Depends(get_db),
):
    """
    Returns a suggested multi‑warehouse split for all *physical* items
    on an approved quotation.

    The algorithm:
      • ignore subscription lines
      • for each line, pull from the warehouse with the most stock first
      • a mock shipping‑cost model (1 kg per unit, fixed warehouse distance)
        is used to decide which warehouses minimise the number of shipments.
    If manual_override=True the split is skipped.
    """
    # -----------------------------------------------------------------
    # 1️⃣ Load the quotation – must be approved
    # -----------------------------------------------------------------
    quotation = db.get(Quotation, quotation_id)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quotation #{quotation_id} not found",
        )
    if quotation.status != "Approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotation is not in 'Approved' status (current: {quotation.status})",
        )

    # -----------------------------------------------------------------
    # 2️⃣ Manual‑override shortcut
    # -----------------------------------------------------------------
    if payload.manual_override:
        return {
            "quotation_id": quotation.id,
            "manual_override": True,
            "note": "Split fulfillment bypassed by manual override.",
        }

    # -----------------------------------------------------------------
    # 3️⃣ Gather physical lines (ignore subscriptions)
    # -----------------------------------------------------------------
    physical_lines = [
        line for line in quotation.lines
        if line.is_subscription is False
    ]

    if not physical_lines:
        return {
            "quotation_id": quotation.id,
            "suggestion": "No physical items to split.",
        }

    # -----------------------------------------------------------------
    # 4️⃣ Mock shipping model
    # -----------------------------------------------------------------
    WAREHOUSE_DISTANCE = {
        1: 10,   # Warehouse A – close
        2: 25,   # Warehouse B – medium
        3: 45,   # Warehouse C – far
        # add more warehouses as you create them
    }

    # -----------------------------------------------------------------
    # 5️⃣ Allocate stock per line, trying to minimise shipments
    # -----------------------------------------------------------------
    allocation = {}               # warehouse_id → total qty pulled
    details = {
        "lines_processed": 0,
        "total_requested": 0,
    }

    for line in physical_lines:
        needed = int(line.quantity)
        remaining = needed
        details["lines_processed"] += 1
        details["total_requested"] += needed

        # collect stock from every warehouse we know about
        warehouse_ids = list(WAREHOUSE_DISTANCE.keys())
        warehouse_stock = [
            (wid, _stock_for(line.product_id, wid, db)) for wid in warehouse_ids
        ]
        # sort descending by available stock
        warehouse_stock.sort(key=lambda x: x[1], reverse=True)

        for wh_id, available in warehouse_stock:
            if remaining <= 0:
                break
            if available == 0:
                continue
            take = min(remaining, available)
            allocation[wh_id] = allocation.get(wh_id, 0) + take
            remaining -= take

    # -----------------------------------------------------------------
    # 6️⃣ Build a human‑readable suggestion string
    # -----------------------------------------------------------------
    wh_names = {
        1: "Warehouse A",
        2: "Warehouse B",
        3: "Warehouse C",
    }

    parts = []
    for wh_id, qty in allocation.items():
        if qty:
            parts.append(f"{wh_names.get(wh_id, f'Warehouse {wh_id}')}({qty})")
    suggestion = ", ".join(parts) if parts else "No allocation possible"

    # -----------------------------------------------------------------
    # 7️⃣ Compute how many units could not be satisfied (if any)
    # -----------------------------------------------------------------
    total_pulled = sum(allocation.values())
    total_requested = details["total_requested"]
    unmet = total_requested - total_pulled

    # -----------------------------------------------------------------
    # 8️⃣ Return the result
    # -----------------------------------------------------------------
    return {
        "quotation_id": quotation.id,
        "suggestion": suggestion,
        "unmet_units": unmet,
        "details": details,
    }

# -----------------------------------------------------------------
# Endpoint: GET /api/products/{product_id}/upsells
# ---------------------------------------------------------------
@app.get(
    "/products/{product_id}/upsells",
    response_model=list,
    tags=["products"],
)
def product_upsells(
    product_id: int,
    db: Session = Depends(get_db),
):
    """
    Return a list of suggested upsell products for the given product.
    For each suggestion we calculate a *margin_delta* (extra profit
    if the customer adds it to the quote).

    In this demo the suggestions are the other products that belong
    to the same category, sorted by price descending.  The margin_delta
    is a simple 20 % of the list price.
    """
    # ---- load the reference product ---------------------------------
    ref_product = db.get(Product, product_id)
    if not ref_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found",
        )

    # ---- find other products in the same category --------------------
    suggestions = (
        db.query(Product)
        .filter(Product.category == ref_product.category,
                Product.id != ref_product.id)
        .all()
    )

    # ---- build the response -----------------------------------------
    upsells = []
    for p in suggestions:
        upsells.append(
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "price": p.price,
                "margin_delta": round(p.price * 0.20, 2),   # 20 % margin
            }
        )
    return upsells

# -----------------------------------------------------------------
# Endpoint: GET /api/quotations/{quotation_id}/billing-schedule
# ---------------------------------------------------------------
@app.get(
    "/quotations/{quotation_id}/billing-schedule",
    response_model=None,
    tags=["quotations"],
)
def quotation_billing_schedule(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    """
    Generate a JSON billing schedule that separates one‑time product
    costs from recurring subscription lines.

    For each subscription line we:
      • look up the associated SubscriptionPlan (billing_frequency,
        proration_rule, price)
      • compute the next billing date starting from the quotation’s
        creation date
      • apply a mock proration rule if the quote started mid‑cycle
    """
    # ---- load the quotation -----------------------------------------
    quotation = db.get(Quotation, quotation_id)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quotation #{quotation_id} not found",
        )

    # ---- containers for the two groups --------------------------------
    one_time_lines = []
    sub_lines = []

    # ---- iterate over every line in the quotation --------------------
    for line in quotation.lines:          # relationship "lines" from Quotation
        product = db.get(Product, line.product_id)
        if not product:
            continue

        base_price = float(line.quantity) * product.price   # total line price

        if product.is_subscription:
            # ---- subscription handling ---------------------------------
            plan = (
                db.query(SubscriptionPlan)
                .filter(SubscriptionPlan.name == product.category)   # naive map
                .first()
            )
            if not plan:
                plan = (
                    db.query(SubscriptionPlan)
                    .filter(SubscriptionPlan.billing_frequency == "monthly")
                    .first()
                )
            if not plan:
                plan = SubscriptionPlan(
                    id=1,
                    name="Default",
                    billing_frequency="monthly",
                    proration_rule="none",
                    price=0.0,
                )

            # next billing date (mock) – start from quotation creation
            start_date = quotation.created_at or datetime.now()
            year  = start_date.year + (start_date.month // 12)
            month = start_date.month % 12 + 1
            day   = min(start_date.day, calendar.monthrange(year, month)[1])
            # simple +1 month logic
            next_month = month + 1
            next_year = year + (next_month > 12)
            next_month = 1 if next_month > 12 else next_month
            next_year = year + (next_month == 1 and month == 12) or year
            # Actually use a simple approach:
            # add one month
            if month == 12:
                next_month = 1
                next_year = year + 1
            else:
                next_month = month + 1
                next_year = year
            next_day = min(start_date.day, calendar.monthrange(next_year, next_month)[1])
            next_billing = datetime(next_year, next_month, next_day)

            # mock proration if the quote started mid‑cycle
            mid_cycle = start_date.day > 15
            if mid_cycle:
                portions = {"monthly": 0.5, "quarterly": 0.25, "annually": 1/12}
                portion = portions.get(plan.billing_frequency, 0)
                prorate = round(product.price * portion, 2)
            else:
                prorate = None

            sub_lines.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "product_category": product.category,
                    "unit_price": base_price,
                    "is_subscription": True,
                    "billing_frequency": plan.billing_frequency,
                    "next_billing_date": next_billing.isoformat(),
                    "proration_amount": prorate,
                }
            )
        else:
            # ---- one‑time product --------------------------------------
            one_time_lines.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "product_category": product.category,
                    "unit_price": base_price,
                    "is_subscription": False,
                }
            )

    # ---- return the full schedule ------------------------------------
    return {
        "quotation_id": quotation.id,
        "one_time": one_time_lines,
        "subscriptions": sub_lines,
    }