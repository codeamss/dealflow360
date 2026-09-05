# ---------------------------------------------------------------
#  main.py – FastAPI app + split‑fulfillment endpoint
# ---------------------------------------------------------------
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select

from dealflow360.database import get_db, engine, Base
from dealflow360.models import (
    Quotation,
    QuotationLine,
    Product,
    Inventory,
    Warehouse,
)
from dealflow360.schemas import SplitFulfillmentRequest

# -----------------------------------------------------------------
# FastAPI instance
# -----------------------------------------------------------------
app = FastAPI(
    title="DealFlow360 – B2B Sales Platform",
    version="0.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

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
# Endpoint: POST /api/quotations/{id}/split-fulfillment
# -----------------------------------------------------------------
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
    If ``manual_override`` is ``True`` the split is skipped.
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
    # In a real system you would compute real distances from warehouse
    # addresses. Here we use static distances for a demo.
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