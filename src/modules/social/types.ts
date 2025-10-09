// =============================================
// TIPOS TYPESCRIPT - MÓDULO SOCIAL
// =============================================

export interface ExpressPost {
  id: string;
  author_id: string;
  title: string;
  description?: string;
  price_cents?: number;
  category?: 'comida' | 'tecnologia' | 'hogar' | 'servicios' | 'vehiculos' | 'otros';
  contact_method: 'whatsapp' | 'telefono' | 'email' | 'directo';
  contact_value: string;
  status: 'active' | 'sold' | 'expired' | 'removed';
  external_disclaimer_accepted: boolean;
  created_at: string;
  expires_at: string;
  location_text?: string;
  media_count: number;
  // Campos calculados
  media?: ExpressMedia[];
  reactions?: ExpressReaction[];
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ExpressMedia {
  id: string;
  post_id: string;
  url: string;
  media_type: 'image' | 'video';
  sort_order: number;
  created_at: string;
}

export interface ExpressReaction {
  post_id: string;
  user_id: string;
  reaction: 'like' | 'save';
  created_at: string;
}

export interface ExpressReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
}

export interface Question {
  id: string;
  author_id: string;
  body: string;
  tags: string[];
  status: 'open' | 'closed' | 'removed';
  created_at: string;
  // Campos calculados
  answers?: Answer[];
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  answers_count?: number;
}

export interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  is_ai: boolean;
  upvotes: number;
  created_at: string;
  // Campos calculados
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  question?: Question;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_key: string;
  accepted_at: string;
  metadata: Record<string, any>;
}

// =============================================
// TIPOS PARA REQUESTS/RESPONSES API
// =============================================

export interface CreateExpressPostRequest {
  title: string;
  description?: string;
  price_cents?: number;
  category?: 'comida' | 'tecnologia' | 'hogar' | 'servicios' | 'vehiculos' | 'otros';
  contact_method: 'whatsapp' | 'telefono' | 'email' | 'directo';
  contact_value: string;
  media: Array<{
    url: string;
    media_type: 'image' | 'video';
    sort_order: number;
  }>;
  location_text?: string;
  external_disclaimer_accepted: boolean;
}

export interface UpdateExpressPostRequest {
  title?: string;
  description?: string;
  price_cents?: number;
  category?: 'comida' | 'tecnologia' | 'hogar' | 'servicios' | 'vehiculos' | 'otros';
  contact_method?: 'whatsapp' | 'telefono' | 'email' | 'directo';
  contact_value?: string;
  status?: 'sold';
  location_text?: string;
}

export interface ExpressPostListResponse {
  posts: ExpressPost[];
  next_cursor?: string;
  has_more: boolean;
  total_count: number;
}

export interface CreateQuestionRequest {
  body: string;
  tags?: string[];
}

export interface CreateAnswerRequest {
  body: string;
}

export interface QuestionListResponse {
  questions: Question[];
  next_cursor?: string;
  has_more: boolean;
  total_count: number;
}

export interface ReportExpressPostRequest {
  reason: string;
}

export interface ReactionRequest {
  reaction: 'like' | 'save';
}

// =============================================
// TIPOS PARA RATE LIMITING
// =============================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: number;
  window_start: number;
}

export interface RateLimitResponse {
  success: boolean;
  rate_limit: RateLimitInfo;
  message?: string;
}

// =============================================
// TIPOS PARA VALIDACIÓN
// =============================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  error: string;
  message: string;
  code: string;
  details?: ValidationError[];
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  rate_limit?: RateLimitInfo;
}

// =============================================
// TIPOS PARA FILTROS Y BÚSQUEDA
// =============================================

export interface ExpressPostFilters {
  status?: 'active' | 'sold' | 'expired';
  category?: string;
  author_id?: string;
  min_price?: number;
  max_price?: number;
  location?: string;
  tags?: string[];
}

export interface QuestionFilters {
  status?: 'open' | 'closed';
  author_id?: string;
  tags?: string[];
  has_answers?: boolean;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

// =============================================
// TIPOS PARA ESTADÍSTICAS
// =============================================

export interface ExpressPostStats {
  total_posts: number;
  active_posts: number;
  expired_posts: number;
  sold_posts: number;
  total_media: number;
  total_reactions: number;
  total_reports: number;
}

export interface QuestionStats {
  total_questions: number;
  open_questions: number;
  closed_questions: number;
  total_answers: number;
  total_upvotes: number;
}

export interface UserStats {
  express_posts_count: number;
  questions_count: number;
  answers_count: number;
  total_reactions_received: number;
  total_upvotes_received: number;
}

// =============================================
// TIPOS PARA NOTIFICACIONES
// =============================================

export interface SocialNotification {
  id: string;
  user_id: string;
  type: 'express_post_expiring' | 'question_answered' | 'answer_upvoted' | 'post_reported';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

// =============================================
// TIPOS PARA CONFIGURACIÓN
// =============================================

export interface SocialConfig {
  express_posts: {
    max_per_day: number;
    max_media_per_post: number;
    expiration_hours: number;
    max_title_length: number;
    max_description_length: number;
  };
  questions: {
    max_per_hour: number;
    min_body_length: number;
    max_body_length: number;
    max_tags: number;
  };
  rate_limits: {
    express_posts: number;
    questions: number;
    answers: number;
    reactions: number;
  };
}

// =============================================
// TIPOS PARA AUDITORÍA
// =============================================

export interface SocialAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: 'express_post' | 'question' | 'answer' | 'reaction' | 'report';
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}










