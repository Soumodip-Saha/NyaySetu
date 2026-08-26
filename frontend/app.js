// State Management
let currentDiagnosis = null;
let currentMatches = [];
let selectedProviderForBooking = null;
let isRecording = false;
let speechRecognizer = null;
let disputeChartInstance = null;

// Presets for 1-Click Judge Demonstrations
const JUDGE_PRESETS = [
  {
    title: "Ancestral Land Dispute (Bengali)",
    query: "আমার প্রতিবেশী আমাদের পৈতৃক জমিতে জোর করে সীমানা প্রাচীর তৈরি করছে। কোনো আদালত থেকে স্টে অর্ডার পাওয়া যাবে কি?",
    location: "Kolkata, West Bengal",
    budget: 500,
    lang: "Bengali",
    mode: "tele-law"
  },
  {
    title: "Unpaid Corporate Wages (English)",
    query: "My employer terminated my contract abruptly without giving 30 days notice and withheld my last 3 months salary and gratuity payout.",
    location: "New Delhi, Delhi",
    budget: 1000,
    lang: "English",
    mode: "tele-law"
  },
  {
    title: "Mutual Divorce & Child Custody (Hindi)",
    query: "मैं और मेरी पत्नी आपसी सहमति से तलाक (Mutual Divorce) और 6 साल के बच्चे की कस्टडी का शांतिपूर्ण समाधान चाहते हैं बिना लंबी कोर्ट लड़ाई के।",
    location: "Mumbai, Maharashtra",
    budget: 500,
    lang: "Hindi",
    mode: "tele-law"
  },
  {
    title: "UPI Cyber Fraud (Tamil)",
    query: "ஒரு போலி KYC அழைப்பு மூலம் எனது வங்கி கணக்கிலிருந்து ₹45,000 திருடப்பட்டது. புகார் அளிக்க உடனடியாக என்ன செய்ய வேண்டும்?",
    location: "Chennai, Tamil Nadu",
    budget: 500,
    lang: "Tamil",
    mode: "tele-law"
  },
  {
    title: "Section 138 Cheque Dishonour Notice (English)",
    query: "I received a formal Section 138 demand notice for a bounced business cheque of ₹2.5 Lakhs giving me 15 days to pay. How should I reply?",
    location: "Kolkata, West Bengal",
    budget: 500,
    lang: "English",
    mode: "tele-law"
  }
];

// Sample Legal Notices for Scanner
const SAMPLE_DOCUMENTS = {
  cheque: `FORMAL STATUTORY LEGAL NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881.
To: M/s Apex Retailers & Sh. Ramesh Gupta.
Under instructions from my client, Sh. Alok Verma, this is to inform that Cheque No. 492018 dated 12/04/2026 for an amount of ₹2,50,000/- drawn on State Bank of India was dishonoured upon presentation with bank memo remark 'FUNDS INSUFFICIENT'.
You are hereby called upon to pay the aforesaid sum of ₹2,50,000/- within strictly FIFTEEN (15) DAYS from the date of receipt of this notice, failing which criminal proceedings under Section 138 NI Act shall be instituted against you without further reference.`,
  
  eviction: `LEGAL NOTICE TO QUIT AND VACATE TENANTED PREMISES UNDER SECTION 106 OF TRANSFER OF PROPERTY ACT.
To: Sh. Anand Sharma, Tenant of Flat 3B, Lake Gardens, Kolkata.
Take notice that your month-to-month tenancy in respect of premises Flat 3B stands determined and terminated with effect from the end of the current tenancy month.
You are hereby called upon to peacefully vacate and deliver vacant physical possession of the said premises within 30 days of receipt of this notice, failing which an eviction suit shall be filed before the competent Civil Court with claim for mesne profits and damages.`,

  fir: `FIRST INFORMATION REPORT (Under Section 173 Bharatiya Nagarik Suraksha Sanhita, 2023 / Section 154 CrPC)
Police Station: Cyber Crime Police Station, Central District.
Acts & Sections: Section 66D Information Technology Act 2000 & Section 318(4) Bharatiya Nyaya Sanhita 2023.
Brief Facts: Complainant received a phishing link pretending to be Electricity Department Bill verification. Upon clicking, ₹85,000 was debited via unauthorized IMPS transfer to an unknown beneficiary account. Immediate investigation initiated.`
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  setupSpeechRecognition();
  loadGovtDashboard();
});

