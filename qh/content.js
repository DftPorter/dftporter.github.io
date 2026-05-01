// ============================================================
//  CONTENT — Edit this file to update your training module
// ============================================================
//  SECTIONS:
//    1. MODULE INFO  — title, description, estimated time
//    2. SLIDES       — the informational cards learners read
//    3. QUIZ         — knowledge check questions
//    4. RESULTS      — the completion / score screen
// ============================================================
//  TIPS:
//  • Keep all commas, quotes, and brackets exactly as-is.
//  • To add a bullet point, add a new line inside "bullets": [...]
//    following the same pattern: "Your text here",
//  • To add a new slide, copy one slide block and paste it
//    before the last closing ] of the slides section.
//  • Emoji are welcome! Paste them directly into any text value.
// ============================================================

const CONTENT = {

  // ----------------------------------------------------------
  //  1. MODULE INFO
  // ----------------------------------------------------------
  module: {
    title:         "Medication Adherence in Chronic Disease",
    estimatedTime: "5 min",
    introBody:     "Understanding why patients don't take their medications — and what we can do about it — is one of the most impactful skills in life sciences. Let's explore the evidence together.",
    heroImage:     { url: "images/1.jpg", alt: "Hero image for module cover — e.g. a patient and HCP in conversation" },
  },

  // ----------------------------------------------------------
  //  2. SLIDES
  //  Each slide has:
  //    title   — the headline (required)
  //    body    — a short paragraph (required)
  //    icon    — an emoji shown at the top (optional, use "" to hide)
  //    bullets — a list of key points (optional, use [] to hide)
  //    note    — a small footnote / citation (optional, use "" to hide)
  //    stat    — a bold callout number shown between the body and bullets (optional)
  //              value: the number or figure, e.g. "~50%" or "$300B+"
  //              label: a short description of what it means
  //              Leave both as "" to hide the callout on that slide.
  //    image   — an optional image shown below the bullets
  //              url: paste a full image URL here when ready, or leave "" for a placeholder
  //              alt: describes the image (shown in placeholder and for screen readers)
  // ----------------------------------------------------------
  slides: [

    {
      title:   "What Is Medication Adherence?",
      icon:    "",
      body:    "Medication adherence means taking the right drug, at the right dose, at the right time, for the right duration — exactly as prescribed. It sounds simple, but adherence is one of the most complex challenges in healthcare.",
      bullets: [
        "Also called 'medication compliance' or 'persistence'",
        "Applies to prescription drugs, OTC products, and biologics",
        "Measured as a percentage: days supply taken ÷ days prescribed",
      ],
      note:  "",
      stat:  { value: "", label: "" },
      image: { url: "images/2.jpg", alt: "Patient reviewing a prescription label with their pharmacist" },
    },

    {
      title:   "The Adherence Gap",
      icon:    "",
      body:    "Despite the best prescribing intentions, roughly half of all patients with chronic diseases do not take their medications as directed. This gap widens over time — adherence typically drops sharply after the first few months of therapy.",
      bullets: [
        "~50% of patients with chronic conditions are non-adherent",
        "Adherence often falls below 80% within 6 months of starting therapy",
        "Primary non-adherence: prescription written but never filled (~20–30% of new Rx)",
      ],
      note:  "Source: WHO, Adherence to Long-Term Therapies, 2003; NEJM, 2005",
      stat:  { value: "~50%", label: "of chronic disease patients are non-adherent" },
      image: { url: "images/3.png", alt: "Infographic showing adherence drop-off curve over 12 months" },
    },

    {
      title:   "Why Patients Don't Adhere",
      icon:    "",
      body:    "Non-adherence is rarely just forgetfulness. Research identifies five broad categories of barriers — understanding them helps us target the right intervention for the right patient.",
      bullets: [
        "Cost & access — out-of-pocket expense, pharmacy distance",
        "Side effects — real or feared adverse events",
        "Regimen complexity — multiple drugs, multiple daily doses",
        "Beliefs & motivation — 'I feel fine, I don't need it'",
        "Health literacy — confusion about instructions or purpose",
      ],
      note:  "",
      stat:  { value: "1 in 5", label: "new prescriptions are never filled by the patient" },
      image: { url: "images/4.jpg", alt: "Illustration of five barrier categories to medication adherence" },
    },

    {
      title:   "The Real Cost of Non-Adherence",
      icon:    "",
      body:    "Non-adherence is not just a patient inconvenience — it drives hospitalizations, disease progression, and massive healthcare spending. The downstream impact touches everyone in the system.",
      bullets: [
        "$300 billion+ in avoidable healthcare costs annually in the US",
        "125,000 deaths per year attributed to non-adherence",
        "~10% of all hospitalizations linked to poor medication adherence",
        "Reduced real-world effectiveness of otherwise proven therapies",
      ],
      note:  "Source: Annals of Internal Medicine, 2012; NEHI Research Brief, 2009",
      stat:  { value: "$300B+", label: "in avoidable US healthcare costs every year" },
      image: { url: "images/5.jpg", alt: "Hospital corridor representing avoidable admissions from non-adherence" },
    },

    {
      title:   "Strategies That Move the Needle",
      icon:    "",
      body:    "No single intervention works for every patient, but evidence-based approaches — especially when combined — consistently improve adherence rates across therapeutic areas.",
      bullets: [
        "Simplify regimens: once-daily dosing, combination products",
        "Patient education: explain the 'why', not just the 'how'",
        "Motivational interviewing techniques during HCP visits",
        "Digital reminders: apps, text alerts, smart packaging",
        "Patient support programs: co-pay cards, nurse hotlines",
      ],
      note:  "",
      stat:  { value: "", label: "" },
      image: { url: "images/6.jpg", alt: "Healthcare provider in conversation with a patient, building a care plan" },
    },

  ],

  // ----------------------------------------------------------
  //  3. QUIZ
  //  Each question has:
  //    question      — the question text (required)
  //    options       — array of answer choices (2–5 items)
  //    correctIndex  — which option is correct (0 = first option)
  //    explanation   — shown after the learner answers (required)
  // ----------------------------------------------------------
  quiz: [

    {
      question:     "Approximately what percentage of patients with chronic diseases take their medications as prescribed?",
      options: [
        "About 90%",
        "About 75%",
        "About 50%",
        "About 25%",
      ],
      correctIndex: 2,
      explanation:  "Research consistently shows that roughly 50% of patients with chronic conditions are non-adherent. This is why adherence is considered one of the most significant unmet needs in healthcare.",
    },

    {
      question:     "Which of the following is NOT identified as a major barrier to medication adherence?",
      options: [
        "Cost and access challenges",
        "Fear of side effects",
        "Medication working too quickly",
        "Beliefs that the medication isn't needed",
      ],
      correctIndex: 2,
      explanation:  "'Medication working too quickly' is not a recognized adherence barrier. The four main barriers are cost/access, side effects (real or feared), regimen complexity, and patient beliefs or motivation.",
    },

    {
      question:     "Non-adherence is estimated to cost the US healthcare system approximately how much annually?",
      options: [
        "$30 billion",
        "$100 billion",
        "$200 billion",
        "$300 billion",
      ],
      correctIndex: 3,
      explanation:  "Non-adherence costs exceed $300 billion annually in the US, making it a top driver of avoidable healthcare spending alongside hospitalizations and disease complications.",
    },

    {
      question:     "Which approach has strong evidence for improving long-term medication adherence?",
      options: [
        "Simplifying dosing regimens to once daily when possible",
        "Providing clear patient education on why the medication matters",
        "Offering patient support programs like co-pay assistance",
        "All of the above",
      ],
      correctIndex: 3,
      explanation:  "All three strategies have evidence behind them. The strongest outcomes come from combining approaches — simplifying regimens, educating patients on the 'why', and removing cost barriers together produce the greatest adherence gains.",
    },

  ],

  // ----------------------------------------------------------
  //  4. RESULTS SCREEN
  // ----------------------------------------------------------
  results: {
    titlePass:    "Well done! 🎉",
    titleFail:    "Keep Learning! 📖",
    passThreshold: 75,   // percentage score needed to "pass" (0–100)
    bodyPass:     "You have a strong grasp of medication adherence fundamentals. Use these insights in every patient conversation.",
    bodyFail:     "Review the slides to reinforce the key concepts, then try the quiz again. Repetition is how knowledge sticks!",
    takeaways: [
      "~50% of chronic disease patients are non-adherent to therapy",
      "Non-adherence costs the US $300B+ per year and 125,000 lives",
      "Barriers include cost, side effects, complexity, and patient beliefs",
      "Combining simplified regimens, education, and support programs works best",
    ],
    ctaLabel:  "Restart Module",   // button text on the results screen
  },

};
