import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="game" />
        <Stack.Screen name="(customer)/index" />
        <Stack.Screen name="(customer)/create" />
        <Stack.Screen name="(customer)/request/[id]" />
        <Stack.Screen name="(worker)/index" />
        <Stack.Screen name="(worker)/my-bids" />
        <Stack.Screen name="bid/[requestId]" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
