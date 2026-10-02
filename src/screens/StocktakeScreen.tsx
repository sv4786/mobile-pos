import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { StockTakeItem } from '../types';
import { posDb } from '../database';
import { Badge, EmptyState, SectionHeader, bs } from './shared';

export default function StocktakeScreen({ scans, storeId, onComplete }: {
  scans: StockTakeItem[];
  storeId: number;
  onComplete: () => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, StockTakeItem & { count: number }>();
    for (const scan of scans) {
      const key = scan.product ? scan.product.ItemId + ':' + scan.product.StockId : scan.barcode;
      const existing = map.get(key);
      if (existing) existing.count += scan.qty || 1;
      else map.set(key, { ...scan, count: scan.qty || 1 });
    }
    return Array.from(map.values());
  }, [scans]);
  const [saving, setSaving] = useState(false);

  const finish = () => {
    Alert.alert(
      'Finalise Stock Take',
      `This will update stock quantities for ${grouped.length} scanned products. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finalise', onPress: async () => {
          try {
            setSaving(true);
            const rows = grouped.filter(x => x.product).map(x => ({
              itemId: x.product!.ItemId,
              stockId: x.product!.StockId,
              countedQty: x.count,
            }));
            const result = await posDb.finalizeStockTake(storeId, rows);
            Alert.alert('Stock Take Complete', result.stockTakeNo + ' was saved.');
            onComplete();
          } catch (e: any) {
            Alert.alert('Stock Take Failed', e.message);
          } finally {
            setSaving(false);
          }
        }}
      ]
    );
  };

  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 30 }}>
      <SectionHeader title={`Stock Take (${grouped.length} products)`} />
      <Text style={bs.listSub}>Scan each product as many times as it physically appears. Each scan adds one to the counted quantity.</Text>

      {grouped.length === 0 ? (
        <EmptyState icon="STK" title="No products counted" sub="Use the scanner or barcode field to count inventory." />
      ) : grouped.map((s, i) => (
        <View key={i} style={bs.listCard}>
          <View style={bs.listRow}>
            <Badge text={s.product?.ItemCode || s.barcode} color="#38bdf8" />
            <Text style={bs.listPrice}>Counted {s.count}</Text>
          </View>
          <Text style={bs.listTitle}>{s.product?.ItemDesc || 'Unknown Item'}</Text>
          <Text style={bs.listSub}>Barcode: {s.barcode}</Text>
        </View>
      ))}

      {grouped.length > 0 && (
        <TouchableOpacity style={[bs.primaryBtn, saving && bs.btnDisabled]} onPress={finish} disabled={saving}>
          <Text style={bs.primaryBtnText}>{saving ? 'Saving...' : 'Finalise Stock Take'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
