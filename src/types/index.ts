export interface Option {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  options: Option[];
}

export interface SandwichConfig {
  formula?: Option;
  preset_sandwich?: string;
  bread?: Option;
  meat?: Option;
  sauces: Option[];
  extras: Option[];
  drinks?: { option: Option; quantity: number }[];
  desserts?: { option: Option; quantity: number }[];
}

export interface Order {
  id: string;
  client_name: string;
  client_phone: string;
  config: SandwichConfig;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  payment_status: 'unpaid' | 'paid';
  payment_method: 'online' | 'on_site';
  order_type: 'on_site' | 'takeaway';
  pickup_time: string; // ex: "15 min", "12h30"
  created_at: string;
}
