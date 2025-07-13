// import { test_backend } from '../../declarations/test_backend';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import { Identity } from '@dfinity/agent';

// Interface untuk struktur data Task sesuai dengan backend Motoko
export interface Task {
  id: bigint;
  title: string;
  description: string;
  completed: boolean;
  createdAt: bigint;
  owner: string; // Principal sebagai string
}

// Interface untuk form input
export interface TaskInput {
  title: string;
  description: string;
}

// Interface untuk validasi error
export interface ValidationErrors {
  title?: string;
  description?: string;
}

// Interface untuk loading states
export interface LoadingStates {
  adding: boolean;
  loading: boolean;
  toggling: Set<string>;
  deleting: Set<string>;
}

/**
 * Helper function untuk format tanggal dari nanoseconds
 */
export const formatDate = (timestamp: bigint): string => {
  try {
    // Convert nanoseconds to milliseconds
    const milliseconds = Number(timestamp / BigInt(1000000));
    const date = new Date(milliseconds);
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Tanggal tidak valid';
  }
};

/**
 * Helper function untuk format principal (diperpendek)
 */
export const formatPrincipal = (principal: string): string => {
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
};

/**
 * Helper function untuk validasi input
 */
export const validateTaskInput = (input: TaskInput): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (!input.title.trim()) {
    errors.title = 'Judul tugas tidak boleh kosong';
  } else if (input.title.trim().length > 100) {
    errors.title = 'Judul tugas maksimal 100 karakter';
  }
  
  if (!input.description.trim()) {
    errors.description = 'Deskripsi tugas tidak boleh kosong';
  } else if (input.description.trim().length > 500) {
    errors.description = 'Deskripsi tugas maksimal 500 karakter';
  }
  
  return errors;
};
