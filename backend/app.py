from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

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
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes

@app.post("/api/ai/analyze-issue", response_model=LegalDiagnosticResponse)
async def analyze_legal_issue(req: AnalyzeIssueRequest):
    """
    AI Legal Need Detection: Understands plain colloquial text/voice queries,
    identifies legal domains, applicable acts, urgency, and recommended service type.
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
    Legal Document Plain-Language Scanner: Extracts risks, critical deadlines, and immediate steps.
    """
    try:
        scan_result = await ai_service.scan_legal_document(req.document_text, req.document_type)
        return scan_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match", response_model=List[MatchedProviderResponse])
async def match_providers(req: MatchRequest):
    """
    Explainable Matching Engine: Multi-factor scoring (Domain, Location, Language, Budget, SLA, Trust)
    with human-readable 'Why this professional?' rationale.
    """
    try:
        ranked_results = matching_engine.match_and_rank(req)
        return ranked_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/providers", response_model=List[Provider])
async def get_providers(domain: Optional[str] = None, city: Optional[str] = None):
    """
    Retrieves verified legal service providers, mediators, and legal aid clinics.
    """
    return provider_service.get_providers(domain=domain, city=city)

@app.get("/api/providers/{provider_id}", response_model=Provider)
async def get_provider_detail(provider_id: str):
    provider = matching_engine.get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

@app.post("/api/providers/verify-bar-id")
async def verify_bar_id(data: Dict[str, str]):
    """
    Simulates live Bar Council of India identity and licensure verification.
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
