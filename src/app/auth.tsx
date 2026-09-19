import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, isLoading } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setErrorMsg('');

    try {
      if (isSignUp) {
        if (!fullName) {
          setErrorMsg('Please enter your full name');
          return;
        }
        await signUp(email, fullName, role);
      } else {
        await signIn(email, role);
      }
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="flash-sharp" size={36} color="#2563EB" />
            </View>
            <Text style={styles.title}>FixIt Video Market</Text>
            <Text style={styles.subtitle}>
              Connect home problems with nearby trusted professionals via 30s video
            </Text>
          </View>

          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am signing in as:</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'customer' && styles.roleOptionActive,
                ]}
                onPress={() => setRole('customer')}
              >
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={role === 'customer' ? '#2563EB' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    role === 'customer' && styles.roleOptionTextActive,
                  ]}
                >
                  Homeowner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'worker' && styles.roleOptionActive,
                ]}
                onPress={() => setRole('worker')}
              >
                <Ionicons
                  name="construct-outline"
                  size={20}
                  color={role === 'worker' ? '#2563EB' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleOptionText,
                    role === 'worker' && styles.roleOptionTextActive,
                  ]}
                >
                  Electrician / Pro
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignUp ? 'Create Account' : 'Continue / Demo Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>💡 Quick Demo Access</Text>
            <Text style={styles.demoDesc}>
              Tap continue to enter instant interactive mode as a{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {role === 'customer' ? 'Customer (Alex Johnson)' : 'Electrician Pro (Mike Watson)'}
              </Text>
            </Text>
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
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  roleOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleOptionTextActive: {
    color: '#2563EB',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: -4,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  demoBox: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  demoDesc: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
});
