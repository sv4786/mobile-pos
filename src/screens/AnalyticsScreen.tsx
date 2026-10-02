import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { posDb } from '../database';
import { EmptyState, SectionHeader, bs } from './shared';

export default function AnalyticsScreen({ storeId }: { storeId: number }) {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setData(await posDb.getAnalytics(storeId)); } catch (_) {}
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const money = (n: any) => 'R ' + Number(n || 0).toFixed(2);

  if (!data) return <View style={bs.screen}><EmptyState icon="A" title="Loading analytics" sub="Calculating sales insights..." /></View>;

  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <SectionHeader title="Sales Analytics" />
      <View style={bs.listCard}>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Total revenue</Text><Text style={bs.grandVal}>{money(data.summary?.revenue)}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Invoices</Text><Text style={bs.totalsVal}>{data.summary?.invoiceCount || 0}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Average sale</Text><Text style={bs.totalsVal}>{money(Number(data.summary?.revenue || 0) / Math.max(1, Number(data.summary?.invoiceCount || 0)))}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>VAT collected</Text><Text style={bs.totalsVal}>{money(data.summary?.vat)}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Amount paid</Text><Text style={bs.totalsVal}>{money(data.summary?.paid)}</Text></View>
      </View>

      <SectionHeader title="Popular Items" />
      {data.popularItems.length === 0 ? <EmptyState icon="P" title="No sales yet" sub="Popular products will appear after invoices are created." /> :
        data.popularItems.map((x: any, i: number) => (
          <View key={i} style={bs.listCard}>
            <View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{i+1}. {x.ItemDesc}</Text><Text style={bs.listPrice}>{Number(x.units||0)} units</Text></View>
            <Text style={bs.listSub}>Sales value: {money(x.sales)}</Text>
          </View>
        ))}

      <SectionHeader title="Top Revenue Items" />
      {data.topRevenue.map((x: any, i: number) => (
        <View key={i} style={bs.listCard}>
          <View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{i+1}. {x.ItemDesc}</Text><Text style={bs.listPrice}>{money(x.sales)}</Text></View>
          <Text style={bs.listSub}>{Number(x.units||0)} units sold</Text>
        </View>
      ))}

      <SectionHeader title="Payment Methods" />
      {data.paymentMethods.map((x: any, i: number) => (
        <View key={i} style={bs.listCard}><View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{x.method}</Text><Text style={bs.listPrice}>{money(x.amount)}</Text></View><Text style={bs.listSub}>{x.count} transactions</Text></View>
      ))}

      <SectionHeader title="Top Customers" />
      {data.customerSales.map((x: any, i: number) => (
        <View key={i} style={bs.listCard}><View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{i+1}. {x.customer}</Text><Text style={bs.listPrice}>{money(x.sales)}</Text></View><Text style={bs.listSub}>{x.invoices} invoices</Text></View>
      ))}

      <SectionHeader title="Low Stock Alerts" />
      {data.lowStock.length === 0 ? <Text style={bs.listSub}>No products at or below 5 units.</Text> :
        data.lowStock.map((x: any, i: number) => (
          <View key={i} style={bs.listCard}><View style={bs.listRow}><Text style={[bs.listTitle,{flex:1}]}>{x.ItemDesc}</Text><Text style={[bs.listPrice,{color:'#ef4444'}]}>{Number(x.qty||0)}</Text></View><Text style={bs.listSub}>units remaining</Text></View>
        ))}
    </ScrollView>
  );
}
