-- Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'worker')),
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  trade_specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create Requests table
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_duration NUMERIC(4, 1) DEFAULT 0,
  estimated_budget NUMERIC(10, 2),
  location TEXT NOT NULL,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  accepted_bid_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requests are viewable by everyone"
  ON public.requests FOR SELECT USING (true);

CREATE POLICY "Customers can create requests"
  ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update their own requests"
  ON public.requests FOR UPDATE USING (auth.uid() = user_id);

-- Create Bids table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  estimated_time TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on bids
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bids are viewable by request owners and bid worker"
  ON public.bids FOR SELECT USING (
    auth.uid() = worker_id OR
    auth.uid() IN (SELECT user_id FROM public.requests WHERE id = request_id)
  );

CREATE POLICY "Workers can place bids"
  ON public.bids FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers or Request Owners can update bids"
  ON public.bids FOR UPDATE USING (
    auth.uid() = worker_id OR
    auth.uid() IN (SELECT user_id FROM public.requests WHERE id = request_id)
  );

-- Storage bucket configuration for problem videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('problem-videos', 'problem-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Problem videos are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'problem-videos');

CREATE POLICY "Authenticated users can upload problem videos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'problem-videos' AND auth.role() = 'authenticated'
  );
