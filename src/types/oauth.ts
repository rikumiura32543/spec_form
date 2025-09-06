// Google OAuth type definitions
// T020: Define OAuth interfaces and contracts

import { z } from 'zod';

// Google OAuth configuration schema
export const GoogleAuthConfigSchema = z.object({
  clientId: z.string().regex(/^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/),
  redirectUri: z.string().default(() => window.location.origin),
  baseScopes: z.array(z.string()).default(['openid', 'email', 'profile']),
});

// Authentication result schema
export const AuthResultSchema = z.object({
  success: z.boolean(),
  accessToken: z.string().optional(),
  expiresIn: z.number().optional(),
  scope: z.string().optional(),
  error: z.string().optional(),
  errorDescription: z.string().optional(),
  newScopesGranted: z.array(z.string()).optional(),
});

// Authentication status schema
export const AuthStatusSchema = z.object({
  isAuthenticated: z.boolean(),
  grantedScopes: z.array(z.string()),
  userInfo: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    picture: z.string(),
  }).optional(),
  expiresAt: z.date().optional(),
});

// Consent record schema
export const ConsentRecordSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  action: z.enum(['granted', 'denied', 'revoked']),
  scopes: z.array(z.string()),
  service: z.enum(['gmail', 'drive', 'calendar', 'sheets', 'chat']),
  userAgent: z.string().optional(),
});

// Export TypeScript types
export type GoogleAuthConfig = z.infer<typeof GoogleAuthConfigSchema>;
export type AuthResult = z.infer<typeof AuthResultSchema>;
export type AuthStatus = z.infer<typeof AuthStatusSchema>;
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

// Google API service interfaces
export interface GoogleAuthManager {
  initialize(config: GoogleAuthConfig): Promise<boolean>;
  requestBasicAuth(): Promise<AuthResult>;
  requestIncrementalAuth(scopes: string[], explanation?: string): Promise<AuthResult>;
  revokeAuth(scopes?: string[]): Promise<boolean>;
  getAuthStatus(): AuthStatus;
}

// Workspace API client interface
export interface WorkspaceAPIClient {
  // Drive operations
  createDocument(content: string, filename: string, mimeType: string): Promise<{
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
  }>;

  // Gmail operations
  sendEmail(message: {
    to: string[];
    subject: string;
    body: string;
    bodyType: 'text' | 'html';
    attachments?: Array<{
      filename: string;
      content: string; // base64 encoded
      mimeType: string;
    }>;
  }): Promise<{
    id: string;
    threadId: string;
  }>;

  // Sheets operations
  createSpreadsheet(title: string, data: string[][]): Promise<{
    spreadsheetId: string;
    spreadsheetUrl: string;
  }>;
}

// Minimal scope definitions (constitutional requirement)
export const MinimalScopes = {
  GMAIL: ['https://www.googleapis.com/auth/gmail.send'], // Send only, no read
  DRIVE: ['https://www.googleapis.com/auth/drive.file'], // App-created files only
  CALENDAR: ['https://www.googleapis.com/auth/calendar.readonly'], // Read only
  SHEETS: ['https://www.googleapis.com/auth/spreadsheets'], // Full access for data export
} as const;

// Scope descriptions for user consent UI
export interface ScopePermission {
  title: string;
  description: string;
  icon: string;
  required: boolean;
  sensitive: boolean;
}

export const ScopeDescriptions: Record<string, ScopePermission> = {
  'https://www.googleapis.com/auth/drive.file': {
    title: 'Googleドライブ（作成ファイルのみ）',
    description: '仕様書ファイルの作成と保存',
    icon: '📁',
    required: false,
    sensitive: false,
  },
  'https://www.googleapis.com/auth/gmail.send': {
    title: 'Gmail送信',
    description: '完成した仕様書のメール送信',
    icon: '✉️',
    required: false,
    sensitive: true,
  },
  'https://www.googleapis.com/auth/spreadsheets': {
    title: 'Googleスプレッドシート',
    description: 'データのスプレッドシート形式での出力',
    icon: '📊',
    required: false,
    sensitive: false,
  },
  'https://www.googleapis.com/auth/calendar.readonly': {
    title: 'Googleカレンダー（読み取り専用）',
    description: 'スケジュール連携機能（将来の機能）',
    icon: '📅',
    required: false,
    sensitive: false,
  },
};

// OAuth error types
export class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public description?: string
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export class ScopeError extends Error {
  constructor(
    message: string,
    public requestedScopes: string[],
    public deniedScopes: string[]
  ) {
    super(message);
    this.name = 'ScopeError';
  }
}

// Token storage interface (in-memory only per constitutional requirement)
export interface TokenStorage {
  store(service: string, token: {
    accessToken: string;
    expiresIn: number;
    scope: string;
    issuedAt: Date;
  }): void;
  
  get(service: string): {
    accessToken: string;
    expiresIn: number;
    scope: string;
    issuedAt: Date;
  } | null;
  
  remove(service: string): void;
  clear(): void;
  isExpired(service: string): boolean;
}