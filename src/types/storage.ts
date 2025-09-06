// LocalStorage interface type definitions  
// T021: Define storage interfaces and preferences

import { z } from 'zod';
import { WizardState, DraftMetadata } from './wizard';

// User preferences schema
export const UserPreferencesSchema = z.object({
  language: z.enum(['ja', 'en']).default('ja'),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  autoSaveInterval: z.number().default(2000), // 2 seconds
  aiCompletionEnabled: z.boolean().default(true),
  accessibilityMode: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
});

// Draft storage format schema
export const DraftStorageSchema = z.object({
  version: z.string().default('1.0'),
  wizardId: z.string(),
  data: z.any(), // WizardState - using any to avoid circular dependency
  metadata: z.object({
    savedAt: z.string(), // ISO date string
    expiresAt: z.string(), // ISO date string
    checksum: z.string().optional(),
    encrypted: z.boolean().default(false),
    compressionUsed: z.boolean().default(false),
  }),
});

// Export TypeScript types
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type DraftStorage = z.infer<typeof DraftStorageSchema>;

// Storage manager interfaces
export interface DraftStorageManager {
  saveDraft(wizardId: string, wizardState: Partial<WizardState>): Promise<boolean>;
  loadDraft(wizardId: string): Promise<WizardState | null>;
  listDrafts(): Promise<DraftMetadata[]>;
  cleanupExpiredDrafts(): Promise<number>; // Returns count of cleaned drafts
  hasDraft(wizardId: string): Promise<boolean>;
  deleteDraft(wizardId: string): Promise<boolean>;
}

export interface UserPreferencesManager {
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(preferences: Partial<UserPreferences>): Promise<boolean>;
  resetPreferences(): Promise<boolean>;
}

export interface ConsentHistoryManager {
  recordConsent(consent: {
    id: string;
    timestamp: Date;
    action: 'granted' | 'denied' | 'revoked';
    scopes: string[];
    service: 'gmail' | 'drive' | 'calendar' | 'sheets' | 'chat';
    userAgent?: string;
  }): Promise<boolean>;
  
  getConsentHistory(): Promise<Array<{
    id: string;
    timestamp: Date;
    action: 'granted' | 'denied' | 'revoked';
    scopes: string[];
    service: string;
  }>>;
  
  revokeConsent(consentId: string): Promise<boolean>;
}

// Storage security utilities
export interface StorageEncryption {
  encrypt(data: string, key?: string): Promise<string>;
  decrypt(encryptedData: string, key?: string): Promise<string>;
  generateKey(): Promise<string>;
}

export interface PIIDetector {
  detectPII(text: string): {
    hasPII: boolean;
    types: Array<'email' | 'phone' | 'address' | 'name' | 'id'>;
    confidence: number;
    locations: Array<{
      type: string;
      start: number;
      end: number;
      value: string;
    }>;
  };
}

// Storage quota management
export interface StorageQuotaManager {
  getUsage(): {
    used: number;
    total: number;
    percentage: number;
  };
  
  checkQuota(sizeInBytes: number): boolean;
  
  handleQuotaExceeded(error: Error): {
    success: boolean;
    error: string;
    action: 'cleanup_old_drafts' | 'compress_data' | 'user_intervention_required';
    details?: string;
  };
}

// Data integrity utilities
export interface DataIntegrity {
  calculateChecksum(data: string): string;
  verifyChecksum(data: string, expectedChecksum: string): boolean;
  compressData(data: string): Promise<string>;
  decompressData(compressedData: string): Promise<string>;
}

// Storage constants
export const StorageConstants = {
  // Keys
  DRAFT_PREFIX: 'wizard-draft-',
  USER_PREFERENCES_KEY: 'user-preferences',
  CONSENT_HISTORY_KEY: 'consent-history',
  
  // Limits (constitutional requirements)
  DRAFT_RETENTION_HOURS: 24,
  AUTO_SAVE_INTERVAL_MS: 2000, // 2 seconds
  MAX_DRAFT_SIZE_MB: 10,
  MAX_DRAFTS_COUNT: 50,
  
  // PII encryption
  ENCRYPTION_ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  
  // Checksum
  CHECKSUM_ALGORITHM: 'SHA-256',
} as const;

// Storage error types
export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'QUOTA_EXCEEDED' | 'CORRUPTION_DETECTED' | 'ENCRYPTION_FAILED' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class DraftError extends Error {
  constructor(
    message: string,
    public wizardId: string,
    public operation: 'save' | 'load' | 'delete'
  ) {
    super(message);
    this.name = 'DraftError';
  }
}

// Constitutional compliance validation
export interface StorageComplianceValidator {
  validateRetentionPolicy(draft: DraftStorage): boolean;
  validatePIIHandling(data: any): boolean;
  validateNoExternalTransmission(): boolean;
  validateEncryptionUsage(data: any): boolean;
}