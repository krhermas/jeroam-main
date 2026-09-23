import type { Claim, CulturalRoute, Place } from "./contracts";

/**
 * Localized catalog copy is deliberately conservative.  Imported OSM records
 * use a small, deterministic sentence template; translating only that
 * template keeps the claim identical while avoiding invented tourism copy.
 * Curated route copy is translated here because it is Jeroam editorial text,
 * while factual stop claims continue to come from their named sources.
 */
type CatalogLocale = "en" | "ar" | "he" | string | null | undefined;

const categoryLabels: Record<"ar" | "he", Record<string, string>> = {
  ar: {
    Architecture: "معلم معماري", Culture: "موقع ثقافي", Heritage: "موقع تراثي",
    History: "موقع تاريخي", Markets: "سوق", Museums: "متحف", "Parks & public spaces": "حديقة أو مساحة عامة",
    "Religious sites": "موقع ديني", Restaurants: "مطعم أو مقهى", Transport: "نقطة نقل", Viewpoints: "نقطة إطلالة",
    Art: "موقع فني", Food: "موقع للطعام", Shopping: "موقع للتسوق", Walking: "مسار للمشي", "Local experiences": "تجربة محلية",
  },
  he: {
    Architecture: "אתר אדריכלות", Culture: "אתר תרבות", Heritage: "אתר מורשת", History: "אתר היסטורי",
    Markets: "שוק", Museums: "מוזיאון", "Parks & public spaces": "פארק או מרחב ציבורי", "Religious sites": "אתר דתי",
    Restaurants: "מסעדה או בית קפה", Transport: "נקודת תחבורה", Viewpoints: "תצפית", Art: "אתר אמנות", Food: "מקום אוכל",
    Shopping: "מקום לקניות", Walking: "מסלול הליכה", "Local experiences": "חוויה מקומית",
  },
};

