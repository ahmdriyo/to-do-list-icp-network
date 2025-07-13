import Time "mo:base/Time";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Nat "mo:base/Nat";

actor TodoBackend {
  
  // Definisi tipe Task sebagai record
  public type Task = {
    id: Nat;
    title: Text;
    description: Text;
    completed: Bool;
    createdAt: Int;
  };

  // Stable variable untuk menyimpan data tasks agar bisa diupgrade
  private stable var nextTaskId: Nat = 1;
  private stable var tasksEntries: [(Nat, Task)] = [];
  
  // HashMap menggunakan Text key untuk menghindari masalah hash
  private var tasks = Map.HashMap<Text, Task>(10, Text.equal, Text.hash);

  // Helper function untuk convert Nat ke Text key
  private func natToKey(n: Nat): Text { Nat.toText(n) };

  // System function untuk memuat data saat upgrade
  system func preupgrade() {
    tasksEntries := Iter.toArray(
      Iter.map<(Text, Task), (Nat, Task)>(
        tasks.entries(),
        func((key, task): (Text, Task)): (Nat, Task) {
          (task.id, task)
        }
      )
    );
  };

  system func postupgrade() {
    tasks := Map.HashMap<Text, Task>(10, Text.equal, Text.hash);
    for ((id, task) in tasksEntries.vals()) {
      tasks.put(natToKey(id), task);
    };
    tasksEntries := [];
  };

  /**
   * Menambahkan tugas baru ke dalam daftar
   * @param title - Judul tugas
   * @param description - Deskripsi tugas
   * @return ID tugas yang baru dibuat
   */
  public func addTask(title: Text, description: Text) : async Nat {
    let taskId = nextTaskId;
    let newTask: Task = {
      id = taskId;
      title = title;
      description = description;
      completed = false;
      createdAt = Time.now();
    };
    
    tasks.put(natToKey(taskId), newTask);
    nextTaskId += 1;
    
    taskId
  };

  /**
   * Mengambil semua daftar tugas
   * @return Array berisi semua tugas
   */
  public query func getTasks() : async [Task] {
    Iter.toArray(tasks.vals())
  };

  /**
   * Mengambil detail tugas berdasarkan ID
   * @param id - ID tugas yang dicari
   * @return Optional Task, null jika tidak ditemukan
   */
  public query func getTaskById(id: Nat) : async ?Task {
    tasks.get(natToKey(id))
  };

  /**
   * Mengubah status tugas (completed/not completed)
   * @param id - ID tugas yang akan diubah statusnya
   * @return Bool - true jika berhasil, false jika tugas tidak ditemukan
   */
  public func toggleStatus(id: Nat) : async Bool {
    switch (tasks.get(natToKey(id))) {
      case null { false }; // Tugas tidak ditemukan
      case (?existingTask) {
        let updatedTask: Task = {
          id = existingTask.id;
          title = existingTask.title;
          description = existingTask.description;
          completed = not existingTask.completed;
          createdAt = existingTask.createdAt;
        };
        tasks.put(natToKey(id), updatedTask);
        true
      };
    }
  };
  /**
   * Menghapus tugas berdasarkan ID
   * @param id - ID tugas yang akan dihapus
   * @return Bool - true jika berhasil, false jika tugas tidak ditemukan
   */
  public func deleteTask(id: Nat) : async Bool {
    switch (tasks.remove(natToKey(id))) {
      case null { false }; // Tugas tidak ditemukan
      case (?_) { true };  // Tugas berhasil dihapus
    }
  };

  /**
   * Mengambil jumlah total tugas
   * @return Jumlah tugas yang ada
   */
  public query func getTaskCount() : async Nat {
    tasks.size()
  };

  /**
   * Mengambil tugas berdasarkan status completed
   * @param completed - Status yang dicari (true/false)
   * @return Array tugas dengan status yang sesuai
   */
  public query func getTasksByStatus(completed: Bool) : async [Task] {
    let filteredTasks = Iter.filter<Task>(tasks.vals(), func(task: Task) : Bool {
      task.completed == completed
    });
    Iter.toArray(filteredTasks)
  };

  /**
   * Menghapus semua tugas yang sudah completed
   * @return Jumlah tugas yang dihapus
   */
  public func clearCompletedTasks() : async Nat {
    let completedTasks = Iter.filter<(Text, Task)>(tasks.entries(), func((key, task): (Text, Task)) : Bool {
      task.completed
    });
    
    var deletedCount: Nat = 0;
    for ((key, _) in completedTasks) {
      ignore tasks.remove(key);
      deletedCount += 1;
    };
    
    deletedCount
  };
};
