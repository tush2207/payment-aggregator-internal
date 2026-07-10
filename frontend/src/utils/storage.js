import CryptoJS from "crypto-js";

const SECRET_KEY = "your-secret-key"; // 🔑 Keep this secure & same for encrypt/decrypt

// Save encrypted data
export const setEncryptedItem = (key, value) => {
  try {
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      SECRET_KEY
    ).toString();
    sessionStorage.setItem(key, encryptedData);
  } catch (error) {
    console.error("Encryption error:", error);
  }
};

// Get decrypted data
export const getDecryptedItem = (key) => {
  try {
    const encryptedData = sessionStorage.getItem(key);
    if (!encryptedData) return null;

    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    return decryptedData;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

// Remove data
export const removeItem = (key) => {
  sessionStorage.removeItem(key);
};
