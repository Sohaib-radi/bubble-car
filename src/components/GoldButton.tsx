import React from 'react';
import { Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, colors, fonts, radius, shadow } from '../theme';

// Muted, fully opaque look for the disabled state. (Lowering `opacity` instead
// made Android draw a dark rectangle behind the label.)
const DISABLED_COLORS = ['#3a3226', '#4d4230', '#3a3226'] as const;

export default function GoldButton({
  title,
  onPress,
  style,
  height = 58,
  disabled = false,
}: {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  height?: number;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[{ height }, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <LinearGradient
        colors={disabled ? DISABLED_COLORS : gradients.gold}
        locations={disabled ? undefined : gradients.goldLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, !disabled && shadow.cta, { height, borderRadius: radius.lg }]}
      >
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  label: { color: colors.goldOnGoldText, fontFamily: fonts.extrabold, fontSize: 16, letterSpacing: 0.2 },
  labelDisabled: { color: 'rgba(243,241,234,0.4)' },
});