type RouteCopy = { title: string; description: string };
const routeCopy: Record<string, { ar: RouteCopy; he: RouteCopy }> = {
  "old-city-in-layers": { ar: { title: "البلدة القديمة، طبقات من الزمن", description: "رحلة من بوابة المدينة إلى القلعة والشوارع القديمة ومكان للعبادة المسيحية." }, he: { title: "העיר העתיקה, בשכבות", description: "מסע משער העיר אל המצודה, הרחובות העתיקים ומקום פולחן נוצרי." } },
  "gates-and-streets": { ar: { title: "بوابات وشوارع وحياة يومية", description: "مسار يصل بين البوابة الشمالية والكاردو والسوق المعاصر في محاني يهودا." }, he: { title: "שערים, רחובות וחיי יום־יום", description: "חיבור בין השער הצפוני, הקארדו והשוק העכשווי מחנה יהודה." } },
  "beyond-the-walls": { ar: { title: "حجر وأفق وطاحونة", description: "نزهة معمارية من طاحونة مونتيفيوري إلى باب يافا وبرج داود." }, he: { title: "אבן, קו רקיע וטחנת רוח", description: "מסלול אדריכלי מטחנת מונטיפיורי אל שער יפו ומגדל דוד." } },
  "gates-of-the-old-city": { ar: { title: "بوابات البلدة القديمة", description: "مسار موثق بالمصادر بين بوابتين من بوابات المدينة والكاردو وكنيسة القيامة." }, he: { title: "שערי העיר העתיקה", description: "מסלול מבוסס מקור בין שני שערי עיר, הקארדו וכנסיית הקבר." } },
  "stone-and-story": { ar: { title: "حجر وحكاية", description: "من يمين موشيه إلى البلدة القديمة، في مسار قصير يجمع العمارة والبوابة التاريخية والمتحف." }, he: { title: "אבן וסיפור", description: "מימין משה אל העיר העתיקה, ברצף קצר של אדריכלות, שער היסטורי ומוזיאון." } },
  "citadel-and-gate": { ar: { title: "من البوابة إلى القلعة", description: "نزهة أولى قصيرة من باب يافا إلى متحف برج داود داخل القلعة التاريخية." }, he: { title: "מהשער אל המצודה", description: "מסלול ראשון וקצר משער יפו אל מוזיאון מגדל דוד שבתוך המצודה ההיסטורית." } },
  "gate-to-cardo": { ar: { title: "من الباب إلى الكاردو", description: "مقدمة قصيرة إلى البلدة القديمة تربط باب يافا بالشارع المكشوف في الحي اليهودي." }, he: { title: "מהשער אל הקארדו", description: "מבוא קצר לעיר העתיקה, משער יפו אל הרחוב החשוף ברובע היהודי." } },
  "gates-and-quarters": { ar: { title: "البوابات والأحياء", description: "مسار من الشمال إلى الغرب عبر بوابات القدس التاريخية وأحيائها المتجاورة." }, he: { title: "שערים ורבעים", description: "רצף מצפון למערב דרך שעריה ההיסטוריים של ירושלים והרבעים הסמוכים." } },
  "christian-heritage-walk": { ar: { title: "مسار التراث المسيحي", description: "مسار موثق يصل بين كنيسة القيامة ومعالم البلدة القديمة المرتبطة بالتراث المسيحي." }, he: { title: "מסלול המורשת הנוצרית", description: "מסלול מבוסס מקור בין כנסיית הקבר ואתרי העיר העתיקה הקשורים למורשת הנוצרית." } },
  "mosques-and-city-gates": { ar: { title: "المساجد وبوابات المدينة", description: "مسار في البلدة القديمة يربط البوابات المسجلة بالمصادر والمعالم القريبة منها." }, he: { title: "מסגדים ושערי העיר", description: "מסלול בעיר העתיקה המחבר שערים המתועדים במקורות ואתרים סמוכים." } },
  "jewish-quarter-archaeology": { ar: { title: "آثار الحي اليهودي", description: "مسار قصير في البلدة القديمة يجمع القلعة والكاردو ومعالم الحي اليهودي الأثرية." }, he: { title: "ארכאולוגיה ברובע היהודי", description: "מסלול קצר בעיר העתיקה המחבר את המצודה, הקארדו ואתרי הרובע היהודי." } },
  "old-city-museums-and-streets": { ar: { title: "متاحف وشوارع البلدة القديمة", description: "مسار يبدأ عند مدخل البلدة القديمة ويمر عبر متاحف وشوارع موثقة بالمصادر." }, he: { title: "מוזיאונים ורחובות בעיר העתיקה", description: "מסלול מהכניסה לעיר העתיקה דרך מוזיאונים ורחובות המתועדים במקורות." } },
  "museums-and-modern-history": { ar: { title: "المتاحف والتاريخ الحديث", description: "مسار من الغرب إلى الوسط يصل بين مواقع الذاكرة الوطنية ومؤسسات ثقافية موثقة." }, he: { title: "מוזיאונים והיסטוריה מודרנית", description: "מסלול ממערב למרכז המחבר אתרי זיכרון לאומיים ומוסדות תרבות מתועדים." } },
  "city-center-culture": { ar: { title: "ثقافة وسط المدينة", description: "مسار ثقافي في قلب القدس يصل بين صالات وموسيقى ومؤسسات ثقافية موثقة." }, he: { title: "תרבות במרכז העיר", description: "רצף תרבותי במרכז ירושלים בין גלריות, מוזיקה ומוסדות תרבות מתועדים." } },
  "market-and-music": { ar: { title: "السوق والموسيقى", description: "ابدأ من سوق محاني يهودا ثم واصل إلى مواقع موسيقية موثقة بالمصادر." }, he: { title: "שוק ומוזיקה", description: "מתחילים במחנה יהודה וממשיכים אל אתרי מוזיקה המתועדים במקורות." } },
  "yemin-moshe-and-sultan-pool": { ar: { title: "يمين موشيه وبركة السلطان", description: "مسار جنوب غربي يمر بالطاحونة ومركز للموسيقى ومعالم موثقة قرب بركة السلطان." }, he: { title: "ימין משה ובריכת הסולטן", description: "מסלול מדרום־מערב דרך הטחנה, מרכז מוזיקה ואתרים מתועדים ליד בריכת הסולטן." } },
  "jerusalem-ridge-views": { ar: { title: "إطلالات تلال القدس", description: "مسار أطول من الجنوب إلى الوسط يصل بين نقاط إطلالة موثقة في المدينة." }, he: { title: "תצפיות רכס ירושלים", description: "מסלול ארוך יותר מדרום למרכז בין נקודות תצפית מתועדות בעיר." } },
  "family-day-of-discovery": { ar: { title: "يوم عائلي للاكتشاف", description: "خيار ليوم كامل يجمع متحفًا تفاعليًا ومخطوطات ومعالم مناسبة للاستكشاف العائلي." }, he: { title: "יום גילוי למשפחה", description: "אפשרות ליום מלא המשלבת מוזיאון חווייתי, כתבי יד ואתרים שמתאימים לגילוי משפחתי." } },
  "modern-jerusalem-ideas": { ar: { title: "أفكار من القدس الحديثة", description: "مسار غرب الوسط يصل بين مؤسسات وطنية ومعالم ثقافية موثقة." }, he: { title: "רעיונות מירושלים המודרנית", description: "רצף ממערב למרכז בין מוסדות לאומיים ואתרי תרבות מתועדים." } },
  "markets-and-food-stops": { ar: { title: "الأسواق ومحطات الطعام", description: "مسار موثق يبدأ من السوق ويمر بمواقع طعام في وسط المدينة؛ البائعون الأفراد غير موثقين هنا." }, he: { title: "שווקים ועצירות אוכל", description: "מסלול מבוסס מקור מהשוק דרך אתרי אוכל במרכז העיר; ספקים יחידים אינם מתועדים כאן." } },
};

