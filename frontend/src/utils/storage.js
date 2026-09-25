// ─────────────────────────────────────────────────────────────────────────────
// SAFE STORAGE UTILITIES (SessionStorage + LocalStorage)
// ─────────────────────────────────────────────────────────────────────────────

// Save encrypted / encoded data (Safe without external crypto-js dependency)
export const setEncryptedItem = (key, value) => {
  try {
    const raw = JSON.stringify(value);
    const encoded = btoa(encodeURIComponent(raw));
    sessionStorage.setItem(key, encoded);
  } catch (error) {
    console.error("Encryption error:", error);
  }
};

// Get decrypted / decoded data
export const getDecryptedItem = (key) => {
  try {
    const encoded = sessionStorage.getItem(key);
    if (!encoded) return null;
    const raw = decodeURIComponent(atob(encoded));
    return JSON.parse(raw);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

// Set item in storage safely (stores in both sessionStorage and localStorage)
export const setStoredItem = (key, value) => {
  try {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    sessionStorage.setItem(key, valStr);
    localStorage.setItem(key, valStr);
  } catch (error) {
    console.error("Storage set error:", error);
  }
};

// Get item from storage safely
export const getStoredItem = (key) => {
  try {
    const item = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error("Storage get error:", error);
    return null;
  }
};

// Remove data
export const removeItem = (key) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};
