import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Product } from '../types';
import { posDb } from '../database';
import { EmptyState, bs } from './shared';

type ProductForm = {
  name: string;
  code: string;
  barcode: string;
  price: string;
  cost: string;
  quantity: string;
  vat: string;
};

type CsvRow = Record<string, string>;
type Mapping = Record<keyof ProductForm, string>;

const FIELDS: Array<{ key: keyof ProductForm; label: string; required?: boolean; hint: string }> = [
  { key: 'name', label: 'Product Name', required: true, hint: 'Product description/name' },
  { key: 'code', label: 'Product Code', required: true, hint: 'Internal item/stock code' },
  { key: 'barcode', label: 'Barcode', hint: 'Optional scanner barcode' },
  { key: 'price', label: 'Price', required: true, hint: 'Selling price' },
  { key: 'cost', label: 'Cost', hint: 'Cost price' },
  { key: 'quantity', label: 'Quantity', hint: 'Opening stock quantity' },
  { key: 'vat', label: 'VAT', hint: 'Y or N' },
];

const EMPTY_FORM: ProductForm = {
  name: '',
  code: '',
  barcode: '',
  price: '',
  cost: '',
  quantity: '0',
  vat: 'Y',
};

const EMPTY_MAPPING: Mapping = {
  name: '',
  code: '',
  barcode: '',
  price: '',
  cost: '',
  quantity: '',
  vat: '',
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += ch;
    }
  }

  values.push(value.trim());
  return values;
}

function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV must contain a header row and at least one product row.');

  const headers = parseCsvLine(lines[0]).map((h, i) => h || `Column ${i + 1}`);
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });

  return { headers, rows };
}

