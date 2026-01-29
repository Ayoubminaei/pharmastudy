export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Chapter {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  topic_count?: number;
}

export interface Topic {
  id: string;
  chapter_id: string;
  user_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export type ItemType = 'molecule' | 'enzyme' | 'medication';

export interface StudyItem {
  id: string;
  topic_id: string;
  user_id: string;
  type: ItemType;
  name: string;
  description: string | null;
  image_url: string | null;
  structure_description: string | null;
  mechanism_description: string | null;
  uses: string | null;
  effects: string | null;
  pubchem_cid: string | null;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  item_id: string;
  item: StudyItem;
  last_reviewed?: string;
  review_count: number;
  mastered: boolean;
}

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  chapter_id?: string;
  topic_id?: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface PubChemCompound {
  cid: number;
  name: string;
  molecularFormula?: string;
  molecularWeight?: number;
  description?: string;
  imageUrl?: string;
  synonyms?: string[];
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}
