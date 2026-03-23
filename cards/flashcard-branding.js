// ============================================================
//  BRANDING & THEME
//  Edit this file to change the look and feel.
// ============================================================

const FLASHCARD_BRANDING = {

  // ----------------------------------------------------------
  //  Company identity
  // ----------------------------------------------------------
  companyName: "Pfizer",

  // Local logo file — place it in the same folder as index.html
  // Set to null to use the logoEmoji fallback instead.
  logoUrl: "logo.svg",

  // Emoji used as a logo stand-in when logoUrl is null
  logoEmoji: null,

  // ----------------------------------------------------------
  //  Color scheme  (Pfizer brand blues)
  // ----------------------------------------------------------
  colors: {
    primary:        "#0000C9",
    primaryText:    "#ffffff",
    cardFront:      "#ffffff",
    cardFrontText:  "#0a0a0a",
    cardBack:       "#0000C9",
    cardBackText:   "#ffffff",
    pageBg:         "#f0f2fb",
    progressFill:   "#2E29FF",
    masteredColor:  "#00008F",
    eliminatedBg:   "#e8eaf9"
  },

  // ----------------------------------------------------------
  //  Cover card
  // ----------------------------------------------------------
  cover: {
    // Set imageUrl to use a full-bleed cover image (1080x1860px recommended).
    // Title/subtitle text should be baked into the image.
    // Set to null to use the emoji + title + subtitle below.
    imageUrl: null,

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
  },

  // ----------------------------------------------------------
  //  Legal footer  (shown beneath the buttons on every screen)
  //  Set to null to hide entirely.
  // ----------------------------------------------------------
  legalText: "Company Confidential — For Internal Use Only"

};
