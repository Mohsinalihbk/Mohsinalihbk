import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const CustomStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: CustomStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type UserRole = 'customer' | 'worker';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  rating?: number;
  trade_specialty?: string; // e.g. 'Licensed Electrician', 'Plumber', 'HVAC Tech'
}

export interface ServiceRequest {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  video_url: string;
  video_duration?: number; // up to 30s
  estimated_budget?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  accepted_bid_id?: string;
  created_at: string;
  user_profile?: UserProfile;
  bids_count?: number;
}

export interface Bid {
  id: string;
  request_id: string;
  worker_id: string;
  amount: number;
  estimated_time: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  worker_profile?: UserProfile;
}

// Initial Mock Data for seamless demo experience
const INITIAL_DEMO_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1',
    user_id: 'cust-101',
    title: 'Sparks coming from electrical outlet in kitchen',
    category: 'Electrical',
    description: 'Whenever I plug in the toaster or coffee machine, there is a blue spark and a buzzing noise. Need an electrician ASAP!',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    video_duration: 15,
    estimated_budget: 150,
    location: 'Oakland, CA (0.8 miles away)',
    latitude: 37.8044,
    longitude: -122.2712,
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    bids_count: 2,
    user_profile: {
      id: 'cust-101',
      email: 'alex@example.com',
      full_name: 'Alex Johnson',
      role: 'customer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  },
  {
    id: 'req-2',
    user_id: 'cust-102',
    title: 'Main circuit breaker trips when HVAC runs',
    category: 'Electrical',
    description: 'The main panel breaker switches off after 10 minutes of central AC running. Video shows panel switches and light flickering.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    video_duration: 22,
    estimated_budget: 250,
    location: 'San Francisco, CA (2.4 miles away)',
    latitude: 37.7749,
    longitude: -122.4194,
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    bids_count: 1,
    user_profile: {
      id: 'cust-102',
      email: 'sarah@example.com',
      full_name: 'Sarah Miller',
      role: 'customer',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  },
  {
    id: 'req-3',
    user_id: 'cust-101',
    title: 'Ceiling fan light kit installation',
    category: 'Lighting',
    description: 'Need help installing a heavy ceiling fan with light fixture in a double-height ceiling room.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    video_duration: 28,
    estimated_budget: 120,
    location: 'Berkeley, CA (3.1 miles away)',
    latitude: 37.8715,
    longitude: -122.2730,
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    bids_count: 0,
    user_profile: {
      id: 'cust-101',
      email: 'alex@example.com',
      full_name: 'Alex Johnson',
      role: 'customer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  },
];

const INITIAL_DEMO_BIDS: Bid[] = [
  {
    id: 'bid-1',
    request_id: 'req-1',
    worker_id: 'work-201',
    amount: 140,
    estimated_time: '1 hour (Can arrive in 30 mins)',
    message: 'Master Electrician with 12 years experience. I carry spare GFCI outlets in my van and can fix this safely today.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    worker_profile: {
      id: 'work-201',
      email: 'sparky.mike@example.com',
      full_name: 'Mike Watson, WirePro Electrical',
      role: 'worker',
      trade_specialty: 'Master Electrician',
      rating: 4.9,
      phone: '(510) 555-0199',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  },
  {
    id: 'bid-2',
    request_id: 'req-1',
    worker_id: 'work-202',
    amount: 120,
    estimated_time: '45 mins',
    message: 'Licensed electrician nearby. Available right now to replace faulty socket or trace wiring issue.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    worker_profile: {
      id: 'work-202',
      email: 'david.tech@example.com',
      full_name: 'David Chen',
      role: 'worker',
      trade_specialty: 'Journeyman Electrician',
      rating: 4.8,
      phone: '(415) 555-8833',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  },
  {
    id: 'bid-3',
    request_id: 'req-2',
    worker_id: 'work-201',
    amount: 220,
    estimated_time: '2 hours',
    message: 'Will test thermal amp draw on panel breaker and inspect HVAC circuit line.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    worker_profile: {
      id: 'work-201',
      email: 'sparky.mike@example.com',
      full_name: 'Mike Watson, WirePro Electrical',
      role: 'worker',
      trade_specialty: 'Master Electrician',
      rating: 4.9,
      phone: '(510) 555-0199',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  },
];

// Memory/AsyncStorage Data Store Helper
const REQUESTS_KEY = '@home_services_requests';
const BIDS_KEY = '@home_services_bids';

export async function getStoredRequests(): Promise<ServiceRequest[]> {
  try {
    const json = await AsyncStorage.getItem(REQUESTS_KEY);
    if (!json) {
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
      return INITIAL_DEMO_REQUESTS;
    }
    return JSON.parse(json);
  } catch (e) {
    return INITIAL_DEMO_REQUESTS;
  }
}

export async function saveStoredRequests(requests: ServiceRequest[]) {
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export async function getStoredBids(): Promise<Bid[]> {
  try {
    const json = await AsyncStorage.getItem(BIDS_KEY);
    if (!json) {
      await AsyncStorage.setItem(BIDS_KEY, JSON.stringify(INITIAL_DEMO_BIDS));
      return INITIAL_DEMO_BIDS;
    }
    return JSON.parse(json);
  } catch (e) {
    return INITIAL_DEMO_BIDS;
  }
}

export async function saveStoredBids(bids: Bid[]) {
  await AsyncStorage.setItem(BIDS_KEY, JSON.stringify(bids));
}

// Utility API functions
export async function fetchAllRequests(): Promise<ServiceRequest[]> {
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data;
    }
  }
  return await getStoredRequests();
}

export async function createServiceRequest(
  newReq: Omit<ServiceRequest, 'id' | 'created_at' | 'status' | 'bids_count'>
): Promise<ServiceRequest> {
  const requestItem: ServiceRequest = {
    ...newReq,
    id: 'req-' + Date.now(),
    status: 'open',
    created_at: new Date().toISOString(),
    bids_count: 0,
  };

  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([requestItem])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.log('Supabase insert fallback to local store');
    }
  }

  const existing = await getStoredRequests();
  const updated = [requestItem, ...existing];
  await saveStoredRequests(updated);
  return requestItem;
}

