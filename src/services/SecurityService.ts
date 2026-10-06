import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'mobile_pos_owner_pin_hash';
const FAILED_ATTEMPTS_KEY = 'mobile_pos_owner_pin_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'mobile_pos_owner_pin_lockout_until';

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

  const lockoutUntil = Number(await SecureStore.getItemAsync(LOCKOUT_UNTIL_KEY) || 0);
  if (lockoutUntil > Date.now()) return false;

  const valid = stored === await hashPin(pin);
  if (valid) {
    await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);
    return true;
  }

  const attempts = Number(await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY) || 0) + 1;
  await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, String(attempts));
  if (attempts >= 5) {
    await SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, String(Date.now() + 30_000));
    await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
  }
  return false;
}