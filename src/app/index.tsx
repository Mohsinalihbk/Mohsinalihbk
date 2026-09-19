import React from 'react';
import { useAuth } from '../context/AuthContext';
import CustomerDashboardScreen from './(customer)/index';
import WorkerFeedScreen from './(worker)/index';

export default function EntryIndexScreen() {
  const { activeRole } = useAuth();

  if (activeRole === 'worker') {
    return <WorkerFeedScreen />;
  }

  return <CustomerDashboardScreen />;
}
