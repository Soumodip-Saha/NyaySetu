// State Management
let currentDiagnosis = null;
let currentMatches = [];
let selectedProviderForBooking = null;
let isRecording = false;
let speechRecognizer = null;
let disputeChartInstance = null;

let allConstitutionArticles = [];
let allConstitutionAmendments = [];
let allDirectoryLawyers = [];
let activeConstitutionSubTab = "articles";
let currentAppLanguage = "English";

// Comprehensive Multilingual Translation Engine (5 Indic Languages)
const I18N_DICT = {
  English: {
    brand_sub: "Intelligent Legal Service Routing • Grounded in Constitution of India",
    nav_match: "AI Match",
    nav_scanner: "Notice Scanner",
    nav_constitution: "Constitution (2026)",
    nav_directory: "SCAORA & Nyaya Bandhu",
    nav_credits: "NyayCredits",
    nav_govt: "DISHA 2.0",
    btn_verify: "Verify Bar/AOR ID",
    judges_label: "Judges Quick Test",
    judges_desc: "Click a realistic scenario to see instant AI Diagnostic & Explainable Matching:",
    preset_0: "🏞️ Land Encroachment (Bengali)",
    preset_1: "💼 Unpaid Wages (English)",
    preset_2: "👨‍👩‍👧 Mutual Custody (Hindi)",
    preset_3: "🛡️ Cyber Scam (Tamil)",
    preset_4: "💳 Sec 138 Cheque Bounce",
    hero_badge: "Multilingual & Voice-First Legal Need Detection • Backed by Article 39A",
    hero_title: "Tell us your legal problem in <span class='gradient-text-primary'>any Indian language</span>.",
    hero_desc: "NyaySetu AI analyzes your issue, diagnoses applicable Indian Acts, cites relevant Constitutional Articles, and connects you with verified Supreme Court AORs (SCAORA), DOJ Nyaya Bandhu pro bono lawyers, or DLSA Free Legal Aid.",
    textarea_ph: "Speak or type your problem in simple words (e.g. 'Mera padosi bina permission meri boundary zameen par diwar bana raha hai' or 'Company fired me without notice and withheld 3 months salary')...",
    label_city: "City / Jurisdiction",
    label_budget: "Max Budget",
    label_mode: "Consultation Mode",
    label_network: "Provider Network",
    opt_budget_0: "₹0 (Free Pro Bono / DLSA Aid)",
    opt_budget_500: "Under ₹500 (Affordable)",
    opt_budget_1000: "Under ₹1,000 (Standard)",
    opt_budget_2000: "Under ₹2,000 (Supreme Court AOR)",
    opt_mode_tele: "Tele-Law Video/Audio",
    opt_mode_chamber: "In-Person Chamber",
    opt_mode_any: "Any Available Mode",
    opt_net_all: "All Verified Networks",
    opt_net_nyaya: "DOJ Nyaya Bandhu (Pro Bono)",
    opt_net_scaora: "SCAORA (Supreme Court AOR)",
    opt_net_dlsa: "DLSA Free Legal Aid Clinics",
    btn_analyze: "Analyze & Match Verified Lawyers",
    scanner_title: "AI Legal Document & Notice Risk Scanner",
    scanner_desc: "Paste notice, summons, police FIR, or tenancy agreement to detect risks, response deadlines, and constitutional safeguards.",
    scanner_sample_label: "Load Real Statutory Sample:",
    scanner_ph: "Paste the legal notice or agreement text here...",
    scanner_btn_scan: "Scan Document & Assess Legal Risk",
    const_title: "The Constitution of India [2026 Edition]",
    const_desc: "Complete digital repository of Key Articles and 1st to 106th Amendment Acts (including Nari Shakti Vandan Adhiniyam 2026).",
    const_search_ph: "Search Articles or Amendments (e.g. 'Article 39A', 'Property', '106th Amendment', 'Writs', 'Panchayat')...",
    subtab_art: "Key Articles",
    subtab_amd: "Amendment Acts (1 - 106)",
    dir_title: "SCAORA & Nyaya Bandhu Advocates Directory",
    dir_desc: "Verified Supreme Court Advocates-on-Record (SCAORA) and Department of Justice (DOJ) Pro Bono Panel Counsel across India.",
    dir_search_ph: "Search by advocate name, city, bar ID, or domain...",
    provider_title: "Provider Portal & NyayCredits Gamification",
    provider_desc: "Rewarding advocates for pro bono service under Article 39A, swift consultations, and ethical practice.",
    govt_title: "National Legal Aid & DISHA 2.0 Intelligence Hub",
    govt_desc: "Real-time analytics on dispute geographic patterns, judicial deficit heatmaps, and institutional routing efficiency."
  },
  Hindi: {
    brand_sub: "इंटेलिजेंट विधिक सेवा रूटिंग • भारत के संविधान (2026) पर आधारित",
    nav_match: "एआई मैच",
    nav_scanner: "नोटिस स्कैनर",
    nav_constitution: "संविधान (2026)",
    nav_directory: "SCAORA व न्याय बंधु",
    nav_credits: "न्यायक्रेडिट्स",
    nav_govt: "दिशा 2.0",
    btn_verify: "बार/AOR आईडी जांचें",
    judges_label: "जजों के लिए त्वरित टेस्ट",
    judges_desc: "त्वरित एआई निदान और व्याख्यात्मक वकील मिलान देखने के लिए क्लिक करें:",
    preset_0: "🏞️ भूमि अतिक्रमण (बंगाली)",
    preset_1: "💼 बकाया वेतन (अंग्रेजी)",
    preset_2: "👨‍👩‍👧 आपसी सहमति कस्टडी (हिन्दी)",
    preset_3: "🛡️ साइबर धोखाधड़ी (तमिल)",
    preset_4: "💳 धारा 138 चेक बाउंस",
    hero_badge: "बहुभाषी और वॉयस-फर्स्ट कानूनी आवश्यकता पहचान • अनुच्छेद 39A समर्थित",
    hero_title: "अपनी कानूनी समस्या <span class='gradient-text-primary'>किसी भी भारतीय भाषा</span> में बताएं।",
    hero_desc: "न्यायसेतु एआई आपके मामले का विश्लेषण करता है, लागू भारतीय कानूनों की पहचान करता है, संवैधानिक अधिकारों का संदर्भ देता है और सत्यापित सुप्रीम कोर्ट AORs, न्याय बंधु वकीलों या मुफ्त कानूनी सहायता से जोड़ता है।",
    textarea_ph: "अपनी समस्या सरल शब्दों में बोलें या लिखें (उदा. 'मेरा पड़ोसी बिना अनुमति मेरी पुश्तैनी जमीन पर दीवार बना रहा है' या 'कंपनी ने बिना नोटिस निकाले 3 महीने का वेतन रोक लिया है')...",
    label_city: "शहर / अधिकार क्षेत्र",
    label_budget: "अधिकतम बजट",
    label_mode: "परामर्श माध्यम",
    label_network: "वकील नेटवर्क",
    opt_budget_0: "₹0 (मुफ्त प्रो बोनो / DLSA सहायता)",
    opt_budget_500: "₹500 तक (किफायती)",
    opt_budget_1000: "₹1,000 तक (मानक)",
    opt_budget_2000: "₹2,000 तक (सुप्रीम कोर्ट AOR)",
    opt_mode_tele: "टेली-लॉ वीडियो/ऑडियो",
    opt_mode_chamber: "व्यक्तिगत चैंबर",
    opt_mode_any: "कोई भी उपलब्ध माध्यम",
    opt_net_all: "सभी सत्यापित नेटवर्क",
    opt_net_nyaya: "न्याय बंधु (DOJ प्रो बोनो)",
    opt_net_scaora: "SCAORA (सुप्रीम कोर्ट AOR)",
    opt_net_dlsa: "DLSA मुफ्त कानूनी सहायता",
    btn_analyze: "विश्लेषण करें और वकील खोजें",
    scanner_title: "एआई कानूनी दस्तावेज और नोटिस स्कैनर",
    scanner_desc: "नोटिस, समन, पुलिस एफआईआर या किरायेदारी अनुबंध पेस्ट करें और कानूनी जोखिम, समय सीमा और संवैधानिक अधिकारों की जांच करें।",
    scanner_sample_label: "वास्तविक वैधानिक नमूना लोड करें:",
    scanner_ph: "कानूनी नोटिस या अनुबंध का पाठ यहां पेस्ट करें...",
    scanner_btn_scan: "दस्तावेज़ स्कैन करें और कानूनी जोखिम जांचें",
    const_title: "भारत का संविधान [2026 संस्करण]",
    const_desc: "मुख्य अनुच्छेदों और 1 से 106वें संविधान संशोधन अधिनियम (नारी शक्ति वंदन अधिनियम सहित) का डिजिटल रिपोजिटरी।",
    const_search_ph: "अनुच्छेद या संशोधन खोजें (उदा. 'अनुच्छेद 39A', 'संपत्ति', '106वां संशोधन', 'रिट', 'पंचायत')...",
    subtab_art: "मुख्य अनुच्छेद",
    subtab_amd: "संशोधन अधिनियम (1 - 106)",
    dir_title: "SCAORA और न्याय बंधु अधिवक्ता निर्देशिका",
    dir_desc: "पूरे भारत में सत्यापित सुप्रीम कोर्ट एडवोकेट्स-ऑन-रिकॉर्ड और विधि मंत्रालय न्याय बंधु पैनलिस्ट।",
    dir_search_ph: "वकील का नाम, शहर, बार आईडी या विशेषज्ञता से खोजें...",
    provider_title: "अधिवक्ता पोर्टल और न्यायक्रेडिट्स प्रणाली",
    provider_desc: "अनुच्छेद 39A के तहत प्रो बोनो सेवा, त्वरित परामर्श और नैतिक अभ्यास के लिए अधिवक्ताओं को पुरस्कृत करना।",
    govt_title: "राष्ट्रीय विधिक सेवा व दिशा 2.0 इंटेलिजेंस हब",
    govt_desc: "विवादों के भौगोलिक पैटर्न, क्षेत्रीय न्यायिक घाटे के हीटमैप और संस्थागत रूटिंग दक्षता पर रीयल-टाइम डेटा।"
  },
  Bengali: {
    brand_sub: "বুদ্ধিমান আইনি পরিষেবা রাউটিং • ভারতের সংবিধান (২০২৬) দ্বারা চালিত",
    nav_match: "AI ম্যাচ",
    nav_scanner: "নোটিশ স্ক্যানার",
    nav_constitution: "সংবিধান (২০২৬)",
    nav_directory: "SCAORA ও ন্যায় বন্ধু",
    nav_credits: "ন্যায়ক্রেডিট",
    nav_govt: "দিশা ২.০",
    btn_verify: "বার/AOR আইডি যাচাই",
    judges_label: "বিচারকদের দ্রুত পরীক্ষা",
    judges_desc: "তাৎক্ষণিক এআই নির্ণয় এবং ব্যাখ্যাযোগ্য মিল দেখতে ক্লিক করুন:",
    preset_0: "🏞️ জমি দখল সংক্রান্ত বিরোধ (বাংলা)",
    preset_1: "💼 বকেয়া বেতন (ইংরেজি)",
    preset_2: "👨‍👩‍👧 পারস্পরিক সম্মতি হেফাজত (হিন্দি)",
    preset_3: "🛡️ সাইবার আর্থিক জালিয়াতি (তামিল)",
    preset_4: "💳 ধারা ১৩৮ চেক বাউন্স",
    hero_badge: "বহুভাষিক ও ভয়েস-ভিত্তিক আইনি শনাক্তকরণ • অনুচ্ছেদ ৩৯A সমর্থিত",
    hero_title: "<span class='gradient-text-primary'>যেকোনো ভারতীয় ভাষায়</span> আপনার আইনি সমস্যা বলুন।",
    hero_desc: "ন্যায়সেতু এআই আপনার সমস্যা বিশ্লেষণ করে, প্রযোজ্য ভারতীয় আইন ও সাংবিধানিক অনুচ্ছেদ শনাক্ত করে এবং সুপ্রিম কোর্ট AORs, ন্যায় বন্ধু বা বিনামূল্যে আইনি সহায়তার সাথে যুক্ত করে।",
    textarea_ph: "সহজ ভাষায় বলুন বা লিখুন (যেমন 'আমার প্রতিবেশী আমাদের পৈতৃক জমিতে জোর করে সীমানা প্রাচীর তৈরি করছে' বা 'কোম্পানি নোটিশ ছাড়াই চাকরি থেকে বাদ দিয়ে ৩ মাসের বেতন আটকে রেখেছে')...",
    label_city: "শহর / এখতিয়ার",
    label_budget: "সর্বোচ্চ বাজেট",
    label_mode: "পরামর্শের মাধ্যম",
    label_network: "আইনজীবী নেটওয়ার্ক",
    opt_budget_0: "₹০ (বিনামূল্যে প্রো বোনো / DLSA সহায়তা)",
    opt_budget_500: "₹৫০০ পর্যন্ত (সাশ্রয়ী)",
    opt_budget_1000: "₹১,০০০ পর্যন্ত (মানক)",
    opt_budget_2000: "₹২,০০০ পর্যন্ত (সুপ্রিম কোর্ট AOR)",
    opt_mode_tele: "টেলি-ল ভিডিও/অডিও",
    opt_mode_chamber: "চেম্বার পরামর্শ",
    opt_mode_any: "যেকোনো মাধ্যম",
    opt_net_all: "সকল যাচাইকৃত নেটওয়ার্ক",
    opt_net_nyaya: "ন্যায় বন্ধু (DOJ প্রো বোনো)",
    opt_net_scaora: "SCAORA (সুপ্রিম কোর্ট AOR)",
    opt_net_dlsa: "DLSA বিনামূল্যে আইনি সহায়তা",
    btn_analyze: "বিশ্লেষণ ও যাচাইকৃত আইনজীবী মেলান",
    scanner_title: "এআই আইনি নথি ও নোটিশ স্ক্যানার",
    scanner_desc: "নোটিশ, সমন, পুলিশ এফআইআর বা চুক্তি পেস্ট করুন এবং আইনি ঝুঁকি, সময়সীমা ও সাংবিধানিক অধিকার যাচাই করুন।",
    scanner_sample_label: "বাস্তব সংবিধিবদ্ধ নমুনা লোড করুন:",
    scanner_ph: "আইনি নোটিশ বা চুক্তির পাঠ এখানে পেস্ট করুন...",
    scanner_btn_scan: "নথি স্ক্যান ও আইনি ঝুঁকি মূল্যায়ন",
    const_title: "ভারতের সংবিধান [২০২৬ সংস্করণ]",
    const_desc: "প্রধান অনুচ্ছেদ এবং ১ম থেকে ১০৬তম সংশোধনী আইনের (নারী শক্তি বন্দন আইন সহ) সম্পূর্ণ ডিজিটাল ভাণ্ডার।",
    const_search_ph: "অনুচ্ছেদ বা সংশোধনী খুঁজুন (যেমন 'অনুচ্ছেদ ৩৯A', 'সম্পত্তি', '১০৬তম সংশোধনী')...",
    subtab_art: "প্রধান অনুচ্ছেদ",
    subtab_amd: "সংশোধনী আইন (১ - ১০৬)",
    dir_title: "SCAORA ও ন্যায় বন্ধু আইনজীবী ডিরেক্টরি",
    dir_desc: "সমগ্র ভারতের যাচাইকৃত সুপ্রিম কোর্ট Advocates-on-Record এবং আইন মন্ত্রণালয়ের ন্যায় বন্ধু আইনজীবী।",
    dir_search_ph: "আইনজীবীর নাম, শহর, বার আইডি বা ক্ষেত্র দিয়ে খুঁজুন...",
    provider_title: "আইনজীবী পোর্টাল ও ন্যায়ক্রেডিট ব্যবস্থা",
    provider_desc: "অনুচ্ছেদ ৩৯A এর অধীনে প্রো বোনো পরিষেবা, দ্রুত পরামর্শ এবং পেশাদারিত্বের জন্য আইনজীবীদের পুরস্কৃত করা।",
    govt_title: "জাতীয় আইনি সহায়তা ও দিশা ২.০ হাব",
    govt_desc: "বিরোধের ভৌগোলিক ধরন, বিচার বিভাগীয় ঘাটতির হিটম্যাপ এবং প্রাতিষ্ঠানিক রাউটিং দক্ষতার রিয়েল-টাইম তথ্য।"
  },
  Tamil: {
    brand_sub: "அறிவார்ந்த சட்ட சேவை வழிகாட்டல் • இந்திய அரசியலமைப்பு (2026) அடிப்படை",
    nav_match: "AI பொருத்தம்",
    nav_scanner: "நோட்டீஸ் ஸ்கேனர்",
    nav_constitution: "அரசியலமைப்பு (2026)",
    nav_directory: "SCAORA & நியாய பந்து",
    nav_credits: "நியாய கிரெடிட்கள்",
    nav_govt: "திஷா 2.0",
    btn_verify: "வழக்கறிஞர் ஐடி சரிபார்க்கவும்",
    judges_label: "விரைவு சோதனை",
    judges_desc: "உடனடி AI பகுப்பாய்வு மற்றும் பொருத்தத்தைக் காண கிளிக் செய்யவும்:",
    preset_0: "🏞️ நில ஆக்கிரமிப்பு சர்ச்சை (வங்கம்)",
    preset_1: "💼 நிலுவை ஊதியம் (ஆங்கிலம்)",
    preset_2: "👨‍👩‍👧 பரஸ்பர விவாகரத்து (இந்தி)",
    preset_3: "🛡️ சைபர் மோசடி (தமிழ்)",
    preset_4: "💳 பிரிவு 138 காசோலை பவுன்ஸ்",
    hero_badge: "பன்மொழி மற்றும் குரல் அடிப்படையிலான சட்ட தேவை கண்டறிதல் • பிரிவு 39A",
    hero_title: "<span class='gradient-text-primary'>எந்த இந்திய மொழியிலும்</span> உங்கள் சட்டப் பிரச்சனையை கூறுங்கள்.",
    hero_desc: "நியாய்சேது AI உங்கள் வழக்கை பகுப்பாய்வு செய்து, சட்டங்கள் மற்றும் அரசியலமைப்பு உரிமைகளைக் கண்டறிந்து, சரிபார்க்கப்பட்ட வழக்கறிஞர்களை இணைக்கிறது.",
    textarea_ph: "உங்கள் பிரச்சனையை எளிய வார்த்தைகளில் பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள்...",
    label_city: "நகரம் / வரம்பு",
    label_budget: "அதிகபட்ச பட்ஜெட்",
    label_mode: "ஆலோசனை முறை",
    label_network: "வழக்கறிஞர் நெட்வொர்க்",
    opt_budget_0: "₹0 (இலவச சட்ட உதவி)",
    opt_budget_500: "₹500 வரை (குறைந்த கட்டணம்)",
    opt_budget_1000: "₹1,000 வரை (வழக்கமானது)",
    opt_budget_2000: "₹2,000 வரை (உச்ச நீதிமன்ற AOR)",
    opt_mode_tele: "டெலி-லா வீடியோ/ஆடியோ",
    opt_mode_chamber: "நேரடி ஆலோசனை",
    opt_mode_any: "எந்த முறையும்",
    opt_net_all: "அனைத்து சரிபார்க்கப்பட்ட நெட்வொர்க்குகள்",
    opt_net_nyaya: "நியாய பந்து (DOJ இலவச சேவை)",
    opt_net_scaora: "SCAORA (உச்ச நீதிமன்ற AOR)",
    opt_net_dlsa: "DLSA இலவச சட்ட உதவி",
    btn_analyze: "பகுப்பாய்வு செய்து வழக்கறிஞரைத் தேடுங்கள்",
    scanner_title: "AI சட்ட ஆவணங்கள் மற்றும் நோட்டீஸ் ஸ்கேனர்",
    scanner_desc: "நோட்டீஸ் அல்லது ஒப்பந்தத்தை பதிவேற்றி சட்ட ஆபத்துகள் மற்றும் காலக்கெடுவை அறியவும்.",
    scanner_sample_label: "சட்ட மாதிரியை ஏற்றவும்:",
    scanner_ph: "சட்ட நோட்டீஸ் அல்லது ஒப்பந்த உரையை இங்கே ஒட்டவும்...",
    scanner_btn_scan: "ஆவணத்தை ஸ்கேன் செய்து ஆபத்தை மதிப்பிடுங்கள்",
    const_title: "இந்திய அரசியலமைப்பு [2026 பதிப்பு]",
    const_desc: "முக்கிய சரத்துக்கள் மற்றும் 1 முதல் 106 வது திருத்தச் சட்டங்களின் டிஜிட்டல் களஞ்சியம்.",
    const_search_ph: "சரத்துக்கள் அல்லது திருத்தங்களைத் தேடுங்கள்...",
    subtab_art: "முக்கிய சரத்துக்கள்",
    subtab_amd: "திருத்தச் சட்டங்கள் (1 - 106)",
    dir_title: "SCAORA மற்றும் நியாய பந்து வழக்கறிஞர் அடைவு",
    dir_desc: "உச்ச நீதிமன்ற AORகள் மற்றும் நீதி அமைச்சக இலவச வழக்கறிஞர்கள்.",
    dir_search_ph: "வழக்கறிஞர் பெயர், நகரம் அல்லது துறையின் அடிப்படையில் தேடுங்கள்...",
    provider_title: "வழக்கறிஞர் போர்ட்டல் & நியாய கிரெடிட்கள்",
    provider_desc: "இலவச சேவை மற்றும் விரைவான ஆலோசனைக்காக வழக்கறிஞர்களுக்கு வெகுமதி அளித்தல்.",
    govt_title: "தேசிய சட்ட உதவி & திஷா 2.0 மையம்",
    govt_desc: "சட்ட உதவி புள்ளிவிவரங்கள் மற்றும் நிகழ்நேர பகுப்பாய்வு மையம்."
  },
  Marathi: {
    brand_sub: "बुद्धिमान कायदेशीर सेवा मार्गक्रमण • भारताच्या संविधानावर (२०२६) आधारित",
    nav_match: "AI मॅच",
    nav_scanner: "नोटीस स्कॅनर",
    nav_constitution: "संविधान (२०२६)",
    nav_directory: "SCAORA व न्याय बंधू",
    nav_credits: "न्यायक्रेडिट्स",
    nav_govt: "दिशा २.०",
    btn_verify: "बार/AOR आयडी पडताळा",
    judges_label: "त्वरित चाचणी",
    judges_desc: "त्वरित AI निदान आणि स्पष्टीकरण जुळणी पाहण्यासाठी क्लिक करा:",
    preset_0: "🏞️ जमीन अतिक्रमण वाद (बंगाली)",
    preset_1: "💼 थकीत वेतन (इंग्रजी)",
    preset_2: "👨‍👩‍👧 परस्पर संमतीने कस्टडी (हिंदी)",
    preset_3: "🛡️ सायबर फसवणूक (तमिळ)",
    preset_4: "💳 कलम १३८ चेक बाऊन्स",
    hero_badge: "बहुभाषिक व व्हॉईस-आधारित कायदेशीर गरज शोध • कलम ३९A समर्थित",
    hero_title: "तुमची कायदेशीर समस्या <span class='gradient-text-primary'>कोणत्याही भारतीय भाषेत</span> सांगा.",
    hero_desc: "न्यायसेतु AI तुमच्या समस्येचे विश्लेषण करते, लागू कायदे व घटनात्मक अधिकार शोधते आणि सर्वोच्च न्यायालयाचे AORs, न्याय बंधू वकील किंवा मोफत कायदेशीर मदतीशी जोडते.",
    textarea_ph: "तुमची समस्या साध्या शब्दांत बोला किंवा टाईप करा (उदा. 'शेजारी माझ्या जागेवर अतिक्रमण करत आहे' किंवा 'कंपनीने पगार दिला नाही')...",
    label_city: "शहर / अधिकारक्षेत्र",
    label_budget: "कमाल बजेट",
    label_mode: "सल्लामसलत पद्धत",
    label_network: "वकील नेटवर्क",
    opt_budget_0: "₹० (मोफत प्रो बोनो / DLSA मदत)",
    opt_budget_500: "₹५०० पर्यंत (परवडणारे)",
    opt_budget_1000: "₹१,००० पर्यंत (प्रमाणित)",
    opt_budget_2000: "₹२,००० पर्यंत (सर्वोच्च न्यायालय AOR)",
    opt_mode_tele: "टेली-लॉ व्हिडिओ/ऑडिओ",
    opt_mode_chamber: "प्रत्यक्ष चेंबर",
    opt_mode_any: "कोणतीही उपलब्ध पद्धत",
    opt_net_all: "सर्व पडताळलेले नेटवर्क",
    opt_net_nyaya: "न्याय बंधू (DOJ प्रो बोनो)",
    opt_net_scaora: "SCAORA (सर्वोच्च न्यायालय AOR)",
    opt_net_dlsa: "DLSA मोफत कायदेशीर मदत",
    btn_analyze: "विश्लेषण करा आणि वकील शोधा",
    scanner_title: "AI कायदेशीर दस्तऐवज आणि नोटीस स्कॅनर",
    scanner_desc: "नोटीस, समन्स, एफआयआर किंवा भाडे करार पेस्ट करा आणि कायदेशीर जोखीम, मुदत आणि हक्क तपासा.",
    scanner_sample_label: "वैधानिक नमुना लोड करा:",
    scanner_ph: "कायदेशीर नोटीस किंवा कराराचा मजकूर येथे पेस्ट करा...",
    scanner_btn_scan: "दस्तऐवज स्कॅन करा आणि जोखीम तपासा",
    const_title: "भारताचे संविधान [२०२६ आवृत्ती]",
    const_desc: "महत्त्वाचे कलम आणि १ ते १०६ व्या घटनादुरुस्ती कायद्यांचे डिजिटल भांडार.",
    const_search_ph: "कलम किंवा दुरुस्ती शोधा (उदा. 'कलम ३९A', 'मालमत्ता', '१०६ वी दुरुस्ती')...",
    subtab_art: "महत्त्वाचे कलम",
    subtab_amd: "घटनादुरुस्ती कायदे (१ - १०६)",
    dir_title: "SCAORA आणि न्याय बंधू वकील निर्देशिका",
    dir_desc: "सर्वोच्च न्यायालयाचे Advocates-on-Record आणि विधी मंत्रालयाचे न्याय बंधू वकील.",
    dir_search_ph: "वकिलाचे नाव, शहर, बार आयडी किंवा विषयानुसार शोधा...",
    provider_title: "वकील पोर्टल आणि न्यायक्रेडिट्स",
    provider_desc: "कलम ३९A अंतर्गत मोफत सेवेसाठी आणि जलद सल्ल्यासाठी वकिलांना सन्मानित करणे.",
    govt_title: "राष्ट्रीय विधी सेवा आणि दिशा २.० केंद्र",
    govt_desc: "कायदेशीर मदतीचे भौगोलिक विश्लेषण आणि रिअल-टाइम डेटा केंद्र."
  }
};

