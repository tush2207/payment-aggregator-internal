/**
 * Central Bank of India - Payment Aggregator & RFQ Portal
 * Client-Side Payload Encryption & Decryption Helper (AES-256-GCM / Web Crypto API)
 *
 * Provides utilities to encrypt outgoing request payloads and decrypt incoming responses.
 */

// Prefix used to identify AES-256-GCM encrypted strings
export const CIPHER_PREFIX = "enc:aes256gcm:";

/**
 * Derives a 256-bit CryptoKey from a secret passphrase using SHA-256
 */
async function deriveKey(secretPassphrase) {
  const defaultKey = import.meta.env.VITE_ENCRYPTION_KEY || "CBI_PAPG_SECURE_AES256_KEY_2026_PROD#!";
  const encoder = new TextEncoder();
  const rawKeyData = encoder.encode(secretPassphrase || defaultKey);
  const hash = await window.crypto.subtle.digest("SHA-256", rawKeyData);
  return window.crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string or object to an AES-256-GCM Base64 ciphertext envelope
 */
export async function encryptPayload(data, secretPassphrase = null) {
  const plaintext = typeof data === "object" ? JSON.stringify(data) : String(data);
  const key = await deriveKey(secretPassphrase);
  
  // 12-byte random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  // Combine IV (12 bytes) + Ciphertext & Tag
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  // Convert binary to Base64 string
  let binary = "";
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  const base64Str = btoa(binary);

  return `${CIPHER_PREFIX}${base64Str}`;
}

/**
 * Decrypts an AES-256-GCM Base64 ciphertext envelope back to original plaintext / JSON object
 */
export async function decryptPayload(ciphertextWithPrefix, secretPassphrase = null) {
  if (!ciphertextWithPrefix || typeof ciphertextWithPrefix !== "string") {
    return ciphertextWithPrefix;
  }

  let rawB64 = ciphertextWithPrefix;
  if (rawB64.startsWith(CIPHER_PREFIX)) {
    rawB64 = rawB64.slice(CIPHER_PREFIX.length);
  }

  const binary = atob(rawB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  if (bytes.length < 28) {
    throw new Error("Ciphertext too short to contain valid IV and GCM tag.");
  }

  const iv = bytes.slice(0, 12);
  const ciphertextAndTag = bytes.slice(12);
  const key = await deriveKey(secretPassphrase);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertextAndTag
  );

  const decoder = new TextDecoder();
  const plaintext = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(plaintext);
  } catch {
    return plaintext;
  }
}
