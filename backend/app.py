from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import json

from backend.config import PORT, HOST
from backend.models.schemas import (
    AnalyzeIssueRequest,
    LegalDiagnosticResponse,
    MatchRequest,
    MatchedProviderResponse,
    DocumentScanRequest,
    DocumentScanResponse,
    ConsultationBookingRequest,
    ConsultationResponse,
    ReviewSubmitRequest,
    GovtDashboardMetrics,
    Provider
)
from backend.services.ai_service import ai_service
from backend.services.matching_engine import matching_engine
from backend.services.provider_service import provider_service
from backend.services.analytics_service import analytics_service
from typing import List, Dict, Any, Optional

app = FastAPI(
    title="NyaySetu API",
    description="AI-Powered Legal Service Routing & Explainable Professional Matching Platform (Hackspire 2026)",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Constitution Data
CONSTITUTION_FILE = os.path.join(os.path.dirname(__file__), "data", "constitution_data.json")
def get_constitution_db():
    if os.path.exists(CONSTITUTION_FILE):
        with open(CONSTITUTION_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"articles": [], "amendments": []}

# API Routes

@app.post("/api/ai/analyze-issue", response_model=LegalDiagnosticResponse)
async def analyze_legal_issue(req: AnalyzeIssueRequest):
    """
    AI Legal Need Detection: Diagnoses legal category, applicable acts,
    and maps exact Constitutional Articles (2026 Edition).
    """
    try:
        diagnosis = await ai_service.analyze_legal_issue(
            query_text=req.query_text,
            language=req.language,
            location=req.location,
            budget_max=req.budget_max,
            preferred_mode=req.preferred_mode
        )
        return diagnosis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/scan-document", response_model=DocumentScanResponse)
async def scan_document(req: DocumentScanRequest):
    """
    Legal Document Plain-Language Scanner: Extracts risks, statutory deadlines,
    and constitutional protections.
    """
    try:
        scan_result = await ai_service.scan_legal_document(req.document_text, req.document_type)
        return scan_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match", response_model=List[MatchedProviderResponse])
async def match_providers(req: MatchRequest):
    """
    Explainable Matching Engine: Multi-factor scoring across Domain, Location,
    Language, Budget, SLA, Trust, with Nyaya Bandhu & SCAORA affiliation integration.
    """
    try:
        ranked_results = matching_engine.match_and_rank(req)
        return ranked_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/providers", response_model=List[Provider])
async def get_providers(
    domain: Optional[str] = None,
    city: Optional[str] = None,
    affiliation: Optional[str] = None
):
    """
    Retrieves verified legal service providers, SCAORA AORs, and Nyaya Bandhu panel lawyers.
    """
    providers = matching_engine.get_all_providers()
    if domain:
        providers = [p for p in providers if any(domain.lower() in d.lower() for d in p.domains)]
    if city:
        providers = [p for p in providers if city.lower() in p.city.lower()]
    if affiliation:
        providers = [p for p in providers if affiliation.lower() in (p.affiliation or "").lower()]
    return providers

@app.get("/api/providers/{provider_id}", response_model=Provider)
async def get_provider_detail(provider_id: str):
    provider = matching_engine.get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

@app.get("/api/lawyers/directory")
async def get_lawyers_directory(
    query: Optional[str] = None,
    category: Optional[str] = "all",
    affiliation: Optional[str] = "all"
):
    """
    Directory search across SCAORA, Nyaya Bandhu, and State Bar Council lawyers.
    """
    providers = matching_engine.get_all_providers()
    filtered = []
    for p in providers:
        if affiliation != "all":
            if affiliation == "scaora" and "SCAORA" not in (p.affiliation or ""):
                continue
            elif affiliation == "nyaya_bandhu" and "Nyaya Bandhu" not in (p.affiliation or ""):
                continue
            elif affiliation == "legal_aid" and p.fee_per_consultation > 0:
                continue
        if category != "all" and not any(category.lower() in d.lower() for d in p.domains):
            continue
        if query:
            q_lower = query.lower()
            name_match = q_lower in p.name.lower()
            city_match = q_lower in p.city.lower() or q_lower in p.state.lower()
            bar_match = q_lower in p.bar_council_id.lower()
            domain_match = any(q_lower in d.lower() for d in p.domains)
            if not (name_match or city_match or bar_match or domain_match):
                continue
        filtered.append(p)
    return {"total": len(filtered), "lawyers": filtered}

@app.get("/api/constitution/articles")
async def get_constitution_articles(search: Optional[str] = None):
    """
    Search and browse Articles of the Constitution of India (2026 Edition).
    """
    db = get_constitution_db()
    articles = db.get("articles", [])
    if search:
        s_lower = search.lower()
        articles = [
            a for a in articles 
            if s_lower in a.get("article", "").lower() 
            or s_lower in a.get("title", "").lower() 
            or s_lower in a.get("description", "").lower()
            or s_lower in a.get("relevance", "").lower()
        ]
    return {"edition": db.get("edition"), "count": len(articles), "articles": articles}

@app.get("/api/constitution/amendments")
async def get_constitution_amendments(search: Optional[str] = None):
    """
    Search and browse Constitutional Amendment Acts (1st to 106th Amendment Acts).
    """
    db = get_constitution_db()
    amendments = db.get("amendments", [])
    if search:
        s_lower = search.lower()
        amendments = [
            a for a in amendments
            if s_lower in str(a.get("number", "")).lower()
            or s_lower in a.get("act", "").lower()
            or s_lower in a.get("title", "").lower()
            or s_lower in a.get("summary", "").lower()
        ]
    return {"count": len(amendments), "amendments": amendments}

@app.post("/api/providers/verify-bar-id")
async def verify_bar_id(data: Dict[str, str]):
    """
    Simulates live Bar Council of India, SCAORA, or Nyaya Bandhu licensure verification.
    """
    bar_id = data.get("bar_council_id", "")
    state = data.get("state", "")
    return provider_service.verify_bar_council_id(bar_id, state)

@app.post("/api/consultations", response_model=ConsultationResponse)
async def book_consultation(req: ConsultationBookingRequest):
    """
    Schedules legal consultation and credits provider with NyayCredits.
    """
    try:
        return provider_service.book_consultation(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/reviews")
async def submit_review(req: ReviewSubmitRequest):
    """
    Submits citizen feedback & updates provider trust rating.
    """
    return provider_service.submit_review(req)

@app.get("/api/analytics/dashboard", response_model=GovtDashboardMetrics)
async def get_dashboard_analytics():
    """
    Government & DISHA 2.0 Intelligence Dashboard metrics.
    """
    return analytics_service.get_dashboard_metrics()

# Serve static frontend files
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host=HOST, port=PORT, reload=True)
