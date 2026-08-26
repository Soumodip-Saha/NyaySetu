import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# Supported Legal Domains
LEGAL_DOMAINS = [
    "Property & Land Disputes",
    "Family & Matrimonial",
    "Labor & Employment",
    "Consumer Protection & Fraud",
    "Cybercrime & Digital Fraud",
    "Criminal & Bail Matters",
    "Civil Contracts & Commercial",
    "Tenancy & Real Estate Rent",
    "RTI & Administrative Law",
    "Motor Accident Claims (MACT)"
]

# Service Provider Types
PROVIDER_TYPES = [
    "Advocate (District Court)",
    "Advocate (High Court / Supreme Court)",
    "Certified Mediator (ADR)",
    "Arbitrator",
    "Notary Public & Oath Commissioner",
    "Deed & Document Writer",
    "DLSA / NALSA Free Legal Aid Clinic",
    "Lok Adalat Conciliator"
]

# Supported Languages
SUPPORTED_LANGUAGES = [
    "English",
    "Hindi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Marathi",
    "Gujarati",
    "Kannada",
    "Malayalam",
    "Punjabi"
]
