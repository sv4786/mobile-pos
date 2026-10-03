import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { InventoryMovement, InventoryOverview, Product, Store } from '../types';
import { posDb } from '../database';
import { Badge, EmptyState, SectionHeader, bs } from './shared';

type ActionType = 'RECEIVE' | 'ADJUST' | 'TRANSFER_OUT';

export default function InventoryScreen({ storeId, stores, products }: {
  storeId: number;
  stores: Store[];
  products: Product[];
}) {
  const [items, setItems] = useState<InventoryOverview[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'overview' | 'movements'>('overview');
  const [action, setAction] = useState<ActionType | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [overview, history, totals] = await Promise.all([
      posDb.getInventoryOverview(storeId, search),
      posDb.getInventoryMovements(storeId),
      posDb.getInventorySummary(storeId),
    ]);
    setItems(overview);
    setMovements(history);
    setSummary(totals);
  };

  useEffect(() => { load().catch(() => {}); }, [storeId, search]);

  const availableProducts = useMemo(() => products.filter(p => p.StockId), [products]);

  const closeAction = () => {
    setAction(null);
    setSelected(null);
    setQuantity('');
    setReferenceNo('');
    setNotes('');
    setDestination(null);
  };

  const submitAction = async () => {
    if (!action || !selected) {
      Alert.alert('Inventory', 'Select a product first.');
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert('Inventory', 'Enter a quantity greater than zero.');
      return;
    }
    if (action === 'TRANSFER_OUT' && !destination) {
      Alert.alert('Inventory', 'Select a destination store.');
      return;
    }

    try {
      setBusy(true);
      const result = await posDb.recordInventoryMovement({
        storeId,
        itemId: selected.ItemId,
        stockId: selected.StockId,
        movementType: action,
        quantity: qty,
        referenceNo,
        notes,
        relatedStoreId: destination || undefined,
      });
      closeAction();
      await load();
      Alert.alert('Inventory Updated', `${result.referenceNo} was recorded successfully.`);
    } catch (e: any) {
      Alert.alert('Inventory', e?.message || 'Could not update inventory.');
    } finally {
      setBusy(false);
    }
  };

  const movementLabel = (type: string) => {
    if (type === 'RECEIVE') return 'Received';
    if (type === 'ADJUST') return 'Adjustment';
    if (type === 'TRANSFER_OUT') return 'Transfer Out';
    if (type === 'TRANSFER_IN') return 'Transfer In';
    return type;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader title="Inventory Control" />
        <Text style={bs.helpText}>
          Manage stock levels, record inventory movements and transfer stock between stores. Sales and stock takes continue to update quantities automatically.
        </Text>

        <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
          <View style={[bs.listCard, { flex: 1, minWidth: 135 }]}><Text style={bs.listSub}>Stock Items</Text><Text style={bs.grandVal}>{summary.itemCount || 0}</Text></View>
          <View style={[bs.listCard, { flex: 1, minWidth: 135 }]}><Text style={bs.listSub}>Low Stock</Text><Text style={bs.grandVal}>{summary.lowStock || 0}</Text></View>
          <View style={[bs.listCard, { flex: 1, minWidth: 135 }]}><Text style={bs.listSub}>Out of Stock</Text><Text style={bs.grandVal}>{summary.outOfStock || 0}</Text></View>
          <View style={[bs.listCard, { flex: 1, minWidth: 135 }]}><Text style={bs.listSub}>Stock Value</Text><Text style={bs.grandVal}>R {Number(summary.stockValue || 0).toFixed(2)}</Text></View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <TouchableOpacity style={[bs.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={() => setAction('RECEIVE')}><Text style={bs.primaryBtnText}>+ Receive</Text></TouchableOpacity>
          <TouchableOpacity style={[bs.ghostBtn, { flex: 1, marginTop: 0 }]} onPress={() => setAction('ADJUST')}><Text style={bs.ghostBtnText}>Adjust</Text></TouchableOpacity>
          <TouchableOpacity style={[bs.ghostBtn, { flex: 1, marginTop: 0 }]} onPress={() => setAction('TRANSFER_OUT')}><Text style={bs.ghostBtnText}>Transfer</Text></TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <TouchableOpacity style={[bs.ghostBtn, { flex: 1, marginTop: 0, borderColor: tab === 'overview' ? '#6366f1' : '#1f2937' }]} onPress={() => setTab('overview')}><Text style={bs.ghostBtnText}>Stock Overview</Text></TouchableOpacity>
          <TouchableOpacity style={[bs.ghostBtn, { flex: 1, marginTop: 0, borderColor: tab === 'movements' ? '#6366f1' : '#1f2937' }]} onPress={() => setTab('movements')}><Text style={bs.ghostBtnText}>Movement History</Text></TouchableOpacity>
        </View>

        {tab === 'overview' ? (
          <>
            <TextInput
              style={bs.searchInput}
              placeholder="Search product, item code or stock code..."
              placeholderTextColor="#4b5563"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {items.length === 0 ? <EmptyState icon="INV" title="No inventory found" sub="Add products or change your search." /> :
              items.map(item => {
                const qty = Number(item.QtyOnHand || 0);
                const low = qty > 0 && qty <= 5;
                return (
                  <View key={`${item.ItemId}-${item.StockId}`} style={bs.listCard}>
                    <View style={bs.listRow}>
                      <Badge text={item.ItemCode || item.StockCode} color={qty <= 0 ? '#ef4444' : low ? '#f59e0b' : '#10b981'} />
                      <Text style={bs.listPrice}>{qty} units</Text>
                    </View>
                    <Text style={bs.listTitle}>{item.ItemDesc}</Text>
                    <Text style={bs.listSub}>Stock: {item.StockCode} • Cost: R {Number(item.AvgCost || item.LastCost || 0).toFixed(2)} • Value: R {(qty * Number(item.AvgCost || item.LastCost || 0)).toFixed(2)}</Text>
                  </View>
                );
              })
            }
          </>
        ) : (
          movements.length === 0 ? <EmptyState icon="MOV" title="No movements yet" sub="Receiving, adjustments and transfers will appear here." /> :
          movements.map(m => (
            <View key={m.MovementId} style={bs.listCard}>
              <View style={bs.listRow}>
                <Badge text={movementLabel(m.MovementType)} color={m.MovementType === 'RECEIVE' || m.MovementType === 'TRANSFER_IN' ? '#10b981' : '#f59e0b'} />
                <Text style={bs.listSub}>{new Date(m.CreatedDt).toLocaleString()}</Text>
              </View>
              <Text style={bs.listTitle}>{m.ItemDesc}</Text>
              <Text style={bs.listSub}>
                {m.MovementType === 'TRANSFER_OUT' ? '-' : '+'}{Number(m.Quantity).toFixed(2)} units • Balance {Number(m.BalanceBefore).toFixed(2)} → {Number(m.BalanceAfter).toFixed(2)}
              </Text>
              <Text style={bs.listSub}>Ref: {m.ReferenceNo}{m.RelatedStoreDesc ? ` • Related: ${m.RelatedStoreDesc}` : ''}</Text>
              {!!m.Notes && <Text style={bs.listSub}>Note: {m.Notes}</Text>}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!action} animationType="slide" onRequestClose={closeAction}>
        <View style={bs.modalRoot}>
          <View style={bs.modalHeader}>
            <View><Text style={bs.modalTitle}>{action === 'RECEIVE' ? 'Receive Stock' : action === 'ADJUST' ? 'Adjust Stock' : 'Transfer Stock'}</Text><Text style={bs.modalSub}>Update inventory for the current store</Text></View>
            <TouchableOpacity onPress={closeAction}><Text style={bs.modalClose}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={bs.modalContent}>
            <Text style={bs.formLabel}>Product</Text>
            <View style={{ marginBottom: 12 }}>
              {availableProducts.map(p => (
                <TouchableOpacity key={`${p.ItemId}-${p.StockId}`} style={[bs.listCard, selected?.ItemId === p.ItemId && selected?.StockId === p.StockId ? { borderColor: '#6366f1' } : {}]} onPress={() => setSelected(p)}>
                  <Text style={bs.listTitle}>{p.ItemDesc}</Text>
                  <Text style={bs.listSub}>{p.StockCode} • Current: {p.QtyOnHand}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={bs.formGroup}><Text style={bs.formLabel}>Quantity *</Text><TextInput style={bs.formInput} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#4b5563" /></View>
            {action === 'TRANSFER_OUT' && (
              <View style={bs.formGroup}>
                <Text style={bs.formLabel}>Destination Store *</Text>
                {stores.filter(s => s.StoreId !== storeId).map(s => (
                  <TouchableOpacity key={s.StoreId} style={[bs.ghostBtn, { marginTop: 5, borderColor: destination === s.StoreId ? '#6366f1' : '#1f2937' }]} onPress={() => setDestination(s.StoreId)}>
                    <Text style={bs.ghostBtnText}>{s.StoreDesc} ({s.StoreCode})</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={bs.formGroup}><Text style={bs.formLabel}>Reference</Text><TextInput style={bs.formInput} value={referenceNo} onChangeText={setReferenceNo} placeholder="Optional reference number" placeholderTextColor="#4b5563" /></View>
            <View style={bs.formGroup}><Text style={bs.formLabel}>Notes</Text><TextInput style={[bs.formInput, { minHeight: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Optional notes" placeholderTextColor="#4b5563" /></View>
            <TouchableOpacity style={[bs.primaryBtn, busy && bs.btnDisabled]} disabled={busy} onPress={submitAction}><Text style={bs.primaryBtnText}>{busy ? 'Saving...' : 'Save Inventory Movement'}</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
