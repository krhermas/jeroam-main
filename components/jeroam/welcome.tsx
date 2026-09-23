"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles, Compass } from "lucide-react";
import { useI18n } from "./i18n";

/* ─────────────────────────────────────────────────────────────
   PAGE 1 — Welcome Splash (route: /)
   Yellow & White Theme, matching Jeroam Logo.
   Exactly ONE single clean content card in the center.
   Strictly 1 button per page!
───────────────────────────────────────────────────────────── */
export function Welcome() {
  const [visible, setVisible] = useState(false);
  const { locale } = useI18n();
  const isArabic = locale === "ar";
  const isHebrew = locale === "he";

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      className="welcome-page"
      style={{
        position: "relative",
        height: "calc(100vh - 64px)",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(135deg, #ffffff 0%, #faf8f2 50%, #f7f2e6 100%)",
        padding: "clamp(14px, 2.5vh, 24px)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Subtle warm golden ambient circles in background */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-10%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,56,76,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      {/* ── Exactly ONE single, focused card ── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "460px",
          width: "100%",
          background: "#ffffff",
          border: "2px solid rgba(245,166,35,0.35)",
          borderRadius: "28px",
          boxShadow: "0 20px 60px rgba(14,56,76,0.09)",
          padding: "clamp(26px, 4.5vh, 42px) clamp(20px, 4vw, 34px)",
          textAlign: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.98)",
          transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Official Jeroam Logo */}
        <div style={{ marginBottom: "16px" }}>
          <img
            src="/images/jeroam-logo.jpg"
            alt="Jeroam Official Logo"
            style={{
              width: "98px",
              height: "98px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3.5px solid #f5a623",
              boxShadow: "0 8px 24px rgba(245,166,35,0.32)",
              display: "inline-block",
            }}
          />
        </div>

        {/* Brand Name */}
        <div
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#0e384c",
            letterSpacing: "-0.5px",
            marginBottom: "4px",
          }}
        >
          Jeroam <span style={{ color: "#f5a623", fontSize: "1.05rem", fontWeight: 700 }}>
            {isArabic ? "القدس" : isHebrew ? "ירושלים" : "Jerusalem"}
          </span>
        </div>

        {/* Welcome Heading */}
        <h1
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "clamp(1.9rem, 4.8vw, 2.5rem)",
            fontWeight: 400,
            color: "#0e384c",
            margin: "0 0 10px 0",
            lineHeight: 1.15,
          }}
        >
          {isArabic ? "أهلاً و سهلاً" : isHebrew ? "ברוכים הבאים" : "Welcome"}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "0.92rem",
            color: "#5a7585",
            lineHeight: 1.6,
            margin: "0 auto 24px auto",
            maxWidth: "360px",
          }}
        >
          {isArabic
            ? "استكشف القدس الشريف، أصالة التاريخ، ونبض أسواق البلدة القديمة بعيون أصحابها."
            : isHebrew
            ? "גלו את עיר הקודש, היסטוריה אותנטית וסמטאות השווקים בעיר העתיקה."
            : "Discover the Holy City, authentic living history, and the vibrant Old City souks."}
        </p>

        {/* Exactly 1 Single Button */}
        <Link
          href="/start"
          id="welcome-start-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "15px 28px",
            background: "linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
            color: "#0e384c",
            borderRadius: "100px",
            fontSize: "1.05rem",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 8px 25px rgba(245,166,35,0.38)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
        >
          <span>{isArabic ? "ابدأ الرحلة" : isHebrew ? "התחלת הסיור" : "Start Journey"}</span>
          <ArrowRight size={19} strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE 2 — Start / Intro (route: /start)
   Yellow & White Theme. Exactly ONE single card in center.
   Strictly 1 button per page!
