import asyncio
import json
import sys

# Ensure UTF-8 output on Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

from backend.services.ai_service import ai_service
from backend.services.matching_engine import matching_engine
from backend.services.provider_service import provider_service
from backend.services.analytics_service import analytics_service
from backend.models.schemas import MatchRequest, ConsultationBookingRequest

async def run_all_tests():
    print("==================================================")
    print("  NYAYSETU SYSTEM VERIFICATION SUITE (HACKSPIRE)")
    print("==================================================")

    # 1. Test AI Legal Need Detection (Bengali Land Dispute)
    print("\n[TEST 1] AI Legal Need Detection (Bengali)...")
    diag_bn = await ai_service.analyze_legal_issue(
        query_text="আমার প্রতিবেশী আমাদের পৈতৃক জমিতে জোর করে সীমানা প্রাচীর তৈরি করছে।",
        language="Bengali",
        location="Kolkata, West Bengal",
        budget_max=500.0
    )
    print(f"  [+] Detected Lang: {diag_bn.detected_language}")
    print(f"  [+] Category: {diag_bn.primary_category} ({diag_bn.sub_category})")
    print(f"  [+] Recommended Service: {diag_bn.recommended_service_type}")
    print(f"  [+] Applicable Acts: {len(diag_bn.applicable_acts)} Acts identified")
    assert diag_bn.primary_category == "Property & Land Disputes"

    # 2. Test AI Legal Need Detection (Hindi Matrimonial)
    print("\n[TEST 2] AI Legal Need Detection (Hindi Matrimonial)...")
    diag_hi = await ai_service.analyze_legal_issue(
        query_text="मैं और मेरी पत्नी आपसी सहमति से तलाक और बच्चे की कस्टडी का शांतिपूर्ण समाधान चाहते हैं।",
        language="Hindi",
        location="Mumbai, Maharashtra",
        budget_max=500.0
    )
    print(f"  [+] Category: {diag_hi.primary_category}")
    print(f"  [+] Recommended Service: {diag_hi.recommended_service_type}")
    assert diag_hi.primary_category == "Family & Matrimonial"

    # 3. Test Explainable Multi-Factor Matching Engine
    print("\n[TEST 3] Explainable Matching Engine Ranking...")
    match_req = MatchRequest(
        query_text="Land boundary dispute",
        category="Property & Land Disputes",
        location="Kolkata, West Bengal",
        preferred_language="Bengali",
        max_budget=500.0,
        urgency="High",
        service_type="Advocate (District Court)",
        tele_consultation=True,
        legal_aid_required=False
    )
    matches = matching_engine.match_and_rank(match_req)
    print(f"  [+] Total Providers Evaluated: {len(matches)}")
    print(f"  [+] Top Ranked: {matches[0].provider.name} (Match Score: {matches[0].match_score}%)")
    print(f"  [+] Explainability Summary: {matches[0].match_explanation.why_recommended[:90]}...")
    print(f"  [+] Factor Breakdown: {matches[0].match_explanation.factor_breakdown}")
    assert len(matches) > 0
    assert matches[0].match_score >= 85

    # 4. Test Bar Council ID Licensure Verification
    print("\n[TEST 4] Bar Council Verification Simulator...")
    bar_check = provider_service.verify_bar_council_id("WB/1482/2014", "West Bengal")
    print(f"  [+] Bar Check Valid: {bar_check['valid']}")
    print(f"  [+] Advocate Name: {bar_check.get('advocate_name')}")
    assert bar_check['valid'] is True

    # 5. Test Consultation Booking & NyayCredits Reward
    print("\n[TEST 5] Consultation Booking & NyayCredits Distribution...")
    top_provider_id = matches[0].provider.id
    initial_credits = matches[0].provider.nyay_credits
    booking = provider_service.book_consultation(ConsultationBookingRequest(
        provider_id=top_provider_id,
        citizen_name="Sunita Mondal",
        citizen_phone="+91 9830124567",
        case_summary="Land dispute injunction",
        legal_category="Property & Land Disputes",
        preferred_slot="Today, 4:30 PM",
        consultation_mode="tele-law",
        is_legal_aid_case=True
    ))
    print(f"  [+] Booking ID: {booking.booking_id}")
    print(f"  [+] Status: {booking.status}")
    print(f"  [+] Credits Awarded to Provider: +{booking.credits_awarded_to_provider} NyayCredits")
    assert booking.booking_id.startswith("NYAY-")
    assert matches[0].provider.nyay_credits == initial_credits + booking.credits_awarded_to_provider

    # 6. Test Document Risk Scanner
    print("\n[TEST 6] Legal Document Plain-Language Scanner...")
    doc_scan = await ai_service.scan_legal_document(
        document_text="Statutory legal notice under section 138 of negotiable instruments act demanding repayment within 15 days",
        document_type="Notice"
    )
    print(f"  [+] Document Classification: {doc_scan.document_classification}")
    print(f"  [+] Risk Level: {doc_scan.risk_level}")
    print(f"  [+] Critical Deadlines: {doc_scan.critical_deadlines}")
    assert doc_scan.risk_level == "High Risk"

    # 7. Test Government & DISHA 2.0 Dashboard Metrics
    print("\n[TEST 7] Government & DISHA 2.0 Analytics Hub...")
    dash = analytics_service.get_dashboard_metrics()
    print(f"  [+] Total Cases Routed: {dash.total_cases_routed}")
    print(f"  [+] Misrouted Reduction: {dash.misrouted_cases_decrease_percent}%")
    print(f"  [+] First Consultation Delay: {dash.avg_first_consultation_delay_days} days (down from 45)")
    print(f"  [+] Districts Covered: {dash.district_coverage_count}")
    assert dash.district_coverage_count > 500

    print("\n==================================================")
    print("  ALL 7 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
