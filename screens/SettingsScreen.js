// screens/SettingsScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, TextInput, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SHADOW } from '../components/theme';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { logoutUser, updateProfile, resetPassword } from '../firebase';
import { daysLeft, fmtDate } from '../utils/dateUtils';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const nav = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, profile, setProfile, isPaid, isTrial, emailVerified } = useAuth();

  const [editMode, setEditMode]   = useState(false);
  const [name, setName]           = useState(profile?.name || '');
  const [phone, setPhone]         = useState(profile?.phone || '');
  const [city, setCity]           = useState(profile?.city || '');
  const [saving, setSaving]       = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Dynamic stylesheet based on current theme
  const S = makeStyles(colors);

  async function handleSaveProfile() {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
    setSaving(true);
    const { error } = await updateProfile(user.uid, { name: name.trim(), phone: phone.trim(), city: city.trim() });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else { setProfile(p => ({ ...p, name: name.trim(), phone: phone.trim(), city: city.trim() })); setEditMode(false); }
  }

  async function handlePasswordReset() {
    const { error } = await resetPassword(user.email);
    if (error) Alert.alert('Error', error);
    else { setResetSent(true); Alert.alert('Email Sent', 'Check your inbox for the password reset link.'); }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await logoutUser() },
    ]);
  }

  return (
    <View style={S.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle} accessibilityRole="header">Account & Settings</Text>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── PROFILE CARD ──────────────────────────────────────────── */}
        <View style={S.card}>
          <View style={S.profileTop}>
            <View style={S.avatar} accessible accessibilityLabel={`Profile picture for ${profile?.name}`}>
              <Text style={S.avatarLetter}>{profile?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.profileName}>{profile?.name}</Text>
              <Text style={S.profileEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={S.editBtn} onPress={() => setEditMode(v => !v)}
              accessibilityRole="button" accessibilityLabel={editMode ? 'Cancel edit' : 'Edit profile'}>
              <Ionicons name={editMode ? 'close-outline' : 'pencil-outline'} size={18} color={colors.navy} />
            </TouchableOpacity>
          </View>

          {editMode ? (
            <View style={S.editForm}>
              <EditField label="Full Name"  value={name}  onChange={setName}  colors={colors} />
              <EditField label="Phone"      value={phone} onChange={setPhone} colors={colors} keyboardType="phone-pad" />
              <EditField label="City"       value={city}  onChange={setCity}  colors={colors} autoCapitalize="words" />
              <TouchableOpacity style={S.saveBtn} onPress={handleSaveProfile} disabled={saving}
                accessibilityRole="button" accessibilityLabel="Save profile changes">
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.saveBtnTxt}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={S.profileDetails}>
              <View style={S.badgeRow}>
                <View style={[S.badge, emailVerified ? S.badgeVerified : S.badgeUnverified]}>
                  <Ionicons name={emailVerified ? 'checkmark-circle' : 'alert-circle-outline'}
                    size={12} color={emailVerified ? '#15803d' : '#92400e'} accessibilityElementsHidden />
                  <Text style={[S.badgeTxt, { color: emailVerified ? '#15803d' : '#92400e' }]}>
                    {emailVerified ? 'Email Verified' : 'Email Unverified'}
                  </Text>
                </View>
                <View style={[S.badge, isPaid ? S.badgeVerified : S.badgeUnverified]}>
                  <Ionicons name={isPaid ? 'shield-checkmark' : 'shield-outline'}
                    size={12} color={isPaid ? '#15803d' : '#92400e'} accessibilityElementsHidden />
                  <Text style={[S.badgeTxt, { color: isPaid ? '#15803d' : '#92400e' }]}>
                    {isPaid ? 'KYC Active' : 'KYC Pending'}
                  </Text>
                </View>
              </View>
              <DetailRow icon="phone-portrait-outline" label="Phone"      val={profile?.phone || 'Not set'}  colors={colors} />
              <DetailRow icon="location-outline"       label="City"       val={profile?.city ? `${profile.city}${profile.state ? ', ' + profile.state : ''}` : 'Not set'} colors={colors} />
              <DetailRow icon="school-outline"         label="Experience" val={profile?.experience || 'Not set'} colors={colors} />
              <DetailRow icon="analytics-outline"      label="Interests"  val={(profile?.interests || []).join(', ') || 'Not set'} colors={colors} />
            </View>
          )}
        </View>

        {/* ── SUBSCRIPTION CARD ─────────────────────────────────────── */}
        <View style={S.card}>
          <Text style={S.cardTitle} accessibilityRole="header">Subscription Status</Text>
          <View style={[S.statusBanner, isPaid ? S.statusActive : S.statusInactive]}>
            <Ionicons
              name={isPaid ? 'checkmark-circle' : isTrial ? 'time-outline' : 'close-circle-outline'}
              size={18}
              color={isPaid ? colors.green : isTrial ? colors.amber : colors.red}
              accessibilityElementsHidden
            />
            <Text style={[S.statusBannerTxt, { color: isPaid ? colors.green : isTrial ? colors.amber : colors.red }]}>
              {isPaid ? 'Active Subscription' : isTrial ? 'Free Trial' : 'No Active Subscription'}
            </Text>
          </View>
          {(isPaid || isTrial) && (
            <>
              <DetailRow icon="star-outline"     label="Plan"     val={profile?.plan || 'N/A'}    colors={colors} />
              <DetailRow icon="layers-outline"   label="Segment"  val={profile?.segment || 'N/A'} colors={colors} />
              <DetailRow icon="calendar-outline" label="Start"    val={fmtDate(profile?.planStart)} colors={colors} />
              <DetailRow icon="time-outline"     label="Expiry"   val={`${fmtDate(profile?.planExpiry)} (${daysLeft(profile?.planExpiry)} days left)`} colors={colors} />
            </>
          )}
          {!isPaid && (
            <TouchableOpacity style={S.subscribeBtn} onPress={() => nav.navigate('Subscribe')}
              accessibilityRole="button" accessibilityLabel="View subscription plans">
              <Text style={S.subscribeBtnTxt}>View Plans & Subscribe →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── APPEARANCE CARD ───────────────────────────────────────── */}
        <View style={S.card}>
          <Text style={S.cardTitle} accessibilityRole="header">Appearance</Text>

          {/* Dark Mode row — exactly like the reference screenshot style */}
          <View style={S.toggleRow} accessibilityLabel="Dark Mode toggle">
            <View style={[S.settingIconWrap, { backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF' }]}>
              <Ionicons
                name={isDark ? 'moon' : 'moon-outline'}
                size={20}
                color={isDark ? '#60A5FA' : colors.navy}
                accessibilityElementsHidden
              />
            </View>
            <View style={S.settingText}>
              <Text style={S.menuLabel}>Dark Mode</Text>
              <Text style={S.menuSub}>
                {isDark ? 'Dark theme is on — easier on the eyes at night' : 'Light theme is on — tap to switch to dark'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.navy }}
              thumbColor={isDark ? colors.gold : '#fff'}
              ios_backgroundColor={colors.border}
              accessibilityRole="switch"
              accessibilityState={{ checked: isDark }}
              accessibilityLabel="Toggle dark mode"
            />
          </View>

          {/* Theme preview strip */}
          <View style={[S.themePreview, { backgroundColor: colors.bg }]}>
            <View style={[S.themePreviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[S.themePreviewDot, { backgroundColor: colors.navy }]} />
              <View style={[S.themePreviewLine, { backgroundColor: colors.textMuted, width: '60%' }]} />
              <View style={[S.themePreviewLine, { backgroundColor: colors.border, width: '40%', marginTop: 4 }]} />
            </View>
            <View style={[S.themePreviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[S.themePreviewDot, { backgroundColor: colors.green }]} />
              <View style={[S.themePreviewLine, { backgroundColor: colors.textMuted, width: '70%' }]} />
              <View style={[S.themePreviewLine, { backgroundColor: colors.border, width: '50%', marginTop: 4 }]} />
            </View>
            <View style={[S.themePreviewCard, { backgroundColor: colors.navy }]}>
              <View style={[S.themePreviewDot, { backgroundColor: colors.gold }]} />
              <View style={[S.themePreviewLine, { backgroundColor: 'rgba(255,255,255,0.5)', width: '55%' }]} />
              <View style={[S.themePreviewLine, { backgroundColor: 'rgba(255,255,255,0.25)', width: '35%', marginTop: 4 }]} />
            </View>
          </View>
        </View>

        {/* ── SECURITY CARD ─────────────────────────────────────────── */}
        <View style={S.card}>
          <Text style={S.cardTitle} accessibilityRole="header">Security</Text>
          <TouchableOpacity style={S.menuRow} onPress={handlePasswordReset}
            accessibilityRole="button" accessibilityLabel="Send password reset email">
            <View style={[S.settingIconWrap, { backgroundColor: isDark ? '#1E2D1E' : '#F0FDF4' }]}>
              <Ionicons name="key-outline" size={18} color={colors.green} accessibilityElementsHidden />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.menuLabel}>Change Password</Text>
              <Text style={S.menuSub}>{resetSent ? '✓ Reset email sent to your inbox' : 'Send reset link to ' + user?.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} accessibilityElementsHidden />
          </TouchableOpacity>
        </View>

        {/* ── LEGAL CARD ────────────────────────────────────────────── */}
        <View style={S.card}>
          <Text style={S.cardTitle} accessibilityRole="header">Legal & Compliance</Text>
          <TouchableOpacity style={S.menuRow} onPress={() => nav.navigate('Agreement')}
            accessibilityRole="button" accessibilityLabel="View Research Analyst Agreement">
            <View style={[S.settingIconWrap, { backgroundColor: isDark ? '#2A200A' : colors.goldPale }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.gold} accessibilityElementsHidden />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.menuLabel}>RA Agreement</Text>
              <Text style={S.menuSub}>{profile?.agreementAccepted ? `✓ Accepted on ${fmtDate(profile?.agreementDate)}` : 'Not yet accepted'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} accessibilityElementsHidden />
          </TouchableOpacity>
          <View style={S.menuRow} accessible accessibilityLabel="SEBI Registration INH000024408">
            <View style={[S.settingIconWrap, { backgroundColor: isDark ? '#052E16' : colors.greenLight }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.green} accessibilityElementsHidden />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.menuLabel}>SEBI Registration</Text>
              <Text style={S.menuSub}>INH000024408 · Valid Dec 2025 – Dec 2030</Text>
            </View>
          </View>
        </View>

        {/* ── LOGOUT ────────────────────────────────────────────────── */}
        <TouchableOpacity style={S.logoutBtn} onPress={handleLogout}
          accessibilityRole="button" accessibilityLabel="Logout from your account">
          <Ionicons name="log-out-outline" size={18} color={colors.red} accessibilityElementsHidden />
          <Text style={S.logoutTxt}>Logout</Text>
        </TouchableOpacity>

        <Text style={S.version} accessibilityRole="text">Dynamic Money App v4.0 · SEBI RA Platform</Text>
      </ScrollView>
    </View>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function EditField({ label, value, onChange, colors, keyboardType, autoCapitalize }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMid, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: colors.inputBg,
          borderWidth: 1.5,
          borderColor: colors.inputBorder,
          borderRadius: RADIUS.md,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 14,
          color: colors.text,
          minHeight: 46,
        }}
        value={value}
        onChangeText={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        accessibilityLabel={label}
      />
    </View>
  );
}

function DetailRow({ icon, label, val, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
      accessible accessibilityLabel={`${label}: ${val}`}>
      <Ionicons name={icon} size={15} color={colors.textMuted} accessibilityElementsHidden />
      <Text style={{ fontSize: 12, color: colors.textLight, fontWeight: '600', width: 80 }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 12, color: colors.text, fontWeight: '700' }} numberOfLines={1}>{val}</Text>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────

function makeStyles(C) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: C.bg },
    header:           { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
    headerTitle:      { fontSize: 20, fontWeight: '900', color: C.text },
    scroll:           { flex: 1 },
    scrollContent:    { padding: 16, paddingBottom: 100, gap: 14 },

    card:             { backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: 18, ...SHADOW.sm, borderWidth: 1, borderColor: C.border },
    cardTitle:        { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 14 },

    // Profile
    profileTop:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    avatar:           { width: 56, height: 56, borderRadius: 28, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
    avatarLetter:     { fontSize: 22, fontWeight: '900', color: '#fff' },
    profileName:      { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 2 },
    profileEmail:     { fontSize: 12, color: C.textLight },
    editBtn:          { width: 40, height: 40, borderRadius: 10, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    editForm:         { gap: 2, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },
    saveBtn:          { backgroundColor: C.navy, borderRadius: RADIUS.md, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    saveBtnTxt:       { color: '#fff', fontSize: 14, fontWeight: '800' },
    badgeRow:         { flexDirection: 'row', gap: 8, marginBottom: 12 },
    badge:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    badgeVerified:    { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    badgeUnverified:  { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
    badgeTxt:         { fontSize: 11, fontWeight: '700' },
    profileDetails:   { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, gap: 2 },

    // Subscription
    statusBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: RADIUS.md, marginBottom: 12 },
    statusActive:     { backgroundColor: C.greenLight },
    statusInactive:   { backgroundColor: C.redLight },
    statusBannerTxt:  { fontSize: 13, fontWeight: '700' },
    subscribeBtn:     { backgroundColor: C.navy, borderRadius: RADIUS.md, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    subscribeBtnTxt:  { color: '#fff', fontSize: 13, fontWeight: '800' },

    // Appearance / Dark Mode
    toggleRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, minHeight: 62 },
    settingIconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    settingText:      { flex: 1 },
    themePreview:     { flexDirection: 'row', gap: 8, borderRadius: RADIUS.md, padding: 12, marginTop: 14, borderWidth: 1, borderColor: C.border },
    themePreviewCard: { flex: 1, borderRadius: 8, padding: 10, borderWidth: 1, gap: 2 },
    themePreviewDot:  { width: 14, height: 14, borderRadius: 7, marginBottom: 6 },
    themePreviewLine: { height: 5, borderRadius: 3 },

    // Menu rows
    menuRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, minHeight: 60 },
    menuLabel:        { fontSize: 13, fontWeight: '700', color: C.text },
    menuSub:          { fontSize: 11, color: C.textLight, marginTop: 2 },

    // Logout
    logoutBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.redLight, borderRadius: RADIUS.xl, minHeight: 54, borderWidth: 1, borderColor: C.red + '40' },
    logoutTxt:        { fontSize: 15, fontWeight: '800', color: C.red },
    version:          { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 4 },
  });
}
