
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView,
  Modal, SafeAreaView, StatusBar, Alert, ActivityIndicator,
  Animated, Dimensions, FlatList,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product, Store, Customer, CartItem, Quote, Invoice, Promotion, StockTakeItem } from './src/types';
import { posDb } from './src/database';
import PosScreen from './src/screens/PosScreen';
import QuotesScreen from './src/screens/QuotesScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import StocktakeScreen from './src/screens/StocktakeScreen';
import PromotionsScreen from './src/screens/PromotionsScreen';
import StoresScreen from './src/screens/StoresScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DocumentDetailScreen from './src/screens/DocumentDetailScreen';
import { generateDocumentPdf } from './src/services/DocumentService';

const { width: SCREEN_W } = Dimensions.get('window');
void SCREEN_W;

type TabKey =
  | 'pos'
  | 'quotes'
  | 'invoices'
  | 'products'
  | 'customers'
  | 'promotions'
  | 'stocktake'
  | 'stores'
  | 'settings'
  | 'more';

const TABS: { key: TabKey; label: string; abbr: string }[] = [
  { key: 'pos',       label: 'POS',      abbr: 'POS' },
  { key: 'quotes',    label: 'Quotes',   abbr: 'QT'  },
  { key: 'invoices',  label: 'Invoices', abbr: 'INV' },
  { key: 'products',  label: 'Items',    abbr: 'ITM' },
];

const DRAWER_TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'pos',         label: 'Point of Sale', icon: 'POS' },
  { key: 'quotes',      label: 'Quotes',        icon: 'QT' },
  { key: 'invoices',    label: 'Invoices',      icon: 'INV' },
  { key: 'products',    label: 'Products',      icon: 'ITM' },
  { key: 'customers',   label: 'Customers',     icon: 'CUS' },
  { key: 'stocktake',   label: 'Stock Take',    icon: 'STK' },
  { key: 'promotions',  label: 'Promotions',    icon: 'PRO' },
  { key: 'stores',      label: 'Stores',        icon: 'STR' },
  { key: 'settings',    label: 'Settings',      icon: 'SET' },
];

