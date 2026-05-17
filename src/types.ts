export type QuoteCategory = 
  | 'motivational' 
  | 'love' 
  | 'wisdom' 
  | 'humor' 
  | 'life' 
  | 'inspiration' 
  | 'philosophy' 
  | 'friendship';

export interface Quote {
  _id: string;
  content: string;
  author: string;
  tags: string[];
  authorSlug: string;
  length: number;
  dateAdded: string;
  dateModified: string;
}

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    full: string;
  };
  user: {
    name: string;
    username: string;
  };
}

export type ViewMode = 'grid' | 'reels';

export type QuoteLength = 'short' | 'medium' | 'long' | 'all';

export type QuoteSort = 'random' | 'newest' | 'popular';
