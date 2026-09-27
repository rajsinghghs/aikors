"""
main.py - FastAPI application entry point
Run with: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load env before imports that depend on it
load_dotenv()

from database import engine, Base
import models  # noqa: F401 — needed to register models with Base

# Import all route modules
from routes import auth, products, payments, orders, admin
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


# ─── App Init ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AIkors API",
    description="Premium digital course & asset selling platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Sabse neeche, routes ke baad
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def serve_index():
    return FileResponse("index.html")

@app.get("/dashboard")
def serve_dashboard():
    return FileResponse("dashboard.html")

@app.get("/admin")
def serve_admin():
    return FileResponse("admin.html")

@app.get("/product-page")
def serve_product():
    return FileResponse("product.html")

# ─── Static File Serving ─────────────────────────────────────────────────────

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(f"{UPLOAD_DIR}/thumbnails", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/files", exist_ok=True)

# Only serve thumbnails publicly — NOT the files directory (protected by auth)
app.mount("/uploads/thumbnails", StaticFiles(directory=f"{UPLOAD_DIR}/thumbnails"), name="thumbnails")

# ─── Routes ──────────────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# ─── DB Init ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    """Create tables and seed admin user on first run."""
    Base.metadata.create_all(bind=engine)
    await seed_admin()


async def seed_admin():
    """Create default admin user if not exists."""
    from database import SessionLocal
    from auth.password import hash_password

    db = SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "AdminPass123!")

        existing = db.query(models.User).filter(
            models.User.email == admin_email
        ).first()

        if not existing:
            admin = models.User(
                name="Admin",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role=models.UserRole.admin
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin created: {admin_email}")
        else:
            print(f"ℹ️  Admin already exists: {admin_email}")
    finally:
        db.close()


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AIkors API"}


# ─── Global Error Handler ────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )
