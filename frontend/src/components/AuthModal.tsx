"use client";

import React, { useState } from "react";
import { signInWithGoogle, type AuthUser } from "@/lib/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
  title?: string;
  subtitle?: string;
  lang?: string;
  redirectAfterLogin?: string;
}

const AUTH_TEXT: Record<string, {
  kicker: string;
  title: string;
  subtitle: string;
  googleBtn: string;
  cancelBtn: string;
  footer: string;
}> = {
  en: {
    kicker: "AI FOR BHARAT · MERCHANT STUDIO",
    title: "Sign in with Google to Secure Your Website",
    subtitle: "Signing in secures your storefront draft so you can view, edit, and approve it anytime from your merchant dashboard.",
    googleBtn: "Continue with Google",
    cancelBtn: "Cancel · Back",
    footer: "100% Free for Local Indian Merchants",
  },
  "hi-en": {
    kicker: "AI FOR BHARAT · MERCHANT STUDIO",
    title: "Google से लॉगिन करें और वेबसाइट सुरक्षित करें",
    subtitle: "लॉगिन करने से आपकी वेबसाइट सुरक्षित रहेगी और आप अपने व्यापारी डैशबोर्ड में कभी भी इसे देख, एडिट और मंज़ूर कर सकेंगे।",
    googleBtn: "Continue with Google",
    cancelBtn: "वापस जाएं (Back)",
    footer: "100% मुफ़्त स्थानीय व्यापारियों के लिए",
  },
  hi: {
    kicker: "भारत के लिए AI · व्यापारी स्टूडियो",
    title: "Google से लॉगिन करें और वेबसाइट सुरक्षित करें",
    subtitle: "लॉगिन करने से आपकी वेबसाइट सुरक्षित रहेगी और आप अपने व्यापारी डैशबोर्ड में कभी भी इसे देख, एडिट और मंज़ूर कर सकेंगे।",
    googleBtn: "Google के साथ जारी रखें",
    cancelBtn: "वापस जाएं",
    footer: "100% मुफ़्त स्थानीय व्यापारियों के लिए",
  },
  mr: {
    kicker: "भारतासाठी AI · मर्चंट स्टुडिओ",
    title: "Google ने लॉगिन करा आणि वेबसाइट सुरक्षित करा",
    subtitle: "लॉगिन केल्याने तुमची वेबसाइट सुरक्षित राहील आणि तुम्ही ती कधीही डॅशबोर्डवर पाहू आणि एडिट करू शकाल.",
    googleBtn: "Google सह सुरू ठेवा",
    cancelBtn: "मागे जा",
    footer: "स्थानिक व्यापाऱ्यांसाठी १००% मोफत",
  },
  ta: {
    kicker: "பாரதத்திற்கான AI · வணிகர் ஸ்டுடியோ",
    title: "Google மூலம் உள்நுழைந்து வலைத்தளத்தை பாதுகாக்கவும்",
    subtitle: "உள்நுழைவது உங்கள் வலைத்தள வரைவை பாதுகாப்பாக வைத்திருக்கும், எப்போது வேண்டுமானாலும் நிர்வகிக்கலாம்.",
    googleBtn: "Google மூலம் தொடரவும்",
    cancelBtn: "பின்செல்க",
    footer: "உள்ளூர் வணிகர்களுக்கு 100% இலவசம்",
  },
  te: {
    kicker: "భారత్ కోసం AI · వ్యాపారి స్టూడియో",
    title: "Google తో లాగిన్ అయి వెబ్‌సైట్‌ను సురక్షితం చేయండి",
    subtitle: "లాగిన్ చేయడం ద్వారా మీ వెబ్‌సైట్ సురక్షితంగా ఉంటుంది మరియు మీరు ఎప్పుడైనా ఎడిట్ చేయవచ్చు.",
    googleBtn: "Google తో కొనసాగించండి",
    cancelBtn: "వెనుకకు",
    footer: "స్థానిక వ్యాపారులకు 100% ఉచితం",
  },
  kn: {
    kicker: "ಭಾರತಕ್ಕಾಗಿ AI · ವ್ಯಾಪಾರಿ ಸ್ಟುಡಿಯೋ",
    title: "Google ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ ವೆಬ್‌ಸೈಟ್ ರಕ್ಷಿಸಿ",
    subtitle: "ಲಾಗಿನ್ ಮಾಡುವುದರಿಂದ ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ ಮತ್ತು ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ನಿರ್ವಹಿಸಬಹುದು.",
    googleBtn: "Google ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ",
    cancelBtn: "ಹಿಂದೆ",
    footer: "ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಿಗಳಿಗೆ 100% ಉಚಿತ",
  },
  gu: {
    kicker: "ભારત માટે AI · મર્ચન્ટ સ્ટુડિયો",
    title: "Google થી લૉગિન કરો અને વેબસાઇટ સુરક્ષિત કરો",
    subtitle: "લૉગિન કરવાથી તમારી વેબસાઇટ સુરક્ષિત રહેશે અને તમે ગમે ત્યારે તેને એડિટ કરી શકશો.",
    googleBtn: "Google સાથે ચાલુ રાખો",
    cancelBtn: "પાછા જાઓ",
    footer: "સ્થાનિક વેપારીઓ માટે ૧૦૦% મફત",
  },
  bn: {
    kicker: "ভারতের জন্য AI · মার্চেন্ট স্টুডিও",
    title: "Google দিয়ে লগইন করুন এবং ওয়েবসাইট সুরক্ষিত করুন",
    subtitle: "লগইন করলে আপনার ওয়েবসাইটের ড্রাফ্ট সুরক্ষিত থাকবে এবং আপনি যেকোনো সময় এডিট করতে পারবেন।",
    googleBtn: "Google দিয়ে চালিয়ে যান",
    cancelBtn: "ফিরে যান",
    footer: "স্থানীয় ব্যবসায়ীদের জন্য ১০০% বিনামূল্যে",
  },
  pa: {
    kicker: "ਭਾਰਤ ਲਈ AI · ਵਪਾਰੀ ਸਟੂਡੀਓ",
    title: "Google ਨਾਲ ਲੌਗਇਨ ਕਰੋ ਅਤੇ ਵੈੱਬਸਾਈਟ ਸੁਰੱਖਿਅਤ ਕਰੋ",
    subtitle: "ਲੌਗਇਨ ਕਰਨ ਨਾਲ ਤੁਹਾਡੀ ਵੈੱਬਸਾਈਟ ਸੁਰੱਖਿਅਤ ਰਹੇਗੀ ਅਤੇ ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਇਸਨੂੰ ਸੰਪਾਦਿਤ ਕਰ ਸਕਦੇ ਹੋ।",
    googleBtn: "Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    cancelBtn: "ਵਾਪਸ ਜਾਓ",
    footer: "ਸਥਾਨਕ ਵਪਾਰੀਆਂ ਲਈ 100% ਮੁਫ਼ਤ",
  },
  ml: {
    kicker: "ഭാരതത്തിനായി AI · വ്യാപാരി സ്റ്റുഡിയോ",
    title: "Google വഴി ലോഗിൻ ചെയ്ത് വെബ്‌സൈറ്റ് സുരക്ഷിതമാക്കുക",
    subtitle: "ലോഗിൻ ചെയ്യുന്നത് നിങ്ങളുടെ വെബ്‌സൈറ്റ് ഡ്രാഫ്റ്റ് സുരക്ഷിതമായി സൂക്ഷിക്കാൻ സഹായിക്കുന്നു.",
    googleBtn: "Google ഉപയോഗിച്ച് തുടരുക",
    cancelBtn: "തിരികെ",
    footer: "പ്രാദേശിക വ്യാപാരികൾക്ക് 100% സൗജന്യം",
  },
};

