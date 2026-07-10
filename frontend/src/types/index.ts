export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export interface Material {
  id: number;
  user_id: number;
  title: string;
  file_path?: string;
  file_type: "pdf" | "image" | "text";
  raw_text?: string;
  summary?: string;
  status: "pending" | "extracting" | "generating" | "processing" | "completed" | "failed";
  processing_stage?: number; // 0-5 progress
  knowledge_point_count?: number;
  flashcard_count?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgePoint {
  id: number;
  material_id?: number;
  user_id: number;
  title: string;
  content: string;
  importance: number;
  mastery_level: number;
  created_at: string;
}

export interface KnowledgeRelation {
  id: number;
  source_id: number;
  target_id: number;
  relation_type: "prerequisite" | "related" | "part_of" | "contrasts";
  description?: string;
}

export interface Flashcard {
  id: number;
  knowledge_point_id?: number;
  user_id: number;
  question: string;
  answer: string;
  card_type: "fill_blank" | "qa" | "definition" | "choice";
  difficulty: number;
  is_active: boolean;
  knowledge_point_title?: string;
}

export interface ReviewSchedule {
  id: number;
  flashcard_id: number;
  user_id: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
  last_review?: string;
  memory_strength: number;
  total_reviews: number;
  flashcard?: Flashcard;
}

export interface ReviewHistory {
  id: number;
  review_schedule_id: number;
  quality: number;
  response_time_ms?: number;
  reviewed_at: string;
}

export interface GraphNode {
  id: number;
  name: string;
  val: number;
  color: string;
  mastery_level: number;
  content?: string;
}

export interface GraphLink {
  source: number;
  target: number;
  label: string;
  description?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface StatsOverview {
  total_knowledge_points: number;
  mastered_points: number;
  total_flashcards: number;
  today_review_count: number;
  today_new_count: number;
  study_streak: number;
  total_reviews: number;
}

export interface ForgettingCurveData {
  days: number[];
  without_review: number[];
  with_review: number[];
}

export interface MasteryData {
  material_id: number;
  material_title: string;
  mastery_level: number;
  total_points: number;
  mastered_points: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface MaterialListResponse {
  items: Material[];
  total: number;
}

export interface TodayCardsResponse {
  cards: Flashcard[];
  total: number;
  new_count: number;
  review_count: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface HeatmapResponse {
  data: HeatmapDay[];
}



export interface LearningAnalysisHighlight {
  icon: string;
  text: string;
}

export interface LearningAnalysisRecommendation {
  title: string;
  description: string;
}

export interface LearningAnalysis {
  type: string;
  title: string;
  content: string;
  highlights: LearningAnalysisHighlight[];
  recommendations: LearningAnalysisRecommendation[];
}



export interface TrendData {
  date: string;
  label: string;
  count: number;
}

export interface RadarData {
  subject: string;
  mastery: number;
  points: number;
}



export interface StudyPlanProgressItem {
  id: number;
  progress_date: string;
  completed_count: number;
  target_count: number;
  is_completed: boolean;
}

export interface StudyPlan {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  target_type: string;
  target_material_id?: number;
  target_count: number;
  daily_target: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "paused";
  icon: string;
  color: string;
  completed_count: number;
  progress_percentage: number;
  today_progress: number;
  days_remaining: number;
  progress: StudyPlanProgressItem[];
  created_at: string;
  updated_at: string;
}

export interface StudyPlanCreate {
  title: string;
  description?: string;
  target_type: string;
  target_material_id?: number;
  target_count: number;
  daily_target: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  icon?: string;
  color?: string;
}

export interface StudyPlanUpdate {
  title?: string;
  description?: string;
  target_count?: number;
  daily_target?: number;
  duration_days?: number;
  end_date?: string;
  status?: string;
  icon?: string;
  color?: string;
}

// ===== Note Types =====
export interface NoteListItem {
  id: number;
  title: string;
  is_daily: boolean;
  is_auto_created: boolean;
  tags: string;
  updated_at: string;
}

export interface NoteResponse {
  id: number;
  title: string;
  content: string;
  is_daily: boolean;
  is_auto_created: boolean;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface BacklinkItem {
  source_id: number;
  source_title: string;
  snippet: string;
  updated_at: string;
}

export interface NoteGraphNode {
  id: number;
  title: string;
  is_auto_created: boolean;
  val: number;
}

export interface NoteGraphLink {
  source: number;
  target: number;
}

// ===== Mistake Types =====
export interface Mistake {
  id: number;
  flashcard_id: number;
  question: string;
  user_answer: string | null;
  correct_answer: string;
  diagnosis: string;
  ai_explanation: string | null;
  related_knowledge_ids: string | null;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface MistakeListResponse {
  items: Mistake[];
  total: number;
  unresolved: number;
  by_diagnosis: Record<string, number>;
}

export interface WeaknessRadarResponse {
  knowledge_ids: number[];
  labels: string[];
  counts: number[];
  total_mistakes: number;
}

export interface MistakeReviewItem {
  id: number;
  question: string;
  answer: string;
  ai_explanation: string | null;
  diagnosis: string;
  correct_count: number;
  flashcard_id: number;
}

export interface MistakeReviewResult {
  id: number;
  resolved: boolean;
  correct_count: number;
  quality: number;
}

export interface MistakeStats {
  total: number;
  unresolved: number;
  resolved: number;
  by_diagnosis: Record<string, number>;
  today_new: number;
  today_resolved: number;
}

// ===== Focus Types =====
export interface FocusSession {
  id: number;
  duration_minutes: number;
  completed: boolean;
  ambient_sound: string;
  xp_earned: number;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

export interface FocusStatsResponse {
  today_minutes: number;
  today_sessions: number;
  week_minutes: number;
  total_sessions: number;
  longest_streak_days: number;
  total_xp: number;
}

// ===== Leaderboard Types =====
export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  grade: string;
  major: string;
  today_reviews: number;
  week_reviews: number;
  total_reviews: number;
  streak: number;
  is_you: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  your_rank: number;
  your_percentile: number;
  period: string;
  period_label: string;
}

// ===== Achievement Types =====
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  progress_target?: number;
  xp_reward: number;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  completion_rate: number;
  by_rarity: Record<AchievementRarity, { total: number; unlocked: number }>;
}