// Tab Navigation
function switchTab(tabId) {
  const tabs = ["citizen", "scanner", "provider", "govt"];
  tabs.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const tabBtn = document.getElementById(`tab-${t}`);
    if (view) {
      if (t === tabId) {
        view.classList.remove("hidden");
      } else {
        view.classList.add("hidden");
      }
    }
    if (tabBtn) {
      if (t === tabId) {
        tabBtn.className = "nav-tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-brand-900 shadow-sm";
      } else {
        tabBtn.className = "nav-tab-btn px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all";
      }
    }
  });

  if (tabId === "govt") {
    setTimeout(renderGovtCharts, 100);
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Load Preset for Demo
function loadPreset(index) {
  const preset = JUDGE_PRESETS[index];
  if (!preset) return;

  switchTab("citizen");
  document.getElementById("citizen-query-input").value = preset.query;
  document.getElementById("user-location-input").value = preset.location;
  document.getElementById("user-budget-input").value = preset.budget;
  document.getElementById("user-mode-input").value = preset.mode;

  // Auto trigger analysis
  triggerLegalAnalysis();
}

// Web Speech Recognition Setup
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API not supported in this browser.");
    return;
  }

  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = false;
  speechRecognizer.interimResults = false;
  speechRecognizer.lang = "hi-IN"; // Default to Indian context, handles code-mixing

  speechRecognizer.onstart = () => {
    isRecording = true;
    const btn = document.getElementById("voice-mic-btn");
    btn.classList.add("recording-pulse");
    document.getElementById("voice-status-indicator").innerHTML = `
      <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
      <span class="text-red-600 font-bold">Listening... Speak your legal issue in Hindi, Bengali, Tamil, English</span>
    `;
  };

  speechRecognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById("citizen-query-input");
    input.value = transcript;
    document.getElementById("voice-status-indicator").innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      <span class="text-emerald-700 font-semibold">Voice captured successfully! Click Analyze.</span>
    `;
  };

  speechRecognizer.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    stopRecordingUI();
  };

  speechRecognizer.onend = () => {
    stopRecordingUI();
  };
}

function toggleVoiceRecording() {
  if (!speechRecognizer) {
    alert("Speech recognition is active in Chrome, Edge, and modern mobile browsers. You can also type directly in the box.");
    return;
  }
  if (isRecording) {
    speechRecognizer.stop();
  } else {
    // Check UI language
    const currentLang = document.getElementById("ui-language-select").value;
    if (currentLang === "Hindi") speechRecognizer.lang = "hi-IN";
    else if (currentLang === "Bengali") speechRecognizer.lang = "bn-IN";
    else if (currentLang === "Tamil") speechRecognizer.lang = "ta-IN";
    else if (currentLang === "Marathi") speechRecognizer.lang = "mr-IN";
    else speechRecognizer.lang = "en-IN";

    speechRecognizer.start();
  }
}

function stopRecordingUI() {
  isRecording = false;
  const btn = document.getElementById("voice-mic-btn");
  if (btn) btn.classList.remove("recording-pulse");
  const indicator = document.getElementById("voice-status-indicator");
  if (indicator) {
    indicator.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      <span>AI Ready • English, Hindi, Bengali, Tamil, Marathi supported</span>
    `;
  }
}

// Perform AI Analysis & Matching
async function triggerLegalAnalysis() {
  const query = document.getElementById("citizen-query-input").value.trim();
  if (!query) {
    alert("Please type or speak your legal problem first.");
    return;
  }

  const location = document.getElementById("user-location-input").value;
  const budget = parseFloat(document.getElementById("user-budget-input").value);
  const mode = document.getElementById("user-mode-input").value;
  const lang = document.getElementById("ui-language-select").value;

  // Show loading
  document.getElementById("diagnostic-results-section").classList.add("hidden");
  document.getElementById("analysis-loading").classList.remove("hidden");

  try {
    // Step 1: AI Legal Need Detection
    const diagResponse = await fetch("/api/ai/analyze-issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query_text: query,
        language: lang,
        location: location,
        budget_max: budget,
        preferred_mode: mode
      })
    });

    const diagnosis = await diagResponse.json();
    currentDiagnosis = diagnosis;

    // Step 2: Multi-factor Explainable Match
    const matchResponse = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query_text: query,
        category: diagnosis.primary_category,
        location: location,
        preferred_language: diagnosis.detected_language || lang,
        max_budget: budget,
        urgency: diagnosis.urgency_level,
        service_type: diagnosis.recommended_service_type,
        tele_consultation: mode === "tele-law" || mode === "any",
        legal_aid_required: diagnosis.free_legal_aid_eligible
      })
    });

    const matches = await matchResponse.json();
    currentMatches = matches;

    // Render UI
    renderDiagnosis(diagnosis);
    renderMatches(matches);

    document.getElementById("analysis-loading").classList.add("hidden");
    document.getElementById("diagnostic-results-section").classList.remove("hidden");

    // Scroll smoothly to results
    document.getElementById("diagnostic-results-section").scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    console.error("Analysis Error:", error);
    document.getElementById("analysis-loading").classList.add("hidden");
    alert("Could not complete analysis. Ensure backend is running.");
  }
}

