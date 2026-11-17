import type { FeedbackReviewStatus, FeedbackType } from './inspection';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface AdminDashboardData {
  overview: {
    total_listings: number;
    approved_listings: number;
    pending_moderation: number;
    rejected_listings: number;
    total_catalog_value: number;
    total_inspections: number;
    total_inquiries: number;
    total_users: number;
  };
  price_label_distribution: {
    good_deal: number;
    fair_price: number;
    overpriced?: number;
    above_market?: number;
  };
  condition_grade_distribution: {
    mulus?: number;
    lecet_ringan?: number;
    perlu_perbaikan?: number;
    A?: number;
    B?: number;
    C?: number;
    D?: number;
  };
  damage_detection_stats: {
    total_scratches: number;
    total_dents: number;
    total_accidents: number;
  };
}

export interface AdminInspectionMetrics {
  total_inspections: number;
  completed_inspections: number;
  failed_inspections: number;
  verified_camera_inspections: number;
  inference_time_ms: {
    average: number;
    min: number;
    max: number;
  };
  accuracy_metrics: {
    average_confidence: number;
    detections_by_class: {
      scratch: number;
      dent: number;
      accident: number;
      total: number;
    };
  };
}

export interface AdminReportItem {
  id: number;
  motorcycle_id: number;
  motorcycle: {
    id: number;
    title: string;
    seller_id: number;
  } | null;
  reporter: {
    id: number;
    name: string;
    email: string;
  };
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewed_by: number | null;
  reviewer: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface AdminInspectionFeedbackItem {
  id: number;
  inspection_id: number;
  inspection: {
    id: number;
    model_name: string;
    model_version: string;
    scratch_count: number;
    dent_count: number;
    accident_count: number;
  } | null;
  submitter: {
    id: number;
    name: string;
    email: string;
  };
  feedback_type: FeedbackType | string;
  comment: string | null;
  review_status: FeedbackReviewStatus | string;
  reviewed_by: number | null;
  reviewer: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogItem {
  id: number;
  log_name: string;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  causer: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
  properties: Record<string, unknown>;
  created_at: string;
}
