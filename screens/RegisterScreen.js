// screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../components/theme';
import { registerUser } from '../firebase';
import { useNavigation } from '@react-navigation/native';

const STEPS = ['Basic Info', 'Trading Profile', 'Financial Profile'];

const EXPERIENCE  = ['Beginner', 'Intermediate', 'Advanced'];
const INTERESTS   = ['Equity', 'Options', 'Intraday', 'Positional', 'Investment'];
const OCCUPATIONS = ['Salaried', 'Business Owner', 'Professional', 'Student', 'Retired', 'Other'];
const INCOMES     = ['Below ₹2.5L', '₹2.5L–5L', '₹5L–10L', '₹10L–25L', 'Above ₹25L'];
const RISK        = ['Conservative', 'Moderate', 'Aggressive'];
const STATES      = ['Madhya Pradesh','Maharashtra','Gujarat','Rajasthan','Delhi','Karnataka','Tamil Nadu','Uttar Pradesh','West Bengal','Other'];

export default function RegisterScreen() {
  const nav = useNavigation();
  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Step 1
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [city, setCity]         = useState('');
  const [state, setState]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');

  // Step 2
  const [experience, setExperience]   = useState('');
  const [interests, setInterests]     = useState([]);

  // Step 3
  const [occupation, setOccupation]   = useState('');
  const [income, setIncome]           = useState('');
  const [risk, setRisk]               = useState('');

  function toggleInterest(item) {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  }

  function validateStep() {
    if (step === 0) {
      if (!name.trim())      return 'Please enter your full name.';
      if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) return 'Please enter a valid 10-digit Indian mobile number.';
      if (!email.trim())     return 'Please enter your email.';
      if (!city.trim())      return 'Please enter your city.';
      if (!state)            return 'Please select your state.';
      if (password.length < 6) return 'Password must be at least 6 characters.';
      if (password !== confirm) return 'Passwords do not match.';
    }
    if (step === 1) {
      if (!experience)        return 'Please select your trading experience.';
      if (!interests.length)  return 'Please select at least one market interest.';
    }
    if (step === 2) {
      if (!occupation)        return 'Please select your occupation.';
      if (!income)            return 'Please select your income range.';
      if (!risk)              return 'Please select your risk appetite.';
    }
    return null;
  }

  async function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    if (step < 2) { setStep(s => s + 1); return; }
    // Final submit
    setLoading(true);
    const { error: e } = await registerUser(email, password, {
      name: name.trim(), phone: phone.trim(), city: city.trim(), state,
      experience, interests, occupation, income, riskAppetite: risk,
    });
    setLoading(false);
    if (e) { setError(e); return; }
    // Show verification notice — auth listener will navigate once user logs in
    setRegistered(true);
  }

  // Verification notice screen — shown after successful registration
  if (registered) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />
        <LinearGradient colors={[COLORS.navyDark, COLORS.navy]} style={s.gradient}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.green + '22',
              alignItems: 'center', justifyContent: 'center', marginBottom: 22, borderWidth: 2, borderColor: COLORS.green }}>
              <Ionicons name="mail-outline" size={36} color={COLORS.green} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 12 }}>
              Account Created! 🎉
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
              A verification email has been sent to{' '}
              <Text style={{ color: COLORS.gold, fontWeight: '700' }}>{email}</Text>.
              {' '}Please verify your email, then sign in.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: COLORS.gold, borderRadius: RADIUS.md, minHeight: 54,
                alignItems: 'center', justifyContent: 'center', width: '100%' }}
              onPress={() => nav.navigate('Login')}
              accessibilityRole="button"
              accessibilityLabel="Go to login screen"
            >
              <Text style={{ color: COLORS.navyDark, fontSize: 16, fontWeight: '900' }}>
                Go to Login →
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />
      <LinearGradient colors={[COLORS.navyDark, COLORS.navy]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => step > 0 ? setStep(s => s-1) : nav.goBack()}
              style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={s.headerTitle} accessibilityRole="header">Create Account</Text>
              <Text style={s.headerSub}>Step {step + 1} of 3 — {STEPS[step]}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={s.progressBg} accessibilityRole="progressbar" accessibilityValue={{ now: step+1, min: 1, max: 3 }}>
            <View style={[s.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} />
          </View>

          <View style={s.card}>
            {step === 0 && <Step1
              name={name} setName={setName} phone={phone} setPhone={setPhone}
              email={email} setEmail={setEmail} city={city} setCity={setCity}
              state={state} setState={setState} password={password} setPassword={setPassword}
              confirm={confirm} setConfirm={setConfirm} showPass={showPass} setShowPass={setShowPass}
              clear={() => setError('')}
            />}
            {step === 1 && <Step2
              experience={experience} setExperience={setExperience}
              interests={interests} toggleInterest={toggleInterest}
            />}
            {step === 2 && <Step3
              occupation={occupation} setOccupation={setOccupation}
              income={income} setIncome={setIncome}
              risk={risk} setRisk={setRisk}
            />}

            {!!error && (
              <View style={s.errorBox} accessibilityRole="none" accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} accessibilityElementsHidden />
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={s.nextBtn} onPress={handleNext} disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={step < 2 ? 'Next step' : 'Create account'}
              accessibilityState={{ disabled: loading }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.nextTxt}>{step < 2 ? 'Next →' : 'Create Account →'}</Text>}
            </TouchableOpacity>

            {step === 0 && (
              <TouchableOpacity style={s.loginBtn} onPress={() => nav.goBack()}
                accessibilityRole="button" accessibilityLabel="Already have an account, go to login">
                <Text style={s.loginTxt}>Already have an account? <Text style={{ color: COLORS.navy, fontWeight: '700' }}>Sign In</Text></Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.disclaimer}>
            By registering, you agree to our terms and SEBI regulations.{'\n'}
            You will be asked to accept the Research Analyst Agreement after login.
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function Field({ label, children }) {
  return <View style={s.fieldWrap}><Text style={s.label}>{label}</Text>{children}</View>;
}

function ChipGroup({ options, selected, onSelect, multi = false }) {
  return (
    <View style={s.chipRow}>
      {options.map(opt => {
        const active = multi ? (selected || []).includes(opt) : selected === opt;
        return (
          <TouchableOpacity key={opt} style={[s.chip, active && s.chipOn]}
            onPress={() => onSelect(opt)}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt}>
            <Text style={[s.chipTxt, active && s.chipTxtOn]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Step1({ name, setName, phone, setPhone, email, setEmail, city, setCity, state, setState, password, setPassword, confirm, setConfirm, showPass, setShowPass, clear }) {
  return (
    <>
      <Text style={s.stepTitle} accessibilityRole="header">Basic Details</Text>
      <Field label="Full Name *">
        <TextInput style={s.input} value={name} onChangeText={t=>{setName(t);clear();}}
          placeholder="As per PAN / Aadhaar" placeholderTextColor={COLORS.textMuted}
          autoCapitalize="words" accessibilityLabel="Full name" />
      </Field>
      <Field label="Mobile Number *">
        <TextInput style={s.input} value={phone} onChangeText={t=>{setPhone(t);clear();}}
          placeholder="+91 98765 43210" placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad" accessibilityLabel="Mobile number" />
      </Field>
      <Field label="Email Address *">
        <TextInput style={s.input} value={email} onChangeText={t=>{setEmail(t);clear();}}
          placeholder="you@example.com" placeholderTextColor={COLORS.textMuted}
          keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email address" />
      </Field>
      <View style={s.row2}>
        <View style={{ flex: 1 }}>
          <Field label="City *">
            <TextInput style={s.input} value={city} onChangeText={t=>{setCity(t);clear();}}
              placeholder="Indore" placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words" accessibilityLabel="City" />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="State *">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
              <ChipGroup options={STATES} selected={state} onSelect={setState} />
            </ScrollView>
          </Field>
        </View>
      </View>
      <Field label="Password *">
        <View style={s.inputRow}>
          <TextInput style={[s.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
            value={password} onChangeText={t=>{setPassword(t);clear();}}
            placeholder="Min. 6 characters" placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!showPass} accessibilityLabel="Password" />
          <TouchableOpacity style={s.eye} onPress={() => setShowPass(v => !v)}
            accessibilityRole="button" accessibilityLabel={showPass ? 'Hide' : 'Show'}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </Field>
      <Field label="Confirm Password *">
        <TextInput style={s.input} value={confirm} onChangeText={t=>{setConfirm(t);clear();}}
          placeholder="Repeat password" placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!showPass} accessibilityLabel="Confirm password" />
      </Field>
    </>
  );
}

function Step2({ experience, setExperience, interests, toggleInterest }) {
  return (
    <>
      <Text style={s.stepTitle} accessibilityRole="header">Trading Profile</Text>
      <Field label="Trading Experience *">
        <ChipGroup options={EXPERIENCE} selected={experience} onSelect={setExperience} />
      </Field>
      <Field label="Market Interest * (select all that apply)">
        <ChipGroup options={INTERESTS} selected={interests} onSelect={toggleInterest} multi />
      </Field>
    </>
  );
}

function Step3({ occupation, setOccupation, income, setIncome, risk, setRisk }) {
  return (
    <>
      <Text style={s.stepTitle} accessibilityRole="header">Financial Profile</Text>
      <Text style={s.stepNote}>Required for SEBI RA client onboarding compliance</Text>
      <Field label="Occupation *">
        <ChipGroup options={OCCUPATIONS} selected={occupation} onSelect={setOccupation} />
      </Field>
      <Field label="Annual Income Range *">
        <ChipGroup options={INCOMES} selected={income} onSelect={setIncome} />
      </Field>
      <Field label="Risk Appetite *">
        <ChipGroup options={RISK} selected={risk} onSelect={setRisk} />
      </Field>
    </>
  );
}

const s = StyleSheet.create({
  gradient:    { flex: 1 },
  scroll:      { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 48, marginBottom: 18 },
  backBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  progressBg:  { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, marginBottom: 18 },
  progressFill:{ height: 4, backgroundColor: COLORS.gold, borderRadius: 4 },
  card:        { backgroundColor: '#fff', borderRadius: 22, padding: 22, marginBottom: 20, shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.2, shadowRadius:16, elevation:8 },
  stepTitle:   { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  stepNote:    { fontSize: 12, color: COLORS.textLight, marginBottom: 16, lineHeight: 18 },
  fieldWrap:   { marginBottom: 16 },
  label:       { fontSize: 11, fontWeight: '700', color: COLORS.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input:       { backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: COLORS.text, minHeight: 50 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, minHeight: 50 },
  eye:         { padding: 14, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  row2:        { flexDirection: 'row', gap: 10 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.border, minHeight: 38 },
  chipOn:      { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipTxt:     { fontSize: 12, fontWeight: '700', color: COLORS.textMid },
  chipTxtOn:   { color: '#fff' },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 11, marginBottom: 14 },
  errorTxt:    { flex: 1, fontSize: 13, color: COLORS.red },
  nextBtn:     { backgroundColor: COLORS.navy, borderRadius: RADIUS.md, minHeight: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  nextTxt:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  loginBtn:    { alignItems: 'center', paddingVertical: 10, minHeight: 44 },
  loginTxt:    { fontSize: 13, color: COLORS.textLight },
  disclaimer:  { fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 16 },
});
