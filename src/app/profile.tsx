import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { profile, activeRole, switchRole, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Account & Role Settings</Text>

        {/* Profile Card */}
        <View style={styles.card}>
          <Image
            source={{
              uri:
                profile.avatar_url ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.email}>{profile.email}</Text>

          {profile.trade_specialty ? (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.badgeText}>{profile.trade_specialty}</Text>
            </View>
          ) : null}

          {profile.rating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{profile.rating} / 5.0 Rating</Text>
            </View>
          ) : null}
        </View>

        {/* Switch Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Mode</Text>
          <Text style={styles.sectionSub}>
            Switch modes instantly to see how customers submit video requests or how electricians submit bids.
          </Text>

          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                activeRole === 'customer' && styles.toggleBtnActive,
              ]}
              onPress={() => {
                switchRole('customer');
                router.replace('/');
              }}
            >
              <Ionicons
                name="home-outline"
                size={20}
                color={activeRole === 'customer' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  activeRole === 'customer' && styles.toggleBtnTextActive,
                ]}
              >
                Customer Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                activeRole === 'worker' && styles.toggleBtnActive,
              ]}
              onPress={() => {
                switchRole('worker');
                router.replace('/');
              }}
            >
              <Ionicons
                name="construct-outline"
                size={20}
                color={activeRole === 'worker' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  activeRole === 'worker' && styles.toggleBtnTextActive,
                ]}
              >
                Worker Pro Mode
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details & Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{profile.phone || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoValue}>
              {profile.bio || 'Home service customer'}
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#EFF6FF',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  email: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  badgeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#2563EB',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    marginTop: 2,
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
