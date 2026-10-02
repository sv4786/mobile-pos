import { ScrollView, Text, View } from 'react-native';
import { Quote } from '../types';
import { Badge, Divider, EmptyState, SectionHeader, bs } from './shared';

function QuotesScreen({ quotes }: { quotes: Quote[] }) {
  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <SectionHeader title="Saved Quotes" />
      {quotes.length === 0
        ? <EmptyState icon="Q" title="No quotes yet" sub="Quotes created from the POS screen will appear here" />
        : quotes.map((q, i) => (
          <View key={i} style={bs.listCard}>
            <View style={bs.listRow}>
              <Badge text={'# ' + q.QuoteNo} color="#6366f1" />
              <Badge text={q.QUStatus || 'OPEN'} color="#f59e0b" />
            </View>
            <Text style={bs.listTitle}>{q.Company}</Text>
            <Text style={bs.listSub}>{q.Date}</Text>
            <Divider />
            <View style={bs.listRow}>
              <Text style={bs.listSub}>Excl. VAT</Text>
              <Text style={bs.listPrice}>R {q.SubTotal?.toFixed(2)}</Text>
            </View>
          </View>
        ))
      }
    </ScrollView>
  );
}
