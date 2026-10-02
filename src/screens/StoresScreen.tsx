import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Store } from '../types';
import { Badge, SectionHeader, bs } from './shared';

export default function StoresScreen({ stores, current, onSwitch }: any) {
  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <SectionHeader title="Store Locations" />
      {stores.map((s: Store, i: number) => {
        const isCurr = current?.StoreId === s.StoreId;
        return (
          <View key={i} style={[bs.listCard, isCurr && { borderColor: '#6366f1' }]}>
            <View style={bs.listRow}>
              <Badge text={s.StoreCode} color={isCurr ? '#6366f1' : '#6b7280'} />
              {isCurr && <Badge text="Current" color="#10b981" />}
            </View>
            <Text style={bs.listTitle}>{s.StoreDesc}</Text>
            <Text style={bs.listSub}>Tel: {s.Tel ?? 'N/A'}</Text>
            {!isCurr && (
              <TouchableOpacity style={[bs.ghostBtn, { marginTop: 10 }]} onPress={() => onSwitch(s)}>
                <Text style={bs.ghostBtnText}>Switch to this store</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