// Render Diagnosis Card (Step 1)
function renderDiagnosis(diag) {
  document.getElementById("detected-lang-badge").innerText = `Language: ${diag.detected_language}`;
  
  const urgencyBadge = document.getElementById("urgency-level-badge");
  urgencyBadge.innerText = diag.urgency_level;
  if (diag.urgency_level.includes("Emergency") || diag.urgency_level.includes("Immediate")) {
    urgencyBadge.className = "text-xs bg-red-100 text-red-900 px-2 py-0.5 rounded-md font-bold";
  } else if (diag.urgency_level.includes("High")) {
    urgencyBadge.className = "text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold";
  } else {
    urgencyBadge.className = "text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-semibold";
  }

  document.getElementById("diagnosed-category-title").innerText = diag.primary_category;
  document.getElementById("diagnosed-sub-category").innerText = diag.sub_category || "General Dispute Redressal";
  document.getElementById("recommended-service-badge").innerText = diag.recommended_service_type;

  const eligBadge = document.getElementById("eligibility-badge");
  if (diag.free_legal_aid_eligible) {
    eligBadge.innerText = "✓ Free Legal Aid & DLSA Subsidy Eligible";
    eligBadge.className = "text-[11px] text-emerald-700 font-bold block";
  } else {
    eligBadge.innerText = "✓ Affordable / Standard Rate Option";
    eligBadge.className = "text-[11px] text-slate-500 font-medium block";
  }

  // Acts List
  const actsList = document.getElementById("applicable-acts-list");
  actsList.innerHTML = diag.applicable_acts.map(act => `
    <li class="flex items-start space-x-1.5">
      <span class="text-blue-500 font-bold">•</span>
      <span>${act}</span>
    </li>
  `).join("");

  document.getElementById("citizen-rights-text").innerText = diag.citizen_rights_summary;
  document.getElementById("estimated-timeline-val").innerText = diag.estimated_timeline;
  document.getElementById("estimated-cost-val").innerText = diag.estimated_cost_range;

  if (window.lucide) lucide.createIcons();
}

