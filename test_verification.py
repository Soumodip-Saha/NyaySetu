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
    print("  Real Advocates & Contextless Query Detection")
    print("==================================================")

    # 1. Test Contextless Query Detection (Trivial / Gibberish inputs)
    print("\n[TEST 1] Contextless / Low-Information Query Detection...")
    contextless_queries = ["hello", "asdfghjk", "abc", "what is this", "food"]
    for q in contextless_queries:
        diag = await ai_service.analyze_legal_issue(query_text=q)
        print(f"  [+] Testing query '{q}': is_valid_legal_query={diag.is_valid_legal_query}")
        assert diag.is_valid_legal_query is False
        assert diag.guidance_message is not None
        assert len(diag.suggested_tips) > 0
    print("  ✓ Contextless detection working with helpful guidance tips!")

    # 1B. Test Medical Symptoms & Out-of-Domain Query Detection
    print("\n[TEST 1B] Medical & Out-of-Domain Query Interception...")
    medical_queries = [
        "i have loose motion. what should i do ?",
        "my head is aching severely with high fever and vomiting",
        "আমার পেটের অসুখ এবং পাতলা পায়খানা হচ্ছে কি খাব"
    ]
    for mq in medical_queries:
        diag_med = await ai_service.analyze_legal_issue(query_text=mq)
        print(f"  [+] Testing medical query '{mq}': is_valid={diag_med.is_valid_legal_query}, nature={diag_med.query_nature}")
        assert diag_med.is_valid_legal_query is False
        assert diag_med.query_nature == "medical"
        assert "Medical" in diag_med.primary_category or "Healthcare" in diag_med.recommended_service_type
        assert "1075" in diag_med.guidance_message or "doctor" in diag_med.guidance_message.lower()

    out_of_domain_queries = [
        "how to cook chicken biryani with basmati rice",
        "the sky is blue today and flowers are blooming"
    ]
    for oq in out_of_domain_queries:
        diag_ood = await ai_service.analyze_legal_issue(query_text=oq)
        print(f"  [+] Testing out-of-domain query '{oq}': is_valid={diag_ood.is_valid_legal_query}, nature={diag_ood.query_nature}")
        assert diag_ood.is_valid_legal_query is False
        assert diag_ood.query_nature == "out_of_domain"

    # Medical negligence WITH legal dispute keywords should remain a valid legal case
    malpractice_query = "Hospital committed gross medical negligence during surgery. Can I sue in consumer court for compensation?"
    diag_mal = await ai_service.analyze_legal_issue(query_text=malpractice_query)
    print(f"  [+] Testing medical negligence legal dispute: is_valid={diag_mal.is_valid_legal_query}, category={diag_mal.primary_category}")
    assert diag_mal.is_valid_legal_query is True
    print("  ✓ Medical symptoms and out-of-domain queries successfully intercepted!")

    # 2. Test Valid Legal Problem (Bengali Land Dispute)
    print("\n[TEST 2] Valid Legal Problem (Bengali Land Encroachment)...")
    diag_valid = await ai_service.analyze_legal_issue(
        query_text="আমার প্রতিবেশী আমাদের পৈতৃক জমিতে জোর করে সীমানা প্রাচীর তৈরি করছে।",
        language="Bengali",
        location="Kolkata, West Bengal",
        budget_max=500.0
    )
    print(f"  [+] is_valid_legal_query: {diag_valid.is_valid_legal_query}")
    print(f"  [+] Category: {diag_valid.primary_category}")
    print(f"  [+] Constitutional Citations: {[c.article for c in diag_valid.constitutional_articles]}")
    assert diag_valid.is_valid_legal_query is True
    assert diag_valid.primary_category == "Property & Land Disputes"

    # 3. Test Real Advocates Verification (Only SCAORA & DOJ Nyaya Bandhu)
    print("\n[TEST 3] Real Advocates Directory Integrity...")
    providers = matching_engine.get_all_providers()
    print(f"  [+] Total Registered Providers: {len(providers)}")
    
    for p in providers:
        is_scaora = "SCAORA" in (p.affiliation or "")
        is_nyaya_bandhu = "Nyaya Bandhu" in (p.affiliation or "")
        is_legal_aid = "NALSA" in (p.affiliation or "")
        print(f"  - {p.name} | {p.affiliation} | ID: {p.bar_council_id}")
        assert is_scaora or is_nyaya_bandhu or is_legal_aid, f"Non-official provider found: {p.name}"

    print("  ✓ All providers are strictly real advocates from official registries!")

    # 4. Test SCAORA AOR Match and Ranking
    print("\n[TEST 4] SCAORA Supreme Court AOR Match...")
    match_req = MatchRequest(
        query_text="Special Leave Petition before Supreme Court for breach of commercial contract",
        category="Civil Contracts & Commercial",
        location="New Delhi, Delhi",
        preferred_language="English",
        max_budget=1500.0,
        urgency="High",
        service_type="Advocate (High Court / Supreme Court)",
        tele_consultation=True,
        affiliation_filter="scaora"
    )
    matches = matching_engine.match_and_rank(match_req)
    print(f"  [+] Top SCAORA Match: {matches[0].provider.name} ({matches[0].match_score}%)")
    assert "SCAORA" in matches[0].provider.affiliation
    assert matches[0].match_score >= 80

    # 5. Test Constitution Database (2026 Edition)
    print("\n[TEST 5] Constitution Database (2026 Edition)...")
    const_db = ai_service.constitution_data
    print(f"  [+] Edition: {const_db.get('edition')}")
    print(f"  [+] Total Articles: {len(const_db.get('articles', []))}")
    print(f"  [+] Total Amendments: {len(const_db.get('amendments', []))}")
    assert any(a["number"] == 106 for a in const_db.get("amendments", []))

    # 6. Test Licensure Verification for Real SCAORA & Bar IDs
    print("\n[TEST 6] Real Licensure Verification...")
    check_scaora = provider_service.verify_bar_council_id("SCAORA/AOR/802402", "Delhi")
    check_doj = provider_service.verify_bar_council_id("AP/1892/2009", "Andhra Pradesh")
    print(f"  [+] SCAORA Check: {check_scaora['valid']} for {check_scaora.get('advocate_name')}")
    print(f"  [+] DOJ Check: {check_doj['valid']} for {check_doj.get('advocate_name')}")
    assert check_scaora['valid'] is True
    assert check_doj['valid'] is True

    # 7. Test Consultation Booking & NyayCredits Distribution
    print("\n[TEST 7] Consultation Booking & NyayCredits Reward...")
    booking = provider_service.book_consultation(ConsultationBookingRequest(
        provider_id=providers[0].id,
        citizen_name="Ramesh Chandra",
        citizen_phone="+91 9876543210",
        case_summary="Commercial contract SLP appeal",
        legal_category="Civil Contracts & Commercial",
        preferred_slot="Today, 5:00 PM",
        consultation_mode="tele-law",
        is_legal_aid_case=False
    ))
    print(f"  [+] Booking Reference: {booking.booking_id}")
    print(f"  [+] NyayCredits Awarded: +{booking.credits_awarded_to_provider} 🪙")
    assert booking.booking_id.startswith("NYAY-")

    print("\n==================================================")
    print("  ALL 7 ENHANCED VERIFICATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
