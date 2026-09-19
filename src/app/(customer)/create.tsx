import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '../../context/AuthContext';
import { createServiceRequest, uploadVideoToSupabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['Electrical', 'Plumbing', 'HVAC & AC', 'Lighting', 'Appliance Repair', 'Handyman'];

function PreviewVideoPlayer({ url }: { url: string }) {
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

export default function CreateRequestScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('Oakland, CA');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Media library access is required to upload a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const durationSec = asset.duration ? asset.duration / 1000 : 15;

      if (durationSec > 35) {
        Alert.alert(
          'Video Too Long',
          'Please select or record a video that is 30 seconds or shorter so workers can quickly review it.'
        );
        return;
      }

      setVideoUri(asset.uri);
      setVideoDuration(Math.round(durationSec));
    }
  };

  const recordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to record a video.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 30,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const durationSec = asset.duration ? asset.duration / 1000 : 15;
      setVideoUri(asset.uri);
      setVideoDuration(Math.round(durationSec));
    }
  };

  const handleUseDemoVideo = () => {
    // Quick demo video fallback
    setVideoUri('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    setVideoDuration(15);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a summary title');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please describe the problem details');
      return;
    }
    if (!videoUri) {
      setErrorMessage('Please upload or record a 30-second problem video');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let finalVideoUrl = videoUri;
      if (!videoUri.startsWith('http')) {
        const uploadedUrl = await uploadVideoToSupabase(videoUri, `problem_${Date.now()}.mp4`);
        finalVideoUrl = uploadedUrl;
      }

      await createServiceRequest({
        user_id: profile.id,
        title: title.trim(),
        category,
        description: description.trim(),
        video_url: finalVideoUrl,
        video_duration: videoDuration,
        estimated_budget: budget ? parseFloat(budget) : undefined,
        location: location.trim() || 'Nearby',
        user_profile: profile,
      });

      setIsSubmitting(false);
      router.replace('/(customer)' as any);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to submit request');
    }
  };

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
            <Text style={styles.headerTitle}>New Service Request</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Video Pick / Preview Section */}
          <View style={styles.videoCard}>
            <Text style={styles.sectionLabel}>
              1. Record or Upload 30-Sec Video <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <Text style={styles.sectionHint}>
              Show the outlet, breaker box, fixture or problem area clearly. Keep it under 30s.
            </Text>

            {videoUri ? (
              <View style={styles.previewContainer}>
                <PreviewVideoPlayer url={videoUri} />
                <View style={styles.videoMetaRow}>
                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={14} color="#2563EB" />
                    <Text style={styles.durationText}>{videoDuration}s Video Attached</Text>
                  </View>
                  <TouchableOpacity onPress={() => setVideoUri(null)}>
                    <Text style={styles.removeText}>Change Video</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.pickBox}>
                <Ionicons name="videocam-outline" size={42} color="#2563EB" />
                <Text style={styles.pickTitle}>Attach Problem Video</Text>
                <Text style={styles.pickSub}>Max 30 seconds</Text>

                <View style={styles.pickActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={recordVideo}>
                    <Ionicons name="camera" size={18} color="#2563EB" />
                    <Text style={styles.actionBtnText}>Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={pickVideo}>
                    <Ionicons name="folder-open" size={18} color="#2563EB" />
                    <Text style={styles.actionBtnText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.demoVideoBtn]}
                    onPress={handleUseDemoVideo}
                  >
                    <Ionicons name="sparkles" size={18} color="#D97706" />
                    <Text style={[styles.actionBtnText, { color: '#D97706' }]}>
                      Demo Clip
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Form details */}
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>2. Request Details</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, category === cat && styles.catChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        category === cat && styles.catChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Summary Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sparks coming from kitchen outlet"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Detailed Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what happens, when it started, and any safety concerns..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Est. Budget ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 150"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1.5 }]}>
                <Text style={styles.fieldLabel}>Location / Area</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Oakland, CA"
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Post Request for Bids</Text>
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
  content: {
    padding: 18,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  pickBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: 8,
    gap: 4,
  },
  pickTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  pickSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  pickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  demoVideoBtn: {
    backgroundColor: '#FEF3C7',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  previewContainer: {
    marginTop: 8,
    gap: 8,
  },
  videoWrapper: {
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  catScroll: {
    flexDirection: 'row',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#2563EB',
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
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
    height: 90,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
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
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