const placeCopy: Record<string, { ar: string; he: string }> = {
  "jaffa-gate": { ar: "بوابة غربية إلى البلدة القديمة.", he: "שער מערבי אל העיר העתיקה." },
  "tower-of-david": { ar: "قصة القدس داخل قلعتها التاريخية.", he: "סיפורה של ירושלים בתוך המצודה ההיסטורית שלה." },
  "mahane-yehuda": { ar: "تتبّعوا نكهات السوق.", he: "עוקבים אחרי טעמי השוק." },
  "shrine-of-book": { ar: "موطن مخطوطات قديمة وعمارة حديثة.", he: "בית לכתבי יד עתיקים ולאדריכלות מודרנית." },
  "the-cardo": { ar: "اقرأوا المدينة عبر شارعها القديم.", he: "קוראים את העיר דרך הרחוב העתיק שלה." },
  "holy-sepulchre": { ar: "مكان للعبادة المسيحية.", he: "מקום של תפילה נוצרית." },
  "montefiore-windmill": { ar: "معلم خارج أسوار المدينة.", he: "נקודת ציון מעבר לחומות העיר." },
  "damascus-gate": { ar: "التقوا بالبلدة القديمة من جهة الشمال.", he: "פוגשים את העיר העתיקה מצפון." },
};
const placeNameCopy: Record<string, { ar: string; he: string }> = {
  "Artist's House": { ar: "بيت الفنانين", he: "בית האמנים" },
  "Church of Holy Sepulchre": { ar: "كنيسة القيامة", he: "כנסיית הקבר" },
  "Church of the Holy Sepulchre": { ar: "كنيسة القيامة", he: "כנסיית הקבר" },
  "Damascus Gate": { ar: "باب العامود", he: "שער שכם" },
  "Haas Promenade": { ar: "ممشى هاس", he: "טיילת האס" },
  "Jaffa Gate": { ar: "باب الخليل", he: "שער יפו" },
  "Mahane Yehuda Market": { ar: "سوق محاني يهودا", he: "שוק מחנה יהודה" },
  "Montefiore Windmill": { ar: "طاحونة مونتيفيوري", he: "טחנת מונטיפיורי" },
  "Romanian Orthodox Church from Jerusalem": { ar: "الكنيسة الأرثوذكسية الرومانية في القدس", he: "הכנסייה האורתודוקסית הרומנית בירושלים" },
  "Shrine of the Book": { ar: "مزار الكتاب", he: "היכל הספר" },
  "St. George's Cathedral": { ar: "كاتدرائية القديس جورج", he: "קתדרלת סנט ג׳ורג׳" },
  "St. Paul": { ar: "كنيسة القديس بولس", he: "כנסיית סנט פול" },
  "The Cardo": { ar: "كاردو", he: "הקארדו" },
  "Tower of David Museum": { ar: "متحف برج داود", he: "מוזיאון מגדל דוד" },
  "Western Wall Observation Point": { ar: "نقطة مشاهدة حائط البراق", he: "תצפית על הכותל המערבי" },
};

