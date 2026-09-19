import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchAllRequests, ServiceRequest } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    setRefreshing(true);
    const data = await fetchAllRequests();
    // Filter requests for current user or show all for demo
    setRequests(data);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const renderRequestCard = ({ item }: { item: ServiceRequest }) => {
    const isCompleted = item.status === 'completed';
    const isInProgress = item.status === 'in_progress';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/(customer)/request/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              isInProgress && styles.statusBadgeProgress,
              isCompleted && styles.statusBadgeCompleted,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isInProgress && styles.statusDotProgress,
                isCompleted && styles.statusDotCompleted,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isInProgress && styles.statusTextProgress,
                isCompleted && styles.statusTextCompleted,
              ]}
            >
              {item.status === 'open'
                ? 'Open for Bids'
                : item.status === 'in_progress'
                ? 'Worker Assigned'
                : 'Completed'}
            </Text>
          </View>
          <Text style={styles.categoryBadge}>{item.category}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color="#64748B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <View style={styles.bidCountBadge}>
            <Ionicons name="pricetag-outline" size={14} color="#2563EB" />
            <Text style={styles.bidCountText}>
              {item.bids_count || 0} {item.bids_count === 1 ? 'Bid' : 'Bids'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{profile.full_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push('/profile' as any)}
        >
          <Image
            source={{
              uri:
                profile.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.actionBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Have an electrical or repair issue?</Text>
          <Text style={styles.bannerSub}>
            Record a short 30s video & get bids from nearby electricians in minutes.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => router.push('/(customer)/create' as any)}
        >
          <Ionicons name="videocam" size={18} color="#FFFFFF" />
          <Text style={styles.postBtnText}>Post Request</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Problem Video Requests</Text>
        <Text style={styles.sectionCount}>{requests.length} total</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadRequests} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="videocam-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No service requests yet</Text>
            <Text style={styles.emptySub}>
              Tap the 'Post Request' button above to upload a 30-second problem video.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileBtn: {
    padding: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  actionBanner: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'column',
    gap: 12,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bannerSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  postBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    alignSelf: 'flex-start',
  },
  postBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 13,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusBadgeProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  statusDotProgress: {
    backgroundColor: '#D97706',
  },
  statusDotCompleted: {
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  statusTextProgress: {
    color: '#D97706',
  },
  statusTextCompleted: {
    color: '#059669',
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  bidCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bidCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
