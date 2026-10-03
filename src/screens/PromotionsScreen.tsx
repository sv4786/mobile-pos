import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { posDb } from '../database';
import { Product, Promotion, PromotionItem } from '../types';
import { Badge, EmptyState, SectionHeader, bs } from './shared';

type Props = {
  storeId: number;
  products: Product[];
  promos: Promotion[];
  onChanged: () => Promise<void> | void;
};

const TYPES: Array<{ key: 'PRICE' | 'PERCENT' | 'FIXED'; label: string }> = [
  { key: 'PRICE', label: 'Promo Price' },
  { key: 'PERCENT', label: '% Off' },
  { key: 'FIXED', label: 'R Off' },
];

export default function PromotionsScreen({ storeId, products, promos, onChanged }: Props) {
  const [itemsByPromo, setItemsByPromo] = useState<Record<number, PromotionItem[]>>({});
  const [promoModal, setPromoModal] = useState(false);
  const [itemModal, setItemModal] = useState<number | null>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const [description, setDescription] = useState('');
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountType, setDiscountType] = useState<'PRICE' | 'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('');
  const [minQty, setMinQty] = useState('1');
  const [promotionLimit, setPromotionLimit] = useState('0');

  const loadItems = async () => {
    const next: Record<number, PromotionItem[]> = {};
    for (const promo of promos) {
      next[promo.PromotionId] = await posDb.getPromotionItems(promo.PromotionId);
    }
    setItemsByPromo(next);
  };

  useEffect(() => {
    loadItems().catch(() => {});
  }, [promos]);

  const resetPromotionForm = () => {
    setEditing(null);
    setDescription('');
    setFromText('');
    setToText('');
  };

  const openNewPromotion = () => {
    resetPromotionForm();
    setPromoModal(true);
  };

  const openEditPromotion = (promo: Promotion) => {
    setEditing(promo);
    setDescription(promo.PromotionDesc);
    setFromText(promo.FromText || '');
    setToText(promo.ToText || '');
    setPromoModal(true);
  };

  const savePromotion = async () => {
    try {
      if (!description.trim()) throw new Error('Enter a promotion name.');
      if (editing) {
        await posDb.updatePromotion(editing.PromotionId, {
          description,
          fromText,
          toText,
          isActive: editing.IsActive,
        });
      } else {
        await posDb.createPromotion({
          storeId,
          description,
          fromText,
          toText,
        });
      }
      setPromoModal(false);
      resetPromotionForm();
      await onChanged();
    } catch (e: any) {
      Alert.alert('Promotion Error', e.message);
    }
  };

  const togglePromotion = async (promo: Promotion) => {
    try {
      await posDb.updatePromotion(promo.PromotionId, {
        description: promo.PromotionDesc,
        fromText: promo.FromText || '',
        toText: promo.ToText || '',
        isActive: promo.IsActive ? 0 : 1,
      });
      await onChanged();
    } catch (e: any) {
      Alert.alert('Promotion Error', e.message);
    }
  };

  const deletePromotion = (promo: Promotion) => {
    Alert.alert(
      'Delete Promotion',
      'Delete "' + promo.PromotionDesc + '" and all of its item rules?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await posDb.deletePromotion(promo.PromotionId);
              await onChanged();
            } catch (e: any) {
              Alert.alert('Promotion Error', e.message);
            }
          },
        },
      ]
    );
  };

  const openAddItem = (promotionId: number) => {
    setItemModal(promotionId);
    setSelectedProduct(null);
    setDiscountType('PERCENT');
    setDiscountValue('');
    setMinQty('1');
    setPromotionLimit('0');
  };

  const savePromotionItem = async () => {
    if (!itemModal || !selectedProduct) {
      Alert.alert('Product Required', 'Select a product first.');
      return;
    }

    const value = Number(discountValue);
    const qty = Number(minQty);
    const limit = Number(promotionLimit);

    if (!Number.isFinite(value) || value < 0) {
      Alert.alert('Invalid Discount', 'Enter a valid discount value.');
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      Alert.alert('Invalid Quantity', 'Minimum quantity must be at least 1.');
      return;
    }

    try {
      await posDb.addPromotionItem({
        promotionId: itemModal,
        itemId: selectedProduct.ItemId,
        stockId: selectedProduct.StockId,
        price: discountType === 'PRICE' ? value : undefined,
        discountType,
        discountValue: value,
        minQty: qty,
        promotionLimit: Number.isFinite(limit) ? Math.max(0, limit) : 0,
      });
      setItemModal(null);
      await onChanged();
    } catch (e: any) {
      Alert.alert('Promotion Item Error', e.message);
    }
  };

  const removeItem = (row: PromotionItem) => {
    Alert.alert('Remove Item', 'Remove this product from the promotion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await posDb.removePromotionItem(row.PromotionId, row.ItemId, row.StockId);
            await onChanged();
          } catch (e: any) {
            Alert.alert('Promotion Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <SectionHeader title="Promotions & Pricing" />
          <TouchableOpacity style={promoStyles.addButton} onPress={openNewPromotion}>
            <Text style={promoStyles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <Text style={promoStyles.help}>
          Create reusable discounts with dates and quantity rules. Active rules are applied automatically at checkout.
        </Text>

        {promos.length === 0 ? (
          <EmptyState icon="%" title="No promotions" sub="Create your first store promotion." />
        ) : promos.map(promo => (
          <View key={promo.PromotionId} style={bs.listCard}>
            <View style={bs.listRow}>
              <Badge text={promo.IsActive ? 'ACTIVE' : 'INACTIVE'} color={promo.IsActive ? '#10b981' : '#6b7280'} />
              <Text style={bs.listSub}>{promo.ItemCount} item{promo.ItemCount === 1 ? '' : 's'}</Text>
            </View>
            <Text style={bs.listTitle}>{promo.PromotionDesc}</Text>
            <Text style={bs.listSub}>
              {promo.FromText || 'No start'}  to  {promo.ToText || 'No end'}
            </Text>

            {(itemsByPromo[promo.PromotionId] || []).map(row => (
              <View key={row.ItemId + ':' + row.StockId} style={promoStyles.itemRule}>
                <View style={{ flex: 1 }}>
                  <Text style={promoStyles.itemName} numberOfLines={1}>{row.ItemDesc}</Text>
                  <Text style={promoStyles.itemMeta}>
                    {row.DiscountType === 'PRICE'
                      ? 'Promo price R ' + row.DiscountValue.toFixed(2)
                      : row.DiscountType === 'PERCENT'
                        ? row.DiscountValue.toFixed(2) + '% off'
                        : 'R ' + row.DiscountValue.toFixed(2) + ' off'}
                    {'  |  min qty ' + row.MinQty}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(row)} style={promoStyles.smallDanger}>
                  <Text style={promoStyles.smallDangerText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={promoStyles.actions}>
              <TouchableOpacity style={promoStyles.action} onPress={() => openAddItem(promo.PromotionId)}>
                <Text style={promoStyles.actionText}>+ Add Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={promoStyles.action} onPress={() => openEditPromotion(promo)}>
                <Text style={promoStyles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={promoStyles.action} onPress={() => togglePromotion(promo)}>
                <Text style={promoStyles.actionText}>{promo.IsActive ? 'Deactivate' : 'Activate'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={promoStyles.dangerAction} onPress={() => deletePromotion(promo)}>
                <Text style={promoStyles.dangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={promoModal} animationType="slide">
        <View style={bs.modalRoot}>
          <View style={bs.modalHeader}>
            <View>
              <Text style={bs.modalTitle}>{editing ? 'Edit Promotion' : 'New Promotion'}</Text>
              <Text style={bs.modalSub}>Store promotion</Text>
            </View>
            <TouchableOpacity onPress={() => setPromoModal(false)}>
              <Text style={bs.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={bs.modalContent}>
            <View style={bs.formGroup}>
              <Text style={bs.formLabel}>PROMOTION NAME</Text>
              <TextInput style={bs.formInput} value={description} onChangeText={setDescription} placeholder="Weekend Sale" placeholderTextColor="#6b7280" />
            </View>
            <View style={bs.formGroup}>
              <Text style={bs.formLabel}>START DATE (YYYY-MM-DD)</Text>
              <TextInput style={bs.formInput} value={fromText} onChangeText={setFromText} placeholder="2026-10-01" placeholderTextColor="#6b7280" />
            </View>
            <View style={bs.formGroup}>
              <Text style={bs.formLabel}>END DATE (YYYY-MM-DD)</Text>
              <TextInput style={bs.formInput} value={toText} onChangeText={setToText} placeholder="2026-10-31" placeholderTextColor="#6b7280" />
            </View>
            <TouchableOpacity style={bs.primaryBtn} onPress={savePromotion}>
              <Text style={bs.primaryBtnText}>{editing ? 'Save Changes' : 'Create Promotion'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={itemModal !== null} animationType="slide">
        <View style={bs.modalRoot}>
          <View style={bs.modalHeader}>
            <View>
              <Text style={bs.modalTitle}>Promotion Item</Text>
              <Text style={bs.modalSub}>Choose a product and rule</Text>
            </View>
            <TouchableOpacity onPress={() => setItemModal(null)}>
              <Text style={bs.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={bs.modalContent}>
            <Text style={bs.formLabel}>PRODUCT</Text>
            {products.slice(0, 60).map(product => {
              const active = selectedProduct?.ItemId === product.ItemId && selectedProduct?.StockId === product.StockId;
              return (
                <TouchableOpacity
                  key={product.ItemId + ':' + product.StockId}
                  style={[promoStyles.productOption, active && promoStyles.productOptionActive]}
                  onPress={() => setSelectedProduct(product)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={promoStyles.itemName}>{product.ItemDesc}</Text>
                    <Text style={promoStyles.itemMeta}>R {product.POSPrice1.toFixed(2)}  |  {product.StockCode}</Text>
                  </View>
                  {active && <Text style={promoStyles.selectedMark}>SELECTED</Text>}
                </TouchableOpacity>
              );
            })}

            <Text style={[bs.formLabel, { marginTop: 14 }]}>DISCOUNT TYPE</Text>
            <View style={promoStyles.typeRow}>
              {TYPES.map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[promoStyles.typeButton, discountType === type.key && promoStyles.typeButtonActive]}
                  onPress={() => setDiscountType(type.key)}
                >
                  <Text style={[promoStyles.typeText, discountType === type.key && promoStyles.typeTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={bs.formLabel}>
              {discountType === 'PRICE' ? 'PROMOTIONAL PRICE' : discountType === 'PERCENT' ? 'PERCENT OFF' : 'AMOUNT OFF'}
            </Text>
            <TextInput
              style={bs.formInput}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#6b7280"
            />

            <Text style={[bs.formLabel, { marginTop: 14 }]}>MINIMUM QUANTITY</Text>
            <TextInput style={bs.formInput} value={minQty} onChangeText={setMinQty} keyboardType="number-pad" />

            <Text style={[bs.formLabel, { marginTop: 14 }]}>PROMOTION LIMIT (0 = unlimited)</Text>
            <TextInput style={bs.formInput} value={promotionLimit} onChangeText={setPromotionLimit} keyboardType="number-pad" />

            <TouchableOpacity style={bs.primaryBtn} onPress={savePromotionItem}>
              <Text style={bs.primaryBtnText}>Save Item Rule</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const promoStyles = {
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' as const },
  help: { color: '#6b7280', fontSize: 11, lineHeight: 17, marginBottom: 10 },
  actions: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 7, marginTop: 12 },
  action: { backgroundColor: '#161d2b', borderWidth: 1, borderColor: '#2d3748', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { color: '#d1d5db', fontSize: 10, fontWeight: '700' as const },
  dangerAction: { backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  dangerText: { color: '#ef4444', fontSize: 10, fontWeight: '700' as const },
  itemRule: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, backgroundColor: '#0d1117', borderRadius: 9, padding: 9, marginTop: 9 },
  itemName: { color: '#f9fafb', fontSize: 11, fontWeight: '700' as const },
  itemMeta: { color: '#6b7280', fontSize: 10, marginTop: 3 },
  smallDanger: { width: 28, height: 28, borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: 'rgba(239,68,68,0.10)' },
  smallDangerText: { color: '#ef4444', fontSize: 11, fontWeight: '900' as const },
  productOption: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 10, padding: 10, marginBottom: 7 },
  productOptionActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.12)' },
  selectedMark: { color: '#6366f1', fontSize: 9, fontWeight: '900' as const },
  typeRow: { flexDirection: 'row' as const, gap: 7, marginBottom: 12 },
  typeButton: { flex: 1, backgroundColor: '#161d2b', borderWidth: 1, borderColor: '#2d3748', borderRadius: 9, paddingVertical: 10, alignItems: 'center' as const },
  typeButtonActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.14)' },
  typeText: { color: '#9ca3af', fontSize: 10, fontWeight: '700' as const },
  typeTextActive: { color: '#6366f1' },
};
