import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { createAuthenticatedBackend, clearBackendActor } from '../services/backendService';
import type { _SERVICE } from '../../../declarations/test_backend/test_backend.did';

// Interface untuk Auth Context
interface AuthContextType {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: string | null;
  authClient: AuthClient | null;
  backendActor: _SERVICE | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Interface untuk AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// Buat context dengan default values
const AuthContext = createContext<AuthContextType | null>(null);

// Internet Identity setup berdasarkan dokumentasi resmi
const network = import.meta.env.VITE_DFX_NETWORK || 'local';
const identityProvider = network === 'ic' 
  ? 'https://identity.ic0.app' // Mainnet
  : 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943'; // Local development

// Custom hook untuk menggunakan auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [backendActor, setBackendActor] = useState<_SERVICE | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth client ketika component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize AuthClient dan check apakah user sudah login
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      // Check apakah user sudah authenticated
      const isAuth = await client.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const identity = client.getIdentity();
        setIdentity(identity);
        setPrincipal(identity.getPrincipal().toString());
        
        // Create authenticated backend actor
        try {
          const actor = await createAuthenticatedBackend(identity);
          setBackendActor(actor);
        } catch (error) {
          console.error('Failed to create backend actor:', error);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login menggunakan Internet Identity
   */
  const login = async (): Promise<void> => {
    if (!authClient) {
      console.error('AuthClient not initialized');
      return;
    }

    try {
      setLoading(true);
      
      // Login dengan Internet Identity
      await new Promise<void>((resolve, reject) => {
        authClient.login({
          identityProvider,
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        });
      });

      // Update state setelah login sukses
      const identity = authClient.getIdentity();
      setIdentity(identity);
      setPrincipal(identity.getPrincipal().toString());
      setIsAuthenticated(true);
      
      // Create authenticated backend actor
      try {
        const actor = await createAuthenticatedBackend(identity);
        setBackendActor(actor);
      } catch (error) {
        console.error('Failed to create backend actor:', error);
      }
      
      console.log('Login successful, Principal:', identity.getPrincipal().toString());
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout dan clear authentication state
   */
  const logout = async (): Promise<void> => {
    if (!authClient) {
      console.error('AuthClient not initialized');
      return;
    }

    try {
      setLoading(true);
      
      await authClient.logout();
      
      // Clear state
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setBackendActor(null);
      clearBackendActor(); // Clear the backend actor instance
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Context value yang akan di-provide
  const value: AuthContextType = {
    isAuthenticated,
    identity,
    principal,
    authClient,
    backendActor,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
