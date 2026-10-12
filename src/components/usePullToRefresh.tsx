import React, { useState } from 'react';
import { RefreshControl } from 'react-native';
import { colors } from '../theme';

// Pull-down-to-reload for a screen's ScrollView: pass `load`, put the result in `refreshControl`.
export default function usePullToRefresh(load: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.gold}
      colors={[colors.gold]}
      progressBackgroundColor={colors.surface}
    />
  );
}