const claimCopy: Record<string, { ar: string; he: string }> = {
  "Jaffa Gate stands on the western side of Jerusalem’s Old City.": { ar: "تقع بوابة يافا على الجانب الغربي من البلدة القديمة في القدس.", he: "שער יפו נמצא בצדה המערבי של העיר העתיקה בירושלים." },
  "The gate belongs to the sixteenth-century Ottoman city walls.": { ar: "تنتمي البوابة إلى أسوار المدينة العثمانية التي تعود إلى القرن السادس عشر.", he: "השער הוא חלק מחומות העיר העות׳מאניות מן המאה השש עשרה." },
  "The Tower of David Museum is housed inside Jerusalem’s citadel.": { ar: "يقع متحف برج داود داخل قلعة القدس.", he: "מוזיאון מגדל דוד שוכן בתוך מצודת ירושלים." },
  "Its exhibitions explore Jerusalem’s history and its importance to Judaism, Christianity and Islam.": { ar: "تستكشف معارضه تاريخ القدس وأهميتها لليهودية والمسيحية والإسلام.", he: "התערוכות בו עוסקות בתולדות ירושלים ובחשיבותה ליהדות, לנצרות ולאסלאם." },
  "Mahane Yehuda is a Jerusalem market with fresh produce, food stalls and shops.": { ar: "محاني يهودا سوق في القدس يضم منتجات طازجة وأكشاك طعام ومتاجر.", he: "מחנה יהודה הוא שוק ירושלמי עם תוצרת טרייה, דוכני אוכל וחנויות." },
  "The market is also a place for cafés, bars and cultural activity.": { ar: "السوق أيضًا مكان للمقاهي والحانات والأنشطة الثقافية.", he: "השוק הוא גם מקום לבתי קפה, לברים ולפעילות תרבותית." },
  "The Shrine of the Book at the Israel Museum was built to house the first seven scrolls discovered at Qumran in 1947.": { ar: "بُني مزار الكتاب في متحف إسرائيل ليضم اللفائف السبع الأولى التي اكتُشفت في قمران عام 1947.", he: "היכל הספר במוזיאון ישראל נבנה כדי לשכן את שבע המגילות הראשונות שהתגלו בקומראן ב־1947." },
  "Designed by Armand Bartos and Frederick Kiesler, the building was dedicated in 1965.": { ar: "صمّم المبنى أرماند بارتوس وفريدريك كيسلر، ودُشّن عام 1965.", he: "הבניין תוכנן בידי ארמנד ברטוס ופרדריק קיזלר ונחנך בשנת 1965." },
  "The northern section of Jerusalem’s Cardo dates to the Roman period; the southern section was built in the sixth century, during the Byzantine period.": { ar: "يعود القسم الشمالي من كاردو القدس إلى العصر الروماني؛ أما القسم الجنوبي فبُني في القرن السادس خلال العصر البيزنطي.", he: "החלק הצפוני של הקארדו הירושלמי מתוארך לתקופה הרומית; החלק הדרומי נבנה במאה השישית, בתקופה הביזנטית." },
  "Excavations exposed sections of the street and columns in the Jewish Quarter.": { ar: "كشفت الحفريات أجزاء من الشارع وأعمدة في الحي اليهودي.", he: "בחפירות נחשפו חלקים מן הרחוב ועמודים ברובע היהודי." },
  "Christians venerate the Church of the Holy Sepulchre as the place associated with Jesus’ crucifixion, burial and resurrection.": { ar: "يوقّر المسيحيون كنيسة القيامة بوصفها المكان المرتبط بصلب يسوع ودفنه وقيامته.", he: "נוצרים מוקירים את כנסיית הקבר כמקום הקשור לצליבתו, לקבורתו ולתחייתו של ישוע." },
  "The church is in Jerusalem’s Old City.": { ar: "تقع الكنيسة في البلدة القديمة في القدس.", he: "הכנסייה נמצאת בעיר העתיקה בירושלים." },
  "The Montefiore Windmill was built in 1857, funded by the philanthropist Moses Montefiore.": { ar: "بُنيت طاحونة مونتيفيوري عام 1857 بتمويل من المحسن موسى مونتيفيوري.", he: "טחנת מונטיפיורי נבנתה בשנת 1857 במימון הנדבן משה מונטיפיורי." },
  "It was designed as a flour mill.": { ar: "صُمّمت لتكون طاحونة دقيق.", he: "היא תוכננה כטחנת קמח." },
  "Damascus Gate is a northern gate in the sixteenth-century Ottoman walls of Jerusalem.": { ar: "باب العامود بوابة شمالية في أسوار القدس العثمانية التي تعود إلى القرن السادس عشر.", he: "שער שכם הוא שער צפוני בחומות ירושלים העות׳מאניות מן המאה השש עשרה." },
  "Its Arabic name, Bab al-Amud, means ‘Gate of the Pillar’.": { ar: "اسمها العربي باب العامود يعني «بوابة العمود».", he: "שמה הערבי, באב אל־עמוד, פירושו „שער העמוד”." },
};

