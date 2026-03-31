// screens/ResearcherDashboard.js
// Visible to: researcher role only
// Shows: personal stats, their own posted calls, quick post action,
//        profile info, logout

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert, ScrollView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../components/theme';
import { getResearcherCalls, logoutUser } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { useNavigation } from '@react-navigation/native';

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────

export default function ResearcherDashboard() {
  const nav               = useNavigation();
  const { user, profile } = useAuth();

  const [calls,      setCalls]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalls = useCallback(async () => {
    if (!user?.uid) return;
    const { calls: data } = await getResearcherCalls(user.uid);
    setCalls(data);
    setLoading(false);
    setRefreshing(false);
  }, [user?.uid]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:     calls.length,
    active:    calls.filter(c => c.status === 'Active').length,
    targetHit: calls.filter(c => c.status === 'Target Hit').length,
    slHit:     calls.filter(c => c.status === 'SL Hit').length,
  };

  const winRate = stats.targetHit + stats.slHit > 0
    ? Math.round((stats.targetHit / (stats.targetHit + stats.slHit)) * 100)
    : null;

  // ── Logout ─────────────────────────────────────────────────────────────────
  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logoutUser() },
    ]);
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />

      <FlatList
        data={calls}
        keyExtractor={c => c.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchCalls(); }}
            tintColor="#a78bfa"
          />
        }
        ListHeaderComponent={
          <ResearcherHeader
            profile={profile}
            stats={stats}
            winRate={winRate}
            onPostCall={() => nav.navigate('PostCall')}  // your existing post call screen
            onLogout={handleLogout}
          />
        }
        renderItem={({ item }) => <MiniCallCard call={item} />}
        ListEmptyComponent={
          !loading && (
            <View style={s.emptyWrap}>
              <Ionicons name="analytics-outline" size={48} color={COLORS.textMuted} />
              <Text style={s.emptyTitle}>No calls posted yet</Text>
              <Text style={s.emptySub}>Your posted research calls will appear here</Text>
              <TouchableOpacity style={s.postBtn} onPress={() => nav.navigate('PostCall')}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={s.postBtnTxt}>Post Your First Call</Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListFooterComponent={
          loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={s.loadingTxt}>Loading your calls...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ── HEADER COMPONENT ──────────────────────────────────────────────────────────

function ResearcherHeader({ profile, stats, winRate, onPostCall, onLogout }) {
  return (
    <View>
      {/* ── Purple gradient header ── */}
      <LinearGradient colors={['#1e1b4b', '#4c1d95', '#7c3aed']} style={s.header}>
        {/* Top row: greeting + logout */}
        <View style={s.headerTop}>
          <View style={s.avatarWrap}>
            <Text style={s.avatarTxt}>
              {(profile?.name || 'R')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Welcome back,</Text>
            <Text style={s.researcherName}>{profile?.name || 'Researcher'}</Text>
            <View style={s.specialityTag}>
              <Ionicons name="analytics" size={10} color="#a78bfa" />
              <Text style={s.specialityTxt}>{profile?.speciality || 'Research'} · Researcher</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Status: active / suspended */}
        <View style={[s.statusBar, { backgroundColor: profile?.isActive ? '#14532d30' : '#7f1d1d40' }]}>
          <View style={[s.statusDot, { backgroundColor: profile?.isActive ? '#4ade80' : '#f87171' }]} />
          <Text style={s.statusTxt}>
            {profile?.isActive ? 'Account Active — You can post calls' : '⚠️ Account Suspended — Contact admin'}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Stats cards ── */}
      <View style={s.statsGrid}>
        <StatCard label="Total Calls" value={stats.total}     icon="layers-outline"         color="#7c3aed" bg="#ede9fe" />
        <StatCard label="Active"      value={stats.active}    icon="radio-button-on-outline" color="#16a34a" bg="#dcfce7" />
        <StatCard label="Target Hit"  value={stats.targetHit} icon="checkmark-circle-outline" color="#1d4ed8" bg="#dbeafe" />
        <StatCard label="Win Rate"    value={winRate !== null ? `${winRate}%` : '—'} icon="trophy-outline" color="#d97706" bg="#fef3c7" />
      </View>

      {/* ── Quick action ── */}
      <TouchableOpacity
        style={[s.quickPostBtn, !profile?.isActive && { opacity: 0.4 }]}
        onPress={onPostCall}
        disabled={!profile?.isActive}>
        <LinearGradient colors={['#7c3aed', '#4f46e5']} style={s.quickPostGradient}>
          <Ionicons name="add-circle" size={22} color="#fff" />
          <View>
            <Text style={s.quickPostTitle}>Post New Research Call</Text>
            <Text style={s.quickPostSub}>Tap to add a new call for subscribers</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Section header ── */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>My Posted Calls</Text>
        <Text style={s.sectionCount}>{stats.total} total</Text>
      </View>
    </View>
  );
}

// ── MINI CALL CARD ────────────────────────────────────────────────────────────

function MiniCallCard({ call }) {
  const stock    = call.stockSymbol  || call.stock        || '—';
  const action   = call.recommendation || call.action     || '—';
  const isBuy    = action.toLowerCase().includes('buy');
  const date     = call.postedAt?.toDate
    ? call.postedAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : '—';

  const STATUS_COLORS = {
    'Active':     { bg: '#dcfce7', txt: '#15803d' },
    'Target Hit': { bg: '#dbeafe', txt: '#1d4ed8' },
    'SL Hit':     { bg: '#fee2e2', txt: '#dc2626' },
    'Closed':     { bg: '#f1f5f9', txt: '#475569' },
  };
  const sc = STATUS_COLORS[call.status] || STATUS_COLORS['Closed'];

  return (
    <View style={s.miniCard}>
      {/* Action badge */}
      <View style={[s.miniAction, { backgroundColor: isBuy ? '#15803d' : '#dc2626' }]}>
        <Text style={s.miniActionTxt}>{action.toUpperCase().slice(0, 4)}</Text>
      </View>

      {/* Stock + segment */}
      <View style={{ flex: 1 }}>
        <Text style={s.miniStock}>{stock}</Text>
        <Text style={s.miniMeta}>{call.segment} · {call.timeframe}</Text>
      </View>

      {/* Status */}
      <View style={[s.miniStatus, { backgroundColor: sc.bg }]}>
        <Text style={[s.miniStatusTxt, { color: sc.txt }]}>{call.status}</Text>
      </View>

      {/* Date */}
      <Text style={s.miniDate}>{date}</Text>
    </View>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, bg }) {
  return (
    <View style={[s.statCard, { backgroundColor: bg }]}>
      <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header:         { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, gap: 16 },
  headerTop:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap:     { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontSize: 22, fontWeight: '900', color: '#fff' },
  greeting:       { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  researcherName: { fontSize: 20, fontWeight: '900', color: '#fff' },
  specialityTag:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  specialityTxt:  { fontSize: 11, color: '#a78bfa', fontWeight: '700' },
  logoutBtn:      { padding: 8 },
  statusBar:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  statusDot:      { width: 8, height: 8, borderRadius: 4 },
  statusTxt:      { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Stats grid
  statsGrid:      { flexDirection: 'row', padding: 16, gap: 10 },
  statCard:       { flex: 1, borderRadius: RADIUS.lg, padding: 12, alignItems: 'center', gap: 6 },
  statIcon:       { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue:      { fontSize: 20, fontWeight: '900' },
  statLabel:      { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },

  // Quick post button
  quickPostBtn:   { marginHorizontal: 16, marginBottom: 16, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.sm },
  quickPostGradient:{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  quickPostTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  quickPostSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Section header
  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  sectionTitle:   { fontSize: 16, fontWeight: '800', color: COLORS.text },
  sectionCount:   { fontSize: 13, color: COLORS.textMuted },

  // Mini call card
  miniCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: RADIUS.lg, ...SHADOW.sm },
  miniAction:     { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  miniActionTxt:  { fontSize: 10, fontWeight: '900', color: '#fff' },
  miniStock:      { fontSize: 15, fontWeight: '800', color: COLORS.text },
  miniMeta:       { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  miniStatus:     { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  miniStatusTxt:  { fontSize: 11, fontWeight: '800' },
  miniDate:       { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', minWidth: 36, textAlign: 'right' },

  // Empty / loading
  emptyWrap:      { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40, gap: 10 },
  emptyTitle:     { fontSize: 16, fontWeight: '800', color: COLORS.textMid },
  emptySub:       { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  postBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  postBtnTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },
  loadingWrap:    { alignItems: 'center', paddingTop: 40, gap: 12 },
  loadingTxt:     { color: COLORS.textMuted, fontSize: 14 },
});
