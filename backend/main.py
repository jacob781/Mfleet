from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default
    # Add your VPS domain here later, e.g., "https://yourdomain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development/testing ease, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    message: str

def send_email(form_data: ContactForm):
    try:
        sender_email = os.getenv("MAIL_USERNAME")
        sender_password = os.getenv("MAIL_PASSWORD")
        smtp_server = os.getenv("MAIL_SERVER")
        smtp_port = int(os.getenv("MAIL_PORT", 587))
        receiver_email = os.getenv("MAIL_TO")

        if not sender_email or not sender_password:
            print("Error: Mail credentials not set in .env")
            return False

        message = MIMEMultipart()
        message["From"] = f"Mfleet Contact <{sender_email}>"
        message["To"] = receiver_email
        message["Subject"] = f"New Contact Request from {form_data.name}"
        message["Reply-To"] = form_data.email

        body = f"""
        Name: {form_data.name}
        Email: {form_data.email}
        
        Message:
        {form_data.message}
        """
        message.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@app.get("/")
def read_root():
    return {"message": "Mfleet Backend is running"}

@app.post("/api/contact")
async def send_contact_email(form_data: ContactForm):
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
