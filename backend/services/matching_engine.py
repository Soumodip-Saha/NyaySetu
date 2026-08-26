import json
import os
from typing import List, Dict, Any
from backend.models.schemas import (
    Provider,
    MatchRequest,
    MatchedProviderResponse,
    MatchExplanation
)

class MatchingEngine:
    def __init__(self):
        self.providers: List[Provider] = []
        self._load_seed_providers()

    def _load_seed_providers(self):
        seed_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed_providers.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                self.providers = [Provider(**item) for item in raw_data]

    def get_all_providers(self) -> List[Provider]:
        return self.providers

    def get_provider_by_id(self, provider_id: str) -> Provider:
        for p in self.providers:
            if p.id == provider_id:
                return p
        return None

    def match_and_rank(self, req: MatchRequest) -> List[MatchedProviderResponse]:
        """
        Multidimensional Explainable Matching Engine
        """
        results: List[MatchedProviderResponse] = []

        for p in self.providers:
            # Calculate dimensional sub-scores (0 - 100)
            domain_score = self._calc_domain_score(p, req.category, req.service_type)
            location_score = self._calc_location_score(p, req.location, req.tele_consultation)
            language_score = self._calc_language_score(p, req.preferred_language)
            budget_score = self._calc_budget_score(p, req.max_budget, req.legal_aid_required)
            availability_score = self._calc_availability_score(p, req.urgency)
            trust_score = self._calc_trust_score(p)

            # Weighted overall match score
            # Weights: Domain 30%, Location 20%, Language 15%, Budget 15%, Availability 10%, Trust 10%
            overall_score = int(
                domain_score * 0.30 +
                location_score * 0.20 +
                language_score * 0.15 +
                budget_score * 0.15 +
                availability_score * 0.10 +
                trust_score * 0.10
            )

            # Generate Explainability & Rationale
            explanation = self._generate_explanation(
                p,
                req,
                overall_score,
                {
                    "domain_expertise": domain_score,
                    "location_jurisdiction": location_score,
                    "language_match": language_score,
                    "budget_affordability": budget_score,
                    "sla_availability": availability_score,
                    "nyay_trust": trust_score
                }
            )

            results.append(MatchedProviderResponse(
                provider=p,
                match_score=overall_score,
                match_explanation=explanation
            ))

        # Rank descending by overall match score
        results.sort(key=lambda x: x.match_score, reverse=True)
        return results

    def _calc_domain_score(self, p: Provider, category: str, service_type: str = None) -> int:
        score = 40
        # Check domain presence
        if any(category.lower() in d.lower() or d.lower() in category.lower() for d in p.domains):
            score += 45
        # Experience boost
        exp_boost = min(15, p.years_experience)
        score += exp_boost

        # Service type alignment
        if service_type and service_type.lower() in p.provider_type.lower():
            score = min(100, score + 10)

        return min(100, score)

    def _calc_location_score(self, p: Provider, location: str, tele_ok: bool) -> int:
        loc_lower = location.lower()
        if p.city.lower() in loc_lower or p.state.lower() in loc_lower or "pan-india" in p.state.lower():
            return 100
        if tele_ok:
            return 82  # Tele-consultation bridge
        return 50

    def _calc_language_score(self, p: Provider, language: str) -> int:
        if not language or language.lower() == "auto":
            return 95
        if any(language.lower() == l.lower() for l in p.languages):
            return 100
        # English fallback
        if "english" in [l.lower() for l in p.languages]:
            return 75
        return 45

    def _calc_budget_score(self, p: Provider, max_budget: float, legal_aid_req: bool) -> int:
        if legal_aid_req or p.fee_per_consultation == 0:
            return 100
        if p.fee_per_consultation <= max_budget:
            return 100
        diff = p.fee_per_consultation - max_budget
        if diff <= 200:
            return 75
        if diff <= 500:
            return 50
        return 30

    def _calc_availability_score(self, p: Provider, urgency: str) -> int:
        slot_lower = p.next_available_slot.lower()
        if "today" in slot_lower or "24/7" in slot_lower or "now" in slot_lower:
            return 100
        if "tomorrow" in slot_lower:
            return 85 if "emergency" not in urgency.lower() else 65
        return 70

    def _calc_trust_score(self, p: Provider) -> int:
        base = p.nyay_trust_score
        if p.verification_status == "Government Empanelled":
            base = max(base, 98)
        return min(100, base)

    def _generate_explanation(
        self,
        p: Provider,
        req: MatchRequest,
        score: int,
        breakdown: Dict[str, int]
    ) -> MatchExplanation:
        highlights = []

        # Domain highlight
        if breakdown["domain_expertise"] >= 85:
            highlights.append(f"Top-tier expertise in {req.category} with {p.years_experience}+ years of verified practice.")
        elif breakdown["domain_expertise"] >= 65:
            highlights.append(f"Experienced in relevant civil and legal procedures ({p.cases_resolved}+ cases handled).")

        # Language highlight
        if breakdown["language_match"] == 100:
            highlights.append(f"Fluent in your preferred language: {req.preferred_language}.")

        # Budget highlight
        if p.fee_per_consultation == 0:
            highlights.append("100% Free Legal Aid subsidized under NALSA / Tele-Law scheme.")
        elif p.fee_per_consultation <= req.max_budget:
            highlights.append(f"Affordable consultation fee of ₹{int(p.fee_per_consultation)} fits within your ₹{int(req.max_budget)} limit.")
        else:
            highlights.append(f"Consultation fee ₹{int(p.fee_per_consultation)} with flexible payment.")

        # Location/Court highlight
        if breakdown["location_jurisdiction"] == 100:
            highlights.append(f"Active in your local jurisdiction ({p.city}, {p.state}).")
        else:
            highlights.append(f"Available for instant Tele-Law video/audio consultation.")

        # Trust highlight
        highlights.append(f"NyayTrust Score: {p.nyay_trust_score}/100 • Bar Council Verified ({p.bar_council_id}).")

        # Formulate synthesized reason
        summary = (
            f"Recommended for {req.category} because {p.name} holds a {breakdown['domain_expertise']}% domain alignment, "
            f"speaks {', '.join(p.languages[:2])}, has a {p.rating}★ rating ({p.total_reviews} reviews), "
            f"and provides verified counsel at ₹{int(p.fee_per_consultation)}."
        )

        alt = None
        if score < 70:
            alt = "Consider exploring DLSA Free Legal Aid Clinic if you need zero-fee representation."

        return MatchExplanation(
            overall_match_score=score,
            why_recommended=summary,
            factor_breakdown=breakdown,
            highlights=highlights,
            alternative_suggestion=alt
        )

matching_engine = MatchingEngine()
