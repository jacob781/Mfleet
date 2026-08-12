from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

import mailer
from rate_limit import limiter
from routers import (
    auth, applications, companies, drivers, driver_form, trucks, compliance,
    export, integrations, employers,
)

load_dotenv()

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(drivers.router)
app.include_router(trucks.router)
app.include_router(compliance.router)
app.include_router(integrations.router)
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
    print(f"--- New Contact Request ---")
    print(f"Name: {form_data.name}")
    print(f"Email: {form_data.email}")
    print(f"Message: {form_data.message}")
    print(f"---------------------------")
    
    success = send_email(form_data)
    
    if not success:
        # In production you might want to log this but still return success to user 
        # or return a specific error if appropriate.
        print("Failed to send email via SMTP.")

    return {"message": "Message received successfully", "data": form_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
