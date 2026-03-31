// screens/CallsScreen.js — Dynamic Money Research Platform
// Theme-aware (light/dark via useTheme) · memoized for performance

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listenCalls } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { useTheme } from '../components/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import TradeProgressLine from '../components/TradeProgressLine';

// ── Static config (never changes, no theme dependence) ────────────────────────

const SCRIPT_CLR = {
  NIFTY:      '#FF6B35',
  BANKNIFTY:  '#2563eb',
  SENSEX:     '#7c3aed',
  MIDCPNIFTY: '#059669',
  FINNIFTY:   '#0891b2',
  RELIANCE:   '#e11d48',
};

const STATUS_CFG = {
  'Active':     { label: 'OPEN',       fg: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  bdr: 'rgba(59,130,246,0.3)'  },
  'Target Hit': { label: 'TARGET HIT', fg: '#00C076', bg: 'rgba(0,192,118,0.12)',   bdr: 'rgba(0,192,118,0.3)'   },
  'SL Hit':     { label: 'SL HIT',     fg: '#FF4D4D', bg: 'rgba(255,77,77,0.12)',   bdr: 'rgba(255,77,77,0.3)'   },
  'Closed':     { label: 'CLOSED',     fg: '#94a3b8', bg: 'rgba(148,163,184,0.08)', bdr: 'rgba(148,163,184,0.2)' },
  'Expired':    { label: 'EXPIRED',    fg: '#94a3b8', bg: 'rgba(148,163,184,0.08)', bdr: 'rgba(148,163,184,0.2)' },
  'Early Exit': { label: 'EARLY EXIT', fg: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  bdr: 'rgba(245,158,11,0.3)'  },
};

const SEGMENTS   = ['All', 'Equity', 'Index', 'F&O', 'MCX'];
const TIMEFRAMES = ['All', 'Intraday', 'Positional', 'Investment', 'Options'];
const SETTLED    = ['Target Hit', 'SL Hit', 'Closed', 'Expired', 'Early Exit'];

const STATUS_MAP = {
  'Active':     'open',
  'Target Hit': 'target_hit',
  'SL Hit':     'sl_hit',
  'Closed':     'closed',
  'Expired':    'expired',
  'Early Exit': 'early_exit',
};

// ── Field Adapter — maps Firestore schema to component fields ─────────────────
// Prices in Firestore are strings ("800") → parseFloat

export function adaptCall(raw) {
  var num = function(v) { var n = parseFloat(v); return isNaN(n) ? null : n; };

  var entry  = num(raw.entryPrice);
  var sl     = num(raw.stopLoss);
  var t1     = num(raw.target1);
  var t2     = num(raw.target2);
  var t3     = num(raw.target3);
  var cmp    = num(raw.cmp);

  var targets = [
    t1 != null ? { price: t1, achieved: false } : null,
    t2 != null ? { price: t2, achieved: false } : null,
    t3 != null ? { price: t3, achieved: false } : null,
  ].filter(Boolean);

  var rec = (raw.recommendation || '').toLowerCase();
  var callDirection =
    rec === 'buy'      ? 'BUY CALL' :
    rec === 'sell'     ? 'BUY PUT'  :
    rec === 'buy call' ? 'BUY CALL' :
    rec === 'buy put'  ? 'BUY PUT'  :
    raw.recommendation || '';

  var script =
    (raw.indexName   && raw.indexName.trim())   ||
    (raw.stockSymbol && raw.stockSymbol.trim()) ||
    (raw.stockName   && raw.stockName.trim())   ||
    '';

  var subParts = [
    raw.expiryDate || '',
    num(raw.strikePrice) ? String(num(raw.strikePrice)) : '',
    raw.optionType || '',
  ].filter(Boolean);

  var instrParts = [script, raw.expiryDate || '', num(raw.strikePrice) ? String(num(raw.strikePrice)) : '', raw.optionType || ''].filter(Boolean);

  return {
    ...raw,
    entryPrice:         entry,
    stopLoss:           sl,
    targetPrice:        t1 != null ? t1 : t2,
    currentPrice:       cmp,
    exitPrice:          num(raw.exitPrice),
    targets:            targets,
    script:             script,
    instrumentLabel:    instrParts.join(' '),
    subLabel:           subParts.join(' \u00b7 '),
    callDirection:      callDirection,
    callType:           raw.timeframe || raw.callType || '',
    publishedAt:        raw.postedAt  || raw.createdAt || null,
    recommendationNote: raw.technicalRationale || raw.fundamentalRationale || raw.notes || '',
    expiryDate:         raw.expiryDate  || '',
    strikePrice:        num(raw.strikePrice),
    optionType:         raw.optionType  || '',
    researcherName:     raw.researcherName || raw.raName || '',
    _status:            STATUS_MAP[raw.status] || 'open',
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

var fmt2 = function(n) { return typeof n === 'number' ? n.toFixed(2) : '\u2014'; };

function fmtDate(ts) {
  if (!ts) return '';
  var d = ts && ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = d.getHours(); var m = String(d.getMinutes()).padStart(2, '0');
  return d.getDate() + ' ' + mo[d.getMonth()] + ' \u2022 ' + (h % 12 || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size, cardBg, isDark }) {
  name = name || ''; size = size || 40;
  var initials = name.split(' ').slice(0, 2).map(function(w) { return w[0] || ''; }).join('').toUpperCase();
  var hue = name.split('').reduce(function(a, c) { return a + c.charCodeAt(0); }, 0) % 360;
  // #00A65A passes 4.5:1 on white; on dark cards it's even higher contrast
  var badgeGreen = '#00A65A';
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'hsl(' + hue + ',45%,20%)', borderWidth: 2, borderColor: badgeGreen, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.34, fontWeight: '700', color: 'hsl(' + hue + ',65%,72%)' }}>{initials}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: badgeGreen, borderWidth: 1.5, borderColor: cardBg || '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="checkmark" size={8} color="#fff" />
      </View>
    </View>
  );
}

