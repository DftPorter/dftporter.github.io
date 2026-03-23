// ============================================================
//  BRANDING & THEME
//  Edit this file to change the look and feel.
// ============================================================

const FLASHCARD_BRANDING = {

  // ----------------------------------------------------------
  //  Company identity
  // ----------------------------------------------------------
  companyName: "Pfizer",

  // Pfizer's logo served directly from pfizer.com
  logoUrl: "logo-blue.svg",

  logoEmoji: null,

  // ----------------------------------------------------------
  //  Color scheme  (Pfizer brand blues)
  // ----------------------------------------------------------
  colors: {
    // Pfizer primary blue — used for card backs, buttons, progress bar
    primary:        "#0000C9",

    // Text on primary-colored backgrounds
    primaryText:    "#ffffff",

    // Card front background
    cardFront:      "#ffffff",

    // Card front text
    cardFrontText:  "#0a0a0a",

    // Card back background
    cardBack:       "#0000C9",

    // Card back text
    cardBackText:   "#ffffff",

    // Page background — very light blue-gray, on-brand neutral
    pageBg:         "#f0f2fb",

    // Progress bar fill
    progressFill:   "#2E29FF",

    // "Mastered" badge — slightly deeper blue for contrast
    masteredColor:  "#00008F",

    // Eliminated card indicator
    eliminatedBg:   "#e8eaf9"
  },

  // ----------------------------------------------------------
  //  Cover card
  // ----------------------------------------------------------
  cover: {
    title:    "Pfizer Learning",
    subtitle: "Review key terms and concepts",
    emoji:    "💊"
  },

  // ----------------------------------------------------------
  //  Instructions card
  // ----------------------------------------------------------
  instructions: {
    title: "How to use these cards",
    steps: [
      "Tap a card to flip it and reveal the term",
      "Swipe left or tap the arrow to move to the next card",
      "Tap 'I know this!' to remove a card from your deck",
      "Your progress is shown in the bar at the top"
    ],
    ctaLabel: "Start studying"
  },

  // ----------------------------------------------------------
  //  Completion screen
  // ----------------------------------------------------------
  completion: {
    emoji:        "🎉",
    title:        "You mastered the deck!",
    subtitle:     "Great work — you've reviewed all the terms.",
    restartLabel: "Start over"
  }

};