// Render Explainable Matched Provider Cards (Step 2)
function renderMatches(matches) {
  const container = document.getElementById("matched-providers-container");
  document.getElementById("matched-count-badge").innerText = `${matches.length} Verified LSPs Evaluated`;

  if (!matches || matches.length === 0) {
    container.innerHTML = `<div class="col-span-2 text-center text-slate-500 p-8">No providers found matching this criterion.</div>`;
    return;
  }

  container.innerHTML = matches.slice(0, 6).map((item, idx) => {
    const p = item.provider;
    const exp = item.match_explanation;
    const isTop = idx === 0;

    return `
      <div class="glass-card rounded-2xl p-5 border ${isTop ? 'border-brand-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'} space-y-4 transition-all">
        
        <!-- Header Info -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center space-x-3">
            <img src="${p.avatar_url || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150'}" alt="${p.name}" class="w-12 h-12 rounded-xl object-cover border border-slate-300">
            <div>
              <div class="flex items-center space-x-1.5">
                <h4 class="text-sm font-black text-slate-900">${p.name}</h4>
                ${p.verification_status === 'Government Empanelled' ? 
                  `<span class="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded">Govt Empanelled</span>` : 
                  `<span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">Verified</span>`
                }
              </div>
              <p class="text-[11px] text-slate-500 font-medium">${p.title} • <span class="font-mono text-slate-700 font-semibold">${p.bar_council_id}</span></p>
              <div class="flex items-center space-x-2 text-[11px] text-slate-600 mt-0.5">
                <span>⭐ <strong>${p.rating}</strong> (${p.total_reviews})</span>
                <span>•</span>
                <span>📍 ${p.city}, ${p.state}</span>
                <span>•</span>
                <span>🗣️ ${p.languages.slice(0, 2).join(', ')}</span>
              </div>
            </div>
          </div>

          <!-- Match Score Circle -->
          <div class="text-center">
            <div class="w-12 h-12 rounded-full ${item.match_score >= 90 ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500' : 'bg-blue-50 text-blue-800 border-2 border-blue-500'} flex flex-col items-center justify-center">
              <span class="text-xs font-black leading-none">${item.match_score}%</span>
              <span class="text-[8px] font-bold uppercase tracking-tight">Match</span>
            </div>
            ${isTop ? `<span class="text-[9px] font-bold text-amber-600 block mt-1">#1 Best Fit</span>` : ''}
          </div>
        </div>

        <!-- EXPLAINABLE MATCH BOX ("Why this professional?") -->
        <div class="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 flex items-center space-x-1">
              <i data-lucide="info" class="w-3.5 h-3.5 text-brand-600"></i>
              <span>Why NyaySetu Recommends This Professional:</span>
            </span>
            <span class="text-[10px] text-brand-700 font-semibold cursor-pointer hover:underline" onclick="toggleRadar('${p.id}')">
              Toggle Radar Scores
            </span>
          </div>

          <p class="text-slate-600 leading-relaxed text-[11px]">
            ${exp.why_recommended}
          </p>

          <!-- Highlights -->
          <div class="space-y-1 text-[11px] text-slate-700">
            ${exp.highlights.map(h => `
              <div class="flex items-start space-x-1.5">
                <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"></i>
                <span>${h}</span>
              </div>
            `).join('')}
          </div>

          <!-- Radar Factor Breakdown Bars (Expandable) -->
          <div id="radar-${p.id}" class="space-y-1.5 pt-2 border-t border-slate-200">
            <div class="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <div class="flex justify-between text-slate-600 font-medium">
                  <span>Domain Expertise</span>
                  <span class="font-bold text-slate-800">${exp.factor_breakdown.domain_expertise}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-blue-600 h-full rounded-full meter-fill" style="width: ${exp.factor_breakdown.domain_expertise}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-slate-600 font-medium">
                  <span>Location Jurisdiction</span>
                  <span class="font-bold text-slate-800">${exp.factor_breakdown.location_jurisdiction}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full meter-fill" style="width: ${exp.factor_breakdown.location_jurisdiction}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-slate-600 font-medium">
                  <span>Language Alignment</span>
                  <span class="font-bold text-slate-800">${exp.factor_breakdown.language_match}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-600 h-full rounded-full meter-fill" style="width: ${exp.factor_breakdown.language_match}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-slate-600 font-medium">
                  <span>Affordability / Fee</span>
                  <span class="font-bold text-slate-800">${exp.factor_breakdown.budget_affordability}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full rounded-full meter-fill" style="width: ${exp.factor_breakdown.budget_affordability}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions: Fee & Book -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <div>
            <span class="text-[10px] text-slate-400 block font-medium">Consultation Fee:</span>
            <span class="text-sm font-extrabold ${p.fee_per_consultation === 0 ? 'text-emerald-700' : 'text-slate-900'}">
              ${p.fee_per_consultation === 0 ? 'FREE (Legal Aid)' : '₹' + p.fee_per_consultation}
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-[10px] text-slate-500 font-medium hidden sm:inline">Next Slot: <strong>${p.next_available_slot}</strong></span>
            <button
              onclick="openBookingModal('${p.id}')"
              class="bg-brand-900 hover:bg-brand-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105"
            >
              Book Tele-Law
            </button>
          </div>
        </div>

      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function toggleRadar(providerId) {
  const el = document.getElementById(`radar-${providerId}`);
  if (el) {
    el.classList.toggle("hidden");
  }
}

// Booking Modal Controls
function openBookingModal(providerId) {
  const matchItem = currentMatches.find(m => m.provider.id === providerId);
  if (!matchItem) return;

  selectedProviderForBooking = matchItem.provider;
  document.getElementById("modal-provider-name").innerText = selectedProviderForBooking.name;
  document.getElementById("modal-fee-display").innerText = selectedProviderForBooking.fee_per_consultation === 0 ? "FREE (NALSA Aid)" : `₹${selectedProviderForBooking.fee_per_consultation}`;

  document.getElementById("booking-modal").classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
}

async function confirmBookingSubmit() {
  if (!selectedProviderForBooking) return;

  const citizenName = document.getElementById("book-citizen-name").value;
  const citizenPhone = document.getElementById("book-citizen-phone").value;
  const slot = document.getElementById("book-slot-select").value;
  const mode = document.getElementById("book-mode-select").value;

  try {
    const res = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider_id: selectedProviderForBooking.id,
        citizen_name: citizenName,
        citizen_phone: citizenPhone,
        case_summary: currentDiagnosis ? currentDiagnosis.translated_summary : "Legal inquiry",
        legal_category: currentDiagnosis ? currentDiagnosis.primary_category : "General Legal",
        preferred_slot: slot,
        consultation_mode: mode,
        is_legal_aid_case: selectedProviderForBooking.fee_per_consultation === 0
      })
    });

    const data = await res.json();
    closeBookingModal();

    // Show success modal
    document.getElementById("success-booking-msg").innerText = data.message;
    document.getElementById("success-booking-id").innerText = data.booking_id;
    document.getElementById("success-booking-time").innerText = data.scheduled_time;
    document.getElementById("booking-success-modal").classList.remove("hidden");

    // Add to provider active bookings list
    updateProviderBookingUI(data, citizenName);

  } catch (err) {
    console.error("Booking error:", err);
    alert("Booking failed. Please check backend status.");
  }
}

