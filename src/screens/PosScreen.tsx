import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CartItem } from '../types';
import { Badge, Divider, EmptyState, SectionHeader, bs } from './shared';

const PAYMENT_METHODS = ['Cash', 'Card', 'EFT', 'Other'];

export default function PosScreen({
  cart,
  selectedCustomer,
  subExcl,
  subVat,
  subTotal,
  onQtyChange,
  onRemove,
  onInvoice,
  onQuote,
  onChangeCustomer,
}: any) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');

  const openPayment = () => {
    if (cart.length === 0) return;
    setPaymentMethod('Cash');
    setAmountReceived(subTotal.toFixed(2));
    setPaymentOpen(true);
  };

  const completePayment = () => {
    const received = Number(amountReceived);

    if (!Number.isFinite(received) || received < subTotal) {
      return;
    }

    onInvoice({
      method: paymentMethod,
      amountReceived: received,
    });
    setPaymentOpen(false);
  };

  const cashReceived = Number(amountReceived);
  const change = paymentMethod === 'Cash' && Number.isFinite(cashReceived)
    ? Math.max(0, cashReceived - subTotal)
    : 0;

  return (
    <>
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
            onPress={openPayment}
          >
            <Text style={bs.primaryBtnText}>Take Payment</Text>
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

      <Modal visible={paymentOpen} animationType="slide" transparent>
        <View style={paymentStyles.overlay}>
          <View style={paymentStyles.card}>
            <View style={paymentStyles.header}>
              <Text style={paymentStyles.title}>Take Payment</Text>
              <TouchableOpacity onPress={() => setPaymentOpen(false)} style={paymentStyles.close}>
                <Text style={paymentStyles.closeText}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={paymentStyles.dueLabel}>AMOUNT DUE</Text>
            <Text style={paymentStyles.due}>R {subTotal.toFixed(2)}</Text>

            <Text style={paymentStyles.sectionLabel}>PAYMENT METHOD</Text>
            <View style={paymentStyles.methods}>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity
                  key={method}
                  style={[paymentStyles.method, paymentMethod === method && paymentStyles.methodActive]}
                  onPress={() => {
                    setPaymentMethod(method);
                    setAmountReceived(subTotal.toFixed(2));
                  }}
                >
                  <Text style={[paymentStyles.methodText, paymentMethod === method && paymentStyles.methodTextActive]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={paymentStyles.sectionLabel}>
              {paymentMethod === 'Cash' ? 'AMOUNT RECEIVED' : 'AMOUNT PAID'}
            </Text>
            <TextInput
              style={paymentStyles.input}
              value={amountReceived}
              onChangeText={setAmountReceived}
              keyboardType="decimal-pad"
              selectTextOnFocus
              placeholder="0.00"
              placeholderTextColor="#4b5563"
            />

            {paymentMethod === 'Cash' && (
              <View style={paymentStyles.changeBox}>
                <Text style={paymentStyles.changeLabel}>CHANGE</Text>
                <Text style={paymentStyles.changeValue}>R {change.toFixed(2)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                bs.primaryBtn,
                (!Number.isFinite(cashReceived) || cashReceived < subTotal) && bs.btnDisabled,
              ]}
              disabled={!Number.isFinite(cashReceived) || cashReceived < subTotal}
              onPress={completePayment}
            >
              <Text style={bs.primaryBtnText}>Complete Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity style={bs.ghostBtn} onPress={() => setPaymentOpen(false)}>
              <Text style={bs.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const paymentStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 18,
  },
  title: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: '800' as const,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1f2937',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  closeText: {
    color: '#ffffff',
    fontWeight: '800' as const,
  },
  dueLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  due: {
    color: '#10b981',
    fontSize: 30,
    fontWeight: '900' as const,
    marginTop: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  methods: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 18,
  },
  method: {
    flex: 1,
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center' as const,
    backgroundColor: '#161d2b',
  },
  methodActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  methodText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  methodTextActive: {
    color: '#6366f1',
  },
  input: {
    backgroundColor: '#161d2b',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  changeBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  changeLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  changeValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '800' as const,
  },
};
