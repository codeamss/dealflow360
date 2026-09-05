"""add operational tables.

Revision ID: 002_operational_tables
Revises: 001_initial
Create Date: 2026-09-05 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "002_operational_tables"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "warehouses",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("location", sa.String(), nullable=False),
    )
    op.create_table(
        "inventory",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("warehouse_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["warehouse_id"], ["warehouses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )
    op.create_table(
        "quotations",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("rep_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("blended_risk_score", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rep_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_table(
        "quotation_lines",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("quotation_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("applied_discount", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0"),
        sa.Column("is_subscription", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["quotation_id"], ["quotations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )
    op.create_table(
        "approval_logs",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("quotation_id", sa.Integer(), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["quotation_id"], ["quotations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("approval_logs")
    op.drop_table("quotation_lines")
    op.drop_table("quotations")
    op.drop_table("inventory")
    op.drop_table("warehouses")