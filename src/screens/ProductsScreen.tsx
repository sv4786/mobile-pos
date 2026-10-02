import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Product } from '../types';
import { EmptyState, bs } from './shared';

function ProductsScreen({ products, search, onSearch, onAddToCart }: any) {
  return (
    <View style={{ flex: 1 }}>
      <View style={bs.searchBar}>
        <TextInput style={bs.searchInput} placeholder="Search by name, code..."
          placeholderTextColor="#4b5563" value={search} onChangeText={onSearch} autoCorrect={false} />
      </View>
      <FlatList
        data={products}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState icon="P" title="No products" sub="Adjust your search" />}
        renderItem={({ item: p }: { item: Product }) => (
          <View style={bs.productCard}>
            <View style={bs.productTop}>
              <View style={{ flex: 1 }}>
                <Text style={bs.productName} numberOfLines={2}>{p.ItemDesc}</Text>
                <Text style={bs.productCode}>{p.StockCode}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={bs.productPrice}>R {(p.POSPrice1 > 0 ? p.POSPrice1 : p.SellPrice1).toFixed(2)}</Text>
                <Text style={bs.listSub}>Qty: {p.QtyOnHand}</Text>
              </View>
            </View>
            <TouchableOpacity style={bs.addBtn} onPress={() => onAddToCart(p.StockCode)}>
              <Text style={bs.addBtnText}>+ Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
