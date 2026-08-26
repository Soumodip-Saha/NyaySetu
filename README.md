# NyaySetu (न्यायसेतु / ন্যায়সেতু)
### AI-Powered Legal Service Routing & Explainable Professional Matching
*Built for Hackspire 2026 | Aligned with DISHA 2.0 (Department of Justice, Govt. of India)*

---

## 📌 The Problem (The Access-to-Justice Gap)
In India, legal service discovery is fragmented and overwhelming:
1. **Confusion & Misrouting**: Citizens cannot identify whether they need an Advocate, a Mediator, a Notary, or Free Legal Aid. This leads to selecting unsuitable providers.
2. **Cost & Delay Surge**: Traditional first consultation delays average **45 days**, accompanied by heavy out-of-pocket expenses for incorrect legal avenues.
3. **Lack of Trust & Incentives**: Generic search directories lack Bar Council licensure verification, transparent explainability for matches, and provide no incentives for providers to undertake pro bono / legal aid cases.

---

## 💡 The NyaySetu Solution: *Understand ➔ Route ➔ Explain ➔ Trust ➔ Serve ➔ Reward*

1. **AI Legal Need Detection (Multilingual & Voice-First)**
   - Citizens speak or type in their native language (Hindi, Bengali, Tamil, Marathi, English).
   - Diagnoses the dispute category, statutory Indian Acts (e.g. *Transfer of Property Act*, *Consumer Protection Act 2019*, *Industrial Disputes Act*), urgency level, and citizen rights brief.
2. **Smart Service Routing**
   - Routes cases to the optimal legal institution: District Court Advocate, Certified ADR Mediator, Notary Public, Lok Adalat, or DLSA/NALSA Free Legal Aid Clinic.
3. **Explainable Multi-Factor Matching Engine**
   - Ranks verified providers across **6 weighted dimensions**: Domain Expertise (30%), Location/Jurisdiction (20%), Language Compatibility (15%), Affordability/Budget (15%), Turnaround SLA (10%), and NyayTrust (10%).
   - Generates transparent, human-readable **"Why this professional?"** justifications.
4. **NyayTrust & NyayCredits Incentive Gamification**
   - Live Bar Council of India identity verification simulation.
   - Rewards Legal Service Providers (LSPs) with **NyayCredits (🪙)** for pro bono cases, timely consultations, and 5-star citizen reviews to unlock government empanelment and platform perks.
5. **Government & DISHA 2.0 Intelligence Dashboard**
   - Real-time heatmaps of legal demand vs regional supply deficits.
   - Case misrouting reduction metrics (75% reduction) and national dispute distributions.
6. **Smart Legal Document Scanner**
   - Instant plain-language risk audit for FIRs, Section 138 Cheque bounce notices, and eviction demands.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.14 + FastAPI + Uvicorn + Pydantic (High-performance async REST API)
- **Frontend**: Modern SPA (HTML5 + Tailwind CSS + Lucide Icons + Chart.js + Web Speech API)
- **AI Intelligence Layer**: Google Gemini API integration with rule-based fallback knowledge engine for 100% offline & online reliability
- **Data Engine**: Structured Indian Legal Knowledge Base + 25+ verified multi-state legal providers, advocates, mediators & clinics

---

## 🚀 How to Run the Application

```bash
# Run launcher
python run.py

# Or run uvicorn directly:
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser at:
👉 **`http://127.0.0.1:8000`**

Interactive API Docs:
👉 **`http://127.0.0.1:8000/docs`**

---

## 🎯 5-Minute Judge Demonstration Script

1. **Step 1: Judge 1-Click Preset**: Click on *"🏞️ Land Encroachment (Bengali)"* in the top blue banner.
   - Observe how the AI instantly diagnoses the problem in Bengali, maps statutory sections (*Transfer of Property Act 1882 Sec 54*, *Order 39 CPC*), assesses high urgency, and recommends a District Court Advocate / DLSA Aid.
2. **Step 2: Explainable Match Breakdown**:
   - Notice **Adv. Rajesh Kumar Sen** ranked #1 with 96% Match.
   - Expand the *"Why NyaySetu Recommends This Professional?"* card to see the radar breakdown (Domain 95%, Location 100%, Bengali Language 100%, Fee ₹500 within budget).
3. **Step 3: Instant Booking & NyayCredits**:
   - Click *"Book Tele-Law"*, confirm slot, and watch provider awarded **+150 🪙 NyayCredits**.
4. **Step 4: Document Notice Scanner**:
   - Navigate to the *"Notice Scanner"* tab, click *"📄 Sec 138 Cheque Notice"*, and click *"Perform Plain-Language Risk Audit"*.
   - View instant risk rating (High Risk) and strict 15-day statutory repayment window.
5. **Step 5: DISHA 2.0 Government Hub**:
   - Switch to *"DISHA 2.0 Hub"* tab to view the regional demand-supply deficit heatmap and dispute breakdown chart.
