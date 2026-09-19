import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  fetchAllRequests,
  getStoredBids,
  ServiceRequest,
  Bid,
} from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface BidItemWithRequest extends Bid {
  request?: ServiceRequest;
}

export default function WorkerMyBidsScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [myBids, setMyBids] = useState<BidItemWithRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyBids = async () => {
    setRefreshing(true);
    const allBids = await getStoredBids();
    const allRequests = await fetchAllRequests();

    // Filter bids for active worker profile (or demo worker)
    const filteredBids = allBids
      .filter((b) => b.worker_id === profile.id || b.worker_id === 'work-201')
      .map((b) => ({
        ...b,
        request: allRequests.find((r) => r.id === b.request_id),
      }));

    setMyBids(filteredBids);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadMyBids();
    }, [profile.id])
  );

  const renderBidCard = ({ item }: { item: BidItemWithRequest }) => {
    const isAccepted = item.status === 'accepted';
    const isRejected = item.status === 'rejected';

    return (
      <View style={[styles.card, isAccepted && styles.cardAccepted]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isAccepted && styles.badgeAccepted]}>
            <Text
              style={[
                styles.badgeText,
                isAccepted && styles.badgeTextAccepted,
              ]}
            >
              {isAccepted ? 'Hired / Accepted' : isRejected ? 'Declined' : 'Pending Review'}
            </Text>
          </View>

          <Text style={styles.priceTag}>${item.amount}</Text>
        </View>

        {item.request ? (
          <View style={styles.requestSection}>
            <Text style={styles.requestTitle}>{item.request.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.locationText}>{item.request.location}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.bidDetailsBox}>
          <Text style={styles.bidMsgTitle}>Your Proposal:</Text>
          <Text style={styles.bidMsgText}>{item.message}</Text>
          <Text style={styles.estTimeText}>Est. Time: {item.estimated_time}</Text>
        </View>

        {isAccepted && item.request ? (
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => router.push(`/(customer)/request/${item.request?.id}` as any)}
          >
            <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
            <Text style={styles.contactBtnText}>View Customer & Job Details</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Submitted Bids</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={myBids}
        keyExtractor={(item) => item.id}
        renderItem={renderBidCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadMyBids} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="paper-plane-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No bids submitted yet</Text>
            <Text style={styles.emptySub}>
              Browse nearby jobs and submit quotes to start getting hired!
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardAccepted: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeAccepted: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeTextAccepted: {
    color: '#059669',
  },
  priceTag: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
  },
  requestSection: {
    gap: 4,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  bidDetailsBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  bidMsgTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  bidMsgText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  estTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 4,
  },
  contactBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