function closeSuccessModal() {
  document.getElementById("booking-success-modal").classList.add("hidden");
}

function updateProviderBookingUI(data, citizenName) {
  const list = document.getElementById("provider-bookings-list");
  if (!list) return;

  const newCard = document.createElement("div");
  newCard.className = "p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2";
  newCard.innerHTML = `
    <div>
      <div class="flex items-center space-x-2">
        <span class="font-bold text-slate-900">Citizen: ${citizenName}</span>
        <span class="bg-blue-100 text-blue-800 px-2 py-0.2 rounded font-semibold text-[10px]">${data.booking_id}</span>
        <span class="bg-amber-100 text-amber-800 px-2 py-0.2 rounded font-semibold text-[10px]">+${data.credits_awarded_to_provider} 🪙 NyayCredits Awarded</span>
      </div>
      <p class="text-slate-500 mt-0.5">Time: ${data.scheduled_time} • Status: Confirmed & Scheduled</p>
    </div>
    <a href="${data.meeting_link_or_address}" target="_blank" class="bg-brand-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 text-xs">
      <i data-lucide="video" class="w-3.5 h-3.5"></i>
      <span>Join Tele-Law Room</span>
    </a>
  `;
  list.prepend(newCard);

  // Update wallet credits
  const walletVal = document.getElementById("wallet-credits-val");
  if (walletVal) {
    const current = parseInt(walletVal.innerText.replace(/,/g, "")) || 1450;
    walletVal.innerText = (current + data.credits_awarded_to_provider).toLocaleString();
  }

  if (window.lucide) lucide.createIcons();
}

// Notice Scanner Tab Logic
function fillSampleDocument(type) {
  const text = SAMPLE_DOCUMENTS[type];
  if (text) {
    document.getElementById("scanner-document-text").value = text;
    triggerDocumentScan();
  }
}

async function triggerDocumentScan() {
  const text = document.getElementById("scanner-document-text").value.trim();
  if (!text) {
    alert("Please paste notice or contract text to scan.");
    return;
  }

  try {
    const res = await fetch("/api/ai/scan-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_text: text })
    });

    const data = await res.json();
    
    document.getElementById("doc-classification-title").innerText = data.document_classification;
    document.getElementById("doc-rec-service").innerText = data.recommended_service_type;
    document.getElementById("doc-summary-text").innerText = data.summary;
    document.getElementById("doc-action-text").innerText = data.recommended_immediate_action;

    const riskBadge = document.getElementById("doc-risk-badge");
    riskBadge.innerText = data.risk_level;
    if (data.risk_level === "High Risk") {
      riskBadge.className = "text-xs font-bold px-2.5 py-0.5 rounded uppercase bg-red-100 text-red-800";
    } else {
      riskBadge.className = "text-xs font-bold px-2.5 py-0.5 rounded uppercase bg-amber-100 text-amber-800";
    }

    const deadlinesList = document.getElementById("doc-deadlines-list");
    deadlinesList.innerHTML = data.critical_deadlines.map(d => `<li>• ${d}</li>`).join("");

    document.getElementById("scanner-result-box").classList.remove("hidden");
    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error("Scan error:", err);
    alert("Could not complete document scan.");
  }
}

