// screens/CallDetailScreen.js — DM Research Platform
// Full trade call detail — redesigned per UI spec v2

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import TradeProgressLine, { getTradeState } from '../components/TradeProgressLine';
import { adaptCall } from './CallsScreen';

// ── Design Tokens ─────────────────────────────────────────────────────────────

const T = {
  bg:       '#0F1120',
  card:     '#1A1D2E',
  border:   '#2A2D3E',
  green:    '#00C076',
  textPri:  '#FFFFFF',
  textSec:  '#8A8A9A',
  red:      '#FF4D4D',
  timeline: '#2A2A3A',
};

// ── Utilities ─────────────────────────────────────────────────────────────────

const fmt2 = function(n) { return typeof n === 'number' ? n.toFixed(2) : '\u2014'; };
const fmtInr = function(n) {
  if (typeof n !== 'number') return '\u2014';
  return '\u20b9 ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

function fmtTs(ts, full) {
  if (!ts) return '\u2014';
  var d = ts && ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '\u2014';
  var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = d.getHours();
  var m = String(d.getMinutes()).padStart(2, '0');
  var time = (h % 12 || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  if (full) return time + ', ' + d.getDate() + ' ' + mo[d.getMonth()];
  return d.getDate() + ' ' + mo[d.getMonth()] + ' \u2022 ' + time;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <View style={s.section}>
      {title ? <Text style={s.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

// ── Avatar with verified badge ────────────────────────────────────────────────

function Avatar({ name, size }) {
  name = name || '';
  size = size || 52;
  var initials = name.split(' ').slice(0, 2).map(function(w) { return w[0] || ''; }).join('').toUpperCase();
  var hue = name.split('').reduce(function(a, c) { return a + c.charCodeAt(0); }, 0) % 360;
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: 'hsl(' + hue + ',45%,20%)',
        borderWidth: 2, borderColor: T.green,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: size * 0.32, fontWeight: '700', color: 'hsl(' + hue + ',65%,72%)' }}>
          {initials}
        </Text>
      </View>
      <View style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: T.green, borderWidth: 1.5, borderColor: T.card,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="checkmark" size={9} color="#fff" />
      </View>
    </View>
  );
}

// ── Researcher Header ─────────────────────────────────────────────────────────

function ResearcherHeader({ call }) {
  var name    = call.researcherName || '';
  var regNum  = call.raRegNumber || '';
  var status  = call.status || 'Active';
  return (
    <View style={rh.wrap}>
      <Avatar name={name} size={52} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text style={rh.name}>{name}</Text>
          {regNum ? (
            <View style={rh.regBadge}>
              <Text style={rh.regTxt}>{regNum}</Text>
            </View>
          ) : null}
          <View style={rh.activeBadge}>
            <Text style={rh.activeTxt}>{status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={rh.desig}>SEBI Registered Research Analyst</Text>
      </View>
    </View>
  );
}

const rh = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  name:       { fontSize: 16, fontWeight: '700', color: T.textPri },
  desig:      { fontSize: 12, color: T.textSec, marginTop: 4 },
  regBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: T.card, borderWidth: 1, borderColor: T.border },
  regTxt:     { fontSize: 11, color: T.textSec, fontWeight: '600' },
  activeBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#1A3A2A', borderWidth: 1, borderColor: 'rgba(0,192,118,0.3)' },
  activeTxt:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: T.green },
});

// ── Instrument Card ───────────────────────────────────────────────────────────