───────────────────────────────────────────────────────────── */
export function Start() {
  const [visible, setVisible] = useState(false);
  const { locale } = useI18n();
  const isArabic = locale === "ar";
  const isHebrew = locale === "he";

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      className="start-page"
      style={{
        position: "relative",
        height: "calc(100vh - 64px)",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(135deg, #ffffff 0%, #faf8f2 50%, #f7f2e6 100%)",
        padding: "clamp(14px, 2.5vh, 24px)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "460px",
          width: "100%",
          background: "#ffffff",
          border: "2px solid rgba(245,166,35,0.35)",
          borderRadius: "28px",
          boxShadow: "0 20px 60px rgba(14,56,76,0.09)",
          padding: "clamp(24px, 4vh, 38px) clamp(20px, 4vw, 34px)",
          textAlign: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.98)",
          transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Dome of the Rock preview thumb */}
        <div
          style={{
            width: "100%",
            height: "140px",
            borderRadius: "18px",
            backgroundImage: "url(/images/dome-of-rock.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            border: "1.5px solid rgba(245,166,35,0.3)",
            marginBottom: "16px",
            boxShadow: "0 4px 16px rgba(14,56,76,0.06)",
          }}
        />

        {/* Location pill */}
        <div style={{ marginBottom: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(245,166,35,0.14)",
              color: "#f5a623",
              border: "1px solid rgba(245,166,35,0.35)",
              borderRadius: "100px",
              padding: "4px 14px",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            <MapPin size={13} />
            {isArabic ? "القدس، فلسطين" : isHebrew ? "ירושלים, פלסטין" : "Jerusalem, Palestine"}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "clamp(1.4rem, 3.4vw, 1.85rem)",
            fontWeight: 400,
            color: "#0e384c",
            margin: "0 0 8px 0",
            lineHeight: 1.2,
          }}
        >
          {isArabic
            ? "رحلتك للقدس تبدأ من مكان واحد"
            : isHebrew
            ? "המסע שלך לירושלים מתחיל במקום אחד"
            : "Roam Jerusalem Differently"}
        </h1>

        <p
          style={{
            fontSize: "0.86rem",
            color: "#5a7585",
            lineHeight: 1.6,
            margin: "0 auto 16px auto",
          }}
        >
          {isArabic
            ? "تخيّل إنك بتزور القدس لأول مرة: ميزانيتك، وقتك، واهتماماتك محددة. بدل ما تضيع بين عشرات التطبيقات ومصادر التشتت، Jeroam بجمع الفنادق، المعالم، الطوارئ، وجدولك المخصص بالذكاء الاصطناعي بمكان واحد."
            : isHebrew
            ? "דמיינו ביקור ראשון בירושלים: זמן, תקציב והעדפות מוגדרים. במקום ללכת לאיבוד בין אפליקציות, Jeroam מרכזת הכל במקום אחד מותאם אישית ב-AI."
            : "Imagine visiting Jerusalem for the first time: limited time and budget. Instead of juggling ten different apps, Jeroam brings hotels, landmarks, SOS, and AI-personalized itineraries into one single place."}
        </p>

        {/* 3 Core Value Pillars */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <span style={{ background: "#f8f6f0", color: "#0e384c", border: "1px solid #ebd9b5", padding: "4px 10px", borderRadius: "100px", fontSize: "0.74rem", fontWeight: 600 }}>
            ✨ {isArabic ? "تخطيط ذكي مخصص" : isHebrew ? "תכנון מותאם AI" : "AI Personalized"}
          </span>
          <span style={{ background: "#f8f6f0", color: "#0e384c", border: "1px solid #ebd9b5", padding: "4px 10px", borderRadius: "100px", fontSize: "0.74rem", fontWeight: 600 }}>
            🏨 {isArabic ? "فنادق وخرائط فورية" : isHebrew ? "מלונות ומפות" : "Hotels & Maps"}
          </span>
          <span style={{ background: "#f8f6f0", color: "#0e384c", border: "1px solid #ebd9b5", padding: "4px 10px", borderRadius: "100px", fontSize: "0.74rem", fontWeight: 600 }}>
            🚨 {isArabic ? "طوارئ SOS مباشر" : isHebrew ? "חירום SOS ישיר" : "Direct SOS"}
          </span>
        </div>

        {/* Primary CTA: Start AI Planning */}
        <Link
          href="/onboarding"
          id="start-continue-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "14px 28px",
            background: "linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
            color: "#0e384c",
            borderRadius: "100px",
            fontSize: "1rem",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 8px 25px rgba(245,166,35,0.38)",
            transition: "all 0.2s ease",
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          <span>{isArabic ? "ابدأ التخطيط المخصص بالذكاء الاصطناعي" : isHebrew ? "התחלת תכנון מותאם ב-AI" : "Start AI Trip Planner"}</span>
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>

        {/* Secondary option to explore directly */}
        <div>
          <Link
            href="/explore"
            style={{
              fontSize: "0.82rem",
              color: "#5a7585",
              textDecoration: "underline",
              fontWeight: 500,
            }}
          >
            {isArabic ? "أو استكشف المعالم والمسارات مباشرة" : isHebrew ? "או גלו את האתרים והמסלולים ישירות" : "Or explore places & routes directly"}
          </Link>
        </div>
      </div>
    </main>
  );
}
