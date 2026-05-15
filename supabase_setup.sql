-- Table pour les réglages du camion (ouvert/fermé, temps d'attente, etc.)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'truck_settings',
    is_open BOOLEAN DEFAULT true,
    wait_time TEXT DEFAULT '15 min',
    menu JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les commandes
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    items JSONB NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    deposit_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    payment_method TEXT,
    order_type TEXT,
    pickup_time TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour la blacklist
CREATE TABLE IF NOT EXISTS public.blacklist (
    phone TEXT PRIMARY KEY,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertion des réglages par défaut
INSERT INTO public.settings (id, is_open, wait_time)
VALUES ('truck_settings', true, '15 min')
ON CONFLICT (id) DO NOTHING;

-- Activation du Realtime pour les commandes et les réglages
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
