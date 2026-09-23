"use client";

import { useState } from "react";
import {
  Star,
  MessageSquare,
  Sparkles,
  Heart,
  Send,
  X,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  BookOpen
} from "lucide-react";
import { useI18n } from "./i18n";

/* ─────────────────────────────────────────────────────────────
   CUSTOMER FEEDBACK & JERUSALEM GUESTBOOK (جدارية زوار القدس)
   Yellow & White Theme matching Jeroam Logo
───────────────────────────────────────────────────────────── */

export interface VisitorReview {
  id: string;
  author: string;
  from: string;
  rating: number;
  date: string;
  comment: string;
  category: string;
}

const INITIAL_REVIEWS: VisitorReview[] = [
  {
    id: "rev-1",
    author: "طارق المقدسي",
    from: "القدس، فلسطين",
    rating: 5,
    date: "اليوم",
    comment: "تصميم أصفر وأبيض بسيط وراقي جداً يليق بمدينة القدس، والتركيز على مكان واحد بكل شاشة خلى التصفح ممتع وسريع.",
    category: "Heritage"
  },
  {
    id: "rev-2",
    author: "Nour Al-Huda",
    from: "Amman, Jordan",
    rating: 5,
    date: "Yesterday",
    comment: "The 5-senses roam and Damascus Gate storytelling are incredible. Best hackathon concept for Jerusalem.",
    category: "Atmosphere"
  },
  {
    id: "rev-3",
    author: "Zaid K.",
    from: "London, UK",
    rating: 5,
    date: "2 days ago",
    comment: "Clean white & gold look matching the logo. The single card per page makes everything so simple and focused.",
    category: "Local Food"
  }
];

