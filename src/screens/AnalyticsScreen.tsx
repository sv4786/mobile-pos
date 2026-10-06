import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { File } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { posDb } from '../database';
import { EmptyState, SectionHeader, bs } from './shared';
import { generateAnalyticsPdf, generateBusinessReportPdf, shareDocumentPdf } from '../services/DocumentService';

type Props = {
  storeId: number;
  storeName?: string;
  storeCode?: string;
};

export default function AnalyticsScreen({ storeId, storeName, storeCode }: Props) {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setData(await posDb.getAnalytics(storeId)); } catch (_) {}
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const money = (n: any) => 'R ' + Number(n || 0).toFixed(2);

  const openPdf = async (uri: string) => {
    try {
      const file = new File(uri);
      if (!file.exists) throw new Error('The analytics PDF no longer exists.');
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: file.contentUri,
        type: 'application/pdf',
        flags: 1,
      });
    } catch (e: any) {
      Alert.alert('Open PDF', e?.message || 'No PDF viewer is available on this device.');
    }
  };

  const exportPdf = async () => {
    try {
      if (!data) return;
      const uri = await generateAnalyticsPdf({
        storeName,
        storeCode,
        date: new Date().toLocaleString(),
        summary: data.summary || { invoiceCount: 0, revenue: 0, vat: 0, paid: 0 },
        salesTrend: data.salesTrend || [],
        popularItems: data.popularItems || [],
        topRevenue: data.topRevenue || [],
        paymentMethods: data.paymentMethods || [],
        customerSales: data.customerSales || [],
        lowStock: data.lowStock || [],
      });
      setPdfUri(uri);
      Alert.alert('Analytics PDF ready', 'The report has been saved on this device.');
    } catch (e: any) {
      Alert.alert('PDF export failed', e?.message || 'Could not generate the analytics PDF.');
    }
  };

  if (!data) return <View style={bs.screen}><EmptyState icon="A" title="Loading analytics" sub="Calculating sales insights..." /></View>;

  const trend = data.salesTrend || [];
  const trendMax = Math.max(1, ...trend.map((x: any) => Number(x.revenue || 0)));
  const popular = (data.popularItems || []).slice(0, 6);
  const popularMax = Math.max(1, ...popular.map((x: any) => Number(x.units || 0)));
  const paymentMax = Math.max(1, ...(data.paymentMethods || []).map((x: any) => Number(x.amount || 0)));

  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>

      <SectionHeader title="Sales Analytics" />

      <TouchableOpacity style={bs.analyticsExportBtn} onPress={exportPdf}>
        <Text style={bs.analyticsExportText}>Export Analytics PDF</Text>
      </TouchableOpacity>

      {pdfUri && (
        <View style={bs.analyticsPdfActions}>
          <TouchableOpacity style={bs.analyticsPdfBtn} onPress={() => openPdf(pdfUri)}>
            <Text style={bs.analyticsPdfBtnText}>Open PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={bs.analyticsPdfBtn} onPress={() => shareDocumentPdf(pdfUri)}>
            <Text style={bs.analyticsPdfBtnText}>Share PDF</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={bs.listCard}>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Total revenue</Text><Text style={bs.grandVal}>{money(data.summary?.revenue)}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Invoices</Text><Text style={bs.totalsVal}>{data.summary?.invoiceCount || 0}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Average sale</Text><Text style={bs.totalsVal}>{money(Number(data.summary?.revenue || 0) / Math.max(1, Number(data.summary?.invoiceCount || 0)))}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>VAT collected</Text><Text style={bs.totalsVal}>{money(data.summary?.vat)}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Amount paid</Text><Text style={bs.totalsVal}>{money(data.summary?.paid)}</Text></View>
      </View>

      <SectionHeader title="Business Reports" />
      <View style={bs.listCard}>
        <Text style={bs.listSub}>Generate a detailed sales, profit, customer, payment and stock report for a date range.</Text>
        <TextInput style={bs.formInput} value={reportFrom} onChangeText={setReportFrom} placeholder="From date YYYY-MM-DD" placeholderTextColor="#4b5563" />
        <TextInput style={bs.formInput} value={reportTo} onChangeText={setReportTo} placeholder="To date YYYY-MM-DD" placeholderTextColor="#4b5563" />
        <TouchableOpacity style={bs.primaryBtn} onPress={exportBusinessReport}><Text style={bs.primaryBtnText}>Generate Business Report PDF</Text></TouchableOpacity>
        {businessReport && <Text style={bs.listSub}>Revenue: R {Number(businessReport.sales.revenue).toFixed(2)}  •  Gross profit: R {Number(businessReport.profit.grossProfit).toFixed(2)}  •  Margin: {Number(businessReport.profit.margin).toFixed(1)}%</Text>}
      </View>

      <SectionHeader title="Revenue Trend" />
      {trend.length === 0 ? (
        <EmptyState icon="R" title="No sales yet" sub="Daily revenue will appear after invoices are created." />
      ) : (
        <View style={bs.analyticsChartCard}>
          <Text style={bs.analyticsChartTitle}>Daily revenue, last 30 sales days</Text>
          <View style={bs.analyticsBars}>
            {trend.map((x: any, i: number) => {
              const value = Number(x.revenue || 0);
              const height = Math.max(8, (value / trendMax) * 130);
              return (
                <View key={i} style={bs.analyticsBarCol}>
                  <Text style={bs.analyticsBarValue}>{value > 0 ? Math.round(value) : ''}</Text>
                  <View style={[bs.analyticsBar, { height }]} />
                  <Text style={bs.analyticsBarLabel}>{String(x.day || '').slice(5)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <SectionHeader title="Popular Items" />
      {popular.length === 0 ? <EmptyState icon="P" title="No sales yet" sub="Popular products will appear after invoices are created." /> :
        <View style={bs.analyticsChartCard}>
          <Text style={bs.analyticsChartTitle}>Units sold</Text>
          {popular.map((x: any, i: number) => {
            const units = Number(x.units || 0);
            return (
              <View key={i} style={bs.analyticsHBarRow}>
                <Text style={bs.analyticsHBarLabel} numberOfLines={1}>{i + 1}. {x.ItemDesc}</Text>
                <View style={bs.analyticsHBarTrack}><View style={[bs.analyticsHBarFill, { width: `${Math.max(3, (units / popularMax) * 100)}%` }]} /></View>
                <Text style={bs.analyticsHBarValue}>{units}</Text>
              </View>
            );
          })}
        </View>
      }

      <SectionHeader title="Payment Methods" />
      {(data.paymentMethods || []).length === 0 ? <Text style={bs.listSub}>No payments recorded yet.</Text> :
        <View style={bs.analyticsChartCard}>
          {(data.paymentMethods || []).map((x: any, i: number) => (
            <View key={i} style={bs.analyticsHBarRow}>
              <Text style={bs.analyticsHBarLabel}>{x.method}</Text>
              <View style={bs.analyticsHBarTrack}><View style={[bs.analyticsHBarFill, { width: `${Math.max(3, (Number(x.amount || 0) / paymentMax) * 100)}%` }]} /></View>
              <Text style={bs.analyticsHBarValue}>{money(x.amount)}</Text>
            </View>
          ))}
        </View>
      }

      <SectionHeader title="Top Revenue Items" />
      {(data.topRevenue || []).map((x: any, i: number) => (
        <View key={i} style={bs.listCard}>
          <View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{i+1}. {x.ItemDesc}</Text><Text style={bs.listPrice}>{money(x.sales)}</Text></View>
          <Text style={bs.listSub}>{Number(x.units||0)} units sold</Text>
        </View>
      ))}

      <SectionHeader title="Top Customers" />
      {(data.customerSales || []).map((x: any, i: number) => (
        <View key={i} style={bs.listCard}>
          <View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{i+1}. {x.customer}</Text><Text style={bs.listPrice}>{money(x.sales)}</Text></View>
          <Text style={bs.listSub}>{x.invoices} invoices</Text>
        </View>
      ))}

      <SectionHeader title="Low Stock Alerts" />
      {(data.lowStock || []).length === 0 ? <Text style={bs.listSub}>No products at or below 5 units.</Text> :
        (data.lowStock || []).map((x: any, i: number) => (
          <View key={i} style={bs.listCard}>
            <View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{x.ItemDesc}</Text><Text style={[bs.listPrice,{color:'#ef4444'}]}>{Number(x.qty||0)}</Text></View>
            <Text style={bs.listSub}>units remaining</Text>
          </View>
        ))}

    </ScrollView>
  );
}

      {businessReportUri && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setBusinessReportUri(null)}>
          <View style={bs.modalOverlay}><View style={bs.modalCard}>
            <Text style={bs.modalTitle}>Business Report Ready</Text>
            <TouchableOpacity style={bs.primaryBtn} onPress={() => openPdf(businessReportUri)}><Text style={bs.primaryBtnText}>Open PDF</Text></TouchableOpacity>
            <TouchableOpacity style={bs.ghostBtn} onPress={async () => { try { await shareDocumentPdf(businessReportUri); } catch (e:any) { Alert.alert('Share PDF', e.message); } }}><Text style={bs.ghostBtnText}>Share PDF</Text></TouchableOpacity>
            <TouchableOpacity style={bs.ghostBtn} onPress={() => setBusinessReportUri(null)}><Text style={bs.ghostBtnText}>Close</Text></TouchableOpacity>
          </View></View>
        </Modal>
      )}
