import json
import re
import os
from typing import Dict, Any, List
import httpx
from backend.config import GEMINI_API_KEY
from backend.models.schemas import LegalDiagnosticResponse, DocumentScanResponse, ConstitutionRef

class AIService:
    def __init__(self):
        self.gemini_key = GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.constitution_data = self._load_constitution_data()

    def _load_constitution_data(self) -> Dict[str, Any]:
        path = os.path.join(os.path.dirname(__file__), "..", "data", "constitution_data.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"articles": [], "amendments": []}

    def _evaluate_query_domain(self, query_text: str) -> tuple[bool, str, str, List[str]]:
        """
        Evaluates citizen query intent and domain:
        Returns: (is_valid_legal_query, query_nature, guidance_message, suggested_tips)
        where query_nature is 'legal', 'medical', 'out_of_domain', or 'insufficient_context'.
        """
        clean = query_text.strip().lower()
        if len(clean) < 6:
            return (
                False,
                "insufficient_context",
                "⚠️ Insufficient Details: Please describe your legal dispute with a few more words.",
                [
                    "1. State what happened (e.g. Land dispute, unpaid salary, cheque bounce)",
                    "2. Mention the parties involved (e.g. Neighbor, employer, bank)",
                    "3. Specify what relief you are seeking (e.g. Stay order, wage recovery, bail)"
                ]
            )

        # Check if medical words are present alongside legal dispute/remedy markers
        # (e.g. "Hospital negligence during surgery, want to file medical malpractice lawsuit")
        legal_remedy_markers = [
            "negligence", "malpractice", "sue", "compensation", "consumer forum", "consumer court",
            "consumer protection", "fir", "police", "court", "complaint against hospital",
            "overbilling", "expired medicine", "adulteration", "fake medicine", "quack",
            "bns", "ipc", "legal notice", "damages", "liable", "tort"
        ]
        has_legal_remedy = any(m in clean for m in legal_remedy_markers)

        # Comprehensive list of medical symptoms, illnesses, and bodily ailments
        medical_symptom_markers = [
            "loose motion", "loose motions", "diarrhea", "diarrhoea", "dysentery", "vomiting", "vomit",
            "nausea", "headache", "head ache", "stomach ache", "stomach pain", "stomach upset", "pet kharab",
            "tummy ache", "chest pain", "fever", "bukhar", "high fever", "cold and cough", "cough",
            "khansi", "runny nose", "sore throat", "throat infection", "body pain", "back pain", "joint pain",
            "dizzy", "dizziness", "food poisoning", "infection", "rash", "rashes", "itching", "allergy",
            "allergic", "blood pressure", "high bp", "low bp", "diabetes", "sugar level", "heart attack",
            "cardiac", "stroke", "paralysis", "pregnancy", "pregnant", "period pain", "cramps", "cancer",
            "tumor", "appendix", "paracetamol", "antibiotic", "ors", "tablet", "medicine", "pill", "syrup",
            "prescription", "doctor consultation", "physician", "pediatrician", "surgeon",
            "dengue", "malaria", "typhoid", "covid", "corona", "fracture", "burns", "wound", "pus",
            "stool", "urine", "bleed", "bleeding", "dast", "ulti", "dard", "dawai", "ilaj", "bimar",
            "bimari", "পেটের অসুখ", "ডায়রিয়া", "বমি", "জ্বর", "কাশি", "সর্দি", "মাথা ব্যথা", "পেট ব্যথা",
            "পাতলা পায়খানা", "ঔষধ", "ওষুধ", "চিকিৎসা", "অসুখ", "வயிற்றுப்போக்கு", "வாந்தி", "காய்ச்சல்",
            "தலைவலி", "மருத்துவர்", "மருந்து"
        ]

        if any(m in clean for m in medical_symptom_markers) and not has_legal_remedy:
            return (
                False,
                "medical",
                "🩺 Non-Legal / Medical Concern Detected: NyaySetu is an AI Legal Service Routing portal. For medical symptoms, physical illness (such as loose motions, fever, or pain), and healthcare advice, please consult a registered medical doctor or visit a healthcare clinic.",
                [
                    "National Health Helpline (Govt of India): Call 1075 or Emergency: 112",
                    "For dehydration / loose motions: Consume Oral Rehydration Salts (ORS) and clean fluids, and rest",
                    "Visit your nearest Primary Health Centre (PHC), clinic, or licensed doctor for clinical diagnosis",
                    "If you are reporting medical malpractice or hospital overbilling, please specify the legal dispute facts"
                ]
            )

        # Check for general out-of-domain topics (cooking, weather, programming, casual chat)
        out_of_domain_markers = [
            "recipe", "how to cook", "ingredients for", "baking", "biryani", "how to make cake", "make tea",
            "python code", "write code", "javascript", "html css", "debug error", "programming", "sql query",
            "weather forecast", "temperature today", "rain today", "cricket score", "ipl score",
            "tell me a joke", "write a poem", "who is the prime minister", "capital of", "photosynthesis"
        ]
        if any(m in clean for m in out_of_domain_markers) and not has_legal_remedy:
            return (
                False,
                "out_of_domain",
                "⚠️ Non-Legal Query Detected: NyaySetu is designed specifically for legal disputes, statutory Indian Acts, and constitutional safeguards under the Constitution of India. We could not find any legal dispute or statutory issue in your query.",
                [
                    "Please state a civil, criminal, property, family, labor, cyber, or consumer dispute",
                    "Example: 'Neighbor encroaching boundary', 'Unpaid salary for 3 months', 'Online UPI cyber fraud'",
                    "Or select one of our 1-click test scenarios above"
                ]
            )

        # Check for trivial greetings and low-information queries
        trivial_phrases = [
            "hello", "hi", "hey", "namaste", "vanakkam", "hola", "good morning", "good evening",
            "test", "testing", "asdf", "asdfgh", "qwerty", "zxcv", "12345", "123", "abc", "xyz",
            "what is this", "who are you", "how are you", "help", "please help", "lawyer", "advocate",
            "court", "legal", "problem", "i have a problem", "kuch nahi", "nothing", "food", "weather"
        ]
        if clean in trivial_phrases:
            return (
                False,
                "insufficient_context",
                "⚠️ Insufficient Legal Context: We could not identify a specific legal issue or dispute from your description. To help NyaySetu accurately diagnose your case, identify statutory Indian Acts & Constitutional rights, and connect you with the right verified advocate, please provide a few key details.",
                [
                    "1. State what happened (e.g. 'Neighbor built a wall on our ancestral land', 'Employer withheld 3 months salary', 'Received a Section 138 cheque bounce notice')",
                    "2. Mention the parties involved (e.g. Neighbor, employer, bank, landlord/tenant, spouse)",
                    "3. Specify what relief you are seeking (e.g. Urgent court stay order, wage recovery, mutual separation, criminal bail)"
                ]
            )

        if len(set(clean)) <= 3 and len(clean) > 5:
            return (
                False,
                "insufficient_context",
                "⚠️ Invalid / Repetitive Input Detected: Please describe a genuine legal dispute.",
                [
                    "Please avoid repetitive letters or random keystrokes",
                    "Explain your legal grievance in clear words in any Indian language"
                ]
            )

        return (True, "legal", "", [])

    async def analyze_legal_issue(
        self,
        query_text: str,
        language: str = "auto",
        location: str = "Kolkata, West Bengal",
        budget_max: float = 1000.0,
        preferred_mode: str = "any"
    ) -> LegalDiagnosticResponse:
        """
        Analyzes citizen legal query with context validation, medical detection, and Constitutional mapping.
        """
        # 1. Comprehensive domain and intent check
        is_valid, nature, guidance_msg, tips = self._evaluate_query_domain(query_text)
        if not is_valid:
            return LegalDiagnosticResponse(
                is_valid_legal_query=False,
                query_nature=nature,
                guidance_message=guidance_msg,
                suggested_tips=tips,
                detected_language="English",
                translated_summary=f"Non-legal query detected ({nature}).",
                primary_category="Medical Concern" if nature == "medical" else ("Non-Legal / General Inquiry" if nature == "out_of_domain" else "General Inquiry (Needs More Context)"),
                sub_category="Please seek medical care" if nature == "medical" else "Please provide legal dispute details",
                urgency_level="Standard / Advisory",
                recommended_service_type="Medical Doctor / Healthcare Professional" if nature == "medical" else "Legal Information Desk",
                applicable_acts=[],
                constitutional_articles=[
                    ConstitutionRef(
                        article="Article 21",
                        title="Right to Health & Life (Article 21)",
                        summary="The Supreme Court has recognized the right to health and medical care as part of Article 21."
                    )
                ] if nature == "medical" else [],
                citizen_rights_summary="NyaySetu is an AI legal portal. For health concerns or medical symptoms, please consult a qualified doctor." if nature == "medical" else "Please provide an actionable legal dispute so we can map statutory remedies.",
                estimated_timeline="N/A",
                estimated_cost_range="N/A",
                free_legal_aid_eligible=False,
                key_factors_extracted={"query_nature": nature}
            )

        # 2. If Gemini Key is present, try LLM first with fallback
        if self.gemini_key:
            try:
                llm_result = await self._call_gemini_analysis(query_text, location, budget_max)
                if llm_result:
                    return llm_result
            except Exception as e:
                print(f"[AIService] Gemini API fallback triggered: {e}")

        return self._rule_based_legal_analysis(query_text, location, budget_max)

    async def scan_legal_document(self, document_text: str, document_type: str = "Notice / FIR / Agreement") -> DocumentScanResponse:
        if len(document_text.strip()) < 15 or self._is_low_context_or_gibberish(document_text):
            return DocumentScanResponse(
                is_valid_document=False,
                guidance_message="⚠️ Insufficient Document Text: The uploaded text does not appear to contain recognizable legal clauses, statutory notices, or court complaints. Please paste the full text or main paragraphs of your legal notice, FIR, or contract.",
                summary="Uploaded text lacks sufficient legal substance for analysis.",
                document_classification="Unrecognized / Incomplete Text",
                risk_level="Standard Form",
                critical_deadlines=[],
                legal_implications=["Cannot assess legal liability without substantive document text."],
                constitutional_context="Ensure the document pertains to an actionable statutory right.",
                recommended_immediate_action="Paste the complete text or key operative clauses of the notice/agreement.",
                recommended_service_type="Notary Public / Document Specialist"
            )

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
You are the AI Legal Core of 'NyaySetu', an Indian Legal Service Routing platform grounded in The Constitution of India (2026 Edition).
Analyze this citizen query:
Citizen Query: "{query_text}"
Location: "{location}"
Budget Limit: ₹{budget_max}

CRITICAL DOMAIN CHECK:
Determine if the query describes a legal problem or dispute:
1. If the query is MEDICAL or PHYSICAL HEALTH related (e.g. loose motion, fever, sickness, headache, medicine, bodily symptoms):
   Set "is_valid_legal_query": false, "query_nature": "medical", "guidance_message": "🩺 Non-Legal / Medical Concern Detected: NyaySetu is an AI legal service routing portal. For physical symptoms, illness, or medical advice, please consult a registered medical doctor or visit a healthcare clinic (National Health Helpline: 1075 / Emergency: 112).", "primary_category": "Medical Concern", "suggested_tips": ["Consult a qualified doctor or healthcare clinic", "For emergency medical care call 1075 or 112", "If reporting medical negligence or hospital malpractice, please provide the legal dispute details"].
2. If the query is OUT-OF-DOMAIN NON-LEGAL (e.g. cooking recipes, coding, weather, trivia, casual chat):
   Set "is_valid_legal_query": false, "query_nature": "out_of_domain", "guidance_message": "⚠️ Non-Legal Query Detected: NyaySetu is designed specifically for legal disputes, statutory Indian Acts, and constitutional rights. Please describe an actionable legal dispute.", "primary_category": "Non-Legal / General Query".
3. If it is a GENUINE LEGAL DISPUTE (Property, Family, Labor, Consumer, Cyber, Criminal, Civil contracts, Tenancy):
   Set "is_valid_legal_query": true, "query_nature": "legal".

Respond with ONLY a valid JSON object strictly matching this schema:
{{
  "is_valid_legal_query": true,
  "query_nature": "legal / medical / out_of_domain / insufficient_context",
  "guidance_message": null,
  "suggested_tips": [],
  "detected_language": "English / Hindi / Bengali / Tamil / Marathi / etc.",
  "translated_summary": "Plain English concise summary of the issue",
  "primary_category": "Property & Land Disputes | Family & Matrimonial | Labor & Employment | Consumer Protection & Fraud | Cybercrime & Digital Fraud | Criminal & Bail Matters | Civil Contracts & Commercial | Tenancy & Real Estate Rent | Motor Accident Claims (MACT)",
  "sub_category": "e.g. Ancestral land partition, unpaid salary, cheque bounce, etc.",
  "urgency_level": "Immediate / Emergency | High | Moderate | Standard / Advisory",
  "recommended_service_type": "Advocate (District Court) | Advocate (High Court / Supreme Court) | Certified Mediator (ADR) | Arbitrator | Notary Public & Oath Commissioner | Deed & Document Writer | DLSA / NALSA Free Legal Aid Clinic | Lok Adalat Conciliator",
  "applicable_acts": ["List of relevant Indian Acts with sections, e.g. Transfer of Property Act 1882 Section 54"],
  "constitutional_articles": [
    {{"article": "Article 39A", "title": "Equal justice and free legal aid", "summary": "Guarantees free legal representation"}},
    {{"article": "Article 300A", "title": "Right to Property", "summary": "Protects against unlawful deprivation of property"}}
  ],
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
Analyze this legal document ({document_type}) with constitutional jurisprudence backing:
\"\"\"{document_text}\"\"\"

Respond with ONLY valid JSON:
{{
  "is_valid_document": true,
  "guidance_message": null,
  "summary": "Plain language summary of the document",
  "document_classification": "e.g. Legal Notice / Eviction Notice / Employment NDA / Police FIR / Demand Notice",
  "risk_level": "High Risk | Medium Attention | Standard Form",
  "critical_deadlines": ["e.g. Respond within 15 days of receipt", "Court appearance on 12th next month"],
  "legal_implications": ["Key legal dangers or rights"],
  "constitutional_context": "Relevant Constitutional provisions (e.g. Article 21, 22(1), Article 39A)",
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

        # Domain Categorization and Constitutional Backing

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
            const_articles = [
                ConstitutionRef(
                    article="Article 300A",
                    title="Right to Property (44th Amendment Act, 1978)",
                    summary="No person shall be deprived of his property save by authority of law."
                ),
                ConstitutionRef(
                    article="Article 226",
                    title="Power of High Courts to issue Writs",
                    summary="High Court writ jurisdiction for protection of legal and property rights."
                ),
                ConstitutionRef(
                    article="Article 39A",
                    title="Equal Justice and Free Legal Aid (42nd Amendment)",
                    summary="Subsidized legal aid for low-income citizens facing dispossession."
                )
            ]
            rec_service = "Advocate (District Court)" if budget_max >= 400 else "DLSA / NALSA Free Legal Aid Clinic"
            urgency = "High"
            timeline = "1 to 3 months for injunction / 12-24 months for full partition"
            cost_range = "₹0 (Legal Aid) to ₹500 (District Advocate consultation)"
            rights = "Under Article 300A of the Constitution and Order 39 CPC, you have the right to seek an immediate status-quo injunction (stay order) against unlawful encroachment."
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
            const_articles = [
                ConstitutionRef(
                    article="Article 21",
                    title="Right to Privacy & Financial Security",
                    summary="Protection of personal financial data, informational privacy, and digital liberty."
                ),
                ConstitutionRef(
                    article="Article 14",
                    title="Equality Before Law & Fair Administrative Protection",
                    summary="Right to prompt state cyber policing and regulatory banking redressal."
                )
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
            const_articles = [
                ConstitutionRef(
                    article="Article 15(3)",
                    title="Special Provisions for Women and Children",
                    summary="Constitutional mandate enabling protective social legislations for women."
                ),
                ConstitutionRef(
                    article="Article 39A",
                    title="Free Legal Aid (NALSA / Nyaya Bandhu)",
                    summary="Women and children are constitutionally entitled to 100% free legal aid."
                ),
                ConstitutionRef(
                    article="Article 21",
                    title="Dignified Life & Child Welfare",
                    summary="Paramount consideration of child's best interests in custody."
                )
            ]
            rec_service = "Certified Mediator (ADR)"
            urgency = "High" if ("violence" in q_lower or "threat" in q_lower) else "Moderate"
            timeline = "1 to 3 months via Court Mediation / 6 months for Mutual Consent (Sec 13B)"
            cost_range = "₹0 (Free Legal Aid) to ₹550"
            rights = "Under Article 15(3) and PWDVA, you have the right to immediate interim maintenance, residence orders, and confidential pre-litigation mediation."
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
            const_articles = [
                ConstitutionRef(
                    article="Article 23",
                    title="Prohibition of Traffic in Human Beings and Begar (Forced Labour)",
                    summary="Withholding earned remuneration constitutes forced/begar exploitation."
                ),
                ConstitutionRef(
                    article="Article 39(d)",
                    title="Equal Pay for Equal Work",
                    summary="State policy towards non-discriminatory wages."
                ),
                ConstitutionRef(
                    article="Article 323A",
                    title="Administrative & Labor Tribunals",
                    summary="Specialized tribunal recourse for speedy employment dispute adjudication."
                )
            ]
            rec_service = "Certified Mediator (ADR)" if "settle" in q_lower else "Advocate (District Court)"
            urgency = "Moderate"
            timeline = "15 to 45 days through Labor Conciliation / 3-6 months in Labor Tribunal"
            cost_range = "₹300 - ₹800"
            rights = "Employers cannot withhold earned wages or statutory dues. Under Article 23 and Sec 33C Industrial Disputes Act, you have right to summary money recovery."
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
            const_articles = [
                ConstitutionRef(
                    article="Article 14",
                    title="Equality & Commercial Fair Play",
                    summary="Equitable enforcement of commercial negotiable instruments."
                ),
                ConstitutionRef(
                    article="Article 21",
                    title="Protection Against Arbitrary Imprisonment",
                    summary="Due process requirements for criminal statutory notices."
                )
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
            const_articles = [
                ConstitutionRef(
                    article="Article 19(1)(g)",
                    title="Right to Trade with Fair Consumer Standards",
                    summary="Regulates unfair trade practices and false advertising."
                ),
                ConstitutionRef(
                    article="Article 39A",
                    title="Access to Summary Consumer Justice",
                    summary="Enables low-cost Lok Adalat and E-Daakhil dispute redressal."
                )
            ]
            rec_service = "Advocate (District Court)" if budget_max > 400 else "Lok Adalat Conciliator"
            urgency = "Standard / Advisory"
            timeline = "2 to 4 months through E-Daakhil consumer forum or instant Lok Adalat"
            cost_range = "₹0 (Lok Adalat / E-Daakhil) to ₹450"
            rights = "Right to replacement, 100% refund with interest, and punitive damages for unfair trade practice."
            free_aid = False

        # 7. Criminal & Bail
        elif any(w in q_raw or w in q_lower for w in ["bail", "police", "arrest", "fir", "jail", "thaney", "custody", "bns", "ipc", "criminal", "जमानत", "गिरफ्तारी", "पुलिस"]):
            category = "Criminal & Bail Matters"
            sub_cat = "Anticipatory & Regular Bail"
            acts = [
                "Bharatiya Nagarik Suraksha Sanhita, 2023 (Sec 482 / Sec 438 CrPC - Anticipatory Bail)",
                "Bharatiya Nagarik Suraksha Sanhita, 2023 (Sec 480 / Sec 437 CrPC - Regular Bail)",
                "Constitution of India (Article 21 & 22 - Right to Legal Counsel & Liberty)"
            ]
            const_articles = [
                ConstitutionRef(
                    article="Article 21",
                    title="Protection of Life and Personal Liberty",
                    summary="Core fundamental right guaranteeing bail as rule and jail as exception."
                ),
                ConstitutionRef(
                    article="Article 22(1)",
                    title="Right to be Defended by Legal Practitioner of Choice",
                    summary="Mandatory right to counsel immediately upon arrest."
                ),
                ConstitutionRef(
                    article="Article 22(2)",
                    title="Mandatory Magistrate Production within 24 Hours",
                    summary="Constitutional protection against illegal custodial detention."
                )
            ]
            rec_service = "Advocate (District Court)"
            urgency = "Immediate / Emergency"
            timeline = "24 to 48 hours for urgent bail motion"
            cost_range = "₹0 (DLSA Legal Aid) to ₹500"
            rights = "Under Article 21 & 22(1), you have absolute right to legal representation and production before magistrate within 24 hours."
            free_aid = True

        else:
            # Check if there are any general legal, contract, court, police, or civil dispute terms
            general_legal_markers = [
                "contract", "agreement", "cheque", "money", "dispute", "breach", "notice", "rights",
                "fraud", "lawyer", "advocate", "court", "police", "claim", "damage", "debt", "loan",
                "compensation", "arbitration", "terms", "partnership", "legal", "clause", "stamp paper",
                "notary", "affidavit", "power of attorney", "deed", "settlement", "litigation", "jurisdiction",
                "suit", "vakil", "kanoon", "adhikar", "mukadma", "nyay", "আইন", "আদালত", "মামলা", "চুক্তি",
                "சட்டம்", "நீதிமன்றம்", "வழக்கு"
            ]
            if not any(m in q_lower for m in general_legal_markers):
                return LegalDiagnosticResponse(
                    is_valid_legal_query=False,
                    query_nature="out_of_domain",
                    guidance_message="⚠️ Non-Legal Query Detected: NyaySetu is an AI platform dedicated to legal disputes and citizen rights under Indian Law. We could not find any legal dispute, statutory grievance, or rights violation in your query. Please describe an actionable legal issue.",
                    suggested_tips=[
                        "State what legal dispute or rights violation occurred (e.g. Land boundary dispute, unpaid wages, online financial fraud)",
                        "Mention the parties involved (e.g. Neighbor, employer, bank, tenant/landlord)",
                        "Specify the legal relief sought (e.g. Court stay order, wage recovery, mutual separation, criminal bail)"
                    ],
                    detected_language=detected_lang,
                    translated_summary="Query does not describe an actionable legal dispute or civil matter.",
                    primary_category="Non-Legal / General Query",
                    sub_category="Please provide dispute details",
                    urgency_level="Standard / Advisory",
                    recommended_service_type="Legal Information Desk",
                    applicable_acts=[],
                    constitutional_articles=[],
                    citizen_rights_summary="Please describe an actionable legal issue so we can map statutory Indian Acts and Constitutional remedies.",
                    estimated_timeline="N/A",
                    estimated_cost_range="N/A",
                    free_legal_aid_eligible=False,
                    key_factors_extracted={"query_nature": "out_of_domain"}
                )

            category = "Civil Contracts & Commercial"
            sub_cat = "General Legal Advisory & Conciliation"
            acts = [
                "Code of Civil Procedure, 1908 (Sec 89 - Alternative Dispute Resolution)",
                "Indian Contract Act, 1872 (Sec 73 - Compensation for Breach)",
                "Legal Services Authorities Act, 1987"
            ]
            const_articles = [
                ConstitutionRef(
                    article="Article 39A",
                    title="Equal Justice and Free Legal Aid (42nd Amendment)",
                    summary="State obligation to provide access to justice for all citizens."
                ),
                ConstitutionRef(
                    article="Article 14",
                    title="Equality Before Law",
                    summary="Equal protection of the laws across all courts and forums."
                )
            ]
            rec_service = "Certified Mediator (ADR)"
            urgency = "Standard / Advisory"
            timeline = "15 to 30 days"
            cost_range = "₹300 - ₹500"
            rights = "Right to pre-litigation conciliation, fast dispute redressal, and cost-effective legal consultation."
            free_aid = budget_max < 300

        summary = f"Citizen reports issue regarding {sub_cat.lower()} in {detected_lang}: '{query_text[:120]}...'"

        return LegalDiagnosticResponse(
            is_valid_legal_query=True,
            detected_language=detected_lang,
            translated_summary=summary,
            primary_category=category,
            sub_category=sub_cat,
            urgency_level=urgency,
            recommended_service_type=rec_service,
            applicable_acts=acts,
            constitutional_articles=const_articles,
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
                is_valid_document=True,
                summary="This document appears to be a Police First Information Report (FIR) or Criminal Complaint detailing alleged cognizable offences.",
                document_classification="Police FIR / Criminal Complaint",
                risk_level="High Risk",
                critical_deadlines=["Immediate (Within 24-48 hrs) for anticipatory bail or statement recording"],
                legal_implications=[
                    "Risk of custodial interrogation or formal arrest under BNSS / CrPC",
                    "Mandatory entry in police station general diary",
                    "Right to receive a free certified copy of the FIR"
                ],
                constitutional_context="Protected under Article 21 (Personal Liberty) and Article 22(1) (Right to consult and be defended by a legal practitioner of choice).",
                recommended_immediate_action="Do not evade law enforcement. Connect with a criminal defense advocate or DLSA legal aid counsel immediately to move for Anticipatory Bail or Section 41A BNSS notice compliance.",
                recommended_service_type="Advocate (District Court)"
            )
        elif "eviction" in doc_lower or "quit" in doc_lower or "tenant" in doc_lower or "rent" in doc_lower:
            return DocumentScanResponse(
                is_valid_document=True,
                summary="This document is a formal Notice to Vacate / Eviction Demand issued by the landlord/property owner.",
                document_classification="Tenancy Eviction / Demand Notice",
                risk_level="Medium Attention",
                critical_deadlines=["Statutory 15-day or 30-day response window specified in notice"],
                legal_implications=[
                    "Failure to reply may be treated as admission of default in rent court",
                    "Landlord cannot forcibly evict without an order from the Rent Controller / Civil Court",
                    "Right to deposit undisputed rent into court"
                ],
                constitutional_context="Article 300A (Right to Property & Shelter under Article 21) protects against extra-judicial eviction.",
                recommended_immediate_action="Collate all rent receipts, bank transfer proofs, and lease agreement. Issue a structured written legal reply through a registered advocate.",
                recommended_service_type="Advocate (District Court)"
            )
        elif "demand" in doc_lower or "cheque" in doc_lower or "138" in doc_lower or "dishonour" in doc_lower:
            return DocumentScanResponse(
                is_valid_document=True,
                summary="This is a Statutory Demand Notice under Section 138 of the Negotiable Instruments Act for cheque dishonour.",
                document_classification="Section 138 Statutory Cheque Dishonour Notice",
                risk_level="High Risk",
                critical_deadlines=["Strict 15-day statutory repayment / response window from date of receipt"],
                legal_implications=[
                    "If payment is not settled within 15 days, payee has 30 days to file a criminal complaint",
                    "Offence punishable with up to 2 years imprisonment or twice the cheque amount",
                    "Opportunity to propose out-of-court settlement via mediation"
                ],
                constitutional_context="Subject to judicial fair trial safeguards under Article 14 and Article 21.",
                recommended_immediate_action="Audit bank statements and return memo reason (e.g. stop payment vs funds insufficient). File a point-by-point rebuttal or seek mediation settlement.",
                recommended_service_type="Advocate (District Court)"
            )
        else:
            return DocumentScanResponse(
                is_valid_document=True,
                summary="The uploaded document contains legal clauses, terms, or formal correspondence requiring expert verification.",
                document_classification="General Legal Agreement / Formal Notice",
                risk_level="Medium Attention",
                critical_deadlines=["Check effective date and termination notice clause (usually 30 days)"],
                legal_implications=[
                    "Binding dispute resolution clause (Arbitration vs Court Jurisdiction)",
                    "Potential liability or indemnity exposures"
                ],
                constitutional_context="Freedom of Contract under Article 19(1)(g) subject to statutory fairness.",
                recommended_immediate_action="Have a verified advocate or notary review the clause ambiguities before signing or replying.",
                recommended_service_type="Certified Mediator (ADR)"
            )

ai_service = AIService()
