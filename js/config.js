/**
 * Everly-style wedding site — edit your details here.
 * Official UICookies Everly template: https://uicookies.com/downloads/everly/
 * (Unzip download into `_everly_tpl/` to compare; this site keeps your content in config.js.)
 */
window.WEDDING_CONFIG = {
  template: "uicookies-everly",
  partner1: "Vincent",
  partner2: "Cynah",
  hashtag: "VincentAndCynah",

  weddingDateTime: "2027-02-12T15:00:00+08:00",
  dateDisplay: "Friday, February 12 · 2027",
  /** Short line under names in the header chip */
  headerDate: "Feb 12 · 2027",
  dateLong: "Friday, February 12, 2027",

  calendarMonth: 2,
  calendarYear: 2027,
  calendarHighlightDay: 12,

  familiesLine: "With the love and blessing of their families",

  welcome: {
    headline: "WE ARE GETTING MARRIED",
    eyebrow: "You're invited",
    title: "Welcome",
    subline: "We're so happy you're here. Step inside for our story, details, and RSVP.",
    cta: "Open invitation",
    invitationPath: "invitation.html",
    monogram: "images/vc monogram.png",
    envelopeFlowers: "images/flower.png",
    envelopeStyle: "images/envelope.webp",
  },

  venue: {
    name: "Paulinos",
    area: "Upper Lamtang, La Trinidad, Benguet",
    time: "Three o'clock in the afternoon",
    year: "2027",
  },

  inviteLine:
    "Request the honour of your presence at their wedding celebration among the gardens of Upper Lamtang.",

  storyIntro:
    "After years of adventures, laughter, and growing together, we're ready to say I do — and we'd be honoured to celebrate with you.",

  storyTimeline: [
    {
      era: "May 2029",
      place: "Baguio City",
      title: "Where we met",
      text: "We were classmates, colleagues, and friends throughout college, sharing the same university and dreams. After graduation, our friendship blossomed into love—and the rest became our story.",
      image: "images/testimage.jpg",
    },
    {
      era: "Spring 2021",
      place: "The mountains",
      title: "Our Journey",
      text: "From our first jobs and travels to our first adventures, milestones, failures, and lessons, we've experienced life side by side. Through every high and low, we've grown together—and we'll keep choosing each other, wherever life takes us.",
      image: "images/sun-moon-lake-taiwan-2.webp",
    },
    {
      era: "Winter 2025",
      place: "Upper Lamtang",
      title: "The proposal",
      text: "Among pine and mist, one question and one answer — and a quiet promise to build a life together.",
      youtube: "HMcqWDKdfPo",
      youtubeAutoplay: true,
    },
    {
      era: "February 2027",
      place: "Paulinos",
      title: "Forever begins",
      text: "Now we gather the people we love most at Paulinos to make it official. Bring your dancing shoes and a tissue or two.",
    },
  ],

  ceremony: {
    label: "Ceremony",
    title: "The Vows",
    subtitle: "Garden ceremony",
    image: "images/ceremony.jpeg",
    imageAlt: "Garden ceremony at Paulinos",
    bullets: [
      "3:00 PM — ceremony begins (guests from 2:30 PM)",
      "Outdoor garden ceremony, approximately 45 minutes",
      "Paulinos · Upper Lamtang",
    ],
    linkLabel: "Getting there",
    linkTarget: "#travel",
    linkAsButton: true,
    linkButtonStyle: "outline",
  },

  reception: {
    label: "Reception",
    title: "The Feast",
    subtitle: "Paulinos terrace & hall",
    image: "images/reception.jpeg",
    imageAlt: "Reception at Paulinos terrace and hall",
    bullets: [
      "Cocktails 4:00 PM · Dinner 6:30 PM",
      "Open bar, dinner & dancing",
      "Upper Lamtang, La Trinidad, Benguet",
    ],
    linkLabel: "Reserve your seat",
    linkTarget: "#rsvp",
    linkAsButton: true,
  },

  dressCode:
    "Garden formal — think soft linens, florals, and burgundy accents. Evenings in the mountains turn cool; bring a wrap.",

  program: [
    { time: "2:30 pm", title: "Guest arrival", note: "Paulinos" },
    { time: "3:00 pm", title: "Ceremony", note: "Garden" },
    { time: "4:00 pm", title: "Cocktails & photos", note: "" },
    { time: "6:30 pm", title: "Dinner", note: "" },
    { time: "8:30 pm", title: "Dancing", note: "Until late" },
  ],

  /** Each pair: names: ["First name", "Second name"] (still accepts name1 / name2). */
  principalSponsors: [
    { names: ["Mr. Rabin Calica", "Mrs. Clariz Hidalgo"] },
    { names: ["Meynard Sorian", "SMayee Perdon"] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
  ],

  secondarySponsors: [
    { names: ["Shranvi Hidalgo", "Kian Hidalgo"] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
    { names: ["", ""] },
  ],

  rsvpDeadline: "Kindly reply by January 20, 2027 so we can save you a seat.",
  googleFormUrl: "",

  couplePhoto: "images/placeholder.svg",

  /** All site photos: project folder `images/` (same folder as this site). Paths are relative to index.html. */
  imagesBase: "images",

  /** Background music on invitation hero — plays when the hero is on screen (muted until guest taps Music). */
  heroMusic: {
    youtube: "https://www.youtube.com/watch?v=PLrd-rILKtc",
    pauseWhenLeave: true,
  },

  images: {
    hero: "images/hero-bg.jpg",
    gallery: [
      "images/image-1.jpeg",
      "images/image-2.jpeg",
      "images/image-3.jpeg",
      "images/image-4.jpeg",
      "images/image-5.jpeg",
      "images/image-6.jpeg",
    ],
  },

  /** Joy-style Where to Stay — edit hotels, notes, and booking links. */
  whereToStay: {
    title: "Where to Stay",
    note:
      "Most guests stay in Baguio City or La Trinidad and ride up to Paulinos for the day. Book early for February — it's peak season in the mountains.",
    suggestedCheckIn: "2027-02-11",
    suggestedCheckOut: "2027-02-13",
    places: [
      {
        name: "Hotel name",
        type: "Hotel",
        note: "Add a short note for guests — location, vibe, or why you recommend it.",
        distance: "— min from Paulinos",
        priceHint: "",
        image: "images/placeholder.svg",
        featured: true,
        coupleStaying: false,
        bookingUrl: "",
        bookingLabel: "See availability",
      },
      {
        name: "Room block hotel",
        type: "Room block",
        note: "If you have a group rate, mention the block code and book-by date here.",
        distance: "— min from Paulinos",
        priceHint: "Group rate available",
        image: "images/placeholder.svg",
        featured: false,
        coupleStaying: false,
        bookingUrl: "",
        bookingLabel: "Book room block",
      },
    ],
  },

  travel: {
    heading: "Paulinos sits in Upper Lamtang, La Trinidad — about 15 minutes from Baguio City. Make a weekend of it.",
    venueLine: "Paulinos, Upper Lamtang, La Trinidad, Benguet",
    note: "Parking on site. We recommend arriving early for the garden ceremony.",
  },

  map: {
    caption: "Paulinos · Upper Lamtang",
    embedUrl:
      "https://www.openstreetmap.org/export/embed.html?bbox=120.575%2C16.435%2C120.605%2C16.465&layer=mapnik&marker=16.45%2C120.59",
    linkUrl: "https://maps.google.com/?q=Paulinos+Upper+Lamtang+La+Trinidad+Benguet",
  },
};