// ── Script badge ──────────────────────────────────────────────────────────────

function ScriptBadge({ script, size }) {
  script = script || ''; size = size || 44;
  var key = script.toUpperCase().replace(/\s/g, '');
  var col = '#475569';
  var keys = Object.keys(SCRIPT_CLR);
  for (var i = 0; i < keys.length; i++) { if (key.indexOf(keys[i]) !== -1) { col = SCRIPT_CLR[keys[i]]; break; } }
  var label = script.length > 6 ? script.slice(0, 5) : script;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: col + '20', borderWidth: 1.5, borderColor: col + '55', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.18, fontWeight: '900', color: col }}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  var c = STATUS_CFG[status] || STATUS_CFG['Active'];
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: c.bg, borderWidth: 1, borderColor: c.bdr }}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.7, color: c.fg }}>{c.label}</Text>
    </View>
  );
}

// ── Result banner — WCAG AA contrast on both themes ──────────────────────────

function ResultBanner({ call, isDark }) {
  var status = call.status || 'Active';
  var entry  = call.entryPrice;
  var target = call.targetPrice;
  var sl     = call.stopLoss;
  var curr   = call.currentPrice;
  if (!entry) return null;

  // Accessible semantic colours per theme
  var greenText = isDark ? '#34D399' : '#166534'; // dark-bg: bright mint; light-bg: dark forest
  var redText   = isDark ? '#F87171' : '#B91C1C'; // dark-bg: soft red;   light-bg: dark crimson

  if (SETTLED.indexOf(status) === -1) {
    var upside = (target && entry) ? (((target - entry) / entry) * 100).toFixed(1) : null;
    var gained = (curr  && entry)  ? (((curr  - entry) / entry) * 100) : null;
    if (!upside && gained == null) return null;
    var gainColor = gained != null ? (gained >= 0 ? greenText : redText) : (isDark ? '#94a3b8' : '#64748B');
    return (
      <View style={rb.row}>
        {upside ? (<><View style={rb.cell}><Text style={[rb.big, { color: greenText }]}>{upside}%</Text><Text style={rb.sub}>Potential Upside</Text></View>{gained != null ? <View style={rb.vDiv} /> : null}</>) : null}
        {gained != null ? (<View style={rb.cell}><Text style={[rb.big, { color: gainColor }]}>{(gained >= 0 ? '+' : '') + Math.abs(gained).toFixed(2) + '%'}</Text><Text style={rb.sub}>Profit gained so far</Text></View>) : null}
      </View>
    );
  }

  var BANNERS = { 'Target Hit': { green: true }, 'SL Hit': { green: false }, 'Early Exit': { green: true }, 'Closed': { green: true }, 'Expired': { green: false } };
  var b = BANNERS[status]; if (!b) return null;
  var ref = call.exitPrice || (status === 'Target Hit' ? target : status === 'SL Hit' ? sl : curr);
  var pct = (entry && ref) ? (((ref - entry) / entry) * 100).toFixed(2) : null;
  var bg  = b.green ? (isDark ? 'rgba(52,211,153,0.12)' : 'rgba(22,101,52,0.08)')  : (isDark ? 'rgba(248,113,113,0.12)' : 'rgba(185,28,28,0.08)');
  var bdr = b.green ? (isDark ? 'rgba(52,211,153,0.35)'  : 'rgba(22,101,52,0.25)') : (isDark ? 'rgba(248,113,113,0.35)' : 'rgba(185,28,28,0.25)');
  var fg  = b.green ? greenText : redText;
  var lbl = (STATUS_CFG[status] || {}).label || status;
  var txt = pct ? (pct + '% ' + (b.green ? 'Profit' : 'Loss') + ' \u2014 ' + lbl) : lbl;
  return (<View style={[rb.banner, { backgroundColor: bg, borderColor: bdr }]}><Text style={{ fontSize: 13, fontWeight: '800', color: fg }}>{txt}</Text></View>);
}

