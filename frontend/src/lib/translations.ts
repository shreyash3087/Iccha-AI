import type { SupportedLanguage } from "./livekit";

export interface LanguageContent {
  announcement: string;
  announcementSub: string;
  nav: {
    howItWorks: string;
    languages: string;
    pricing: string;
    resources: string;
    login: string;
    merchantDashboard: string;
    demoStore: string;
  };
  eyebrow: string;
  title1: string;
  titleHighlight: string;
  title2: string;
  subtitle: string;
  startCall: string;
  micRequired: string;
  stats: {
    languagesCount: string;
    languagesLabel: string;
    latencyCount: string;
    latencyLabel: string;
    speedCount: string;
    speedLabel: string;
    costCount: string;
    costLabel: string;
  };
  howItWorks: {
    kicker: string;
    heading: string;
    subhead: string;
    step1: {
      title: string;
      desc: string;
    };
    step2: {
      title: string;
      desc: string;
    };
    step3: {
      title: string;
      desc: string;
    };
  };
  cta: {
    kicker: string;
    heading: string;
    subhead: string;
    btn: string;
  };
  footer: {
    mission: string;
    status: string;
    product: string;
    languages: string;
    builtFor: string;
    rights: string;
    powered: string;
  };
}

export const HOME_TRANSLATIONS: Record<SupportedLanguage, LanguageContent> = {
  "hi-en": {
    announcement: "ICCHA AI अब लाइव है — भारत की हर लोकल दुकान को वॉइस से ऑनलाइन लाइए।",
    announcementSub: "Build for Bharat.",
    nav: {
      howItWorks: "How it works",
      languages: "10+ Languages",
      pricing: "Pricing",
      resources: "Resources",
      login: "Login",
      merchantDashboard: "Merchant Dashboard",
      demoStore: "Demo Storefront",
    },
    eyebrow: "AI for Bharat · 10 भारतीय भाषाओं में उपलब्ध",
    title1: "अपनी दुकान की",
    titleHighlight: "वेबसाइट",
    title2: "बस बोलकर बनाएं",
    subtitle: "अपनी दुकान का नाम, सामान और समय बोलिए — ICCHA AI आपके लिए एक पूरी डिजिटल स्टोर वेबसाइट तैयार कर देगा।",
    startCall: "Start call",
    micRequired: "माइक की अनुमति जरूरी है · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 भारतीय भाषाएं",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms अल्ट्रा-फास्ट",
      speedCount: "90s",
      speedLabel: "Voice to Live Website",
      costCount: "₹0",
      costLabel: "100% Free For Local Shops",
    },
    howItWorks: {
      kicker: "UNIFIED PLATFORM",
      heading: "One platform for all your voice storefronts.",
      subhead: "Orchestration, real-time voice processing, and automated catalog curation built for scale.",
      step1: {
        title: "Build, test, and deploy in minutes, simply by speaking.",
        desc: "Tell ICCHA your shop name, opening hours, and catalog items in Hindi, Marathi, Tamil, or your native dialect. ICCHA listens, understands regional accents, and configures your storefront in real time.",
      },
      step2: {
        title: "AI auto-crafts your complete catalog & brand.",
        desc: "ICCHA matches spoken items with royalty-free high-resolution photography, formats clean pricing tables, and syncs your Google Maps reviews seamlessly.",
      },
      step3: {
        title: "Instant WhatsApp link & printable counter QR standee.",
        desc: "Get an instant mobile-optimized link to share with customers on WhatsApp, along with a printable QR standee for your billing desk so walk-ins can browse effortlessly.",
      },
    },
    cta: {
      kicker: "GET YOUR SHOP ONLINE TODAY",
      heading: "Build your store in 90 seconds. Just speak.",
      subhead: "No typing, no design skills, zero English required. Free forever for local Indian merchants.",
      btn: "Start Call",
    },
    footer: {
      mission: "Empowering India's 60M+ local merchants, dhabas, kirana stores, and artisans to build a digital presence using voice AI.",
      status: "LiveKit Voice Engine Operational",
      product: "Product",
      languages: "10 Indian Languages",
      builtFor: "Built For Bharat",
      rights: "© 2026 ICCHA AI. Made with ❤️ for Bharat.",
      powered: "Powered by LiveKit · Voice Website Generator",
    },
  },

  hi: {
    announcement: "ICCHA AI अब लाइव है — भारत के हर व्यापारी के लिए आवाज़ की ताक़त।",
    announcementSub: "भारत के लिए समर्पित।",
    nav: {
      howItWorks: "यह कैसे काम करता है",
      languages: "10 भाषाएं",
      pricing: "मूल्य",
      resources: "संसाधन",
      login: "लॉगिन",
      merchantDashboard: "व्यापारी डैशबोर्ड",
      demoStore: "डेमो दुकान",
    },
    eyebrow: "भारत के व्यापारियों के लिए AI · 10 भाषाओं में उपलब्ध",
    title1: "अपनी दुकान की",
    titleHighlight: "डिजिटल वेबसाइट",
    title2: "सिर्फ बोलकर बनाएं",
    subtitle: "अपनी दुकान का नाम, सामान और समय बताइए — ICCHA AI आपके लिए एक पूरी वेबसाइट कुछ ही सेकंडों में तैयार कर देगा।",
    startCall: "कॉल शुरू करें",
    micRequired: "माइक की अनुमति आवश्यक है · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 भारतीय भाषाएं",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms तेज़ आवाज़",
      speedCount: "90s",
      speedLabel: "बोलकर 90 सेकंड में वेबसाइट",
      costCount: "₹0",
      costLabel: "व्यापारियों के लिए 100% मुफ़्त",
    },
    howItWorks: {
      kicker: "संपूर्ण प्लेटफ़ॉर्म",
      heading: "आपकी डिजिटल दुकान के लिए एक संपूर्ण प्लेटफ़ॉर्म।",
      subhead: "रीयल-टाइम आवाज़ पहचान, ऑटो-कैटलॉग और तुरंत व्हाट्सएप-रेडी वेबसाइट — भारतीय व्यापारियों के लिए।",
      step1: {
        title: "बस बोलकर कुछ ही मिनटों में बनाएं और लाइव करें।",
        desc: "अपनी मातृभाषा में दुकान का नाम, समय और मेनू बताइए। ICCHA आपकी आवाज़ सुनकर तुरंत पूरी डिजिटल प्रोफ़ाइल तैयार कर देता है।",
      },
      step2: {
        title: "AI अपने आप आपका पूरा कैटलॉग और ब्रांडिंग तैयार करता है।",
        desc: "ICCHA आपके बोले गए सामान के लिए बेहतरीन फोटो खोजता है, सही दाम लिखता है और Google Maps रेटिंग जोड़ता है।",
      },
      step3: {
        title: "तुरंत व्हाट्सएप शेयर लिंक और काउंटर के लिए QR स्टैंडी।",
        desc: "व्हाट्सएप पर शेयर करने के लिए डायरेक्ट लिंक पाएं और दुकान के काउंटर के लिए सुंदर QR स्टैंडी डाउनलोड करें ताकि ग्राहक सीधे ऑर्डर कर सकें।",
      },
    },
    cta: {
      kicker: "आज ही अपनी दुकान ऑनलाइन लाएं",
      heading: "सिर्फ 90 सेकंड में अपनी दुकान बनाएं। बस बोलिए।",
      subhead: "टाइपिंग की कोई जरूरत नहीं। शून्य अंग्रेज़ी बाधा। भारतीय व्यापारियों के लिए हमेशा मुफ़्त।",
      btn: "कॉल शुरू करें",
    },
    footer: {
      mission: "भारत के 6 करोड़ से अधिक व्यापारियों, किराना दुकानों और रेस्टोरेंट्स को आवाज़ की ताक़त से डिजिटल बनाने का मिशन।",
      status: "LiveKit वॉइस इंजन सक्रिय",
      product: "उत्पाद",
      languages: "10 भारतीय भाषाएं",
      builtFor: "भारत के लिए समर्पित",
      rights: "© 2026 ICCHA AI. भारत के लिए सप्रेम निर्मित।",
      powered: "LiveKit द्वारा संचालित · डिजिटल दुकान जनरेटर",
    },
  },

  en: {
    announcement: "ICCHA AI is now live — Empowering local merchants with the power of voice.",
    announcementSub: "Built for Bharat.",
    nav: {
      howItWorks: "How it works",
      languages: "10+ Languages",
      pricing: "Pricing",
      resources: "Resources",
      login: "Login",
      merchantDashboard: "Merchant Dashboard",
      demoStore: "Demo Storefront",
    },
    eyebrow: "AI for Bharat · Available in 10 Indian Languages",
    title1: "Build Your Shop",
    titleHighlight: "Website",
    title2: "By Just Speaking",
    subtitle: "Speak your shop name, catalog items, and business hours — ICCHA AI will craft a complete digital storefront for you in seconds.",
    startCall: "Start call",
    micRequired: "Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 Indian Languages",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms Ultra-low Latency",
      speedCount: "90s",
      speedLabel: "Voice to Live Website",
      costCount: "₹0",
      costLabel: "100% Free For Local Shops",
    },
    howItWorks: {
      kicker: "UNIFIED PLATFORM",
      heading: "One platform for all your voice storefronts.",
      subhead: "Orchestration, real-time voice processing, and automated catalog curation built for scale.",
      step1: {
        title: "Build, test, and deploy in minutes, simply by speaking.",
        desc: "Tell ICCHA your shop name, opening hours, and catalog items in your mother tongue. ICCHA listens, understands regional accents, and configures your storefront in real time.",
      },
      step2: {
        title: "AI auto-crafts your complete catalog & brand.",
        desc: "ICCHA matches spoken items with royalty-free high-resolution photography, formats clean pricing tables, and syncs your Google Maps reviews seamlessly.",
      },
      step3: {
        title: "Instant WhatsApp link & printable counter QR standee.",
        desc: "Get an instant mobile-optimized link to share with customers on WhatsApp, along with a printable QR standee for your billing desk so walk-ins can browse effortlessly.",
      },
    },
    cta: {
      kicker: "GET YOUR SHOP ONLINE TODAY",
      heading: "Build your store in 90 seconds. Just speak.",
      subhead: "No typing, no design skills, zero English required. Free forever for local Indian merchants.",
      btn: "Start call",
    },
    footer: {
      mission: "Empowering India's 60M+ local merchants, dhabas, kirana stores, and artisans to build a digital presence using voice AI.",
      status: "LiveKit Voice Engine Operational",
      product: "Product",
      languages: "10 Indian Languages",
      builtFor: "Built For Bharat",
      rights: "© 2026 ICCHA AI. Made with ❤️ for Bharat.",
      powered: "Powered by LiveKit · Voice Website Generator",
    },
  },

  mr: {
    announcement: "ICCHA AI आता लाईव्ह आहे — प्रत्येक स्थानिक दुकानाला आवाजाच्या सामर्थ्याने ऑनलाइन आणा.",
    announcementSub: "भारतासाठी समर्पित.",
    nav: {
      howItWorks: "हे कसे कार्य करते",
      languages: "10 भाषा",
      pricing: "दर",
      resources: "संसाधने",
      login: "लॉगिन",
      merchantDashboard: "व्यापारी डॅशबोर्ड",
      demoStore: "डेमो स्टोअर",
    },
    eyebrow: "भारतीय व्यापाऱ्यांसाठी AI · 10 भाषांमध्ये उपलब्ध",
    title1: "तुमच्या दुकानाची",
    titleHighlight: "वेबसाइट",
    title2: "फक्त बोलून तयार करा",
    subtitle: "तुमच्या दुकानाचे नाव, वस्तू आणि वेळ सांगा — ICCHA AI तुमच्यासाठी संपूर्ण डिजिटल स्टोअर वेबसाइट तयार करेल.",
    startCall: "कॉल सुरू करा",
    micRequired: "माइकची परवानगी आवश्यक आहे · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 भारतीय भाषा",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms अतिजलद आवाज",
      speedCount: "90s",
      speedLabel: "90 सेकंदात लाईव्ह वेबसाइट",
      costCount: "₹0",
      costLabel: "स्थानिक दुकानांसाठी 100% मोफत",
    },
    howItWorks: {
      kicker: "युनिफाइड प्लॅटफॉर्म",
      heading: "तुमच्या डिजिटल स्टोअरसाठी एक संपूर्ण प्लॅटफॉर्म.",
      subhead: "रिअल-टाइम व्हॉइस प्रोसेसिंग आणि स्वयंचलित कॅटलॉग — भारतीय स्थानिक व्यापाऱ्यांसाठी.",
      step1: {
        title: "फक्त बोलून काही मिनिटांत तयार करा आणि लाईव्ह व्हा.",
        desc: "तुमच्या मातृभाषेत दुकानाचे नाव, कामाचे तास आणि मेनू सांगा. ICCHA तुमचे ऐकते आणि तत्काळ संपूर्ण डिजिटल प्रोफाईल बनवते.",
      },
      step2: {
        title: "AI स्वयंचलितपणे संपूर्ण कॅटलॉग आणि ब्रँडिंग तयार करते.",
        desc: "ICCHA तुमच्या उत्पादनांसाठी उच्च दर्जाची छायाचित्रे जोडते, दरपत्रक व्यवस्थित करते आणि Google Maps रेटिंग लिंक करते.",
      },
      step3: {
        title: "त्वरित व्हॉट्सअॅप लिंक आणि काउंटरसाठी QR स्टँडी.",
        desc: "ग्राहकांना पाठवण्यासाठी त्वरित व्हॉट्सअॅप लिंक मिळवा आणि काउंटरवर लावण्यासाठी आकर्षक QR स्टँडी डाउनलोड करा.",
      },
    },
    cta: {
      kicker: "आजच तुमचे दुकान ऑनलाइन आणा",
      heading: "90 सेकंदात तुमचे स्टोअर तयार करा. फक्त बोला.",
      subhead: "टायपिंगची गरज नाही. शून्य इंग्रजी अडथळा. भारतीय व्यापाऱ्यांसाठी कायम मोफत.",
      btn: "कॉल सुरू करा",
    },
    footer: {
      mission: "भारतातील 6 कोटींहून अधिक स्थानिक व्यापाऱ्यांना व्हॉइस AI च्या साहाय्याने डिजिटल बनवण्याचे ध्येय.",
      status: "LiveKit व्हॉइस इंजिन कार्यरत",
      product: "उत्पादन",
      languages: "10 भारतीय भाषा",
      builtFor: "भारतासाठी निर्मित",
      rights: "© 2026 ICCHA AI. भारतासाठी प्रेमाने निर्मित.",
      powered: "LiveKit द्वारे समर्थित · व्हॉइस वेबसाइट जनरेटर",
    },
  },

  ta: {
    announcement: "ICCHA AI நேரலையில் உள்ளது — உள்ளூர் கடைகளை குரல் வழி ஆன்லைனில் கொண்டு வாருங்கள்.",
    announcementSub: "பாரதத்திற்காக உருவாக்கப்பட்டது.",
    nav: {
      howItWorks: "எப்படி செயல்படுகிறது",
      languages: "10 மொழிகள்",
      pricing: "விலை",
      resources: "வளங்கள்",
      login: "உள்நுழைவு",
      merchantDashboard: "வணிகர் பலகை",
      demoStore: "மாதிரி கடை",
    },
    eyebrow: "இந்திய வணிகர்களுக்கான AI · 10 மொழிகளில் கிடைக்கும்",
    title1: "உங்கள் கடையின்",
    titleHighlight: "வலைத்தளத்தை",
    title2: "பேசியே உருவாக்குங்கள்",
    subtitle: "உங்கள் கடையின் பெயர், பொருட்கள் மற்றும் நேரத்தைச் சொல்லுங்கள் — ICCHA AI முழுமையான டிஜிட்டல் வலைத்தளத்தை உருவாக்கும்.",
    startCall: "கால் தொடங்கவும்",
    micRequired: "மைக் அனுமதி தேவை · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 இந்திய மொழிகள்",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms அதிவேக குரல்",
      speedCount: "90s",
      speedLabel: "90 வினாடிகளில் நேரலை தளம்",
      costCount: "₹0",
      costLabel: "உள்ளூர் கடைகளுக்கு 100% இலவசம்",
    },
    howItWorks: {
      kicker: "முழுமையான தளம்",
      heading: "உங்கள் டிஜிட்டல் கடைக்கான முழுமையான தளம்.",
      subhead: "நிகழ்நேர குரல் செயலாக்கம் மற்றும் தானியங்கி பட்டியல் உருவாக்கம் — இந்திய வணிகர்களுக்காக.",
      step1: {
        title: "பேசியே சில நிமிடங்களில் உருவாக்குங்கள்.",
        desc: "உங்கள் தாய்மொழியில் கடை பெயர், நேரம் மற்றும் பொருட்களை சொல்லுங்கள். ICCHA கேட்டு உடனே முழு வலைத்தளத்தை அமைக்கிறது.",
      },
      step2: {
        title: "AI தானாகவே முழு பட்டியல் மற்றும் பிராண்டிங் உருவாக்குகிறது.",
        desc: "ICCHA சிறந்த புகைப்படங்களை சேர்க்கிறது, விலைப்பட்டியலை அமைக்கிறது மற்றும் Google Maps மதிப்பீட்டை இணைக்கிறது.",
      },
      step3: {
        title: "உடனடி வாட்ஸ்அப் இணைப்பு மற்றும் QR ஸ்டாண்டி.",
        desc: "வாடிக்கையாளர்களுக்கு பகிர வாட்ஸ்அப் இணைப்பையும், மேஜையில் வைக்க QR ஸ்டாண்டியையும் உடனடியாகப் பெறுங்கள்.",
      },
    },
    cta: {
      kicker: "இன்றே உங்கள் கடையை ஆன்லைனில் கொண்டு வாருங்கள்",
      heading: "90 வினாடிகளில் உங்கள் கடையை உருவாக்குங்கள். பேசுங்கள்.",
      subhead: "தட்டச்சு தேவையில்லை. ஆங்கில தடை இல்லை. இந்திய வணிகர்களுக்கு எப்போதும் இலவசம்.",
      btn: "கால் தொடங்கவும்",
    },
    footer: {
      mission: "இந்தியாவின் 6 கோடிக்கும் மேற்பட்ட உள்ளூர் வணிகர்களை குரல் AI மூலம் டிஜிட்டல் மயமாக்கும் முயற்சி.",
      status: "LiveKit குரல் இயந்திரம் செயல்பாட்டில் உள்ளது",
      product: "தயாரிப்பு",
      languages: "10 இந்திய மொழிகள்",
      builtFor: "பாரதத்திற்காக",
      rights: "© 2026 ICCHA AI. பாரதத்திற்காக அன்புடன் உருவாக்கப்பட்டது.",
      powered: "LiveKit ஆதரவுடன் · வாய்ஸ் வலைத்தள ஜெனரேட்டர்",
    },
  },

  te: {
    announcement: "ICCHA AI ప్రత్యక్షంగా అందుబాటులో ఉంది — మీ స్థానిక దుకాణాన్ని వాయిస్‌తో ఆన్‌లైన్‌కి తీసుకురండి.",
    announcementSub: "భారత్ కోసం రూపొందించబడింది.",
    nav: {
      howItWorks: "ఇది ఎలా పనిచేస్తుంది",
      languages: "10 భాషలు",
      pricing: "ధరలు",
      resources: "వనరులు",
      login: "లాగిన్",
      merchantDashboard: "వ్యాపారి డ్యాష్‌బోర్డ్",
      demoStore: "డెమో స్టోర్",
    },
    eyebrow: "భారతీయ వ్యాపారుల కోసం AI · 10 భాషల్లో లభ్యం",
    title1: "మీ దుకాణం",
    titleHighlight: "వెబ్‌సైట్‌ను",
    title2: "కేవలం మాట్లాడి తయారు చేయండి",
    subtitle: "మీ దుకాణం పేరు, సరుకులు మరియు సమయం చెప్పండి — ICCHA AI మీ కోసం పూర్తి డిజిటల్ స్టోర్ వెబ్‌సైట్ సిద్ధం చేస్తుంది.",
    startCall: "కాల్ ప్రారంభించండి",
    micRequired: "మైక్రోఫోన్ అనుమతి అవసరం · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 భారతీయ భాషలు",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms సూపర్ ఫాస్ట్",
      speedCount: "90s",
      speedLabel: "90 సెకన్లలో లైవ్ వెబ్‌సైట్",
      costCount: "₹0",
      costLabel: "స్థానిక షాపుల కోసం 100% ఉచితం",
    },
    howItWorks: {
      kicker: "ఏకీకృత ప్లాట్‌ఫారమ్",
      heading: "మీ డిజిటల్ దుకాణం కోసం సమగ్ర ప్లాట్‌ఫారమ్.",
      subhead: "రియల్ టైమ్ వాయిస్ ప్రాసెసింగ్ మరియు ఆటోమేటెడ్ కేటలాగ్ క్రియేషన్ — భారతీయ వ్యాపారుల కోసం.",
      step1: {
        title: "మాట్లాడి కొద్ది నిమిషాల్లోనే ప్రారంభించండి.",
        desc: "మీ మాతృభాషలో దుకాణం పేరు, వేళలు మరియు వస్తువులను చెప్పండి. ICCHA విని తక్షణమే పూర్తి డిజిటల్ ప్రొఫైల్‌ను రూపొందిస్తుంది.",
      },
      step2: {
        title: "AI స్వయంచాలకంగా పూర్తి కేటలాగ్ మరియు బ్రాండింగ్‌ను రూపొందిస్తుంది.",
        desc: "ICCHA మీ వస్తువుల కోసం అందమైన ఫోటోలను జోడిస్తుంది, ధరల పట్టికను సర్దుబాటు చేస్తుంది మరియు Google Maps రేటింగ్‌ను అనుసంధానిస్తుంది.",
      },
      step3: {
        title: "తక్షణ వాట్సాప్ లింక్ మరియు కౌంటర్ QR స్టాండీ.",
        desc: "కస్టమర్లకు షేర్ చేయడానికి డైరెక్ట్ వాట్సాప్ లింక్ మరియు బిల్లింగ్ డెస్క్ కోసం ప్రింట్ చేయదగిన QR స్టాండీని పొందండి.",
      },
    },
    cta: {
      kicker: "ఈరోజే మీ దుకాణాన్ని ఆన్‌లైన్‌లోకి తీసుకురండి",
      heading: "90 సెకన్లలో మీ స్టోర్‌ను నిర్మించండి. మాట్లాడండి చాలు.",
      subhead: "టైపింగ్ అవసరం లేదు. ఇంగ్లీష్ రాకపోయినా పర్వాలేదు. భారతీయ వ్యాపారులకు ఎల్లప్పుడూ ఉచితం.",
      btn: "కాల్ ప్రారంభించండి",
    },
    footer: {
      mission: "వాయిస్ AI ద్వారా భారతదేశంలోని 6 కోట్ల మందికి పైగా స్థానిక వ్యాపారులను డిజిటల్‌గా మార్చడమే మా లక్ష్యం.",
      status: "LiveKit వాయిస్ ఇంజిన్ పనిచేస్తోంది",
      product: "ఉత్పత్తి",
      languages: "10 భారతీయ భాషలు",
      builtFor: "భారత్ కోసం",
      rights: "© 2026 ICCHA AI. భారత్ కోసం ప్రేమతో తయారు చేయబడింది.",
      powered: "LiveKit ఆధారితం · వాయిస్ వెబ్‌సైట్ జనరేటర్",
    },
  },

  kn: {
    announcement: "ICCHA AI ಈಗ ಲೈವ್ ಆಗಿದೆ — ನಿಮ್ಮ ಸ್ಥಳೀಯ ಅಂಗಡಿಯನ್ನು ಧ್ವನಿಯ ಮೂಲಕ ಆನ್‌ಲೈನ್‌ಗೆ ತನ್ನಿ.",
    announcementSub: "ಭಾರತಕ್ಕಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.",
    nav: {
      howItWorks: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
      languages: "10 ಭಾಷೆಗಳು",
      pricing: "ದರಗಳು",
      resources: "ಸಂಪನ್ಮೂಲಗಳು",
      login: "ಲಾಗಿನ್",
      merchantDashboard: "ವ್ಯಾಪಾರಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      demoStore: "ಡೆಮೊ ಅಂಗಡಿ",
    },
    eyebrow: "ಭಾರತೀಯ ವ್ಯಾಪಾರಿಗಳಿಗಾಗಿ AI · 10 ಭಾಷೆಗಳಲ್ಲಿ ಲಭ್ಯ",
    title1: "ನಿಮ್ಮ ಅಂಗಡಿಯ",
    titleHighlight: "ವೆಬ್‌ಸೈಟ್",
    title2: "ಕೇವಲ ಮಾತನಾಡಿ ರಚಿಸಿ",
    subtitle: "ನಿಮ್ಮ ಅಂಗಡಿಯ ಹೆಸರು, ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಸಮಯ ಹೇಳಿ — ICCHA AI ನಿಮಗಾಗಿ ಸಂಪೂರ್ಣ ವೆಬ್‌ಸೈಟ್ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.",
    startCall: "ಕಾಲ್ ಪ್ರಾರಂಭಿಸಿ",
    micRequired: "ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 ಭಾರತೀಯ ಭಾಷೆಗಳು",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms ಅಲ್ಟ್ರಾ-ಫಾಸ್ಟ್ ಧ್ವನಿ",
      speedCount: "90s",
      speedLabel: "90 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಲೈವ್ ವೆಬ್‌ಸೈಟ್",
      costCount: "₹0",
      costLabel: "ಸ್ಥಳೀಯ ಅಂಗಡಿಗಳಿಗೆ 100% ಉಚಿತ",
    },
    howItWorks: {
      kicker: "ಸಮಗ್ರ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್",
      heading: "ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಅಂಗಡಿಗೆ ಒಂದು ಸಂಪೂರ್ಣ ವೇದಿಕೆ.",
      subhead: "ರಿಯಲ್-ಟೈಮ್ ಧ್ವನಿ ಸಂಸ್ಕರಣೆ ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಕ್ಯಾಟಲಾಗ್ — ಭಾರತೀಯ ವ್ಯಾಪಾರಿಗಳಿಗಾಗಿ.",
      step1: {
        title: "ಕೇವಲ ಮಾತನಾಡಿ ಕೆಲವೇ ನಿಮಿಷಗಳಲ್ಲಿ ಸಿದ್ಧಪಡಿಸಿ.",
        desc: "ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಅಂಗಡಿಯ ಹೆಸರು, ಸಮಯ ಮತ್ತು ಉತ್ಪನ್ನಗಳನ್ನು ತಿಳಿಸಿ. ICCHA ಕೇಳಿಸಿಕೊಂಡು ತಕ್ಷಣವೇ ವೆಬ್‌ಸೈಟ್ ರೂಪಿಸುತ್ತದೆ.",
      },
      step2: {
        title: "AI ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕ್ಯಾಟಲಾಗ್ ಮತ್ತು ಬ್ರ್ಯಾಂಡಿಂಗ್ ನಿರ್ಮಿಸುತ್ತದೆ.",
        desc: "ICCHA ನಿಮ್ಮ ಉತ್ಪನ್ನಗಳಿಗೆ ಉತ್ತಮ ಫೋಟೋಗಳನ್ನು ಹುಡುಕುತ್ತದೆ, ಬೆಲೆ ಪಟ್ಟಿಯನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತದೆ ಮತ್ತು Google Maps ರೇಟಿಂಗ್ ಜೋಡಿಸುತ್ತದೆ.",
      },
      step3: {
        title: "ತಕ್ಷಣದ ವಾಟ್ಸಾಪ್ ಲಿಂಕ್ ಮತ್ತು ಕೌಂಟರ್ QR ಸ್ಟ್ಯಾಂಡಿ.",
        desc: "ಗ್ರಾಹಕರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲು ವಾಟ್ಸಾಪ್ ಲಿಂಕ್ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್ ಡೆಸ್ಕ್‌ಗಾಗಿ ಪ್ರಿಂಟ್ ಮಾಡಬಹುದಾದ QR ಸ್ಟ್ಯಾಂಡಿ ಪಡೆಯಿರಿ.",
      },
    },
    cta: {
      kicker: "ಇಂದೇ ನಿಮ್ಮ ಅಂಗಡಿಯನ್ನು ಆನ್‌ಲೈನ್‌ಗೆ ತನ್ನಿ",
      heading: "90 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ನಿರ್ಮಿಸಿ. ಮಾತನಾಡಿ ಸಾಕು.",
      subhead: "ಟೈಪಿಂಗ್ ಅಗತ್ಯವಿಲ್ಲ. ಇಂಗ್ಲಿಷ್ ಅಡೆತಡೆ ಇಲ್ಲ. ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಿಗಳಿಗೆ ಸದಾ ಉಚಿತ.",
      btn: "ಕಾಲ್ ಪ್ರಾರಂಭಿಸಿ",
    },
    footer: {
      mission: "ಧ್ವನಿ AI ಮೂಲಕ ಭಾರತದ 6 ಕೋಟಿಗೂ ಹೆಚ್ಚು ಸ್ಥಳೀಯ ಅಂಗಡಿ ಮಾಲೀಕರನ್ನು ಡಿಜಿಟಲ್ ಆಗಿ ಸಶಕ್ತಗೊಳಿಸುವ ಗುರಿ.",
      status: "LiveKit ಧ್ವನಿ ಎಂಜಿನ್ ಸಕ್ರಿಯವಾಗಿದೆ",
      product: "ಉತ್ಪನ್ನ",
      languages: "10 ಭಾರತೀಯ ಭಾಷೆಗಳು",
      builtFor: "ಭಾರತಕ್ಕಾಗಿ",
      rights: "© 2026 ICCHA AI. ಭಾರತಕ್ಕಾಗಿ ಪ್ರೀತಿಯಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ.",
      powered: "LiveKit ಚಾಲಿತ · ವಾಯ್ಸ್ ವೆಬ್‌ಸೈಟ್ ಜನರೇಟರ್",
    },
  },

  gu: {
    announcement: "ICCHA AI હવે લાઈવ છે — તમારી સ્થાનિક દુકાનને અવાજની શક્તિથી ઓનલાઈન લાવો.",
    announcementSub: "ભારત માટે સમર્પિત.",
    nav: {
      howItWorks: "આ કેવી રીતે કામ કરે છે",
      languages: "10 ભાષાઓ",
      pricing: "કિંમતો",
      resources: "સાધનો",
      login: "લૉગિન",
      merchantDashboard: "વેપારી ડેશબોર્ડ",
      demoStore: "ડેમો દુકાન",
    },
    eyebrow: "ભારતીય વેપારીઓ માટે AI · 10 ભાષાઓમાં ઉપલબ્ધ",
    title1: "તમારી દુકાનની",
    titleHighlight: "વેબસાઇટ",
    title2: "માત્ર બોલીને બનાવો",
    subtitle: "તમારી દુકાનનું નામ, સામાન અને સમય બોલો — ICCHA AI તમારા માટે સંપૂર્ણ ડિજિટલ સ્ટોર વેબસાઇટ તૈયાર કરશે.",
    startCall: "કૉલ શરૂ કરો",
    micRequired: "માઇક્રોફોનની પરવાનગી જરૂરી છે · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 ભારતીય ભાષાઓ",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms અલ્ટ્રા-ફાસ્ટ અવાજ",
      speedCount: "90s",
      speedLabel: "90 સેકન્ડમાં લાઈવ વેબસાઇટ",
      costCount: "₹0",
      costLabel: "સ્થાનિક વેપારીઓ માટે 100% મફત",
    },
    howItWorks: {
      kicker: "સંપૂર્ણ પ્લેટફોર્મ",
      heading: "તમારી ડિજિટલ દુકાન માટે એક સંપૂર્ણ પ્લેટફોર્મ.",
      subhead: "રીયલ-ટાઇમ અવાજ ઓળખ અને ઓટોમેટેડ કેટલોગ — ભારતીય વેપારીઓ માટે.",
      step1: {
        title: "માત્ર બોલીને થોડી મિનિટોમાં તૈયાર કરો.",
        desc: "તમારી માતૃભાષામાં દુકાનનું નામ, સમય અને વસ્તુઓ જણાવો. ICCHA સાંભળીને તરત જ વેબસાઇટ રૂપરેખા બનાવી દેશે.",
      },
      step2: {
        title: "AI આપમેળે સંપૂર્ણ કેટલોગ અને બ્રાન્ડિંગ તૈયાર કરે છે.",
        desc: "ICCHA સુંદર ફોટાઓ મેળવે છે, વ્યવસ્થિત ભાવ પત્રક બનાવે છે અને Google Maps રેટિંગ ઉમેરે છે.",
      },
      step3: {
        title: "તરત વોટ્સએપ લિંક અને કાઉન્ટર QR સ્ટેન્ડી.",
        desc: "ગ્રાહકો સાથે શેર કરવા માટે વોટ્સએપ લિંક અને બિલિંગ કાઉન્ટર માટે પ્રિન્ટેબલ QR સ્ટેન્ડી મેળવો.",
      },
    },
    cta: {
      kicker: "આજે જ તમારી દુકાનને ઓનલાઈન લાવો",
      heading: "90 સેકન્ડમાં તમારી દુકાન બનાવો. માત્ર બોલો.",
      subhead: "ટાઇપિંગ કરવાની જરૂર નથી. અંગ્રેજીની કોઈ બાધા નથી. સ્થાનિક વેપારીઓ માટે હંમેશા મફત.",
      btn: "કૉલ શરૂ કરો",
    },
    footer: {
      mission: "ભારતના 6 કરોડથી વધુ સ્થાનિક વેપારીઓને અવાજ AI દ્વારા ડિજિટલ બનાવવાનું મિશન.",
      status: "LiveKit અવાજ એન્જિન કાર્યરત",
      product: "ઉત્પાદન",
      languages: "10 ભારતીય ભાષાઓ",
      builtFor: "ભારત માટે",
      rights: "© 2026 ICCHA AI. ભારત માટે પ્રેમથી નિર્મિત.",
      powered: "LiveKit દ્વારા સંચાલિત · વૉઇસ વેબસાઇટ જનરેટર",
    },
  },

  pa: {
    announcement: "ICCHA AI ਹੁਣ ਲਾਈਵ ਹੈ — ਆਪਣੀ ਲੋਕਲ ਦੁਕਾਨ ਨੂੰ ਆਵਾਜ਼ ਦੀ ਤਾਕਤ ਨਾਲ ਆਨਲਾਈਨ ਲਿਆਓ।",
    announcementSub: "ਭਾਰਤ ਲਈ ਸਮਰਪਿਤ।",
    nav: {
      howItWorks: "ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ",
      languages: "10 ਭਾਸ਼ਾਵਾਂ",
      pricing: "ਕੀਮਤਾਂ",
      resources: "ਸਾਧਨ",
      login: "ਲਾਗਇਨ",
      merchantDashboard: "ਵਪਾਰੀ ਡੈਸ਼ਬੋਰਡ",
      demoStore: "ਡੈਮੋ ਦੁਕਾਨ",
    },
    eyebrow: "ਭਾਰਤੀ ਵਪਾਰੀਆਂ ਲਈ AI · 10 ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਉਪਲਬਧ",
    title1: "ਆਪਣੀ ਦੁਕਾਨ ਦੀ",
    titleHighlight: "ਵੈੱਬਸਾਈਟ",
    title2: "ਸਿਰਫ਼ ਬੋਲ ਕੇ ਬਣਾਓ",
    subtitle: "ਆਪਣੀ ਦੁਕਾਨ ਦਾ ਨਾਮ, ਸਮਾਨ ਅਤੇ ਸਮਾਂ ਦੱਸੋ — ICCHA AI ਤੁਹਾਡੇ ਲਈ ਪੂਰੀ ਡਿਜੀਟਲ ਸਟੋਰ ਵੈੱਬਸਾਈਟ ਤਿਆਰ ਕਰੇਗਾ।",
    startCall: "ਕਾਲ ਸ਼ੁਰੂ ਕਰੋ",
    micRequired: "ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਲਾਜ਼ਮੀ ਹੈ · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "10 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms ਅਲਟਰਾ-ਫਾਸਟ",
      speedCount: "90s",
      speedLabel: "90 ਸਕਿੰਟਾਂ ਵਿੱਚ ਲਾਈਵ ਵੈੱਬਸਾਈਟ",
      costCount: "₹0",
      costLabel: "ਸਥਾਨਕ ਦੁਕਾਨਾਂ ਲਈ 100% ਮੁਫ਼ਤ",
    },
    howItWorks: {
      kicker: "ਸੰਪੂਰਨ ਪਲੇਟਫਾਰਮ",
      heading: "ਤੁਹਾਡੀ ਡਿਜੀਟਲ ਦੁਕਾਨ ਲਈ ਇੱਕ ਸੰਪੂਰਨ ਪਲੇਟਫਾਰਮ।",
      subhead: "ਰੀਅਲ-ਟਾਈਮ ਆਵਾਜ਼ ਪਛਾਣ ਅਤੇ ਆਟੋ-ਕੈਟਾਲਾਗ — ਭਾਰਤੀ ਵਪਾਰੀਆਂ ਲਈ ਵਿਸ਼ੇਸ਼।",
      step1: {
        title: "ਬਸ ਬੋਲ ਕੇ ਮਿੰਟਾਂ ਵਿੱਚ ਬਣਾਓ ਅਤੇ ਲਾਈਵ ਕਰੋ।",
        desc: "ਆਪਣੀ ਮਾਤ-ਭਾਸ਼ਾ ਵਿੱਚ ਦੁਕਾਨ ਦਾ ਨਾਮ, ਸਮਾਂ ਅਤੇ ਸਮਾਨ ਦੱਸੋ। ICCHA ਸੁਣ ਕੇ ਤੁਰੰਤ ਵੈੱਬਸਾਈਟ ਤਿਆਰ ਕਰ ਦੇਵੇਗਾ।",
      },
      step2: {
        title: "AI ਆਪਣੇ ਆਪ ਕੈਟਾਲਾਗ ਅਤੇ ਬ੍ਰਾਂਡਿੰਗ ਤਿਆਰ ਕਰਦਾ ਹੈ।",
        desc: "ICCHA ਵਧੀਆ ਫੋਟੋਆਂ ਜੋੜਦਾ ਹੈ, ਕੀਮਤ ਸੂਚੀ ਬਣਾਉਂਦਾ ਹੈ ਅਤੇ Google Maps ਰੇਟਿੰਗ ਲਿੰਕ ਕਰਦਾ ਹੈ।",
      },
      step3: {
        title: "ਤੁਰੰਤ ਵਟਸਐਪ ਲਿੰਕ ਅਤੇ ਕਾਊਂਟਰ QR ਸਟੈਂਡੀ।",
        desc: "ਗਾਹਕਾਂ ਨੂੰ ਭੇਜਣ ਲਈ ਵਟਸਐਪ ਲਿੰਕ ਅਤੇ ਬਿਲਿੰਗ ਕਾਊਂਟਰ ਲਈ ਪ੍ਰਿੰਟ ਕਰਨਯੋਗ QR ਸਟੈਂਡੀ ਪ੍ਰਾਪਤ ਕਰੋ।",
      },
    },
    cta: {
      kicker: "ਅੱਜ ਹੀ ਆਪਣੀ ਦੁਕਾਨ ਨੂੰ ਆਨਲਾਈਨ ਲਿਆਓ",
      heading: "90 ਸਕਿੰਟਾਂ ਵਿੱਚ ਆਪਣੀ ਦੁਕਾਨ ਬਣਾਓ। ਬਸ ਬੋਲੋ।",
      subhead: "ਟਾਈਪਿੰਗ ਦੀ ਲੋੜ ਨਹੀਂ। ਅੰਗਰੇਜ਼ੀ ਦੀ ਕੋਈ ਰੁਕਾਵਟ ਨਹੀਂ। ਭਾਰਤੀ ਦੁਕਾਨਦਾਰਾਂ ਲਈ ਹਮੇਸ਼ਾ ਮੁਫ਼ਤ।",
      btn: "ਕਾਲ ਸ਼ੁਰੂ ਕਰੋ",
    },
    footer: {
      mission: "ਵੌਇਸ AI ਰਾਹੀਂ ਭਾਰਤ ਦੇ 6 ਕਰੋੜ ਤੋਂ ਵੱਧ ਸਥਾਨਕ ਵਪਾਰੀਆਂ ਨੂੰ ਡਿਜੀਟਲ ਬਣਾਉਣ ਦਾ ਮਿਸ਼ਨ।",
      status: "LiveKit ਵੌਇਸ ਇੰਜਣ ਸਰਗਰਮ ਹੈ",
      product: "ਉਤਪਾਦ",
      languages: "10 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ",
      builtFor: "ਭਾਰਤ ਲਈ",
      rights: "© 2026 ICCHA AI. ਭਾਰਤ ਲਈ ਪਿਆਰ ਨਾਲ ਬਣਾਇਆ ਗਿਆ।",
      powered: "LiveKit ਦੁਆਰਾ ਸੰਚਾਲਿਤ · ਵੌਇਸ ਵੈੱਬਸਾਈਟ ਜਨਰੇਟਰ",
    },
  },

  bn: {
    announcement: "ICCHA AI এখন লাইভ — ভয়েসের শক্তিতে আপনার স্থানীয় দোকানকে অনলাইনে আনুন।",
    announcementSub: "ভারতের জন্য নির্মিত।",
    nav: {
      howItWorks: "এটি কীভাবে কাজ করে",
      languages: "১০টি ভাষা",
      pricing: "মূল্য",
      resources: "সম্পদ",
      login: "লগইন",
      merchantDashboard: "বণিক ড্যাশবোর্ড",
      demoStore: "ডেমো দোকান",
    },
    eyebrow: "ভারতীয় ব্যবসায়ীদের জন্য AI · ১০টি ভাষায় উপলব্ধ",
    title1: "আপনার দোকানের",
    titleHighlight: "ওয়েবসাইট",
    title2: "শুধুমাত্র বলে তৈরি করুন",
    subtitle: "আপনার দোকানের নাম, জিনিসপত্র এবং সময় বলুন — ICCHA AI আপনার জন্য একটি সম্পূর্ণ ডিজিটাল স্টোর ওয়েবসাইট তৈরি করে দেবে।",
    startCall: "কল শুরু করুন",
    micRequired: "মাইক্রোফোনের অনুমতি প্রয়োজন · Microphone permission required",
    stats: {
      languagesCount: "10+",
      languagesLabel: "১০টি ভারতীয় ভাষা",
      latencyCount: "< 500ms",
      latencyLabel: "< 500ms অতি দ্রুত ভয়েস",
      speedCount: "90s",
      speedLabel: "৯০ সেকেন্ডে লাইভ ওয়েবসাইট",
      costCount: "₹0",
      costLabel: "স্থানীয় দোকানের জন্য ১০০% বিনামূল্যে",
    },
    howItWorks: {
      kicker: "সম্পূর্ণ প্ল্যাটফর্ম",
      heading: "আপনার ডিজিটাল দোকানের জন্য একটি একক প্ল্যাটফর্ম।",
      subhead: "রিয়েল-টাইম ভয়েস প্রসেসিং এবং স্বয়ংক্রিয় ক্যাটালগ — ভারতীয় ব্যবসায়ীদের জন্য।",
      step1: {
        title: "শুধুমাত্র বলে কয়েক মিনিটে তৈরি এবং চালু করুন।",
        desc: "আপনার মাতৃভাষায় দোকানের নাম, সময় এবং পণ্যের বিবরণ দিন। ICCHA শুনে সাথে সাথে ডিজিটাল প্রোফাইল তৈরি করবে।",
      },
      step2: {
        title: "AI স্বয়ংক্রিয়ভাবে সম্পূর্ণ ক্যাটালগ ও ব্র্যান্ডিং তৈরি করে।",
        desc: "ICCHA পণ্যের জন্য সুন্দর ছবি যোগ করে, দামের তালিকা ঠিক করে এবং Google Maps রেটিং সংযুক্ত করে।",
      },
      step3: {
        title: "তাত্ক্ষণিক হোয়াটসঅ্যাপ লিঙ্ক এবং কাউন্টার QR স্ট্যান্ডি।",
        desc: "গ্রাহকদের পাঠানোর জন্য সরাসরি হোয়াটসঅ্যাপ লিঙ্ক এবং দোকানের কাউন্টারের জন্য প্রিন্টযোগ্য QR স্ট্যান্ডি পান।",
      },
    },
    cta: {
      kicker: "আজই আপনার দোকান অনলাইনে আনুন",
      heading: "৯০ সেকেন্ডে আপনার দোকান তৈরি করুন। শুধু বলুন।",
      subhead: "টাইপ করার কোনো প্রয়োজন নেই। কোনো ইংরেজি বাধা নেই। ভারতীয় ব্যবসায়ীদের জন্য চিরকাল বিনামূল্যে।",
      btn: "কল শুরু করুন",
    },
    footer: {
      mission: "ভয়েস AI এর মাধ্যমে ভারতের ৬ কোটিরও বেশি স্থানীয় ব্যবসায়ীকে ডিজিটাল করার লক্ষ্য।",
      status: "LiveKit ভয়েস ইঞ্জিন চালু রয়েছে",
      product: "পণ্য",
      languages: "১০টি ভারতীয় ভাষা",
      builtFor: "ভারতের জন্য",
      rights: "© 2026 ICCHA AI. ভারতের জন্য ভালোবেসে তৈরি।",
      powered: "LiveKit দ্বারা চালিত · ভয়েস ওয়েবসাইট জেনারেটর",
    },
  },
};