// Bar Council Licensure Verification Simulator
async function testBarIdVerification() {
  const barId = document.getElementById("test-bar-id-input").value.trim();
  const resDiv = document.getElementById("bar-verify-result");
  if (!barId) return;

  try {
    const res = await fetch("/api/providers/verify-bar-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bar_council_id: barId, state: "West Bengal" })
    });
    const data = await res.json();

    resDiv.classList.remove("hidden");
    if (data.valid) {
      resDiv.className = "mt-2 p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-medium";
      resDiv.innerHTML = `
        <div class="flex items-center space-x-1.5 font-bold text-emerald-800">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
          <span>Verified Bar Council Credential</span>
        </div>
        <p class="mt-1">Advocate: <strong>${data.advocate_name}</strong> • State: ${data.state_bar_council} • Disciplinary Record: ${data.disciplinary_actions}</p>
      `;
    } else {
      resDiv.className = "mt-2 p-2.5 bg-red-50 text-red-900 border border-red-200 rounded-lg text-xs font-medium";
      resDiv.innerHTML = `⚠️ ${data.message}`;
    }
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

function openVerificationModal() {
  document.getElementById("verification-modal").classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeVerificationModal() {
  document.getElementById("verification-modal").classList.add("hidden");
}

async function executeQuickBarCheck() {
  const barId = document.getElementById("quick-bar-id").value.trim();
  const resBox = document.getElementById("quick-bar-result");
  if (!barId) return;

  try {
    const res = await fetch("/api/providers/verify-bar-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bar_council_id: barId, state: "India" })
    });
    const data = await res.json();

    resBox.classList.remove("hidden");
    if (data.valid) {
      resBox.innerHTML = `
        <span class="text-emerald-700 font-bold block">✓ Verified Active Licensure</span>
        <p class="text-slate-600 mt-1">${data.advocate_name} • ${data.state_bar_council} • Good Standing</p>
      `;
    } else {
      resBox.innerHTML = `<span class="text-red-700 font-semibold">${data.message}</span>`;
    }
  } catch (e) {
    console.error(e);
  }
}

// Government & DISHA 2.0 Dashboard Logic
async function loadGovtDashboard() {
  try {
    const res = await fetch("/api/analytics/dashboard");
    const data = await res.json();

    // Heatmap table rows
    const tbody = document.getElementById("heatmap-table-body");
    if (tbody && data.state_demand_supply_heatmap) {
      tbody.innerHTML = data.state_demand_supply_heatmap.map(row => {
        const isCritical = row.supply_gap_index.includes("Critical") || row.supply_gap_index.includes("High");
        return `
          <tr class="hover:bg-slate-50 transition-all">
            <td class="py-2.5 px-3 font-bold text-slate-900">${row.state} <span class="text-slate-400 font-normal block text-[10px]">${row.district}</span></td>
            <td class="py-2.5 px-3 font-semibold">${row.demand_cases} cases</td>
            <td class="py-2.5 px-3">${row.active_providers} LSPs</td>
            <td class="py-2.5 px-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isCritical ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800'}">
                ${row.supply_gap_index}
              </span>
            </td>
            <td class="py-2.5 px-3 text-slate-600">${row.common_dispute}</td>
            <td class="py-2.5 px-3 font-bold text-blue-900">${row.tele_law_utilization}</td>
          </tr>
        `;
      }).join("");
    }
  } catch (e) {
    console.error("Govt dashboard fetch error:", e);
  }
}

function renderGovtCharts() {
  const ctx = document.getElementById("disputeChart");
  if (!ctx) return;

  if (disputeChartInstance) {
    disputeChartInstance.destroy();
  }

  disputeChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        "Property & Land",
        "Family & Matrimonial",
        "Consumer & Fraud",
        "Labor & Employment",
        "Cybercrime & UPI",
        "Rent & Tenancy",
        "Criminal & Bail"
      ],
      datasets: [{
        data: [340, 210, 175, 155, 140, 98, 92],
        backgroundColor: [
          "#1e3a8a",
          "#3b82f6",
          "#f59e0b",
          "#10b981",
          "#8b5cf6",
          "#ec4899",
          "#64748b"
        ],
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 12,
            font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" }
          }
        }
      }
    }
  });
}

function changeLanguage(lang) {
  console.log("Active language changed to:", lang);
}
