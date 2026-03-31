// screens/ArticlesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Pressable,
  StatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../components/theme';
import { listenArticles } from '../firebase';

const CATS = [
  'All', 'Market News', 'Economy', 'Investing Tips',
  'Commodities', 'Company Update', 'Technical Analysis', 'Weekly Report',
];

const CAT_COLORS = {
  'Market News':        '#0891b2',
  'Economy':            '#7c3aed',
  'Investing Tips':     '#059669',
  'Commodities':        '#d97706',
  'Company Update':     '#db2777',
  'Technical Analysis': '#0284c7',
  'Weekly Report':      '#dc2626',
};

// Gradient accent per category (shown when no image)
const CAT_GRADIENTS = {
  'Market News':        ['#0891b2', '#0c4a6e'],
  'Economy':            ['#7c3aed', '#4c1d95'],
  'Investing Tips':     ['#059669', '#064e3b'],
  'Commodities':        ['#d97706', '#78350f'],
  'Company Update':     ['#db2777', '#831843'],
  'Technical Analysis': ['#0284c7', '#1e3a5f'],
  'Weekly Report':      ['#dc2626', '#7f1d1d'],
};

function catColor(c) {
  return CAT_COLORS[c] || COLORS.navy;
}

function catGrad(c) {
  return CAT_GRADIENTS[c] || [COLORS.navy, COLORS.navyDark];
}

