export interface Option {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  isAvailable?: boolean;
}

export interface Category {
  id: string;
  name: string;
  options: Option[];
}

export type StepId =
  | 'ORDER_TYPE'
  | 'FORMULA'
  | 'PRESETS'
  | 'KIDS_MENU'
  | 'SAUCES'
  | 'EXTRAS'
  | 'DRINKS'
  | 'DESSERTS'
  | 'COUSCOUS'
  | 'COUSCOUS_MEAT'
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
  deposit_amount?: number;
  deposit_status?: 'pending' | 'paid' | 'failed';
  deposit_method?: 'sumup_card' | 'sumup_resto';
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_method: PaymentMethod;
  order_type: 'on_site' | 'takeaway';
  pickup_time: string;
  notes?: string;
  created_at: string;
}
