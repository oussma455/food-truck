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
  bread?: Option;
  meat?: Option;
  sauces: Option[];
  extras: Option[];
  drinks?: Option[];
  desserts?: Option[];
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
  created_at: string;
}
