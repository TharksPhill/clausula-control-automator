
export interface Quote {
  id: string;
  user_id: string;
  quote_number: string;
  system_name: string;
  system_description?: string;
  features: string[];
  selected_plan_id?: string;
  custom_plan_data?: any;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  total_value?: number;
  validity_days: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface QuoteFormData {
  system_name: string;
  system_description?: string;
  features: string[];
  selected_plan_id?: string;
  custom_plan_data?: any;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  validity_days: number;
  notes?: string;
}
