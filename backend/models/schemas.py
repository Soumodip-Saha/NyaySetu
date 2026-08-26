from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AnalyzeIssueRequest(BaseModel):
    query_text: str = Field(..., description="Citizen query in natural/colloquial language")
    language: Optional[str] = "auto"
    location: Optional[str] = "Kolkata, West Bengal"
    budget_max: Optional[float] = 1000.0
    preferred_mode: Optional[str] = "any"  # "tele-consultation", "in-person", "any"

class LegalDiagnosticResponse(BaseModel):
    detected_language: str
    translated_summary: str
    primary_category: str
    sub_category: Optional[str] = None
    urgency_level: str  # "Immediate / Emergency", "High", "Moderate", "Standard / Advisory"
    recommended_service_type: str  # "Advocate (District Court)", "Certified Mediator (ADR)", etc.
    applicable_acts: List[str]
    citizen_rights_summary: str
    estimated_timeline: str
    estimated_cost_range: str
    free_legal_aid_eligible: bool
    key_factors_extracted: Dict[str, Any]

class MatchRequest(BaseModel):
    query_text: str
    category: str
    location: str
    preferred_language: str = "English"
    max_budget: float = 1000.0
    urgency: str = "Moderate"
    service_type: Optional[str] = None
    tele_consultation: bool = True
    legal_aid_required: bool = False

class MatchExplanation(BaseModel):
    overall_match_score: int  # 0 - 100
    why_recommended: str
    factor_breakdown: Dict[str, int]  # {"domain_expertise": 95, "location": 90, "language": 100, "budget": 92, "sla_availability": 88, "trust_score": 98}
    highlights: List[str]
    alternative_suggestion: Optional[str] = None

class Provider(BaseModel):
    id: str
    name: str
    title: str  # e.g., "Senior Advocate", "Certified Mediator", "DLSA Panel Counsel"
    provider_type: str
    bar_council_id: str
    bar_council_state: str
    verification_status: str  # "Verified", "Under Review", "Government Empanelled"
    years_experience: int
    domains: List[str]
    languages: List[str]
    city: str
    state: str
    court_jurisdiction: List[str]
    fee_per_consultation: float
    pro_bono_available: bool = False
    rating: float
    total_reviews: int
    cases_resolved: int
    nyay_trust_score: int  # 0 - 100
    nyay_credits: int
    badge: str
    next_available_slot: str
    bio: str
    avatar_url: Optional[str] = None

class MatchedProviderResponse(BaseModel):
    provider: Provider
    match_score: int
    match_explanation: MatchExplanation

class DocumentScanRequest(BaseModel):
    document_text: str
    document_type: Optional[str] = "Notice / FIR / Agreement"

class DocumentScanResponse(BaseModel):
    summary: str
    document_classification: str
    risk_level: str  # "High Risk", "Medium Attention", "Standard Form"
    critical_deadlines: List[str]
    legal_implications: List[str]
    recommended_immediate_action: str
    recommended_service_type: str

class ConsultationBookingRequest(BaseModel):
    provider_id: str
    citizen_name: str
    citizen_phone: str
    citizen_email: Optional[str] = None
    case_summary: str
    legal_category: str
    preferred_slot: str
    consultation_mode: str = "tele-law"  # "tele-law", "in-person"
    is_legal_aid_case: bool = False

class ConsultationResponse(BaseModel):
    booking_id: str
    status: str
    provider_name: str
    scheduled_time: str
    meeting_link_or_address: str
    consultation_fee: float
    credits_awarded_to_provider: int
    message: str

class ReviewSubmitRequest(BaseModel):
    booking_id: str
    provider_id: str
    rating: int  # 1 to 5
    feedback: str
    outcome_satisfaction: str

class GovtDashboardMetrics(BaseModel):
    total_cases_routed: int
    average_routing_time_seconds: float
    misrouted_cases_decrease_percent: float
    avg_first_consultation_delay_days: float
    total_pro_bono_hours_logged: int
    total_nyay_credits_distributed: int
    cost_saved_for_citizens_inr: float
    district_coverage_count: int
    category_distribution: Dict[str, int]
    state_demand_supply_heatmap: List[Dict[str, Any]]
    disha_alignment_status: Dict[str, Any]