function InstrumentCard({ call }) {
  var dirColor = call.callDirection && call.callDirection.toUpperCase().indexOf('PUT') !== -1 ? T.red : T.green;
  return (
    <View style={ic.card}>
      <Text style={ic.instrName}>{call.instrumentLabel || call.script || '\u2014'}</Text>
      <Text style={[ic.dirLine, { color: dirColor }]}>
        {call.callDirection}{call.callType ? ' (' + call.callType + ')' : ''}
      </Text>
      <View style={ic.divider} />
      <View style={ic.priceRow}>
        <View>
          <Text style={ic.priceLabel}>Entry</Text>
          <Text style={ic.priceValue}>{call.entryPrice != null ? '\u20b9 ' + fmt2(call.entryPrice) : '\u2014'}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={ic.priceLabel}>Stop Loss</Text>
          <Text style={[ic.priceValue, { color: T.red }]}>{call.stopLoss != null ? '\u20b9 ' + fmt2(call.stopLoss) : '\u2014'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={ic.priceLabel}>Target</Text>
          <Text style={[ic.priceValue, { color: T.green }]}>{call.targetPrice != null ? '\u20b9 ' + fmt2(call.targetPrice) : '\u2014'}</Text>
        </View>
      </View>
    </View>
  );
}

const ic = StyleSheet.create({
  card:       { margin: 14, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.border, padding: 16 },
  instrName:  { fontSize: 20, fontWeight: '800', color: T.textPri, lineHeight: 28, marginBottom: 4 },
  dirLine:    { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  divider:    { height: 1, backgroundColor: T.border, marginBottom: 14 },
  priceRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 11, color: T.textSec, marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: '700', color: T.textPri },
});

// ── Targets section ───────────────────────────────────────────────────────────

function TargetsSection({ call }) {
  var targets    = call.targets || [];
  var trailingSL = call.trailingSL || null;
  if (targets.length === 0 && !trailingSL) return null;
  return (
    <Section title="Targets & Trailing Stop Loss">
      {targets.map(function(t, i) {
        var achieved = t.achieved || false;
        return (
          <View key={i} style={tg.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[tg.dot, { backgroundColor: achieved ? T.green : T.textSec }]} />
              <Text style={[tg.label, { color: achieved ? T.green : T.textPri }]}>
                {'Target ' + (i + 1) + ': \u20b9 ' + fmt2(t.price)}
                {achieved ? ' (Achieved)' : ''}
              </Text>
            </View>
          </View>
        );
      })}
      {trailingSL != null ? (
        <View style={tg.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[tg.dot, { backgroundColor: '#f59e0b' }]} />
            <Text style={tg.label}>{'Trailing SL: \u20b9 ' + fmt2(trailingSL) + ' (Currently)'}</Text>
          </View>
        </View>
      ) : null}
    </Section>
  );
}

const tg = StyleSheet.create({
  row:   { paddingVertical: 8 },
  dot:   { width: 8, height: 8, borderRadius: 8 },
  label: { fontSize: 14, color: T.textPri, fontWeight: '500' },
});

// ── Timeline ──────────────────────────────────────────────────────────────────

function TimelineSection({ call }) {
  var events = buildTimeline(call);
  if (!events.length) return null;
  return (
    <Section title="Trade Status Timeline">
      {events.map(function(ev, i) {
        var isLast   = i === events.length - 1;
        var isActive = ev.active;
        var isDone   = ev.done;
        return (
          <View key={i} style={tl.row}>
            <View style={tl.dotCol}>
              <View style={[
                tl.dot,
                { backgroundColor: isActive ? T.green : (isDone ? T.textSec : '#2A2A3A') },
                isActive && { shadowColor: T.green + '40', shadowOpacity: 0.9, shadowRadius: 6, elevation: 4 },
              ]} />
              {!isLast ? (
                <View style={[tl.connector, { backgroundColor: isDone ? T.textSec : T.timeline }]} />
              ) : null}
            </View>
            <View style={tl.content}>
              <Text style={[tl.label, isActive && { color: T.textPri, fontWeight: '700' }]}>
                {ev.label}
              </Text>
              {ev.time ? <Text style={tl.ts}>{fmtTs(ev.time, true)}</Text> : null}
            </View>
          </View>
        );
      })}
    </Section>
  );
}

function buildTimeline(call) {
  var status    = call.status || 'Active';
  var _status   = call._status || 'open';
  var published = call.publishedAt;
  var triggered = call.entryTriggeredAt;
  var exitAt    = call.exitAt || call.closedAt || call.expiresAt;

  if (Array.isArray(call.timeline) && call.timeline.length > 0) {
    return call.timeline.map(function(ev, i, arr) {
      return { label: ev.event, time: ev.timestamp, done: i < arr.length - 1, active: i === arr.length - 1 };
    });
  }

  var events = [
    { label: 'Call Published', time: published, done: true, active: false },
    { label: 'Entry Triggered', time: triggered, done: !!triggered, active: false },
  ];

  var SETTLED = ['target_hit','sl_hit','early_exit','expired','closed'];
  if (SETTLED.indexOf(_status) !== -1) {
    var exitLabel = { target_hit: 'Target Hit', sl_hit: 'Stop Loss Hit', early_exit: 'Early Exit', expired: 'Expired', closed: 'Closed' }[_status] || 'Closed';
    events.push({ label: exitLabel, time: exitAt, done: false, active: true });
  } else {
    events.push({ label: 'Current Status (' + status + ')', time: null, done: false, active: true });
  }
  return events;
}

const tl = StyleSheet.create({
  row:       { flexDirection: 'row', minHeight: 48 },
  dotCol:    { width: 24, alignItems: 'center' },
  dot:       { width: 10, height: 10, borderRadius: 10, marginTop: 3 },
  connector: { flex: 1, width: 1.5, marginVertical: 3 },
  content:   { flex: 1, paddingLeft: 14, paddingBottom: 12 },
  label:     { fontSize: 14, fontWeight: '600', color: T.textSec },
  ts:        { fontSize: 12, color: T.textSec, marginTop: 3 },
});

// ── P&L Section ───────────────────────────────────────────────────────────────

function PLSection({ call }) {
  var entry  = call.entryPrice;
  if (!entry) return null;

  var state = getTradeState(Object.assign({}, call, { status: call._status }));
  if (!state) return null;

  var activePrice = state.activePrice;
  var pct         = state.pct;
  var isProfit    = state.isProfit;
  var qty         = call.quantity || 0;
  var lots        = call.lots;
  var pnlAmt      = qty > 0 ? (activePrice - entry) * qty : null;
  var absPct      = Math.abs(pct).toFixed(2);
  var pnlColor    = isProfit ? T.green : T.red;
  var pnlStr      = pnlAmt != null
    ? ((isProfit ? '+' : '') + fmtInr(pnlAmt) + ' (' + (isProfit ? '+' : '-') + absPct + '%)')
    : ((isProfit ? '+' : '-') + absPct + '%');

  return (
    <Section title="P&L Calculation Details">
      <View style={pl.container}>
        {qty > 0 ? (
          <View style={pl.metaRow}>
            <Text style={pl.metaLabel}>Quantity</Text>
            <Text style={pl.metaVal}>{qty}{lots ? ' (' + lots + ' Lots)' : ''}</Text>
            <Text style={pl.metaLabel}>Entry Price</Text>
            <Text style={pl.metaVal}>{'\u20b9 ' + fmt2(entry)}</Text>
          </View>
        ) : null}
        <View style={pl.plRow}>
          <Text style={pl.plLabel}>P&L</Text>
          <Text style={[pl.plVal, { color: pnlColor }]}>{pnlStr}</Text>
        </View>
      </View>
    </Section>
  );
}

const pl = StyleSheet.create({
  container: { backgroundColor: '#1A2A1A', borderRadius: 10, padding: 14 },
  metaRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 4 },
  metaLabel: { fontSize: 12, color: T.textSec },
  metaVal:   { fontSize: 12, fontWeight: '600', color: T.textPri },
  plRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plLabel:   { fontSize: 12, color: T.textSec },
  plVal:     { fontSize: 18, fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CallDetailScreen({ route, navigation }) {
  var insets   = useSafeAreaInsets();
  var auth     = useAuth();
  var user     = auth.user;
  var callId   = route.params.callId;

  var callArr    = useState(null);
  var call       = callArr[0];
  var setCall    = callArr[1];

  var loadArr    = useState(true);
  var loading    = loadArr[0];
  var setLoading = loadArr[1];

  useEffect(function() {
    if (!callId) return;
    var unsub = onSnapshot(
      doc(db, 'calls', callId),
      function(snap) {
        if (snap.exists()) {
          setCall(adaptCall({ id: snap.id, ...snap.data() }));
        }
        setLoading(false);
      },
      function(err) { console.error('CallDetail:', err); setLoading(false); }
    );
    return unsub;
  }, [callId]);

  var handleLike = function() {
    if (!call || !user) return;
    var isLiked = (call.likes || []).indexOf(user.uid) !== -1;
    updateDoc(doc(db, 'calls', callId), {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    }).catch(function(e) { console.warn('Like:', e.message); });
  };

  var handleBookmark = function() {
    if (!call || !user) return;
    var isBookmarked = (call.bookmarks || []).indexOf(user.uid) !== -1;
    updateDoc(doc(db, 'calls', callId), {
      bookmarks: isBookmarked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    }).catch(function(e) { console.warn('Bookmark:', e.message); });
  };

  var handleShare = function() {
    if (!call) return;
    Share.share({
      message: (call.researcherName || '') + ' posted a ' + (call.callDirection || '') + ' on ' + (call.instrumentLabel || call.script || '') + '.\nView on DM Research App.',
    });
  };

  if (loading) {
    return (
      <View style={[ds.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={T.green} size="large" />
      </View>
    );
  }

  if (!call) {
    return (
      <View style={[ds.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={T.textSec} />
        <Text style={{ color: T.textSec, marginTop: 14, fontSize: 15 }}>Call not found</Text>
      </View>
    );
  }

  var isLiked      = (call.likes || []).indexOf(user && user.uid) !== -1;
  var isBookmarked = (call.bookmarks || []).indexOf(user && user.uid) !== -1;
  var progressCall = Object.assign({}, call, { status: call._status });

  return (
    <View style={[ds.root, { paddingBottom: insets.bottom }]}>

      {/* ── Nav bar ── */}
      <View style={[ds.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={function() { navigation.goBack(); }} style={ds.backBtn}>
          <Ionicons name="chevron-back" size={22} color={T.textPri} />
        </TouchableOpacity>
        <Text style={ds.navTitle}>Trade Call Details</Text>
        <TouchableOpacity style={ds.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={T.textSec} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Researcher header */}
        <ResearcherHeader call={call} />

        {/* Instrument card */}
        <InstrumentCard call={call} />

        {/* Progress line — single instance only */}
        {call.entryPrice != null && call.stopLoss != null && call.targetPrice != null ? (
          <View style={{ paddingHorizontal: 14, marginBottom: 6 }}>
            <View style={{ backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 16 }}>
              <TradeProgressLine call={progressCall} hideLabels={false} />
            </View>
          </View>
        ) : null}

        {/* Recommendation note */}
        {call.recommendationNote ? (
          <Section title="Recommendation Note">
            <Text style={{ fontSize: 13, lineHeight: 20, color: '#C0C0D0' }}>{call.recommendationNote}</Text>
          </Section>
        ) : null}

        {/* Targets */}
        <TargetsSection call={call} />

        {/* Timeline */}
        <TimelineSection call={call} />

        {/* P&L */}
        <PLSection call={call} />

        {/* Call info */}
        <Section title="Call Information">
          {[
            { label: 'Published', value: fmtTs(call.publishedAt) },
            call.expiresAt ? { label: 'Valid Till', value: fmtTs(call.expiresAt) } : null,
            call.callType  ? { label: 'Trade Type', value: call.callType } : null,
          ].filter(Boolean).map(function(item) {
            return (
              <View key={item.label} style={ds.infoRow}>
                <Text style={ds.infoLabel}>{item.label}</Text>
                <Text style={ds.infoVal}>{item.value}</Text>
              </View>
            );
          })}
        </Section>

      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View style={ds.actionBar}>
        <TouchableOpacity style={ds.aBtn} onPress={handleLike}>
          <Ionicons name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'} size={22} color={isLiked ? T.green : T.textSec} />
          <Text style={[ds.aBtnLbl, { color: isLiked ? T.green : T.textSec }]}>
            {'Like' + (call.likes && call.likes.length > 0 ? ' (' + call.likes.length + ')' : '')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={ds.aBtn}>
          <Ionicons name="chatbox-outline" size={22} color={T.textSec} />
          <Text style={ds.aBtnLbl}>
            {'Comment' + (call.commentsCount > 0 ? ' (' + call.commentsCount + ')' : '')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={ds.aBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={T.textSec} />
          <Text style={ds.aBtnLbl}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ds.aBtn} onPress={handleBookmark}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={isBookmarked ? T.green : T.textSec} />
          <Text style={[ds.aBtnLbl, { color: isBookmarked ? T.green : T.textSec }]}>
            {isBookmarked ? 'Saved' : 'Bookmark'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section:      { marginHorizontal: 14, marginBottom: 12, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: T.textPri, marginBottom: 14, letterSpacing: 0.2 },
});

const ds = StyleSheet.create({
  root:      { flex: 1, backgroundColor: T.bg },
  navBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: T.border },
  navTitle:  { fontSize: 16, fontWeight: '700', color: T.textPri },
  backBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: T.card, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  moreBtn:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  infoLabel: { fontSize: 13, color: T.textSec },
  infoVal:   { fontSize: 13, fontWeight: '600', color: T.textPri },
  // Bottom action bar
  actionBar: { height: 60, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#1A1A2A', borderTopWidth: 1, borderTopColor: T.timeline },
  aBtn:      { alignItems: 'center', gap: 4 },
  aBtnLbl:   { fontSize: 11, color: T.textSec },
});
