import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Store } from '../types';
import { bs } from './shared';

export default function SettingsScreen({
  currentStore,
  onManageStores,
}: {
  currentStore: Store | null;
  onManageStores: () => void;
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
