"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Check,
  Clock,
  Sparkles,
  Info,
  X,
  ArrowRight,
  Route as RouteIcon,
  Heart,
  Compass
} from "lucide-react";
import { useApp } from "./provider";
import { useI18n } from "./i18n";
import { CustomerFeedbackModal, AIFeedbackModal } from "./feedback";

/* ─────────────────────────────────────────────────────────────
   Authentic Curated Places — Jerusalem, Palestine (القدس، فلسطين)
   Pure Jerusalem heritage, real photos, no Jewish religious sites
───────────────────────────────────────────────────────────── */
export interface JerusalemPlace {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  location: string;
  image: string;
  visitMinutes: number;
  highlight: string;
  highlightAr: string;
  story: string;
  facts: string[];
}

export const JERUSALEM_PLACES: JerusalemPlace[] = [
  {
    id: "dome-of-rock",
    name: "Dome of the Rock & Al-Aqsa",
    nameAr: "قبة الصخرة والمسجد الأقصى المبارك",
    category: "Sacred Sanctuary",
    categoryAr: "معلم إسلامي مقدس",
    location: "Old City, Jerusalem, Palestine",
    image: "/images/dome-of-rock.jpg",
    visitMinutes: 90,
    highlight: "The golden-domed masterpiece of Umayyad architecture dating back to 691 CE, crown jewel of Jerusalem's skyline.",
    highlightAr: "التحفة المعمارية الأموية ذات القبة الذهبية منذ عام 691 م، وتاج أفق مدينة القدس الشريف.",
    story: "Built under the Umayyad caliph Abd al-Malik ibn Marwan, the Dome of the Rock stands atop an ancient stone plateau as one of the earliest and most magnificent monuments in Islamic civilization. Its exterior is cloaked in dazzling Turkish ceramic tiles with intricate Quranic calligraphy, while the interior features carved marble columns and golden glass mosaics. Surrounding it is the 35-acre sanctuary of Al-Aqsa with the Qibly Mosque, stone porticos, and centuries-old olive and cypress trees.",
    facts: [
      "Completed in 691 CE, making it over 1,330 years old",
      "Features over 1,200 square meters of Umayyad glass mosaics",
      "The octagonal plan and golden dome are world-renowned architectural icons"
    ]
  },
  {
    id: "damascus-gate",
    name: "Damascus Gate (Bab al-Amoud)",
    nameAr: "باب العامود (بوابة دمشق)",
    category: "Monumental Gateway",
    categoryAr: "بوابة تاريخية عثمانية",
    location: "Northern Wall, Jerusalem, Palestine",
    image: "/images/damascus-gate.jpg",
    visitMinutes: 45,
    highlight: "The grandest and most monumental gate of Jerusalem's historic walls, built by Suleiman the Magnificent in 1537.",
    highlightAr: "أعظم وأفخم بوابات أسوار القدس التاريخية، شيدها السلطان سليمان القانوني عام 1537 م.",
    story: "Referred to by Palestinians as Bab al-Amoud ('Gate of the Column') after the Roman marble pillar that marked the distance to other cities, this colossal fortress gate is framed by towering defensive stone battlements and a wide stepped amphitheater. It serves as the historic pedestrian artery connecting modern East Jerusalem directly into the buzzing Khan ez-Zeit bazaar of the Old City.",
    facts: [
      "Built in 1537 CE during the Ottoman restoration of Jerusalem's walls",
      "Features traditional defensive machicolations and arrow slits",
      "Vibrant social hub where locals gather for Palestinian sweets, tea, and commerce"
    ]
  },
  {
    id: "jerusalem-souk",
    name: "Old City Souks & Spices",
    nameAr: "أسواق البلدة القديمة وخان الزيت",
    category: "Living Heritage & Bazaar",
    categoryAr: "أسواق وتراث حي",
    location: "Old City, Jerusalem, Palestine",
    image: "/images/jerusalem-souk.jpg",
    visitMinutes: 60,
    highlight: "Atmospheric ancient stone-vaulted alleys filled with vibrant Palestinian spices, olive oil soaps, and fresh sesame Ka'ak al-Quds.",
    highlightAr: "أزقة حجرية مقببة تعبق برائحة الزعتر والبهارات الفلسطينية وصابون الغار وكعك القدس الساخن بالسمسم.",
    story: "The historic covered markets of Jerusalem's Old City—Khan ez-Zeit, Souk al-Attarin (the Perfumers), Souk al-Lahhamin (the Butchers), and Souk al-Qattanin (the Cotton Merchants)—date back over eight centuries to the Mamluk and Crusader eras. Generations of Palestinian merchants continue to bake traditional sesame Ka'ak in century-old wood ovens, roast aromatic Arabic cardamom coffee, and sell handcrafted olive wood art.",
    facts: [
      "Over 800 years of continuous market life beneath ancient stone arches",
      "Home to historic Palestinian bakeries creating authentic Ka'ak al-Quds",
      "Labyrinthine passages connecting Damascus Gate to the sacred courtyards"
    ]
  },
  {
    id: "holy-sepulchre",
    name: "Church of the Holy Sepulchre",
    nameAr: "كنيسة القيامة",
    category: "Sacred Christian Heritage",
    categoryAr: "تراث مسيحي مقدس",
    location: "Christian Quarter, Jerusalem, Palestine",
    image: "/images/holy-sepulchre.jpg",
    visitMinutes: 75,
    highlight: "One of the most venerated sanctuaries in the world, holding two thousand years of history in the Christian Quarter.",
    highlightAr: "أحد أقدس وأعرق المعالم المسيحية في العالم، يضم ألفي عام من التاريخ في قلب حارة النصارى.",
    story: "First constructed in 335 CE by Saint Helena and Emperor Constantine, the Church of the Holy Sepulchre is the spiritual center of Christianity in Jerusalem. Its Romanesque stone portal and towering Rotunda dome reflect centuries of Byzantine, Crusader, and Ottoman craftsmanship. By long-standing historic tradition dating to Saladin in 1187, the keys of the church are safeguarded by the Palestinian Muslim Joudeh and Nuseibeh families.",
    facts: [
      "Originally founded in 335 CE, reconstructed by Crusaders in the 12th century",
      "Historic keys preserved by two Palestinian Muslim families since 1187 CE",
      "Shared sanctuary of Greek Orthodox, Roman Catholic, and Armenian traditions"
    ]
  },
  {
    id: "old-city-walls",
    name: "Jerusalem Ramparts & Panorama",
    nameAr: "أسوار البلدة القديمة وأفق القدس",
    category: "Ancient Fortifications",
    categoryAr: "أسوار أثرية وإطلالة شاملة",
    location: "Perimeter Ramparts, Jerusalem, Palestine",
    image: "/images/jerusalem-hero.webp",
    visitMinutes: 60,
    highlight: "Four kilometers of towering golden limestone walls enclosing Jerusalem's historic quarters, gates, and minarets.",
    highlightAr: "أربعة كيلومترات من الأسوار الحجرية العريقة تطوق حارات القدس وبواباتها ومآذنها.",
    story: "Jerusalem's magnificent defensive walls were built between 1535 and 1538 by Ottoman Sultan Suleiman the Magnificent upon ancient Crusader and Roman foundations. The ramparts walk offers an unparalleled panoramic view overlooking the golden dome, ancient stone rooftops, and the historic olive-clad valleys stretching toward Mount of Olives.",
    facts: [
      "Spans 4,018 meters with an average height of 12 meters",
      "Features 34 defensive watchtowers and 7 open historic gates",
      "Constructed entirely from local golden Jerusalem limestone"
    ]
  }
];

