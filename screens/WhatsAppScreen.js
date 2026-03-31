// screens/WhatsAppScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SHADOW } from '../components/theme';
import { useTheme } from '../components/ThemeContext';

function open(url) {
  Linking.openURL(url).catch(() => {});
}

export default function WhatsAppScreen() {
  const { colors, isDark } = useTheme();
  const S = makeStyles(colors);

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1E3D" />

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── HERO ───────────────────────────────────────────────────── */}
        <LinearGradient colors={['#0B1E3D', '#102A56']} style={S.hero}>
          <View style={S.heroIconWrap} accessibilityElementsHidden>
            <Ionicons name="headset" size={36} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={S.heroTitle}>Need Help?</Text>
          <Text style={S.heroSub}>
            Chat with our research desk.{'\n'}We respond during market hours.
          </Text>

          {/* ── PRIMARY WHATSAPP CTA — compact pill style ── */}
          <TouchableOpacity
            style={S.waPrimary}
            onPress={() => open('https://wa.me/918269555558?text=Hi%2C%20I%20have%20a%20query%20regarding%20Dynamic%20Money%20Research%20services.')}
            accessibilityRole="button"
            accessibilityLabel="Connect on WhatsApp +91 82695 55558">
            <Ionicons name="logo-whatsapp" size={18} color="#fff" accessibilityElementsHidden />
            <Text style={S.waPrimaryTxt}>WhatsApp Us</Text>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" accessibilityElementsHidden />
          </TouchableOpacity>

          <Text style={S.waNum}>+91 82695 55558  ·  Primary</Text>
        </LinearGradient>

        {/* ── SUPPORT HOURS ─────────────────────────────────────────── */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={[S.cardIconWrap, { backgroundColor: colors.navy + '15' }]}>
              <Ionicons name="time-outline" size={18} color={colors.navy} accessibilityElementsHidden />
            </View>
            <Text style={S.cardTitle}>Support Hours</Text>
          </View>
          {[
            ['Mon – Fri', '9:00 AM – 6:00 PM', false],
            ['Saturday',  '9:00 AM – 1:00 PM', false],
            ['Sunday',    'Closed',             true],
          ].map(([day, hours, closed]) => (
            <View key={day} style={S.hoursRow}>
              <Text style={S.hoursDay}>{day}</Text>
              <Text style={[S.hoursTime, closed && { color: colors.red }]}>{hours}</Text>
            </View>
          ))}
          <View style={S.hoursNote}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textLight} accessibilityElementsHidden />
            <Text style={S.hoursNoteTxt}>During market hours (9–3:30 PM), response may be slightly delayed</Text>
          </View>
        </View>

        {/* ── ALL CHANNELS ──────────────────────────────────────────── */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={[S.cardIconWrap, { backgroundColor: colors.navy + '15' }]}>
              <Ionicons name="call-outline" size={18} color={colors.navy} accessibilityElementsHidden />
            </View>
            <Text style={S.cardTitle}>All Channels</Text>
          </View>
          {[
            { icon: 'logo-whatsapp', color: '#16a34a', label: 'WhatsApp (Primary)',   val: '+91 82695 55558',        url: 'https://wa.me/918269555558' },
            { icon: 'logo-whatsapp', color: '#16a34a', label: 'WhatsApp (Alternate)', val: '+91 98276 90593',        url: 'https://wa.me/919827690593' },
            { icon: 'mail-outline',  color: colors.navy, label: 'Support Email',      val: 'support@dmresearch.in', url: 'mailto:support@dmresearch.in' },
            { icon: 'mail-outline',  color: colors.navy, label: 'General Enquiry',    val: 'info@dmresearch.in',    url: 'mailto:info@dmresearch.in' },
            { icon: 'globe-outline', color: '#0891b2',  label: 'Website',             val: 'www.dmresearch.in',     url: 'https://dmresearch.in' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={S.contactRow}
              onPress={() => open(item.url)} accessibilityRole="button"
              accessibilityLabel={`${item.label}: ${item.val}`}>
              <View style={[S.contactIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} accessibilityElementsHidden />
              </View>
              <View style={S.contactText}>
                <Text style={S.contactLabel}>{item.label}</Text>
                <Text style={S.contactVal} numberOfLines={1}>{item.val}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} accessibilityElementsHidden />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SEBI GRIEVANCE ────────────────────────────────────────── */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={[S.cardIconWrap, { backgroundColor: '#dcfce720' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#15803d" accessibilityElementsHidden />
            </View>
            <Text style={S.cardTitle}>SEBI Grievance Redressal</Text>
          </View>
          <Text style={S.grievanceNote}>
            For unresolved complaints, escalate through official SEBI portals:
          </Text>
          {[
            { label: 'SEBI SCORES',      url: 'https://scores.gov.in',          desc: 'scores.gov.in' },
            { label: 'SmartODR',         url: 'https://smartodr.in',            desc: 'smartodr.in' },
            { label: 'Compliance Email', url: 'mailto:compliance@dmresearch.in', desc: 'compliance@dmresearch.in' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={S.grievanceRow}
              onPress={() => open(item.url)} accessibilityRole="button"
              accessibilityLabel={`${item.label}: ${item.desc}`}>
              <View style={S.grievanceIconWrap}>
                <Ionicons name="link-outline" size={14} color="#15803d" accessibilityElementsHidden />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.grievanceLabel}>{item.label}</Text>
                <Text style={S.grievanceDesc} numberOfLines={1}>{item.desc}</Text>
              </View>
              <Ionicons name="open-outline" size={14} color={colors.textMuted} accessibilityElementsHidden />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── OFFICE ADDRESS ────────────────────────────────────────── */}
        <View style={[S.card, { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }]}>
          <View style={[S.cardIconWrap, { backgroundColor: colors.navy + '15' }]}>
            <Ionicons name="location-outline" size={18} color={colors.navy} accessibilityElementsHidden />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.addressTitle}>Registered Office</Text>
            <Text style={S.addressTxt}>
              08 Aranya Nagar, Sector-E, Slice-3,{'\n'}
              Scheme No. 78, Indore, MP – 452010
            </Text>
          </View>
        </View>

        {/* ── SEBI DISCLAIMER ───────────────────────────────────────── */}
        <View style={S.disclaimerBox}>
          <Text style={S.disclaimerTxt}>
            SEBI Reg. No.: INH000024408 · Dynamic Money Research Advisory Services
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: C.bg },
    scroll:           { flex: 1 },
    scrollContent:    { paddingBottom: 100 },

    // Hero
    hero:             { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
    heroIconWrap:     { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    heroTitle:        { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 5 },
    heroSub:          { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 18 },

    // ── Compact WhatsApp pill button ──
    waPrimary:        {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#16a34a',
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 50,          // pill shape
      alignSelf: 'center',       // doesn't stretch full width
      ...SHADOW.md,
    },
    waPrimaryTxt:     { color: '#fff', fontSize: 14, fontWeight: '800' },
    waNum:            { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10, fontWeight: '600' },

    // Cards
    card:             { backgroundColor: C.surface, borderRadius: RADIUS.xl, marginHorizontal: 16, marginTop: 14, padding: 18, borderWidth: 1, borderColor: C.border, ...SHADOW.sm },
    cardHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    cardIconWrap:     { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    cardTitle:        { fontSize: 14, fontWeight: '800', color: C.text },

    // Hours
    hoursRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    hoursDay:         { fontSize: 13, color: C.textMid, fontWeight: '600' },
    hoursTime:        { fontSize: 13, color: C.text, fontWeight: '700' },
    hoursNote:        { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 },
    hoursNoteTxt:     { fontSize: 11, color: C.textLight, flex: 1, lineHeight: 16 },

    // Contacts
    contactRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, minHeight: 52 },
    contactIcon:      { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    contactText:      { flex: 1, minWidth: 0 },
    contactLabel:     { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 2 },
    contactVal:       { fontSize: 13, color: C.text, fontWeight: '700' },

    // Grievance
    grievanceNote:    { fontSize: 12, color: C.textLight, lineHeight: 18, marginBottom: 12 },
    grievanceRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, minHeight: 48 },
    grievanceIconWrap:{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    grievanceLabel:   { fontSize: 13, fontWeight: '700', color: C.navy },
    grievanceDesc:    { fontSize: 11, color: C.textLight, marginTop: 1 },

    // Address
    addressTitle:     { fontSize: 12, fontWeight: '700', color: C.textLight, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    addressTxt:       { fontSize: 13, color: C.textMid, lineHeight: 20 },

    // Disclaimer
    disclaimerBox:    { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.lg, marginHorizontal: 16, marginTop: 14, padding: 14, borderWidth: 1, borderColor: C.border },
    disclaimerTxt:    { fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 17 },
  });
}
