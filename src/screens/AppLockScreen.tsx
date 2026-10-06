import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { verifyOwnerPin } from '../services/SecurityService';

export default function AppLockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    if (!/^\\d{4}$/.test(pin)) {
      Alert.alert('Enter PIN', 'Enter your 4-digit owner PIN.');
      return;
    }
    setBusy(true);
    try {
      if (await verifyOwnerPin(pin)) {
        setPin('');
        onUnlocked();
      } else {
        setPin('');
        Alert.alert('Incorrect PIN', 'That PIN is not correct.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.brand}>MOBILE POS</Text>
        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.sub}>Enter the owner PIN to continue.</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={v => setPin(v.replace(/\\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          autoFocus
          placeholder="••••"
          placeholderTextColor="#4b5563"
          onSubmitEditing={unlock}
        />
        <TouchableOpacity style={styles.button} onPress={unlock} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? 'Checking...' : 'Unlock'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  root: { flex: 1, backgroundColor: '#07090f', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 24 },
  card: { width: '100%' as const, maxWidth: 380, backgroundColor: '#111827', borderRadius: 18, borderWidth: 1, borderColor: '#1f2937', padding: 24 },
  brand: { color: '#6366f1', fontSize: 11, fontWeight: '900' as const, letterSpacing: 2 },
  title: { color: '#f9fafb', fontSize: 26, fontWeight: '900' as const, marginTop: 10 },
  sub: { color: '#9ca3af', fontSize: 13, marginTop: 6, marginBottom: 20 },
  input: { backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#374151', borderRadius: 12, padding: 14, color: '#f9fafb', fontSize: 24, letterSpacing: 10, textAlign: 'center' as const, marginBottom: 14 },
  button: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14, alignItems: 'center' as const },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' as const },
};
