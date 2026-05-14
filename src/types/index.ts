export interface Option {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  options: Option[];
}

export type StepId = 
  | 'ORDER_TYPE' 
  | 'FORMULA' 
  | 'CREATION_MODE' 
  | 'PRESETS' 
  | 'KIDS_MENU'
  | 'BUILD_BREAD' 
  | 'BUILD_MEAT' 
  | 'BUILD_SAUCES' 
  | 'EXTRAS' 
  | 'SIDES' 
  | 'CHECKOUT';

export interface SandwichConfig {
  formula?: Option;
  creation_mode?: 'signature' | 'custom';
  preset_sandwich?: Option;
  bread?: Option;
  meat?: Option;
  sauces: Option[];
  extras: Option[];
  removed_ingredients?: string[];
  drinks?: { option: Option; quantity: number }[];
  desserts?: { option: Option; quantity: number }[];
}

export type PaymentMethod = 'card' | 'resto_card' | 'cash' | 'online';

export interface Order {
  id: string;
  client_name: string;
  client_phone: string;
  items: SandwichConfig[];
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  payment_status: 'unpaid' | 'paid';
  payment_method: PaymentMethod;
  order_type: 'on_site' | 'takeaway';
  pickup_time: string;
  created_at: string;
}