// Presets for 1-Click Judge Demonstrations
const JUDGE_PRESETS = [
  {
    title: "Ancestral Land Dispute (Bengali)",
    query: "আমার প্রতিবেশী আমাদের পৈতৃক জমিতে জোর করে সীমানা প্রাচীর তৈরি করছে। কোনো আদালত থেকে স্টে অর্ডার পাওয়া যাবে কি?",
    location: "Kolkata, West Bengal",
    budget: 500,
    lang: "Bengali",
    mode: "tele-law",
    affiliation: "all"
  },
  {
    title: "Unpaid Corporate Wages (English)",
    query: "My employer terminated my contract abruptly without giving 30 days notice and withheld my last 3 months salary and gratuity payout.",
    location: "New Delhi, Delhi",
    budget: 1000,
    lang: "English",
    mode: "tele-law",
    affiliation: "all"
  },
  {
    title: "Mutual Divorce & Child Custody (Hindi)",
    query: "मैं और मेरी पत्नी आपसी सहमति से तलाक (Mutual Divorce) और 6 साल के बच्चे की कस्टडी का शांतिपूर्ण समाधान चाहते हैं बिना लंबी कोर्ट लड़ाई के।",
    location: "Patna, Bihar",
    budget: 0,
    lang: "Hindi",
    mode: "tele-law",
    affiliation: "nyaya_bandhu"
  },
  {
    title: "UPI Cyber Fraud (Tamil)",
    query: "ஒரு போலி KYC அழைப்பு மூலம் எனது வங்கி கணக்கிலிருந்து ₹45,000 திருடப்பட்டது. புகார் அளிக்க உடனடியாக என்ன செய்ய வேண்டும்?",
    location: "Chennai, Tamil Nadu",
    budget: 500,
    lang: "Tamil",
    mode: "tele-law",
    affiliation: "all"
  },
  {
    title: "Section 138 Cheque Dishonour Notice (English)",
    query: "I received a formal Section 138 demand notice for a bounced business cheque of ₹2.5 Lakhs giving me 15 days to pay. How should I reply?",
    location: "New Delhi, Delhi",
    budget: 1500,
    lang: "English",
    mode: "tele-law",
    affiliation: "scaora"
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
  // Load persisted language or default to English
  const savedLang = localStorage.getItem("nyaysetu_lang") || "English";
  currentAppLanguage = savedLang;
  const langSelect = document.getElementById("ui-language-select");
  if (langSelect) {
    langSelect.value = savedLang;
  }

  changeLanguage(savedLang);

  if (window.lucide) {
    lucide.createIcons();
  }
  setupSpeechRecognition();
  loadGovtDashboard();
  loadConstitutionData();
  loadLawyersDirectory();
});

