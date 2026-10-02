import { StyleSheet, Text, View } from 'react-native';

export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[bs.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[bs.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={bs.divider} />;
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <View style={bs.sectionRow}>
      <View style={bs.sectionBar} />
      <Text style={bs.sectionText}>{title}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={bs.emptyWrap}>
      <Text style={bs.emptyIcon}>{icon}</Text>
      <Text style={bs.emptyTitle}>{title}</Text>
      <Text style={bs.emptySub}>{sub}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

export const bs = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#07090f' },
  screen: { flex: 1, paddingHorizontal: 12 },
  body:   { flex: 1 },
  divider:{ height: 1, backgroundColor: '#1f2937', marginVertical: 10 },

  // Splash
  splash:     { flex: 1, backgroundColor: '#07090f', alignItems: 'center', justifyContent: 'center' },
  splashGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(99,102,241,0.10)', top: '28%' },
  splashTitle:{ color: '#f9fafb', fontSize: 28, fontWeight: '800', letterSpacing: 1, marginTop: 18 },
  splashSub:  { color: '#6b7280', fontSize: 13, marginTop: 6 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 22, paddingBottom: 14, backgroundColor: '#0d1117', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#f9fafb', fontSize: 15, fontWeight: '700' },
  headerSub:   { color: '#6b7280', fontSize: 11, marginTop: 1 },
  logoChip:    { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  logoChipText:{ color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  scanFab:     { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  scanFabText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },

  // Barcode bar
  barcodeBar:    { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#0d1117', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  barcodeInput:  { flex: 1, backgroundColor: '#161d2b', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, color: '#f9fafb', fontSize: 13 },
  barcodeAddBtn: { backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  barcodeAddText:{ color: '#ffffff', fontWeight: '800', fontSize: 13 },

  // Banner
  banner:      { marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  bannerOk:    { backgroundColor: 'rgba(16,185,129,0.14)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
  bannerErr:   { backgroundColor: 'rgba(239,68,68,0.13)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  bannerTextOk:  { color: '#10b981', fontSize: 12, fontWeight: '600' },
  bannerTextErr: { color: '#ef4444', fontSize: 12, fontWeight: '600' },

  // Section header
  sectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 10 },
  sectionBar:  { width: 3, height: 16, backgroundColor: '#6366f1', borderRadius: 2 },
  sectionText: { color: '#f9fafb', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  // Badge
  badge:    { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 2 },
  badgeText:{ fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 34, color: '#374151', marginBottom: 10 },
  emptyTitle:{ color: '#f9fafb', fontSize: 15, fontWeight: '700' },
  emptySub:  { color: '#6b7280', fontSize: 12, textAlign: 'center', maxWidth: 220, marginTop: 4 },

  // Customer strip
  customerStrip:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#1f2937' },
  customerLabel:   { color: '#6b7280', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  customerValue:   { color: '#38bdf8', fontSize: 13, fontWeight: '700', marginTop: 2 },
  changePill:      { backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  changePillText:  { color: '#6366f1', fontSize: 11, fontWeight: '700' },

  // Cart card
  cartCard:  { backgroundColor: '#111827', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1f2937' },
  cartTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cartName:  { flex: 1, color: '#f9fafb', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  cartCode:  { color: '#6b7280', fontSize: 11, marginTop: 3, marginBottom: 6 },
  cartX:     { padding: 4 },
  cartXText: { color: '#ef4444', fontSize: 13, fontWeight: '800' },
  cartBottom:{ flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:    { backgroundColor: '#374151', width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:{ color: '#ffffff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qtyVal:    { color: '#ffffff', fontSize: 15, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  cartPrice: { color: '#10b981', fontSize: 16, fontWeight: '800', marginLeft: 'auto' },

  // Totals
  totalsBox:{ backgroundColor: '#111827', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#1f2937' },
  totalsRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalsLbl:{ color: '#9ca3af', fontSize: 13 },
  totalsVal:{ color: '#f9fafb', fontSize: 13, fontWeight: '600' },
  grandLbl: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  grandVal: { color: '#10b981', fontSize: 22, fontWeight: '900' },

  // Buttons
  primaryBtn:     { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  ghostBtn:       { backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#1f2937' },
  ghostBtnText:   { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  btnDisabled:    { opacity: 0.4 },

  // List card
  listCard: { backgroundColor: '#111827', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#1f2937' },
  listRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  listTitle:{ color: '#f9fafb', fontSize: 14, fontWeight: '700', marginTop: 4 },
  listSub:  { color: '#6b7280', fontSize: 11, marginTop: 2 },
  listPrice:{ color: '#10b981', fontSize: 15, fontWeight: '800' },

  // Search
  searchBar:  { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  searchInput:{ backgroundColor: '#161d2b', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#f9fafb', fontSize: 13 },

  // Product card
  productCard:{ backgroundColor: '#111827', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#1f2937' },
  productTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  productName:{ color: '#f9fafb', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  productCode:{ color: '#6b7280', fontSize: 11, marginTop: 2 },
  productPrice:{ color: '#10b981', fontSize: 16, fontWeight: '800' },
  addBtn:     { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  addBtnText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },

  // Avatar
  avatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarText:{ color: '#6366f1', fontSize: 16, fontWeight: '800' },

  // Camera
  cameraRoot:     { flex: 1, backgroundColor: '#000000' },
  cameraHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(0,0,0,0.9)' },
  cameraTitle:    { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  cameraClose:    { backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 },
  cameraCloseText:{ color: '#ffffff', fontSize: 13, fontWeight: '700' },
  cameraTip:      { padding: 20, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center' },
  cameraTipText:  { color: '#6b7280', fontSize: 13 },
  viewfinder:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  vfTL:{ position: 'absolute', top: '30%', left: '15%', width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#6366f1', borderRadius: 2 },
  vfTR:{ position: 'absolute', top: '30%', right: '15%', width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#6366f1', borderRadius: 2 },
  vfBL:{ position: 'absolute', bottom: '30%', left: '15%', width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#6366f1', borderRadius: 2 },
  vfBR:{ position: 'absolute', bottom: '30%', right: '15%', width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#6366f1', borderRadius: 2 },

  // Product modals/forms
  modalRoot:    { flex: 1, backgroundColor: '#07090f' },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#0d1117', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  modalTitle:   { color: '#f9fafb', fontSize: 18, fontWeight: '800' },
  modalSub:     { color: '#6b7280', fontSize: 11, marginTop: 3 },
  modalClose:   { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  modalContent: { padding: 16, paddingBottom: 40 },
  formGroup:    { marginBottom: 14 },
  formLabel:    { color: '#d1d5db', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  formInput:    { backgroundColor: '#161d2b', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: '#f9fafb', fontSize: 13 },
  formValue:   { color: '#f9fafb', fontSize: 13 },
  formPlaceholder: { color: '#6b7280', fontSize: 13 },
  helpText:    { color: '#9ca3af', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  previewBox:  { backgroundColor: '#111827', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1f2937' },
  previewTitle:{ color: '#f9fafb', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  previewText: { color: '#9ca3af', fontSize: 11, marginBottom: 5 },

  settingsCard: { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937' },
  settingsSectionTitle: { color: '#f9fafb', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingsLabel: { color: '#9ca3af', fontSize: 12 },
  settingsValue: { color: '#f9fafb', fontSize: 13, fontWeight: '700', marginTop: 3 },
  settingsMeta: { color: '#6366f1', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  settingsAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161d2b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginTop: 8 },
  settingsActionTitle: { color: '#f9fafb', fontSize: 13, fontWeight: '700' },
  settingsActionSub: { color: '#6b7280', fontSize: 11, marginTop: 3 },
  settingsChevron: { color: '#6366f1', fontSize: 26, marginLeft: 10 },

  dangerBtn:    { backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  dangerBtnText:{ color: '#ef4444', fontSize: 12, fontWeight: '700' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  dialog:       { backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2d3748' },
  // Bottom nav
  nav:          { flexDirection: 'row', backgroundColor: '#0d1117', borderTopWidth: 1, borderTopColor: '#1f2937', paddingBottom: 4, minHeight: 68 },
  navItem:      { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 2, position: 'relative' },
  navPill:      { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
  navPillActive:{ backgroundColor: 'rgba(99,102,241,0.15)' },
  navAbbr:      { fontSize: 8, color: '#4b5563', fontWeight: '800', letterSpacing: 0.5 },
  navAbbrActive:{ color: '#6366f1' },
  navLabel:     { fontSize: 9, color: '#4b5563', marginTop: 3, fontWeight: '600' },
  navLabelActive:{ color: '#6366f1' },
  navDot:       { position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: '#6366f1' },
});
