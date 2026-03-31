// screens/HomeScreen.js — Dynamic Money Research Platform
// Theme-aware · offer banner · live call previews · plans teaser · articles

import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../components/theme';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { listenCalls } from '../firebase';
import { daysLeft } from '../utils/dateUtils';
import { useNavigation } from '@react-navigation/native';
import { adaptCall } from './CallsScreen';

export default function HomeScreen() {
  var nav       = useNavigation();
  var themeData = useTheme();
  var colors    = themeData.colors;
  var isDark    = themeData.isDark;
  var auth      = useAuth();
  var profile   = auth.profile;
  var isPaid    = auth.isPaid;
  var isTrial   = auth.isTrial;
  var trialActive = auth.trialActive;
  var hasAgreed   = auth.hasAgreed;

  var cs = useState([]); var recentCalls = cs[0]; var setRecentCalls = cs[1];
  var rs = useState(false); var refreshing = rs[0]; var setRefreshing = rs[1];

  useEffect(function() {
    var unsub = listenCalls(
      {},
      function(data) { setRecentCalls(data); setRefreshing(false); },
      function()     { setRefreshing(false); },
      4
    );
    return function() { unsub(); };
  }, []);

  var firstName  = (profile && profile.name && profile.name.split(' ')[0]) || 'Member';
  var trialDays  = trialActive ? daysLeft(profile && profile.trialExpiry) : 0;
  var planDays   = isPaid ? daysLeft(profile && profile.planExpiry) : 0;

  // Theme vars
  var bgColor   = isDark ? '#0F1120' : colors.bg;
  var cardBg    = isDark ? '#1A1D2E' : colors.surface;
  var cardBdr   = isDark ? '#2A2D3E' : colors.border;
  var textPri   = isDark ? '#FFFFFF' : colors.text;
  var textSec   = isDark ? '#8A8A9A' : colors.textLight;
  var offWhite  = isDark ? 'rgba(255,255,255,0.05)' : colors.offWhite;

  // Stats
  var activeCalls = useMemo(function() {
    return recentCalls.filter(function(c) { return c.status === 'Active'; }).length;
  }, [recentCalls]);

  return (
    <ScrollView
      style={[sc.container, { backgroundColor: bgColor }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={function() { setRefreshing(true); }}
          tintColor={COLORS.gold} colors={[COLORS.navy]} />
      }
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0D1729' : COLORS.navyDark} />

      {/* ── HERO ── */}
      <LinearGradient colors={[COLORS.navyDark, COLORS.navy, COLORS.navyLight]} style={sc.hero}>
        <View style={sc.logoRow}>
          <View style={sc.logoIcon}>
            <Ionicons name="trending-up" size={22} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sc.heroTitle}>DYNAMIC MONEY</Text>
            <Text style={sc.heroSub}>Research Advisory Services</Text>
          </View>
          <View style={sc.sebiPill}>
            <Ionicons name="shield-checkmark" size={11} color="#4ade80" />
            <Text style={sc.sebiPillTxt}>SEBI ✓</Text>
          </View>
        </View>

        <View style={sc.greetingRow}>
          <Text style={sc.greeting}>Good day, {firstName} 👋</Text>
          <View style={[sc.tierBadge, isPaid ? sc.tierPaid : trialActive ? sc.tierTrial : sc.tierExpired]}>
            <Ionicons name={isPaid ? 'shield-checkmark' : trialActive ? 'time-outline' : 'alert-circle-outline'} size={11} color={isPaid ? '#fff' : trialActive ? '#fbbf24' : '#ef4444'} />
            <Text style={[sc.tierBadgeTxt, { color: isPaid ? '#fff' : trialActive ? '#fbbf24' : '#ef4444' }]}>
              {isPaid ? 'PREMIUM' : trialActive ? 'FREE TRIAL' : 'EXPIRED'}
            </Text>
          </View>
        </View>

        {isPaid ? (
          <View style={sc.statusChip}>
            <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
            <Text style={[sc.statusTxt, { color: '#22c55e' }]}>Active Plan · {planDays} days left</Text>
          </View>
        ) : trialActive ? (
          <View style={[sc.statusChip, { borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.12)' }]}>
            <Ionicons name="time-outline" size={14} color="#fbbf24" />
            <Text style={[sc.statusTxt, { color: '#fbbf24' }]}>Free Trial · {trialDays} day{trialDays !== 1 ? 's' : ''} left</Text>
          </View>
        ) : (
          <View style={[sc.statusChip, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.12)' }]}>
            <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
            <Text style={[sc.statusTxt, { color: '#ef4444' }]}>Trial Expired — Subscribe Now</Text>
          </View>
        )}
      </LinearGradient>

      <View style={[sc.body, { backgroundColor: bgColor }]}>

        {/* ── QUICK STATS ── */}
        <View style={sc.statsRow}>
          {[
            { icon: 'trending-up', label: 'Active Calls', val: String(activeCalls), color: '#00C076' },
            { icon: 'shield-checkmark', label: 'SEBI Reg.', val: 'RA', color: COLORS.navy },
            { icon: 'people', label: 'Analysts', val: '1', color: '#7c3aed' },
            { icon: 'star', label: 'Plans', val: '8+', color: COLORS.gold },
          ].map(function(item) {
            return (
              <View key={item.label} style={[sc.statCard, { backgroundColor: cardBg, borderColor: cardBdr }]}>
                <View style={[sc.statIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[sc.statVal, { color: textPri }]}>{item.val}</Text>
                <Text style={[sc.statLbl, { color: textSec }]}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── FIRST-TIME OFFER BANNER ── */}
        {!isPaid ? (
          <TouchableOpacity style={sc.promoBanner} onPress={function() { nav.navigate('Subscribe'); }} activeOpacity={0.92}>
            <LinearGradient colors={['#0B1E3D', '#102A56', '#1a3a6e']} style={sc.promoGrad}>
              <View style={sc.promoBadgeRow}>
                <View style={sc.promoFireBadge}>
                  <Text style={sc.promoFireTxt}>🔥  FIRST TIME OFFER</Text>
                </View>
                <View style={sc.promoWeekBadge}>
                  <Text style={sc.promoWeekTxt}>7 DAYS</Text>
                </View>
              </View>
              <Text style={sc.promoHeadline}>Try Our Research Services</Text>
              <View style={sc.promoPriceRow}>
                <View style={sc.promoOriginalBlock}>
                  <Text style={sc.promoOriginalLabel}>Service Value</Text>
                  <View>
                    <Text style={sc.promoOriginalPrice}>₹5,100</Text>
                    <View style={sc.promoStrike} />
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.35)" />
                <View style={sc.promoNewBlock}>
                  <Text style={sc.promoNewLabel}>Evaluation</Text>
                  <Text style={sc.promoNewPrice}>₹99</Text>
                </View>
              </View>
              <Text style={sc.promoSubText}>One full week of live research calls across all segments</Text>
              <View style={sc.promoCTABtn}>
                <Text style={sc.promoCTATxt}>Start Evaluation  →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* ── KYC NOTICE ── */}
        {!isPaid ? (
          <View style={[sc.noticeBanner, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#DBEAFE' }]}>
            <Ionicons name="document-text-outline" size={15} color={COLORS.navy} />
            <Text style={[sc.noticeTxt, { color: isDark ? '#93c5fd' : COLORS.navy }]}>
              <Text style={{ fontWeight: '700' }}>KYC Required — </Text>
              Services commence after KYC document verification (Aadhaar, PAN, Bank details).
            </Text>
          </View>
        ) : null}

        {/* ── AGREEMENT REMINDER ── */}
        {!hasAgreed ? (
          <TouchableOpacity style={[sc.noticeBanner, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#DBEAFE' }]}
            onPress={function() { nav.navigate('Agreement'); }}>
            <Ionicons name="alert-circle-outline" size={15} color={COLORS.navy} />
            <Text style={[sc.noticeTxt, { color: isDark ? '#93c5fd' : COLORS.navy, flex: 1 }]}>
              <Text style={{ fontWeight: '700' }}>Agreement Pending — </Text>
              Please accept the client agreement to activate your subscription.
            </Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.navy} />
          </TouchableOpacity>
        ) : null}

        {/* ── QUICK ACTIONS ── */}
        <View style={sc.quickRow}>
          {[
            { icon: 'analytics-outline', label: 'Calls',     screen: 'Calls',     color: COLORS.navy },
            { icon: 'newspaper-outline', label: 'Articles',  screen: 'Articles',  color: '#7c3aed' },
            { icon: 'logo-whatsapp',     label: 'Support',   screen: 'WhatsApp',  color: '#16a34a' },
            { icon: 'star-outline',      label: 'Subscribe', screen: 'Subscribe', color: COLORS.gold },
          ].map(function(item) {
            return (
              <TouchableOpacity key={item.label} style={[sc.quickBtn, { backgroundColor: cardBg, borderColor: cardBdr }]} onPress={function() { nav.navigate(item.screen); }}>
                <View style={[sc.quickIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[sc.quickLabel, { color: textSec }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── RECENT RESEARCH CALLS ── */}
        <View style={sc.section}>
          <View style={sc.sectionHead}>
            <Text style={[sc.sectionTitle, { color: textPri }]}>Recent Research Calls</Text>
            <TouchableOpacity onPress={function() { nav.navigate('Calls'); }}>
              <Text style={[sc.seeAll, { color: COLORS.navy }]}>See All →</Text>
            </TouchableOpacity>
          </View>

          {recentCalls.length === 0 ? (
            <View style={[sc.emptyCard, { backgroundColor: cardBg, borderColor: cardBdr }]}>
              <Ionicons name="analytics-outline" size={28} color={colors.textMuted} />
              <Text style={[sc.emptyTxt, { color: colors.textMuted }]}>No calls posted yet</Text>
            </View>
          ) : recentCalls.slice(0, 4).map(function(rawCall) {
            var call = adaptCall(rawCall);
            return (
              <CallPreviewCard
                key={rawCall.id}
                call={call}
                rawCall={rawCall}
                isPaid={isPaid}
                isDark={isDark}
                colors={colors}
                cardBg={cardBg}
                cardBdr={cardBdr}
                textPri={textPri}
                textSec={textSec}
                offWhite={offWhite}
                onPress={function() {
                  if (isPaid || auth.isAdmin) {
                    nav.navigate('CallDetail', { callId: rawCall.id });
                  } else {
                    nav.navigate('Calls');
                  }
                }}
              />
            );
          })}

          {recentCalls.length > 0 ? (
            <TouchableOpacity style={[sc.viewAllBtn, { backgroundColor: COLORS.navy }]} onPress={function() { nav.navigate('Calls'); }}>
              <Text style={sc.viewAllTxt}>View All Research Calls →</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── SUBSCRIPTION PLANS TEASER ── */}
        {!isPaid ? (
          <View style={[sc.plansCard, { backgroundColor: cardBg, borderColor: cardBdr }]}>
            <View style={sc.sectionHead}>
              <Text style={[sc.sectionTitle, { color: textPri }]}>Subscription Plans</Text>
              <TouchableOpacity onPress={function() { nav.navigate('Subscribe'); }}>
                <Text style={[sc.seeAll, { color: COLORS.navy }]}>All Plans →</Text>
              </TouchableOpacity>
            </View>
            <Text style={[sc.plansSub, { color: textSec }]}>Research calls with entry, target & stop loss</Text>

            {[
              { name: 'Evaluation (Trial)', price: '₹99',     dur: 'Weekly',    badge: 'TRIAL',   badgeColor: '#16a34a' },
              { name: 'Premium Cash & F&O', price: '₹12,500', dur: 'Monthly',   badge: null,      badgeColor: null },
              { name: 'Platinum F&O',       price: '₹36,000', dur: 'Quarterly', badge: 'POPULAR', badgeColor: COLORS.gold },
            ].map(function(plan) {
              return (
                <TouchableOpacity key={plan.name} style={[sc.planRow, { backgroundColor: offWhite, borderColor: cardBdr }]} onPress={function() { nav.navigate('Subscribe'); }}>
                  {plan.badge ? (
                    <View style={[sc.planBadge, { backgroundColor: plan.badgeColor }]}>
                      <Text style={sc.planBadgeTxt}>{plan.badge}</Text>
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={[sc.planName, { color: textPri }]}>{plan.name}</Text>
                    <Text style={[sc.planDur, { color: textSec }]}>{plan.dur}</Text>
                  </View>
                  <Text style={[sc.planPrice, { color: COLORS.navy }]}>{plan.price}</Text>
                  <Ionicons name="chevron-forward" size={16} color={textSec} />
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[sc.viewAllBtn, { backgroundColor: COLORS.navy, marginTop: 4 }]} onPress={function() { nav.navigate('Subscribe'); }}>
              <Text style={sc.viewAllTxt}>View All 8 Plans →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── ANALYST INFO ── */}
        <View style={[sc.infoCard, { backgroundColor: cardBg, borderColor: cardBdr }]}>
          <View style={sc.infoHeader}>
            <View style={[sc.infoIconWrap, { backgroundColor: COLORS.navy + '12' }]}>
              <Ionicons name="person-circle-outline" size={22} color={COLORS.navy} />
            </View>
            <Text style={[sc.infoTitle, { color: textPri }]}>About Our Research Analyst</Text>
          </View>
          <Text style={[sc.infoBody, { color: textSec }]}>
            Akansha Jain is a SEBI-registered Research Analyst specialising in equity, F&O, index and commodity markets. All recommendations are based on independent technical and fundamental analysis.
          </Text>
          <View style={[sc.sebiDetails, { backgroundColor: offWhite }]}>
            {[
              ['Analyst',     'Akansha Jain'],
              ['SEBI Reg.',   'INH000024408'],
              ['Valid Until', 'Dec 21, 2030'],
              ['Type',        'Research Analyst (RA)'],
            ].map(function(pair) {
              return (
                <View key={pair[0]} style={[sc.sebiRow, { borderBottomColor: cardBdr }]}>
                  <Text style={[sc.sebiKey, { color: textSec }]}>{pair[0]}</Text>
                  <Text style={[sc.sebiVal, { color: textPri }]}>{pair[1]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── DISCLAIMER ── */}
        <View style={sc.disclaimerBox}>
          <Text style={sc.disclaimerTxt}>
            {'\u26a0\ufe0f  Investment in securities market are subject to market risks. Read all related documents carefully before investing. Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.\n\nGrievances: scores.gov.in  |  smartodr.in'}
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}

// ── Call Preview Card ─────────────────────────────────────────────────────────

function CallPreviewCard(props) {
  var call     = props.call;
  var rawCall  = props.rawCall;
  var isPaid   = props.isPaid;
  var isDark   = props.isDark;
  var colors   = props.colors;
  var cardBg   = props.cardBg;
  var cardBdr  = props.cardBdr;
  var textPri  = props.textPri;
  var textSec  = props.textSec;
  var offWhite = props.offWhite;
  var onPress  = props.onPress;

  var status  = rawCall.status || 'Active';
  var ss = status === 'Active'     ? { bg: '#dcfce7', txt: '#15803d' }
         : status === 'Target Hit' ? { bg: '#dbeafe', txt: '#1d4ed8' }
         : { bg: '#fee2e2', txt: '#dc2626' };

  var dirIsRed  = call.callDirection && call.callDirection.toUpperCase().indexOf('PUT') !== -1;
  var dirColor  = dirIsRed ? '#FF4D4D' : '#00C076';

  var segColors = { Equity: '#7c3aed', 'F&O': '#0891b2', Index: '#059669', MCX: '#d97706' };
  var segColor  = segColors[rawCall.segment] || COLORS.navy;

  return (
    <TouchableOpacity style={[pv.card, { backgroundColor: cardBg, borderColor: cardBdr }]} onPress={onPress} activeOpacity={0.85}>
      <View style={pv.topRow}>
        {rawCall.segment ? (
          <View style={[pv.segTag, { backgroundColor: segColor + '18' }]}>
            <Text style={[pv.segTxt, { color: segColor }]}>{rawCall.segment}</Text>
          </View>
        ) : null}
        {call.callType ? (
          <View style={[pv.typeTag, { backgroundColor: offWhite }]}>
            <Text style={[pv.typeTxt, { color: textSec }]}>{call.callType}</Text>
          </View>
        ) : null}
        {call.callDirection ? (
          <View style={[pv.dirTag, { backgroundColor: dirColor + '18' }]}>
            <Text style={[pv.dirTxt, { color: dirColor }]}>{call.callDirection}</Text>
          </View>
        ) : null}
        <View style={[pv.statusBadge, { backgroundColor: ss.bg, marginLeft: 'auto' }]}>
          <Text style={[pv.statusTxt, { color: ss.txt }]}>{status}</Text>
        </View>
      </View>

      <Text style={[pv.instrName, { color: textPri }]} numberOfLines={1}>{call.instrumentLabel || call.script || rawCall.stockName || '\u2014'}</Text>

      {isPaid ? (
        <View style={[pv.priceRow, { backgroundColor: offWhite }]}>
          <View style={pv.priceCell}>
            <Text style={[pv.priceLbl, { color: textSec }]}>ENTRY</Text>
            <Text style={[pv.priceVal, { color: textPri }]}>{call.entryPrice != null ? '\u20b9' + call.entryPrice.toFixed(2) : '\u2014'}</Text>
          </View>
          <View style={pv.priceCell}>
            <Text style={[pv.priceLbl, { color: textSec }]}>TARGET</Text>
            <Text style={[pv.priceVal, { color: '#00C076' }]}>{call.targetPrice != null ? '\u20b9' + call.targetPrice.toFixed(2) : '\u2014'}</Text>
          </View>
          <View style={pv.priceCell}>
            <Text style={[pv.priceLbl, { color: textSec }]}>SL</Text>
            <Text style={[pv.priceVal, { color: '#FF4D4D' }]}>{call.stopLoss != null ? '\u20b9' + call.stopLoss.toFixed(2) : '\u2014'}</Text>
          </View>
        </View>
      ) : (
        <View style={[pv.lockedRow, { backgroundColor: offWhite }]}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
          <Text style={[pv.lockedTxt, { color: colors.textMuted }]}>Subscribe to view entry, target & stop loss</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const pv = StyleSheet.create({
  card:       { borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, ...SHADOW.sm, gap: 8 },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  segTag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  segTxt:     { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  typeTag:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeTxt:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dirTag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dirTxt:     { fontSize: 10, fontWeight: '800' },
  statusBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusTxt:  { fontSize: 10, fontWeight: '800' },
  instrName:  { fontSize: 16, fontWeight: '800' },
  priceRow:   { flexDirection: 'row', borderRadius: 10, padding: 10 },
  priceCell:  { flex: 1, alignItems: 'center' },
  priceLbl:   { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  priceVal:   { fontSize: 13, fontWeight: '800' },
  lockedRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, padding: 10 },
  lockedTxt:  { fontSize: 12, flex: 1 },
});

const sc = StyleSheet.create({
  container:          { flex: 1 },
  hero:               { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  logoRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  logoIcon:           { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(11,30,61,0.6)', borderWidth: 1, borderColor: 'rgba(180,137,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroTitle:          { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  heroSub:            { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  sebiPill:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.12)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  sebiPillTxt:        { fontSize: 10, color: '#4ade80', fontWeight: '800' },
  greeting:           { fontSize: 22, fontWeight: '900', color: '#fff', flex: 1 },
  greetingRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusChip:         { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  statusTxt:          { fontSize: 13, fontWeight: '700' },
  tierBadge:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierPaid:           { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  tierTrial:          { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.35)' },
  tierExpired:        { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  tierBadgeTxt:       { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  body:               { padding: 16, gap: 14, paddingBottom: 100 },
  // Stats row
  statsRow:           { flexDirection: 'row', gap: 10 },
  statCard:           { flex: 1, alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, gap: 4, ...SHADOW.sm },
  statIcon:           { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal:            { fontSize: 16, fontWeight: '900' },
  statLbl:            { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  // Promo
  promoBanner:        { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.lg },
  promoGrad:          { padding: 20 },
  promoBadgeRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  promoFireBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gold, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  promoFireTxt:       { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  promoWeekBadge:     { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  promoWeekTxt:       { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  promoHeadline:      { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 16 },
  promoPriceRow:      { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  promoOriginalBlock: { alignItems: 'center' },
  promoOriginalLabel: { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  promoOriginalPrice: { fontSize: 24, fontWeight: '900', color: 'rgba(255,255,255,0.35)' },
  promoStrike:        { position: 'absolute', bottom: 10, left: 0, right: 0, height: 2, backgroundColor: '#ef4444', opacity: 0.8 },
  promoNewBlock:      { alignItems: 'center', backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingHorizontal: 18, paddingVertical: 10 },
  promoNewLabel:      { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  promoNewPrice:      { fontSize: 30, fontWeight: '900', color: '#fff' },
  promoSubText:       { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginBottom: 16 },
  promoCTABtn:        { backgroundColor: '#fff', borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  promoCTATxt:        { fontSize: 15, fontWeight: '900', color: COLORS.navy, letterSpacing: 0.3 },
  // Notice
  noticeBanner:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, padding: 11, borderWidth: 1 },
  noticeTxt:          { fontSize: 12, lineHeight: 17, flex: 1 },
  // Quick actions
  quickRow:           { flexDirection: 'row', gap: 10 },
  quickBtn:           { flex: 1, alignItems: 'center', gap: 7, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, ...SHADOW.sm },
  quickIcon:          { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel:         { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  // Section
  section:            { gap: 10 },
  sectionHead:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle:       { fontSize: 16, fontWeight: '800' },
  seeAll:             { fontSize: 13, fontWeight: '700' },
  emptyCard:          { borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, ...SHADOW.sm },
  emptyTxt:           { fontSize: 13 },
  viewAllBtn:         { borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  viewAllTxt:         { color: '#fff', fontSize: 13, fontWeight: '800' },
  // Plans
  plansCard:          { borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, gap: 10, ...SHADOW.sm },
  plansSub:           { fontSize: 12, marginTop: -6 },
  planRow:            { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, gap: 8 },
  planBadge:          { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  planBadgeTxt:       { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  planName:           { fontSize: 13, fontWeight: '700' },
  planDur:            { fontSize: 11, marginTop: 1 },
  planPrice:          { fontSize: 14, fontWeight: '900' },
  // Analyst info
  infoCard:           { borderRadius: RADIUS.xl, padding: 18, borderWidth: 1 },
  infoHeader:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  infoIconWrap:       { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoTitle:          { fontSize: 15, fontWeight: '800', flex: 1 },
  infoBody:           { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  sebiDetails:        { borderRadius: RADIUS.md, overflow: 'hidden' },
  sebiRow:            { flexDirection: 'row', padding: 10, borderBottomWidth: 1 },
  sebiKey:            { fontSize: 11, fontWeight: '700', width: 100 },
  sebiVal:            { fontSize: 11, fontWeight: '700', flex: 1 },
  // Disclaimer
  disclaimerBox:      { backgroundColor: COLORS.amberLight, borderWidth: 1, borderColor: '#fde68a', borderRadius: RADIUS.lg, padding: 14 },
  disclaimerTxt:      { fontSize: 11, color: '#713f12', lineHeight: 17 },
});
