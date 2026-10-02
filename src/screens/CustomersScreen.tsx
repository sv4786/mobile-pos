import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Customer } from '../types';
import { Badge, EmptyState, bs } from './shared';

export default function CustomersScreen({ customers, search, onSearch, selected, onSelect }: any) {
  return (
    <View style={{ flex: 1 }}>
      <View style={bs.searchBar}>
        <TextInput style={bs.searchInput} placeholder="Search customers..."
          placeholderTextColor="#4b5563" value={search} onChangeText={onSearch} autoCorrect={false} />
      </View>
      <FlatList
        data={customers}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState icon="C" title="No customers found" sub="Try a different search" />}
        renderItem={({ item: c }: { item: Customer }) => {
          const isSel = selected?.AccId === c.AccId;
          return (
            <TouchableOpacity
              style={[bs.listCard, isSel && { borderColor: '#6366f1' }]}
              onPress={() => onSelect(c)}
            >
              <View style={bs.listRow}>
                <View style={bs.avatar}>
                  <Text style={bs.avatarText}>{c.Company[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={bs.listTitle}>{c.Company}</Text>
                  <Text style={bs.listSub}>{c.AccCode}  |  {c.Tel}</Text>
                </View>
                {isSel && <Badge text="Active" color="#10b981" />}
              </View>
              {c.AllowPriceMatrix === 1 && <Badge text="Custom Pricing" color="#6366f1" />}
              {c.AutoDisc > 0 && <Badge text={c.AutoDisc + '% Auto Discount'} color="#f59e0b" />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