const rb = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingTop: 10, marginTop: 4 },
  cell:   { flex: 1, alignItems: 'center', gap: 4 },
  vDiv:   { width: 1, height: 36, backgroundColor: '#2A2D3E' },
  big:    { fontSize: 20, fontWeight: '700' },       // colour applied inline, theme-aware
  sub:    { fontSize: 11, color: '#64748B' },        // neutral mid-grey, readable on both themes
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 11, borderWidth: 1, marginTop: 8 },
});

// ── Call Card — memoized ──────────────────────────────────────────────────────

var CallCard = memo(function CallCard(props) {
  var rawCall      = props.rawCall;
  var canSeeFull   = props.canSeeFull;
  var onSubscribe  = props.onSubscribe;
  var onPress      = props.onPress;
  var isDark       = props.isDark;
  var colors       = props.colors;

  // Card colors — dark mode uses dark card, light mode uses white card
  var cardBg  = isDark ? '#1A1D2E' : '#FFFFFF';
  var cardBdr = isDark ? '#2A2D3E' : colors.border;
  var textPri = isDark ? '#FFFFFF' : colors.text;
  var textSec = isDark ? '#8A8A9A' : colors.textLight;

  // Memoize the adapted call so it only recalculates when rawCall changes
  var call = useMemo(function() { return adaptCall(rawCall); }, [rawCall]);

  var status        = call.status || 'Active';
  var isOpen        = status === 'Active';
  var dirIsRed      = call.callDirection.toUpperCase().indexOf('PUT') !== -1;
  var dirColor      = dirIsRed ? (isDark ? '#F87171' : '#B91C1C') : (isDark ? '#34D399' : '#166534');
  var progressCall  = useMemo(function() { return Object.assign({}, call, { status: call._status }); }, [call]);

  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress}
      style={[cc.card, { backgroundColor: cardBg, borderColor: cardBdr }]}>

      {/* Header */}
      <View style={cc.hdr}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name={call.researcherName} size={40} cardBg={cardBg} />
          <View>
            <Text style={[cc.raName, { color: textPri }]}>{call.researcherName || 'Researcher'}</Text>
            <Text style={[cc.time, { color: textSec }]}>{fmtDate(call.publishedAt)}</Text>
          </View>
        </View>
        {isOpen ? <StatusBadge status={status} /> : <Text style={[cc.time, { color: textSec }]}>{fmtDate(call.publishedAt)}</Text>}
      </View>

      <View style={[cc.divider, { backgroundColor: cardBdr }]} />

      {/* Script row */}
      <View style={cc.scriptRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <ScriptBadge script={call.script} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[cc.instrName, { color: textPri }]} numberOfLines={2}>{call.instrumentLabel || call.script || '\u2014'}</Text>
            {!!call.subLabel && <Text style={[cc.instrSub, { color: textSec }]}>{call.subLabel}</Text>}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[cc.dir, { color: dirColor }]}>{call.callDirection}</Text>
          {!!call.callType && <Text style={[cc.type, { color: textSec }]}>{call.callType}</Text>}
        </View>
      </View>

      {/* Progress slider (paid) OR plain price row (free) */}
      {canSeeFull && call.entryPrice != null && call.stopLoss != null && call.targetPrice != null ? (
        <View style={[cc.sliderWrap, { backgroundColor: isDark ? '#0F1120' : '#F1F5F9' }]}>
          <TradeProgressLine
            call={progressCall}
            compact={true}
            hideLabels={false}
            isDark={isDark}
            cardBg={isDark ? '#0F1120' : '#F1F5F9'}
            textColor={textPri}
            labelColor={textSec}
          />
        </View>
      ) : (
        <View style={[cc.priceRow, { backgroundColor: isDark ? '#0F1120' : '#F1F5F9' }]}>
          <View>
            <Text style={[cc.pLbl, { color: textSec }]}>Stop Loss</Text>
            <Text style={[cc.pVal, { color: isDark ? '#F87171' : '#B91C1C' }]}>
              {call.stopLoss != null ? '\u20b9 ' + fmt2(call.stopLoss) : '\u2014'}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[cc.pLbl, { color: textSec }]}>Entry</Text>
            <Text style={[cc.pVal, { color: textPri }]}>
              {call.entryPrice != null ? '\u20b9 ' + fmt2(call.entryPrice) : '\u2014'}
            </Text>
          </View>
          {canSeeFull ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[cc.pLbl, { color: isDark ? '#34D399' : '#166534' }]}>TARGET</Text>
              <Text style={[cc.pVal, { color: isDark ? '#34D399' : '#166534' }]}>
                {call.targetPrice != null ? '\u20b9 ' + fmt2(call.targetPrice) : '\u2014'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={{ alignItems: 'flex-end' }} onPress={onSubscribe}>
              <Text style={[cc.pLbl, { color: isDark ? '#34D399' : '#166534' }]}>TARGET</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 9, color: textSec, letterSpacing: 2 }}>● ● ●</Text>
                <Ionicons name="lock-closed" size={10} color="#B48900" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Result stats */}
      {canSeeFull ? <ResultBanner call={call} isDark={isDark} /> : null}

      {/* Unlock nudge */}
      {!canSeeFull ? (
        <TouchableOpacity style={cc.nudge} onPress={onSubscribe}>
          <Ionicons name="star" size={12} color="#B48900" />
          <Text style={cc.nudgeTxt}>Subscribe to unlock Target, Progress & Profit</Text>
          <Text style={cc.nudgeCTA}>Unlock</Text>
        </TouchableOpacity>
      ) : null}

      {/* Action bar */}
      <View style={[cc.actions, { borderTopColor: cardBdr }]}>
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="heart-outline" size={18} color={textSec} />
            <Text style={[cc.actCnt, { color: textSec }]}>{rawCall.likesCount || 0}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="chatbubble-outline" size={17} color={textSec} />
            <Text style={[cc.actCnt, { color: textSec }]}>{rawCall.commentsCount || 0}</Text>
          </View>
          <Ionicons name="document-text-outline" size={18} color={textSec} />
        </View>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <Ionicons name="share-social-outline" size={19} color={textSec} />
          <Ionicons name="bookmark-outline" size={19} color={textSec} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const cc = StyleSheet.create({
  card:       { marginHorizontal: 14, borderRadius: 14, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
  hdr:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  raName:     { fontSize: 13, fontWeight: '600' },
  time:       { fontSize: 10.5, marginTop: 1 },
  divider:    { height: 1, marginHorizontal: 16, marginBottom: 12 },
  scriptRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  instrName:  { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  instrSub:   { fontSize: 12, marginTop: 2 },
  dir:        { fontSize: 12, fontWeight: '600' },
  type:       { fontSize: 11, marginTop: 2, textAlign: 'right' },
  sliderWrap: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12 },
  priceRow:   { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 10, borderRadius: 10, padding: 12 },
  pLbl:       { fontSize: 11, marginBottom: 3 },
  pVal:       { fontSize: 14, fontWeight: '600' },
  nudge:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, marginTop: 2, backgroundColor: 'rgba(180,137,0,0.1)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(180,137,0,0.2)' },
  nudgeTxt:   { flex: 1, fontSize: 11.5, color: '#e8c96a', fontWeight: '600' },
  nudgeCTA:   { fontSize: 11.5, fontWeight: '900', color: '#B48900' },
  actions:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  actCnt:     { fontSize: 13 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CallsScreen() {
  var insets     = useSafeAreaInsets();
  var nav        = useNavigation();
  var themeData  = useTheme();
  var colors     = themeData.colors;
  var isDark     = themeData.isDark;
  var auth       = useAuth();
  var canSeeFull = auth.isPaid || auth.isAdmin;

  var s0 = useState([]); var calls = s0[0]; var setCalls = s0[1];
  var s1 = useState('All'); var segment = s1[0]; var setSegment = s1[1];
  var s2 = useState('All'); var timeframe = s2[0]; var setFrame = s2[1];
  var s3 = useState(true);  var loading = s3[0]; var setLoading = s3[1];

  useEffect(function() {
    setLoading(true);
    var filters = {};
    if (segment !== 'All') { filters.segment = segment; }
    var unsub = listenCalls(
      filters,
      function(data) { setCalls(data); setLoading(false); },
      function()     { setLoading(false); }
    );
    return function() { unsub(); };
  }, [segment]);

  var filtered = useMemo(function() {
    return timeframe === 'All' ? calls : calls.filter(function(c) { return (c.timeframe || c.callType || '') === timeframe; });
  }, [calls, timeframe]);

  var counts = useMemo(function() {
    var a = 0, t = 0, sl = 0;
    for (var i = 0; i < calls.length; i++) {
      if (calls[i].status === 'Active')     a++;
      if (calls[i].status === 'Target Hit') t++;
      if (calls[i].status === 'SL Hit')     sl++;
    }
    return { a: a, t: t, sl: sl, o: calls.length - a - t - sl };
  }, [calls]);

  var onCardPress = useCallback(function(id) { nav.navigate('CallDetail', { callId: id }); }, [nav]);
  var onSubscribe = useCallback(function() { nav.navigate('Subscribe'); }, [nav]);

  // Theme-derived colors
  var bgColor     = isDark ? '#0F1120' : colors.bg;
  var headerGrad  = isDark ? ['#0D1525', '#0F1120'] : [colors.navyDark, colors.navy];
  var statsBg     = isDark ? '#1A1D2E' : colors.surface;
  var statsBdr    = isDark ? '#2A2D3E' : colors.border;
  var chipBdr     = isDark ? '#3A3A4A' : colors.border;
  var chipTxt     = isDark ? '#8A8A9A' : colors.textLight;

  var renderItem = useCallback(function(info) {
    return (
      <CallCard
        rawCall={info.item}
        canSeeFull={canSeeFull}
        onSubscribe={onSubscribe}
        onPress={function() { onCardPress(info.item.id); }}
        isDark={isDark}
        colors={colors}
      />
    );
  }, [canSeeFull, onSubscribe, onCardPress, isDark, colors]);

  var separator = useCallback(function() { return <View style={{ height: 12 }} />; }, []);

  return (
    <View style={[sc.root, { backgroundColor: bgColor }]}>

      {/* Header */}
      <LinearGradient colors={headerGrad} style={[sc.header, { paddingTop: insets.top + 10 }]}>
        <View style={sc.headerTop}>
          <View>
            <Text style={sc.title}>Research Calls</Text>
            <Text style={sc.subtitle}>Live segment-wise trading calls</Text>
          </View>
          <View style={[sc.tierBadge, canSeeFull ? sc.tierPaid : sc.tierFree]}>
            <Ionicons name={canSeeFull ? 'shield-checkmark' : 'shield-outline'} size={11} color={canSeeFull ? '#fff' : '#B48900'} />
            <Text style={[sc.tierTxt, { color: canSeeFull ? '#fff' : '#B48900' }]}>{canSeeFull ? 'PREMIUM' : 'FREE TIER'}</Text>
          </View>
        </View>

        {/* Segment chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {SEGMENTS.map(function(seg) {
            var on = segment === seg;
            return (
              <TouchableOpacity key={seg} style={[sc.segChip, { borderColor: on ? '#00C076' : chipBdr, backgroundColor: on ? '#00C076' : 'transparent' }, on && sc.segChipOn]} onPress={function() { setSegment(seg); }}>
                {on ? <View style={sc.segDot} /> : null}
                <Text style={[sc.segChipTxt, { color: on ? '#fff' : chipTxt }, on && { fontWeight: '600' }]}>{seg}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Timeframe chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 6, paddingBottom: 4 }}>
          {TIMEFRAMES.map(function(tf) {
            var on = timeframe === tf;
            return (
              <TouchableOpacity key={tf} style={[sc.tfChip, { borderColor: on ? '#00C076' : chipBdr, backgroundColor: on ? 'rgba(0,192,118,0.1)' : 'transparent' }]} onPress={function() { setFrame(tf); }}>
                <Text style={[sc.tfChipTxt, { color: on ? '#00C076' : chipTxt }]}>{tf}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Stats bar */}
      {calls.length > 0 ? (
        <View style={[sc.statsBar, { backgroundColor: statsBg, borderBottomColor: statsBdr }]}>
          {[
            { n: counts.a,  lbl: 'ACTIVE',     col: '#22c55e' },
            { n: counts.t,  lbl: 'TARGET HIT', col: '#60a5fa' },
            { n: counts.sl, lbl: 'SL HIT',     col: '#f87171' },
            { n: counts.o,  lbl: 'OTHERS',     col: colors.textMuted },
          ].map(function(item) {
            return (
              <View key={item.lbl} style={[sc.statChip, { backgroundColor: isDark ? '#0F1120' : colors.offWhite }]}>
                <Text style={[sc.statN, { color: item.col }]}>{item.n}</Text>
                <Text style={[sc.statL, { color: colors.textMuted }]}>{item.lbl}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Gate banner */}
      {!canSeeFull ? (
        <TouchableOpacity style={sc.gate} onPress={onSubscribe}>
          <Ionicons name="lock-closed" size={14} color="#B48900" />
          <View style={{ flex: 1 }}>
            <Text style={sc.gateTxt}>Target & full details are hidden</Text>
            <Text style={sc.gateSub}>Subscribe to unlock everything</Text>
          </View>
          <View style={sc.gateBtn}><Text style={sc.gateBtnTxt}>Unlock</Text></View>
        </TouchableOpacity>
      ) : null}

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={isDark ? '#34D399' : '#166534'} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Loading calls...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={function(i) { return i.id; }}
          renderItem={renderItem}
          ItemSeparatorComponent={separator}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          initialNumToRender={5}
          windowSize={7}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 70 }}>
              <Ionicons name="trending-up-outline" size={52} color={colors.border} />
              <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: 15, fontWeight: '600' }}>No calls found</Text>
              <Text style={{ color: colors.textLight, marginTop: 6, fontSize: 13 }}>
                {segment !== 'All' || timeframe !== 'All' ? 'Try a different filter' : 'Research calls will appear here once posted'}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingVertical: 14, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  root:       { flex: 1 },
  header:     { paddingHorizontal: 16, paddingBottom: 12 },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title:      { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  subtitle:   { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  tierBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierFree:   { backgroundColor: 'rgba(180,137,0,0.15)', borderColor: 'rgba(180,137,0,0.4)' },
  tierPaid:   { backgroundColor: '#00A65A', borderColor: '#00A65A' },  // darker green → white text passes 4.5:1
  tierTxt:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  segChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1 },
  segChipOn:  {},
  segDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  segChipTxt: { fontSize: 12 },
  tfChip:     { height: 30, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 15, borderWidth: 1 },
  tfChipTxt:  { fontSize: 11, fontWeight: '600' },
  statsBar:   { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  statChip:   { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  statN:      { fontSize: 22, fontWeight: '700' },
  statL:      { fontSize: 10, letterSpacing: 0.5, marginTop: 2 },
  gate:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#fefce8', borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  gateTxt:    { fontSize: 13, fontWeight: '700', color: '#713f12' },
  gateSub:    { fontSize: 11, color: '#92400e', marginTop: 1 },
  gateBtn:    { backgroundColor: '#0F2044', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  gateBtnTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