export function CustomerFeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { locale } = useI18n();
  const isArabic = locale === "ar";

  const [reviews, setReviews] = useState<VisitorReview[]>(INITIAL_REVIEWS);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;

    const newRev: VisitorReview = {
      id: "rev-" + Date.now(),
      author: name.trim() || (isArabic ? "زائر محب للقدس" : "Jerusalem Visitor"),
      from: city.trim() || (isArabic ? "فلسطين" : "Palestine"),
      rating,
      date: isArabic ? "الآن" : "Just now",
      comment: comment.trim(),
      category: "Visitor Note"
    };

    setReviews([newRev, ...reviews]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment("");
    }, 2500);
  }

  return (
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
      onClick={onClose}
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
          padding: "clamp(24px, 4vh, 36px)",
          position: "relative",
          boxShadow: "0 24px 60px rgba(14,56,76,0.18)",
          color: "#0e384c",
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
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

        {/* Modal Title */}
        <div style={{ marginBottom: "20px" }}>
          <span
            style={{
              color: "#f5a623",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Heart size={15} style={{ color: "#f5a623" }} />
            {isArabic ? "سجل زوار القدس الشريف" : "Jerusalem Guestbook & Reviews"}
          </span>
          <h2
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              margin: "6px 0 6px",
              color: "#0e384c",
            }}
          >
            {isArabic ? "شاركنا انطباعك ورسالتك للقدس" : "Leave Your Impression & Feedback"}
          </h2>
          <p style={{ color: "#5a7585", fontSize: "0.88rem", margin: 0 }}>
            {isArabic
              ? "صوتك يوثق تجربة الزوار ويدعم حفظ التراث المقدسي الأصيل."
              : "Your feedback helps showcase authentic Jerusalem culture to the world."}
          </p>
        </div>

        {/* Feedback Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fdfbf7",
            border: "1px solid rgba(245,166,35,0.25)",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "24px",
          }}
        >
          {submitted ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#f5a623",
                fontWeight: 700,
                fontSize: "0.95rem",
                padding: "14px 0",
              }}
            >
              <CheckCircle size={22} style={{ color: "#f5a623" }} />
              <span>
                {isArabic
                  ? "شكراً لك! تم نشر رسالتك في سجل زوار القدس."
                  : "Thank you! Your message has been inscribed on the Jerusalem Guestbook."}
              </span>
            </div>
          ) : (
            <>
              {/* Star Rating Picker */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.85rem", color: "#0e384c", fontWeight: 600 }}>
                  {isArabic ? "تقييم التجربة:" : "Rate your experience:"}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "2px",
                        cursor: "pointer",
                        color: (hoverRating || rating) >= star ? "#f5a623" : "#d8d3c5",
                        transition: "color 0.15s",
                      }}
                    >
                      <Star size={22} fill={(hoverRating || rating) >= star ? "#f5a623" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder={isArabic ? "اسمك الكريـم" : "Your Name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(245,166,35,0.35)",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    color: "#0e384c",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder={isArabic ? "المدينة / البلد" : "City / Country"}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(245,166,35,0.35)",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    color: "#0e384c",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Textarea */}
              <textarea
                required
                rows={3}
                placeholder={
                  isArabic
                    ? "اكتب انطباعك، نصيحة لزوار القدس، أو رسالة محبة للمدينة العتيقة..."
                    : "Write your feedback, tips for travelers, or a message to Jerusalem..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid rgba(245,166,35,0.35)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#0e384c",
                  fontSize: "0.88rem",
                  resize: "vertical",
                  outline: "none",
                  marginBottom: "12px",
                  fontFamily: "inherit",
                }}
              />

              <button
                type="submit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 24px",
                  background: "linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
                  color: "#0e384c",
                  border: "none",
                  borderRadius: "100px",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(245,166,35,0.35)",
                }}
              >
                <Send size={15} />
                <span>{isArabic ? "إرسال الانطباع للسجل" : "Inscribe on Guestbook"}</span>
              </button>
            </>
          )}
        </form>

        {/* Existing Reviews List */}
        <div>
          <h3
            style={{
              fontSize: "0.88rem",
              color: "#f5a623",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            {isArabic ? "رسائل وانطباعات الزوار" : "Recent Traveler Messages"}
          </h3>
          <div style={{ display: "grid", gap: "10px" }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(245,166,35,0.25)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  boxShadow: "0 2px 8px rgba(14,56,76,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ color: "#0e384c", fontSize: "0.92rem" }}>{rev.author}</strong>
                    <span style={{ color: "#5a7585", fontSize: "0.78rem" }}>
                      ({rev.from})
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "2px", color: "#f5a623" }}>
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={13} fill="#f5a623" />
                    ))}
                  </div>
                </div>
                <p style={{ margin: "0 0 6px", color: "#334e5c", fontSize: "0.86rem", lineHeight: 1.55 }}>
                  {rev.comment}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#f5a623", fontSize: "0.74rem", fontWeight: 600 }}>
                  <span>{rev.category}</span>
                  <span style={{ color: "#8b9fa8" }}>{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI FEEDBACK & CULTURAL TRAINING SYSTEM (تغذية الحكواتي الذكي)
   Yellow & White Theme matching Jeroam Logo
───────────────────────────────────────────────────────────── */

export function AIFeedbackModal({
  isOpen,
  onClose,
  topic = "Jerusalem Al-Quds Heritage"
}: {
  isOpen: boolean;
  onClose: () => void;
  topic?: string;
}) {
  const { locale } = useI18n();
  const isArabic = locale === "ar";

  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(null);
  const [tag, setTag] = useState<string>("");
  const [localMemory, setLocalMemory] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2400);
  }

  const tags = isArabic
    ? ["دقة تاريخية عالية", "نبرة مقدسية أصيلة", "معلومة تحتاج تصحيح", "اقتراح حكاية محلية"]
    : ["High Accuracy", "Authentic Tone", "Needs Correction", "Local Story Suggestion"];

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          border: "2px solid rgba(245,166,35,0.4)",
          borderRadius: "24px",
          maxWidth: "620px",
          width: "100%",
          padding: "clamp(24px, 4vh, 36px)",
          position: "relative",
          boxShadow: "0 24px 60px rgba(14,56,76,0.18)",
          color: "#0e384c",
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
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

        <div style={{ marginBottom: "18px" }}>
          <span
            style={{
              color: "#f5a623",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={15} style={{ color: "#f5a623" }} />
            {isArabic ? "تدريب حكواتي القدس الذكي" : "AI Hakawati Cultural Feedback"}
          </span>
          <h2
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
              margin: "6px 0 6px",
              color: "#0e384c",
            }}
          >
            {isArabic ? "كيف كانت إجابة الحكواتي؟" : "How was the AI response?"}
          </h2>
          <p style={{ color: "#5a7585", fontSize: "0.85rem", margin: 0 }}>
            {isArabic
              ? "ملاحظاتك تساعد في تدريب النموذج على حفظ الرواية الشفوية الفلسطينية بدقة وأصالة."
              : "Your feedback aligns the AI to preserve authentic Palestinian oral history."}
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "26px 10px", color: "#f5a623" }}>
            <CheckCircle size={44} style={{ margin: "0 auto 12px", display: "block" }} />
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 6px", color: "#0e384c" }}>
              {isArabic ? "تم استلام ملاحظتك بنجاح!" : "Feedback Received!"}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "#5a7585", margin: 0 }}>
              {isArabic
                ? "أضيفت حكايتك إلى ذاكرة الحكواتي لتعزيز أصالة السرد المقدسي."
                : "Your contribution has been indexed to enrich the cultural memory."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" }}>
              <span style={{ fontSize: "0.85rem", color: "#0e384c", fontWeight: 600 }}>
                {isArabic ? "التقييم العام:" : "Rating:"}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSentiment("positive")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "100px",
                    background: sentiment === "positive" ? "#f5a623" : "#f8f6f0",
                    color: "#0e384c",
                    border: `1px solid ${sentiment === "positive" ? "#f5a623" : "rgba(245,166,35,0.3)"}`,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <ThumbsUp size={15} />
                  <span>{isArabic ? "دقيقة وأصيلة" : "Accurate"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSentiment("negative")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "100px",
                    background: sentiment === "negative" ? "#ffe8e6" : "#f8f6f0",
                    color: sentiment === "negative" ? "#d9534f" : "#0e384c",
                    border: `1px solid ${sentiment === "negative" ? "#d9534f" : "rgba(245,166,35,0.3)"}`,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <ThumbsDown size={15} />
                  <span>{isArabic ? "بحاجة لتصحيح" : "Needs Work"}</span>
                </button>
              </div>
            </div>

            {/* Quick Tag Badges */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "0.82rem", color: "#5a7585", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                {isArabic ? "ما النقطة الأبرز؟" : "What stands out?"}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "100px",
                      background: tag === t ? "rgba(245,166,35,0.18)" : "#f8f6f0",
                      color: tag === t ? "#f5a623" : "#0e384c",
                      border: `1px solid ${tag === t ? "#f5a623" : "rgba(245,166,35,0.25)"}`,
                      fontSize: "0.8rem",
                      fontWeight: tag === t ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Teach the AI Input */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.85rem",
                  color: "#f5a623",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                <BookOpen size={15} />
                <span>
                  {isArabic
                    ? "علّم الحكواتي: قصة محلية أو تفصيل مقدسي أصيل:"
                    : "Teach the AI: Share a local memory or detail:"}
                </span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  isArabic
                    ? "مثال: هذا المحل له خلطة بهارات متوارثة منذ 100 عام في خان الزيت..."
                    : "e.g., An authentic detail or family memory about this place..."
                }
                value={localMemory}
                onChange={(e) => setLocalMemory(e.target.value)}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid rgba(245,166,35,0.35)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#0e384c",
                  fontSize: "0.85rem",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 24px",
                background: "linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
                color: "#0e384c",
                border: "none",
                borderRadius: "100px",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(245,166,35,0.35)",
              }}
            >
              <Send size={15} />
              <span>{isArabic ? "تغذية الحكواتي بالمعلومة" : "Submit AI Feedback"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
