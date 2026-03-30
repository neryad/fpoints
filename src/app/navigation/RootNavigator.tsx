import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { GroupNavigator } from './GroupNavigator';
import { MainTabsNavigator } from './MainTabsNavigator';
import { useAppSession } from '../providers/AppSessionProvider';
import { colors } from '../../core/theme/colors';

export function RootNavigator() {
  const { hasActiveGroup, isAuthenticated, isBootstrapping } = useAppSession();

  if (isBootstrapping) {

    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
    
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!hasActiveGroup) {
    return <GroupNavigator />;
  }

  return <MainTabsNavigator />;
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});