function language(locale: CatalogLocale): "ar" | "he" | "en" {
  return locale === "ar" ? "ar" : locale === "he" ? "he" : "en";
}

export function localizeCatalogText(text: string | null | undefined, locale: CatalogLocale): string {
  if (!text || language(locale) === "en") return text ?? "";
  const lang = language(locale);
  const labels = lang === "en" ? {} : categoryLabels[lang];
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) {
    const translated = sentences.map(sentence => localizeCatalogText(sentence, locale));
    if (translated.some((sentence, index) => sentence !== sentences[index])) return translated.join(" ");
  }
  const exact: Record<string, { ar: string; he: string }> = {
    "Planning assessment: allow for uneven paving, slopes and steps. Step-free access has not been verified.": { ar: "تقدير للتخطيط: توقّعوا أرضيات غير مستوية ومنحدرات ودرجات. لم يتم التحقق من توفر مسار بلا درجات.", he: "הערכת תכנון: יש להביא בחשבון ריצוף לא אחיד, שיפועים ומדרגות. נגישות ללא מדרגות לא אומתה." },
    "Planning assessment: a longer urban walk with uneven paving and busy streets; allow additional travel time.": { ar: "تقدير للتخطيط: نزهة حضرية أطول مع أرضيات غير مستوية وشوارع مزدحمة؛ اتركوا وقتًا إضافيًا للتنقل.", he: "הערכת תכנון: הליכה עירונית ארוכה יותר עם ריצוף לא אחיד ורחובות עמוסים; השאירו זמן נוסף לדרך." },
    "Planning assessment: slopes and possible steps. This route has not been audited for wheelchair access.": { ar: "تقدير للتخطيط: توجد منحدرات وقد توجد درجات. لم تتم مراجعة هذا المسار من ناحية استخدام الكراسي المتحركة.", he: "הערכת תכנון: יש שיפועים וייתכנו מדרגות. המסלול לא נבדק לנגישות לכיסאות גלגלים." },
    "The Old City of Jerusalem and its Walls was inscribed on UNESCO’s World Heritage List in 1981.": { ar: "أُدرجت البلدة القديمة في القدس وأسوارها على قائمة التراث العالمي لليونسكو عام 1981.", he: "העיר העתיקה בירושלים וחומותיה נרשמו ברשימת המורשת העולמית של אונסק״ו בשנת 1981." },
    "Stops are linked to the Jeroam catalog; the sequence is an editorial planning suggestion, not an operator-run tour.": { ar: "ترتبط المحطات بكتالوج جيروَم؛ والتسلسل اقتراح تحريري للتخطيط وليس جولة يديرها مشغّل.", he: "התחנות מקושרות לקטלוג ג׳ירואם; זהו רצף עריכתי לתכנון ולא סיור שמופעל בידי חברה." },
    "Explore how the museum connects different periods.": { ar: "استكشفوا كيف يربط المتحف بين فترات مختلفة.", he: "גלו כיצד המוזיאון מחבר בין תקופות שונות." },
  };
  if (exact[text] && lang !== "en") return exact[text][lang];
  if (claimCopy[text] && lang !== "en") return claimCopy[text][lang];
  const prompt = text.match(/^Pause here and open the source-backed place record for (.+)\.$/);
  if (prompt) {
    const placeName = lang === "en" ? prompt[1] : placeNameCopy[prompt[1]]?.[lang] ?? prompt[1];
    return lang === "ar" ? `توقّفوا هنا وافتحوا سجل المكان الموثّق بالمصادر لـ «${placeName}».` : `עצרו כאן ופתחו את רשומת המקום מבוססת המקור של „${placeName}”.`;
  }
  const prefixes: Array<[RegExp, string, string]> = [
    [/^Begin at (.+)\.$/, "ابدؤوا من $1.", "התחילו ב־$1."],
    [/^Begin with (.+)\.$/, "ابدؤوا بـ $1.", "התחילו ב־$1."],
    [/^Start at (.+)\.$/, "ابدؤوا من $1.", "התחילו ב־$1."],
    [/^Start with (.+)\.$/, "ابدؤوا بـ $1.", "התחילו ב־$1."],
    [/^End at (.+)\.$/, "اختتموا عند $1.", "סיימו ב־$1."],
    [/^End with (.+)\.$/, "اختتموا بـ $1.", "סיימו ב־$1."],
    [/^Finish at (.+)\.$/, "اختتموا عند $1.", "סיימו ב־$1."],
    [/^Follow (.+)\.$/, "اتبعوا $1.", "המשיכו לאורך $1."],
    [/^Read (.+)\.$/, "اقرؤوا $1.", "קראו את $1."],
    [/^Explore (.+)\.$/, "استكشفوا $1.", "גלו את $1."],
    [/^Consider (.+)\.$/, "فكّروا في $1.", "חשבו על $1."],
    [/^Cross (.+)\.$/, "اعبروا $1.", "עברו דרך $1."],
    [/^Look for (.+)\.$/, "ابحثوا عن $1.", "חפשו את $1."],
    [/^Notice (.+)\.$/, "لاحظوا $1.", "שימו לב ל־$1."],
  ];
  for (const [pattern, arPrefix, hePrefix] of prefixes) {
    const match = text.match(pattern);
    if (match) return (lang === "ar" ? arPrefix : hePrefix).replace("$1", match[1]);
  }
  if (text === "Leave room for a food stop of your choosing; individual vendors are not verified.") return lang === "ar" ? "اتركوا وقتًا لمحطة طعام تختارونها؛ البائعون الأفراد غير موثّقين." : "השאירו מקום לעצירת אוכל לבחירתכם; ספקים יחידים אינם מאומתים.";
  let match = text.match(/^A source-listed (.+) in Jerusalem\. Visitor details should be checked with the linked source\.$/);
  if (match) return lang === "ar" ? `مكان ${labels[match[1]] ?? match[1]} مُدرج في القدس. يُرجى مراجعة المصدر المرتبط قبل الزيارة.` : `מקור מתעד ${labels[match[1]] ?? match[1]} בירושלים. יש לבדוק את המקור המקושר לפני הביקור.`;
  match = text.match(/^OpenStreetMap lists “(.+)” as a (.+) in Jerusalem\.$/);
  if (match) return lang === "ar" ? `يسجّل OpenStreetMap «${match[1]}» بوصفه ${labels[match[2]] ?? match[2]} في القدس.` : `OpenStreetMap מציג את „${match[1]}” כ${labels[match[2]] ?? match[2]} בירושלים.`;
  if (/^The catalog record comes from OpenStreetMap\./.test(text)) return lang === "ar" ? "سجل الكتالوج مصدره OpenStreetMap." : "רשומת הקטלוג מגיעה מ־OpenStreetMap.";
  if (/^Address and opening hours are not verified here; check the source before visiting\.$/.test(text)) return lang === "ar" ? "العنوان وساعات العمل غير موثّقين هنا؛ راجعوا المصدر قبل الزيارة." : "הכתובת ושעות הפתיחה אינן מאומתות כאן; בדקו את המקור לפני הביקור.";
  return text;
}

