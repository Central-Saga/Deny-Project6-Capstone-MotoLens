export type DamageClass = 'Accident' | 'Dent' | 'Scratch';

export type SourceType = 'android_camera' | 'web_upload' | 'seed_demo';

export type VerificationStatus = 'submitted' | 'verified' | 'unverified' | 'rejected';

export type InspectionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type FeedbackType = 'false_positive' | 'false_negative' | 'wrong_class' | 'accurate';

export type FeedbackReviewStatus = 'pending' | 'accepted' | 'rejected';

export interface DetectionBbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectionItem {
  class_id?: number;
  class_name: DamageClass | string;
  confidence: number;
  bbox: DetectionBbox | [number, number, number, number];
}

export interface ExplainablePriceBreakdown {
  standard_price: number;
  vehicle_year: number;
  vehicle_age_years: number;
  age_depreciation_percent: number;
  age_depreciation_amount: number;
  odometer_km: number;
  odometer_penalty: number;
  tax_status: 'active' | 'expired' | string;
  tax_penalty: number;
  base_depreciated_price: number;
  detection_counts: {
    scratch: number;
    dent: number;
    accident: number;
  };
  visual_penalty_per_class_percent?: {
    scratch: number;
    dent: number;
    accident: number;
  };
  visual_penalty_percent?: number;
  damage_penalty_percent: number;
  ml_predicted_price: number;
  seller_price: number;
  price_label: 'good_deal' | 'fair_price' | 'overpriced' | string;
  condition_grade: 'mulus' | 'lecet_ringan' | 'perlu_perbaikan' | string;
  confidence_threshold: number;
  model_version: string;
}

export interface InspectionCertificate {
  id: number;
  certificate_number: string;
  inspected_at: string | null;
  model_name: string;
  model_version: string;
  model_sha256: string | null;
  confidence_threshold: number;
  nms_iou_threshold: number;
  source_type: SourceType | string;
  verification_status: VerificationStatus | string;
  image_width: number | null;
  image_height: number | null;
  inference_time_ms: number | null;
  annotated_image_url: string | null;
  annotated_photo_url: string | null;
  raw_image_url: string | null;
  raw_photo_url: string | null;
  detections: DetectionItem[];
  detections_json: DetectionItem[];
  counts: {
    scratch: number;
    dent: number;
    accident: number;
    total: number;
  };
}

export interface MotorcycleInspection {
  id: number;
  certificate_number: string;
  motorcycle_id: number | null;
  user_id: number;
  model_name: string;
  model_version: string;
  model_sha256: string | null;
  confidence_threshold: number;
  nms_iou_threshold: number;
  source_type: SourceType | string;
  inspection_status: InspectionStatus | string;
  image_width: number | null;
  image_height: number | null;
  scratch_count: number;
  dent_count: number;
  accident_count: number;
  total_damages_detected: number;
  average_confidence: number | null;
  inference_time_ms: number | null;
  base_depreciated_price: number;
  ml_predicted_price: number;
  damage_penalty_percent: number;
  verification_status: VerificationStatus | string;
  annotated_image_url: string | null;
  annotated_photo_url: string | null;
  raw_image_url: string | null;
  raw_photo_url: string | null;
  detections: DetectionItem[];
  detections_json: DetectionItem[];
  price_breakdown: Partial<ExplainablePriceBreakdown>;
  inspected_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubmitInspectionFeedbackPayload {
  feedback_type: FeedbackType;
  comment: string;
}
