// screens/AdminUsersScreen.js — v2
// Fixes:
// 1. Shows agreementAccepted + agreementDate for every user
// 2. Fetches ALL users (not just role:'user') — catches new signups
// 3. Shows phone number from registration
// 4. Filter by agreement status

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Alert, Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../components/theme';
import {
  listenAllUsers,
  toggleUserActive,
  updateUserPlan,
} from '../firebase';
import { useAuth } from '../components/AuthContext';

const PLAN_OPTIONS = ['Free Trial', 'Basic', 'Premium', 'Elite', 'Suspended'];

const PLAN_COLORS = {
  'Free Trial': { bg: '#fef9c3', txt: '#854d0e', border: '#fde047' },
  'Basic':      { bg: '#dbeafe', txt: '#1e40af', border: '#93c5fd' },
  'Premium':    { bg: '#f3e8ff', txt: '#6b21a8', border: '#c084fc' },
  'Elite':      { bg: '#dcfce7', txt: '#14532d', border: '#4ade80' },
  'Suspended':  { bg: '#fee2e2', txt: '#991b1b', border: '#fca5a5' },
};

const STATUS_FILTERS = ['All', 'Active', 'Trial', 'Expired', 'Suspended'];
const AGREEMENT_FILTERS = ['All', 'Agreed', 'Not Agreed'];

