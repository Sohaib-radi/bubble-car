import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';

export default function ErrorBanner({ message, style }: { message: string; style?: ViewStyle }) {
  return (
    <View style={[styles.container, style]}>
      <Feather name="alert-circle" size={16} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(220,90,90,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220,90,90,0.25)',
    borderRadius: radius.md,
  },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
});