function AppContent() {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('pos');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMsg, setScanMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [quotesList, setQuotesList] = useState<Quote[]>([]);
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [promotionsList, setPromotionsList] = useState<Promotion[]>([]);
  const [stockScans, setStockScans] = useState<StockTakeItem[]>([]);
  const [documentDetail, setDocumentDetail] = useState<{ type: 'INVOICE' | 'QUOTE'; number: string } | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const scannerLock = useRef(false);

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    if (currentStore) {
      loadStoreData(currentStore.StoreId);
    }
  }, [currentStore]);

  const initApp = async () => {
    try {
      setLoading(true);

      const [storesData, custData] = await Promise.all([
        posDb.getStores(),
        posDb.getCustomers(),
      ]);

      setStores(storesData);
      setCustomers(custData);

      if (storesData.length > 0) {
        setCurrentStore(storesData[0]);
      } else {
        // Fresh installs intentionally start without seeded business data.
        // Keep the default local store ID so products can still be created and listed.
        await loadStoreData(1);
      }
    } catch (err: any) {
      Alert.alert('Startup Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreData = async (storeId: number) => {
    try {
      const [prods, promos] = await Promise.all([
        posDb.searchProducts('', storeId, 50),
        posDb.getPromotions(storeId),
      ]);

      setProductsList(prods);
      setPromotionsList(promos);
    } catch (_) {}
  };

  const handleTabChange = async (tab: TabKey) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    setDocumentDetail(null);

    if (tab === 'quotes') {
      setQuotesList(await posDb.getQuotes());
    }

    if (tab === 'invoices') {
      setInvoicesList(await posDb.getInvoices());
    }

    if (tab === 'customers' && customerSearch === '') {
      setCustomers(await posDb.getCustomers());
    }
  };

  const flashBanner = (type: 'ok' | 'err', text: string) => {
    setScanMsg({ type, text });

    Animated.sequence([
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2600),
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setScanMsg(null));
  };

  const handleScan = useCallback(async (raw?: string) => {
    const code = (raw || barcodeInput).trim();

    if (!code || scannerLock.current) return;

    scannerLock.current = true;

    setTimeout(() => {
      scannerLock.current = false;
    }, 1500);

    try {
      const storeId = currentStore?.StoreId ?? 1;
      const product = await posDb.getProductByBarcode(code, storeId);

      if (activeTab === 'stocktake') {
        setStockScans(prev => [
          {
            barcode: code,
            product,
            qty: 1,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);

        flashBanner('ok', 'Counted: ' + product.ItemDesc);
        setBarcodeInput('');
        return;
      }

      const pr = await posDb.checkPrice(
        product.ItemId,
        product.StockId,
        selectedCustomer?.AccId,
        storeId
      );

      const up = pr.unit_price;
      const excl = r2(up / 1.15);
      const vat = r2(up - excl);

      setCart(prev => {
        const idx = prev.findIndex(
          ci =>
            ci.product.ItemId === product.ItemId &&
            ci.product.StockId === product.StockId
        );

        if (idx >= 0) {
          const updated = [...prev];
          const newQty = updated[idx].qty + 1;

          updated[idx] = {
            ...updated[idx],
            qty: newQty,
            amount: r2(newQty * up),
          };

          return updated;
        }

        return [
          {
            product,
            qty: 1,
            unit_price: up,
            unit_excl: excl,
            unit_incl: up,
            vat_amount: vat,
            disc_perc: 0,
            amount: up,
            price_source: pr.price_source,
            promotion_id: pr.promotion_id,
            promotion_desc: pr.promotion_desc,
          },
          ...prev,
        ];
      });

      flashBanner(
        'ok',
        product.ItemDesc +
          '  R' +
          up.toFixed(2) +
          '  [' +
          pr.price_source +
          ']'
      );

      setBarcodeInput('');
    } catch (err: any) {
      flashBanner(
        'err',
        err.message || 'Code not found: ' + code
      );
    }
  }, [barcodeInput, activeTab, currentStore, selectedCustomer]);

  const r2 = (v: number) => Math.round(v * 100) / 100;

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[idx].qty + delta;

      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }

      updated[idx] = {
        ...updated[idx],
        qty: newQty,
        amount: r2(newQty * updated[idx].unit_price),
      };

      return updated;
    });
  };

  const removeItem = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const subExcl = r2(
    cart.reduce((a, i) => a + i.unit_excl * i.qty, 0)
  );

  const subVat = r2(
    cart.reduce((a, i) => a + i.vat_amount * i.qty, 0)
  );

  const subTotal = r2(
    cart.reduce((a, i) => a + i.amount, 0)
  );

  const handleCreateInvoice = async (payment: { method: string; amountReceived: number }) => {
    if (cart.length === 0) return;

    try {
      const res = await posDb.createInvoice({
        acc_id: selectedCustomer?.AccId ?? 1,
        store_id: currentStore?.StoreId ?? 1,
        company:
          selectedCustomer?.Company ??
          'Walk-In Cash Customer',
        sub_total: subExcl,
        vat_total: subVat,
        amt_paid: payment.amountReceived,
        pm_ref: payment.method,
        items: cart.map(c => ({
          item_id: c.product.ItemId,
          stock_id: c.product.StockId,
          item_desc: c.product.ItemDesc,
          qty: c.qty,
          unit_excl: c.unit_excl,
          unit_incl: c.unit_incl,
          vat_amount: c.vat_amount,
          amount: c.amount,
          promotion_id: c.promotion_id,
        })),
      });

      let pdfPath: string | null = null;
      try {
        pdfPath = await generateDocumentPdf('INVOICE', {
          number: res.inv_no,
          company: selectedCustomer?.Company ?? 'Walk-In Cash Customer',
          date: new Date().toLocaleString(),
          storeName: currentStore?.StoreDesc,
          storeCode: currentStore?.StoreCode,
          tel: currentStore?.Tel,
          email: currentStore?.Email,
          subtotal: subExcl,
          vatTotal: subVat,
          total: subTotal,
          paymentMethod: payment.method,
          items: cart.map(c => ({
            ItemDesc: c.product.ItemDesc,
            Qty: c.qty,
            UnitExcl: c.unit_excl,
            UnitIncl: c.unit_incl,
            VatAmount: c.vat_amount,
            Amount: c.amount,
          })),
        });
        await posDb.setInvoicePdfPath(res.inv_no, pdfPath);
      } catch (pdfError: any) {
        Alert.alert('Sale Saved', 'Invoice ' + res.inv_no + ' was saved, but the PDF could not be generated: ' + pdfError.message);
        setCart([]);
        return;
      }

      Alert.alert('Sale Complete!', 'Invoice ' + res.inv_no + ' saved with PDF.');
      setCart([]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateQuote = async () => {
    if (cart.length === 0) return;

    try {
      const res = await posDb.createQuote({
        acc_id: selectedCustomer?.AccId ?? 1,
        store_id: currentStore?.StoreId ?? 1,
        company:
          selectedCustomer?.Company ??
          'Walk-In Cash Customer',
        sub_total: subExcl,
        vat_total: subVat,
        items: cart.map(c => ({
          item_id: c.product.ItemId,
          stock_id: c.product.StockId,
          item_desc: c.product.ItemDesc,
          qty: c.qty,
          unit_excl: c.unit_excl,
          unit_incl: c.unit_incl,
          vat_amount: c.vat_amount,
          amount: c.amount,
          promotion_id: c.promotion_id,
        })),
      });

      try {
        const pdfPath = await generateDocumentPdf('QUOTE', {
          number: res.quote_no,
          company: selectedCustomer?.Company ?? 'Walk-In Cash Customer',
          date: new Date().toLocaleString(),
          storeName: currentStore?.StoreDesc,
          storeCode: currentStore?.StoreCode,
          tel: currentStore?.Tel,
          email: currentStore?.Email,
          subtotal: subExcl,
          vatTotal: subVat,
          total: subTotal,
          items: cart.map(c => ({
            ItemDesc: c.product.ItemDesc,
            Qty: c.qty,
            UnitExcl: c.unit_excl,
            UnitIncl: c.unit_incl,
            VatAmount: c.vat_amount,
            Amount: c.amount,
          })),
        });
        await posDb.setQuotePdfPath(res.quote_no, pdfPath);
      } catch (pdfError: any) {
        Alert.alert('Quote Saved', 'Quote ' + res.quote_no + ' was saved, but the PDF could not be generated: ' + pdfError.message);
        setCart([]);
        return;
      }

      Alert.alert('Quote Saved!', 'Quote ' + res.quote_no + ' saved with PDF.');
      setCart([]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();

      if (!res.granted) {
        Alert.alert(
          'Permission Denied',
          'Camera access is required.'
        );
        return;
      }
    }

    setCameraOpen(true);
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      setProductsList(
        await posDb.searchProducts(
          productSearch,
          currentStore?.StoreId ?? 1,
          50
        )
      );
    }, 350);

    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setCustomers(
        await posDb.getCustomers(customerSearch)
      );
    }, 350);

    return () => clearTimeout(t);
  }, [customerSearch]);

  if (loading) {
    return (
      <View style={bs.splash}>
        <View style={bs.splashGlow} />

        <ActivityIndicator
          size="large"
          color="#6366f1"
        />

        <Text style={bs.splashTitle}>
          Mobile POS
        </Text>

        <Text style={bs.splashSub}>
          Initialising local database...
        </Text>
      </View>
    );
  }

  return (
    <View style={bs.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#07090f"
        translucent={false}
      />

      {/* Header */}
      <View
        style={[
          bs.header,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <View style={bs.headerLeft}>
          <View style={bs.logoChip}>
            <Text style={bs.logoChipText}>
              POS
            </Text>
          </View>

          <View>
            <Text style={bs.headerTitle}>
              Mobile Point of Sale
            </Text>

            <Text style={bs.headerSub}>
              {currentStore?.StoreDesc ??
                'No store selected'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={bs.scanFab}
          onPress={openCamera}
        >
          <Text style={bs.scanFabText}>
            [ Scan ]
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barcode bar */}
      <View style={bs.barcodeBar}>
        <TextInput
          style={bs.barcodeInput}
          placeholder="Enter or scan item code..."
          placeholderTextColor="#4b5563"
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          onSubmitEditing={() => handleScan()}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        <TouchableOpacity
          style={bs.barcodeAddBtn}
          onPress={() => handleScan()}
        >
          <Text style={bs.barcodeAddText}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Animated banner */}
      {scanMsg && (
        <Animated.View
          style={[
            bs.banner,
            scanMsg.type === 'ok'
              ? bs.bannerOk
              : bs.bannerErr,
            {
              opacity: bannerAnim,
            },
          ]}
        >
          <Text
            style={
              scanMsg.type === 'ok'
                ? bs.bannerTextOk
                : bs.bannerTextErr
            }
          >
            {scanMsg.text}
          </Text>
        </Animated.View>
      )}

      {/* Tab body */}
      <View style={bs.body}>
        {activeTab === 'pos' && (
          <PosScreen
            cart={cart}
            selectedCustomer={selectedCustomer}
            subExcl={subExcl}
            subVat={subVat}
            subTotal={subTotal}
            onQtyChange={updateQty}
            onRemove={removeItem}
            onInvoice={handleCreateInvoice}
            onQuote={handleCreateQuote}
            onChangeCustomer={() =>
              handleTabChange('customers')
            }
          />
        )}

        {activeTab === 'quotes' && (
          documentDetail?.type === 'QUOTE'
            ? <DocumentDetailScreen type="QUOTE" number={documentDetail.number} onClose={() => setDocumentDetail(null)} />
            : <QuotesScreen quotes={quotesList} onSelect={number => setDocumentDetail({ type: 'QUOTE', number })} />
        )}

        {activeTab === 'invoices' && (
          documentDetail?.type === 'INVOICE'
            ? <DocumentDetailScreen type="INVOICE" number={documentDetail.number} onClose={() => setDocumentDetail(null)} />
            : <InvoicesScreen invoices={invoicesList} onSelect={number => setDocumentDetail({ type: 'INVOICE', number })} />
        )}

        {activeTab === 'products' && (
          <ProductsScreen
            products={productsList}
            search={productSearch}
            onSearch={setProductSearch}
            onAddToCart={handleScan}
            storeId={currentStore?.StoreId ?? 1}
            onProductsChanged={() =>
              loadStoreData(currentStore?.StoreId ?? 1)
            }
          />
        )}

        {activeTab === 'customers' && (
          <CustomersScreen
            customers={customers}
            search={customerSearch}
            onSearch={setCustomerSearch}
            selected={selectedCustomer}
            onSelect={(c: Customer) => {
              setSelectedCustomer(c);
              handleTabChange('pos');
            }}
          />
        )}

        {activeTab === 'stocktake' && (
          <StocktakeScreen scans={stockScans} />
        )}

        {activeTab === 'promotions' && (
          <PromotionsScreen promos={promotionsList} />
        )}

        {activeTab === 'stores' && (
          <StoresScreen
            stores={stores}
            current={currentStore}
            onSwitch={setCurrentStore}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            currentStore={currentStore}
            onManageStores={() => handleTabChange('stores')}
          />
        )}
      </View>

      {/* Side navigation */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={bs.drawerOverlay}>
          <View
            style={[
              bs.drawer,
              {
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <View style={bs.drawerHeader}>
              <View>
                <Text style={bs.drawerTitle}>Mobile POS</Text>
                <Text style={bs.drawerSub}>Navigation</Text>
              </View>
              <TouchableOpacity
                style={bs.drawerClose}
                onPress={() => setDrawerOpen(false)}
              >
                <Text style={bs.drawerCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            >
              {DRAWER_TABS.map(item => {
                const active = activeTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[bs.drawerItem, active && bs.drawerItemActive]}
                    onPress={() => handleTabChange(item.key)}
                  >
                    <View style={[bs.drawerIcon, active && bs.drawerIconActive]}>
                      <Text style={[bs.drawerIconText, active && bs.drawerIconTextActive]}>
                        {item.icon}
                      </Text>
                    </View>
                    <Text style={[bs.drawerLabel, active && bs.drawerLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={bs.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />
        </View>
      </Modal>

      {/* Camera modal */}
      <Modal
        visible={cameraOpen}
        animationType="slide"
        statusBarTranslucent
      >
        <SafeAreaView style={bs.cameraRoot}>
          <View style={bs.cameraHeader}>
            <Text style={bs.cameraTitle}>
              Scan Barcode
            </Text>

            <TouchableOpacity
              style={bs.cameraClose}
              onPress={() => setCameraOpen(false)}
            >
              <Text style={bs.cameraCloseText}>
                X  Close
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              onBarcodeScanned={({ data }) => {
                setCameraOpen(false);
                handleScan(data);
              }}
            />

            <View
              style={bs.viewfinder}
              pointerEvents="none"
            >
              <View style={bs.vfTL} />
              <View style={bs.vfTR} />
              <View style={bs.vfBL} />
              <View style={bs.vfBR} />
            </View>
          </View>

          <View style={bs.cameraTip}>
            <Text style={bs.cameraTipText}>
              Point camera at barcode to scan automatically
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Bottom navigation */}
      <View
        style={[
          bs.nav,
          {
            paddingBottom: insets.bottom + 6,
          },
        ]}
      >
        {TABS.map(t => {
          const active = activeTab === t.key;

          return (
            <TouchableOpacity
              key={t.key}
              style={bs.navItem}
              onPress={() => handleTabChange(t.key)}
            >
              <View style={[bs.navPill, active && bs.navPillActive]}>
                <Text style={[bs.navAbbr, active && bs.navAbbrActive]}>
                  {t.abbr}
                </Text>
              </View>
              <Text style={[bs.navLabel, active && bs.navLabelActive]}>
                {t.label}
              </Text>
              {active && <View style={bs.navDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const bs = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090f',
  },

  screen: {
    flex: 1,
    paddingHorizontal: 12,
  },

  body: {
    flex: 1,
  },

  divider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 10,
  },

  splash: {
    flex: 1,
    backgroundColor: '#07090f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  splashGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99,102,241,0.10)',
    top: '28%',
  },

  splashTitle: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
  },

  splashSub: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  headerTitle: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '700',
  },

  headerSub: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 1,
  },

  logoChip: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  logoChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  scanFab: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  scanFabText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
  },

  barcodeBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },

  barcodeInput: {
    flex: 1,
    backgroundColor: '#161d2b',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: '#f9fafb',
    fontSize: 13,
  },

  barcodeAddBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },

  barcodeAddText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },

  banner: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  bannerOk: {
    backgroundColor: 'rgba(16,185,129,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },

  bannerErr: {
    backgroundColor: 'rgba(239,68,68,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },

  bannerTextOk: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },

  bannerTextErr: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 10,
  },

  sectionBar: {
    width: 3,
    height: 16,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },

  sectionText: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 2,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },

  emptyIcon: {
    fontSize: 34,
    color: '#374151',
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '700',
  },

  emptySub: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 220,
    marginTop: 4,
  },

  customerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  customerLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  customerValue: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  changePill: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  changePillText: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
  },

  cartCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  cartTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  cartName: {
    flex: 1,
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  cartCode: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 3,
    marginBottom: 6,
  },

  cartX: {
    padding: 4,
  },

  cartXText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },

  cartBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  qtyBtn: {
    backgroundColor: '#374151',
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qtyBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },

  qtyVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },

  cartPrice: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 'auto',
  },

  totalsBox: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  totalsLbl: {
    color: '#9ca3af',
    fontSize: 13,
  },

  totalsVal: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },

  grandLbl: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  grandVal: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: '900',
  },

  primaryBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },

  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  ghostBtn: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  ghostBtnText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
  },

  btnDisabled: {
    opacity: 0.4,
  },

  listCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },

  listTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },

  listSub: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },

  listPrice: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '800',
  },

  searchBar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },

  searchInput: {
    backgroundColor: '#161d2b',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f9fafb',
    fontSize: 13,
  },

  productCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  productTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  productName: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  productCode: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },

  productPrice: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '800',
  },

  addBtn: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },

  addBtnText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '800',
  },

  cameraRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },

  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },

  cameraTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },

  cameraClose: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 20,
  },

  cameraCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  cameraTip: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },

  cameraTipText: {
    color: '#6b7280',
    fontSize: 13,
  },

  viewfinder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vfTL: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#6366f1',
    borderRadius: 2,
  },

  vfTR: {
    position: 'absolute',
    top: '30%',
    right: '15%',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#6366f1',
    borderRadius: 2,
  },

  vfBL: {
    position: 'absolute',
    bottom: '30%',
    left: '15%',
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#6366f1',
    borderRadius: 2,
  },

  vfBR: {
    position: 'absolute',
    bottom: '30%',
    right: '15%',
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#6366f1',
    borderRadius: 2,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#161d2b',
    borderWidth: 1,
    borderColor: '#2d3748',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuButtonText: {
    color: '#f9fafb',
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 25,
  },

  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  drawer: {
    width: 310,
    maxWidth: '86%',
    backgroundColor: '#0d1117',
    borderRightWidth: 1,
    borderRightColor: '#1f2937',
  },

  drawerBackdrop: {
    flex: 1,
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },

  drawerTitle: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: '800',
  },

  drawerSub: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },

  drawerClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#161d2b',
    alignItems: 'center',
    justifyContent: 'center',
  },

  drawerCloseText: {
    color: '#9ca3af',
    fontSize: 28,
    lineHeight: 30,
  },

  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    marginHorizontal: 10,
    marginVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  drawerItemActive: {
    backgroundColor: 'rgba(99,102,241,0.14)',
  },

  drawerIcon: {
    width: 44,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#161d2b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  drawerIconActive: {
    backgroundColor: 'rgba(99,102,241,0.20)',
  },

  drawerIconText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '900',
  },

  drawerIconTextActive: {
    color: '#6366f1',
  },

  drawerLabel: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '600',
  },

  drawerLabelActive: {
    color: '#f9fafb',
    fontWeight: '800',
  },

  nav: {
    flexDirection: 'row',
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingBottom: 6,
    minHeight: 82,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 7,
    paddingBottom: 4,
    position: 'relative',
  },

  navPill: {
    borderRadius: 12,
    minWidth: 54,
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignItems: 'center',
  },

  navPillActive: {
    backgroundColor: 'rgba(99,102,241,0.15)',
  },

  navAbbr: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  navAbbrActive: {
    color: '#6366f1',
  },

  navLabel: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 4,
    fontWeight: '700',
  },

  navLabelActive: {
    color: '#6366f1',
  },

  navDot: {
    position: 'absolute',
    bottom: 1,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
});

