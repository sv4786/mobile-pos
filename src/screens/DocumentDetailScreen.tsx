import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { posDb } from '../database';
import { shareDocumentPdf } from '../services/DocumentService';
import { Divider, EmptyState, SectionHeader, bs } from './shared';

export default function DocumentDetailScreen({
  type,
  number,
  onClose,
}: {
  type: 'INVOICE' | 'QUOTE';
  number: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = type === 'INVOICE'
          ? await posDb.getInvoiceDetails(number)
          : await posDb.getQuoteDetails(number);
        setData(result);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [type, number]);

  if (loading) {
    return (
      <View style={bs.screen}>
        <SectionHeader title={type === 'INVOICE' ? 'Invoice Details' : 'Quote Details'} />
        <Text style={bs.listSub}>Loading document...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={bs.screen}>
        <EmptyState icon="!" title="Document unavailable" sub="The document could not be loaded." />
        <TouchableOpacity style={bs.ghostBtn} onPress={onClose}>
          <Text style={bs.ghostBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const doc = data.document;
  const items = data.items || [];
  const pdfPath = doc.PdfPath as string | null;

  const openPdf = async () => {
    if (!pdfPath) {
      Alert.alert('PDF unavailable', 'No PDF is stored for this document.');
      return;
    }
    try {
      const uri = Platform.OS === 'android'
        ? await FileSystem.getContentUriAsync(pdfPath)
        : pdfPath;
      await Linking.openURL(uri);
    } catch {
      Alert.alert('Cannot open PDF', 'No application on this device can open the PDF.');
    }
  };

  const sharePdf = async () => {
    if (!pdfPath) {
      Alert.alert('PDF unavailable', 'No PDF is stored for this document.');
      return;
    }
    try {
      await shareDocumentPdf(pdfPath);
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  };

  const subtotal = Number(doc.SubTotal || 0);
  const vat = Number(doc.VatTotal || 0);
  const total = subtotal + vat;

  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <TouchableOpacity style={bs.ghostBtn} onPress={onClose}>
        <Text style={bs.ghostBtnText}>Back to {type === 'INVOICE' ? 'Invoices' : 'Quotes'}</Text>
      </TouchableOpacity>

      <SectionHeader title={type === 'INVOICE' ? 'Invoice Details' : 'Quote Details'} />

      <View style={bs.listCard}>
        <Text style={bs.grandLbl}>{number}</Text>
        <Text style={bs.listTitle}>{doc.Company}</Text>
        <Text style={bs.listSub}>{doc.CreatedDt || doc.Date}</Text>
        <Text style={bs.listSub}>{doc.StoreDesc || 'Store'}</Text>

        <Divider />

        {items.map((item: any, index: number) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <View style={bs.listRow}>
              <Text style={[bs.listTitle, { flex: 1 }]}>{item.ItemDesc}</Text>
              <Text style={bs.listPrice}>R {Number(item.Amount || 0).toFixed(2)}</Text>
            </View>
            <Text style={bs.listSub}>
              {Number(item.Qty || 0)} × R {Number(item.UnitIncl || 0).toFixed(2)}
            </Text>
          </View>
        ))}

        <Divider />

        <View style={bs.totalsRow}>
          <Text style={bs.totalsLbl}>Subtotal</Text>
          <Text style={bs.totalsVal}>R {subtotal.toFixed(2)}</Text>
        </View>
        <View style={bs.totalsRow}>
          <Text style={bs.totalsLbl}>VAT</Text>
          <Text style={bs.totalsVal}>R {vat.toFixed(2)}</Text>
        </View>
        <View style={bs.totalsRow}>
          <Text style={bs.grandLbl}>Total</Text>
          <Text style={bs.grandVal}>R {total.toFixed(2)}</Text>
        </View>

        {type === 'INVOICE' && (
          <View style={bs.totalsRow}>
            <Text style={bs.totalsLbl}>Paid</Text>
            <Text style={bs.totalsVal}>R {Number(doc.AmtPaid || 0).toFixed(2)}</Text>
          </View>
        )}

        <TouchableOpacity style={bs.primaryBtn} onPress={openPdf}>
          <Text style={bs.primaryBtnText}>Open PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={bs.ghostBtn} onPress={sharePdf}>
          <Text style={bs.ghostBtnText}>Share PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
