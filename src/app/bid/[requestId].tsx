import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  fetchAllRequests,
  placeBid,
  ServiceRequest,
} from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

function ProblemVideoView({ url }: { url: string }) {
  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.videoWrapper}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
      />
    </View>
  );
}

export default function PlaceBidScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('1 Hour');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    if (!requestId) return;
    setLoading(true);
    const all = await fetchAllRequests();
    const found = all.find((r) => r.id === requestId);
    if (found) {
      setRequest(found);
      if (found.estimated_budget) {
        setAmount(found.estimated_budget.toString());
      }
    }
    setLoading(false);
  };

  const handleSubmitBid = async () => {
    if (!amount || isNaN(Number(amount))) {
      setErrorText('Please enter a valid bid amount ($)');
      return;
    }
    if (!message.trim()) {
      setErrorText('Please include a short message explaining your expertise/timeline');
      return;
    }

    setErrorText('');
    setSubmitting(true);

    try {
      await placeBid({
        request_id: requestId as string,
        worker_id: profile.id,
        amount: parseFloat(amount),
        estimated_time: estimatedTime,
        message: message.trim(),
        worker_profile: profile,
      });

      setSubmitting(false);
      Alert.alert(
        'Bid Submitted!',
        'Your quote and message have been sent to the customer.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(worker)/my-bids' as any),
          },
        ]
      );
    } catch (err: any) {
      setSubmitting(false);
      setErrorText(err.message || 'Failed to place bid');
    }
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
        <Text style={styles.errorText}>Job Request Not Found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Place Bid on Job</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Video Player */}
          <View style={styles.videoSection}>
            <Text style={styles.videoTitle}>30s Problem Video Analysis</Text>
            <ProblemVideoView url={request.video_url} />
          </View>

          {/* Request Overview */}
          <View style={styles.requestCard}>
            <Text style={styles.categoryBadge}>{request.category}</Text>
            <Text style={styles.reqTitle}>{request.title}</Text>
            <Text style={styles.reqDesc}>{request.description}</Text>
            <View style={styles.reqLocationRow}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.reqLocationText}>{request.location}</Text>
            </View>
          </View>

          {/* Bid Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Your Service Quote</Text>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Bid Price ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="150"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <Text style={styles.fieldLabel}>Est. Arrival / Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1 hour / Today"
                  placeholderTextColor="#94A3B8"
                  value={estimatedTime}
                  onChangeText={setEstimatedTime}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Message to Customer</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Explain how you can solve this issue, your experience, license, and tools..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {errorText ? <Text style={styles.errorMsgText}>{errorText}</Text> : null}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitBid}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit Quote Bid</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 4,
  },
  backBtn: {
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
  videoWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  reqTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  reqDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  reqLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  reqLocationText: {
    fontSize: 12,
    color: '#64748B',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
  },
  errorMsgText: {
    color: '#EF4444',
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
});