// App Language Switcher
function changeLanguage(lang) {
  if (!I18N_DICT[lang]) {
    lang = "English";
  }
  currentAppLanguage = lang;
  localStorage.setItem("nyaysetu_lang", lang);

  const d = I18N_DICT[lang];

  // Update Navigation Tabs
  const tabCitizen = document.getElementById("tab-citizen");
  if (tabCitizen) tabCitizen.innerHTML = `<i data-lucide="compass" class="w-3.5 h-3.5 inline mr-1"></i> ${d.nav_match}`;

  const tabScanner = document.getElementById("tab-scanner");
  if (tabScanner) tabScanner.innerHTML = `<i data-lucide="file-search" class="w-3.5 h-3.5 inline mr-1"></i> ${d.nav_scanner}`;

  const tabConstitution = document.getElementById("tab-constitution");
  if (tabConstitution) tabConstitution.innerHTML = `<i data-lucide="book-marked" class="w-3.5 h-3.5 inline mr-1 text-amber-600"></i> ${d.nav_constitution}`;

  const tabDirectory = document.getElementById("tab-directory");
  if (tabDirectory) tabDirectory.innerHTML = `<i data-lucide="users" class="w-3.5 h-3.5 inline mr-1 text-blue-600"></i> ${d.nav_directory}`;

  const tabProvider = document.getElementById("tab-provider");
  if (tabProvider) tabProvider.innerHTML = `<i data-lucide="award" class="w-3.5 h-3.5 inline mr-1"></i> ${d.nav_credits}`;

  const tabGovt = document.getElementById("tab-govt");
  if (tabGovt) tabGovt.innerHTML = `<i data-lucide="bar-chart-3" class="w-3.5 h-3.5 inline mr-1"></i> ${d.nav_govt}`;

  // Update Hero Section
  const queryInput = document.getElementById("citizen-query-input");
  if (queryInput) queryInput.placeholder = d.textarea_ph;

  const btnAnalyze = document.getElementById("analyze-submit-btn");
  if (btnAnalyze) {
    btnAnalyze.innerHTML = `<span>${d.btn_analyze}</span><i data-lucide="arrow-right" class="w-4 h-4 inline ml-1"></i>`;
  }

  // Update Constitution Section
  const subtabArt = document.getElementById("subtab-articles");
  if (subtabArt) subtabArt.innerText = d.subtab_art;

  const subtabAmd = document.getElementById("subtab-amendments");
  if (subtabAmd) subtabAmd.innerText = d.subtab_amd;

  const constSearch = document.getElementById("constitution-search-input");
  if (constSearch) constSearch.placeholder = d.const_search_ph;

  // Update Directory Section
  const dirSearch = document.getElementById("directory-search-input");
  if (dirSearch) dirSearch.placeholder = d.dir_search_ph;

  // Update Notice Scanner Section
  const docInput = document.getElementById("scanner-document-text");
  if (docInput) docInput.placeholder = d.scanner_ph;

  // Configure Speech Recognizer for selected language
  if (speechRecognizer) {
    if (lang === "Hindi") speechRecognizer.lang = "hi-IN";
    else if (lang === "Bengali") speechRecognizer.lang = "bn-IN";
    else if (lang === "Tamil") speechRecognizer.lang = "ta-IN";
    else if (lang === "Marathi") speechRecognizer.lang = "mr-IN";
    else speechRecognizer.lang = "en-IN";
  }

  const indicator = document.getElementById("voice-status-indicator");
  if (indicator) {
    indicator.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      <span>${lang} AI Active • Voice & Text Enabled</span>
    `;
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Tab Navigation
function switchTab(tabId) {
  const tabs = ["citizen", "scanner", "constitution", "directory", "provider", "govt"];
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
        tabBtn.className = "nav-tab-btn px-3.5 py-1.5 rounded-lg font-semibold transition-all bg-white text-brand-900 shadow-sm";
      } else {
        tabBtn.className = "nav-tab-btn px-3.5 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition-all";
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
  if (preset.affiliation) {
    document.getElementById("user-affiliation-filter").value = preset.affiliation;
  }

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
  speechRecognizer.lang = "hi-IN";

  speechRecognizer.onstart = () => {
    isRecording = true;
    const btn = document.getElementById("voice-mic-btn");
    btn.classList.add("recording-pulse");
    document.getElementById("voice-status-indicator").innerHTML = `
      <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
      <span class="text-red-600 font-bold">Listening... Speak your legal issue in ${currentAppLanguage}</span>
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
    if (currentAppLanguage === "Hindi") speechRecognizer.lang = "hi-IN";
    else if (currentAppLanguage === "Bengali") speechRecognizer.lang = "bn-IN";
    else if (currentAppLanguage === "Tamil") speechRecognizer.lang = "ta-IN";
    else if (currentAppLanguage === "Marathi") speechRecognizer.lang = "mr-IN";
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
      <span>${currentAppLanguage} AI Active • Voice & Text Enabled</span>
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
  const affiliation = document.getElementById("user-affiliation-filter").value;

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

    // Check if query is non-legal, medical, or lacked legal context
    if (diagnosis.is_valid_legal_query === false) {
      document.getElementById("analysis-loading").classList.add("hidden");
      document.getElementById("diagnostic-results-section").classList.add("hidden");
      
      const warningSection = document.getElementById("contextless-warning-section");
      const iconBox = document.getElementById("contextless-icon-box");
      const badge = document.getElementById("contextless-badge");
      const title = document.getElementById("contextless-title");
      const helplineBox = document.getElementById("medical-helpline-box");
      const tipsHeader = document.getElementById("contextless-tips-header");

      if (warningSection) {
        document.getElementById("contextless-message-text").innerText = diagnosis.guidance_message || "Please provide more details regarding your legal dispute.";
        
        if (diagnosis.query_nature === "medical") {
          // Medical styling
          warningSection.className = "glass-card rounded-2xl p-6 sm:p-8 border-l-4 border-red-500 space-y-4 transition-all";
          if (iconBox) iconBox.innerHTML = `<i data-lucide="heart-pulse" class="w-6 h-6 text-red-600"></i>`;
          if (badge) {
            badge.innerText = "🩺 Medical / Health Inquiry (Non-Legal)";
            badge.className = "bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider";
          }
          if (title) title.innerText = "Please Consult a Qualified Healthcare Professional";
          if (helplineBox) helplineBox.classList.remove("hidden");
          if (tipsHeader) tipsHeader.innerHTML = `<i data-lucide="activity" class="w-4 h-4 text-red-600"></i><span>Healthcare Advisory & Guidance:</span>`;
          
          if (diagnosis.suggested_tips && diagnosis.suggested_tips.length > 0) {
            document.getElementById("contextless-tips-list").innerHTML = diagnosis.suggested_tips.map(t => `
              <li class="flex items-start space-x-2"><span class="text-red-500 font-bold">•</span><span>${t}</span></li>
            `).join("");
          }
        } else if (diagnosis.query_nature === "out_of_domain") {
          // Out-of-domain styling
          warningSection.className = "glass-card rounded-2xl p-6 sm:p-8 border-l-4 border-purple-500 space-y-4 transition-all";
          if (iconBox) iconBox.innerHTML = `<i data-lucide="help-circle" class="w-6 h-6 text-purple-600"></i>`;
          if (badge) {
            badge.innerText = "⚠️ Non-Legal Query Detected";
            badge.className = "bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider";
          }
          if (title) title.innerText = "NyaySetu is an AI Platform Exclusively for Legal Matters";
          if (helplineBox) helplineBox.classList.add("hidden");
          if (tipsHeader) tipsHeader.innerHTML = `<i data-lucide="scale" class="w-4 h-4 text-purple-600"></i><span>How to State Your Legal Issue:</span>`;
          
          if (diagnosis.suggested_tips && diagnosis.suggested_tips.length > 0) {
            document.getElementById("contextless-tips-list").innerHTML = diagnosis.suggested_tips.map(t => `
              <li class="flex items-start space-x-2"><span class="text-purple-500 font-bold">•</span><span>${t}</span></li>
            `).join("");
          }
        } else {
          // Insufficient context styling
          warningSection.className = "glass-card rounded-2xl p-6 sm:p-8 border-l-4 border-amber-500 space-y-4 transition-all";
          if (iconBox) iconBox.innerHTML = `<i data-lucide="alert-triangle" class="w-6 h-6 text-amber-700"></i>`;
          if (badge) {
            badge.innerText = "⚠️ Insufficient Legal Context";
            badge.className = "bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider";
          }
          if (title) title.innerText = "Please Provide a Few More Details About Your Dispute";
          if (helplineBox) helplineBox.classList.add("hidden");
          if (tipsHeader) tipsHeader.innerHTML = `<i data-lucide="help-circle" class="w-4 h-4 text-blue-600"></i><span>Tips for Better Legal Matching:</span>`;
          
          if (diagnosis.suggested_tips && diagnosis.suggested_tips.length > 0) {
            document.getElementById("contextless-tips-list").innerHTML = diagnosis.suggested_tips.map(t => `
              <li class="flex items-start space-x-2"><span class="text-amber-500 font-bold">•</span><span>${t}</span></li>
            `).join("");
          }
        }

        warningSection.classList.remove("hidden");
        warningSection.scrollIntoView({ behavior: "smooth" });
      }
      if (window.lucide) lucide.createIcons();
      return;
    }

    // Hide contextless warning if previously shown
    const warningSection = document.getElementById("contextless-warning-section");
    if (warningSection) warningSection.classList.add("hidden");

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
        legal_aid_required: diagnosis.free_legal_aid_eligible,
        affiliation_filter: affiliation
      })
    });

    const matches = await matchResponse.json();
    currentMatches = matches;

    // Render UI
    renderDiagnosis(diagnosis);
    renderMatches(matches);

    document.getElementById("analysis-loading").classList.add("hidden");
    document.getElementById("diagnostic-results-section").classList.remove("hidden");

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
    eligBadge.innerText = "✓ Free Legal Aid & Article 39A Subsidy Eligible";
    eligBadge.className = "text-[11px] text-emerald-700 font-bold block";
  } else {
    eligBadge.innerText = "✓ Affordable / Standard Rate Option";
    eligBadge.className = "text-[11px] text-slate-500 font-medium block";
  }

  // Render Constitutional Articles
  const constList = document.getElementById("constitutional-articles-list");
  if (constList && diag.constitutional_articles) {
    constList.innerHTML = diag.constitutional_articles.map(c => `
      <div class="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-amber-900 text-[11px]">${c.article} • ${c.title}</span>
          <button onclick="inspectArticle('${c.article}')" class="text-[10px] text-blue-700 font-semibold hover:underline">View in Constitution</button>
        </div>
        <p class="text-[10px] text-slate-600 mt-1">${c.summary}</p>
      </div>
    `).join("");
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
  document.getElementById("matched-count-badge").innerText = `${matches.length} Verified Lawyers Evaluated`;

  if (!matches || matches.length === 0) {
    container.innerHTML = `<div class="col-span-2 text-center text-slate-500 p-8">No providers found matching this criterion. Try changing the Provider Network filter.</div>`;
    return;
  }

  container.innerHTML = matches.slice(0, 6).map((item, idx) => {
    const p = item.provider;
    const exp = item.match_explanation;
    const isTop = idx === 0;

    let badgeHtml = "";
    if (p.affiliation && p.affiliation.includes("SCAORA")) {
      badgeHtml = `<span class="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-200">⚖️ SCAORA Supreme Court AOR</span>`;
    } else if (p.affiliation && p.affiliation.includes("Nyaya Bandhu")) {
      badgeHtml = `<span class="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200">🏛️ DOJ Nyaya Bandhu Panel</span>`;
    } else if (p.verification_status === "Government Empanelled") {
      badgeHtml = `<span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Govt Empanelled</span>`;
    } else {
      badgeHtml = `<span class="bg-slate-100 text-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Bar Council Verified</span>`;
    }

    return `
      <div class="glass-card rounded-2xl p-5 border ${isTop ? 'border-brand-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'} space-y-4 transition-all">
        
        <!-- Header Info -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center space-x-3">
            <img src="${p.avatar_url || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150'}" alt="${p.name}" class="w-12 h-12 rounded-xl object-cover border border-slate-300">
            <div>
              <div class="flex items-center space-x-1.5 flex-wrap gap-1">
                <h4 class="text-sm font-black text-slate-900">${p.name}</h4>
                ${badgeHtml}
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
              ${p.fee_per_consultation === 0 ? 'FREE (Pro Bono / Aid)' : '₹' + p.fee_per_consultation}
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-[10px] text-slate-500 font-medium hidden sm:inline">Next Slot: <strong>${p.next_available_slot}</strong></span>
            <button
              onclick="openBookingModal('${p.id}')"
              class="bg-brand-900 hover:bg-brand-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105"
            >
              Book Consultation
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
  const directLawyer = allDirectoryLawyers.find(l => l.id === providerId);
  
  if (matchItem) {
    selectedProviderForBooking = matchItem.provider;
  } else if (directLawyer) {
    selectedProviderForBooking = directLawyer;
  } else {
    return;
  }

  document.getElementById("modal-provider-name").innerText = selectedProviderForBooking.name;
  document.getElementById("modal-fee-display").innerText = selectedProviderForBooking.fee_per_consultation === 0 ? "FREE (Article 39A Aid)" : `₹${selectedProviderForBooking.fee_per_consultation}`;

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

    document.getElementById("success-booking-msg").innerText = data.message;
    document.getElementById("success-booking-id").innerText = data.booking_id;
    document.getElementById("success-booking-time").innerText = data.scheduled_time;
    document.getElementById("booking-success-modal").classList.remove("hidden");

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

  const walletVal = document.getElementById("wallet-credits-val");
  if (walletVal) {
    const current = parseInt(walletVal.innerText.replace(/,/g, "")) || 3800;
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
    
    if (data.is_valid_document === false) {
      document.getElementById("doc-classification-title").innerText = data.document_classification;
      document.getElementById("doc-rec-service").innerText = data.recommended_service_type;
      document.getElementById("doc-summary-text").innerText = data.guidance_message || data.summary;
      document.getElementById("doc-action-text").innerText = data.recommended_immediate_action;
      
      const constBox = document.getElementById("doc-const-box");
      constBox.classList.add("hidden");

      const riskBadge = document.getElementById("doc-risk-badge");
      riskBadge.innerText = "Notice Incomplete";
      riskBadge.className = "text-xs font-bold px-2.5 py-0.5 rounded uppercase bg-amber-100 text-amber-800";

      const deadlinesList = document.getElementById("doc-deadlines-list");
      deadlinesList.innerHTML = "<li>• Please paste complete statutory clauses or notice sections</li>";

      document.getElementById("scanner-result-box").classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
      return;
    }

    document.getElementById("doc-classification-title").innerText = data.document_classification;
    document.getElementById("doc-rec-service").innerText = data.recommended_service_type;
    document.getElementById("doc-summary-text").innerText = data.summary;
    document.getElementById("doc-action-text").innerText = data.recommended_immediate_action;

    const constBox = document.getElementById("doc-const-box");
    if (data.constitutional_context) {
      document.getElementById("doc-const-text").innerText = data.constitutional_context;
      constBox.classList.remove("hidden");
    } else {
      constBox.classList.add("hidden");
    }

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

// Constitution Explorer Logic
async function loadConstitutionData() {
  try {
    const artRes = await fetch("/api/constitution/articles");
    const artData = await artRes.json();
    allConstitutionArticles = artData.articles || [];

    const amdRes = await fetch("/api/constitution/amendments");
    const amdData = await amdRes.json();
    allConstitutionAmendments = amdData.amendments || [];

    renderConstitutionArticles(allConstitutionArticles);
    renderConstitutionAmendments(allConstitutionAmendments);
  } catch (e) {
    console.error("Constitution load error:", e);
  }
}

function setConstitutionSubTab(subtab) {
  activeConstitutionSubTab = subtab;
  const artBtn = document.getElementById("subtab-articles");
  const amdBtn = document.getElementById("subtab-amendments");
  const artView = document.getElementById("constitution-articles-view");
  const amdView = document.getElementById("constitution-amendments-view");

  if (subtab === "articles") {
    artBtn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-brand-900 text-white shadow-sm transition-all";
    amdBtn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all";
    artView.classList.remove("hidden");
    amdView.classList.add("hidden");
  } else {
    amdBtn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-brand-900 text-white shadow-sm transition-all";
    artBtn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all";
    amdView.classList.remove("hidden");
    artView.classList.add("hidden");
  }
  if (window.lucide) lucide.createIcons();
}

function filterConstitutionContent() {
  const query = document.getElementById("constitution-search-input").value.trim().toLowerCase();
  
  const filteredArticles = allConstitutionArticles.filter(a => 
    a.article.toLowerCase().includes(query) ||
    a.title.toLowerCase().includes(query) ||
    a.description.toLowerCase().includes(query) ||
    a.relevance.toLowerCase().includes(query)
  );

  const filteredAmendments = allConstitutionAmendments.filter(amd => 
    String(amd.number).includes(query) ||
    amd.title.toLowerCase().includes(query) ||
    amd.act.toLowerCase().includes(query) ||
    amd.summary.toLowerCase().includes(query) ||
    amd.year.toLowerCase().includes(query)
  );

  renderConstitutionArticles(filteredArticles);
  renderConstitutionAmendments(filteredAmendments);
}

function renderConstitutionArticles(articles) {
  const container = document.getElementById("constitution-articles-view");
  if (!container) return;

  if (articles.length === 0) {
    container.innerHTML = `<div class="col-span-2 text-center text-slate-500 py-8">No matching Constitutional Articles found.</div>`;
    return;
  }

  container.innerHTML = articles.map(a => `
    <div class="bg-white rounded-xl p-4 border border-slate-200 space-y-2 hover:shadow-md transition-all">
      <div class="flex items-center justify-between">
        <span class="bg-blue-100 text-brand-900 font-extrabold px-2.5 py-0.5 rounded text-xs">${a.article}</span>
        <span class="text-[10px] text-slate-400 font-semibold">${a.part}</span>
      </div>
      <h4 class="text-sm font-bold text-slate-900">${a.title}</h4>
      <p class="text-xs text-slate-600 leading-relaxed">${a.description}</p>
      <div class="bg-amber-50 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-amber-900">
        <strong>Relevance to Citizen Justice:</strong> ${a.relevance}
      </div>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

function renderConstitutionAmendments(amendments) {
  const container = document.getElementById("constitution-amendments-view");
  if (!container) return;

  if (amendments.length === 0) {
    container.innerHTML = `<div class="col-span-2 text-center text-slate-500 py-8">No matching Amendment Acts found.</div>`;
    return;
  }

  container.innerHTML = amendments.map(amd => `
    <div class="bg-white rounded-xl p-4 border border-slate-200 space-y-2 hover:shadow-md transition-all">
      <div class="flex items-center justify-between">
        <span class="bg-amber-100 text-amber-900 font-black px-2.5 py-0.5 rounded text-xs">${amd.number}th Amendment Act (${amd.year})</span>
        <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Enacted Law</span>
      </div>
      <h4 class="text-sm font-bold text-slate-900">${amd.title}</h4>
      <p class="text-xs text-slate-600 leading-relaxed">${amd.summary}</p>
      <div class="bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-[11px] text-blue-900">
        <strong>Democratic & Judicial Impact:</strong> ${amd.impact}
      </div>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

function inspectArticle(articleNumber) {
  switchTab("constitution");
  setConstitutionSubTab("articles");
  document.getElementById("constitution-search-input").value = articleNumber;
  filterConstitutionContent();
}

// Lawyers Directory (SCAORA & Nyaya Bandhu) Logic
async function loadLawyersDirectory() {
  try {
    const res = await fetch("/api/lawyers/directory");
    const data = await res.json();
    allDirectoryLawyers = data.lawyers || [];
    renderLawyersDirectory(allDirectoryLawyers);
  } catch (e) {
    console.error("Directory fetch error:", e);
  }
}

function filterLawyersDirectory() {
  const query = document.getElementById("directory-search-input").value.trim().toLowerCase();
  const network = document.getElementById("directory-network-filter").value;
  const domain = document.getElementById("directory-domain-filter").value;

  const filtered = allDirectoryLawyers.filter(p => {
    if (network !== "all") {
      if (network === "scaora" && !p.affiliation.includes("SCAORA")) return false;
      if (network === "nyaya_bandhu" && !p.affiliation.includes("Nyaya Bandhu")) return false;
      if (network === "legal_aid" && p.fee_per_consultation > 0) return false;
    }
    if (domain !== "all") {
      if (!p.domains.some(d => d.toLowerCase().includes(domain.toLowerCase()))) return false;
    }
    if (query) {
      const match = p.name.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.state.toLowerCase().includes(query) ||
        p.bar_council_id.toLowerCase().includes(query) ||
        p.domains.some(d => d.toLowerCase().includes(query));
      if (!match) return false;
    }
    return true;
  });

  renderLawyersDirectory(filtered);
}

function renderLawyersDirectory(lawyers) {
  const container = document.getElementById("lawyers-directory-grid");
  if (!container) return;

  if (lawyers.length === 0) {
    container.innerHTML = `<div class="col-span-3 text-center text-slate-500 py-8">No lawyers matching the selected filters.</div>`;
    return;
  }

  container.innerHTML = lawyers.map(p => {
    let tagHtml = "";
    if (p.affiliation && p.affiliation.includes("SCAORA")) {
      tagHtml = `<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">⚖️ SCAORA AOR</span>`;
    } else if (p.affiliation && p.affiliation.includes("Nyaya Bandhu")) {
      tagHtml = `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">🏛️ DOJ Pro Bono Panel</span>`;
    } else {
      tagHtml = `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Verified Counsel</span>`;
    }

    return `
      <div class="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center space-x-2.5">
              <img src="${p.avatar_url || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150'}" alt="${p.name}" class="w-10 h-10 rounded-xl object-cover border border-slate-300">
              <div>
                <h4 class="text-xs font-black text-slate-900">${p.name}</h4>
                <p class="text-[10px] text-slate-500 font-mono font-semibold">${p.bar_council_id}</p>
              </div>
            </div>
            ${tagHtml}
          </div>

          <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">${p.bio}</p>

          <div class="flex flex-wrap gap-1 text-[10px]">
            ${p.domains.slice(0, 2).map(d => `<span class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">${d}</span>`).join('')}
          </div>

          <div class="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-medium">
            <span>📍 ${p.city}, ${p.state}</span>
            <span>⭐ ${p.rating} (${p.total_reviews})</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div>
            <span class="text-[9px] text-slate-400 block font-semibold">Fee:</span>
            <span class="font-extrabold ${p.fee_per_consultation === 0 ? 'text-emerald-700' : 'text-slate-900'}">
              ${p.fee_per_consultation === 0 ? 'FREE (Pro Bono)' : '₹' + p.fee_per_consultation}
            </span>
          </div>
          <button onclick="openBookingModal('${p.id}')" class="bg-brand-900 hover:bg-brand-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
            Book
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
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
      body: JSON.stringify({ bar_council_id: barId, state: "India" })
    });
    const data = await res.json();

    resDiv.classList.remove("hidden");
    if (data.valid) {
      resDiv.className = "mt-2 p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-medium";
      resDiv.innerHTML = `
        <div class="flex items-center space-x-1.5 font-bold text-emerald-800">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
          <span>Official Registry Licensure Verified</span>
        </div>
        <p class="mt-1">Advocate: <strong>${data.advocate_name}</strong> • Affiliation/Bar: ${data.state_bar_council} • Disciplinary Record: ${data.disciplinary_actions}</p>
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
        "Property & Land (Art 300A)",
        "Family & Matrimonial (Art 15/39A)",
        "Consumer & Fraud (Art 19/39A)",
        "Labor & Employment (Art 23/323A)",
        "Cybercrime & UPI (Art 21)",
        "Rent & Tenancy (Art 300A)",
        "Criminal & Bail (Art 21/22)"
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
