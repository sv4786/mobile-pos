import { ScrollView, Text, View } from 'react-native';
import { StockTakeItem } from '../types';
import { Badge, EmptyState, SectionHeader, bs } from './shared';

function StocktakeScreen({ scans }: { scans: StockTakeItem[] }) {
  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <SectionHeader title={'Inventory Count  (' + scans.length + ' scans)'} />
      {scans.length === 0
        ? <EmptyState icon="S" title="No scans yet" sub="Scan items with the barcode scanner to count stock" />
        : scans.map((s, i) => (
          <View key={i} style={bs.listCard}>
            <View style={bs.listRow}>
              <Badge text={s.barcode} color="#38bdf8" />
              <Text style={bs.listSub}>{s.timestamp}</Text>
            </View>
            <Text style={bs.listTitle}>{s.product?.ItemDesc ?? 'Unknown Item'}</Text>
            <View style={[bs.listRow, { marginTop: 6 }]}>
              <Text style={bs.listSub}>Counted Qty</Text>
              <Text style={[bs.listPrice, { color: '#38bdf8' }]}>{s.qty}</Text>
            </View>
          </View>
        ))
      }
    </ScrollView>
  );
}
