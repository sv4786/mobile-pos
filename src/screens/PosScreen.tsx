import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CartItem } from '../types';
import { Badge, Divider, EmptyState, SectionHeader, bs } from './shared';

export default function PosScreen({ cart, selectedCustomer, subExcl, subVat, subTotal, onQtyChange, onRemove, onInvoice, onQuote, onChangeCustomer }: any) {
  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <TouchableOpacity style={bs.customerStrip} onPress={onChangeCustomer}>
        <View style={{ flex: 1 }}>
          <Text style={bs.customerLabel}>CUSTOMER</Text>
          <Text style={bs.customerValue} numberOfLines={1}>
            {selectedCustomer ? selectedCustomer.Company : 'Walk-In Cash Customer'}
          </Text>
        </View>
        <View style={bs.changePill}>
          <Text style={bs.changePillText}>Change</Text>
        </View>
      </TouchableOpacity>

      <SectionHeader title={'Cart  (' + cart.length + ' item' + (cart.length !== 1 ? 's' : '') + ')'} />

      {cart.length === 0
        ? <EmptyState icon="+" title="Cart is empty" sub="Scan or search for items to add them here" />
        : cart.map((item: CartItem, idx: number) => (
          <View key={idx} style={bs.cartCard}>
            <View style={bs.cartTop}>
              <Text style={bs.cartName} numberOfLines={2}>{item.product.ItemDesc}</Text>
              <TouchableOpacity style={bs.cartX} onPress={() => onRemove(idx)}>
                <Text style={bs.cartXText}>X</Text>
              </TouchableOpacity>
            </View>
            <Text style={bs.cartCode}>{item.product.StockCode}  |  {item.price_source}</Text>
            {!!item.promotion_desc && (
              <Badge text={'PROMO: ' + item.promotion_desc} color="#f59e0b" />
            )}
            <View style={bs.cartBottom}>
              <View style={bs.qtyRow}>
                <TouchableOpacity style={bs.qtyBtn} onPress={() => onQtyChange(idx, -1)}>
                  <Text style={bs.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={bs.qtyVal}>{item.qty}</Text>
                <TouchableOpacity style={bs.qtyBtn} onPress={() => onQtyChange(idx, 1)}>
                  <Text style={bs.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={bs.cartPrice}>R {item.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))
      }

      <View style={bs.totalsBox}>
        <View style={bs.totalsRow}>
          <Text style={bs.totalsLbl}>Subtotal (excl. VAT)</Text>
          <Text style={bs.totalsVal}>R {subExcl.toFixed(2)}</Text>
        </View>
        <View style={bs.totalsRow}>
          <Text style={bs.totalsLbl}>VAT (15%)</Text>
          <Text style={bs.totalsVal}>R {subVat.toFixed(2)}</Text>
        </View>
        <Divider />
        <View style={bs.totalsRow}>
          <Text style={bs.grandLbl}>TOTAL (incl. VAT)</Text>
          <Text style={bs.grandVal}>R {subTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[bs.primaryBtn, cart.length === 0 && bs.btnDisabled]}
          disabled={cart.length === 0}
          onPress={onInvoice}
        >
          <Text style={bs.primaryBtnText}>Complete Invoice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[bs.ghostBtn, cart.length === 0 && bs.btnDisabled]}
          disabled={cart.length === 0}
          onPress={onQuote}
        >
          <Text style={bs.ghostBtnText}>Save as Quote</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
