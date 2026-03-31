// screens/ResearcherManagementScreen.js
// Visible to: god_admin ONLY
// Features: create researcher accounts, view all researchers,
//           toggle active/suspend, edit profile, soft-delete

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Alert, Modal,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../components/theme';
import {
  listenResearchers,
  createResearcher,
  updateResearcher,
  toggleResearcherActive,
  approveResearcher,
  deleteResearcher,
} from '../firebase';
import { useAuth } from '../components/AuthContext';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const SPECIALITIES = ['Equity', 'F&O', 'Index', 'MCX', 'All Segments'];

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '',
  speciality: 'Equity', bio: '',
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────

export default function ResearcherManagementScreen() {
  const { user: myUser, profile: myProfile } = useAuth();

  const [researchers, setResearchers] = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [creating,   setCreating]   = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);
  const [formError,  setFormError]  = useState('');

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    const unsub = listenResearchers(
      (data) => { setResearchers(data); setLoading(false); },
      ()     => setLoading(false),
    );
    return () => unsub();
  }, []);

  // ── Create researcher ──────────────────────────────────────────────────────
  async function handleCreate() {
    setFormError('');
    if (!form.name.trim())  { setFormError('Name is required'); return; }
    if (!form.email.trim()) { setFormError('Email is required'); return; }
    if (form.password.length < 6) { setFormError('Password min 6 characters'); return; }

    setCreating(true);
    const { error } = await createResearcher(
      form.email,
      form.password,
      {
        name:       form.name.trim(),
        phone:      form.phone.trim(),
        speciality: form.speciality,
        bio:        form.bio.trim(),
        createdBy:  myUser?.uid || '',
      }
    );
    setCreating(false);

    if (error) { setFormError(error); return; }
    setShowCreate(false);
    setForm(EMPTY_FORM);
    Alert.alert('✅ Created', `Researcher ${form.name} created successfully!\nLogin: ${form.email}`);
  }

  // ── Open edit modal ────────────────────────────────────────────────────────
  function openEdit(r) {
    setEditTarget(r);
    setEditForm({
      name:       r.name       || '',
      phone:      r.phone      || '',
      speciality: r.speciality || 'Equity',
      bio:        r.bio        || '',
    });
  }

  // ── Save edit ──────────────────────────────────────────────────────────────
  async function handleSaveEdit() {
    setSaving(true);
    const { error } = await updateResearcher(editTarget.id, editForm);
    setSaving(false);
    if (error) { Alert.alert('Error', error); return; }
    setEditTarget(null);
    Alert.alert('✅ Saved', 'Researcher profile updated');
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  function handleToggle(r) {
    const action = r.isActive ? 'Suspend' : 'Reactivate';
    Alert.alert(
      `${action} Researcher`,
      `${action} ${r.name}? They will ${r.isActive ? 'no longer' : 'again'} be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: r.isActive ? 'destructive' : 'default',
          onPress: async () => {
            const { error } = await toggleResearcherActive(r.id, !r.isActive);
            if (error) Alert.alert('Error', error);
          },
        },
      ]
    );
  }

  // ── Delete researcher ──────────────────────────────────────────────────────
  function handleDelete(r) {
    Alert.alert(
      '⚠️ Delete Researcher',
      `Remove ${r.name} permanently? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteResearcher(r.id);
            if (error) Alert.alert('Error', error);
            else Alert.alert('Deleted', `${r.name} has been removed.`);
          },
        },
      ]
    );
  }

  const active    = researchers.filter(r => r.isActive).length;
  const suspended = researchers.filter(r => !r.isActive).length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#1e1b4b', '#312e81']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Researcher Management</Text>
            <Text style={s.headerSub}>God Admin only · {researchers.length} total</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={s.addBtnTxt}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={s.summaryRow}>
          <SummaryChip label="Active"    value={active}    color="#4ade80" />
          <SummaryChip label="Suspended" value={suspended} color="#f87171" />
          <SummaryChip label="Total"     value={researchers.length} color="#a78bfa" />
        </View>
      </LinearGradient>

      {/* ── LIST ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#312e81" />
          <Text style={s.loadingTxt}>Loading researchers...</Text>
        </View>
      ) : (
        <FlatList
          data={researchers}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <ResearcherCard
              r={item}
              onEdit={() => openEdit(item)}
              onToggle={() => handleToggle(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Ionicons name="people-circle-outline" size={56} color={COLORS.textMuted} />
              <Text style={s.emptyTitle}>No researchers yet</Text>
              <Text style={s.emptySub}>Tap "Add" to create a researcher login</Text>
              <TouchableOpacity style={s.emptyAddBtn} onPress={() => setShowCreate(true)}>
                <Text style={s.emptyAddTxt}>+ Create First Researcher</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── CREATE MODAL ───────────────────────────────────────────────────── */}
      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>Create Researcher</Text>
                  <TouchableOpacity onPress={() => { setShowCreate(false); setFormError(''); }}>
                    <Ionicons name="close" size={24} color={COLORS.textMid} />
                  </TouchableOpacity>
                </View>

                {!!formError && (
                  <View style={s.errorBox}>
                    <Ionicons name="alert-circle" size={14} color="#dc2626" />
                    <Text style={s.errorTxt}>{formError}</Text>
                  </View>
                )}

                <FormField label="Full Name *" placeholder="e.g. Rahul Sharma"
                  value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />

                <FormField label="Email *" placeholder="researcher@dmresearch.in"
                  value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))}
                  keyboardType="email-address" autoCapitalize="none" />

                <View>
                  <Text style={s.fieldLabel}>Password *</Text>
                  <View style={s.pwdWrap}>
                    <TextInput
                      style={[s.input, { flex: 1, borderWidth: 0 }]}
                      placeholder="Min 6 characters"
                      placeholderTextColor={COLORS.textMuted}
                      value={form.password}
                      onChangeText={v => setForm(f => ({ ...f, password: v }))}
                      secureTextEntry={!showPwd}
                    />
                    <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={{ padding: 4 }}>
                      <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <FormField label="Phone" placeholder="+91 98765 43210"
                  value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                  keyboardType="phone-pad" />

                <Text style={s.fieldLabel}>Speciality</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {SPECIALITIES.map(sp => (
                    <TouchableOpacity
                      key={sp}
                      style={[s.specChip, form.speciality === sp && s.specChipOn]}
                      onPress={() => setForm(f => ({ ...f, speciality: sp }))}>
                      <Text style={[s.specChipTxt, form.speciality === sp && s.specChipTxtOn]}>
                        {sp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FormField label="Bio / Note" placeholder="Short description of this researcher..."
                  value={form.bio} onChangeText={v => setForm(f => ({ ...f, bio: v }))}
                  multiline numberOfLines={3} />

                <TouchableOpacity
                  style={[s.createBtn, creating && { opacity: 0.6 }]}
                  onPress={handleCreate}
                  disabled={creating}>
                  {creating
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Ionicons name="person-add" size={18} color="#fff" />
                        <Text style={s.createBtnTxt}>Create Researcher Account</Text>
                      </>
                  }
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── EDIT MODAL ─────────────────────────────────────────────────────── */}
      <Modal visible={!!editTarget} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>Edit Researcher</Text>
                  <TouchableOpacity onPress={() => setEditTarget(null)}>
                    <Ionicons name="close" size={24} color={COLORS.textMid} />
                  </TouchableOpacity>
                </View>

                <FormField label="Full Name" placeholder="Full Name"
                  value={editForm.name}
                  onChangeText={v => setEditForm(f => ({ ...f, name: v }))} />

                <FormField label="Phone" placeholder="Phone"
                  value={editForm.phone}
                  onChangeText={v => setEditForm(f => ({ ...f, phone: v }))}
                  keyboardType="phone-pad" />

                <Text style={s.fieldLabel}>Speciality</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {SPECIALITIES.map(sp => (
                    <TouchableOpacity
                      key={sp}
                      style={[s.specChip, editForm.speciality === sp && s.specChipOn]}
                      onPress={() => setEditForm(f => ({ ...f, speciality: sp }))}>
                      <Text style={[s.specChipTxt, editForm.speciality === sp && s.specChipTxtOn]}>
                        {sp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FormField label="Bio" placeholder="Bio"
                  value={editForm.bio}
                  onChangeText={v => setEditForm(f => ({ ...f, bio: v }))}
                  multiline numberOfLines={3} />

                <TouchableOpacity
                  style={[s.createBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSaveEdit}
                  disabled={saving}>
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.createBtnTxt}>Save Changes</Text>
                  }
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── RESEARCHER CARD ───────────────────────────────────────────────────────────

function ResearcherCard({ r, onEdit, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={s.card}>
      {/* Top row */}
      <View style={s.cardRow}>
        <View style={[s.avatar, { backgroundColor: r.isActive ? '#312e81' : '#94a3b8' }]}>
          <Text style={s.avatarTxt}>{(r.name || 'R')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.rName}>{r.name || '—'}</Text>
            <View style={[s.statusDot, { backgroundColor: r.isActive ? '#4ade80' : '#f87171' }]} />
          </View>
          <Text style={s.rEmail}>{r.email}</Text>
          <View style={s.specTag}>
            <Text style={s.specTagTxt}>{r.speciality || 'General'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={s.expandBtn}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={s.expandedSection}>
          {r.phone ? (
            <View style={s.detailRow}>
              <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
              <Text style={s.detailTxt}>{r.phone}</Text>
            </View>
          ) : null}
          {r.bio ? (
            <View style={s.detailRow}>
              <Ionicons name="document-text-outline" size={13} color={COLORS.textMuted} />
              <Text style={s.detailTxt}>{r.bio}</Text>
            </View>
          ) : null}
          <View style={s.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
            <Text style={s.detailTxt}>
              Created {r.createdAt?.toDate
                ? r.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity style={[s.actBtn, { backgroundColor: '#ede9fe' }]} onPress={onEdit}>
              <Ionicons name="create-outline" size={14} color="#7c3aed" />
              <Text style={[s.actBtnTxt, { color: '#7c3aed' }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actBtn, { backgroundColor: r.isActive ? '#fff7ed' : '#f0fdf4' }]}
              onPress={onToggle}>
              <Ionicons
                name={r.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                size={14}
                color={r.isActive ? '#d97706' : '#16a34a'}
              />
              <Text style={[s.actBtnTxt, { color: r.isActive ? '#d97706' : '#16a34a' }]}>
                {r.isActive ? 'Suspend' : 'Reactivate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.actBtn, { backgroundColor: '#fee2e2' }]} onPress={onDelete}>
              <Ionicons name="trash-outline" size={14} color="#dc2626" />
              <Text style={[s.actBtnTxt, { color: '#dc2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── FORM FIELD ────────────────────────────────────────────────────────────────

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

function SummaryChip({ label, value, color }) {
  return (
    <View style={[s.sumChip, { borderColor: color + '60' }]}>
      <Text style={[s.sumValue, { color }]}>{value}</Text>
      <Text style={s.sumLabel}>{label}</Text>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header:       { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addBtnTxt:    { fontSize: 14, fontWeight: '800', color: '#fff' },
  summaryRow:   { flexDirection: 'row', gap: 10 },
  sumChip:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  sumValue:     { fontSize: 22, fontWeight: '900' },
  sumLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  // Loading / Empty
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:   { color: COLORS.textMuted, fontSize: 14 },
  emptyWrap:    { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', color: COLORS.textMid },
  emptySub:     { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  emptyAddBtn:  { backgroundColor: '#312e81', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  emptyAddTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Researcher card
  card:         { backgroundColor: '#fff', borderRadius: RADIUS.xl, marginHorizontal: 16, marginBottom: 12, padding: 16, ...SHADOW.sm },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:       { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 20, fontWeight: '900', color: '#fff' },
  rName:        { fontSize: 16, fontWeight: '800', color: COLORS.text },
  rEmail:       { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  specTag:      { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#ede9fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  specTagTxt:   { fontSize: 10, fontWeight: '800', color: '#7c3aed' },
  expandBtn:    { padding: 4 },

  // Expanded
  expandedSection:{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  detailRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailTxt:    { flex: 1, fontSize: 13, color: COLORS.textMid, lineHeight: 18 },
  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  actBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: RADIUS.md },
  actBtnTxt:    { fontSize: 12, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 20, fontWeight: '900', color: COLORS.text },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fee2e2', borderRadius: RADIUS.md, padding: 12, marginBottom: 16 },
  errorTxt:     { flex: 1, fontSize: 13, color: '#dc2626', fontWeight: '600' },
  fieldLabel:   { fontSize: 12, fontWeight: '700', color: COLORS.textMid, marginBottom: 8 },
  input:        { backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  pwdWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.offWhite, borderRadius: RADIUS.md, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  specChip:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  specChipOn:   { backgroundColor: '#312e81', borderColor: '#312e81' },
  specChipTxt:  { fontSize: 13, fontWeight: '700', color: COLORS.textMid },
  specChipTxtOn:{ color: '#fff' },
  createBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#312e81', paddingVertical: 16, borderRadius: RADIUS.lg, marginTop: 8 },
  createBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
