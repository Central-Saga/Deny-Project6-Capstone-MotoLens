export type InquiryStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface InquiryItem {
  id: number;
  motorcycle_id: number;
  motorcycle: {
    id: number;
    title: string;
    brand: string;
    model_name: string;
    year: number;
    seller_price: number;
    location_address: string;
    main_image_url: string | null;
  } | null;
  buyer: {
    id: number;
    name: string;
    phone?: string | null;
    phone_whatsapp: string | null;
  };
  seller: {
    id: number;
    name: string;
    phone?: string | null;
    phone_whatsapp: string | null;
  };
  appointment_date: string;
  offered_price: number | null;
  notes: string | null;
  status: InquiryStatus;
  seller_response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInquiryPayload {
  motorcycle_id: number;
  appointment_date: string;
  offered_price?: number;
  notes?: string;
}
