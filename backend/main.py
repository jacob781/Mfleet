from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text
from sqlmodel import Session
import os
import time
from typing import Annotated
from dotenv import load_dotenv

import logs
import mailer
from database import get_session
from rate_limit import limiter
from routers import (
    auth, applications, companies, drivers, driver_form, trucks, compliance,
    export, integrations, employers,
)

load_dotenv()
log = logs.setup()

# A request this slow is worth looking at even when it succeeded.
SLOW_REQUEST_MS = float(os.getenv("SLOW_REQUEST_MS", "1500"))

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(drivers.router)
app.include_router(trucks.router)
app.include_router(compliance.router)
app.include_router(integrations.router)
app.include_router(integrations.motus_router)
app.include_router(employers.router)
app.include_router(applications.router)
app.include_router(driver_form.router)
app.include_router(export.router)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://mfleet.org",
    "https://www.mfleet.org"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JSON lists and the contract PDFs compress well; photos and the already-zipped
# .xlsx do not, and gzip skips them on content type.
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def observe(request: Request, call_next):
    """Time every request, shout about the slow and the broken ones, and keep the
    API out of shared caches — everything behind /api/ is somebody's personal data."""
    started = time.monotonic()
    try:
        response = await call_next(request)
    except Exception:
        log.exception("%s %s raised", request.method, request.url.path)
        raise
    took_ms = (time.monotonic() - started) * 1000
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    if response.status_code >= 500 or took_ms > SLOW_REQUEST_MS:
        log.warning("%s %s -> %d in %.0f ms",
                    request.method, request.url.path, response.status_code, took_ms)
    return response


@app.get("/api/health")
def health(session: Annotated[Session, Depends(get_session)]) -> JSONResponse:
    """Liveness for the host's monitoring: the process answers AND the database does.
    Unauthenticated on purpose, and it says nothing beyond up or down."""
    try:
        session.execute(text("SELECT 1"))
    except Exception:
        log.exception("health check failed")
        return JSONResponse({"status": "error"}, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    return JSONResponse({"status": "ok"})

class ContactForm(BaseModel):
    name: str = Field(..., max_length=150)
    email: EmailStr
    message: str = Field(..., max_length=2500)

def send_email(form_data: ContactForm) -> bool:
    body = (
        f"Name: {form_data.name}\n"
        f"Email: {form_data.email}\n\n"
        f"Message:\n{form_data.message}\n"
    )
    return mailer.send_mail(
        os.getenv("MAIL_TO"),
        f"New Contact Request from {form_data.name}",
        body,
        from_label="Mfleet Contact",
        reply_to=form_data.email,
    )

@app.get("/")
def read_root():
    return {"message": "Mfleet Backend is running"}

@app.post("/api/contact")
@limiter.limit("10/minute")
async def send_contact_email(request: Request, form_data: ContactForm):
    # The visitor's name, address and message are NOT logged — the mail carries them.
    log.info("contact form received")
    if not send_email(form_data):
        log.error("contact form: SMTP send failed")
    return {"message": "Message received successfully", "data": form_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