export function localizedPlaceSummary(place: Place, locale: CatalogLocale): string {
  const lang = language(locale);
  return place.localizedShortDescriptions?.[lang] ?? (lang !== "en" ? placeCopy[place.id]?.[lang] : undefined) ?? localizeCatalogText(place.shortDescription || place.tagline, locale);
}

export function localizedPlaceDescription(place: Place, locale: CatalogLocale): string {
  const lang = language(locale);
  return place.localizedDescriptions?.[lang] ?? localizeCatalogText(place.description, locale);
}

export function localizedClaimText(claim: Claim, locale: CatalogLocale): string {
  const lang = language(locale);
  return (lang !== "en" ? claimCopy[claim.text]?.[lang] : undefined) ?? localizeCatalogText(claim.text, locale);
}

export function localizedRouteTitle(route: CulturalRoute, locale: CatalogLocale): string {
  const lang = language(locale);
  return route.localizedTitles?.[lang] ?? (lang !== "en" ? routeCopy[route.id]?.[lang]?.title : undefined) ?? route.title;
}

export function localizedRouteDescription(route: CulturalRoute, locale: CatalogLocale): string {
  const lang = language(locale);
  return route.localizedDescriptions?.[lang] ?? (lang !== "en" ? routeCopy[route.id]?.[lang]?.description : undefined) ?? route.description;
}