function ProductsScreen({ products, search, onSearch, onAddToCart, storeId, onProductsChanged }: any) {
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState('');
  const [csvOpen, setCsvOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING);
  const [busy, setBusy] = useState(false);

  const setField = (key: keyof ProductForm, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.ItemDesc || '', code: p.ItemCode || p.StockCode || '', barcode: '', price: String(p.POSPrice1 || p.SellPrice1 || 0), cost: String(p.LastCost || 0), quantity: String(p.QtyOnHand || 0), vat: p.Vat || 'Y' });
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.price.trim()) {
      Alert.alert('Missing details', 'Product Name, Product Code and Price are required.'); return;
    }
    setBusy(true);
    try {
      if (editProduct) {
        await posDb.updateProduct({ itemId: editProduct.ItemId, stockId: editProduct.StockId, ...form, price: Number(form.price), cost: Number(form.cost || 0), quantity: Number(form.quantity || 0), storeId });
      } else {
        await posDb.createProduct({ ...form, price: Number(form.price), cost: Number(form.cost || 0), quantity: Number(form.quantity || 0), storeId });
      }
      setForm(EMPTY_FORM); setEditProduct(null); setAddOpen(false);
      await onProductsChanged?.();
      Alert.alert(editProduct ? 'Product Updated' : 'Product Added', `${form.name} was saved to SQLite.`);
    } catch (err: any) {
      Alert.alert('Product', err?.message || 'Could not save product.');
    } finally { setBusy(false); }
  };

  const confirmDelete = (p: Product) => {
    Alert.alert('Delete Product', `Delete "${p.ItemDesc}"? Its local product, price, barcode and stock records will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await posDb.deleteProduct(p.ItemId, p.StockId); await onProductsChanged?.(); }
        catch (err: any) { Alert.alert('Delete failed', err?.message || 'Could not delete product.'); }
      }},
    ]);
  };

  const applyStock = async () => {
    const delta = Number(stockDelta);
    if (!stockProduct || !Number.isFinite(delta) || delta === 0) {
      Alert.alert('Invalid adjustment', 'Enter a positive or negative stock amount.'); return;
    }
    setBusy(true);
    try {
      const next = await posDb.adjustProductStock(stockProduct.ItemId, stockProduct.StockId, storeId, delta);
      setStockProduct(null); setStockDelta(''); await onProductsChanged?.();
      Alert.alert('Stock Updated', `New quantity: ${next}`);
    } catch (err: any) { Alert.alert('Stock Adjustment', err?.message || 'Could not update stock.'); }
    finally { setBusy(false); }
  };

  const pickCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      const parsed = parseCsv(await (await fetch(asset.uri)).text());
      setHeaders(parsed.headers); setCsvRows(parsed.rows);
      setMapping({ ...EMPTY_MAPPING,
        name: guessColumn(parsed.headers, ['product name','name','description','itemdesc']),
        code: guessColumn(parsed.headers, ['product code','code','itemcode','stockcode']),
        barcode: guessColumn(parsed.headers, ['barcode','bar code','ean','upc']),
        price: guessColumn(parsed.headers, ['price','selling price','sell price','posprice1']),
        cost: guessColumn(parsed.headers, ['cost','cost price','last cost','lastcost']),
        quantity: guessColumn(parsed.headers, ['quantity','qty','stock','qtyonhand']),
        vat: guessColumn(parsed.headers, ['vat','tax'])
      });
      setCsvOpen(true);
    } catch (err: any) { Alert.alert('CSV Import', err?.message || 'Could not read that CSV file.'); }
  };

  const importCsv = async () => {
    const missing = FIELDS.filter(f => f.required && !mapping[f.key]);
    if (missing.length) { Alert.alert('Map required columns', missing.map(f => f.label).join(', ') + ' must be mapped.'); return; }
    setBusy(true);
    try {
      const rows = csvRows.map(row => ({
        name: row[mapping.name]?.trim() || '', code: row[mapping.code]?.trim() || '',
        barcode: mapping.barcode ? row[mapping.barcode]?.trim() || '' : '',
        price: Number(row[mapping.price] || 0), cost: mapping.cost ? Number(row[mapping.cost] || 0) : 0,
        quantity: mapping.quantity ? Number(row[mapping.quantity] || 0) : 0, vat: mapping.vat ? row[mapping.vat]?.trim() || 'Y' : 'Y'
      }));
      const result = await posDb.importProducts(rows, storeId);
      await onProductsChanged?.(); setCsvOpen(false);
      Alert.alert('CSV Import Complete', `${result.imported} imported, ${result.skipped} skipped.${result.errors.length ? '\\n\\n' + result.errors.slice(0, 3).join('\\n') : ''}`);
    } catch (err: any) { Alert.alert('CSV Import', err?.message || 'Import failed.'); }
    finally { setBusy(false); }
  };

  const formModal = (editing: boolean) => (
    <Modal visible={editing ? !!editProduct : addOpen} animationType="slide" onRequestClose={() => { setEditProduct(null); setAddOpen(false); }}>
      <View style={bs.modalRoot}>
        <View style={bs.modalHeader}><Text style={bs.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</Text><TouchableOpacity onPress={() => { setEditProduct(null); setAddOpen(false); }}><Text style={bs.modalClose}>Close</Text></TouchableOpacity></View>
        <ScrollView contentContainerStyle={bs.modalContent}>
          {FIELDS.map(field => <View key={field.key} style={bs.formGroup}>
            <Text style={bs.formLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TextInput style={bs.formInput} placeholder={field.hint} placeholderTextColor="#4b5563" value={form[field.key]} onChangeText={v => setField(field.key, v)} keyboardType={['price','cost','quantity'].includes(field.key) ? 'decimal-pad' : 'default'} autoCapitalize={field.key === 'vat' ? 'characters' : 'sentences'} />
          </View>)}
          <TouchableOpacity style={[bs.primaryBtn, busy && bs.btnDisabled]} disabled={busy} onPress={saveProduct}><Text style={bs.primaryBtnText}>{editing ? 'Save Changes' : 'Save Product'}</Text></TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return <View style={{ flex: 1 }}>
    <View style={bs.searchBar}>
      <TextInput style={bs.searchInput} placeholder="Search by name, code..." placeholderTextColor="#4b5563" value={search} onChangeText={onSearch} autoCorrect={false} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TouchableOpacity style={[bs.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={() => { setForm(EMPTY_FORM); setEditProduct(null); setAddOpen(true); }}><Text style={bs.primaryBtnText}>+ Add Product</Text></TouchableOpacity>
        <TouchableOpacity style={[bs.ghostBtn, { flex: 1, marginTop: 0 }]} onPress={pickCsv}><Text style={bs.ghostBtnText}>Import CSV</Text></TouchableOpacity>
      </View>
    </View>
    <FlatList data={products} keyExtractor={(item: Product, i) => `${item.ItemId}-${item.StockId}-${i}`} contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      ListEmptyComponent={<EmptyState icon="P" title="No products" sub="Add a product or import a CSV file" />}
      renderItem={({ item: p }: { item: Product }) => <View style={bs.productCard}>
        <View style={bs.productTop}><View style={{ flex: 1 }}><Text style={bs.productName} numberOfLines={2}>{p.ItemDesc}</Text><Text style={bs.productCode}>{p.StockCode}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={bs.productPrice}>R {(p.POSPrice1 > 0 ? p.POSPrice1 : p.SellPrice1).toFixed(2)}</Text><Text style={bs.listSub}>Qty: {p.QtyOnHand}</Text></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <TouchableOpacity style={[bs.addBtn, { flex: 1, minWidth: 70 }]} onPress={() => onAddToCart(p.StockCode)}><Text style={bs.addBtnText}>+ Cart</Text></TouchableOpacity>
          <TouchableOpacity style={[bs.addBtn, { flex: 1, minWidth: 70 }]} onPress={() => openEdit(p)}><Text style={bs.addBtnText}>Edit</Text></TouchableOpacity>
          <TouchableOpacity style={[bs.addBtn, { flex: 1, minWidth: 70 }]} onPress={() => setStockProduct(p)}><Text style={bs.addBtnText}>Stock</Text></TouchableOpacity>
          <TouchableOpacity style={[bs.dangerBtn, { flex: 1, minWidth: 70 }]} onPress={() => confirmDelete(p)}><Text style={bs.dangerBtnText}>Delete</Text></TouchableOpacity>
        </View>
      </View>}
    />
    {formModal(false)}{formModal(true)}
    <Modal visible={!!stockProduct} animationType="slide" transparent onRequestClose={() => setStockProduct(null)}>
      <View style={bs.overlay}><View style={bs.dialog}><Text style={bs.modalTitle}>Adjust Stock</Text><Text style={bs.modalSub}>{stockProduct?.ItemDesc} • Current: {stockProduct?.QtyOnHand ?? 0}</Text>
        <Text style={bs.formLabel}>Adjustment</Text><TextInput style={bs.formInput} value={stockDelta} onChangeText={setStockDelta} keyboardType="numbers-and-punctuation" placeholder="+10 or -2" placeholderTextColor="#4b5563" />
        <Text style={bs.helpText}>Positive adds stock. Negative removes stock.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}><TouchableOpacity style={[bs.ghostBtn,{flex:1}]} onPress={() => setStockProduct(null)}><Text style={bs.ghostBtnText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[bs.primaryBtn,{flex:1}]} disabled={busy} onPress={applyStock}><Text style={bs.primaryBtnText}>Apply</Text></TouchableOpacity></View>
      </View></View>
    </Modal>
    <Modal visible={csvOpen} animationType="slide" onRequestClose={() => setCsvOpen(false)}>
      <View style={bs.modalRoot}><View style={bs.modalHeader}><View><Text style={bs.modalTitle}>Map CSV Columns</Text><Text style={bs.modalSub}>{csvRows.length} product row(s)</Text></View><TouchableOpacity onPress={() => setCsvOpen(false)}><Text style={bs.modalClose}>Cancel</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={bs.modalContent}><Text style={bs.helpText}>Map each CSV column to a product field. Required fields are marked *.</Text>
        {FIELDS.map(field => <ColumnPicker key={field.key} label={field.label + (field.required ? ' *' : '')} value={mapping[field.key]} headers={headers} onChange={v => setMapping(prev => ({...prev,[field.key]:v}))} />)}
        <View style={bs.previewBox}><Text style={bs.previewTitle}>Preview</Text>{csvRows.slice(0,3).map((row,i)=><Text key={i} style={bs.previewText}>{row[mapping.name] || '(name not mapped)'} | R {row[mapping.price] || '0'}</Text>)}</View>
        <TouchableOpacity style={[bs.primaryBtn,busy&&bs.btnDisabled]} disabled={busy} onPress={importCsv}><Text style={bs.primaryBtnText}>Import Products</Text></TouchableOpacity>
      </ScrollView></View>
    </Modal>
  </View>;
}

function ColumnPicker({
  label,
  value,
  headers,
  onChange,
}: {
  label: string;
  value: string;
  headers: string[];
  onChange: (value: string) => void;
}) {
  const options = useMemo(() => ['', ...headers], [headers]);
  const currentIndex = Math.max(0, options.indexOf(value));

  return (
    <View style={bs.formGroup}>
      <Text style={bs.formLabel}>{label}</Text>
      <TouchableOpacity
        style={bs.formInput}
        onPress={() => onChange(options[(currentIndex + 1) % options.length])}
      >
        <Text style={value ? bs.formValue : bs.formPlaceholder}>
          {value || 'Tap to choose CSV column'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function guessColumn(headers: string[], names: string[]): string {
  const normal = (value: string) => value.toLowerCase().replace(/[_-]/g, ' ').trim();
  const candidates = names.map(normal);
  return headers.find(header => candidates.includes(normal(header))) || '';
}

export default ProductsScreen;
