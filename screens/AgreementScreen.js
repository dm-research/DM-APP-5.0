// screens/AgreementScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../components/theme';
import { acceptAgreement } from '../firebase';
import { useAuth } from '../components/AuthContext';

export default function AgreementScreen() {
  const { user, setProfile, profile } = useAuth();
  const [scrolled, setScrolled]       = useState(false);
  const [agreed, setAgreed]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const scrollRef = useRef(null);

  function onScroll({ nativeEvent }) {
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 40) {
      setScrolled(true);
    }
  }

  async function handleAccept() {
    if (!agreed) { Alert.alert('Please read and accept', 'Please scroll through the full agreement and check the acceptance box.'); return; }
    setLoading(true);
    const { error } = await acceptAgreement(user.uid);
    setLoading(false);
    if (error) { Alert.alert('Error', error); return; }
    setProfile(prev => ({ ...prev, agreementAccepted: true }));
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header} accessibilityRole="header">
        <View style={s.headerIcon}>
          <Ionicons name="document-text" size={22} color={COLORS.gold} accessibilityElementsHidden />
        </View>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Research Analyst Agreement</Text>
          <Text style={s.headerSub}>Please read carefully before proceeding</Text>
        </View>
      </View>

      <View style={s.progressNote} accessibilityRole="none">
        <Ionicons name="information-circle-outline" size={14} color={COLORS.navy} accessibilityElementsHidden />
        <Text style={s.progressNoteText}>
          {scrolled ? '✓ You have read the agreement' : 'Scroll to the end to accept'}
        </Text>
      </View>

      {/* Agreement content */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        onScroll={onScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator
        accessibilityLabel="Research Analyst Agreement document"
      >
        <Clause title="1. About the Research Analyst">
          Dynamic Money Research Advisory Services (Proprietor: Akansha Jain) is a SEBI Registered Research Analyst firm registered under SEBI (Research Analysts) Regulations, 2014. Registration No.: INH000024408. Registration valid from December 22, 2025 to December 21, 2030. Also registered with BSE as RAASB.
        </Clause>

        <Clause title="2. Nature of Services">
          The research and recommendations provided through this application are strictly non-individualised research services. The research calls, market outlooks, articles, and other content are meant for general informational and educational purposes only. This is NOT personalised investment advice.
        </Clause>

        <Clause title="3. Risk Disclosure">
          Investment in securities market are subject to market risks. Read all related documents carefully before investing. The securities / research mentioned may or may not be profitable. Past performance is not a reliable indicator of future results. You may lose part or all of your invested capital. Dynamic Money Research Advisory Services is not responsible for any losses arising from the use of this research.
        </Clause>

        <Clause title="4. SEBI Registration Details">
          SEBI Registration No.: INH000024408{'\n'}
          Type: Research Analyst (Individual / Proprietorship){'\n'}
          Validity: December 22, 2025 – December 21, 2030{'\n'}
          Email: akanshajain.soe@gmail.com{'\n'}
          BASL Reg. No.: RAASB
        </Clause>

        <Clause title="5. No Conflict of Interest">
          The Research Analyst or associates do not trade or invest in the securities for which research is produced. Where any potential conflict of interest exists, it will be disclosed. The RA does not provide portfolio management services. The RA does not accept performance-based fees.
        </Clause>

        <Clause title="6. Subscription & Payment">
          Subscriptions are charged on a fixed fee basis. Fees are non-refundable once activated. The RA may, at its discretion, offer a free trial period. Subscriptions will auto-expire at the end of the validity period unless renewed. Renewal is at the subscriber's choice.
        </Clause>

        <Clause title="7. Client Responsibilities">
          You confirm that you are 18 years of age or above. You have independently evaluated your financial situation and risk appetite before subscribing. You will not reproduce, distribute, or share research calls in any form without written permission. You understand this is non-individualised research and you are solely responsible for your investment decisions.
        </Clause>

        <Clause title="8. Grievance Redressal">
          For grievances, contact: compliance@dmresearch.in{'\n'}
          SEBI SCORES Portal: scores.gov.in{'\n'}
          Online Dispute Resolution: smartodr.in{'\n'}
          Address: 08 Aranya Nagar, Sector-E, Slice-3, Scheme No. 78, Indore, MP – 452010
        </Clause>

        <Clause title="9. Governing Law">
          This agreement is governed by the laws of India and the SEBI (Research Analysts) Regulations, 2014. Any disputes shall be subject to the jurisdiction of courts in Indore, Madhya Pradesh.
        </Clause>

        <View style={s.endNote} accessible accessibilityLabel="End of agreement">
          <Ionicons name="checkmark-circle" size={20} color={COLORS.green} accessibilityElementsHidden />
          <Text style={s.endNoteText}>You have reached the end of the agreement</Text>
        </View>
      </ScrollView>

      {/* Accept checkbox */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.checkRow}
          onPress={() => setAgreed(v => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="I agree to the Research Analyst Agreement"
        >
          <View style={[s.checkbox, agreed && s.checkboxOn]}>
            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={s.checkText}>
            I have read and agree to the{' '}
            <Text style={{ color: COLORS.navy, fontWeight: '700' }}>
              Research Analyst Agreement
            </Text>
            , Risk Disclosure, and Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.acceptBtn, (!agreed || !scrolled) && s.acceptBtnDisabled]}
          onPress={handleAccept}
          disabled={!agreed || !scrolled || loading}
          accessibilityRole="button"
          accessibilityLabel="Accept agreement and continue"
          accessibilityState={{ disabled: !agreed || !scrolled || loading }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.acceptBtnText}>Accept & Continue →</Text>}
        </TouchableOpacity>

        {!scrolled && (
          <Text style={s.scrollHint} accessibilityLiveRegion="polite">
            Please scroll through the full agreement to enable acceptance
          </Text>
        )}
      </View>
    </View>
  );
}

function Clause({ title, children }) {
  return (
    <View style={s.clause} accessible accessibilityLabel={`${title}: ${children}`}>
      <Text style={s.clauseTitle}>{title}</Text>
      <Text style={s.clauseBody}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.goldPale, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 16, fontWeight: '800', color: COLORS.text },
  headerSub:       { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  headerText:      { flex: 1 },
  progressNote:    { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 14, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#DBEAFE' },
  progressNoteText:{ fontSize: 12, color: COLORS.navy, fontWeight: '600', flex: 1 },
  scroll:          { flex: 1, paddingHorizontal: 20 },
  clause:          { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  clauseTitle:     { fontSize: 13, fontWeight: '800', color: COLORS.navy, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  clauseBody:      { fontSize: 13, color: COLORS.textMid, lineHeight: 21 },
  endNote:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#bbf7d0' },
  endNoteText:     { fontSize: 13, color: COLORS.green, fontWeight: '600' },
  footer:          { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff', gap: 12 },
  checkRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox:        { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxOn:      { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  checkText:       { flex: 1, fontSize: 13, color: COLORS.textMid, lineHeight: 20 },
  acceptBtn:       { backgroundColor: COLORS.navy, borderRadius: RADIUS.md, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  acceptBtnDisabled:{ backgroundColor: COLORS.textMuted },
  acceptBtnText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  scrollHint:      { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
});
