import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory, canisterId } from '../../../declarations/test_backend';
import type { _SERVICE } from '../../../declarations/test_backend/test_backend.did';

let backendActor: _SERVICE | null = null;

/**
 * Creates an authenticated backend actor using the current identity
 * @param identity - The authenticated identity from AuthClient
 * @returns Authenticated backend actor
 */
export const createAuthenticatedBackend = async (identity: Identity): Promise<_SERVICE> => {
  const network = import.meta.env.VITE_DFX_NETWORK || 'local';
  const agent = new HttpAgent({
    identity,
    host: network === 'ic' ? 'https://ic0.app' : 'http://localhost:4943',
  });

  // Fetch root key for certificate validation during development
  if (network !== 'ic') {
    await agent.fetchRootKey().catch((err) => {
      console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      console.error(err);
    });
  }

  const actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: canisterId!,
  });

  backendActor = actor;
  return actor;
};

/**
 * Gets the current backend actor instance
 * @returns Current backend actor or null if not initialized
 */
export const getBackendActor = (): _SERVICE | null => {
  return backendActor;
};

/**
 * Initialize backend service with authentication
 * @returns Promise that resolves with authenticated backend actor
 */
export const initializeBackend = async (): Promise<_SERVICE | null> => {
  try {
    const authClient = await AuthClient.create();
    const isAuthenticated = await authClient.isAuthenticated();
    
    if (!isAuthenticated) {
      console.warn('User not authenticated');
      return null;
    }

    const identity = authClient.getIdentity();
    return await createAuthenticatedBackend(identity);
  } catch (error) {
    console.error('Failed to initialize backend:', error);
    return null;
  }
};

/**
 * Clear backend actor instance (on logout)
 */
export const clearBackendActor = (): void => {
  backendActor = null;
};
