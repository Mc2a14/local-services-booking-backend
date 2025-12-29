const crypto = require('crypto');

// Simple encryption/decryption for email passwords
// In production, use a proper secret key from environment variables
// Generate a stable key if not provided (use JWT_SECRET as base if available)
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  // Use JWT_SECRET as base if available, otherwise generate once
  const base = process.env.JWT_SECRET || 'default-key-please-change-in-production';
  ENCRYPTION_KEY = crypto.createHash('sha256').update(base).digest('hex');
}

const ALGORITHM = 'aes-256-cbc';

// Encrypt a password
const encrypt = (text) => {
  if (!text) return null;
  
  try {
    // Ensure we have a 32-byte key (64 hex characters)
    const keyHex = ENCRYPTION_KEY.length >= 64 ? ENCRYPTION_KEY.slice(0, 64) : ENCRYPTION_KEY.padEnd(64, '0');
    const key = Buffer.from(keyHex, 'hex');
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
};

// Decrypt a password
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Ensure we have a 32-byte key (64 hex characters)
    const keyHex = ENCRYPTION_KEY.length >= 64 ? ENCRYPTION_KEY.slice(0, 64) : ENCRYPTION_KEY.padEnd(64, '0');
    const key = Buffer.from(keyHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

module.exports = { encrypt, decrypt };


