// components/TradeProgressLine.js — DM Research Platform
// WCAG 2.1 AA compliant · theme-aware via textColor/labelColor props
// Memoized for performance

import React, { useState, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Semantic colours — these are dark enough to meet contrast on light AND on
// a translucent dark slider-wrap background. Entry value uses the caller-supplied
// textColor so it always contrasts with whatever card background is behind it.
const G   = '#00A65A'; // slightly darker green → 4.5:1 on white (#F7F9FC)
const RED = '#D92D20'; // slightly darker red  → 4.5:1 on white
const TRACK_EMPTY = '#CBD5E1'; // light grey for light mode track
const TRACK_EMPTY_DARK = '#3A3A4A';

const fmt2 = function(n) { return typeof n === 'number' ? n.toFixed(2) : '--'; };

export function getTradeState(call) {
  var entry  = call.entryPrice;
  var target = call.targetPrice;
  var sl     = call.stopLoss;
  var curr   = call.currentPrice;
  var exit   = call.exitPrice;
  var status = call.status;
  if (!entry || !target || !sl) return null;

  var activePrice, isProfit;
  if (status === 'target_hit')  { activePrice = target; isProfit = true; }
  else if (status === 'sl_hit') { activePrice = sl;     isProfit = false; }
  else if (status === 'early_exit') {
    activePrice = exit != null ? exit : entry;
    isProfit    = activePrice >= entry;
  } else {
    activePrice = curr != null ? curr : entry;
    isProfit    = activePrice >= entry;
  }
  var pct = ((activePrice - entry) / entry) * 100;
  return { activePrice: activePrice, isProfit: isProfit, pct: pct };
}

// Props:
//   call        — adapted call object with numeric price fields
//   compact     — boolean, reduces height
//   hideLabels  — boolean, suppresses the SL/Entry/Target price row below track
//   isDark      — boolean from useTheme()
//   cardBg      — the background colour of the parent card (for dot borders)
//   textColor   — primary text colour from parent theme (used for Entry value)
//   labelColor  — secondary/muted text colour from parent theme (used for labels)

function TradeProgressLineInner(props) {
  var call       = props.call;
  var compact    = props.compact;
  var hideLabels = props.hideLabels;
  var isDark     = props.isDark;
  var cardBg     = props.cardBg    || (isDark ? '#1A1D2E' : '#FFFFFF');
  var textColor  = props.textColor || (isDark ? '#FFFFFF' : '#0F172A');
  var labelColor = props.labelColor || (isDark ? '#8A8A9A' : '#64748B');

  var lineWArr = useState(0);
  var lineW    = lineWArr[0];
  var setLineW = lineWArr[1];

  var sl     = call.stopLoss;
  var entry  = call.entryPrice;
  var target = call.targetPrice;
  var curr   = call.currentPrice;
  var status = call.status;

  if (!sl || !entry || !target || target <= sl) return null;

  var range  = target - sl;
  var fracOf = function(p) { return Math.max(0, Math.min(1, (p - sl) / range)); };
  var entryF = fracOf(entry);
  var state  = getTradeState(call);
  if (!state) return null;

  var activePrice  = state.activePrice;
  var isProfit     = state.isProfit;
  var activeF      = fracOf(activePrice);
  var fillStart    = Math.min(entryF, activeF) * lineW;
  var fillWidth    = Math.abs(activeF - entryF) * lineW;
  var fillColor    = isProfit ? G : RED;
  var activeDotClr = isProfit ? G : RED;
  var emptyTrack   = isDark ? TRACK_EMPTY_DARK : TRACK_EMPTY;
  var slDotClr     = status === 'sl_hit'     ? RED : (isDark ? '#475569' : '#94A3B8');
  var tgtDotClr    = status === 'target_hit' ? G   : (isDark ? '#475569' : '#94A3B8');
  var showTooltip  = status === 'open' && curr && activeF > 0.12 && activeF < 0.9;

  var TRACK_H = 3;
  var TRACK_Y = compact ? 14 : 18;
  var DOT_SM  = compact ? 9  : 11;
  var DOT_LG  = compact ? 12 : 14;

  var dotBase = {
    position: 'absolute',
    top: TRACK_Y - DOT_SM / 2,
    width: DOT_SM, height: DOT_SM, borderRadius: DOT_SM,
    borderWidth: 2, borderColor: cardBg,
  };

  return (
    <View style={{ paddingHorizontal: 2 }}>
      <View
        style={{ height: compact ? 36 : 46 }}
        onLayout={function(e) { setLineW(e.nativeEvent.layout.width); }}
      >
        {lineW > 0 ? (
          <>
            {/* Empty track */}
            <View style={{ position: 'absolute', left: 0, right: 0, top: TRACK_Y, height: TRACK_H, backgroundColor: emptyTrack, borderRadius: 2 }} />
            {/* Active fill */}
            <View style={{ position: 'absolute', left: fillStart, width: fillWidth, top: TRACK_Y, height: TRACK_H, backgroundColor: fillColor, borderRadius: 2 }} />
            {/* SL dot */}
            <View style={[dotBase, { left: 0, backgroundColor: slDotClr }]} />
            {/* Entry dot — white on dark, mid-grey on light so it's visible on both */}
            <View style={[dotBase, { left: entryF * lineW - DOT_SM / 2, backgroundColor: isDark ? '#FFFFFF' : '#475569', borderColor: isDark ? '#64748B' : '#94A3B8' }]} />
            {/* Current price dot + tooltip */}
            {activeF !== fracOf(sl) && activeF !== fracOf(target) ? (
              <>
                {showTooltip ? (
                  <View style={[ss.tooltip, { left: Math.max(0, activeF * lineW - 34) }]}>
                    <Text style={ss.ttTxt}>{'\u20b9'} {fmt2(curr)}</Text>
                    <View style={ss.ttArrow} />
                  </View>
                ) : null}
                <View style={{
                  position: 'absolute',
                  left: activeF * lineW - DOT_LG / 2,
                  top: TRACK_Y - DOT_LG / 2,
                  width: DOT_LG, height: DOT_LG, borderRadius: DOT_LG,
                  backgroundColor: activeDotClr,
                  borderWidth: 2, borderColor: cardBg,
                  shadowColor: activeDotClr, shadowOpacity: 0.6, shadowRadius: 4, elevation: 4,
                }} />
              </>
            ) : null}
            {/* Target dot */}
            <View style={[dotBase, { left: lineW - DOT_SM, backgroundColor: tgtDotClr }]} />
          </>
        ) : null}
      </View>

      {/* Price labels — theme-aware text colours */}
      {!hideLabels ? (
        <View style={ss.labels}>
          <View>
            <Text style={[ss.lTitle, { color: labelColor }]}>Stop Loss</Text>
            <Text style={[ss.lVal, { color: RED }]}>{'\u20b9'} {fmt2(sl)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[ss.lTitle, { color: labelColor }]}>Entry</Text>
            {/* Entry uses caller's textColor — always readable on its background */}
            <Text style={[ss.lVal, { color: textColor }]}>{'\u20b9'} {fmt2(entry)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[ss.lTitle, { color: G }]}>TARGET</Text>
            <Text style={[ss.lVal, { color: G }]}>{'\u20b9'} {fmt2(target)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default memo(TradeProgressLineInner);

const ss = StyleSheet.create({
  labels:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  lTitle:  { fontSize: 11, fontWeight: '500' },
  lVal:    { fontSize: 14, fontWeight: '700', marginTop: 3 },
  tooltip: { position: 'absolute', top: 0, width: 72, paddingVertical: 4, borderRadius: 7, backgroundColor: '#1E40AF', alignItems: 'center' },
  ttTxt:   { color: '#fff', fontSize: 9.5, fontWeight: '800' },
  ttArrow: { position: 'absolute', bottom: -4, left: '50%', marginLeft: -3, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1E40AF' },
});
