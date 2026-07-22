export interface IndianState {
  label: string;
  value: string;
  code?: string;
  zone?: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East';
}

export const INDIAN_STATES: IndianState[] = [
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh', code: 'AP', zone: 'South' },
  { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh', code: 'AR', zone: 'North-East' },
  { label: 'Assam', value: 'Assam', code: 'AS', zone: 'North-East' },
  { label: 'Bihar', value: 'Bihar', code: 'BR', zone: 'East' },
  { label: 'Chhattisgarh', value: 'Chhattisgarh', code: 'CG', zone: 'Central' },
  { label: 'Goa', value: 'Goa', code: 'GA', zone: 'West' },
  { label: 'Gujarat', value: 'Gujarat', code: 'GJ', zone: 'West' },
  { label: 'Haryana', value: 'Haryana', code: 'HR', zone: 'North' },
  { label: 'Himachal Pradesh', value: 'Himachal Pradesh', code: 'HP', zone: 'North' },
  { label: 'Jharkhand', value: 'Jharkhand', code: 'JH', zone: 'East' },
  { label: 'Karnataka', value: 'Karnataka', code: 'KA', zone: 'South' },
  { label: 'Kerala', value: 'Kerala', code: 'KL', zone: 'South' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh', code: 'MP', zone: 'Central' },
  { label: 'Maharashtra', value: 'Maharashtra', code: 'MH', zone: 'West' },
  { label: 'Manipur', value: 'Manipur', code: 'MN', zone: 'North-East' },
  { label: 'Meghalaya', value: 'Meghalaya', code: 'ML', zone: 'North-East' },
  { label: 'Mizoram', value: 'Mizoram', code: 'MZ', zone: 'North-East' },
  { label: 'Nagaland', value: 'Nagaland', code: 'NL', zone: 'North-East' },
  { label: 'Odisha', value: 'Odisha', code: 'OR', zone: 'East' },
  { label: 'Punjab', value: 'Punjab', code: 'PB', zone: 'North' },
  { label: 'Rajasthan', value: 'Rajasthan', code: 'RJ', zone: 'North' },
  { label: 'Sikkim', value: 'Sikkim', code: 'SK', zone: 'North-East' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu', code: 'TN', zone: 'South' },
  { label: 'Telangana', value: 'Telangana', code: 'TG', zone: 'South' },
  { label: 'Tripura', value: 'Tripura', code: 'TR', zone: 'North-East' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh', code: 'UP', zone: 'North' },
  { label: 'Uttarakhand', value: 'Uttarakhand', code: 'UK', zone: 'North' },
  { label: 'West Bengal', value: 'West Bengal', code: 'WB', zone: 'East' },
  
  // Union Territories
  { label: 'Andaman and Nicobar Islands', value: 'Andaman and Nicobar Islands', code: 'AN', zone: 'South' },
  { label: 'Chandigarh', value: 'Chandigarh', code: 'CH', zone: 'North' },
  { label: 'Dadra and Nagar Haveli and Daman and Diu', value: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', zone: 'West' },
  { label: 'Delhi NCR', value: 'Delhi NCR', code: 'DL', zone: 'North' },
  { label: 'Jammu and Kashmir', value: 'Jammu and Kashmir', code: 'JK', zone: 'North' },
  { label: 'Ladakh', value: 'Ladakh', code: 'LA', zone: 'North' },
  { label: 'Lakshadweep', value: 'Lakshadweep', code: 'LD', zone: 'South' },
  { label: 'Puducherry', value: 'Puducherry', code: 'PY', zone: 'South' },
];

export const INDIAN_STATE_OPTIONS = INDIAN_STATES.map(s => ({
  label: s.label,
  value: s.value
}));
