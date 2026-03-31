// screens/LoginScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Animated, StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../components/theme';
import { loginUser, resetPassword } from '../firebase';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const nav = useNavigation();
  const [tab, setTab]           = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  function doShake() {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 5,   duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    setError(''); setSuccess('');
    if (!email.trim() || !password) { setError('Please enter your email and password.'); doShake(); return; }
    setLoading(true);
    const { error: e } = await loginUser(email, password);
    setLoading(false);
    if (e) { setError(e); doShake(); }
  }

  async function handleReset() {
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Please enter your email address.'); doShake(); return; }
    setLoading(true);
    try {
      const { error: e } = await resetPassword(email);
      setLoading(false);
      if (e) { setError(e); doShake(); }
      else setSuccess('Reset link sent! Check your inbox and spam folder.');
    } catch (nativeError) {
      setLoading(false);
      setError('Service temporarily unavailable. Please try again.');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />
      <LinearGradient colors={[COLORS.navyDark, COLORS.navy, COLORS.navyLight]} style={s.gradient}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">

          {/* Logo */}
          <View style={s.logoArea} accessibilityRole="header">
            <View style={s.iconWrap}>
              <Ionicons name="trending-up" size={36} color={COLORS.gold} />
              <View style={s.iconBadge}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.goldLight} />
              </View>
            </View>
            <Text style={s.brandName}>DYNAMIC MONEY</Text>
            <Text style={s.brandSub}>Research Advisory Services</Text>
            <View style={s.sebiRow}>
              <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
              <Text style={s.sebiText}>SEBI Registered · INH000024408</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={s.tabRow}>
            {[['login','Login'],['reset','Forgot Password']].map(([k,l]) => (
              <TouchableOpacity key={k} style={[s.tab, tab===k && s.tabOn]}
                onPress={() => { setTab(k); setError(''); setSuccess(''); }}>
                <Text style={[s.tabTxt, tab===k && s.tabTxtOn]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Card */}
          <Animated.View style={[s.card, { transform: [{ translateX: shake }] }]}>
            <Text style={s.cardTitle}>
              {tab === 'login' ? 'Welcome Back' : 'Reset Password'}
            </Text>
            <Text style={s.cardSub}>
              {tab === 'login' ? 'Sign in to your account' : 'Enter your registered email'}
            </Text>

            <View style={s.field}>
              <Text style={s.label}>Email Address</Text>
              <TextInput style={s.input} value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                placeholder="you@example.com" placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            {tab === 'login' && (
              <View style={s.field}>
                <Text style={s.label}>Password</Text>
                <View style={s.inputRow}>
                  <TextInput style={s.innerInput}
                    value={password} onChangeText={t => { setPassword(t); setError(''); }}
                    placeholder="Your password" placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPass} />
                  <TouchableOpacity style={s.eye} onPress={() => setShowPass(v => !v)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.red} />
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            )}
            {!!success && (
              <View style={s.successBox}>
                <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.green} />
                <Text style={s.successTxt}>{success}</Text>
              </View>
            )}

            <TouchableOpacity style={s.primaryBtn}
              onPress={tab === 'login' ? handleLogin : handleReset}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryTxt}>{tab === 'login' ? 'Sign In →' : 'Send Reset Link'}</Text>}
            </TouchableOpacity>

            {/* Register as user */}
            <TouchableOpacity style={s.registerBtn} onPress={() => nav.navigate('Register')}>
              <Text style={s.registerTxt}>
                New user?{' '}
                <Text style={{ color: COLORS.navy, fontWeight: '700' }}>Create Account →</Text>
              </Text>
            </TouchableOpacity>

            {/* ✅ Researcher signup link */}
            <TouchableOpacity
              style={s.researcherBtn}
              onPress={() => nav.navigate('ResearcherSignup')}>
              <View style={s.researcherBtnInner}>
                <Ionicons name="analytics-outline" size={14} color="#7c3aed" />
                <Text style={s.researcherBtnTxt}>Apply as Researcher</Text>
                <Ionicons name="arrow-forward" size={12} color="#7c3aed" />
              </View>
            </TouchableOpacity>

            {/* Help */}
            <View style={s.helpDivider}>
              <View style={s.helpLine} />
              <Text style={s.helpDividerTxt}>Need help?</Text>
              <View style={s.helpLine} />
            </View>

            <TouchableOpacity
              style={s.waHelpBtn}
              onPress={() => Linking.openURL('https://wa.me/918269555558?text=Hi%2C%20I%20need%20help%20with%20my%20DM%20Research%20account.')}>
              <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
              <Text style={s.waHelpTxt}>WhatsApp Support  ·  +91 82695 55558</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.disclaimer}>
            Investment in securities market are subject to market risks.{'\n'}
            Past performance is not indicative of future results.
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  gradient:       { flex: 1 },
  scroll:         { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, paddingVertical: 48 },
  logoArea:       { alignItems: 'center', marginBottom: 28 },
  iconWrap:       { width: 68, height: 68, borderRadius: 18, backgroundColor: 'rgba(11,30,61,0.8)', borderWidth: 1.5, borderColor: 'rgba(180,137,0,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconBadge:      { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 6, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.gold },
  brandName:      { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 3 },
  brandSub:       { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  sebiRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  sebiText:       { fontSize: 10, color: '#4ade80', fontWeight: '600' },
  tabRow:         { flexDirection: 'row', width: '100%', maxWidth: 420, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 4 },
  tab:            { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11, minHeight: 38 },
  tabOn:          { backgroundColor: '#fff' },
  tabTxt:         { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  tabTxtOn:       { color: COLORS.navy },
  card:           { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  cardTitle:      { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 3 },
  cardSub:        { fontSize: 12, color: COLORS.textMuted, marginBottom: 18 },
  field:          { marginBottom: 14 },
  label:          { fontSize: 10, fontWeight: '700', color: COLORS.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:          { backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: COLORS.text, minHeight: 46 },
  inputRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, minHeight: 46 },
  innerInput:     { flex: 1, fontSize: 14, color: COLORS.text, paddingHorizontal: 13, paddingVertical: 11 },
  eye:            { padding: 12, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  errorBox:       { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 10, marginBottom: 12 },
  errorTxt:       { flex: 1, fontSize: 12, color: '#dc2626', lineHeight: 17 },
  successBox:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 10, marginBottom: 12 },
  successTxt:     { flex: 1, fontSize: 12, color: '#15803d', lineHeight: 17 },
  primaryBtn:     { backgroundColor: COLORS.navy, borderRadius: RADIUS.md, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryTxt:     { color: '#fff', fontSize: 15, fontWeight: '800' },
  registerBtn:    { alignItems: 'center', paddingVertical: 8, minHeight: 40 },
  registerTxt:    { fontSize: 12, color: COLORS.textMuted },
  // ✅ Researcher apply button
  researcherBtn:  { marginTop: 4, marginBottom: 4 },
  researcherBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ede9fe', borderRadius: RADIUS.md, paddingVertical: 10, borderWidth: 1, borderColor: '#c4b5fd' },
  researcherBtnTxt:   { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  helpDivider:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 10 },
  helpLine:       { flex: 1, height: 1, backgroundColor: COLORS.border },
  helpDividerTxt: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  waHelpBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: RADIUS.md, paddingVertical: 10, minHeight: 42 },
  waHelpTxt:      { fontSize: 12, color: '#15803d', fontWeight: '700' },
  disclaimer:     { fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 16, maxWidth: 300 },
});
