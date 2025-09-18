
export interface Plan {
  id: string;
  name: string;
  employee_range: string;
  monthly_price: number;
  semestral_price: number;
  annual_price: number;
  allowed_cnpjs: number;
  license_cost: number;
  license_exemption_months: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  features?: string[];
}

export interface PlanFormData {
  name: string;
  employee_range: string;
  monthly_price: number;
  semestral_price: number;
  annual_price: number;
  allowed_cnpjs: number;
  license_cost: number;
  license_exemption_months: number;
  is_active: boolean;
  features?: string[];
}
