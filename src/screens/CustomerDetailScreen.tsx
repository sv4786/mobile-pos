import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CustomerDetails } from '../types';
import { posDb } from '../database';
import { Divider, EmptyState, SectionHeader, bs } from './shared';

export default function CustomerDetailScreen({
  accId,
  onBack,
  onEdit,
}: {
  accId: number;
  onBack: () => void;
  onEdit: (customer: CustomerDetails['customer']) => void;
}) {
  const [data, setData] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setData(await posDb.getCustomerDetails(accId));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [accId]);

  if (loading) {
    return (
      <View style={bs.screen}>
        <SectionHeader title="Customer Details" />
        <Text style={bs.listSub}>Loading customer...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={bs.screen}>
        <EmptyState icon="!" title="Customer unavailable" sub="This customer no longer exists." />
        <TouchableOpacity style={bs.ghostBtn} onPress={onBack}>
          <Text style={bs.ghostBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { customer, invoices, quotes, totals } = data;

  const remove = () => {
    Alert.alert(
      'Delete Customer',
      `Delete ${customer.Company}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await posDb.deleteCustomer(customer.AccId);
              Alert.alert('Customer Deleted', customer.Company + ' was removed.');
              onBack();
            } catch (e: any) {
              Alert.alert('Cannot Delete', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <TouchableOpacity style={bs.ghostBtn} onPress={onBack}>
        <Text style={bs.ghostBtnText}>Back to Customers</Text>
      </TouchableOpacity>

      <SectionHeader title="Customer Details" />

      <View style={bs.listCard}>
        <View style={bs.listRow}>
          <View style={bs.avatar}>
            <Text style={bs.avatarText}>{customer.Company?.[0] || '?'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={bs.grandLbl}>{customer.Company}</Text>
            <Text style={bs.listSub}>{customer.AccCode}</Text>
          </View>
        </View>

        <Divider />

        <Text style={bs.sectionText}>CONTACT</Text>
        <Text style={bs.listSub}>Contact: {customer.Contact || 'Not provided'}</Text>
        <Text style={bs.listSub}>Tel: {customer.Tel || 'Not provided'}</Text>
        <Text style={bs.listSub}>Cell: {customer.Cell || 'Not provided'}</Text>
        <Text style={bs.listSub}>Email: {customer.Email || 'Not provided'}</Text>

        <Divider />

        <Text style={bs.sectionText}>ACCOUNT</Text>
        <Text style={bs.listSub}>Credit limit: R {Number(customer.CrLimit || 0).toFixed(2)}</Text>
        <Text style={bs.listSub}>Auto discount: {Number(customer.AutoDisc || 0).toFixed(2)}%</Text>
        <Text style={bs.listSub}>Custom pricing: {customer.AllowPriceMatrix === 1 ? 'Enabled' : 'Disabled'}</Text>

        <TouchableOpacity style={bs.primaryBtn} onPress={() => onEdit(customer)}>
          <Text style={bs.primaryBtnText}>Edit Customer</Text>
        </TouchableOpacity>
        {customer.AccId !== 1 && (
          <TouchableOpacity style={bs.ghostBtn} onPress={remove}>
            <Text style={[bs.ghostBtnText, { color: '#ef4444' }]}>Delete Customer</Text>
          </TouchableOpacity>
        )}
      </View>

      <SectionHeader title="Sales Summary" />
      <View style={bs.listCard}>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Total purchases</Text><Text style={bs.totalsVal}>R {totals.purchases.toFixed(2)}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Total paid</Text><Text style={bs.totalsVal}>R {totals.paid.toFixed(2)}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Outstanding</Text><Text style={[bs.grandVal, { fontSize: 18 }]}>R {totals.outstanding.toFixed(2)}</Text></View>
        <Divider />
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Invoices</Text><Text style={bs.totalsVal}>{totals.invoiceCount}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Quotes</Text><Text style={bs.totalsVal}>{totals.quoteCount}</Text></View>
        <View style={bs.totalsRow}><Text style={bs.totalsLbl}>Quote value</Text><Text style={bs.totalsVal}>R {totals.quoteValue.toFixed(2)}</Text></View>
      </View>

      <SectionHeader title="Invoice History" />
      {invoices.length === 0 ? (
        <EmptyState icon="INV" title="No invoices yet" sub="Completed sales for this customer will appear here." />
      ) : invoices.map(invoice => (
        <View key={invoice.INVNo} style={bs.listCard}>
          <View style={bs.listRow}>
            <Text style={[bs.listTitle, { flex: 1 }]}>{invoice.INVNo}</Text>
            <Text style={bs.listPrice}>R {(Number(invoice.SubTotal || 0) + Number(invoice.VatTotal || 0)).toFixed(2)}</Text>
          </View>
          <Text style={bs.listSub}>{invoice.CreatedDt}  |  Paid R {Number(invoice.AmtPaid || 0).toFixed(2)}</Text>
        </View>
      ))}

      <SectionHeader title="Quote History" />
      {quotes.length === 0 ? (
        <EmptyState icon="QT" title="No quotes yet" sub="Quotes created for this customer will appear here." />
      ) : quotes.map(quote => (
        <View key={quote.QuoteNo} style={bs.listCard}>
          <View style={bs.listRow}>
            <Text style={[bs.listTitle, { flex: 1 }]}>Quote {quote.QuoteNo}</Text>
            <Text style={bs.listPrice}>R {(Number(quote.SubTotal || 0) + Number(quote.VatTotal || 0)).toFixed(2)}</Text>
          </View>
          <Text style={bs.listSub}>{quote.Date}  |  Status {quote.QUStatus || 'O'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
