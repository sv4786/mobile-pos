import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Customer } from '../types';
import { posDb } from '../database';
import { Badge, EmptyState, bs } from './shared';

type Props = {
  customers: Customer[];
  search: string;
  onSearch: (value: string) => void;
  selected: Customer | null;
  onSelect: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  editingCustomer?: Customer | null;
  onEditHandled: () => void;
  onChanged: () => void;
};

export default function CustomersScreen({
  customers, search, onSearch, selected, onSelect, onView,
  editingCustomer, onEditHandled, onChanged,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [code, setCode] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [tel, setTel] = useState('');
  const [cell, setCell] = useState('');
  const [email, setEmail] = useState('');
  const [autoDisc, setAutoDisc] = useState('0');
  const [crLimit, setCrLimit] = useState('0');
  const [allowMatrix, setAllowMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingCustomer) return;
    openEdit(editingCustomer);
    onEditHandled();
  }, [editingCustomer]);

  const openCreate = () => {
    setEditing(null);
    setCode('');
    setCompany('');
    setContact('');
    setTel('');
    setCell('');
    setEmail('');
    setAutoDisc('0');
    setCrLimit('0');
    setAllowMatrix(false);
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setCode(customer.AccCode || '');
    setCompany(customer.Company || '');
    setContact(customer.Contact || '');
    setTel(customer.Tel || '');
    setCell(customer.Cell || '');
    setEmail(customer.Email || '');
    setAutoDisc(String(customer.AutoDisc || 0));
    setCrLimit(String(customer.CrLimit || 0));
    setAllowMatrix(customer.AllowPriceMatrix === 1);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const save = async () => {
    const parsedDisc = Number(autoDisc);
    const parsedLimit = Number(crLimit);
    if (!code.trim() || !company.trim()) {
      Alert.alert('Missing information', 'Customer code and company name are required.');
      return;
    }
    if (!Number.isFinite(parsedDisc) || parsedDisc < 0 || parsedDisc > 100) {
      Alert.alert('Invalid discount', 'Auto discount must be between 0 and 100%.');
      return;
    }
    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      Alert.alert('Invalid credit limit', 'Credit limit must be zero or greater.');
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        await posDb.updateCustomer(editing.AccId, {
          code, company, contact, tel, cell, email,
          autoDisc: parsedDisc, crLimit: parsedLimit,
          allowPriceMatrix: allowMatrix ? 1 : 0,
        });
        Alert.alert('Customer Updated', company.trim() + ' was updated.');
      } else {
        await posDb.createCustomer({
          code, company, contact, tel, cell, email,
          autoDisc: parsedDisc, crLimit: parsedLimit,
          allowPriceMatrix: allowMatrix ? 1 : 0,
        });
        Alert.alert('Customer Created', company.trim() + ' was added.');
      }
      setFormOpen(false);
      onChanged();
    } catch (e: any) {
      Alert.alert('Save Failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  const input = (label: string, value: string, setter: (v: string) => void, keyboardType: any = 'default') => (
    <View style={bs.formGroup}>
      <Text style={bs.formLabel}>{label}</Text>
      <TextInput
        style={bs.formInput}
        value={value}
        onChangeText={setter}
        placeholder={label}
        placeholderTextColor="#4b5563"
        keyboardType={keyboardType}
        autoCorrect={false}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={bs.searchBar}>
        <TextInput
          style={bs.searchInput}
          placeholder="Search customers..."
          placeholderTextColor="#4b5563"
          value={search}
          onChangeText={onSearch}
          autoCorrect={false}
        />
        <TouchableOpacity style={bs.primaryBtn} onPress={openCreate}>
          <Text style={bs.primaryBtnText}>+ Add Customer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        keyExtractor={c => String(c.AccId)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState icon="C" title="No customers found" sub={search ? 'Try a different search' : 'Add your first customer'} />}
        renderItem={({ item: c }) => {
          const isSel = selected?.AccId === c.AccId;
          return (
            <View style={[bs.listCard, isSel && { borderColor: '#6366f1' }]}>
              <TouchableOpacity onPress={() => onView(c)}>
                <View style={bs.listRow}>
                  <View style={bs.avatar}>
                    <Text style={bs.avatarText}>{c.Company?.[0] || '?'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={bs.listTitle}>{c.Company}</Text>
                    <Text style={bs.listSub}>{c.AccCode}  |  {c.Tel || 'No phone'}</Text>
                  </View>
                  {isSel && <Badge text="Selected" color="#10b981" />}
                </View>
                {c.AllowPriceMatrix === 1 && <Badge text="Custom Pricing" color="#6366f1" />}
                {c.AutoDisc > 0 && <Badge text={c.AutoDisc + '% Auto Discount'} color="#f59e0b" />}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={[bs.ghostBtn, { flex: 1 }]} onPress={() => onSelect(c)}>
                  <Text style={bs.ghostBtnText}>Use for Sale</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[bs.ghostBtn, { flex: 1 }]} onPress={() => openEdit(c)}>
                  <Text style={bs.ghostBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={formOpen} animationType="slide" onRequestClose={closeForm}>
        <View style={bs.modalRoot}>
          <View style={bs.modalHeader}>
            <View>
              <Text style={bs.modalTitle}>{editing ? 'Edit Customer' : 'Add Customer'}</Text>
              <Text style={bs.modalSub}>{editing ? editing.Company : 'Create a local customer account'}</Text>
            </View>
            <TouchableOpacity onPress={closeForm}>
              <Text style={bs.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={bs.modalContent}>
            {input('Account Code *', code, setCode)}
            {input('Company / Customer Name *', company, setCompany)}
            {input('Contact Person', contact, setContact)}
            {input('Telephone', tel, setTel, 'phone-pad')}
            {input('Cellphone', cell, setCell, 'phone-pad')}
            {input('Email', email, setEmail, 'email-address')}
            {input('Auto Discount %', autoDisc, setAutoDisc, 'decimal-pad')}
            {input('Credit Limit', crLimit, setCrLimit, 'decimal-pad')}

            <TouchableOpacity
              style={[bs.ghostBtn, allowMatrix && { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.10)' }]}
              onPress={() => setAllowMatrix(v => !v)}
            >
              <Text style={bs.ghostBtnText}>
                Custom Pricing: {allowMatrix ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[bs.primaryBtn, saving && bs.btnDisabled]} onPress={save} disabled={saving}>
              <Text style={bs.primaryBtnText}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Customer'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