export default function ArticlesScreen() {
  const [articles, setArticles]     = useState([]);
  const [cat, setCat]               = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen]             = useState(null);

  // Real-time listener — updates instantly when admin publishes/deletes articles
  useEffect(() => {
    setLoading(true);
    const unsub = listenArticles(
      cat === 'All' ? null : cat,
      (data) => { setArticles(data); setLoading(false); setRefreshing(false); },
      ()     => { setLoading(false); setRefreshing(false); },
    );
    return () => unsub();
  }, [cat]);

  return (
    <View style={sa.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />

      <LinearGradient colors={[COLORS.navyDark, COLORS.navy]} style={sa.header}>
        <Text style={sa.headerTitle} accessibilityRole="header">Market Insights</Text>
        <Text style={sa.headerSub}>Research, analysis & financial education</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={sa.catScroll}
          accessibilityRole="tablist"
        >
          {CATS.map(c => (
            <TouchableOpacity
              key={c}
              style={[sa.catBtn, cat === c && sa.catOn]}
              onPress={() => setCat(c)}
              accessibilityRole="tab"
              accessibilityState={{ selected: cat === c }}
              accessibilityLabel={c}
            >
              <Text style={[sa.catTxt, cat === c && sa.catTxtOn]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {loading ? (
        <View style={sa.center} accessibilityLabel="Loading articles">
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : articles.length === 0 ? (
        <View style={sa.center}>
          <Ionicons name="newspaper-outline" size={48} color="#cbd5e1" accessibilityElementsHidden />
          <Text style={sa.emptyTitle}>No articles yet</Text>
          <Text style={sa.emptySub}>Check back soon for market insights</Text>
        </View>
      ) : (
        <FlatList
          data={articles.slice(1)}
          keyExtractor={item => item.id}
          style={sa.scroll}
          contentContainerStyle={sa.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }}
              tintColor={COLORS.navy}
            />
          }
          ListHeaderComponent={
            articles.length > 0
              ? () => <FeaturedCard article={articles[0]} onPress={() => setOpen(articles[0])} />
              : null
          }
          renderItem={({ item: art }) => (
            <ArticleCard article={art} onPress={() => setOpen(art)} />
          )}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
        />
      )}

      {/* Full article modal */}
      <Modal
        visible={!!open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(null)}
        accessibilityViewIsModal
      >
        {open && <ArticleModal article={open} onClose={() => setOpen(null)} />}
      </Modal>
    </View>
  );
}

// ── FEATURED CARD (first article — large with image banner) ──────────────
function FeaturedCard({ article, onPress }) {
  const color = catColor(article.category);
  const grad  = catGrad(article.category);
  const date  = article.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || '';
  const preview = (article.body || '').substring(0, 100) + '...';

  return (
    <TouchableOpacity
      style={sa.featuredCard}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Featured: ${article.title}. ${article.category}. Tap to read.`}
    >
      {/* Image or gradient banner */}
      {article.imageUrl ? (
        <Image
          source={{ uri: article.imageUrl }}
          style={sa.featuredImg}
          accessibilityElementsHidden
        />
      ) : (
        <LinearGradient colors={grad} style={sa.featuredImg}>
          <Ionicons name="newspaper" size={48} color="rgba(255,255,255,0.2)" accessibilityElementsHidden />
        </LinearGradient>
      )}

      {/* Overlay gradient for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={sa.featuredOverlay}
      />

      {/* Category + date on image */}
      <View style={sa.featuredTop}>
        <View style={[sa.catTagImg, { backgroundColor: color }]}>
          <Text style={sa.catTagImgTxt}>{article.category}</Text>
        </View>
        <Text style={sa.featuredDate}>{date}</Text>
      </View>

      {/* Title on bottom of image */}
      <View style={sa.featuredBottom}>
        <Text style={sa.featuredTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={sa.featuredPreview} numberOfLines={2}>{preview}</Text>
        <View style={sa.readMoreRow}>
          <Text style={sa.readMoreTxt}>Read article</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" accessibilityElementsHidden />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── STANDARD ARTICLE CARD ──────────────────────────────────────────────────
function ArticleCard({ article, onPress }) {
  const color = catColor(article.category);
  const grad  = catGrad(article.category);
  const date  = article.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || '';
  const preview = (article.body || '').substring(0, 120) + ((article.body || '').length > 120 ? '...' : '');

  return (
    <TouchableOpacity
      style={sa.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${article.title}. ${article.category}. Tap to read.`}
    >
      {/* Thumbnail (small) */}
      <View style={sa.thumb}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={sa.thumbImg} accessibilityElementsHidden />
        ) : (
          <LinearGradient colors={grad} style={sa.thumbImg}>
            <Ionicons name="newspaper-outline" size={22} color="rgba(255,255,255,0.5)" accessibilityElementsHidden />
          </LinearGradient>
        )}
      </View>

      {/* Text content */}
      <View style={sa.cardBody}>
        <View style={sa.cardMeta}>
          <View style={[sa.catTag, { backgroundColor: color + '18' }]}>
            <Text style={[sa.catTagTxt, { color }]}>{article.category}</Text>
          </View>
          <Text style={sa.cardDate}>{date}</Text>
        </View>
        <Text style={sa.cardTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={sa.cardPreview} numberOfLines={2}>{preview}</Text>
        <View style={sa.readMoreRow2}>
          <Text style={[sa.readMoreTxt2, { color }]}>Read more</Text>
          <Ionicons name="arrow-forward" size={12} color={color} accessibilityElementsHidden />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── ARTICLE FULL MODAL ───────────────────────────────────────────────────────
function ArticleModal({ article, onClose }) {
  const color = catColor(article.category);
  const grad  = catGrad(article.category);
  const date  = article.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) || '';

  return (
    <View style={sa.modal}>
      {/* Image or gradient header */}
      {article.imageUrl ? (
        <Image source={{ uri: article.imageUrl }} style={sa.modalHeroImg} accessibilityElementsHidden />
      ) : (
        <LinearGradient colors={grad} style={sa.modalHeroGrad}>
          <View style={[sa.catTagImg, { backgroundColor: color, alignSelf: 'flex-start' }]}>
            <Text style={sa.catTagImgTxt}>{article.category}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Close button over image */}
      <Pressable
        style={sa.modalCloseBtn}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close article"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={20} color="#fff" />
      </Pressable>

      <ScrollView style={sa.modalScroll} showsVerticalScrollIndicator={false}>
        <View style={sa.modalContent}>
          {article.imageUrl && (
            <View style={[sa.catTag, { backgroundColor: color + '18', alignSelf: 'flex-start', marginBottom: 10 }]}>
              <Text style={[sa.catTagTxt, { color }]}>{article.category}</Text>
            </View>
          )}
          <Text style={sa.modalDate}>{date}</Text>
          <Text style={sa.modalTitle} accessibilityRole="header">{article.title}</Text>
          <View style={sa.modalDivider} />
          <Text style={sa.modalBody}>{article.body}</Text>
          <View style={sa.modalDisclaimer}>
            <Text style={sa.modalDisclaimerTxt}>
              For educational purposes only. Not personalised investment advice.
              SEBI Reg. INH000024408
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const sa = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.bg },
  header:             { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerTitle:        { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 3 },
  headerSub:          { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 },
  catScroll:          { marginHorizontal: -4 },
  catBtn:             { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.1)', minHeight: 36 },
  catOn:              { backgroundColor: '#fff' },
  catTxt:             { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  catTxtOn:           { color: COLORS.navy },
  scroll:             { flex: 1 },
  scrollContent:      { padding: 16, paddingBottom: 100, gap: 12 },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle:         { fontSize: 16, fontWeight: '700', color: COLORS.textMid, marginTop: 8 },
  emptySub:           { fontSize: 13, color: COLORS.textMuted },
  // Featured card
  featuredCard:       { borderRadius: RADIUS.xl, overflow: 'hidden', height: 240, ...SHADOW.md, justifyContent: 'flex-end' },
  featuredImg:        { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  featuredOverlay:    { ...StyleSheet.absoluteFillObject },
  featuredTop:        { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredDate:       { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  featuredBottom:     { padding: 16, gap: 6 },
  featuredTitle:      { fontSize: 17, fontWeight: '900', color: '#fff', lineHeight: 24 },
  featuredPreview:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 },
  readMoreRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  readMoreTxt:        { fontSize: 12, fontWeight: '700', color: '#fff' },
  catTagImg:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catTagImgTxt:       { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: '#fff', letterSpacing: 0.3 },
  // Standard card
  card:               { backgroundColor: '#fff', borderRadius: RADIUS.xl, flexDirection: 'row', overflow: 'hidden', ...SHADOW.sm },
  thumb:              { width: 100, flexShrink: 0 },
  thumbImg:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardBody:           { flex: 1, padding: 14, gap: 4 },
  cardMeta:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catTag:             { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catTagTxt:          { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardDate:           { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  cardTitle:          { fontSize: 13, fontWeight: '800', color: COLORS.text, lineHeight: 18 },
  cardPreview:        { fontSize: 11, color: COLORS.textLight, lineHeight: 16 },
  readMoreRow2:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  readMoreTxt2:       { fontSize: 11, fontWeight: '700' },
  // Modal
  modal:              { flex: 1, backgroundColor: '#fff' },
  modalHeroImg:       { width: '100%', height: 220 },
  modalHeroGrad:      { height: 160, padding: 20, justifyContent: 'flex-end' },
  modalCloseBtn:      { position: 'absolute', top: 48, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalScroll:        { flex: 1 },
  modalContent:       { padding: 20, paddingBottom: 40 },
  modalDate:          { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 },
  modalTitle:         { fontSize: 22, fontWeight: '900', color: COLORS.text, lineHeight: 30, marginBottom: 16 },
  modalDivider:       { height: 1, backgroundColor: COLORS.border, marginBottom: 20 },
  modalBody:          { fontSize: 15, color: COLORS.textMid, lineHeight: 26, marginBottom: 28 },
  modalDisclaimer:    { backgroundColor: COLORS.amberLight, borderWidth: 1, borderColor: '#fde68a', borderRadius: RADIUS.md, padding: 12 },
  modalDisclaimerTxt: { fontSize: 11, color: '#713f12', lineHeight: 17 },
});
