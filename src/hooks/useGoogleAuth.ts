// Google OAuth hook with constitutional compliance
// T032: OAuth state management and error handling

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GoogleAuthConfig,
  AuthResult,
  AuthStatus,
  ConsentRecord,
  MinimalScopes,
} from '../types';
import {
  GoogleOAuthManager,
  OAuthErrorHandler,
  OAuthConstitutionalValidator,
  ErrorHandler,
} from '../utils';

interface UseGoogleAuthOptions {
  config: GoogleAuthConfig;
  enabledServices?: Array<'drive' | 'gmail' | 'sheets' | 'calendar'>;
  onAuthChange?: (status: AuthStatus) => void;
  onError?: (error: any) => void;
}

interface UseGoogleAuthReturn {
  // Auth state
  isInitialized: boolean;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  requestBasicAuth: () => Promise<AuthResult>;
  requestServiceAuth: (service: 'drive' | 'gmail' | 'sheets' | 'calendar', explanation?: string) => Promise<AuthResult>;
  revokeAuth: (service?: string) => Promise<boolean>;
  revokeAllAuth: () => Promise<boolean>;
  
  // Service availability
  canUseService: (service: 'drive' | 'gmail' | 'sheets' | 'calendar') => boolean;
  getRequiredScopes: (service: 'drive' | 'gmail' | 'sheets' | 'calendar') => string[];
  
  // Consent management
  consentHistory: ConsentRecord[];
  refreshConsentHistory: () => void;
  
  // Token management
  getAccessToken: (service: string) => string | null;
  isTokenValid: (service: string) => boolean;
  
  // Constitutional compliance
  validateCompliance: () => boolean;
}

