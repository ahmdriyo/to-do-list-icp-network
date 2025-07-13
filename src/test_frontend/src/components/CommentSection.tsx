import React, { useState, useEffect } from 'react';
import { validateComment } from '../services/todoService';

// Interface untuk CommentSection props
interface CommentSectionProps {
  taskId: bigint;
  comments: string[];
  onAddComment: (taskId: bigint, comment: string) => Promise<boolean>;
  onLoadComments: (taskId: bigint) => Promise<string[]>;
  isLoading?: boolean;
  isAddingComment?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  taskId,
  comments: initialComments,
  onAddComment,
  onLoadComments,
  isLoading = false,
  isAddingComment = false,
}) => {
  const [comments, setComments] = useState<string[]>(initialComments);
  const [newComment, setNewComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);

  // Update comments ketika initialComments berubah
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Load comments ketika section di-expand
  useEffect(() => {
    if (isExpanded && comments.length === 0) {
      loadComments();
    }
  }, [isExpanded]);

  /**
   * Load comments dari backend
   */
  const loadComments = async (): Promise<void> => {
    try {
      setIsLoadingComments(true);
      const loadedComments = await onLoadComments(taskId);
      setComments(loadedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  /**
   * Handle submit comment baru
   */
  const handleSubmitComment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validasi comment
    const validationError = validateComment(newComment);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const success = await onAddComment(taskId, newComment.trim());
      if (success) {
        // Tambahkan comment ke local state
        setComments(prev => [...prev, newComment.trim()]);
        setNewComment('');
        setError(null);
      } else {
        setError('Gagal menambahkan komentar');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Terjadi kesalahan saat menambahkan komentar');
    }
  };

  /**
   * Handle input change dengan validasi real-time
   */
  const handleInputChange = (value: string): void => {
    setNewComment(value);
    if (error) {
      setError(null);
    }
  };

  /**
   * Handle expand/collapse section
   */
  const toggleExpanded = (): void => {
    setIsExpanded(prev => !prev);
  };

  const commentCount = comments.length;

  return (
    <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="flex items-center justify-between w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
      >
        <span className="flex items-center">
          <span className="mr-2">💬</span>
          Komentar ({commentCount})
        </span>
        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Add Comment Form */}
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Tambahkan komentar..."
                disabled={isAddingComment}
                className={`flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                  error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                maxLength={200}
              />
              <button
                type="submit"
                disabled={isAddingComment || !newComment.trim()}
                className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed flex items-center"
              >
                {isAddingComment ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  '💬'
                )}
              </button>
            </div>
            
            {/* Error message */}
            {error && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>
            )}
            
            {/* Character count */}
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
              {newComment.length}/200
            </p>
          </form>

          {/* Comments List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Memuat komentar...</span>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2 italic">
                Belum ada komentar. Jadilah yang pertama!
              </p>
            ) : (
              comments.map((comment, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 text-sm"
                >
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {comment}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Komentar #{index + 1}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
