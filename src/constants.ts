import { QuoteCategory, QuoteSort, Quote } from './types';

export const CATEGORY_MAP: Record<QuoteCategory | 'all', string[]> = {
  all: ['cinematic', 'epic', 'grand', 'inspiring', 'view', 'depth'],
  motivational: ["success", "ambition", "hustle", "goals", "winner", "achieve"],
  love: ["romance", "couple", "sunset", "heart", "flowers", "together"],
  wisdom: ["mountains", "forest", "ocean", "stars", "ancient", "peace"],
  humor: ["colorful", "fun", "laugh", "playful", "bright", "joy"],
  life: ["lifestyle", "journey", "road", "city", "morning", "freedom"],
  inspiration: ["sky", "light", "sunrise", "spark", "dream", "horizon"],
  philosophy: ["abstract", "dark", "cosmos", "shadow", "mind", "depth"],
  friendship: ["together", "hands", "warmth", "smile", "bond", "group"]
};

export const SORT_OPTIONS: { id: QuoteSort; label: string }[] = [
  { id: 'random', label: 'Random' },
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Most Popular' },
];

export const CATEGORIES: { id: QuoteCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'love', label: 'Love' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'humor', label: 'Humor' },
  { id: 'life', label: 'Life' },
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'philosophy', label: 'Philosophy' },
  { id: 'friendship', label: 'Friendship' },
];

export const FALLBACK_QUOTES: Record<QuoteCategory, Partial<Quote>[]> = {
  motivational: [
    { content: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
    { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
  ],
  love: [
    { content: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
    { content: "Love all, trust a few, do wrong to none.", author: "William Shakespeare" }
  ],
  wisdom: [
    { content: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
    { content: "Count your age by friends, not years. Count your life by smiles, not tears.", author: "John Lennon" }
  ],
  humor: [
    { content: "I am so clever that sometimes I don't understand a single word of what I am saying.", author: "Oscar Wilde" },
    { content: "Always borrow money from a pessimist. They won't expect it back.", author: "Oscar Wilde" }
  ],
  life: [
    { content: "Life is what happens when you're making other plans.", author: "John Lennon" },
    { content: "Get busy living or get busy dying.", author: "Stephen King" }
  ],
  inspiration: [
    { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { content: "It always seems impossible until it's done.", author: "Nelson Mandela" }
  ],
  philosophy: [
    { content: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { content: "I think, therefore I am.", author: "René Descartes" }
  ],
  friendship: [
    { content: "A friend is someone who knows all about you and still loves you.", author: "Elbert Hubbard" },
    { content: "Friendship is the only cement that will ever hold the world together.", author: "Woodrow Wilson" }
  ]
};
