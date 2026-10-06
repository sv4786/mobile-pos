import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'mobile_pos_owner_pin_hash';

async function hashPin(pin: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `mobile-pos-pin:${pin}`
  );
}

export async function hasOwnerPin(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(PIN_KEY));
}

export async function setOwnerPin(pin: string): Promise<void> {
  if (!/^\\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits.');
  await SecureStore.setItemAsync(PIN_KEY, await hashPin(pin));
}

export async function clearOwnerPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

export async function verifyOwnerPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored || !/^\\d{4}$/.test(pin)) return false;
  return stored === await hashPin(pin);
}