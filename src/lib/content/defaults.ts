import type { SiteContent } from "./types";

/** Fallback content. Used when Supabase is unreachable or a block has never
 *  been edited, so the public site never renders empty.
 *
 *  Anything marked "placeholder" below is stand-in wording for the church to
 *  replace from the admin editor. */
export const DEFAULT_CONTENT: SiteContent = {
  theme: {
    navy: "#1a3a6e",
    navyDeep: "#0f2347",
    red: "#e53935",
    redDark: "#b71c1c",
    pink: "#d81b60",
    pinkLight: "#fce4ec",
    grayBg: "#f7f8fa",
    gray2: "#efefef",
    text: "#1a1a2e",
    muted: "#6b7280",
  },

  look: { radius: 16, font: "jakarta" },

  site_info: {
    churchName: "The Witness Church",
    location: "Lagos, Nigeria",
    liveUrl: "",
    youtubeChannelId: "",
    sermonTitleFilter: "The Witness Church",
    heroEyebrow: "Welcome to The Witness Church",
    heroLine1: "Where Faith",
    heroAccent: "Meets",
    heroLine2: "Community",
    heroShade: 65,
    heroSubtext:
      "Authentic worship. Transformative teaching. A community that walks with you through every season of life.",
    primaryCtaLabel: "Watch Latest Sermon",
    primaryCtaHref: "/sermons",
    secondaryCtaLabel: "Plan Your Visit",
    secondaryCtaHref: "/connect",
    welcomeTag: "Welcome to Witness",
    welcomeTitle: "Welcome Home!",
    welcomeSubtext:
      "Dive into our teachings, events, and community. Your journey of faith begins here.",
    footerBlurb:
      "A community of believers committed to authentic faith, radical love, and kingdom impact across Lagos and beyond.",
    copyright:
      "© 2025 The Witness Church · All Rights Reserved · Lagos, Nigeria",
    socialYoutube: "",
    socialX: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTiktok: "",
  },

  sections: [
    { id: "hero", visible: true },
    { id: "welcome", visible: true },
    { id: "devotion", visible: true },
    { id: "announcements", visible: true },
    { id: "sermons", visible: true },
    { id: "clips", visible: true },
    { id: "games", visible: true },
    { id: "prayer", visible: true },
  ],

  hero_slides: [
    { src: "/hero/hgf.png", alt: "Church congregation" },
    { src: "/hero/boy-praying.png", alt: "Boy in prayer" },
    { src: "/hero/girl-praying.png", alt: "Girl in prayer" },
    { src: "/hero/pastor-praying.png", alt: "Pastor in prayer" },
    { src: "/hero/woman-praying.png", alt: "Woman in prayer" },
  ],

  welcome_cards: [
    {
      label: "Who We Are",
      title: "About Us",
      cta: "Learn More",
      href: "/about",
      image:
        "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80",
      alt: "Church community members gathered together",
      accent: "bg-red",
    },
    {
      label: "Join Our Community",
      title: "Connect with Us",
      cta: "Find a Location",
      href: "/connect",
      image:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
      alt: "People smiling and connecting",
      accent: "bg-pink",
    },
    {
      label: "Upcoming",
      title: "Celebrations & Events",
      cta: "See the Calendar",
      href: "/events",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      alt: "Church celebration event",
      accent: "bg-navy",
    },
  ],

  // Sample events: replace with the real calendar from the admin editor.
  events: [
    {
      title: "Easter Sunday Celebration",
      date: "2026-04-05",
      endDate: "",
      time: "9:00 AM",
      place: "Main Auditorium",
      category: "Service",
      description:
        "Join us as we celebrate the resurrection of Jesus with worship, a powerful message and a time of communion together.",
      image:
        "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900&q=80",
      pinned: "no",
      repeat: "none",
      repeatUntil: "",
    },
    {
      title: "Father's Day Celebration & Baptism",
      date: "2026-06-21",
      endDate: "",
      time: "All Services",
      place: "Main Auditorium",
      category: "Service",
      description:
        "Celebrate the fathers in our congregation and witness lives transformed through baptism.",
      image:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80",
      pinned: "no",
      repeat: "none",
      repeatUntil: "",
    },
    {
      title: "Youth Night: Faith Over Fear",
      date: "2026-10-16",
      endDate: "",
      time: "6:00 PM",
      place: "Youth Hall",
      category: "Youth",
      description:
        "A night for young people to encounter God in a fresh way. Worship, spoken word, testimonies and a message to inspire the next generation.",
      image:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80",
      pinned: "no",
      repeat: "none",
      repeatUntil: "",
    },
    {
      title: "Community Outreach & Food Drive",
      date: "2026-10-24",
      endDate: "",
      time: "10:00 AM",
      place: "Church Grounds",
      category: "Outreach",
      description:
        "Food donations, health screenings and prayer for our neighbours. Bring a bag of groceries and a servant's heart.",
      image:
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900&q=80",
      pinned: "no",
      repeat: "none",
      repeatUntil: "",
    },
    {
      title: "Annual Thanksgiving Service",
      date: "2026-11-29",
      endDate: "",
      time: "9:00 AM",
      place: "Main Auditorium",
      category: "Service",
      description:
        "A special service to give thanks to God for His faithfulness through the year.",
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
      pinned: "yes",
      repeat: "none",
      repeatUntil: "",
    },
    {
      title: "Christmas Carol Night",
      date: "2026-12-20",
      endDate: "",
      time: "5:00 PM",
      place: "Main Auditorium",
      category: "Celebration",
      description:
        "An evening of carols, drama and fellowship as a church family.",
      image:
        "https://images.unsplash.com/photo-1511367461429-433e1f3e83db?w=900&q=80",
      pinned: "no",
      repeat: "none",
      repeatUntil: "",
    },
    {
      title: "Crossover Night",
      date: "2026-12-31",
      endDate: "",
      time: "10:00 PM",
      place: "Main Auditorium",
      category: "Service",
      description:
        "Cross into the new year in the presence of God with worship, prayer and the Word.",
      image:
        "https://images.unsplash.com/photo-1511367461429-433e1f3e83db?w=900&q=80",
      pinned: "yes",
      repeat: "none",
      repeatUntil: "",
    },
  ],

  event_categories: [
    { name: "Service" },
    { name: "Youth" },
    { name: "Outreach" },
    { name: "Celebration" },
    { name: "Event" },
  ],

  pinned_sermons: [],

  clips: [],

  games: [
    {
      emoji: "📖",
      title: "Bible Quiz",
      description:
        "Challenge friends or go solo through Old & New Testament trivia",
      badge: "🔥 Popular",
      badgeStyle: "bg-red/20 text-red-200",
    },
    {
      emoji: "✏️",
      title: "Bible Quote",
      description: "Fill in the missing words, or write the whole verse from memory",
      badge: "⚡ New",
      badgeStyle: "bg-blue-400/20 text-blue-200",
    },
    {
      emoji: "🗺️",
      title: "Bible Lands Explorer",
      description: "Pin cities and nations on a map from biblical accounts",
      badge: "🌍 New",
      badgeStyle: "bg-green-400/20 text-green-200",
    },
    {
      emoji: "🔤",
      title: "The Word — Wordle",
      description: "Daily Bible-themed word game for the whole family",
      badge: "📅 Daily",
      badgeStyle: "bg-pink/20 text-pink-200",
    },
  ],

  // Placeholder wording. Replace with the church's own story.
  about: {
    heading: "About The Witness Church",
    intro:
      "A community of believers committed to authentic faith, radical love, and kingdom impact across Lagos and beyond.",
    story:
      "We are a church family in Lagos, Nigeria that gathers to worship, learn from the Word, and serve our city. Whether you are new to faith or have walked with God for years, there is a place for you here.",
    mission:
      "To help people encounter Jesus, grow in faith, and serve their community.",
    vision: "A Lagos transformed by people who live and love like Christ.",
    photo:
      "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80",
  },

  // Placeholder locations. Replace with the real addresses and service times.
  locations: [
    {
      name: "Main Campus",
      kind: "in-person",
      address: "Add the street address here, Lagos",
      schedule: "Sundays · add service times",
      link: "",
    },
    {
      name: "Online Service",
      kind: "online",
      address: "Watch live on YouTube",
      schedule: "Sundays · add service times",
      link: "",
    },
  ],

  leaders: [],

  gallery: [
    {
      photo:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80",
      caption: "Fellowship after service",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900&q=80",
      caption: "Community outreach",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80",
      caption: "Celebration Sunday",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1511367461429-433e1f3e83db?w=900&q=80",
      caption: "Worship night",
    },
  ],

  devotion: {
    tag: "Verse of the Day",
    title: "Start Your Day in The Word",
    moreLabel: "View more plans",
    moreUrl: "https://www.bible.com/reading-plans",
  },

  prayer: {
    tag: "Prayer Wall",
    title: "You Are Not Praying Alone",
    intro:
      "Share a request on the wall for the church family to pray over, or send it privately to our pastor. Every request is anonymous.",
    wallNote:
      "Requests for the wall are reviewed by our team before they appear.",
  },
};
