// screens/ResearcherSignupScreen.js
// Researchers sign up with a secret invite code
// Account is created with isActive: false, pendingApproval: true
// God admin approves from ResearcherManagementScreen

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../components/theme';
import { registerResearcher } from '../firebase';
import { useNavigation } from '@react-navigation/native';

const SPECIALITIES = ['Equity', 'F&O', 'Index', 'MCX', 'All Segments'];

export default function ResearcherSignupScreen() {
  const nav = useNavigation();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [speciality,  setSpeciality]  = useState('Equity');
  const [bio,         setBio]         = useState('');
  const [inviteCode,  setInviteCode]  = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);

  function validate() {
    if (!name.trim())        return 'Full name is required.';
    if (!email.trim())       return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!phone.trim())       return 'Phone number is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    if (!inviteCode.trim())  return 'Invite code is required.';
    return null;
  }

  async function handleSignup() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    const { error: e } = await registerResearcher(
      email, password,
      { name: name.trim(), phone: phone.trim(), speciality, bio: bio.trim() },
      inviteCode.trim()
    );

    setLoading(false);

    if (e) { setError(e); return; }
    setDone(true);
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
        <LinearGradient colors={['#1e1b4b', '#4c1d95']} style={{ flex: 1 }}>
          <View style={s.successWrap}>
            <View style={s.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color="#4ade80" />
            </View>
            <Text style={s.successTitle}>Application Submitted!</Text>
            <Text style={s.successSub}>
              Your researcher account has been created and is{' '}
              <Text style={{ color: '#fbbf24', fontWeight: '800' }}>
                pending approval
              </Text>{' '}
              by the administrator.{'\n\n'}
              You will be notified once your account is activated. This usually takes 24 hours.
            </Text>
            <TouchableOpacity style={s.backBtn} onPress={() => nav.navigate('Login')}>
              <Text style={s.backBtnTxt}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
      <LinearGradient colors={['#1e1b4b', '#312e81']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => nav.goBack()} style={s.headerBack}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerIcon}>
              <Ionicons name="analytics" size={28} color="#a78bfa" />
            </View>
            <Text style={s.headerTitle}>Researcher Application</Text>
            <Text style={s.headerSub}>
              Apply to join the DM Research team{'\n'}
              Requires an invite code from admin
            </Text>
          </View>

          {/* Form card */}
          <View style={s.card}>

            {/* Invite code — shown first to fail fast */}
            <View style={s.inviteBox}>
              <Ionicons name="key" size={16} color="#a78bfa" />
              <Text style={s.inviteLabel}>Invite Code</Text>
            </View>
            <TextInput
              style={[s.input, s.inviteInput]}
              value={inviteCode}
              onChangeText={v => { setInviteCode(v); setError(''); }}
              placeholder="Enter your invite code"
              placeholderTextColor="rgba(167,139,250,0.5)"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={s.divider} />

            <FormField label="Full Name *" value={name} onChangeText={v => { setName(v); setError(''); }}
              placeholder="Your full name" autoCapitalize="words" />

            <FormField label="Email *" value={email} onChangeText={v => { setEmail(v); setError(''); }}
              placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />

            <FormField label="Phone *" value={phone} onChangeText={v => { setPhone(v); setError(''); }}
              placeholder="+91 98765 43210" keyboardType="phone-pad" />

            {/* Password */}
            <Text style={s.fieldLabel}>Password *</Text>
            <View style={s.pwdRow}>
              <TextInput
                style={{ flex: 1, fontSize: 14, color: COLORS.text, padding: 14 }}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="Min 6 characters"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 14 }}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <FormField label="Confirm Password *" value={confirm}
              onChangeText={v => { setConfirm(v); setError(''); }}
              placeholder="Repeat password" secureTextEntry={!showPass} />

            {/* Speciality */}
            <Text style={s.fieldLabel}>Speciality *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {SPECIALITIES.map(sp => (
                <TouchableOpacity
                  key={sp}
                  style={[s.specChip, speciality === sp && s.specChipOn]}
                  onPress={() => setSpeciality(sp)}>
                  <Text style={[s.specChipTxt, speciality === sp && s.specChipTxtOn]}>{sp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FormField label="Bio / Experience (optional)" value={bio}
              onChangeText={setBio}
              placeholder="Brief description of your market expertise..."
              multiline numberOfLines={3} />

            {/* Error */}
            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#dc2626" />
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={s.submitTxt}>Submit Application</Text>
                  </>
              }
            </TouchableOpacity>

            <Text style={s.noteText}>
              ℹ️ Your account will be reviewed and activated by the administrator.
              You cannot log in until your account is approved.
            </Text>
          </View>

          <TouchableOpacity onPress={() => nav.navigate('Login')} style={s.loginLink}>
            <Text style={s.loginLinkTxt}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function FormField({ label, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, props.multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholderTextColor={COLORS.textMuted}
        {...props}
      />
    </View>
  );
}

const s = StyleSheet.create({
  scroll:       { flexGrow: 1, padding: 20, paddingBottom: 40 },

  // Header
  header:       { alignItems: 'center', paddingTop: 52, marginBottom: 24 },
  headerBack:   { position: 'absolute', left: 0, top: 52, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerIcon:   { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(167,139,250,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.4)' },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 6 },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18 },

  // Card
  card:         { backgroundColor: '#fff', borderRadius: 22, padding: 22, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },

  // Invite code
  inviteBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  inviteLabel:  { fontSize: 13, fontWeight: '800', color: '#7c3aed' },
  inviteInput:  { backgroundColor: '#ede9fe', borderColor: '#c084fc', color: '#4c1d95', fontWeight: '700', letterSpacing: 1 },

  divider:      { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },

  fieldLabel:   { fontSize: 11, fontWeight: '700', color: COLORS.textMid, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 },
  input:        { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 16 },
  pwdRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 16 },

  specChip:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.offWhite },
  specChipOn:   { backgroundColor: '#312e81', borderColor: '#312e81' },
  specChipTxt:  { fontSize: 13, fontWeight: '700', color: COLORS.textMid },
  specChipTxtOn:{ color: '#fff' },

  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fee2e2', borderRadius: RADIUS.md, padding: 12, marginBottom: 16 },
  errorTxt:     { flex: 1, fontSize: 13, color: '#dc2626', fontWeight: '600' },

  submitBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#312e81', paddingVertical: 16, borderRadius: RADIUS.lg, marginBottom: 14 },
  submitTxt:    { fontSize: 16, fontWeight: '800', color: '#fff' },

  noteText:     { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 17 },
  loginLink:    { alignItems: 'center', paddingVertical: 12 },
  loginLinkTxt: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

  // Success
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon:  { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(74,222,128,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#4ade80' },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 16, textAlign: 'center' },
  successSub:   { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  backBtn:      { backgroundColor: '#a78bfa', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 20 },
  backBtnTxt:   { fontSize: 15, fontWeight: '800', color: '#fff' },
});
