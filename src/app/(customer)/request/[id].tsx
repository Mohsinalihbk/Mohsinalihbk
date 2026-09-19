import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  fetchAllRequests,
  fetchBidsForRequest,
  acceptBid,
  ServiceRequest,
  Bid,
} from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

function ProblemVideoPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
      />
    </View>
  );
}

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const allRequests = await fetchAllRequests();
    const found = allRequests.find((r) => r.id === id);
    if (found) {
      setRequest(found);
      const reqBids = await fetchBidsForRequest(id);
      setBids(reqBids);
    }
    setLoading(false);
  };

  const handleAcceptBid = async (bid: Bid) => {
    if (!request) return;

    Alert.alert(
      'Accept Bid?',
      `Are you sure you want to accept ${bid.worker_profile?.full_name || 'Worker'}'s bid for $${bid.amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Hire',
          onPress: async () => {
            setAcceptingId(bid.id);
            await acceptBid(request.id, bid.id);
            await loadData();
            setAcceptingId(null);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Service Request Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Video Player */}
        <View style={styles.videoSection}>
          <Text style={styles.videoTitle}>30-Second Problem Video</Text>
          <ProblemVideoPlayer url={request.video_url} />
        </View>

        {/* Request Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.categoryBadge}>{request.category}</Text>
            <Text style={styles.statusBadge}>
              {request.status === 'open'
                ? 'Open for Bids'
                : request.status === 'in_progress'
                ? 'Worker Hired'
                : 'Completed'}
            </Text>
          </View>

          <Text style={styles.title}>{request.title}</Text>
          <Text style={styles.desc}>{request.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.infoBoxText}>{request.location}</Text>
            </View>

            {request.estimated_budget ? (
              <View style={styles.infoBox}>
                <Ionicons name="wallet-outline" size={16} color="#059669" />
                <Text style={styles.infoBoxText}>
                  Est. Budget: ${request.estimated_budget}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bids Section */}
        <View style={styles.bidsSection}>
          <View style={styles.bidsHeader}>
            <Text style={styles.bidsTitle}>
              Electrician & Worker Bids ({bids.length})
            </Text>
          </View>

          {bids.length === 0 ? (
            <View style={styles.emptyBids}>
              <Ionicons name="time-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyBidsText}>
                No bids placed yet. Local workers are reviewing your video!
              </Text>
            </View>
          ) : (
            bids.map((bid) => {
              const isAccepted = bid.status === 'accepted';
              const isWorkerHired = request.status === 'in_progress';

              return (
                <View
                  key={bid.id}
                  style={[
                    styles.bidCard,
                    isAccepted && styles.bidCardAccepted,
                  ]}
                >
                  <View style={styles.bidHeader}>
                    <View style={styles.workerInfo}>
                      <Image
                        source={{
                          uri:
                            bid.worker_profile?.avatar_url ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                        }}
                        style={styles.workerAvatar}
                      />
                      <View>
                        <Text style={styles.workerName}>
                          {bid.worker_profile?.full_name || 'Electrician'}
                        </Text>
                        <Text style={styles.workerTrade}>
                          {bid.worker_profile?.trade_specialty || 'Licensed Pro'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>${bid.amount}</Text>
                      <Text style={styles.timeText}>{bid.estimated_time}</Text>
                    </View>
                  </View>

                  <Text style={styles.bidMessage}>{bid.message}</Text>

                  <View style={styles.bidFooter}>
                    <View style={styles.ratingBox}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>
                        {bid.worker_profile?.rating || 4.9} Rating
                      </Text>
                    </View>

                    {isAccepted ? (
                      <View style={styles.hiredBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        <Text style={styles.hiredText}>Hired Worker</Text>
                      </View>
                    ) : isWorkerHired ? null : (
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAcceptBid(bid)}
                        disabled={acceptingId === bid.id}
                      >
                        {acceptingId === bid.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.acceptBtnText}>Accept Bid</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 18,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  videoSection: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  videoTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  videoContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  desc: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  bidsSection: {
    gap: 12,
  },
  bidsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyBids: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyBidsText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  bidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  bidCardAccepted: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  workerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  workerTrade: {
    fontSize: 12,
    color: '#64748B',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
  },
  bidMessage: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  acceptBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hiredText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