/* ─────────────────────────────────────────────────────────────
   Authentic Walking Routes — Jerusalem, Palestine (القدس)
───────────────────────────────────────────────────────────── */
export interface WalkingRoute {
  id: string;
  title: string;
  titleAr: string;
  duration: string;
  stopsCount: number;
  distance: string;
  description: string;
  descriptionAr: string;
  stops: {
    title: string;
    titleAr: string;
    time: string;
    desc: string;
  }[];
}

export const JERUSALEM_ROUTES: WalkingRoute[] = [
  {
    id: "route-old-city-core",
    title: "Old City Historic Heart Trail",
    titleAr: "مسار قلب البلدة القديمة التاريخي",
    duration: "2 hours",
    stopsCount: 4,
    distance: "1.8 km",
    description: "Journey from Damascus Gate through the Khan ez-Zeit souks to the Church of the Holy Sepulchre and Al-Aqsa sanctuary.",
    descriptionAr: "جولة من باب العامود مروراً بأسواق خان الزيت وكنيسة القيامة وصولاً إلى ساحات المسجد الأقصى المبارك.",
    stops: [
      {
        title: "Damascus Gate (Bab al-Amoud)",
        titleAr: "باب العامود",
        time: "30 min",
        desc: "Begin at the monumental Ottoman gateway and take in the vibrant gathering of East Jerusalem life."
      },
      {
        title: "Khan ez-Zeit Souk",
        titleAr: "سوق خان الزيت",
        time: "30 min",
        desc: "Wander the covered stone bazaar, taste freshly baked Ka'ak al-Quds with za'atar and Arabic coffee."
      },
      {
        title: "Church of the Holy Sepulchre",
        titleAr: "كنيسة القيامة",
        time: "35 min",
        desc: "Step into the courtyard and Romanesque arches of this two-thousand-year-old sacred sanctuary."
      },
      {
        title: "Dome of the Rock Courtyard",
        titleAr: "ساحة قبة الصخرة المشرفة",
        time: "45 min",
        desc: "Conclude at the golden dome admiring the exquisite Umayyad blue tiles and ancient stone arcades."
      }
    ]
  },
  {
    id: "route-ancient-gates",
    title: "The Historic Gates Promenade",
    titleAr: "مسار بوابات القدس الشريف",
    duration: "2.5 hours",
    stopsCount: 5,
    distance: "2.6 km",
    description: "Follow the majestic perimeter of Suleiman the Magnificent's fortifications from Damascus Gate to Lion's Gate.",
    descriptionAr: "تتبع محيط أسوار القدس العثمانية من باب العامود إلى باب الأسباط وباب الخليل.",
    stops: [
      {
        title: "Damascus Gate",
        titleAr: "باب العامود",
        time: "25 min",
        desc: "Start at the grandest northern gate with its defensive stone towers and amphitheater."
      },
      {
        title: "Herod's Gate (Bab al-Zahra)",
        titleAr: "باب الساهرة",
        time: "20 min",
        desc: "Pass the quiet residential entrance to the Muslim Quarter with traditional stone facades."
      },
      {
        title: "Lion's Gate (Bab al-Asbat)",
        titleAr: "باب الأسباط",
        time: "30 min",
        desc: "Historic eastern gate carved with stone leopards, leading directly into the sacred sanctuary."
      },
      {
        title: "Kidron Valley Overlook",
        titleAr: "إطلالة وادي قدرون",
        time: "25 min",
        desc: "Take in the breathtaking view of ancient olive groves climbing the Mount of Olives."
      },
      {
        title: "Jaffa Gate (Bab al-Khalil)",
        titleAr: "باب الخليل",
        time: "30 min",
        desc: "Arrive at the western portal and the stone battlements of the ancient Jerusalem Citadel."
      }
    ]
  }
];

