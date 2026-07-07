import React from 'react';
import { Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, colors, fonts, radius, shadow } from '../theme';

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
      style={[{ height, opacity: disabled ? 0.6 : 1 }, style]}
    >
      <LinearGradient
        colors={gradients.gold}
        locations={gradients.goldLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, shadow.cta, { height, borderRadius: radius.lg }]}
      >
        <Text style={styles.label}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.goldOnGoldText, fontFamily: fonts.extrabold, fontSize: 16, letterSpacing: 0.2 },
});
