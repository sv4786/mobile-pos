import { ScrollView, Text, View } from 'react-native';
import { Invoice } from '../types';
import { Badge, Divider, EmptyState, SectionHeader, bs } from './shared';

export default function InvoicesScreen({ invoices }: { invoices: Invoice[] }) {
  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <SectionHeader title="Completed Invoices" />
      {invoices.length === 0
        ? <EmptyState icon="I" title="No invoices yet" sub="Completed transactions will appear here" />
        : invoices.map((inv, i) => (
          <View key={i} style={bs.listCard}>
            <View style={bs.listRow}>
              <Badge text={'INV ' + inv.INVNo} color="#10b981" />
              <Text style={bs.listSub}>{inv.CreatedDt?.slice(0, 10)}</Text>
            </View>
            <Text style={bs.listTitle}>{inv.Company}</Text>
            <Divider />
            <View style={bs.listRow}>
              <Text style={bs.listSub}>Amount Paid</Text>
              <Text style={[bs.listPrice, { color: '#10b981' }]}>R {inv.AmtPaid?.toFixed(2)}</Text>
            </View>
          </View>
        ))
      }
    </ScrollView>
  );
}
