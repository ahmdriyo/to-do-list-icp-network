import React, { useState, useEffect } from 'react';
import { test_backend } from '../../declarations/test_backend';

// Interface untuk struktur data Task sesuai dengan backend Motoko
interface Task {
  id: bigint;
  title: string;
  description: string;
  completed: boolean;
  createdAt: bigint;
}

// Interface untuk form input
interface TaskInput {
  title: string;
  description: string;
}

// Interface untuk validasi error
interface ValidationErrors {
  title?: string;
  description?: string;
}

// Interface untuk loading states
interface LoadingStates {
  adding: boolean;
  loading: boolean;
  toggling: Set<string>;
  deleting: Set<string>;
}

const TodoApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState<TaskInput>({ title: '', description: '' });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    adding: false,
    loading: true,
    toggling: new Set(),
    deleting: new Set()
  });

  // Load tasks from backend when component mounts
  useEffect(() => {
    loadTasks();
  }, []);

  // Load tasks from backend canister
  const loadTasks = async (): Promise<void> => {
    try {
      setLoadingStates(prev => ({ ...prev, loading: true }));
      const backendTasks = await test_backend.getTasks();
      setTasks(backendTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToastMessage('Gagal memuat tugas dari backend! ❌');
    } finally {
      setLoadingStates(prev => ({ ...prev, loading: false }));
    }
  };

  // Validasi input form
  const validateInput = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!taskInput.title.trim()) {
      newErrors.title = 'Judul tugas tidak boleh kosong';
    }
    
    if (!taskInput.description.trim()) {
      newErrors.description = 'Deskripsi tugas tidak boleh kosong';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fungsi untuk menampilkan toast notification
  const showToastMessage = (message: string): void => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Menambahkan tugas baru ke backend
  const addTask = async (): Promise<void> => {
    if (!validateInput()) return;

    try {
      setLoadingStates(prev => ({ ...prev, adding: true }));
      
      const taskId = await test_backend.addTask(
        taskInput.title.trim(),
        taskInput.description.trim()
      );
      
      console.log('Task added with ID:', taskId.toString());
      
      // Reload tasks after adding
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

  // Toggle status completed tugas di backend
  const toggleTaskComplete = async (id: bigint): Promise<void> => {
    const idString = id.toString();
    
    try {
      setLoadingStates(prev => ({
        ...prev,
        toggling: new Set([...prev.toggling, idString])
      }));
      
      const success = await test_backend.toggleStatus(id);
      
      if (success) {
        // Update local state optimistically
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        );
        showToastMessage('Status tugas berhasil diubah! ✅');
      } else {
        showToastMessage('Tugas tidak ditemukan! ❌');
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

  // Menghapus tugas dari backend
  const deleteTask = async (id: bigint): Promise<void> => {
    const idString = id.toString();
    
    try {
      setLoadingStates(prev => ({
        ...prev,
        deleting: new Set([...prev.deleting, idString])
      }));
      
      const success = await test_backend.deleteTask(id);
      
      if (success) {
        // Update local state
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        showToastMessage('Tugas berhasil dihapus! 🗑️');
      } else {
        showToastMessage('Tugas tidak ditemukan! ❌');
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

  // Hapus semua tugas yang sudah selesai
  const clearCompletedTasks = async (): Promise<void> => {
    const completedTasksCount = tasks.filter(task => task.completed).length;
    if (completedTasksCount === 0) return;

    const confirmDelete = window.confirm(`Hapus ${completedTasksCount} tugas yang sudah selesai?`);
    if (confirmDelete) {
      try {
        const deletedCount = await test_backend.clearCompletedTasks();
        await loadTasks(); // Reload tasks after clearing
        showToastMessage(`${Number(deletedCount)} tugas selesai berhasil dihapus! ✨`);
      } catch (error) {
        console.error('Error clearing completed tasks:', error);
        showToastMessage('Gagal menghapus tugas yang selesai! ❌');
      }
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof TaskInput, value: string): void => {
    setTaskInput(prev => ({ ...prev, [field]: value }));
    // Clear error saat user mulai mengetik
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && e.ctrlKey && !loadingStates.adding) {
      addTask();
    }
  };

  // Helper function untuk format tanggal dari nanoseconds
  const formatDate = (timestamp: bigint): string => {
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

  // Statistik tugas
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  // Show loading spinner during initial load
  if (loadingStates.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat tugas dari blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📝 To-Do List App
          </h1>
          <p className="text-gray-600">Powered by Internet Computer (ICP)</p>
          <p className="text-sm text-gray-500">Tugas Anda disimpan di blockchain</p>
        </div>

        {/* Statistik */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
              <div className="text-sm text-gray-500">Total Tugas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-sm text-gray-500">Selesai</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalTasks - completedTasks}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round((completedTasks / totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {totalTasks > 0 && (
            <div className="mt-4 flex gap-2 justify-center">
              {completedTasks > 0 && (
                <button
                  onClick={clearCompletedTasks}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  🧹 Hapus yang Selesai ({completedTasks})
                </button>
              )}
              <button
                onClick={loadTasks}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          )}
        </div>

        {/* Form Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tambah Tugas Baru</h2>
          
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors disabled:bg-gray-100 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={addTask}
              disabled={loadingStates.adding}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
            >
              {loadingStates.adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menambahkan...
                </>
              ) : (
                '➕ Tambah Tugas'
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              💡 Tips: Tekan Ctrl + Enter untuk menambah tugas
            </p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">Belum ada tugas</h3>
              <p className="text-gray-400">Tambahkan tugas pertama Anda di atas!</p>
            </div>
          ) : (
            tasks.map((task) => {
              const taskIdString = task.id.toString();
              const isToggling = loadingStates.toggling.has(taskIdString);
              const isDeleting = loadingStates.deleting.has(taskIdString);
              
              return (
                <div
                  key={taskIdString}
                  className={`bg-white rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg ${
                    task.completed ? 'opacity-75' : 'opacity-100'
                  } ${(isToggling || isDeleting) ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task.id)}
                      disabled={isToggling || isDeleting}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors disabled:opacity-50"
                    />
                    
                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium transition-all duration-200 ${
                          task.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-800'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p
                        className={`text-sm mt-1 transition-all duration-200 ${
                          task.completed
                            ? 'text-gray-400 line-through'
                            : 'text-gray-600'
                        }`}
                      >
                        {task.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        📅 Dibuat: {formatDate(task.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        🆔 ID: {taskIdString}
                      </p>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      disabled={isToggling || isDeleting}
                      className="text-red-500 hover:text-red-700 disabled:text-red-300 p-2 rounded-md hover:bg-red-50 transition-colors duration-200 disabled:cursor-not-allowed"
                      title="Hapus tugas"
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        '🗑️'
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
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default TodoApp;