/* ─────────────────────────────────────────────────────────────
   EXPLORE COMPONENT
   Strictly ONE single content card centered on screen!
   Yellow & White theme matching Jeroam Logo.
───────────────────────────────────────────────────────────── */
export function Explore() {
  const { savedPlaces, saveItem, notify } = useApp();
  const { locale } = useI18n();
  const [index, setIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [aiFeedbackOpen, setAiFeedbackOpen] = useState(false);
  const [sensoryOpen, setSensoryOpen] = useState(false);
  const [sensoryTab, setSensoryTab] = useState<"sound" | "scent" | "taste" | "touch" | "sight">("sound");

  const place = JERUSALEM_PLACES[index];
  const isSaved = savedPlaces.includes(place.id);
  const isArabic = locale === "ar";
  const isHebrew = locale === "he";

  function nextPlace() {
    setIndex((i) => (i + 1) % JERUSALEM_PLACES.length);
  }

  function prevPlace() {
    setIndex((i) => (i - 1 + JERUSALEM_PLACES.length) % JERUSALEM_PLACES.length);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (detailOpen || sensoryOpen || feedbackOpen || aiFeedbackOpen) return;
      if (e.key === "ArrowRight") nextPlace();
      if (e.key === "ArrowLeft") prevPlace();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [detailOpen, sensoryOpen, feedbackOpen, aiFeedbackOpen]);

  return (
    <main
      style={{
        height: "calc(100vh - 64px)",
        width: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #ffffff 0%, #faf8f2 50%, #f7f2e6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(10px, 2vh, 20px)",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
    >
      {/* ── EXACTLY ONE SINGLE CARD ON SCREEN ── */}
      <div
        key={place.id}
        style={{
          maxWidth: "580px",
          width: "100%",
          background: "#ffffff",
          border: "2px solid rgba(245,166,35,0.38)",
          borderRadius: "24px",
          boxShadow: "0 18px 50px rgba(14,56,76,0.08)",
          padding: "clamp(18px, 2.5vh, 26px)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          zIndex: 5,
        }}
      >
        {/* Place Image with badge - Clicking opens story */}
        <div
          onClick={() => setDetailOpen(true)}
          role="button"
          tabIndex={0}
          aria-label={isArabic ? "عرض التفاصيل والحكاية" : "View story & details"}
          style={{
            position: "relative",
            width: "100%",
            height: "clamp(170px, 25vh, 220px)",
            borderRadius: "16px",
            backgroundImage: `url(${place.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1.5px solid rgba(245,166,35,0.3)",
            boxShadow: "0 4px 14px rgba(14,56,76,0.07)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#ffffff",
              color: "#0e384c",
              border: "1.5px solid #f5a623",
              borderRadius: "100px",
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <MapPin size={12} style={{ color: "#f5a623" }} />
            <span>القدس، فلسطين · Jerusalem</span>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              background: "#f5a623",
              color: "#0e384c",
              borderRadius: "100px",
              padding: "3px 10px",
              fontSize: "0.72rem",
              fontWeight: 800,
            }}
          >
            0{index + 1} / 0{JERUSALEM_PLACES.length}
          </div>

          {/* Tap hint pill */}
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              background: "rgba(14,56,76,0.85)",
              color: "#ffffff",
              backdropFilter: "blur(4px)",
              borderRadius: "100px",
              padding: "3px 10px",
              fontSize: "0.72rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Info size={11} style={{ color: "#f5a623" }} />
            <span>{isArabic ? "انقر لمعرفة الحكاية والتفاصيل 📖" : "Tap for story & details 📖"}</span>
          </div>
        </div>

        {/* Place Titles */}
        <div onClick={() => setDetailOpen(true)} style={{ cursor: "pointer" }}>
          <h1
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(1.4rem, 3vw, 1.85rem)",
              fontWeight: 400,
              color: "#0e384c",
              margin: "0 0 4px 0",
              lineHeight: 1.2,
            }}
          >
            {isArabic ? place.nameAr : place.name}
          </h1>
          <div
            style={{
              fontSize: "0.95rem",
              color: "#f5a623",
              fontWeight: 700,
              fontFamily: "'Georgia', serif",
            }}
          >
            {isArabic ? place.name : place.nameAr}
          </div>
        </div>

        {/* Concise Description */}
        <p
          style={{
            fontSize: "0.88rem",
            lineHeight: 1.55,
            color: "#5a7585",
            margin: 0,
          }}
        >
          {isArabic ? place.highlightAr : place.highlight}
        </p>

        {/* Navigation Controls: Button by button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          <button
            type="button"
            id="explore-prev-btn"
            onClick={prevPlace}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              background: "#ffffff",
              border: "1.5px solid rgba(14,56,76,0.2)",
              borderRadius: "100px",
              color: "#0e384c",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={16} />
            <span>{isArabic ? "السابق" : "Previous"}</span>
          </button>

          <button
            type="button"
            id="explore-next-btn"
            onClick={nextPlace}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 22px",
              background: "linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
              border: "none",
              borderRadius: "100px",
              color: "#0e384c",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(245,166,35,0.35)",
            }}
          >
            <span>{isArabic ? "المكان التالي" : "Next Place"}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Place Story Modal */}
      {detailOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(14,56,76,0.65)",
            backdropFilter: "blur(10px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setDetailOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "2px solid rgba(245,166,35,0.4)",
              borderRadius: "24px",
              maxWidth: "620px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "clamp(22px, 3.5vh, 32px)",
              position: "relative",
              boxShadow: "0 24px 60px rgba(14,56,76,0.18)",
              color: "#0e384c",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#f8f6f0",
                border: "1px solid rgba(245,166,35,0.3)",
                color: "#0e384c",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X size={17} />
            </button>

            <span style={{ color: "#f5a623", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
              {place.category} · {place.location}
            </span>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: "1.6rem", color: "#0e384c", margin: "6px 0 2px" }}>
              {place.name}
            </h2>
            <div style={{ color: "#f5a623", fontFamily: "'Georgia', serif", fontSize: "1.1rem", marginBottom: "14px" }}>
              {place.nameAr}
            </div>

            <p style={{ color: "#445e6b", lineHeight: 1.7, fontSize: "0.92rem", marginBottom: "18px" }}>
              {place.story}
            </p>

            <div style={{ background: "#fdfbf7", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "14px", padding: "16px", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "0.85rem", color: "#f5a623", fontWeight: 700, margin: "0 0 8px 0" }}>
                محطات وحقائق تاريخية
              </h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#5a7585", fontSize: "0.85rem", lineHeight: 1.6 }}>
                {place.facts.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Experience Links */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setSensoryOpen(true);
                }}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  borderRadius: "12px",
                  background: "#f8f6f0",
                  border: "1px solid rgba(245,166,35,0.3)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#0e384c",
                  cursor: "pointer",
                }}
              >
                <span>👃 {isArabic ? "مسار الحواس الخمس" : isHebrew ? "חמשת החושים" : "5-Senses Roam"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setAiFeedbackOpen(true);
                }}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  borderRadius: "12px",
                  background: "#f8f6f0",
                  border: "1px solid rgba(245,166,35,0.3)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#0e384c",
                  cursor: "pointer",
                }}
              >
                <Sparkles size={14} style={{ color: "#f5a623" }} />
                <span>{isArabic ? "ملاحظات الذكاء الاصطناعي" : isHebrew ? "משוב AI" : "AI Feedback"}</span>
              </button>
            </div>

            {/* Exactly 2 Primary Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                style={{
                  padding: "11px",
                  background: "#ffffff",
                  color: "#0e384c",
                  border: "1.5px solid rgba(14,56,76,0.2)",
                  borderRadius: "100px",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                {isArabic ? "✕ إغلاق" : isHebrew ? "✕ סגירה" : "✕ Close"}
              </button>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " Jerusalem")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "11px",
                  background: "linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
                  color: "#0e384c",
                  borderRadius: "100px",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  textDecoration: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(245,166,35,0.3)",
                }}
              >
                <MapPin size={15} />
                <span>{isArabic ? "خرائط جوجل" : isHebrew ? "גוגל מפות" : "Google Maps"}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5-Senses Roam Modal */}
      {sensoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(14,56,76,0.65)",
            backdropFilter: "blur(10px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSensoryOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "2px solid rgba(245,166,35,0.4)",
              borderRadius: "24px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "clamp(24px, 4vh, 34px)",
              position: "relative",
              boxShadow: "0 24px 60px rgba(14,56,76,0.18)",
              color: "#0e384c",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSensoryOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#f8f6f0",
                border: "1px solid rgba(245,166,35,0.3)",
                color: "#0e384c",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X size={17} />
            </button>

            <span style={{ color: "#f5a623", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
              تجربة حصرية للقدس الشريف
            </span>
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: "1.7rem", color: "#0e384c", margin: "6px 0 14px" }}>
              مسار الحواس الخمس في القدس
            </h2>

            {/* Senses Tabs */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
              {[
                { id: "sound", label: "الصوت 👂" },
                { id: "scent", label: "الرائحة 👃" },
                { id: "taste", label: "المذاق 👅" },
                { id: "touch", label: "الملمس ✋" },
                { id: "sight", label: "البصر 👁️" },
              ].map((tab) => {
                const active = sensoryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSensoryTab(tab.id as any)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: "100px",
                      background: active ? "#f5a623" : "#f8f6f0",
                      color: "#0e384c",
                      border: `1.5px solid ${active ? "#f5a623" : "rgba(245,166,35,0.25)"}`,
                      fontSize: "0.82rem",
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Sensory Tab Body */}
            <div style={{ background: "#fdfbf7", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "16px", padding: "18px", marginBottom: "18px" }}>
              {sensoryTab === "sound" && (
                <div>
                  <h3 style={{ color: "#0e384c", margin: "0 0 8px" }}>نبض وأصوات أزقة القدس</h3>
                  <p style={{ color: "#5a7585", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>
                    يمتزج أذان المسجد الأقصى المبارك مع رنين أجراس كنيسة القيامة في هارموني روحاني استثنائي. في الصباح، يصدح صوت بائع الكعك في خان الزيت: «كعك سخن.. مقدسي يا كعك!» مع صدى خطوات المصلين على بلاط القدس الصواني.
                  </p>
                </div>
              )}
              {sensoryTab === "scent" && (
                <div>
                  <h3 style={{ color: "#0e384c", margin: "0 0 8px" }}>عطر التوابل وبخور القيامة</h3>
                  <p style={{ color: "#5a7585", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>
                    تفوح أزقة سوق العطارين بخلطات الزعتر البلدي بالسماق، البن المطحون بالهيل على الفحم، بخور كنيسة القيامة، ونفحات صابون زيت الزيتون النابلسي الطبيعي.
                  </p>
                </div>
              )}
              {sensoryTab === "taste" && (
                <div>
                  <h3 style={{ color: "#0e384c", margin: "0 0 8px" }}>مذاقات المطبخ المقدسي</h3>
                  <p style={{ color: "#5a7585", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>
                    كعك القدس المغموس بالسمسم والمخبوز على الحطب مع الفلافل الساخنة والشاي بالنعناع، وكنافة البلدة القديمة بالجبن البلدي والقطر الساخن، وشراب الخروب المثلج عند باب العامود.
                  </p>
                </div>
              )}
              {sensoryTab === "touch" && (
                <div>
                  <h3 style={{ color: "#0e384c", margin: "0 0 8px" }}>ملمس حجر القدس والتطريز</h3>
                  <p style={{ color: "#5a7585", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>
                    برودة ونعومة حجر القدس الصواني المصقول بأقدام ملايين الزوار عبر القرون، إلى جانب خيوط الحرير وتطريز الثوب الفلسطيني الفلاحي التراثي.
                  </p>
                </div>
              )}
              {sensoryTab === "sight" && (
                <div>
                  <h3 style={{ color: "#0e384c", margin: "0 0 8px" }}>ضياء الذهب وأفق القدس</h3>
                  <p style={{ color: "#5a7585", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>
                    المشهد الأيقوني لبريق الذهب على قبة الصخرة المشرفة مع تدرجات القاشاني الفيروزي، وأقواس وبوابات البلدة القديمة الحجرية مع شروق الشمس.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSensoryOpen(false)}
              style={{
                width: "100%",
                padding: "11px",
                background: "#f5a623",
                color: "#0e384c",
                border: "none",
                borderRadius: "100px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              العودة للاستكشاف
            </button>
          </div>
        </div>
      )}

      {/* Customer Feedback Modal */}
      <CustomerFeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      {/* AI Cultural Training Modal */}
      <AIFeedbackModal isOpen={aiFeedbackOpen} onClose={() => setAiFeedbackOpen(false)} topic={place.name} />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROUTES COMPONENT
   Strictly ONE single walking route card in center!
   Yellow & White theme matching Jeroam Logo.
───────────────────────────────────────────────────────────── */
export function Routes() {
  const { savedRoutes, saveItem, notify } = useApp();
  const { locale } = useI18n();
  const [routeIndex, setRouteIndex] = useState(0);
  const [stopIndex, setStopIndex] = useState(0);

  const route = JERUSALEM_ROUTES[routeIndex];
  const stop = route.stops[stopIndex];
  const isSaved = savedRoutes.includes(route.id);
  const isArabic = locale === "ar";
  const isHebrew = locale === "he";

  function nextStop() {
    if (stopIndex < route.stops.length - 1) {
      setStopIndex(stopIndex + 1);
    } else {
      setRouteIndex((r) => (r + 1) % JERUSALEM_ROUTES.length);
      setStopIndex(0);
    }
  }

  function prevStop() {
    if (stopIndex > 0) {
      setStopIndex(stopIndex - 1);
    } else {
      setRouteIndex((r) => (r - 1 + JERUSALEM_ROUTES.length) % JERUSALEM_ROUTES.length);
      setStopIndex(0);
    }
  }

  return (
    <main
      style={{
        height: "calc(100vh - 64px)",
        width: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #ffffff 0%, #faf8f2 50%, #f7f2e6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(12px, 2vh, 24px)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Route Switcher Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "clamp(10px, 1.8vh, 18px)" }}>
        {JERUSALEM_ROUTES.map((r, i) => {
          const active = i === routeIndex;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRouteIndex(i);
                setStopIndex(0);
              }}
              style={{
                padding: "7px 18px",
                borderRadius: "100px",
                background: active ? "#f5a623" : "#ffffff",
                color: "#0e384c",
                border: `1.5px solid ${active ? "#f5a623" : "rgba(245,166,35,0.3)"}`,
                fontSize: "0.82rem",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(14,56,76,0.04)",
              }}
            >
              {isArabic ? r.titleAr : r.title}
            </button>
          );
        })}
      </div>

      {/* ── EXACTLY ONE SINGLE CARD ON SCREEN ── */}
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          background: "#ffffff",
          border: "2px solid rgba(245,166,35,0.38)",
          borderRadius: "24px",
          boxShadow: "0 18px 50px rgba(14,56,76,0.08)",
          padding: "clamp(20px, 3vh, 30px)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              background: "rgba(245,166,35,0.14)",
              color: "#f5a623",
              border: "1px solid rgba(245,166,35,0.3)",
              borderRadius: "100px",
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {isArabic
              ? `المحطة 0${stopIndex + 1} من 0${route.stops.length}`
              : isHebrew
              ? `תחנה 0${stopIndex + 1} מתוך 0${route.stops.length}`
              : `Stop 0${stopIndex + 1} of 0${route.stops.length}`}
          </span>
          <span style={{ fontSize: "0.78rem", color: "#5a7585", fontWeight: 600 }}>
            {route.duration} · {route.distance}
          </span>
        </div>

        <div>
          <h1
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(1.4rem, 3vw, 1.85rem)",
              fontWeight: 400,
              color: "#0e384c",
              margin: "0 0 4px 0",
              lineHeight: 1.2,
            }}
          >
            {isArabic ? stop.titleAr : stop.title}
          </h1>
          <div style={{ color: "#f5a623", fontFamily: "'Georgia', serif", fontSize: "0.95rem", fontWeight: 700 }}>
            {isArabic ? stop.title : stop.titleAr}
          </div>
        </div>

        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#5a7585", margin: 0 }}>
          {stop.desc}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#f5a623", fontWeight: 600 }}>
          <Clock size={14} />
          <span>
            {isArabic
              ? `الوقت المقترح للوقوف: ${stop.time}`
              : isHebrew
              ? `משך עצירה מומלץ: ${stop.time}`
              : `Suggested stop: ${stop.time}`}
          </span>
        </div>

        {/* Buttons: Exactly 2 buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          <button
            type="button"
            onClick={prevStop}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              background: "#ffffff",
              border: "1.5px solid rgba(14,56,76,0.2)",
              borderRadius: "100px",
              color: "#0e384c",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={16} />
            <span>{isArabic ? "السابق" : isHebrew ? "הקודם" : "Previous"}</span>
          </button>

          <button
            type="button"
            onClick={nextStop}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 22px",
              background: "linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
              border: "none",
              borderRadius: "100px",
              color: "#0e384c",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(245,166,35,0.35)",
            }}
          >
            <span>{isArabic ? "المحطة التالية" : isHebrew ? "התחנה הבאה" : "Next Stop"}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
