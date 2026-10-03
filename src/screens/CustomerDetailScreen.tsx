import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { File } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { CustomerDetails } from '../types';
import { posDb } from '../database';
import { Divider, EmptyState, SectionHeader, bs } from './shared';
import { generateCustomerStatementPdf, shareDocumentPdf } from '../services/DocumentService';

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
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [statementOpen, setStatementOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statementUri, setStatementUri] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const detail = await posDb.getCustomerDetails(accId);
      setData(detail);
      if (accId !== 1) {
        const [acc, tx, invoices] = await Promise.all([
          posDb.getCustomerAccount(accId),
          posDb.getCustomerAccountTransactions(accId),
          posDb.getOutstandingInvoices(accId),
        ]);
        setAccount(acc);
        setTransactions(tx);
        setOutstandingInvoices(invoices);
      } else {
        setAccount(null);
        setTransactions([]);
        setOutstandingInvoices([]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [accId]);

  const remove = () => {
    if (!data) return;
    Alert.alert('Delete Customer', `Delete ${data.customer.Company}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await posDb.deleteCustomer(data.customer.AccId);
            Alert.alert('Customer Deleted', data.customer.Company + ' was removed.');
            onBack();
          } catch (e: any) {
            Alert.alert('Cannot Delete', e.message);
          }
        },
      },
    ]);
  };

  const openPayment = (invoice?: any) => {
    setSelectedInvoice(invoice || null);
    setPaymentAmount(invoice ? Number(invoice.Outstanding).toFixed(2) : '');
    setPaymentNotes('');
    setPaymentOpen(true);
  };

  const savePayment = async () => {
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid Payment', 'Enter a payment amount greater than zero.');
      return;
    }
    try {
      await posDb.recordAccountPayment({
        accId,
        invoiceNo: selectedInvoice?.INVNo,
        amount,
        notes: paymentNotes,
      });
      setPaymentOpen(false);
      Alert.alert('Payment Recorded', 'The customer account has been updated.');
      await load();
    } catch (e: any) {
      Alert.alert('Payment Failed', e.message);
    }
  };

  const openPdf = async (uri: string) => {
    try {
      const file = new File(uri);
      if (!file.exists) throw new Error('The statement PDF no longer exists.');
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: file.contentUri,
        type: 'application/pdf',
        flags: 1,
      });
    } catch (e: any) {
      Alert.alert('Open PDF', e?.message || 'No PDF viewer is available on this device.');
    }
  };

  const exportStatement = async () => {
    try {
      const statement = await posDb.getCustomerStatementData(accId, fromDate.trim() || undefined, toDate.trim() || undefined);
      const uri = await generateCustomerStatementPdf({
        customer: statement.customer,
        date: new Date().toLocaleString(),
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
        transactions: statement.transactions,
        balance: statement.totals.balance,
      });
      setStatementUri(uri);
      setStatementOpen(false);
      Alert.alert('Statement Ready', 'Customer statement PDF was generated.');
    } catch (e: any) {
      Alert.alert('Statement Failed', e.message);
    }
  };

  if (loading) {
    return <View style={bs.screen}><SectionHeader title="Customer Details" /><Text style={bs.listSub}>Loading customer...</Text></View>;
  }

  if (!data) {
    return <View style={bs.screen}><EmptyState icon="!" title="Customer unavailable" sub="This customer no longer exists." /><TouchableOpacity style={bs.ghostBtn} onPress={onBack}><Text style={bs.ghostBtnText}>Back</Text></TouchableOpacity></View>;
  }

  const { customer, invoices, quotes, totals } = data;
  const isWalkIn = customer.AccId === 1;

  return (
    <>
      <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}>
        <TouchableOpacity style={bs.ghostBtn} onPress={onBack}><Text style={bs.ghostBtnText}>Back to Customers</Text></TouchableOpacity>
        <SectionHeader title="Customer Details" />

        <View style={bs.listCard}>
          <View style={bs.listRow}>
            <View style={bs.avatar}><Text style={bs.avatarText}>{customer.Company?.[0] || '?'}</Text></View>
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
          <Text style={bs.sectionText}>CREDIT ACCOUNT</Text>
          {isWalkIn ? (
            <Text style={bs.listSub}>Walk-in cash customer. Credit purchases are disabled.</Text>
          ) : (
            <>
              <Text style={bs.listSub}>Credit limit: R {Number(customer.CrLimit || 0).toFixed(2)}</Text>
              <Text style={bs.listSub}>Current balance: R {Number(account?.balance || 0).toFixed(2)}</Text>
              <Text style={bs.listSub}>Available credit: R {Number(account?.availableCredit || 0).toFixed(2)}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={[bs.primaryBtn, { flex: 1 }]} onPress={() => openPayment()}><Text style={bs.primaryBtnText}>Record Payment</Text></TouchableOpacity>
                <TouchableOpacity style={[bs.ghostBtn, { flex: 1 }]} onPress={() => setStatementOpen(true)}><Text style={bs.ghostBtnText}>Statement PDF</Text></TouchableOpacity>
              </View>
            </>
          )}
          <Divider />
          <Text style={bs.sectionText}>PRICING</Text>
          <Text style={bs.listSub}>Auto discount: {Number(customer.AutoDisc || 0).toFixed(2)}%</Text>
          <Text style={bs.listSub}>Custom pricing: {customer.AllowPriceMatrix === 1 ? 'Enabled' : 'Disabled'}</Text>
          <TouchableOpacity style={bs.primaryBtn} onPress={() => onEdit(customer)}><Text style={bs.primaryBtnText}>Edit Customer</Text></TouchableOpacity>
          {!isWalkIn && <TouchableOpacity style={bs.ghostBtn} onPress={remove}><Text style={[bs.ghostBtnText, { color: '#ef4444' }]}>Delete Customer</Text></TouchableOpacity>}
        </View>

        {!isWalkIn && (
          <>
            <SectionHeader title="Outstanding Invoices" />
            {outstandingInvoices.length === 0 ? <EmptyState icon="OK" title="No outstanding invoices" sub="This account has no unpaid balance on invoices." /> :
              outstandingInvoices.map(inv => (
                <View key={inv.INVNo} style={bs.listCard}>
                  <View style={bs.listRow}>
                    <Text style={[bs.listTitle, { flex: 1 }]}>{inv.INVNo}</Text>
                    <Text style={bs.listPrice}>R {Number(inv.Outstanding).toFixed(2)}</Text>
                  </View>
                  <Text style={bs.listSub}>{inv.CreatedDt}</Text>
                  <TouchableOpacity style={bs.ghostBtn} onPress={() => openPayment(inv)}><Text style={bs.ghostBtnText}>Pay This Invoice</Text></TouchableOpacity>
                </View>
              ))}
            <SectionHeader title="Account Transactions" />
            {transactions.length === 0 ? <EmptyState icon="ACC" title="No account transactions" sub="Credit sales and account payments will appear here." /> :
              transactions.map(tx => (
                <View key={tx.TransactionId} style={bs.listCard}>
                  <View style={bs.listRow}>
                    <Text style={[bs.listTitle, { flex: 1 }]}>{tx.TransactionType}</Text>
                    <Text style={tx.Debit > 0 ? bs.listPrice : { color: '#10b981', fontSize: 15, fontWeight: '800' }}>R {Number(tx.Debit > 0 ? tx.Debit : tx.Credit).toFixed(2)}</Text>
                  </View>
                  <Text style={bs.listSub}>{tx.CreatedDt}  |  {tx.RefNo || ''}</Text>
                  <Text style={bs.listSub}>Balance: R {Number(tx.Balance).toFixed(2)}</Text>
                </View>
              ))}
          </>
        )}

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
        {invoices.length === 0 ? <EmptyState icon="INV" title="No invoices yet" sub="Completed sales for this customer will appear here." /> :
          invoices.map(invoice => (
            <View key={invoice.INVNo} style={bs.listCard}>
              <View style={bs.listRow}><Text style={[bs.listTitle, { flex: 1 }]}>{invoice.INVNo}</Text><Text style={bs.listPrice}>R {(Number(invoice.SubTotal || 0) + Number(invoice.VatTotal || 0)).toFixed(2)}</Text></View>
              <Text style={bs.listSub}>{invoice.CreatedDt}  |  Paid R {Number(invoice.AmtPaid || 0).toFixed(2)}</Text>
            </View>
          ))}

        <SectionHeader title="Quote History" />
        {quotes.length === 0 ? <EmptyState icon="QT" title="No quotes yet" sub="Quotes created for this customer will appear here." /> :
          quotes.map(quote => (
            <View key={quote.QuoteNo} style={bs.listCard}>
              <View style={bs.listRow}><Text style={[bs.listTitle, { flex: 1 }]}>Quote {quote.QuoteNo}</Text><Text style={bs.listPrice}>R {(Number(quote.SubTotal || 0) + Number(quote.VatTotal || 0)).toFixed(2)}</Text></View>
              <Text style={bs.listSub}>{quote.Date}  |  Status {quote.QUStatus || 'O'}</Text>
            </View>
          ))}
      </ScrollView>

      <Modal visible={paymentOpen} animationType="slide" transparent onRequestClose={() => setPaymentOpen(false)}>
        <View style={bs.modalOverlay}>
          <View style={bs.modalCard}>
            <Text style={bs.modalTitle}>{selectedInvoice ? 'Pay Invoice' : 'Account Payment'}</Text>
            {selectedInvoice && <Text style={bs.listSub}>{selectedInvoice.INVNo} outstanding R {Number(selectedInvoice.Outstanding).toFixed(2)}</Text>}
            {!selectedInvoice && <Text style={bs.listSub}>Apply payment to the customer account.</Text>}
            <Text style={bs.formLabel}>Amount</Text>
            <TextInput style={bs.formInput} value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#4b5563" />
            <Text style={bs.formLabel}>Notes</Text>
            <TextInput style={bs.formInput} value={paymentNotes} onChangeText={setPaymentNotes} placeholder="Payment reference or note" placeholderTextColor="#4b5563" />
            <TouchableOpacity style={bs.primaryBtn} onPress={savePayment}><Text style={bs.primaryBtnText}>Save Payment</Text></TouchableOpacity>
            <TouchableOpacity style={bs.ghostBtn} onPress={() => setPaymentOpen(false)}><Text style={bs.ghostBtnText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={statementOpen} animationType="slide" transparent onRequestClose={() => setStatementOpen(false)}>
        <View style={bs.modalOverlay}>
          <View style={bs.modalCard}>
            <Text style={bs.modalTitle}>Customer Statement</Text>
            <Text style={bs.listSub}>Optional dates, format YYYY-MM-DD. Leave blank for all activity.</Text>
            <Text style={bs.formLabel}>From Date</Text>
            <TextInput style={bs.formInput} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" placeholderTextColor="#4b5563" />
            <Text style={bs.formLabel}>To Date</Text>
            <TextInput style={bs.formInput} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" placeholderTextColor="#4b5563" />
            <TouchableOpacity style={bs.primaryBtn} onPress={exportStatement}><Text style={bs.primaryBtnText}>Generate Statement PDF</Text></TouchableOpacity>
            <TouchableOpacity style={bs.ghostBtn} onPress={() => setStatementOpen(false)}><Text style={bs.ghostBtnText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {statementUri && (
        <Modal visible={!!statementUri} animationType="slide" transparent onRequestClose={() => setStatementUri(null)}>
          <View style={bs.modalOverlay}>
            <View style={bs.modalCard}>
              <Text style={bs.modalTitle}>Statement PDF Ready</Text>
              <TouchableOpacity style={bs.primaryBtn} onPress={() => openPdf(statementUri!)}><Text style={bs.primaryBtnText}>Open PDF</Text></TouchableOpacity>
              <TouchableOpacity style={bs.ghostBtn} onPress={async () => { try { await shareDocumentPdf(statementUri!); } catch (e:any) { Alert.alert('Share PDF', e.message); } }}><Text style={bs.ghostBtnText}>Share PDF</Text></TouchableOpacity>
              <TouchableOpacity style={bs.ghostBtn} onPress={() => setStatementUri(null)}><Text style={bs.ghostBtnText}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
