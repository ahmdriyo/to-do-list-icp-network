import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import {
  Task,
  TaskInput,
  LoadingStates,
  formatDate,
  formatPrincipal,
  validateTaskInput,
} from './services/todoService';

const TodoAppEnhanced: React.FC = () => {
  // Context hooks
  const { isAuthenticated, principal, logout, backendActor } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState<TaskInput>({ title: '', description: '' });
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    adding: false,
    loading: true,
    toggling: new Set(),
    deleting: new Set(),
  });

  // Load tasks ketika component mount atau authentication berubah
  useEffect(() => {
    if (isAuthenticated && backendActor) {
      loadTasks();
    }
  }, [isAuthenticated, backendActor]);

  /**
   * Load semua tasks dari backend
   */
  const loadTasks = async (): Promise<void> => {
    if (!backendActor) {
      console.error('Backend actor not available');
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, loading: true }));
      const backendTasks = await backendActor.getTasks();
      
      // Convert backend tasks ke format yang digunakan frontend
      const formattedTasks: Task[] = backendTasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        owner: task.owner.toString(), // Convert Principal to string
      }));
      
      setTasks(formattedTasks);
      console.log('Tasks loaded:', formattedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToastMessage('Gagal memuat tugas dari backend! ❌');
    } finally {
      setLoadingStates(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Tampilkan toast notification
   */
  const showToastMessage = (message: string): void => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  /**
   * Tambah task baru
   */
  const addTask = async (): Promise<void> => {
    if (!backendActor) {
      console.error('Backend actor not available');
      return;
    }

    const validationErrors = validateTaskInput(taskInput);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, adding: true }));
      
      const taskId = await backendActor.addTask(
        taskInput.title.trim(),
        taskInput.description.trim()
      );
      
      console.log('Task added with ID:', taskId.toString());
      
      // Reload tasks setelah menambah
      await loadTasks();
      
      setTaskInput({ title: '', description: '' });
      setErrors({});
      showToastMessage('Tugas berhasil ditambahkan! 🎉');
      
    } catch (error) {
      console.error('Error adding task:', error);
      showToastMessage('Gagal menambahkan tugas! ❌');
    } finally {
      setLoadingStates(prev => ({ ...prev, adding: false }));
    }
  };

  /**
   * Toggle status completed task
   */
  const toggleTaskComplete = async (id: bigint): Promise<void> => {
    if (!backendActor) {
      console.error('Backend actor not available');
      return;
    }

    const idString = id.toString();
    
    try {
      setLoadingStates(prev => ({
        ...prev,
        toggling: new Set([...prev.toggling, idString])
      }));
      
      const success = await backendActor.toggleStatus(id);
      
      if (success) {
        // Update local state
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        );
        showToastMessage('Status tugas berhasil diubah! ✅');
      } else {
        showToastMessage('Gagal mengubah status tugas! ❌');
      }
      
    } catch (error) {
      console.error('Error toggling task:', error);
      showToastMessage('Gagal mengubah status tugas! ❌');
    } finally {
      setLoadingStates(prev => {
        const newToggling = new Set(prev.toggling);
        newToggling.delete(idString);
        return { ...prev, toggling: newToggling };
      });
    }
  };

  /**
   * Hapus task
   */
  const deleteTask = async (id: bigint): Promise<void> => {
    if (!backendActor) {
      console.error('Backend actor not available');
      return;
    }

    const idString = id.toString();
    
    try {
      setLoadingStates(prev => ({
        ...prev,
        deleting: new Set([...prev.deleting, idString])
      }));
      
      const success = await backendActor.deleteTask(id);
      
      if (success) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        showToastMessage('Tugas berhasil dihapus! 🗑️');
      } else {
        showToastMessage('Gagal menghapus tugas! ❌');
      }
      
    } catch (error) {
      console.error('Error deleting task:', error);
      showToastMessage('Gagal menghapus tugas! ❌');
    } finally {
      setLoadingStates(prev => {
        const newDeleting = new Set(prev.deleting);
        newDeleting.delete(idString);
        return { ...prev, deleting: newDeleting };
      });
    }
  };

  /**
   * Hapus semua task yang completed
   */
  const clearCompletedTasks = async (): Promise<void> => {
    if (!backendActor) {
      console.error('Backend actor not available');
      return;
    }

    const completedTasksCount = tasks.filter(task => task.completed).length;
    if (completedTasksCount === 0) return;

    const confirmDelete = window.confirm(`Hapus ${completedTasksCount} tugas yang sudah selesai?`);
    if (confirmDelete) {
      try {
        const deletedCount = await backendActor.clearCompletedTasks();
        await loadTasks();
        showToastMessage(`${Number(deletedCount)} tugas selesai berhasil dihapus! ✨`);
      } catch (error) {
        console.error('Error clearing completed tasks:', error);
        showToastMessage('Gagal menghapus tugas yang selesai! ❌');
      }
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (field: keyof TaskInput, value: string): void => {
    setTaskInput(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && e.ctrlKey && !loadingStates.adding) {
      addTask();
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Statistik
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  // Loading screen
  if (loadingStates.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Memuat tugas dari blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-4 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header dengan User Info dan Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                📝 To-Do List App
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Powered by Internet Computer (ICP)
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              {/* User Info */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    👤 {principal ? formatPrincipal(principal) : 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Logged in
                  </p>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors duration-200"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistik */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalTasks}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Tugas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{completedTasks}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Selesai</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{totalTasks - completedTasks}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span>Progress</span>
                <span>{Math.round((completedTasks / totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 dark:bg-green-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {totalTasks > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {completedTasks > 0 && (
                <button
                  onClick={clearCompletedTasks}
                  className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  🧹 Hapus yang Selesai ({completedTasks})
                </button>
              )}
              <button
                onClick={loadTasks}
                className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          )}
        </div>

        {/* Form Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-300">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Tambah Tugas Baru</h2>
          
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Judul Tugas
              </label>
              <input
                id="title"
                type="text"
                value={taskInput.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Masukkan judul tugas..."
                disabled={loadingStates.adding}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                  errors.title ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                maxLength={100}
              />
              {errors.title && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi
              </label>
              <textarea
                id="description"
                value={taskInput.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Masukkan deskripsi tugas..."
                rows={3}
                disabled={loadingStates.adding}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                  errors.description ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                maxLength={500}
              />
              {errors.description && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={addTask}
              disabled={loadingStates.adding}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center"
            >
              {loadingStates.adding ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Menambahkan...
                </>
              ) : (
                '➕ Tambah Tugas'
              )}
            </button>
          </div>
        </div>
        {/* Task List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center transition-colors duration-300">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Belum ada tugas</h3>
              <p className="text-gray-400 dark:text-gray-500">Tambahkan tugas pertama Anda di atas!</p>
            </div>
          ) : (
            tasks.map((task) => {
              const taskIdString = task.id.toString();
              const isToggling = loadingStates.toggling.has(taskIdString);
              const isDeleting = loadingStates.deleting.has(taskIdString);
              
              return (
                <div
                  key={taskIdString}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg ${
                    task.completed ? 'opacity-75' : 'opacity-100'
                  } ${(isToggling || isDeleting) ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task.id)}
                      disabled={isToggling || isDeleting}
                      className="mt-1 w-6 h-6 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 transition-colors disabled:opacity-50"
                    />
                    
                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-xl font-medium transition-all duration-200 ${
                          task.completed
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : 'text-gray-800 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p
                        className={`text-sm mt-2 transition-all duration-200 ${
                          task.completed
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {task.description}
                      </p>
                      
                      {/* Task Metadata */}
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          📅 Dibuat: {formatDate(task.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          🆔 ID: {taskIdString}
                        </p>
                        {task.owner && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            👤 Pemilik: {formatPrincipal(task.owner)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      disabled={isToggling || isDeleting}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:text-red-300 dark:disabled:text-red-600 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200 disabled:cursor-not-allowed"
                      title="Hapus tugas"
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50 transition-colors duration-300">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default TodoAppEnhanced;