export function AuthModal({
  isOpen,
  onClose,
  title,
  subtitle,
  lang = "hi-en",
  redirectAfterLogin,
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = AUTH_TEXT[lang] || AUTH_TEXT["hi-en"] || AUTH_TEXT["en"];
  const displayTitle = title || t.title;
  const displaySubtitle = subtitle || t.subtitle;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const target = redirectAfterLogin || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard");
      if (typeof window !== "undefined") {
        localStorage.setItem("iccha_auth_redirect", target);
      }
      const res = await signInWithGoogle(target);
      if (!res.success) {
        setErrorMsg(res.error || "Google login failed. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] w-full h-full bg-[#faf9f5]/95 backdrop-blur-md text-slate-900 flex flex-col justify-between p-6 sm:p-12 animate-fade-in font-sans selection:bg-[#fcb69f]/30 overflow-y-auto"
    >
      {/* ── Top Bar: Close Button & Logo ── */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <button
          onClick={onClose}
          type="button"
          aria-label="Back"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t.cancelBtn}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <span className="w-0.5 h-3 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-4.5 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-5 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-3.5 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-2 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-slate-900">
            ICCHA AI
          </span>
        </div>
      </header>

      {/* ── Center Card: White & Elegant ── */}
      <main className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center my-auto py-8 z-10">
        <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-900/5 relative overflow-hidden">
          {/* Subtle warm glow inside card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-orange-100/60 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-md mx-auto mb-5 relative z-10">
            इ
          </div>

          {/* Kicker */}
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e05638] mb-2 block relative z-10">
            {t.kicker}
          </span>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3 relative z-10">
            {displayTitle}
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-7 relative z-10 font-normal">
            {displaySubtitle}
          </p>

          {errorMsg && (
            <div className="w-full p-3 mb-5 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-700 text-center animate-fade-in relative z-10">
              {errorMsg}
            </div>
          )}

          {/* ── ONLY GOOGLE SIGN IN ── */}
          <div className="w-full flex flex-col items-center gap-3 relative z-10">
            <button
              type="button"
              id="modal-google-login-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
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
              <span>{loading ? "Connecting to Google..." : t.googleBtn}</span>
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
      </main>

      {/* ── Footer ── */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-200/80 z-10 gap-2">
        <span>&copy; 2026 ICCHA AI &middot; Voice Website Generator for Bharat</span>
        <span>{t.footer}</span>
      </footer>
    </div>
  );
}
