import React from 'react';
import { AuthNavigator } from './AuthNavigator';
import { GroupNavigator } from './GroupNavigator';
import { MainTabsNavigator } from './MainTabsNavigator';
import { useAppSession } from '../providers/AppSessionProvider';

export function RootNavigator() {
  const { hasActiveGroup, isAuthenticated } = useAppSession();

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!hasActiveGroup) {
    return <GroupNavigator />;
  }

  return <MainTabsNavigator />;
}
