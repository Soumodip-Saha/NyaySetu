import uuid
from typing import List, Dict, Any, Optional
from backend.models.schemas import (
    Provider,
    ConsultationBookingRequest,
    ConsultationResponse,
    ReviewSubmitRequest
)
from backend.services.matching_engine import matching_engine

class ProviderService:
    def __init__(self):
        self.bookings: Dict[str, Dict[str, Any]] = {}
        self.credit_ledger: List[Dict[str, Any]] = []

    def get_providers(self, domain: Optional[str] = None, city: Optional[str] = None) -> List[Provider]:
        providers = matching_engine.get_all_providers()
        if domain:
            providers = [p for p in providers if any(domain.lower() in d.lower() for d in p.domains)]
        if city:
            providers = [p for p in providers if city.lower() in p.city.lower()]
        return providers

    def verify_bar_council_id(self, bar_id: str, state: str) -> Dict[str, Any]:
        """
        Simulates live Bar Council of India API check for advocate / mediator credentials.
        """
        clean_id = bar_id.strip().upper()
        # Look up in registered database
        matched = next((p for p in matching_engine.get_all_providers() if p.bar_council_id.upper() == clean_id), None)
        if matched:
            return {
                "valid": True,
                "bar_council_id": matched.bar_council_id,
                "advocate_name": matched.name,
                "state_bar_council": matched.bar_council_state,
                "enrolment_year": matched.bar_council_id.split("/")[-1] if "/" in matched.bar_council_id else "Verified",
                "disciplinary_actions": "None (Clean Record)",
                "status": "Active & In Good Standing",
                "nyay_trust_verified": True
            }
        
        # General pattern verification
        if "/" in clean_id and len(clean_id) >= 6:
            return {
                "valid": True,
                "bar_council_id": clean_id,
                "advocate_name": "Advocate Registered Member",
                "state_bar_council": state or "State Bar Council",
                "enrolment_year": "Verified",
                "disciplinary_actions": "None",
                "status": "Active Practicing Advocate",
                "nyay_trust_verified": True
            }

        return {
            "valid": False,
            "message": "Bar Council ID format not recognized. Example format: WB/1482/2014 or D/2410/2012",
            "nyay_trust_verified": False
        }

    def book_consultation(self, req: ConsultationBookingRequest) -> ConsultationResponse:
        booking_id = f"NYAY-{str(uuid.uuid4())[:8].upper()}"
        provider = matching_engine.get_provider_by_id(req.provider_id)
        if not provider:
            raise ValueError("Legal Service Provider not found")

        # Award NyayCredits to Provider
        earned_credits = 50
        if req.is_legal_aid_case or provider.fee_per_consultation == 0:
            earned_credits += 100  # Bonus for Pro Bono / Legal Aid

        provider.nyay_credits += earned_credits
        provider.cases_resolved += 1

        # Check badge advancement
        if provider.nyay_credits >= 3000 and "National" not in provider.badge:
            provider.badge = "National Access-to-Justice Leader"
        elif provider.nyay_credits >= 1500 and "Champion" not in provider.badge and "Master" not in provider.badge:
            provider.badge = "Pro Bono Champion"

        # Record booking
        booking_record = {
            "booking_id": booking_id,
            "provider_id": provider.id,
            "provider_name": provider.name,
            "citizen_name": req.citizen_name,
            "citizen_phone": req.citizen_phone,
            "case_summary": req.case_summary,
            "legal_category": req.legal_category,
            "preferred_slot": req.preferred_slot,
            "mode": req.consultation_mode,
            "fee": provider.fee_per_consultation if not req.is_legal_aid_case else 0.0,
            "credits_awarded": earned_credits,
            "status": "Confirmed"
        }
        self.bookings[booking_id] = booking_record

        # Meeting link or office address
        meeting_info = f"https://meet.nyaysetu.gov.in/tele-law/{booking_id.lower()}" if req.consultation_mode == "tele-law" else f"{provider.court_jurisdiction[0]} Chambers, {provider.city}"

        return ConsultationResponse(
            booking_id=booking_id,
            status="Confirmed & Scheduled",
            provider_name=provider.name,
            scheduled_time=req.preferred_slot or "Within 24 Hours",
            meeting_link_or_address=meeting_info,
            consultation_fee=booking_record["fee"],
            credits_awarded_to_provider=earned_credits,
            message=f"Consultation successfully confirmed with {provider.name}. A notification with joining details has been sent to {req.citizen_phone}."
        )

    def submit_review(self, req: ReviewSubmitRequest) -> Dict[str, Any]:
        provider = matching_engine.get_provider_by_id(req.provider_id)
        if not provider:
            return {"success": False, "message": "Provider not found"}

        # Update rating
        new_total = provider.total_reviews + 1
        provider.rating = round(((provider.rating * provider.total_reviews) + req.rating) / new_total, 2)
        provider.total_reviews = new_total

        # Reward additional NyayCredits for high satisfaction
        bonus_credits = 0
        if req.rating >= 4:
            bonus_credits = 30
            provider.nyay_credits += bonus_credits

        return {
            "success": True,
            "provider_name": provider.name,
            "updated_rating": provider.rating,
            "total_reviews": provider.total_reviews,
            "bonus_credits_awarded": bonus_credits,
            "message": "Thank you for your valuable feedback! Your review helps build transparent trust in legal routing."
        }

provider_service = ProviderService()
