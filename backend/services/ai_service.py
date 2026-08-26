import json
import re
import os
from typing import Dict, Any, List
import httpx
from backend.config import GEMINI_API_KEY
from backend.models.schemas import LegalDiagnosticResponse, DocumentScanResponse

class AIService:
    def __init__(self):
        self.gemini_key = GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")

    async def analyze_legal_issue(
        self,
        query_text: str,
        language: str = "auto",
        location: str = "Kolkata, West Bengal",
        budget_max: float = 1000.0,
        preferred_mode: str = "any"
    ) -> LegalDiagnosticResponse:
        """
        Analyzes citizen legal query using Gemini API or rule-based Indian Legal Knowledge Engine.
        """
        if self.gemini_key:
            try:
                llm_result = await self._call_gemini_analysis(query_text, location, budget_max)
                if llm_result:
                    return llm_result
            except Exception as e:
                print(f"[AIService] Gemini API fallback triggered: {e}")

        return self._rule_based_legal_analysis(query_text, location, budget_max)

    async def scan_legal_document(self, document_text: str, document_type: str = "Notice / FIR / Agreement") -> DocumentScanResponse:
        if self.gemini_key:
            try:
                llm_doc = await self._call_gemini_document_scan(document_text, document_type)
                if llm_doc:
                    return llm_doc
            except Exception as e:
                print(f"[AIService] Gemini Document Scan fallback: {e}")

        return self._rule_based_document_scan(document_text, document_type)

    async def _call_gemini_analysis(self, query_text: str, location: str, budget_max: float) -> LegalDiagnosticResponse:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        prompt = f"""
You are the AI Legal Core of 'NyaySetu', an Indian Legal Service Routing platform.
Analyze this citizen legal problem:
Citizen Query: "{query_text}"
Location: "{location}"
Budget Limit: ₹{budget_max}

Respond with ONLY a valid JSON object strictly matching this schema:
{{
  "detected_language": "English / Hindi / Bengali / Tamil / Marathi / etc.",
  "translated_summary": "Plain English concise summary of the issue",
  "primary_category": "Property & Land Disputes | Family & Matrimonial | Labor & Employment | Consumer Protection & Fraud | Cybercrime & Digital Fraud | Criminal & Bail Matters | Civil Contracts & Commercial | Tenancy & Real Estate Rent | Motor Accident Claims (MACT)",
  "sub_category": "e.g. Ancestral land partition, unpaid salary, cheque bounce, etc.",
  "urgency_level": "Immediate / Emergency | High | Moderate | Standard / Advisory",
  "recommended_service_type": "Advocate (District Court) | Advocate (High Court / Supreme Court) | Certified Mediator (ADR) | Arbitrator | Notary Public & Oath Commissioner | Deed & Document Writer | DLSA / NALSA Free Legal Aid Clinic | Lok Adalat Conciliator",
  "applicable_acts": ["List of relevant Indian Acts with sections, e.g. Transfer of Property Act 1882 Section 54"],
  "citizen_rights_summary": "Simple citizen-friendly explanation of rights and immediate actions",
  "estimated_timeline": "e.g. 15 to 45 days for mediation, 6-18 months for civil court",
  "estimated_cost_range": "e.g. ₹0 (Legal Aid) to ₹500 (District Advocate)",
  "free_legal_aid_eligible": true or false,
  "key_factors_extracted": {{
    "dispute_nature": "...",
    "monetary_value": "...",
    "opponent_party": "..."
  }}
}}
"""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                text = re.sub(r"^```json\s*", "", text.strip())
                text = re.sub(r"```$", "", text.strip())
                parsed = json.loads(text)
                return LegalDiagnosticResponse(**parsed)
        return None

    async def _call_gemini_document_scan(self, document_text: str, document_type: str) -> DocumentScanResponse:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        prompt = f"""
You are the Legal Document Risk Scanner of NyaySetu.
Analyze this legal document ({document_type}):
\"\"\"{document_text}\"\"\"

Respond with ONLY valid JSON:
{{
  "summary": "Plain language summary of the document",
  "document_classification": "e.g. Legal Notice / Eviction Notice / Employment NDA / Police FIR / Demand Notice",
  "risk_level": "High Risk | Medium Attention | Standard Form",
  "critical_deadlines": ["e.g. Respond within 15 days of receipt", "Court appearance on 12th next month"],
  "legal_implications": ["Key legal dangers or rights"],
  "recommended_immediate_action": "Clear step-by-step guidance on what citizen should do immediately",
  "recommended_service_type": "Advocate (District Court) | Certified Mediator (ADR) | etc."
}}
"""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                text = re.sub(r"^```json\s*", "", text.strip())
                text = re.sub(r"```$", "", text.strip())
                parsed = json.loads(text)
                return DocumentScanResponse(**parsed)
        return None

    def _rule_based_legal_analysis(self, query_text: str, location: str, budget_max: float) -> LegalDiagnosticResponse:
        """
        High precision Indian Legal Knowledge Base & Intent Classifier supporting native scripts.
        """
        q_raw = query_text
        q_lower = query_text.lower()

        # Language Detection
        detected_lang = "English"
        if re.search(r"[\u0980-\u09FF]", q_raw) or any(w in q_lower for w in ["amar", "bari", "jami", "taka", "poddoti", "padoshi", "poribar"]):
            detected_lang = "Bengali"
        elif re.search(r"[\u0900-\u097F]", q_raw) or any(w in q_lower for w in ["mera", "meri", "zameen", "kabza", "paisa", "padosi", "naukri", "vetan", "patni", "pati", "police", "fir"]):
            detected_lang = "Hindi"
        elif re.search(r"[\u0B80-\u0BFF]", q_raw) or any(w in q_lower for w in ["ennudaiya", "nilam", "panam", "kudumbam"]):
            detected_lang = "Tamil"
        elif any(w in q_lower for w in ["maza", "gharachya", "jameen", "nokri", "karyalay"]):
            detected_lang = "Marathi"

        # Domain Categorization matching English, Romanized, and Indic Native Scripts

        # 1. Property & Land
        land_keywords = [
            "zameen", "land", "plot", "jami", "encroach", "kabza", "boundary", "partition", 
            "property", "registry", "mutation", "khatian", "ancestral", "will", "inheritance",
            "জমিতে", "জমি", "পৈতৃক", "সীমানা", "প্রাচীর", "দখল", "দলিল", "খতিয়ান", "বাড়ি",
            "जमीन", "कब्जा", "सीमा", "प्रॉपर्टी", "मकान", "प्लॉट", "हिस्सा", "बंटवारा", "दस्तावेज",
            "நிலம்", "சொத்து", "பிரிவினை"
        ]
        if any(w in q_raw or w in q_lower for w in land_keywords):
            category = "Property & Land Disputes"
            sub_cat = "Land Encroachment & Title Partition"
            acts = [
                "Transfer of Property Act, 1882 (Sec 54, 105)",
                "Specific Relief Act, 1963 (Sec 5 & 6 - Recovery of Possession)",
                "Indian Succession Act, 1925 (Sec 213 - Probate & Title)",
                "Code of Civil Procedure, 1908 (Order 39 Rule 1 & 2 - Temporary Injunction)"
            ]
            rec_service = "Advocate (District Court)" if budget_max >= 400 else "DLSA / NALSA Free Legal Aid Clinic"
            urgency = "High"
            timeline = "1 to 3 months for injunction / 12-24 months for full partition"
            cost_range = "₹0 (Legal Aid) to ₹500 (District Advocate consultation)"
            rights = "You have the right to seek an immediate status-quo injunction (stay order) under Order 39 CPC against unlawful dispossession without due process of law."
            free_aid = budget_max < 300 or "poor" in q_lower or "bpl" in q_lower

        # 2. Cybercrime & Financial Fraud
        elif any(w in q_raw or w in q_lower for w in [
            "online scam", "fraud", "upi", "cyber", "otp", "phishing", "account hacked", "crypto", "fake loan app", 
            "extortion", "blackmail", "deepfake", "திருடப்பட்டது", "வங்கி", "மோசடி", "साइबर", "धोखाधड़ी"
        ]):
            category = "Cybercrime & Digital Fraud"
            sub_cat = "Digital Financial Fraud & Phishing"
            acts = [
                "Information Technology Act, 2000 (Sec 43, 66C - Identity Theft, 66D - Cheating by Personation)",
                "Bharatiya Nyaya Sanhita, 2023 (Sec 318 - Cheating / Sec 420 IPC)",
                "RBI Circular on Limiting Liability of Customers in Unauthorized Electronic Banking Transactions"
            ]
            rec_service = "Advocate (District Court)"
            urgency = "Immediate / Emergency"
            timeline = "First 24 hours critical (Golden Hour) / 7 to 30 days for bank lien recovery"
            cost_range = "₹400 - ₹600"
            rights = "Zero customer liability if reported within 3 days under RBI guidelines. Right to freeze beneficiary bank accounts via National Cyber Crime Portal (helpline 1930)."
            free_aid = False

        # 3. Family & Matrimonial
        elif any(w in q_raw or w in q_lower for w in [
            "divorce", "patni", "pati", "husband", "wife", "custody", "maintenance", "kharcha", "dowry", "498a", 
            "domestic violence", "bacha", "child", "separation", "alimony", "तलाक", "पत्नी", "पति", "कस्टडी", "सहमति", 
            "विवाह", "भरण-पोषण", "குடும்ப", "விவாகரத்து", "ডিভোর্স", "বিবাহবিচ্ছেদ", "স্বামী", "স্ত্রী"
        ]):
            category = "Family & Matrimonial"
            sub_cat = "Matrimonial Reconciliation & Mutual Custody"
            acts = [
                "Hindu Marriage Act, 1955 (Sec 13B - Mutual Divorce, Sec 24/25 - Maintenance)",
                "Protection of Women from Domestic Violence Act, 2005 (PWDVA Sec 12, 18, 19)",
                "Bharatiya Nagarik Suraksha Sanhita / Sec 125 CrPC (Monthly Maintenance)",
                "Guardians and Wards Act, 1890"
            ]
            rec_service = "Certified Mediator (ADR)"
            urgency = "High" if ("violence" in q_lower or "threat" in q_lower) else "Moderate"
            timeline = "1 to 3 months via Court Mediation / 6 months for Mutual Consent (Sec 13B)"
            cost_range = "₹0 (Free Legal Aid) to ₹550"
            rights = "Right to immediate interim maintenance, residence order under PWDVA, and confidential pre-litigation mediation to safeguard child welfare."
            free_aid = True

        # 4. Labor & Employment
        elif any(w in q_raw or w in q_lower for w in [
            "salary", "naukri", "vetan", "employer", "boss", "fired", "termination", "gratuity", "provident fund", 
            "pf", "wages", "contract", "company", "resignation", "नौकरी", "वेतन", "कर्मचारी", "वेतन रोका", "চাকরি", "বেতন"
        ]):
            category = "Labor & Employment"
            sub_cat = "Unpaid Wages & Wrongful Termination"
            acts = [
                "Industrial Disputes Act, 1947 (Sec 33C - Recovery of Money from Employer)",
                "Payment of Wages Act, 1936 (Sec 15 - Claims of Deductions/Delay)",
                "Code on Wages, 2019",
                "Payment of Gratuity Act, 1972"
            ]
            rec_service = "Certified Mediator (ADR)" if "settle" in q_lower else "Advocate (District Court)"
            urgency = "Moderate"
            timeline = "15 to 45 days through Labor Conciliation / 3-6 months in Labor Tribunal"
            cost_range = "₹300 - ₹800"
            rights = "Employers cannot withhold earned wages or statutory dues. You can issue a formal Legal Demand Notice followed by an application under Sec 33C(2) of Industrial Disputes Act."
            free_aid = False

        # 5. Cheque Bounce / Commercial
        elif any(w in q_raw or w in q_lower for w in ["cheque", "bounce", "138", "dishonour", "cheque notice", "चेक बाउंस", "चेक अनादर"]):
            category = "Civil Contracts & Commercial"
            sub_cat = "Section 138 Negotiable Instrument Cheque Bounce"
            acts = [
                "Negotiable Instruments Act, 1881 (Section 138 - Cheque Dishonour)",
                "Code of Criminal Procedure / BNSS (Summary Trial Procedure)",
                "Indian Contract Act, 1872"
            ]
            rec_service = "Advocate (District Court)"
            urgency = "High"
            timeline = "15 days mandatory statutory notice period / 3-6 months for summary trial"
            cost_range = "₹400 - ₹600"
            rights = "For cheque bounce, mandatory 15-day statutory demand notice must be served within 30 days of bank memo."
            free_aid = False

        # 6. Consumer Protection & Fraud
        elif any(w in q_raw or w in q_lower for w in [
            "amazon", "flipkart", "product", "defective", "warranty", "refund", "shopkeeper", "consumer", 
            "service deficiency", "hospital negligence", "flight refund", "उपभोक्ता", "वारंटी", "क्रेता"
        ]):
            category = "Consumer Protection & Fraud"
            sub_cat = "E-Commerce Warranty & Defective Goods"
            acts = [
                "Consumer Protection Act, 2019 (Sec 35 - Filing before District Commission)",
                "Consumer Protection (E-Commerce) Rules, 2020",
                "Sale of Goods Act, 1930"
            ]
            rec_service = "Advocate (District Court)" if budget_max > 400 else "Lok Adalat Conciliator"
            urgency = "Standard / Advisory"
            timeline = "2 to 4 months through E-Daakhil consumer forum or instant Lok Adalat"
            cost_range = "₹0 (Lok Adalat / E-Daakhil) to ₹450"
            rights = "Right to replacement, 100% refund with interest, and punitive damages for unfair trade practice or misleading advertisement."
            free_aid = False

        # 7. Rent & Tenancy
        elif any(w in q_raw or w in q_lower for w in ["rent", "tenant", "landlord", "evict", "eviction", "किराया", "किरायेदार", "मकान मालिक", "ভাড়া"]):
            category = "Tenancy & Real Estate Rent"
            sub_cat = "Tenancy Agreement & Eviction Dispute"
            acts = [
                "Transfer of Property Act, 1882 (Sec 106 - Notice to Quit)",
                "State Specific Premises Tenancy Act",
                "Indian Contract Act, 1872"
            ]
            rec_service = "Advocate (District Court)"
            urgency = "Moderate"
            timeline = "15 to 30 days notice period"
            cost_range = "₹300 - ₹500"
            rights = "Tenants cannot be dispossessed without due process of law and proper statutory notice."
            free_aid = False

        # 8. Criminal & Bail
        elif any(w in q_raw or w in q_lower for w in ["bail", "police", "arrest", "fir", "jail", "thaney", "custody", "bns", "ipc", "criminal", "जमानत", "गिरफ्तारी", "पुलिस"]):
            category = "Criminal & Bail Matters"
            sub_cat = "Anticipatory & Regular Bail"
            acts = [
                "Bharatiya Nagarik Suraksha Sanhita, 2023 (Sec 482 / Sec 438 CrPC - Anticipatory Bail)",
                "Bharatiya Nagarik Suraksha Sanhita, 2023 (Sec 480 / Sec 437 CrPC - Regular Bail)",
                "Constitution of India (Article 21 & 22 - Right to Legal Counsel & Liberty)"
            ]
            rec_service = "Advocate (District Court)"
            urgency = "Immediate / Emergency"
            timeline = "24 to 48 hours for urgent bail motion"
            cost_range = "₹0 (DLSA Legal Aid) to ₹500"
            rights = "Right to know grounds of arrest, right to be produced before Magistrate within 24 hours, and constitutional right to free legal representation."
            free_aid = True

        else:
            category = "Civil Contracts & Commercial"
            sub_cat = "General Legal Advisory & Conciliation"
            acts = [
                "Code of Civil Procedure, 1908 (Sec 89 - Alternative Dispute Resolution)",
                "Indian Contract Act, 1872 (Sec 73 - Compensation for Breach)",
                "Legal Services Authorities Act, 1987"
            ]
            rec_service = "Certified Mediator (ADR)"
            urgency = "Standard / Advisory"
            timeline = "15 to 30 days"
            cost_range = "₹300 - ₹500"
            rights = "Right to pre-litigation conciliation, fast dispute redressal, and cost-effective legal consultation."
            free_aid = budget_max < 300

        summary = f"Citizen reports issue regarding {sub_cat.lower()} in {detected_lang}: '{query_text[:120]}...'"

        return LegalDiagnosticResponse(
            detected_language=detected_lang,
            translated_summary=summary,
            primary_category=category,
            sub_category=sub_cat,
            urgency_level=urgency,
            recommended_service_type=rec_service,
            applicable_acts=acts,
            citizen_rights_summary=rights,
            estimated_timeline=timeline,
            estimated_cost_range=cost_range,
            free_legal_aid_eligible=free_aid,
            key_factors_extracted={
                "location": location,
                "budget_tier": "Low / Legal Aid" if budget_max <= 300 else ("Affordable (₹300-₹600)" if budget_max <= 600 else "Standard"),
                "urgency_index": urgency,
                "tele_law_suitable": True
            }
        )

    def _rule_based_document_scan(self, document_text: str, document_type: str) -> DocumentScanResponse:
        doc_lower = document_text.lower()
        if "fir" in doc_lower or "police" in doc_lower or "crime" in doc_lower or "offence" in doc_lower:
            return DocumentScanResponse(
                summary="This document appears to be a Police First Information Report (FIR) or Criminal Complaint detailing alleged cognizable offences.",
                document_classification="Police FIR / Criminal Complaint",
                risk_level="High Risk",
                critical_deadlines=["Immediate (Within 24-48 hrs) for anticipatory bail or statement recording"],
                legal_implications=[
                    "Risk of custodial interrogation or formal arrest under BNSS / CrPC",
                    "Mandatory entry in police station general diary",
                    "Right to receive a free certified copy of the FIR"
                ],
                recommended_immediate_action="Do not evade law enforcement. Connect with a criminal defense advocate or DLSA legal aid counsel immediately to move for Anticipatory Bail or Section 41A BNSS notice compliance.",
                recommended_service_type="Advocate (District Court)"
            )
        elif "eviction" in doc_lower or "quit" in doc_lower or "tenant" in doc_lower or "rent" in doc_lower:
            return DocumentScanResponse(
                summary="This document is a formal Notice to Vacate / Eviction Demand issued by the landlord/property owner.",
                document_classification="Tenancy Eviction / Demand Notice",
                risk_level="Medium Attention",
                critical_deadlines=["Statutory 15-day or 30-day response window specified in notice"],
                legal_implications=[
                    "Failure to reply may be treated as admission of default in rent court",
                    "Landlord cannot forcibly evict without an order from the Rent Controller / Civil Court",
                    "Right to deposit undisputed rent into court"
                ],
                recommended_immediate_action="Collate all rent receipts, bank transfer proofs, and lease agreement. Issue a structured written legal reply through a registered advocate.",
                recommended_service_type="Advocate (District Court)"
            )
        elif "demand" in doc_lower or "cheque" in doc_lower or "138" in doc_lower or "dishonour" in doc_lower:
            return DocumentScanResponse(
                summary="This is a Statutory Demand Notice under Section 138 of the Negotiable Instruments Act for cheque dishonour.",
                document_classification="Section 138 Statutory Cheque Dishonour Notice",
                risk_level="High Risk",
                critical_deadlines=["Strict 15-day statutory repayment / response window from date of receipt"],
                legal_implications=[
                    "If payment is not settled within 15 days, payee has 30 days to file a criminal complaint",
                    "Offence punishable with up to 2 years imprisonment or twice the cheque amount",
                    "Opportunity to propose out-of-court settlement via mediation"
                ],
                recommended_immediate_action="Audit bank statements and return memo reason (e.g. stop payment vs funds insufficient). File a point-by-point rebuttal or seek mediation settlement.",
                recommended_service_type="Advocate (District Court)"
            )
        else:
            return DocumentScanResponse(
                summary="The uploaded document contains legal clauses, terms, or formal correspondence requiring expert verification.",
                document_classification="General Legal Agreement / Formal Notice",
                risk_level="Medium Attention",
                critical_deadlines=["Check effective date and termination notice clause (usually 30 days)"],
                legal_implications=[
                    "Binding dispute resolution clause (Arbitration vs Court Jurisdiction)",
                    "Potential liability or indemnity exposures"
                ],
                recommended_immediate_action="Have a verified advocate or notary review the clause ambiguities before signing or replying.",
                recommended_service_type="Certified Mediator (ADR)"
            )

ai_service = AIService()
