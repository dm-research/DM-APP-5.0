// components/LogoMark.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

export default function LogoMark({ size = 56, showText = true, light = true }) {
  const s = size;
  const textColor = light ? '#fff' : COLORS.navy;
  const subColor  = light ? 'rgba(255,255,255,0.55)' : COLORS.textLight;

  return (
    <View style={[styles.wrap, showText && { gap: 10 }]}>
      {/* Shield icon */}
      <View style={[styles.shield, {
        width: s, height: s,
        borderRadius: s * 0.22,
        borderColor: 'rgba(180,137,0,0.5)',
      }]}>
        {/* Candlestick up arrow */}
        <Ionicons name="trending-up" size={s * 0.5} color={COLORS.gold} />
        {/* Small shield checkmark overlay */}
        <View style={[styles.badge, { width: s*0.3, height: s*0.3, borderRadius: s*0.1 }]}>
          <Ionicons name="shield-checkmark" size={s * 0.2} color={COLORS.goldLight} />
        </View>
      </View>

      {showText && (
        <View style={styles.textBlock}>
          <Text style={[styles.brand, { color: textColor, fontSize: s * 0.36 }]}>
            DYNAMIC MONEY
          </Text>
          <Text style={[styles.sub, { color: subColor, fontSize: s * 0.14 }]}>
            Research Advisory · INH000024408
          </Text>
        </View>
      )}
    </View>
  );
}

export function LogoIcon({ size = 56 }) {
  const s = size;
  return (
    <View style={[styles.shield, {
      width: s, height: s,
      borderRadius: s * 0.22,
      borderColor: 'rgba(180,137,0,0.5)',
    }]}>
      <Ionicons name="trending-up" size={s * 0.5} color={COLORS.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { alignItems: 'center' },
  shield:     { backgroundColor: COLORS.navyDark, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  badge:      { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  textBlock:  { alignItems: 'center', gap: 2 },
  brand:      { fontWeight: '900', letterSpacing: 1.5 },
  sub:        { fontWeight: '600', letterSpacing: 0.8 },
});
