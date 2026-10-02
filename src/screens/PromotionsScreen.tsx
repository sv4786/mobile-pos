import { ScrollView, Text, View } from 'react-native';
import { Promotion } from '../types';
import { Badge, EmptyState, SectionHeader, bs } from './shared';

function PromotionsScreen({ promos }: { promos: Promotion[] }) {
  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <SectionHeader title="Active Promotions" />
      {promos.length === 0
        ? <EmptyState icon="%" title="No promotions" sub="Store promotions will appear here" />
        : promos.map((p, i) => (
          <View key={i} style={bs.listCard}>
            <View style={bs.listRow}>
              <Badge text="PROMO" color="#f59e0b" />
              <Text style={bs.listSub}>{p.IsActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <Text style={bs.listTitle}>{p.PromotionDesc}</Text>
            <Text style={bs.listSub}>{p.FromText ?? '--'}  to  {p.ToText ?? '--'}</Text>
          </View>
        ))
      }
    </ScrollView>
  );
}