export async function fetchBidsForRequest(requestId: string): Promise<Bid[]> {
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    const { data, error } = await supabase
      .from('bids')
      .select('*, profiles(*)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data;
    }
  }

  const allBids = await getStoredBids();
  return allBids.filter((b) => b.request_id === requestId);
}

export async function placeBid(newBid: Omit<Bid, 'id' | 'created_at' | 'status'>): Promise<Bid> {
  const bidItem: Bid = {
    ...newBid,
    id: 'bid-' + Date.now(),
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    try {
      const { data, error } = await supabase
        .from('bids')
        .insert([bidItem])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.log('Supabase placeBid fallback');
    }
  }

  const allBids = await getStoredBids();
  const updatedBids = [bidItem, ...allBids];
  await saveStoredBids(updatedBids);

  // Update bid count on request
  const allRequests = await getStoredRequests();
  const reqIdx = allRequests.findIndex((r) => r.id === newBid.request_id);
  if (reqIdx !== -1) {
    allRequests[reqIdx].bids_count = (allRequests[reqIdx].bids_count || 0) + 1;
    await saveStoredRequests(allRequests);
  }

  return bidItem;
}

export async function acceptBid(requestId: string, bidId: string): Promise<boolean> {
  const allBids = await getStoredBids();
  const updatedBids = allBids.map((b) => {
    if (b.request_id === requestId) {
      return {
        ...b,
        status: b.id === bidId ? ('accepted' as const) : ('rejected' as const),
      };
    }
    return b;
  });
  await saveStoredBids(updatedBids);

  const allRequests = await getStoredRequests();
  const updatedRequests = allRequests.map((r) => {
    if (r.id === requestId) {
      return {
        ...r,
        status: 'in_progress' as const,
        accepted_bid_id: bidId,
      };
    }
    return r;
  });
  await saveStoredRequests(updatedRequests);

  return true;
}

export async function uploadVideoToSupabase(uri: string, filename: string): Promise<string> {
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filePath = `videos/${Date.now()}_${filename}`;

      const { data, error } = await supabase.storage
        .from('problem-videos')
        .upload(filePath, blob);

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('problem-videos')
          .getPublicUrl(filePath);
        return publicData.publicUrl;
      }
    } catch (err) {
      console.error('Error uploading video to Supabase:', err);
    }
  }

  // Return the local video URI if storage upload is offline/demo
  return uri;
}
