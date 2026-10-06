import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { posDb } from '../database';
import { Store } from '../types';
import { bs } from './shared';

export default function SettingsScreen({
  currentStore,
  onManageStores,
  onDataRestored,
}: {
  currentStore: Store | null;
  onManageStores: () => void;
  onDataRestored?: () => void;
}) {
  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ paddingTop: 14, paddingBottom: 10 }}>
        <Text style={bs.sectionText}>Settings</Text>
        <Text style={bs.listSub}>
          Manage your POS configuration and local app information.
        </Text>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Business & Store</Text>
        <View style={bs.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsLabel}>Active store</Text>
            <Text style={bs.settingsValue}>
              {currentStore?.StoreDesc || 'No store selected'}
            </Text>
          </View>
          <Text style={bs.settingsMeta}>
            {currentStore?.StoreCode || 'STORE 1'}
          </Text>
        </View>

        <TouchableOpacity style={bs.settingsAction} onPress={onManageStores}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsActionTitle}>Manage Stores</Text>
            <Text style={bs.settingsActionSub}>
              Add, edit, or switch between local stores.
            </Text>
          </View>
          <Text style={bs.settingsChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Documents</Text>
        <View style={bs.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsLabel}>PDF generation</Text>
            <Text style={bs.settingsValue}>Enabled</Text>
          </View>
          <Text style={bs.settingsMeta}>LOCAL</Text>
        </View>
        <Text style={bs.helpText}>
          Invoices and quotes are generated locally on the device and can be
          opened or shared from their detail screen.
        </Text>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Database</Text>
        <View style={bs.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsLabel}>Storage</Text>
            <Text style={bs.settingsValue}>SQLite</Text>
          </View>
          <Text style={bs.settingsMeta}>OFFLINE</Text>
        </View>
        <Text style={bs.helpText}>
          Products, customers, stock, quotes, invoices, and other POS data are
          stored locally on this device.
        </Text>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Backup & Recovery</Text>
        <Text style={bs.helpText}>
          Back up your complete local POS database to a file. Keep the backup somewhere safe before changing devices or reinstalling the app.
        </Text>
        <TouchableOpacity style={bs.settingsAction} onPress={async () => {
          try {
            const uri = await posDb.backupDatabase();
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri, { mimeType: 'application/octet-stream', dialogTitle: 'Save Mobile POS Backup' });
            } else {
              Alert.alert('Backup Created', uri);
            }
          } catch (e: any) {
            Alert.alert('Backup Failed', e?.message || 'Could not create the database backup.');
          }
        }}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsActionTitle}>Backup Database</Text>
            <Text style={bs.settingsActionSub}>Create and share a complete SQLite backup.</Text>
          </View>
          <Text style={bs.settingsChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={bs.settingsAction} onPress={() => {
          Alert.alert(
            'Restore Database',
            'Restoring replaces the current POS data with the selected backup. This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Choose Backup', style: 'destructive', onPress: async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: ['application/octet-stream', 'application/x-sqlite3', 'application/vnd.sqlite3', '*/*'],
                    copyToCacheDirectory: true,
                    multiple: false,
                  });
                  if (result.canceled || !result.assets?.[0]?.uri) return;
                  await posDb.restoreDatabase(result.assets[0].uri);
                  onDataRestored?.();
                  Alert.alert('Restore Complete', 'The database was restored and the POS data has been reloaded.');
                } catch (e: any) {
                  Alert.alert('Restore Failed', e?.message || 'Could not restore the selected backup.');
                }
              } }
            ]
          );
        }}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsActionTitle}>Restore Database</Text>
            <Text style={bs.settingsActionSub}>Restore from a previously exported SQLite backup.</Text>
          </View>
          <Text style={bs.settingsChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Application</Text>
        <View style={bs.settingsRow}>
          <Text style={bs.settingsLabel}>Application</Text>
          <Text style={bs.settingsValue}>Mobile POS</Text>
        </View>
        <View style={bs.settingsRow}>
          <Text style={bs.settingsLabel}>Version</Text>
          <Text style={bs.settingsValue}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}
