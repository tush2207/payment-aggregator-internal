/**
 * Central Bank of India - PAPG Vendor Aggregator Portal
 * RBI & NPCI PII Data Masking Utilities
 */

export function maskPAN(pan) {
  if (!pan || typeof pan !== 'string' || pan.length < 10) return pan || '';
  const p = pan.trim().toUpperCase();
  return `XXXXXX${p.slice(-4)}`;
}

export function maskBankAccount(accountNo) {
  if (!accountNo) return '';
  const acc = String(accountNo).trim();
  if (acc.length <= 4) return acc;
  return `${'X'.repeat(acc.length - 4)}${acc.slice(-4)}`;
}

export function maskMobile(mobile) {
  if (!mobile) return '';
  const mob = String(mobile).replace(/\D/g, '');
  if (mob.length >= 10) {
    return `XXXXXX${mob.slice(-4)}`;
  }
  return mob;
}

export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(name.length - 2)}${name.slice(-1)}@${domain}`;
}
