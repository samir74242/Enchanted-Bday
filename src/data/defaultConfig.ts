import { AppConfig } from '../types';

export const defaultConfig: AppConfig = {
  herName: "Evelyn",
  yourName: "Julian",
  specialDate: "21/04/2023", // password, e.g. first date or day they became official
  songUrl: "", // Defaults to our gorgeous Web Audio procedural piano synth
  letterText: `My Dearest Evelyn,

From the moment you walked into my life, everything changed. You brought color to my grey days, warmth to my coldest nights, and a beautiful melody to my quietest moments.

I wrote this for you because simple words on paper could never fully express how deeply you have touched my heart. Every memory we've shared, every inside joke we've created, and every quiet glance we've exchanged is a treasure I hold dear.

You are my confidante, my biggest supporter, and my favorite adventure. Thank you for being your beautiful, kind, and inspiring self.

Happy Birthday, my love. May this year bring you as much joy, laughter, and wonder as you bring to my life every single day. Here's to us, and to a lifetime of beautiful tomorrows.

With all my love, always,
Julian ❤️`,
  reasons: [
    "The gentle way you smile when you're thinking of something happy.",
    "How you listen so intently when I share my silly ideas or dreams.",
    "The warmth and absolute comfort of your hand in mine.",
    "Your kindness, which radiates to every person (and animal) you meet.",
    "The adorable way you scrunch your nose when you laugh really hard.",
    "How you make even the most mundane grocery runs feel like a grand adventure.",
    "Your unwavering support, which makes me feel like I can conquer any obstacle.",
    "The peaceful, soothing feeling of simply resting next to you in silence.",
    "How passionate you are about the things and people you love.",
    "The way your eyes sparkle under soft cafe lighting.",
    "Your incredible strength and how you bounce back with grace.",
    "The quiet, sweet ways you show you care when I'm having a rough day.",
    "How beautiful you look first thing in the morning with messy hair.",
    "Your laugh, which is hands-down my absolute favorite sound in the universe."
  ],
  timeline: [
    {
      id: "t1",
      date: "April 21, 2023",
      title: "Our Very First Hello",
      story: "It started at that tiny corner coffee shop, 'The Daily Grind'. You were reading a worn-out copy of a fantasy novel, and I accidentally spilled a drop of coffee near your table. That clumsy moment turned into a four-hour conversation about books, stars, and life.",
      image: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?q=80&w=600&auto=format&fit=crop",
      icon: "Coffee"
    },
    {
      id: "t2",
      date: "July 15, 2023",
      title: "The Golden Hour Promise",
      story: "Our first trip together to the coast. The tide was low, the sky was a canvas of deep violet and gold, and we promised that no matter where life leads us, we would always find our way back to the sea together.",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
      icon: "Compass"
    },
    {
      id: "t3",
      date: "October 31, 2023",
      title: "Spooky & Silly",
      story: "Our disastrous attempt at carving pumpkins. Yours turned out looking like a cheerful cat, while mine looked like a melting blob. We ended up covered in pumpkin seeds, eating cold pizza, and laughing until our stomachs hurt.",
      image: "https://images.unsplash.com/photo-1508349682734-181023d83910?q=80&w=600&auto=format&fit=crop",
      icon: "Smile"
    },
    {
      id: "t4",
      date: "January 1, 2024",
      title: "Leaping into the New Year",
      story: "Standing under the freezing midnight sky, watching the fireworks reflect in your eyes. As the countdown hit zero, we whispered our hopes for the year ahead, knowing we had each other to lean on.",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
      icon: "Sparkles"
    }
  ],
  gallery: [
    {
      id: "g1",
      date: "Spring '23",
      title: "That Perfect Sunday",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
      description: "Under the blooming cherry blossom trees, you looked like a scene straight out of a Ghibli movie.",
      voiceText: "Do you remember how the wind blew petals into your tea and you tried to catch them? That's when I knew."
    },
    {
      id: "g2",
      date: "Summer '23",
      title: "Lost in the Museum",
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
      description: "You stood admiring a massive abstract painting, completely lost in thought, while I stood admiring you.",
      voiceText: "I still have the ticket stub in my wallet. It's my favorite bookmark."
    },
    {
      id: "g3",
      date: "Autumn '23",
      title: "Cozy Cabin Weekend",
      image: "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?q=80&w=600&auto=format&fit=crop",
      description: "Wrapped in three oversized blankets, sipping hot cocoa, watching the rain tap on the cabin window.",
      voiceText: "We spent hours listening to old records and talking about nothing at all."
    },
    {
      id: "g4",
      date: "Winter '24",
      title: "The Snowball Champion",
      image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
      description: "You caught me completely off guard with a perfectly aimed, giant snowball. A true victory smile.",
      voiceText: "I let you win, by the way... okay fine, maybe your aim was just incredibly perfect!"
    },
    {
      id: "g5",
      date: "Spring '24",
      title: "Midnight Kitchen Concert",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
      description: "Singing old acoustic songs at 2:00 AM using wooden spoons as microphones while cookies baked in the oven.",
      voiceText: "Even out of tune, our voices felt completely in harmony. The cookies burnt, but the memory didn't."
    },
    {
      id: "g6",
      date: "Summer '24",
      title: "Stargazing on the Roof",
      image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop",
      description: "Counting shooting stars on a warm July night, laying flat on the roof with a playlist softly buzzing nearby.",
      voiceText: "I made a wish that night. It was simply for another hundred nights just like that one."
    }
  ],
  clues: [
    {
      id: "c1",
      title: "Our First Encounter",
      clue: "Where did we first meet?",
      hint: "A cozy corner coffee shop... (Hint: The Daily Grind)",
      answer: "The Daily Grind|Daily Grind|coffee shop|cafe",
      secretMessage: "Perfect! Our little haven where everything started. ☕❤️",
      secretImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "c2",
      title: "A Sweet Whisper",
      clue: "What I call you? (one word)",
      hint: "A gentle five-letter pet name of absolute affection...",
      answer: "baby",
      secretMessage: "Yes, my beautiful baby. You'll always be my only one. 💕",
      secretImage: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "c3",
      title: "Our Nightly Vow",
      clue: "What do I whisper to you every night?",
      hint: "Three simple words that hold my entire heart...",
      answer: "i love you|love you",
      secretMessage: "I love you. Yesterday, today, tonight, and forever. 🌙✨",
      secretImage: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=500&auto=format&fit=crop"
    }
  ],
  futureWishes: [
    {
      id: "fw1",
      starName: "Stella Casa",
      title: "Our Cozy Sanctuary",
      description: "A little cottage in the hills, with a huge bookshelf, a fireplace, and a sunlit garden where we can sit with our morning coffees.",
      constellationShape: "house"
    },
    {
      id: "fw2",
      starName: "Astro Ring",
      title: "The Promised Forever",
      description: "Two simple bands, a lifetime of growth, and a quiet understanding that our stories will always be intertwined.",
      constellationShape: "ring"
    },
    {
      id: "fw3",
      starName: "Volaris",
      title: "Wanderlust Horizons",
      description: "Backpacking through Japan during sakura season, exploring ancient alleyways in Europe, and losing ourselves in new cultures together.",
      constellationShape: "plane"
    },
    {
      id: "fw4",
      starName: "Cor Caroli",
      title: "Unconditional Love",
      description: "Supporting each other through all of life's seasons—celebrating the mountaintops and quietly walking hand-in-hand through the valleys.",
      constellationShape: "heart"
    }
  ]
};
