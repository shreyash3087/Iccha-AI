"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppNavbar } from "@/components/AppNavbar";

const LOGIN_TEXT: Record<string, {
  kicker: string;
  title1: string;
  title2: string;
  subtitle: string;
  googleBtn: string;
  backBtn: string;
  footer: string;
}> = {
  en: {
    kicker: "AI FOR BHARAT · MERCHANT STUDIO",
    title1: "Manage your store.",
    title2: "Grow your business.",
    subtitle: "Sign in with Google to access your digital storefronts, edit catalogs with voice, and download printable QR standees.",
    googleBtn: "Continue with Google",
    backBtn: "Back to home",
    footer: "100% Free for Local Indian Merchants",
  },
  "hi-en": {
    kicker: "AI FOR BHARAT · MERCHANT STUDIO",
    title1: "अपनी दुकान संभालें।",
    title2: "बिज़नेस आगे बढ़ाएं।",
    subtitle: "Google से लॉगिन करें ताकि आप अपने डिजिटल स्टोर को देख सकें, आवाज़ से एडिट कर सकें और QR स्टैंडी डाउनलोड कर सकें।",
    googleBtn: "Continue with Google",
    backBtn: "होम पर वापस जाएं",
    footer: "100% मुफ़्त स्थानीय व्यापारियों के लिए",
  },
  hi: {
    kicker: "भारत के लिए AI · व्यापारी स्टूडियो",
    title1: "अपनी दुकान संभालें।",
    title2: "व्यापार आगे बढ़ाएं।",
    subtitle: "Google से लॉगिन करें ताकि आप अपनी दुकान देख सकें, आवाज़ से बदलाव कर सकें और QR स्टैंडी प्रिंट कर सकें।",
    googleBtn: "Google के साथ जारी रखें",
    backBtn: "होम पर जाएं",
    footer: "100% मुफ़्त स्थानीय व्यापारियों के लिए",
  },
  mr: {
    kicker: "भारतासाठी AI · मर्चंट स्टुडिओ",
    title1: "आपले दुकान व्यवस्थापित करा.",
    title2: "व्यवसाय वाढवा.",
    subtitle: "आपली वेबसाइट पाहण्यासाठी, आवाजाने एडिट करण्यासाठी आणि QR स्टँडी डाउनलोड करण्यासाठी Google ने लॉगिन करा.",
    googleBtn: "Google सह सुरू ठेवा",
    backBtn: "मुख्यपृष्ठावर जा",
    footer: "स्थानिक व्यापाऱ्यांसाठी १००% मोफत",
  },
  ta: {
    kicker: "பாரதத்திற்கான AI · வணிகர் ஸ்டுடியோ",
    title1: "உங்கள் கடையை நிர்வகிக்கவும்.",
    title2: "வணிகத்தை வளர்க்கவும்.",
    subtitle: "உங்கள் வலைத்தளத்தை அணுக, குரல் மூலம் திருத்த மற்றும் QR ஸ்டாண்டியைப் பதிவிறக்க Google மூலம் உள்நுழையவும்.",
    googleBtn: "Google மூலம் தொடரவும்",
    backBtn: "முகப்புக்குச் செல்க",
    footer: "உள்ளூர் வணிகர்களுக்கு 100% இலவசம்",
  },
  te: {
    kicker: "భారత్ కోసం AI · వ్యాపారి స్టూడియో",
    title1: "మీ దుకాణాన్ని నిర్వహించండి.",
    title2: "వ్యాపారాన్ని విస్తరించండి.",
    subtitle: "మీ డిజిటల్ స్టోర్‌ని చూడటానికి, వాయిస్ ద్వారా ఎడిట్ చేయడానికి మరియు QR స్టాండీ డౌన్‌లోడ్ చేయడానికి Google తో లాగిన్ అవ్వండి.",
    googleBtn: "Google తో కొనసాగించండి",
    backBtn: "హోమ్‌కి వెళ్లండి",
    footer: "స్థానిక వ్యాపారులకు 100% ఉచితం",
  },
  kn: {
    kicker: "ಭಾರತಕ್ಕಾಗಿ AI · ವ್ಯಾಪಾರಿ ಸ್ಟುಡಿಯೋ",
    title1: "ನಿಮ್ಮ ಅಂಗಡಿಯನ್ನು ನಿರ್ವಹಿಸಿ.",
    title2: "ವ್ಯವಹಾರವನ್ನು ಬೆಳೆಸಿ.",
    subtitle: "ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಅಂಗಡಿಯನ್ನು ಪ್ರವೇಶಿಸಲು ಮತ್ತು QR ಸ್ಟ್ಯಾಂಡಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು Google ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ.",
    googleBtn: "Google ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ",
    backBtn: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    footer: "ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಿಗಳಿಗೆ 100% ಉಚಿತ",
  },
  gu: {
    kicker: "ભારત માટે AI · મર્ચન્ટ સ્ટુડિયો",
    title1: "તમારી દુકાનનું સંચાલન કરો.",
    title2: "વેપાર આગળ વધારો.",
    subtitle: "તમારા ડિજિટલ સ્ટોરને ઍક્સેસ કરવા અને QR સ્ટેન્ડી ડાઉનલોડ કરવા Google થી લૉગિન કરો.",
    googleBtn: "Google સાથે ચાલુ રાખો",
    backBtn: "હોમ પર પાછા જાઓ",
    footer: "સ્થાનિક વેપારીઓ માટે ૧૦૦% મફત",
  },
  bn: {
    kicker: "ভারতের জন্য AI · মার্চেন্ট স্টুডিও",
    title1: "আপনার দোকান পরিচালনা করুন।",
    title2: "ব্যবসা বাড়ান।",
    subtitle: "আপনার ডিজিটাল স্টোর দেখতে, ভয়েস দিয়ে এডিট করতে এবং QR স্ট্যান্ডি ডাউনলোড করতে Google দিয়ে লগইন করুন।",
    googleBtn: "Google দিয়ে চালিয়ে যান",
    backBtn: "হোমে ফিরে যান",
    footer: "স্থানীয় ব্যবসায়ীদের জন্য ১০০% বিনামূল্যে",
  },
  pa: {
    kicker: "ਭਾਰਤ ਲਈ AI · ਵਪਾਰੀ ਸਟੂਡੀਓ",
    title1: "ਆਪਣੀ ਦੁਕਾਨ ਸੰਭਾਲੋ।",
    title2: "ਕਾਰੋਬਾਰ ਵਧਾਓ।",
    subtitle: "ਆਪਣੀ ਡਿਜੀਟਲ ਦੁਕਾਨ ਵੇਖਣ, ਆਵਾਜ਼ ਨਾਲ ਐਡਿਟ ਕਰਨ ਅਤੇ QR ਸਟੈਂਡੀ ਡਾਊਨਲੋਡ ਕਰਨ ਲਈ Google ਨਾਲ ਲੌਗਇਨ ਕਰੋ।",
    googleBtn: "Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    backBtn: "ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਜਾਓ",
    footer: "ਸਥਾਨਕ ਵਪਾਰੀਆਂ ਲਈ 100% ਮੁਫ਼ਤ",
  },
  ml: {
    kicker: "ഭാരതത്തിനായി AI · വ്യാപാരി സ്റ്റുഡിയോ",
    title1: "നിങ്ങളുടെ കട നിയന്ത്രിക്കുക.",
    title2: "ബിസിനസ്സ് വളർത്തുക.",
    subtitle: "നിങ്ങളുടെ ഡിജിറ്റൽ സ്റ്റോർ കാണാനും QR സ്റ്റാൻഡി ഡൗൺലോഡ് ചെയ്യാനും Google വഴി ലോഗിൻ ചെയ്യുക.",
    googleBtn: "Google ഉപയോഗിച്ച് തുടരുക",
    backBtn: "ഹോമിലേക്ക് മടങ്ങുക",
    footer: "പ്രാദേശിക വ്യാപാരികൾക്ക് 100% സൗജന്യം",
  },
};

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";
  const lang = searchParams.get("lang") || "hi-en";

  const { user, loading: authLoading, signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = LOGIN_TEXT[lang] || LOGIN_TEXT["hi-en"] || LOGIN_TEXT["en"];

  // If already authenticated, redirect immediately to intended destination
  useEffect(() => {
    if (user && !authLoading) {
      router.replace(redirectTarget);
    }
  }, [user, authLoading, redirectTarget, router]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signIn(redirectTarget);
    } catch (err: any) {
      setErrorMsg(err?.message || "Login failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#faf9f5] text-slate-900 flex flex-col justify-between font-sans selection:bg-[#fcb69f]/30">
      {/* ── Same Navbar Across All Pages ── */}
      <AppNavbar returnTo={redirectTarget} />

      {/* ── White & Elegant Center Container ── */}
      <main className="w-full max-w-lg mx-auto flex flex-col items-center justify-center text-center px-6 py-12 my-auto">
        <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-900/5 relative overflow-hidden">
          {/* Subtle warm ambient glow inside card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-gradient-to-b from-orange-100/60 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-md mx-auto mb-5 relative z-10">
            इ
          </div>

          {/* Kicker */}
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e05638] mb-2 block relative z-10">
            {t.kicker}
          </span>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3 relative z-10">
            {t.title1}{" "}
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-600 bg-clip-text text-transparent">
              {t.title2}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-7 relative z-10 font-normal">
            {t.subtitle}
          </p>

          {errorMsg && (
            <div className="w-full p-3 mb-5 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-700 text-center animate-fade-in relative z-10">
              {errorMsg}
            </div>
          )}

          {/* Google Sign-in Button */}
          <div className="w-full flex flex-col items-center gap-3 relative z-10">
            <button
              type="button"
              id="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold py-3.5 px-6 rounded-2xl text-sm border border-slate-300 shadow-md shadow-slate-900/5 hover:border-slate-400 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{submitting ? "Connecting to Google..." : t.googleBtn}</span>
            </button>
          </div>

          {/* Feature Badges List */}
          <div className="flex flex-col gap-2 mt-7 pt-6 border-t border-slate-100 text-left relative z-10">
            {[
              "Google Maps से जुड़ाव और ऑटो-वेरिफिकेशन",
              "हमेशा सुरक्षित व्यापारी डैशबोर्ड",
              "आवाज़ से कभी भी वेबसाइट अपडेट करें",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <Link
          href={`/?lang=${lang}`}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors no-underline font-medium"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t.backBtn}</span>
        </Link>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 py-6 px-6 border-t border-slate-200/80 gap-2">
        <span>&copy; 2026 ICCHA AI &middot; Voice Website Generator for Bharat</span>
        <span>{t.footer}</span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-slate-400 flex items-center justify-center text-xs">
          Loading login...
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
