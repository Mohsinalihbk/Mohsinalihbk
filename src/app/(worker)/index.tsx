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
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchAllRequests, ServiceRequest } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['All Trades', 'Electrical', 'Plumbing', 'HVAC & AC', 'Lighting', 'Handyman'];

export default function WorkerFeedScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Trades');
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    setRefreshing(true);
    const data = await fetchAllRequests();
    setRequests(data);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const filteredRequests = requests.filter((r) => {
    if (selectedCategory === 'All Trades') return true;
    return r.category === selectedCategory;
  });

  const renderRequestCard = ({ item }: { item: ServiceRequest }) => {
    return (
      <View style={styles.card}>
        {/* Video Thumbnail / Header */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri:
                  item.user_profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>
                {item.user_profile?.full_name || 'Homeowner'}
              </Text>
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Video Preview Banner */}
        <View style={styles.videoBanner}>
          <Ionicons name="play-circle" size={32} color="#2563EB" />
          <View style={{ flex: 1 }}>
            <Text style={styles.videoBannerTitle}>
              {item.video_duration || 30}s Problem Video Available
            </Text>
            <Text style={styles.videoBannerSub}>
              Tap below to inspect video & place bid
            </Text>
          </View>
        </View>

        {/* Footer actions */}
        <View style={styles.cardFooter}>
          {item.estimated_budget ? (
            <View style={styles.budgetBox}>
              <Text style={styles.budgetLabel}>Customer Budget</Text>
              <Text style={styles.budgetValue}>${item.estimated_budget}</Text>
            </View>
          ) : (
            <View style={styles.budgetBox}>
              <Text style={styles.budgetLabel}>Customer Budget</Text>
              <Text style={styles.budgetValue}>Open for Quotes</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.bidBtn}
            onPress={() => router.push(`/bid/${item.id}` as any)}
          >
            <Ionicons name="flash-sharp" size={16} color="#FFFFFF" />
            <Text style={styles.bidBtnText}>Inspect Video & Place Bid</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.proBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#059669" />
            <Text style={styles.proBadgeText}>PRO WORKER MODE</Text>
          </View>
          <Text style={styles.headerTitle}>Nearby Job Requests</Text>
        </View>

        <TouchableOpacity
          style={styles.myBidsBtn}
          onPress={() => router.push('/(worker)/my-bids' as any)}
        >
          <Ionicons name="list" size={18} color="#2563EB" />
          <Text style={styles.myBidsText}>My Bids</Text>
        </TouchableOpacity>
      </View>

      {/* Platformer Game Banner */}
      <TouchableOpacity
        style={styles.gameBanner}
        activeOpacity={0.85}
        onPress={() => router.push('/game' as any)}
      >
        <View style={styles.gameBannerContent}>
          <View style={styles.gameIconBadge}>
            <Ionicons name="game-controller" size={24} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gameBannerTitle}>🎮 Break Time? Play Platformer Game!</Text>
            <Text style={styles.gameBannerSub}>
              Double Jump, collect coins & beat high scores!
            </Text>
          </View>
          <View style={styles.playGameBtn}>
            <Text style={styles.playGameBtnText}>Play</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === cat && styles.catChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadRequests} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No open requests in this category</Text>
            <Text style={styles.emptySub}>
              Check back soon or select another trade category.
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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  proBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  gameBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  gameBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameIconBadge: {
    backgroundColor: '#312E81',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  gameBannerSub: {
    color: '#A5B4FC',
    fontSize: 12,
    marginTop: 2,
  },
  playGameBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playGameBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  myBidsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  myBidsText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  filterSection: {
    paddingBottom: 12,
  },
  catScroll: {
    paddingHorizontal: 20,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  videoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  videoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  videoBannerSub: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  budgetBox: {
    gap: 2,
  },
  budgetLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  bidBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  bidBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  },
});