export default function AdminUsersScreen() {
  const [users,           setUsers]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('All');
  const [planFilter,      setPlanFilter]      = useState('All');
  const [agreementFilter, setAgreementFilter] = useState('All');

  // Plan upgrade modal
  const [modalUser,  setModalUser]  = useState(null);
  const [newPlan,    setNewPlan]    = useState('');
  const [planExpiry, setPlanExpiry] = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    const unsub = listenAllUsers(
      (data) => { setUsers(data); setLoading(false); },
      ()     => setLoading(false),
    );
    return () => unsub();
  }, []);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       users.length,
    active:      users.filter(u => u.isActive && !u.isTrial).length,
    trial:       users.filter(u => u.isTrial).length,
    suspended:   users.filter(u => !u.isActive).length,
    agreed:      users.filter(u => u.agreementAccepted === true).length,
    notAgreed:   users.filter(u => !u.agreementAccepted).length,
    newToday:    users.filter(u => {
      const d = u.createdAt?.toDate?.() ?? new Date(u.createdAt);
      return d?.toDateString?.() === new Date().toDateString();
    }).length,
  }), [users]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search);

      const matchStatus =
        statusFilter === 'All'       ? true :
        statusFilter === 'Active'    ? (u.isActive && !u.isTrial) :
        statusFilter === 'Trial'     ? u.isTrial :
        statusFilter === 'Expired'   ? (!u.isActive && !u.isTrial) :
        statusFilter === 'Suspended' ? !u.isActive : true;

      const matchPlan = planFilter === 'All' || u.plan === planFilter;

      const matchAgreement =
        agreementFilter === 'All'       ? true :
        agreementFilter === 'Agreed'    ? u.agreementAccepted === true :
        agreementFilter === 'Not Agreed'? !u.agreementAccepted : true;

      return matchSearch && matchStatus && matchPlan && matchAgreement;
    });
  }, [users, search, statusFilter, planFilter, agreementFilter]);

  function handleToggleActive(user) {
    const action = user.isActive ? 'Suspend' : 'Activate';
    Alert.alert(
      `${action} User`,
      `${action} ${user.name || user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: user.isActive ? 'destructive' : 'default',
          onPress: async () => {
            const { error } = await toggleUserActive(user.id, !user.isActive);
            if (error) Alert.alert('Error', error);
          },
        },
      ]
    );
  }

  function openPlanModal(user) {
    setModalUser(user);
    setNewPlan(user.plan || 'Free Trial');
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setPlanExpiry(d.toISOString().split('T')[0]);
  }

  async function savePlan() {
    if (!newPlan || !planExpiry) { Alert.alert('Missing', 'Select plan and expiry date'); return; }
    setSaving(true);
    const expiry = new Date(planExpiry);
    const { error } = await updateUserPlan(modalUser.id, {
      plan:       newPlan,
      planStart:  new Date(),
      planExpiry: expiry,
      isActive:   newPlan !== 'Suspended',
      isTrial:    false,
    });
    setSaving(false);
    if (error) { Alert.alert('Error', error); return; }
    setModalUser(null);
    Alert.alert('✅ Done', `Plan updated to ${newPlan}`);
  }

  function fmtDate(val) {
    if (!val) return '—';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function daysLeft(val) {
    if (!val) return null;
    const d = val?.toDate ? val.toDate() : new Date(val);
    return Math.ceil((d - new Date()) / 86400000);
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <LinearGradient colors={[COLORS.navyDark, COLORS.navy]} style={s.header}>
        <Text style={s.headerTitle}>User Management</Text>
        <Text style={s.headerSub}>All registered users</Text>

        {/* Stats row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsRow}>
          <StatBadge label="Total"      value={stats.total}     color="#60a5fa" />
          <StatBadge label="Active"     value={stats.active}    color="#4ade80" />
          <StatBadge label="Trial"      value={stats.trial}     color="#fbbf24" />
          <StatBadge label="Suspended"  value={stats.suspended} color="#f87171" />
          <StatBadge label="✅ Agreed"   value={stats.agreed}    color="#34d399" />
          <StatBadge label="⏳ Pending"  value={stats.notAgreed} color="#fb923c" />
          <StatBadge label="New Today"  value={stats.newToday}  color="#a78bfa" />
        </ScrollView>
      </LinearGradient>

      {/* ── SEARCH ─────────────────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search name, email or phone..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── FILTERS ────────────────────────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        {/* Status filters */}
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, statusFilter === f && s.filterPillOn]}
            onPress={() => setStatusFilter(f)}>
            <Text style={[s.filterTxt, statusFilter === f && s.filterTxtOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
        <View style={s.filterDivider} />
        {/* Agreement filters */}
        {AGREEMENT_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, agreementFilter === f && s.filterPillGreen]}
            onPress={() => setAgreementFilter(f)}>
            <Text style={[s.filterTxt, agreementFilter === f && s.filterTxtGreen]}>{f}</Text>
          </TouchableOpacity>
        ))}
        <View style={s.filterDivider} />
        {/* Plan filters */}
        {['All', ...PLAN_OPTIONS].map(p => (
          <TouchableOpacity
            key={p}
            style={[s.filterPill, planFilter === p && s.filterPillGold]}
            onPress={() => setPlanFilter(p)}>
            <Text style={[s.filterTxt, planFilter === p && s.filterTxtGold]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.resultCount}>{filtered.length} of {users.length} users</Text>

      {/* ── LIST ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.navy} />
          <Text style={s.loadingTxt}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={u => u.id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              fmtDate={fmtDate}
              daysLeft={daysLeft}
              onToggleActive={() => handleToggleActive(item)}
              onUpgradePlan={() => openPlanModal(item)}
            />
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={s.emptyTxt}>No users found</Text>
              <Text style={s.emptySubTxt}>Try adjusting your filters</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── PLAN UPGRADE MODAL ─────────────────────────────────────────────── */}
      <Modal visible={!!modalUser} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Update Plan</Text>
            <Text style={s.modalSub}>{modalUser?.name || modalUser?.email}</Text>

            <Text style={s.modalLabel}>Select Plan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {PLAN_OPTIONS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.planChip, newPlan === p && s.planChipOn]}
                  onPress={() => setNewPlan(p)}>
                  <Text style={[s.planChipTxt, newPlan === p && s.planChipTxtOn]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.modalLabel}>Plan Expiry (YYYY-MM-DD)</Text>
            <TextInput
              style={s.modalInput}
              value={planExpiry}
              onChangeText={setPlanExpiry}
              placeholder="2025-12-31"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalUser(null)}>
                <Text style={s.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={savePlan} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.saveBtnTxt}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── USER CARD ─────────────────────────────────────────────────────────────────

function UserCard({ user, fmtDate, daysLeft, onToggleActive, onUpgradePlan }) {
  const [expanded, setExpanded] = useState(false);
  const plan       = user.plan || 'Free Trial';
  const pc         = PLAN_COLORS[plan] || PLAN_COLORS['Free Trial'];
  const left       = daysLeft(user.planExpiry);
  const isExpired  = left !== null && left <= 0;
  const agreed     = user.agreementAccepted === true;

  return (
    <View style={s.card}>
      {/* Row 1: Avatar + Name + Plan badge */}
      <View style={s.cardRow}>
        <View style={[s.avatar, { backgroundColor: stringToColor(user.name || user.email) }]}>
          <Text style={s.avatarTxt}>
            {(user.name || user.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.userName}>{user.name || 'No Name'}</Text>
          <Text style={s.userEmail}>{user.email}</Text>
          {user.phone ? <Text style={s.userPhone}>📞 {user.phone}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[s.planBadge, { backgroundColor: pc.bg, borderColor: pc.border }]}>
            <Text style={[s.planBadgeTxt, { color: pc.txt }]}>{plan}</Text>
          </View>
          {/* ✅ Agreement badge — visible to admin */}
          <View style={[s.agreeBadge, agreed ? s.agreeBadgeOn : s.agreeBadgeOff]}>
            <Ionicons
              name={agreed ? 'checkmark-circle' : 'time-outline'}
              size={10}
              color={agreed ? '#15803d' : '#d97706'}
            />
            <Text style={[s.agreeBadgeTxt, { color: agreed ? '#15803d' : '#d97706' }]}>
              {agreed ? 'Agreed' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Row 2: Quick stats */}
      <View style={s.statsGrid}>
        <InfoTile icon="calendar-outline"  label="Joined"    val={fmtDate(user.createdAt)} />
        <InfoTile icon="time-outline"      label="Expiry"    val={fmtDate(user.planExpiry)} />
        <InfoTile
          icon="hourglass-outline"
          label="Days Left"
          val={left === null ? '—' : left <= 0 ? 'Expired' : `${left}d`}
          valColor={isExpired ? '#dc2626' : left <= 7 ? '#d97706' : '#15803d'}
        />
        <InfoTile
          icon="person-outline"
          label="Status"
          val={user.isActive ? (user.isTrial ? 'Trial' : 'Active') : 'Suspended'}
          valColor={user.isActive ? '#15803d' : '#dc2626'}
        />
      </View>

      {/* Expand button */}
      <TouchableOpacity style={s.expandRow} onPress={() => setExpanded(e => !e)}>
        <Text style={s.expandTxt}>{expanded ? 'Hide Details' : 'Show Details'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Expanded: agreement details + profile */}
      {expanded && (
        <View style={s.expandedSection}>
          {/* ✅ Agreement acceptance details */}
          <View style={[s.agreementBox, agreed ? s.agreementBoxOn : s.agreementBoxOff]}>
            <View style={s.agreementRow}>
              <Ionicons
                name={agreed ? 'document-text' : 'document-text-outline'}
                size={16}
                color={agreed ? '#15803d' : '#d97706'}
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.agreementTitle, { color: agreed ? '#15803d' : '#d97706' }]}>
                  {agreed ? '✅ RA Agreement Accepted' : '⏳ RA Agreement Pending'}
                </Text>
                {agreed && user.agreementDate ? (
                  <Text style={s.agreementDate}>
                    Accepted on {fmtDate(user.agreementDate)}
                  </Text>
                ) : (
                  <Text style={s.agreementDate}>Not yet accepted by user</Text>
                )}
              </View>
            </View>
          </View>

          {/* Profile details */}
          <View style={s.detailGrid}>
            {user.city  ? <DetailChip label="City"       val={`${user.city}${user.state ? ', '+user.state : ''}`} /> : null}
            {user.experience ? <DetailChip label="Experience" val={user.experience} /> : null}
            {user.occupation ? <DetailChip label="Occupation" val={user.occupation} /> : null}
            {user.income     ? <DetailChip label="Income"     val={user.income} /> : null}
            {user.riskAppetite ? <DetailChip label="Risk"      val={user.riskAppetite} /> : null}
            <DetailChip label="Role" val={user.role || 'user'} />
          </View>

          {/* Action buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: user.isActive ? '#fee2e2' : '#dcfce7' }]}
              onPress={onToggleActive}>
              <Ionicons
                name={user.isActive ? 'ban-outline' : 'checkmark-circle-outline'}
                size={14}
                color={user.isActive ? '#dc2626' : '#15803d'}
              />
              <Text style={[s.actionBtnTxt, { color: user.isActive ? '#dc2626' : '#15803d' }]}>
                {user.isActive ? 'Suspend' : 'Activate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#ede9fe' }]} onPress={onUpgradePlan}>
              <Ionicons name="star-outline" size={14} color="#7c3aed" />
              <Text style={[s.actionBtnTxt, { color: '#7c3aed' }]}>Update Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function StatBadge({ label, value, color }) {
  return (
    <View style={[s.statBadge, { borderColor: color + '60' }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function InfoTile({ icon, label, val, valColor }) {
  return (
    <View style={s.infoTile}>
      <Ionicons name={icon} size={11} color={COLORS.textMuted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoVal, valColor ? { color: valColor } : {}]}>{val}</Text>
    </View>
  );
}

function DetailChip({ label, val }) {
  return (
    <View style={s.detailChip}>
      <Text style={s.detailChipLabel}>{label}</Text>
      <Text style={s.detailChipVal}>{val}</Text>
    </View>
  );
}

function stringToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#0d9488'];
  return colors[Math.abs(hash) % colors.length];
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  header:         { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:    { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 },
  statsRow:       { marginHorizontal: -4 },
  statBadge:      { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 4, alignItems: 'center', minWidth: 68 },
  statValue:      { fontSize: 18, fontWeight: '900' },
  statLabel:      { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  searchWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, ...SHADOW.sm },
  searchInput:    { flex: 1, fontSize: 14, color: COLORS.text },
  filterRow:      { paddingHorizontal: 12, paddingVertical: 10 },
  filterPill:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginHorizontal: 3, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
  filterPillOn:   { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterPillGold: { backgroundColor: COLORS.goldPale, borderColor: COLORS.gold },
  filterPillGreen:{ backgroundColor: '#dcfce7', borderColor: '#4ade80' },
  filterTxt:      { fontSize: 11, fontWeight: '600', color: COLORS.textMid },
  filterTxtOn:    { color: '#fff' },
  filterTxtGold:  { color: '#92400e' },
  filterTxtGreen: { color: '#15803d' },
  filterDivider:  { width: 1, backgroundColor: COLORS.border, marginHorizontal: 6, marginVertical: 4 },
  resultCount:    { fontSize: 12, color: COLORS.textMuted, paddingHorizontal: 16, marginBottom: 8 },
  loadingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:     { color: COLORS.textMuted, fontSize: 14 },
  emptyWrap:      { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTxt:       { fontSize: 15, color: COLORS.textMuted, fontWeight: '700' },
  emptySubTxt:    { fontSize: 13, color: COLORS.textMuted },
  card:           { backgroundColor: '#fff', borderRadius: RADIUS.xl, marginHorizontal: 16, marginBottom: 12, padding: 16, ...SHADOW.sm },
  cardRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  avatar:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  userName:       { fontSize: 15, fontWeight: '800', color: COLORS.text },
  userEmail:      { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  userPhone:      { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  planBadge:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  planBadgeTxt:   { fontSize: 10, fontWeight: '800' },
  agreeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  agreeBadgeOn:   { backgroundColor: '#dcfce7', borderColor: '#4ade80' },
  agreeBadgeOff:  { backgroundColor: '#fef3c7', borderColor: '#fbbf24' },
  agreeBadgeTxt:  { fontSize: 9, fontWeight: '800' },
  statsGrid:      { flexDirection: 'row', backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: 10, gap: 4, marginBottom: 8 },
  infoTile:       { flex: 1, alignItems: 'center', gap: 3 },
  infoLabel:      { fontSize: 8, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  infoVal:        { fontSize: 11, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  expandRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  expandTxt:      { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  expandedSection:{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  agreementBox:   { borderRadius: RADIUS.md, padding: 12, borderWidth: 1 },
  agreementBoxOn: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  agreementBoxOff:{ backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  agreementRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  agreementTitle: { fontSize: 13, fontWeight: '800' },
  agreementDate:  { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  detailGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailChip:     { backgroundColor: COLORS.offWhite, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  detailChipLabel:{ fontSize: 9, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  detailChipVal:  { fontSize: 12, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  actionRow:      { flexDirection: 'row', gap: 10 },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: RADIUS.md },
  actionBtnTxt:   { fontSize: 13, fontWeight: '800' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:     { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  modalSub:       { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  modalLabel:     { fontSize: 12, fontWeight: '700', color: COLORS.textMid, marginBottom: 10 },
  modalInput:     { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  planChip:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  planChipOn:     { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  planChipTxt:    { fontSize: 13, fontWeight: '700', color: COLORS.textMid },
  planChipTxtOn:  { color: '#fff' },
  modalBtns:      { flexDirection: 'row', gap: 12 },
  cancelBtn:      { flex: 1, paddingVertical: 14, borderRadius: RADIUS.lg, backgroundColor: COLORS.offWhite, alignItems: 'center' },
  cancelBtnTxt:   { fontSize: 15, fontWeight: '700', color: COLORS.textMid },
  saveBtn:        { flex: 2, paddingVertical: 14, borderRadius: RADIUS.lg, backgroundColor: COLORS.navy, alignItems: 'center' },
  saveBtnTxt:     { fontSize: 15, fontWeight: '800', color: '#fff' },
});
