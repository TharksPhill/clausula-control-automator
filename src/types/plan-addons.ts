
export interface PackageRange {
  min: number;
  max: number;
  price: number;
}

export interface PlanAddon {
  id: string;
  name: string;
  description: string;
  price_per_unit: number;
  unit_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  pricing_type: 'per_unit' | 'package';
  package_ranges?: PackageRange[];
  package_increment?: number;
  license_cost: number;
  features?: string[];
}

export interface PlanAddonFormData {
  name: string;
  description: string;
  price_per_unit: number;
  unit_type: string;
  is_active: boolean;
  pricing_type: 'per_unit' | 'package';
  package_ranges?: PackageRange[];
  package_increment?: number;
  license_cost: number;
  features?: string[];
}

export interface PlanAddonFromDB {
  id: string;
  name: string;
  description: string;
  price_per_unit: number;
  unit_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  pricing_type?: string;
  package_ranges?: any;
  package_increment?: number;
  license_cost?: number;
}
