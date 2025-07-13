// import { test_backend } from '../../declarations/test_backend';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import { Identity } from '@dfinity/agent';

// Interface untuk struktur data Task sesuai dengan backend Motoko (dengan owner dan comments)
export interface Task {
  id: bigint;
  title: string;
  description: string;
  completed: boolean;
  createdAt: bigint;
  owner: string; // Principal sebagai string
  comments: string[];
}

// Interface untuk form input
export interface TaskInput {
  title: string;
  description: string;
}

// Interface untuk comment input
export interface CommentInput {
  taskId: bigint;
  comment: string;
}

// Interface untuk validasi error
export interface ValidationErrors {
  title?: string;
  description?: string;
  comment?: string;
}

// Interface untuk loading states
export interface LoadingStates {
  adding: boolean;
  loading: boolean;
  toggling: Set<string>;
  deleting: Set<string>;
  commenting: Set<string>;
  addingComment: Set<string>;
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

/**
 * Helper function untuk validasi comment
 */
export const validateComment = (comment: string): string | null => {
  if (!comment.trim()) {
    return 'Komentar tidak boleh kosong';
  }
  if (comment.trim().length > 200) {
    return 'Komentar maksimal 200 karakter';
  }
  return null;
};
