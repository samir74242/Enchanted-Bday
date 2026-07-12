export interface TimelineChapter {
  id: string;
  date: string;
  title: string;
  story: string;
  image: string;
  icon: string; // lucide icon name
  videoUrl?: string; // Optional embedded video link
}

export interface GalleryMemory {
  id: string;
  date: string;
  title: string;
  image: string;
  description: string;
  voiceText?: string; // For mock voice note subtitles
  voiceAudioUrl?: string; // Option for custom voice mp3
}

export interface TreasureClue {
  id: string;
  title: string;
  clue: string;
  hint: string;
  answer: string; // Case insensitive matched answer
  secretMessage: string;
  secretImage: string;
}

export interface FutureWish {
  id: string;
  starName: string;
  title: string;
  description: string;
  constellationShape: 'heart' | 'ring' | 'star' | 'house' | 'plane';
}

export interface AppConfig {
  herName: string;
  yourName: string;
  specialDate: string; // The password to unlock. Recommended format: "DD/MM/YYYY" or similar, or just a custom word
  songUrl: string; // Custom audio file URL if any
  letterText: string; // Love letter supporting markdown
  reasons: string[]; // Reasons why I love you
  timeline: TimelineChapter[];
  gallery: GalleryMemory[];
  clues: TreasureClue[];
  futureWishes: FutureWish[];
}
