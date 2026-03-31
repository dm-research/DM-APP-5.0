// screens/SubscribeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../components/theme';

import { useAuth } from '../components/AuthContext';
import { getConfig } from '../firebase';
import { useNavigation } from '@react-navigation/native';

const PLANS = [
  { name:'Evaluation (Trial)',    dur:'Weekly',    price:'₹99',     seg:'All Segments',    trial: true },
  { name:'Premium Cash & F&O',   dur:'Monthly',   price:'₹12,500', seg:'Cash & F&O' },
  { name:'Premium Index',        dur:'Monthly',   price:'₹12,500', seg:'Index' },
  { name:'Premium MCX',          dur:'Monthly',   price:'₹12,000', seg:'MCX' },
  { name:'Platinum F&O',         dur:'Quarterly', price:'₹36,000', seg:'F&O',             popular: true },
  { name:'Platinum Index',       dur:'Quarterly', price:'₹36,000', seg:'Index',           popular: true },
  { name:'Platinum MCX',         dur:'Quarterly', price:'₹36,000', seg:'MCX',             popular: true },
  { name:'Combo Index + Options',dur:'Quarterly', price:'₹49,000', seg:'Index + Options', popular: true },
];

export default function SubscribeScreen() {
  const nav = useNavigation();
  const { profile, hasAgreed } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [payConfig, setPayConfig] = useState({
    upiId: 'akansha.ia@validsbi',
    sbiAccount: '44501794213',
    sbiIfsc: 'SBIN0030115',
    auAccount: '2402247859743310',
    auIfsc: 'AUBL0002478',
  });

  useEffect(() => {
    getConfig().then(cfg => {
      if (cfg?.upiId) setPayConfig({
        upiId: cfg.upiId,
        sbiAccount: cfg.sbiAccount || '44501794213',
        sbiIfsc: cfg.sbiIfsc || 'SBIN0030115',
        auAccount: cfg.auAccount || '2402247859743310',
        auIfsc: cfg.auIfsc || 'AUBL0002478',
      });
      setConfigLoading(false);
    }).catch(() => setConfigLoading(false));
  }, []);

  function getPlanAmount(planName) {
    const plan = PLANS.find(p => p.name === planName);
    if (!plan) return '';
    // Extract digits from price string e.g. "₹12,500" → "12500"
    return plan.price.replace(/[^0-9]/g, '');
  }

  function openUPI() {
    const amount = selectedPlan ? getPlanAmount(selectedPlan) : '';
    const amParam = amount ? `&am=${amount}` : '';
    Linking.openURL(
      `upi://pay?pa=${payConfig.upiId}&pn=Dynamic%20Money%20Research&cu=INR${amParam}`
    ).catch(() =>
      Alert.alert('Open your UPI app', `Pay ₹${amount || '___'} to UPI ID: ${payConfig.upiId}\nPlan: ${selectedPlan || 'Not selected'}`)
    );
  }

  function openWhatsApp() {
    const planMsg = selectedPlan ? `I want to subscribe to the *${selectedPlan}* plan.` : 'I want to subscribe.';
    Linking.openURL(`https://wa.me/918269555558?text=Hi%2C%20I%20have%20made%20the%20payment%20for%20my%20subscription.%20${encodeURIComponent(planMsg)}%20Please%20activate%20my%20account.`);
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />
      <LinearGradient colors={[COLORS.navyDark, COLORS.navy]} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}
            accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} accessibilityRole="header">Choose Your Plan</Text>
            <Text style={s.headerSub}>Research calls delivered instantly to your app</Text>
          </View>
        </View>

        {/* Steps */}
        <View style={s.stepsRow} accessibilityRole="none">
          {['Select plan','Pay via UPI','WhatsApp proof','Activated!'].map((step, i) => (
            <View key={i} style={s.step} accessible accessibilityLabel={`Step ${i+1}: ${step}`}>
              <View style={s.stepCircle}><Text style={s.stepNum}>{i+1}</Text></View>
              <Text style={s.stepTxt}>{step}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Agreement gate */}
        {!hasAgreed && (
          <TouchableOpacity style={s.agreementBanner} onPress={() => nav.navigate('Agreement')}
            accessibilityRole="button" accessibilityLabel="Accept Research Analyst Agreement first before subscribing">
            <Ionicons name="warning-outline" size={18} color="#d97706" accessibilityElementsHidden />
            <View style={{ flex: 1 }}>
              <Text style={s.agreementBannerTitle}>Accept Agreement First</Text>
              <Text style={s.agreementBannerSub}>You must accept the RA Agreement before subscribing</Text>
            </View>
            <Text style={s.agreementBannerCTA}>Accept →</Text>
          </TouchableOpacity>
        )}

        {/* Promo banner */}
        <LinearGradient colors={[COLORS.gold, '#D4A500']} style={s.promo}>
          <Text style={s.promoTop2}>🔥 EVALUATION PLAN</Text>
          <Text style={s.promoMain}>Try Before You Subscribe</Text>
          <Text style={s.promoSub}>One week of live research calls for <Text style={s.promo99}>₹99</Text> — no long-term commitment</Text>
          <TouchableOpacity style={s.promoCTA} onPress={() => { setSelectedPlan('Evaluation (Trial)'); openUPI(); }}
            accessibilityRole="button" accessibilityLabel="Start evaluation plan for ₹99 per week">
            <Text style={s.promoCTATxt}>Start Evaluation →</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Plans */}
        <Text style={s.sectionTitle} accessibilityRole="header">All Plans</Text>
        {selectedPlan && (
          <View style={s.selectedNote} accessibilityRole="none" accessibilityLabel={`Selected plan: ${selectedPlan}`}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.green} accessibilityElementsHidden />
            <Text style={s.selectedNoteTxt}>Selected: <Text style={{ fontWeight:'800' }}>{selectedPlan}</Text></Text>
          </View>
        )}

        {PLANS.map(plan => {
          const isSelected = selectedPlan === plan.name;
          return (
            <TouchableOpacity key={plan.name}
              style={[s.planCard, isSelected && s.planCardSelected, plan.popular && s.planCardPopular]}
              onPress={() => setSelectedPlan(plan.name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${plan.name}, ${plan.dur}, ${plan.price}, covers ${plan.seg}`}>
              {plan.popular && (
                <View style={s.popularBadge} accessibilityElementsHidden>
                  <Text style={s.popularBadgeTxt}>POPULAR</Text>
                </View>
              )}
              {plan.trial && (
                <View style={s.trialBadge} accessibilityElementsHidden>
                  <Text style={s.trialBadgeTxt}>TRIAL</Text>
                </View>
              )}
              <View style={s.planTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.planName, (isSelected || plan.popular) && s.planNameLight]}>{plan.name}</Text>
                  <Text style={[s.planSeg, (isSelected || plan.popular) && s.planSegLight]}>{plan.seg} · {plan.dur}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.planPrice, (isSelected || plan.popular) && s.planPriceLight]}>{plan.price}</Text>
                  <Text style={[s.planDur, (isSelected || plan.popular) && s.planDurLight]}>{plan.dur}</Text>
                </View>
              </View>
              {isSelected && (
                <View style={s.selectedCheck} accessibilityElementsHidden>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.gold} />
                  <Text style={s.selectedCheckTxt}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Payment section */}
        <Text style={s.sectionTitle} accessibilityRole="header">Make Payment</Text>
        <View style={s.payCard} accessible accessibilityLabel="Payment details: UPI akansha.ia@validsbi, SBI Account 44501794213 IFSC SBIN0030115, AU Bank 2402247859743310 IFSC AUBL0002478">
          <Text style={s.payTitle}>Payment Details</Text>
          {configLoading && <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Loading payment details...</Text>}
          {[
            { icon:'phone-portrait-outline', label:'UPI ID', val:payConfig.upiId },
            { icon:'business-outline', label:'SBI A/C', val:`${payConfig.sbiAccount} · ${payConfig.sbiIfsc}` },
            { icon:'business-outline', label:'AU Bank', val:`${payConfig.auAccount} · ${payConfig.auIfsc}` },
          ].map(item => (
            <View key={item.label} style={s.payRow}>
              <Ionicons name={item.icon} size={14} color={COLORS.gold} accessibilityElementsHidden />
              <Text style={s.payLabel}>{item.label}</Text>
              <Text style={s.payVal}>{item.val}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.upiBtn} onPress={openUPI}
          accessibilityRole="button" accessibilityLabel="Open UPI payment app">
          <Ionicons name="phone-portrait-outline" size={18} color="#fff" accessibilityElementsHidden />
          <Text style={s.upiBtnTxt}>{selectedPlan ? `Pay for ${selectedPlan}` : 'Open UPI App to Pay'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.waBtn} onPress={openWhatsApp}
          accessibilityRole="button" accessibilityLabel="Send payment proof via WhatsApp">
          <Ionicons name="logo-whatsapp" size={18} color="#fff" accessibilityElementsHidden />
          <Text style={s.waBtnTxt}>Send Payment Proof via WhatsApp</Text>
        </TouchableOpacity>

        <View style={s.activationNote}>
          <Ionicons name="time-outline" size={14} color={COLORS.textLight} accessibilityElementsHidden />
          <Text style={s.activationNoteTxt}>Activation within 2 business hours after payment confirmation</Text>
        </View>

        {/* Disclaimer */}
        <View style={s.disclaimerBox}>
          <Text style={s.disclaimerTxt} accessibilityRole="text">
            ⚠️ Investment in securities market are subject to market risks. Read all related documents carefully before investing. Research provided is non-individualised general research. Fees are fixed and not performance-based. SEBI Registered Research Analyst — INH000024408{'\n\n'}
            Grievances: scores.gov.in | smartodr.in{'\n'}
            Compliance: akanshajain.soe@gmail.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:            { flex: 1, backgroundColor: COLORS.bg },
  header:               { paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20 },
  headerRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn:              { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:          { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:            { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  stepsRow:             { flexDirection: 'row', justifyContent: 'space-between' },
  step:                 { alignItems: 'center', flex: 1 },
  stepCircle:           { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepNum:              { fontSize: 12, fontWeight: '900', color: '#fff' },
  stepTxt:              { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  scroll:               { flex: 1 },
  scrollContent:        { padding: 16, paddingBottom: 100, gap: 12 },
  agreementBanner:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.amberLight, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  agreementBannerTitle: { fontSize: 13, fontWeight: '800', color: '#713f12' },
  agreementBannerSub:   { fontSize: 11, color: '#92400e', marginTop: 1 },
  agreementBannerCTA:   { fontSize: 13, fontWeight: '800', color: '#b45309' },
  promo:                { borderRadius: RADIUS.xl, padding: 20, ...SHADOW.md },
  promoTop2:            { fontSize: 11, fontWeight: '900', color: COLORS.navyDark, marginBottom: 6, letterSpacing: 0.5 },
  promoMain:            { fontSize: 18, fontWeight: '900', color: COLORS.navyDark, marginBottom: 4 },
  promoSub:             { fontSize: 13, color: COLORS.navyDark, marginBottom: 14 },
  promo99:              { fontSize: 22, fontWeight: '900' },
  promoCTA:             { backgroundColor: COLORS.navyDark, paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADIUS.md, alignSelf: 'flex-start' },
  promoCTATxt:          { color: '#fff', fontSize: 14, fontWeight: '800' },
  sectionTitle:         { fontSize: 16, fontWeight: '800', color: COLORS.text },
  selectedNote:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.greenLight, borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  selectedNoteTxt:      { fontSize: 13, color: COLORS.green },
  planCard:             { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOW.sm },
  planCardSelected:     { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  planCardPopular:      { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  popularBadge:         { backgroundColor: COLORS.gold, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  popularBadgeTxt:      { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  trialBadge:           { backgroundColor: COLORS.green, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  trialBadgeTxt:        { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  planTop:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName:             { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  planNameLight:        { color: '#fff' },
  planSeg:              { fontSize: 11, color: COLORS.textLight },
  planSegLight:         { color: 'rgba(255,255,255,0.65)' },
  planPrice:            { fontSize: 16, fontWeight: '900', color: COLORS.navy },
  planPriceLight:       { color: COLORS.gold },
  planDur:              { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
  planDurLight:         { color: 'rgba(255,255,255,0.55)' },
  selectedCheck:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  selectedCheckTxt:     { fontSize: 12, color: COLORS.gold, fontWeight: '700' },
  payCard:              { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, gap: 10, borderWidth: 1, borderColor: '#fde68a', ...SHADOW.sm },
  payTitle:             { fontSize: 12, fontWeight: '800', color: '#713f12', textTransform: 'uppercase', marginBottom: 4 },
  payRow:               { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payLabel:             { fontSize: 11, fontWeight: '700', color: '#713f12', width: 60 },
  payVal:               { fontSize: 12, color: COLORS.text, fontWeight: '600', flex: 1 },
  upiBtn:               { backgroundColor: COLORS.navy, borderRadius: RADIUS.md, minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  upiBtnTxt:            { color: '#fff', fontSize: 15, fontWeight: '800' },
  waBtn:                { backgroundColor: '#16a34a', borderRadius: RADIUS.md, minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  waBtnTxt:             { color: '#fff', fontSize: 15, fontWeight: '800' },
  activationNote:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  activationNoteTxt:    { fontSize: 12, color: COLORS.textLight, flex: 1 },
  disclaimerBox:        { backgroundColor: COLORS.amberLight, borderWidth: 1, borderColor: '#fde68a', borderRadius: RADIUS.lg, padding: 14 },
  disclaimerTxt:        { fontSize: 11, color: '#713f12', lineHeight: 17 },
});
