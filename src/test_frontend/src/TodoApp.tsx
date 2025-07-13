import React, { useState, useEffect } from 'react';

// Interface untuk struktur data Task
interface Task {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
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

const TodoApp: React.FC = () => {
  // Load tasks from localStorage on component mount
  const loadTasksFromStorage = (): Task[] => {
    try {
      const savedTasks = localStorage.getItem('todoTasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        // Convert createdAt string back to Date object
        return parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
      }
    } catch (error) {
      console.error('Error loading tasks from localStorage:', error);
    }
    return [];
  };

  const [tasks, setTasks] = useState<Task[]>(loadTasksFromStorage());
  const [taskInput, setTaskInput] = useState<TaskInput>({ title: '', description: '' });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem('todoTasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

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

  // Menambahkan tugas baru
  const addTask = (): void => {
    if (!validateInput()) return;

    const newTask: Task = {
      id: Date.now(), // Simple ID generation
      title: taskInput.title.trim(),
      description: taskInput.description.trim(),
      isCompleted: false,
      createdAt: new Date()
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    setTaskInput({ title: '', description: '' });
    setErrors({});
    showToastMessage('Tugas berhasil ditambahkan! 🎉');
  };

  // Toggle status completed tugas
  const toggleTaskComplete = (id: number): void => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  // Menghapus tugas
  const deleteTask = (id: number): void => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    showToastMessage('Tugas berhasil dihapus! 🗑️');
  };

  // Hapus semua tugas
  const clearAllTasks = (): void => {
    if (tasks.length === 0) return;
    
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus semua tugas?');
    if (confirmDelete) {
      setTasks([]);
      showToastMessage('Semua tugas berhasil dihapus! 🧹');
    }
  };

  // Hapus tugas yang sudah selesai
  const clearCompletedTasks = (): void => {
    const completedTasksCount = tasks.filter(task => task.isCompleted).length;
    if (completedTasksCount === 0) return;

    const confirmDelete = window.confirm(`Hapus ${completedTasksCount} tugas yang sudah selesai?`);
    if (confirmDelete) {
      setTasks(prevTasks => prevTasks.filter(task => !task.isCompleted));
      showToastMessage(`${completedTasksCount} tugas selesai berhasil dihapus! ✨`);
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
    if (e.key === 'Enter' && e.ctrlKey) {
      addTask();
    }
  };

  // Statistik tugas
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📝 To-Do List App
          </h1>
          <p className="text-gray-600">Kelola tugas-tugas Anda dengan mudah</p>
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
                onClick={clearAllTasks}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                🗑️ Hapus Semua
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              ➕ Tambah Tugas
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
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg ${
                  task.isCompleted ? 'opacity-75' : 'opacity-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTaskComplete(task.id)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                  />
                  
                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-lg font-medium transition-all duration-200 ${
                        task.isCompleted
                          ? 'text-gray-500 line-through'
                          : 'text-gray-800'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p
                      className={`text-sm mt-1 transition-all duration-200 ${
                        task.isCompleted
                          ? 'text-gray-400 line-through'
                          : 'text-gray-600'
                      }`}
                    >
                      {task.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      📅 Dibuat: {task.createdAt.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors duration-200"
                    title="Hapus tugas"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default TodoApp;
