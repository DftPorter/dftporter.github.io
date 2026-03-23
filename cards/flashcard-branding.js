// ============================================================
//  BRANDING & THEME
//  Edit this file to change the look and feel.
//  Use hex color codes or any valid CSS color values.
// ============================================================

const FLASHCARD_BRANDING = {

  // ----------------------------------------------------------
  //  Company identity
  // ----------------------------------------------------------
  companyName: "Vaccines Academy",

  // Logo: paste a URL to an image, or set to null to hide
  logoUrl: "PFI.svg",

  // Emoji used as a logo stand-in when logoUrl is null
  logoEmoji: "🧬",

  // ----------------------------------------------------------
  //  Color scheme
  // ----------------------------------------------------------
  colors: {
    // Primary accent — used for card backs, buttons, progress bar
    primary:        "#1D9E75",

    // Text on primary-colored backgrounds
    primaryText:    "#ffffff",

    // Card front background
    cardFront:      "#ffffff",

    // Card front text
    cardFrontText:  "#1a1a1a",

    // Card back background
    cardBack:       "#1D9E75",

    // Card back text
    cardBackText:   "#ffffff",

    // Page background
    pageBg:         "#f0f4f2",

    // Progress bar fill
    progressFill:   "#1D9E75",

    // "Mastered" badge color
    masteredColor:  "#0F6E56",

    // Eliminated card indicator
    eliminatedBg:   "#e8f5f0"
  },

  // ----------------------------------------------------------
  //  Cover card  (the very first card the user sees)
  // ----------------------------------------------------------
  cover: {
    title:    "Biology Fundamentals",
    subtitle: "Core concepts every student should know",
    emoji:    "🌿"
  },

  // ----------------------------------------------------------
  //  Instructions card  (shown after flipping the cover)
  // ----------------------------------------------------------
  instructions: {
    title: "How to use these cards",
    steps: [
      "Tap a card to flip it and reveal the definition",
      "Swipe left or tap the arrow to move to the next card",
      "Tap 'I know this!' to remove a card from your deck",
      "Your progress is shown in the bar at the top"
    ],
    ctaLabel: "Start studying"
  },

  // ----------------------------------------------------------
  //  Completion screen  (shown when all cards are mastered)
  // ----------------------------------------------------------
  completion: {
    emoji:    "🎉",
    title:    "You mastered the deck!",
    subtitle: "Great work — you've reviewed all the terms.",
    restartLabel: "Start over"
  }

};