export function useGoogleAuth({
  config,
  enabledServices = ['drive', 'gmail'],
  onAuthChange,
  onError,
}: UseGoogleAuthOptions): UseGoogleAuthReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    grantedScopes: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  
  const oauthManagerRef = useRef<GoogleOAuthManager | null>(null);
  
  // Initialize OAuth manager
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Skip OAuth initialization in development without real Google Client ID
      if (process.env.NODE_ENV === 'development' && 
          config.clientId.includes('example.apps.googleusercontent.com')) {
        console.log('Skipping OAuth initialization in development mode');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }
      
      // Constitutional compliance check: validate config
      if (!OAuthConstitutionalValidator.validateHTTPSOnly(config.redirectUri)) {
        throw new Error('Constitutional violation: OAuth must use HTTPS only');
      }
      
      const manager = new GoogleOAuthManager();
      await manager.initialize(config);
      
      oauthManagerRef.current = manager;
      setIsInitialized(true);
      
      // Get initial auth status
      const status = manager.getAuthStatus();
      setAuthStatus(status);
      
      // Load consent history
      const history = manager.getConsentHistory();
      setConsentHistory(history);
      
      if (onAuthChange) {
        onAuthChange(status);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      
      if (onError) {
        onError(error);
      }
      
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'OAuth initialization failed'
      );
    } finally {
      setIsLoading(false);
    }
  }, [config, onAuthChange, onError]);
  
  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // Update auth status periodically
  useEffect(() => {
    if (!isInitialized || !oauthManagerRef.current) return;
    
    const updateAuthStatus = () => {
      if (oauthManagerRef.current) {
        const status = oauthManagerRef.current.getAuthStatus();
        setAuthStatus(status);
        
        if (onAuthChange) {
          onAuthChange(status);
        }
      }
    };
    
    // Check every minute for token expiration
    const interval = setInterval(updateAuthStatus, 60000);
    
    return () => clearInterval(interval);
  }, [isInitialized, onAuthChange]);
  
  // Request basic authentication (profile, email)
  const requestBasicAuth = useCallback(async (): Promise<AuthResult> => {
    if (!oauthManagerRef.current) {
      return {
        success: false,
        error: 'not_initialized',
        errorDescription: 'OAuth manager not initialized',
      };
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await oauthManagerRef.current.requestBasicAuth();
      
      if (result.success) {
        const newStatus = oauthManagerRef.current.getAuthStatus();
        setAuthStatus(newStatus);
        
        if (onAuthChange) {
          onAuthChange(newStatus);
        }
      } else {
        setError(result.errorDescription || result.error || 'Authentication failed');
      }
      
      return result;
    } catch (error) {
      const errorResult: AuthResult = {
        success: false,
        error: 'auth_failed',
        errorDescription: error instanceof Error ? error.message : String(error),
      };
      
      setError(errorResult.errorDescription || 'Authentication failed');
      
      if (onError) {
        onError(error);
      }
      
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [onAuthChange, onError]);
  
  // Request service-specific authentication
  const requestServiceAuth = useCallback(async (
    service: 'drive' | 'gmail' | 'sheets' | 'calendar',
    explanation?: string
  ): Promise<AuthResult> => {
    if (!oauthManagerRef.current) {
      return {
        success: false,
        error: 'not_initialized',
        errorDescription: 'OAuth manager not initialized',
      };
    }
    
    // Constitutional compliance: only allow enabled services
    if (!enabledServices.includes(service)) {
      return {
        success: false,
        error: 'service_not_enabled',
        errorDescription: `Service ${service} is not enabled`,
      };
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get minimal required scopes for service
      const scopes = getRequiredScopes(service);
      
      const result = await oauthManagerRef.current.requestIncrementalAuth(scopes, explanation);
      
      if (result.success) {
        const newStatus = oauthManagerRef.current.getAuthStatus();
        setAuthStatus(newStatus);
        
        // Update consent history
        const history = oauthManagerRef.current.getConsentHistory();
        setConsentHistory(history);
        
        if (onAuthChange) {
          onAuthChange(newStatus);
        }
      } else {
        // Handle error with user-friendly message
        const errorHandling = OAuthErrorHandler.handleError(result);
        setError(errorHandling.userFriendlyMessage);
      }
      
      return result;
    } catch (error) {
      const errorResult: AuthResult = {
        success: false,
        error: 'auth_failed',
        errorDescription: error instanceof Error ? error.message : String(error),
      };
      
      const errorHandling = OAuthErrorHandler.handleError(error);
      setError(errorHandling.userFriendlyMessage);
      
      if (onError) {
        onError(error);
      }
      
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [enabledServices, onAuthChange, onError]);
  
  // Revoke authentication for specific service
  const revokeAuth = useCallback(async (service?: string): Promise<boolean> => {
    if (!oauthManagerRef.current) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let scopes: string[] | undefined;
      if (service) {
        scopes = getRequiredScopes(service as any);
      }
      
      const success = await oauthManagerRef.current.revokeAuth(scopes);
      
      if (success) {
        const newStatus = oauthManagerRef.current.getAuthStatus();
        setAuthStatus(newStatus);
        
        // Update consent history
        const history = oauthManagerRef.current.getConsentHistory();
        setConsentHistory(history);
        
        if (onAuthChange) {
          onAuthChange(newStatus);
        }
      }
      
      return success;
    } catch (error) {
      setError('Failed to revoke authentication');
      
      if (onError) {
        onError(error);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onAuthChange, onError]);
  
  // Revoke all authentication
  const revokeAllAuth = useCallback(async (): Promise<boolean> => {
    return await revokeAuth();
  }, [revokeAuth]);
  
  // Check if service can be used (has required permissions)
  const canUseService = useCallback((service: 'drive' | 'gmail' | 'sheets' | 'calendar'): boolean => {
    if (!enabledServices.includes(service)) return false;
    
    const requiredScopes = getRequiredScopes(service);
    return requiredScopes.every(scope => authStatus.grantedScopes.includes(scope));
  }, [enabledServices, authStatus.grantedScopes]);
  
  // Get required scopes for service (constitutional compliance: minimal scopes only)
  const getRequiredScopes = useCallback((service: 'drive' | 'gmail' | 'sheets' | 'calendar'): string[] => {
    switch (service) {
      case 'drive':
        return [...MinimalScopes.DRIVE];
      case 'gmail':
        return [...MinimalScopes.GMAIL];
      case 'sheets':
        return [...MinimalScopes.SHEETS];
      case 'calendar':
        return [...MinimalScopes.CALENDAR];
      default:
        return [];
    }
  }, []);
  
  // Refresh consent history
  const refreshConsentHistory = useCallback(() => {
    if (oauthManagerRef.current) {
      const history = oauthManagerRef.current.getConsentHistory();
      setConsentHistory(history);
    }
  }, []);
  
  // Get access token for service
  const getAccessToken = useCallback((service: string): string | null => {
    if (!oauthManagerRef.current) return null;
    return oauthManagerRef.current.getToken(service);
  }, []);
  
  // Check if token is valid (not expired)
  const isTokenValid = useCallback((service: string): boolean => {
    const token = getAccessToken(service);
    return token !== null;
  }, [getAccessToken]);
  
  // Constitutional compliance validation
  const validateCompliance = useCallback((): boolean => {
    if (!oauthManagerRef.current) return false;
    
    try {
      // Check minimal permission principle
      const allGrantedScopes = authStatus.grantedScopes;
      if (!OAuthConstitutionalValidator.validateMinimalPermissionPrinciple(allGrantedScopes)) {
        console.error('Constitutional violation: Non-minimal scopes granted');
        return false;
      }
      
      // Check HTTPS-only requirement
      if (!OAuthConstitutionalValidator.validateHTTPSOnly(config.redirectUri)) {
        console.error('Constitutional violation: Non-HTTPS redirect URI');
        return false;
      }
      
      // Check in-memory token storage only
      // Note: This is a simplified check - in production, would be more thorough
      const hasLocalStorageTokens = Object.keys(localStorage).some(key => 
        key.includes('token') || key.includes('auth')
      );
      
      if (hasLocalStorageTokens) {
        console.error('Constitutional violation: Tokens found in localStorage');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Constitutional compliance validation failed:', error);
      return false;
    }
  }, [authStatus.grantedScopes, config.redirectUri]);
  
  // Validate compliance periodically
  useEffect(() => {
    if (!isInitialized) return;
    
    const validatePeriodically = () => {
      const compliant = validateCompliance();
      if (!compliant) {
        console.warn('OAuth constitutional compliance violation detected');
      }
    };
    
    // Validate every 5 minutes
    const interval = setInterval(validatePeriodically, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isInitialized, validateCompliance]);
  
  return {
    // Auth state
    isInitialized,
    isAuthenticated: authStatus.isAuthenticated,
    authStatus,
    isLoading,
    error,
    
    // Auth actions
    requestBasicAuth,
    requestServiceAuth,
    revokeAuth,
    revokeAllAuth,
    
    // Service availability
    canUseService,
    getRequiredScopes,
    
    // Consent management
    consentHistory,
    refreshConsentHistory,
    
    // Token management
    getAccessToken,
    isTokenValid,
    
    // Constitutional compliance
    validateCompliance,
  };
}