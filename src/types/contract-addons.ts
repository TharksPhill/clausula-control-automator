
export interface ContractAddon {
  id: string;
  addon_type: string;
  description: string;
  previous_value?: string;
  new_value: string;
  requested_by: string;
  request_date: string;
  created_at: string;
  plan_change_details?: any;
}

export interface AddonFormData {
  addon_type: string;
  description: string;
  previous_value: string;
  new_value: string;
  requested_by: string;
  request_date: string;
}
