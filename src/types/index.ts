export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment_name: string | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  category: string;
  reference: string;
  note: string;
  created_at: string;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  module_name: string;
  category: string;
  progress: number;
  last_accessed: string;
  created_at: string;
}

export type ScreenName = 'home' | 'chat' | 'training' | 'profile';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  lessons: number;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
}

export type TrainingCategory =
  | 'aircraft-design'
  | 'advanced-drone'
  | 'helicopter-design'
  | 'robotics'
  | 'drone-law';

export interface CategoryInfo {
  id: TrainingCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}
