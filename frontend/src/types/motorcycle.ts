import type {
  ExplainablePriceBreakdown,
  InspectionCertificate,
  SourceType,
  VerificationStatus,
} from './inspection';

export type PriceLabel = 'good_deal' | 'fair_price' | 'overpriced';
export type ConditionGrade = 'mulus' | 'lecet_ringan' | 'perlu_perbaikan';
export type TaxStatus = 'active' | 'expired';
export type ListingStatus = 'available' | 'booked' | 'sold' | 'archived';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type MotorcycleCategory = 'matic' | 'sport' | 'bebek' | 'trail' | 'klasik' | 'listrik';

export interface MotorcycleModelRef {
  id: number;
  brand: string;
  model_name: string;
  full_name?: string;
  category: MotorcycleCategory | string;
  engine_cc: number;
  standard_price: number;
  price_source?: string | null;
  is_active: boolean;
}

export interface InspectionSummary {
  scratch_count: number;
  dent_count: number;
  accident_count: number;
  total_damages: number;
  damage_penalty_percent: number;
}

export interface SellerBasic {
  id: number;
  name: string;
  phone_whatsapp: string | null;
  avatar_url?: string | null;
}

export interface MotorcycleListItem {
  id: number;
  title: string;
  brand: string;
  model_name: string;
  category: MotorcycleCategory | string;
  engine_cc: number;
  year: number;
  odometer_km: number;
  tax_status: TaxStatus | string;
  seller_price: number;
  base_depreciated_price: number;
  ml_predicted_price: number;
  price_label: PriceLabel | string;
  condition_grade: ConditionGrade | string;
  location_address: string;
  status: ListingStatus | string;
  moderation_status: ModerationStatus | string;
  verification_status: VerificationStatus | string;
  source_type?: SourceType | string;
  is_camera_verified: boolean;
  is_favorited?: boolean;
  inspection_summary: InspectionSummary;
  main_image_url: string | null;
  seller: SellerBasic;
  created_at: string;
  updated_at: string;
}

export interface MotorcyclePhoto {
  id: number;
  collection: string;
  url: string;
  angle?: string | null;
  damage_class?: string | null;
  is_main: boolean;
}

export interface PriceHistoryItem {
  id: number;
  old_price: number;
  new_price: number;
  changed_by: number | null;
  created_at: string;
}

export interface MotorcycleDetail extends Omit<MotorcycleListItem, 'inspection_summary'> {
  description: string | null;
  model?: MotorcycleModelRef;
  latitude: number | null;
  longitude: number | null;
  damage_penalty_percent: number;
  photos: MotorcyclePhoto[];
  price_breakdown: ExplainablePriceBreakdown;
  price_histories: PriceHistoryItem[];
  inspection_certificate: InspectionCertificate | null;
}

export interface CatalogFilterParams {
  brand?: string;
  model?: string;
  year?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  price_label?: string;
  condition_grade?: string;
  location?: string;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  per_page?: number;
}

export interface CreateMotorcyclePayload {
  inspection_id: number;
  motorcycle_model_id: number;
  title: string;
  description?: string;
  year: number;
  odometer_km: number;
  tax_status: TaxStatus;
  seller_price: number;
  location_address: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateMotorcyclePayload {
  title?: string;
  description?: string;
  seller_price?: number;
  tax_status?: TaxStatus;
  odometer_km?: number;
  location_address?: string;
  status?: ListingStatus;
}

export interface ReportListingPayload {
  reason: string;
  description?: string;
}
