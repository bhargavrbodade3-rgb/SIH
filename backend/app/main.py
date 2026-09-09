import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import *  # Ensure all models are registered
from backend.app.services.seed_data import seed_database
from backend.app.routers import (
    auth, business, approvals, documents, applications,
    queries, inspections, renewals, schemes, notifications, analytics, ai,
    grievances, knowledge_base, roadmap
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

def run_schema_migrations():
    """Ensure newly added columns exist in SQLite database without requiring data wipe."""
    if settings.DATABASE_URL.startswith("sqlite"):
        import sqlite3
        db_file = settings.DATABASE_URL.replace("sqlite:///", "").replace("./", "")
        if os.path.exists(db_file):
            try:
                conn = sqlite3.connect(db_file)
                cursor = conn.cursor()
                def add_col(tbl, col, def_type):
                    cursor.execute(f"PRAGMA table_info({tbl})")
                    cols = [r[1] for r in cursor.fetchall()]
                    if col not in cols:
                        cursor.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} {def_type}")
                        conn.commit()

                add_col("businesses", "premises_type", "VARCHAR(50) DEFAULT 'RENTED'")
                add_col("businesses", "electricity_load_kw", "VARCHAR(50)")
                add_col("businesses", "water_usage_lpd", "VARCHAR(50)")
                add_col("businesses", "food_handling", "BOOLEAN DEFAULT 0")
                add_col("businesses", "manufacturing_activity", "BOOLEAN DEFAULT 1")
                add_col("businesses", "construction_activity", "BOOLEAN DEFAULT 0")
                add_col("businesses", "storage_activity", "BOOLEAN DEFAULT 0")
                add_col("businesses", "logistics_activity", "BOOLEAN DEFAULT 0")
                add_col("businesses", "sector_answers", "TEXT")
                conn.close()
            except Exception as ex:
                print(f"Schema migration notice: {ex}")

run_schema_migrations()

# Auto seed demo data
with SessionLocal() as db_session:
    try:
        seed_database(db_session)
    except Exception as e:
        print(f"Error during auto-seeding: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="One Platform from Approval Discovery to Document Readiness to Compliance. (SIH MVP)",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(business.router, prefix=api_prefix)
app.include_router(approvals.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(applications.router, prefix=api_prefix)
app.include_router(queries.router, prefix=api_prefix)
app.include_router(inspections.router, prefix=api_prefix)
app.include_router(renewals.router, prefix=api_prefix)
app.include_router(schemes.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(ai.router, prefix=api_prefix)
app.include_router(grievances.router, prefix=api_prefix)
app.include_router(knowledge_base.router, prefix=api_prefix)
app.include_router(roadmap.router, prefix=api_prefix)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "demo_mode": settings.DEMO_MODE,
        "database": "connected",
        "disclaimer": "DEMO REGULATORY DATA — FOR PROTOTYPE DEMONSTRATION ONLY"
    }

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "docs": "/docs",
        "demo_disclaimer": "DEMO REGULATORY DATA — FOR PROTOTYPE DEMONSTRATION ONLY"
    }
