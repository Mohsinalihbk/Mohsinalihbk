import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserProfile, UserRole } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

const DEMO_CUSTOMER: UserProfile = {
  id: 'cust-101',
  email: 'alex@example.com',
  full_name: 'Alex Johnson (Customer)',
  role: 'customer',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  phone: '(510) 555-0122',
};

const DEMO_WORKER: UserProfile = {
  id: 'work-201',
  email: 'sparky.mike@example.com',
  full_name: 'Mike Watson (Electrician)',
  role: 'worker',
  trade_specialty: 'Master Electrician',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  phone: '(510) 555-0199',
  rating: 4.9,
  bio: 'Licensed & Insured Master Electrician with 12+ years experience solving residential and commercial issues.',
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  session: Session | null;
  isLoading: boolean;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  signIn: (email: string, role?: UserRole) => Promise<void>;
  signUp: (email: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [profile, setProfile] = useState<UserProfile>(DEMO_CUSTOMER);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial Supabase Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data as UserProfile);
        setActiveRole(data.role);
      }
    } catch (e) {
      console.log('Using default profile');
    }
  };

  const switchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (newRole === 'customer') {
      setProfile(DEMO_CUSTOMER);
    } else {
      setProfile(DEMO_WORKER);
    }
  };

  const signIn = async (email: string, role: UserRole = 'customer') => {
    setIsLoading(true);
    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
      try {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) console.error('Sign in error:', error);
      } catch (e) {
        console.error(e);
      }
    }
    // Set active profile based on chosen role
    switchRole(role);
    setIsLoading(false);
  };

  const signUp = async (email: string, name: string, role: UserRole) => {
    setIsLoading(true);
    const newProfile: UserProfile = {
      id: 'user-' + Date.now(),
      email,
      full_name: name,
      role,
      trade_specialty: role === 'worker' ? 'Electrician / Handyman' : undefined,
    };
    setProfile(newProfile);
    setActiveRole(role);
    setIsLoading(false);
  };

  const signOut = async () => {
    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setProfile(DEMO_CUSTOMER);
    setActiveRole('customer');
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        activeRole,
        switchRole,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
