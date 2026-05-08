import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useAppTheme } from '../theme';

export default function TaskFormRedirectScreen() {
  const theme = useAppTheme();
  const { taskId, assigneeId } = useLocalSearchParams<{ taskId?: string; assigneeId?: string }>();

  useEffect(() => {
    const queryParts = ['tab=tasks', 'composeTask=1'];
    if (typeof taskId === 'string' && taskId) {
      queryParts.push(`taskId=${encodeURIComponent(taskId)}`);
    }
    if (typeof assigneeId === 'string' && assigneeId) {
      queryParts.push(`assigneeId=${encodeURIComponent(assigneeId)}`);
    }

    router.replace((`/agent/team?${queryParts.join('&')}`) as never);
  }, [assigneeId, taskId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
