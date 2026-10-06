import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { posDb } from '../database';
import { Store } from '../types';
import { clearOwnerPin, hasOwnerPin, setOwnerPin } from '../services/SecurityService';
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
  const [pinEnabled, setPinEnabled] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadSecurity = async () => {
    setPinEnabled(await hasOwnerPin());
    setAuditLogs(await posDb.getAuditLogs(20));
  };

  useEffect(() => {
    loadSecurity().catch(() => {});
  }, []);

  const savePin = async () => {
    if (!/^\\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'Use exactly 4 digits.');
      return;
    }
    try {
      await setOwnerPin(newPin);
      setNewPin('');
      setPinEnabled(true);
      await posDb.logAudit('SECURITY', 'APP', '', 'Owner PIN enabled or changed');
      setAuditLogs(await posDb.getAuditLogs(20));
      Alert.alert('Security Updated', 'The owner PIN will be required when the app starts.');
    } catch (e: any) {
      Alert.alert('PIN Failed', e?.message || 'Could not save the PIN.');
    }
  };

  const removePin = () => {
    Alert.alert('Disable App Lock', 'Anyone with access to this device will be able to open Mobile POS.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disable', style: 'destructive', onPress: async () => {
        try {
          await clearOwnerPin();
          setPinEnabled(false);
          await posDb.logAudit('SECURITY', 'APP', '', 'Owner PIN disabled');
          setAuditLogs(await posDb.getAuditLogs(20));
        } catch (e: any) {
          Alert.alert('Security Error', e?.message || 'Could not disable the PIN.');
        }
      }},
    ]);
  };

  return (
    <ScrollView style={bs.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ paddingTop: 14, paddingBottom: 10 }}>
        <Text style={bs.sectionText}>Settings</Text>
        <Text style={bs.listSub}>Simple controls for your business, device security and local data.</Text>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Business & Store</Text>
        <View style={bs.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsLabel}>Active store</Text>
            <Text style={bs.settingsValue}>{currentStore?.StoreDesc || 'No store selected'}</Text>
          </View>
          <Text style={bs.settingsMeta}>{currentStore?.StoreCode || 'STORE 1'}</Text>
        </View>
        <TouchableOpacity style={bs.settingsAction} onPress={onManageStores}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsActionTitle}>Manage Stores</Text>
            <Text style={bs.settingsActionSub}>Add, edit, or switch between local stores.</Text>
          </View>
          <Text style={bs.settingsChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Security</Text>
        <View style={bs.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsLabel}>Owner app lock</Text>
            <Text style={bs.settingsValue}>{pinEnabled ? 'Enabled' : 'Disabled'}</Text>
          </View>
          <Text style={bs.settingsMeta}>{pinEnabled ? 'PIN' : 'OPEN'}</Text>
        </View>
        <Text style={bs.helpText}>Optional 4-digit PIN. It protects the app without requiring an online account or monthly security service.</Text>
        <TextInput
          style={settingsStyles.input}
          value={newPin}
          onChangeText={v => setNewPin(v.replace(/\\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          placeholder={pinEnabled ? 'Enter new 4-digit PIN' : 'Create 4-digit PIN'}
          placeholderTextColor="#4b5563"
        />
        <TouchableOpacity style={bs.primaryBtn} onPress={savePin}>
          <Text style={bs.primaryBtnText}>{pinEnabled ? 'Change Owner PIN' : 'Enable App Lock'}</Text>
        </TouchableOpacity>
        {pinEnabled && (
          <TouchableOpacity style={bs.ghostBtn} onPress={removePin}>
            <Text style={bs.ghostBtnText}>Disable App Lock</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Printing</Text>
        <Text style={bs.helpText}>Use the Android print service from an invoice or quote. Bluetooth thermal printers that are exposed through Android printing can be used without a separate POS subscription or printer SDK.</Text>
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
        <Text style={bs.helpText}>Invoices, quotes, statements and reports are generated locally and can be opened, printed or shared.</Text>
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
        <Text style={bs.helpText}>Products, customers, stock, quotes, invoices and POS data stay on this device.</Text>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Backup & Recovery</Text>
        <Text style={bs.helpText}>Back up the complete local database before changing devices or reinstalling the app. Keep a copy somewhere safe.</Text>
        <TouchableOpacity style={bs.settingsAction} onPress={async () => {
          try {
            const uri = await posDb.backupDatabase();
            await posDb.logAudit('BACKUP', 'DATABASE', '', 'Database backup shared/exported');
            await loadSecurity();
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
          Alert.alert('Restore Database', 'Restoring replaces the current POS data with the selected backup. This cannot be undone.', [
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
                await posDb.logAudit('RESTORE', 'DATABASE', '', 'Database restored by owner');
                await loadSecurity();
                Alert.alert('Restore Complete', 'The database was restored and the POS data has been reloaded.');
              } catch (e: any) {
                Alert.alert('Restore Failed', e?.message || 'Could not restore the selected backup.');
              }
            }}
          ]);
        }}>
          <View style={{ flex: 1 }}>
            <Text style={bs.settingsActionTitle}>Restore Database</Text>
            <Text style={bs.settingsActionSub}>Restore from a previously exported SQLite backup.</Text>
          </View>
          <Text style={bs.settingsChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Audit Trail</Text>
        <Text style={bs.helpText}>Recent important actions are stored locally so the owner can see what happened on the device.</Text>
        {auditLogs.length === 0 ? (
          <Text style={bs.listSub}>No audit entries yet.</Text>
        ) : auditLogs.map(log => (
          <View key={log.AuditId} style={settingsStyles.logRow}>
            <View style={{ flex: 1 }}>
              <Text style={bs.settingsActionTitle}>{log.Action} · {log.EntityType || 'APP'}</Text>
              <Text style={bs.helpText}>{log.Description || 'Action recorded'}</Text>
            </View>
            <Text style={bs.settingsMeta}>{String(log.CreatedDt || '').slice(0, 16)}</Text>
          </View>
        ))}
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Commercial</Text>
        <Text style={bs.helpText}>Mobile POS is designed to stay affordable: local-first storage, no required cloud account, no required monthly payment gateway and no paid printer SDK.</Text>
        <View style={bs.settingsRow}>
          <Text style={bs.settingsLabel}>Recommended product model</Text>
          <Text style={bs.settingsValue}>Low-cost subscription or one-time licence</Text>
        </View>
      </View>

      <View style={bs.settingsCard}>
        <Text style={bs.settingsSectionTitle}>Application</Text>
        <View style={bs.settingsRow}><Text style={bs.settingsLabel}>Application</Text><Text style={bs.settingsValue}>Mobile POS</Text></View>
        <View style={bs.settingsRow}><Text style={bs.settingsLabel}>Version</Text><Text style={bs.settingsValue}>1.0.0</Text></View>
      </View>
    </ScrollView>
  );
}

const settingsStyles = {
  input: {
    backgroundColor: '#161d2b',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f9fafb',
    fontSize: 18,
    letterSpacing: 6,
    marginBottom: 10,
  },
  logRow: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
};
