// screens/admin/AdminScreen.js — FIXED v2
// ✅ FIX: Field names now match admin panel & CallsScreen
//    stock      → stockSymbol
//    callType   → timeframe
//    buyPrice   → entryPrice
//    target     → target1
//    action     → recommendation

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, Alert, Modal, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../../components/theme';
import {
  addCall, getCalls, deleteCall, updateCall,
  addArticle, getArticles, deleteArticle,
  getAllUsers, adminUpdateUser, updateConfig, logoutUser,
} from '../../firebase';
import { useAuth } from '../../components/AuthContext';
import { fmtDate } from '../../utils/dateUtils';

const SEGMENTS  = ['Equity','F&O','Index','MCX'];
const STATUSES  = ['Active','Target Hit','SL Hit','Closed'];
const TIMEFRAMES = ['Intraday','Positional','Investment','Options']; // ✅ renamed from CALLTYPES
const TIERS     = ['Premium','Platinum'];
const ACTIONS   = ['Buy','Sell'];
const CATS      = ['Market News','Economy','Investing Tips','Commodities','Company Update','Technical Analysis','Weekly Report'];

export default function AdminScreen() {
  const [tab, setTab]   = useState('calls');
  const { isGodAdmin }  = useAuth();

  async function handleLogout() {
    Alert.alert('Logout', 'Logout from admin?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await logoutUser() },
    ]);
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4c1d95" />
      <LinearGradient colors={['#3b0764','#4c1d95','#6d28d9']} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle} accessibilityRole="header">Admin Panel</Text>
            <Text style={s.headerSub}>
              Dynamic Money Research · {isGodAdmin ? '👑 God Admin' : '🛡 Admin'}
            </Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}
            accessibilityRole="button" accessibilityLabel="Logout">
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow}>
          {[['calls','📊 Calls'],['articles','📰 Articles'],['users','👥 Users'],['settings','⚙️ Settings']].map(([k,l]) => (
            <TouchableOpacity key={k} style={[s.tabBtn, tab===k && s.tabOn]}
              onPress={() => setTab(k)} accessibilityRole="tab">
              <Text style={[s.tabTxt, tab===k && s.tabTxtOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {tab === 'calls'    && <CallsTab />}
      {tab === 'articles' && <ArticlesTab />}
      {tab === 'users'    && <UsersTab />}
      {tab === 'settings' && <SettingsTab />}
    </View>
  );
}

// ── CALLS TAB ──────────────────────────────────────────────────────────────
function CallsTab() {
  const [stockSymbol, setStockSymbol] = useState('');   // ✅ renamed
  const [exchange,    setExchange]    = useState('NSE');
  const [segment,     setSegment]     = useState('Equity');
  const [timeframe,   setTimeframe]   = useState('Intraday'); // ✅ renamed
  const [tier,        setTier]        = useState('Premium');
  const [recommendation, setRecommendation] = useState('Buy'); // ✅ renamed
  const [entryPrice,  setEntryPrice]  = useState('');  // ✅ renamed
  const [target1,     setTarget1]     = useState('');  // ✅ renamed
  const [stopLoss,    setStopLoss]    = useState('');
  const [status,      setStatus]      = useState('Active');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [calls,       setCalls]       = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  async function handlePost() {
    if (!stockSymbol.trim() || !entryPrice || !target1 || !stopLoss) {
      Alert.alert('Missing Fields', 'Please fill Stock, Entry, Target, and Stop Loss.');
      return;
    }

    Alert.alert(
      '📊 Confirm Research Call',
      `${recommendation.toUpperCase()} ${stockSymbol.trim().toUpperCase()} (${segment} · ${timeframe})\n\nEntry:     ₹${entryPrice}\nTarget:    ₹${target1}\nStop Loss: ₹${stopLoss}\nTier: ${tier}\n\nPost this call to all subscribers?`,
      [
        { text: 'Edit', style: 'cancel' },
        { text: 'Post', style: 'default', onPress: async () => {
          setSaving(true);
          const { error } = await addCall({
            // ✅ FIXED field names — match admin web panel & CallsScreen
            stockSymbol:    stockSymbol.trim().toUpperCase(),
            exchange,
            segment,
            timeframe,          // ✅ was callType
            classification: tier,
            recommendation,     // ✅ was action
            entryPrice:     parseFloat(entryPrice),   // ✅ was buyPrice
            target1:        parseFloat(target1),       // ✅ was target
            stopLoss:       parseFloat(stopLoss),
            status,
            notes:          notes.trim(),
            isHidden:       false,
          });
          setSaving(false);
          if (error) Alert.alert('Error', error);
          else {
            Alert.alert('✅ Posted', `${recommendation} call for ${stockSymbol.toUpperCase()} posted.`);
            setStockSymbol(''); setEntryPrice(''); setTarget1(''); setStopLoss(''); setNotes('');
          }
        }},
      ]
    );
  }

  async function loadCalls() {
    setLoadingList(true);
    const { calls: data } = await getCalls({});
    setCalls(data);
    setLoadingList(false);
  }

  async function handleDelete(id, name) {
    Alert.alert('Delete', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteCall(id);
        setCalls(p => p.filter(c => c.id !== id));
      }},
    ]);
  }

  async function updateStatus(call) {
    // ✅ Support both field name versions for display
    const name = call.stockSymbol || call.stock || 'Unknown';
    Alert.alert(
      'Update Call Status',
      `Current: ${call.status}\n\nSelect new status for ${name}:`,
      STATUSES.map(st => ({
        text:  st,
        style: st === 'SL Hit' ? 'destructive' : st === call.status ? 'cancel' : 'default',
        onPress: async () => {
          await updateCall(call.id, { status: st });
          setCalls(p => p.map(c => c.id === call.id ? { ...c, status: st } : c));
        },
      }))
    );
  }

  React.useEffect(() => { loadCalls(); }, []);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
      <Card title="Post New Research Call">
        <AField label="Stock / Instrument *" value={stockSymbol} onChange={setStockSymbol}
          placeholder="e.g. RELIANCE, NIFTY 23500 CE" upper />
        <ARow label="Exchange">
          {['NSE','BSE','MCX'].map(ex => <Chip key={ex} label={ex} active={exchange===ex} onPress={() => setExchange(ex)} />)}
        </ARow>
        <ARow label="Segment *">
          {SEGMENTS.map(seg => <Chip key={seg} label={seg} active={segment===seg} onPress={() => setSegment(seg)} />)}
        </ARow>
        <ARow label="Timeframe *">
          {TIMEFRAMES.map(tf => <Chip key={tf} label={tf} active={timeframe===tf} onPress={() => setTimeframe(tf)} />)}
        </ARow>
        <ARow label="Tier">
          {TIERS.map(t => <Chip key={t} label={t} active={tier===t} onPress={() => setTier(t)} />)}
        </ARow>
        <ARow label="Recommendation">
          {ACTIONS.map(a => (
            <Chip key={a} label={a} active={recommendation===a}
              onPress={() => setRecommendation(a)}
              color={a==='Buy' ? '#15803d' : '#dc2626'} />
          ))}
        </ARow>
        <View style={s.threeCol}>
          <SField label="Entry ₹ *"     value={entryPrice} onChange={setEntryPrice} />
          <SField label="Target ₹ *"    value={target1}    onChange={setTarget1} />
          <SField label="Stop Loss ₹ *" value={stopLoss}   onChange={setStopLoss} />
        </View>
        <ARow label="Status">
          {STATUSES.map(st => <Chip key={st} label={st} active={status===st} onPress={() => setStatus(st)} />)}
        </ARow>
        <AField label="Research Notes (optional)" value={notes} onChange={setNotes}
          placeholder="Any notes for subscribers..." multi />
        <PostBtn label="📊 Post Call" onPress={handlePost} loading={saving} />
      </Card>

      <Card title="Manage Calls">
        <TouchableOpacity style={s.loadBtn} onPress={loadCalls}>
          <Text style={s.loadBtnTxt}>Refresh Call List</Text>
        </TouchableOpacity>
        {loadingList && <ActivityIndicator color={COLORS.navy} style={{ marginTop: 10 }} />}
        {calls.map(call => {
          // ✅ Support both old and new field names in display
          const name   = call.stockSymbol   || call.stock    || '—';
          const rec    = call.recommendation || call.action  || '—';
          const entry  = call.entryPrice    || call.buyPrice || '—';
          const tgt    = call.target1       || call.target   || '—';
          const tf     = call.timeframe     || call.callType || '—';
          return (
            <View key={call.id} style={s.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.listTitle}>{name} · {call.segment} · {tf}</Text>
                <Text style={s.listSub}>{rec} ₹{entry}  T:₹{tgt}  SL:₹{call.stopLoss}</Text>
                <TouchableOpacity onPress={() => updateStatus(call)}>
                  <Text style={[s.listStatus, { color: call.status==='Active'?'#15803d':COLORS.textMuted }]}>
                    {call.status} (tap to update)
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleDelete(call.id, name)} style={s.delBtn}>
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

// ── ARTICLES TAB ───────────────────────────────────────────────────────────
function ArticlesTab() {
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cat,      setCat]      = useState('Market News');
  const [saving,   setSaving]   = useState(false);
  const [articles, setArticles] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  async function handlePost() {
    if (!title.trim() || !body.trim()) { Alert.alert('Missing', 'Please enter title and content.'); return; }
    setSaving(true);
    const { error } = await addArticle({
      title: title.trim(), body: body.trim(),
      category: cat, imageUrl: imageUrl.trim() || null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else { Alert.alert('✅ Published', 'Article published.'); setTitle(''); setBody(''); setImageUrl(''); }
  }

  async function loadArticles() {
    setLoadingList(true);
    const { articles: data } = await getArticles(null);
    setArticles(data);
    setLoadingList(false);
  }

  async function handleDelete(id, titleStr) {
    Alert.alert('Delete', `Delete "${titleStr}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteArticle(id);
        setArticles(p => p.filter(a => a.id !== id));
      }},
    ]);
  }

  React.useEffect(() => { loadArticles(); }, []);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
      <Card title="Publish Article">
        <ARow label="Category">
          {CATS.map(c => <Chip key={c} label={c} active={cat===c} onPress={() => setCat(c)} small />)}
        </ARow>
        <AField label="Title *" value={title} onChange={setTitle} placeholder="Article headline..." caps />
        <AField label="Image URL (optional)" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
        <AField label="Content *" value={body} onChange={setBody} placeholder="Write your article here..." multi tall caps />
        <PostBtn label="📰 Publish Article" onPress={handlePost} loading={saving} />
      </Card>

      <Card title="Manage Articles">
        <TouchableOpacity style={s.loadBtn} onPress={loadArticles}>
          <Text style={s.loadBtnTxt}>Refresh Article List</Text>
        </TouchableOpacity>
        {loadingList && <ActivityIndicator color={COLORS.navy} style={{ marginTop: 10 }} />}
        {articles.map(art => (
          <View key={art.id} style={s.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.listTitle}>{art.title}</Text>
              <Text style={s.listSub}>{art.category}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(art.id, art.title)} style={s.delBtn}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

// ── USERS TAB ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendDate,   setExtendDate]   = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { users: data } = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  React.useEffect(() => { loadUsers(); }, []);

  const filtered   = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPaid  = users.filter(u => u.isActive && !u.isTrial).length;
  const totalTrial = users.filter(u => u.isTrial && u.isActive).length;

  async function handleToggle(user) {
    const newActive = !user.isActive;
    await adminUpdateUser(user.id, { isActive: newActive, isTrial: false });
    setUsers(p => p.map(u => u.id === user.id ? { ...u, isActive: newActive, isTrial: false } : u));
  }

  async function confirmExtend() {
    if (!extendDate.trim()) return;
    const [d, m, y] = extendDate.split('/').map(Number);
    if (!d || !m || !y || isNaN(new Date(y, m-1, d))) {
      Alert.alert('Invalid Date', 'Please enter a valid date as DD/MM/YYYY.'); return;
    }
    const expiry = new Date(y, m-1, d);
    const { error } = await adminUpdateUser(extendTarget.id, {
      planExpiry: expiry, isActive: true, isTrial: false,
    });
    if (error) { Alert.alert('Error', error); return; }
    Alert.alert('✅ Extended', `Plan extended to ${extendDate}`);
    setExtendTarget(null);
    loadUsers();
  }

  return (
    <>
      <Modal visible={!!extendTarget} transparent animationType="fade"
        onRequestClose={() => setExtendTarget(null)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior="height">
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Extend Plan</Text>
            <Text style={s.modalSub}>
              {extendTarget?.name}{' — '}Current: {fmtDate(extendTarget?.planExpiry)}
            </Text>
            <Text style={s.fLabel}>New Expiry (DD/MM/YYYY)</Text>
            <TextInput
              style={s.fInput}
              value={extendDate}
              onChangeText={setExtendDate}
              placeholder="31/12/2025"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numbers-and-punctuation"
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setExtendTarget(null)}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={confirmExtend}>
                <Text style={s.modalConfirmTxt}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <View style={s.statsRow}>
          <StatCard label="Total"    val={users.length}  color={COLORS.navy} />
          <StatCard label="Paid"     val={totalPaid}     color="#15803d" />
          <StatCard label="Trial"    val={totalTrial}    color="#d97706" />
          <StatCard label="Inactive" val={users.length - totalPaid - totalTrial} color="#dc2626" />
        </View>

        <TouchableOpacity style={s.loadBtn} onPress={loadUsers}>
          <Text style={s.loadBtnTxt}>{loading ? 'Loading...' : 'Load / Refresh Users'}</Text>
        </TouchableOpacity>

        {users.length > 0 && (
          <TextInput style={s.searchInput} value={searchTerm} onChangeText={setSearchTerm}
            placeholder="Search by name or email..." placeholderTextColor={COLORS.textMuted} />
        )}

        {loading && <ActivityIndicator color={COLORS.navy} />}

        {filtered.map(user => (
          <View key={user.id} style={s.userCard}>
            <View style={s.userTop}>
              <View style={s.userAvatar}>
                <Text style={s.userAvatarTxt}>{user.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName}>{user.name}</Text>
                <Text style={s.userEmail}>{user.email}</Text>
                <Text style={s.userPhone}>{user.phone}</Text>
              </View>
              <View style={[s.userStatusBadge, {
                backgroundColor: user.isActive ? (user.isTrial ? '#fef9c3' : '#dcfce7') : '#fee2e2'
              }]}>
                <Text style={[s.userStatusTxt, {
                  color: user.isActive ? (user.isTrial ? '#d97706' : '#15803d') : '#dc2626'
                }]}>
                  {user.isActive ? (user.isTrial ? 'Trial' : 'Active') : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={s.userMeta}>
              <Text style={s.userMetaTxt}>Plan: {user.plan || 'N/A'}</Text>
              <Text style={s.userMetaTxt}>Expiry: {fmtDate(user.planExpiry)}</Text>
              <Text style={s.userMetaTxt}>Role: {user.role || 'user'}</Text>
            </View>
            <View style={s.userActions}>
              <TouchableOpacity
                style={[s.userActionBtn, { backgroundColor: user.isActive ? '#fee2e2' : '#dcfce7' }]}
                onPress={() => handleToggle(user)}>
                <Text style={[s.userActionTxt, { color: user.isActive ? '#dc2626' : '#15803d' }]}>
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.userActionBtn, { backgroundColor: '#eff6ff' }]}
                onPress={() => { setExtendDate(''); setExtendTarget(user); }}>
                <Text style={[s.userActionTxt, { color: '#1d4ed8' }]}>Extend Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

// ── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [trialDays, setTrialDays] = useState('7');
  const [saving,    setSaving]    = useState(false);
  const { isGodAdmin } = useAuth();

  async function handleSave() {
    const days = parseInt(trialDays);
    if (isNaN(days) || days < 0) { Alert.alert('Invalid', 'Enter a valid number.'); return; }
    setSaving(true);
    const { error } = await updateConfig({ trialDays: days });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else Alert.alert('✅ Saved', `Free trial set to ${days} days.`);
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
      <Card title="Free Trial Settings">
        <Text style={s.settingNote}>
          Number of free trial days for new user registrations. Set to 0 to disable trials.
        </Text>
        <AField label="Trial Days" value={trialDays} onChange={setTrialDays}
          placeholder="7" keyboardType="number-pad" />
        <PostBtn label="Save Settings" onPress={handleSave} loading={saving} />
      </Card>

      {isGodAdmin && (
        <Card title="Role Reference">
          <Text style={s.settingNote}>
            👑 god_admin — Full access. Manage researchers, roles, all data.{'\n\n'}
            🛡 admin — Manage calls, articles, users. Cannot manage researchers.{'\n\n'}
            🔬 researcher — Post calls only. No user/admin access.{'\n\n'}
            👤 user — Regular subscriber. No admin access.
          </Text>
        </Card>
      )}

      <Card title="Firestore Instructions">
        <Text style={s.settingNote}>
          To manually update a user's subscription:{'\n\n'}
          1. Firebase Console → Firestore → users collection{'\n'}
          2. Find user by UID{'\n'}
          3. Update fields:{'\n'}
          • isActive: true{'\n'}
          • isTrial: false{'\n'}
          • plan: "Premium Index"{'\n'}
          • segment: "Index"{'\n'}
          • planExpiry: (timestamp){'\n\n'}
          To deactivate: set isActive: false
        </Text>
      </Card>
    </ScrollView>
  );
}

// ── REUSABLES ──────────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function AField({ label, value, onChange, placeholder, multi, tall, keyboardType, upper, caps }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.fLabel}>{label}</Text>
      <TextInput
        style={[s.fInput, multi && s.fInputMulti, tall && s.fInputTall]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted} multiline={multi}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={upper ? 'characters' : caps ? 'sentences' : 'none'}
        autoCorrect={false} textAlignVertical={multi ? 'top' : 'center'}
      />
    </View>
  );
}

function SField({ label, value, onChange }) {
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      <Text style={s.fLabel}>{label}</Text>
      <TextInput style={s.fInputSmall} value={value} onChangeText={onChange}
        placeholder="0" placeholderTextColor={COLORS.textMuted}
        keyboardType="decimal-pad" textAlign="center" />
    </View>
  );
}

function ARow({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.fLabel}>{label}</Text>
      <View style={s.chipRow}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress, small, color }) {
  const bg = active ? (color || COLORS.navy) : COLORS.offWhite;
  const bc = active ? (color || COLORS.navy) : COLORS.border;
  const tc = active ? '#fff' : COLORS.textMid;
  return (
    <TouchableOpacity style={[s.chip, { backgroundColor: bg, borderColor: bc }, small && s.chipSm]}
      onPress={onPress}>
      <Text style={[s.chipTxt, { color: tc }, small && { fontSize: 10 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ label, val, color }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Text style={[s.statVal, { color }]}>{val}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function PostBtn({ label, onPress, loading }) {
  return (
    <TouchableOpacity style={s.postBtn} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.postBtnTxt}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  header:         { paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20 },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle:    { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  logoutBtn:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabRow:         { marginHorizontal: -4 },
  tabBtn:         { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.12)', minHeight: 36 },
  tabOn:          { backgroundColor: '#fff' },
  tabTxt:         { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  tabTxtOn:       { color: '#4c1d95' },
  scroll:         { flex: 1 },
  scrollContent:  { padding: 16, paddingBottom: 100, gap: 14 },
  card:           { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 18, gap: 2, ...SHADOW.sm },
  cardTitle:      { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  fLabel:         { fontSize: 10, fontWeight: '700', color: COLORS.textMid, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  fInput:         { backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: COLORS.text, minHeight: 48 },
  fInputMulti:    { minHeight: 80, textAlignVertical: 'top' },
  fInputTall:     { minHeight: 140 },
  fInputSmall:    { backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 12, fontSize: 14, color: COLORS.text, minHeight: 48 },
  threeCol:       { flexDirection: 'row', gap: 8 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, minHeight: 36 },
  chipSm:         { paddingHorizontal: 10, paddingVertical: 6 },
  chipTxt:        { fontSize: 12, fontWeight: '700' },
  postBtn:        { backgroundColor: COLORS.navy, borderRadius: RADIUS.md, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  postBtnTxt:     { color: '#fff', fontSize: 15, fontWeight: '800' },
  loadBtn:        { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  loadBtnTxt:     { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  searchInput:    { backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text, minHeight: 46 },
  listRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: 12, gap: 8, marginTop: 8 },
  listTitle:      { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  listSub:        { fontSize: 11, color: COLORS.textMuted },
  listStatus:     { fontSize: 11, fontWeight: '700', marginTop: 2 },
  delBtn:         { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  statsRow:       { flexDirection: 'row', gap: 10 },
  statCard:       { flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 12, alignItems: 'center', borderTopWidth: 3, ...SHADOW.sm },
  statVal:        { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel:      { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  userCard:       { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, gap: 10, marginTop: 8, ...SHADOW.sm },
  userTop:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  userAvatarTxt:  { fontSize: 16, fontWeight: '900', color: '#fff' },
  userName:       { fontSize: 13, fontWeight: '800', color: COLORS.text },
  userEmail:      { fontSize: 11, color: COLORS.textMuted },
  userPhone:      { fontSize: 11, color: COLORS.textMuted },
  userStatusBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  userStatusTxt:  { fontSize: 11, fontWeight: '800' },
  userMeta:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: 10 },
  userMetaTxt:    { fontSize: 11, color: COLORS.textMid, fontWeight: '600' },
  userActions:    { flexDirection: 'row', gap: 8 },
  userActionBtn:  { flex: 1, borderRadius: RADIUS.md, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  userActionTxt:  { fontSize: 12, fontWeight: '800' },
  settingNote:    { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox:       { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, gap: 12 },
  modalTitle:     { fontSize: 16, fontWeight: '800', color: COLORS.text },
  modalSub:       { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  modalActions:   { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalCancel:    { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  modalCancelTxt: { fontSize: 14, fontWeight: '700', color: COLORS.textMid },
  modalConfirm:   { flex: 1, backgroundColor: COLORS.navy, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  modalConfirmTxt:{ fontSize: 14, fontWeight: '800', color: '#fff' },
});
