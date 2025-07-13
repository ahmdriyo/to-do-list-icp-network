import Time "mo:base/Time";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

actor TodoBackend {
  
  // Definisi tipe Task sebagai record
  public type Task = {
    id: Nat;
    title: Text;
    description: Text;
    completed: Bool;
    createdAt: Int;
    owner: Principal; // Menambahkan owner untuk setiap task
  };

  // Stable variable untuk menyimpan data tasks agar bisa diupgrade
  private stable var nextTaskId: Nat = 1;
  private stable var tasksEntries: [(Text, Task)] = []; // Mengubah format untuk menyimpan dengan key yang tepat
  
  // HashMap menggunakan composite key: "principal_taskId" untuk isolasi user
  private var tasks = Map.HashMap<Text, Task>(10, Text.equal, Text.hash);

  // Helper function untuk membuat composite key: "principal_taskId"
  private func makeTaskKey(owner: Principal, taskId: Nat): Text { 
    Principal.toText(owner) # "_" # Nat.toText(taskId) 
  };

  // Helper function untuk membuat user prefix untuk filter tasks
  private func makeUserPrefix(owner: Principal): Text {
    Principal.toText(owner) # "_"
  };

  // System function untuk memuat data saat upgrade
  system func preupgrade() {
    tasksEntries := Iter.toArray(tasks.entries());
  };

  system func postupgrade() {
    tasks := Map.HashMap<Text, Task>(10, Text.equal, Text.hash);
    for ((key, task) in tasksEntries.vals()) {
      tasks.put(key, task);
    };
    tasksEntries := [];
  };

  /**
   * Menambahkan tugas baru ke dalam daftar
   * @param title - Judul tugas
   * @param description - Deskripsi tugas
   * @return ID tugas yang baru dibuat
   */
  public shared(msg) func addTask(title: Text, description: Text) : async Nat {
    let caller = msg.caller;
    let taskId = nextTaskId;
    let newTask: Task = {
      id = taskId;
      title = title;
      description = description;
      completed = false;
      createdAt = Time.now();
      owner = caller;
    };
    
    let taskKey = makeTaskKey(caller, taskId);
    tasks.put(taskKey, newTask);
    nextTaskId += 1;
    
    taskId
  };

  /**
   * Mengambil semua daftar tugas milik caller
   * @return Array berisi semua tugas milik caller
   */
  public shared query(msg) func getTasks() : async [Task] {
    let caller = msg.caller;
    let userPrefix = makeUserPrefix(caller);
    
    let userTasks = Iter.filter<(Text, Task)>(tasks.entries(), func((key, task): (Text, Task)) : Bool {
      Text.startsWith(key, #text userPrefix)
    });
    
    Iter.toArray(Iter.map<(Text, Task), Task>(userTasks, func((_, task): (Text, Task)) : Task { task }))
  };

  /**
   * Mengambil detail tugas berdasarkan ID (hanya milik caller)
   * @param id - ID tugas yang dicari
   * @return Optional Task, null jika tidak ditemukan atau bukan milik caller
   */
  public shared query(msg) func getTaskById(id: Nat) : async ?Task {
    let caller = msg.caller;
    let taskKey = makeTaskKey(caller, id);
    tasks.get(taskKey)
  };

  /**
   * Mengubah status tugas (completed/not completed) - hanya milik caller
   * @param id - ID tugas yang akan diubah statusnya
   * @return Bool - true jika berhasil, false jika tugas tidak ditemukan atau bukan milik caller
   */
  public shared(msg) func toggleStatus(id: Nat) : async Bool {
    let caller = msg.caller;
    let taskKey = makeTaskKey(caller, id);
    
    switch (tasks.get(taskKey)) {
      case null { false }; // Tugas tidak ditemukan atau bukan milik caller
      case (?existingTask) {
        let updatedTask: Task = {
          id = existingTask.id;
          title = existingTask.title;
          description = existingTask.description;
          completed = not existingTask.completed;
          createdAt = existingTask.createdAt;
          owner = existingTask.owner;
        };
        tasks.put(taskKey, updatedTask);
        true
      };
    }
  };
  /**
   * Menghapus tugas berdasarkan ID - hanya milik caller
   * @param id - ID tugas yang akan dihapus
   * @return Bool - true jika berhasil, false jika tugas tidak ditemukan atau bukan milik caller
   */
  public shared(msg) func deleteTask(id: Nat) : async Bool {
    let caller = msg.caller;
    let taskKey = makeTaskKey(caller, id);
    
    switch (tasks.remove(taskKey)) {
      case null { false }; // Tugas tidak ditemukan atau bukan milik caller
      case (?_) { true };  // Tugas berhasil dihapus
    }
  };

  /**
   * Mengambil jumlah total tugas milik caller
   * @return Jumlah tugas yang dimiliki caller
   */
  public shared query(msg) func getTaskCount() : async Nat {
    let caller = msg.caller;
    let userPrefix = makeUserPrefix(caller);
    
    let userTasks = Iter.filter<(Text, Task)>(tasks.entries(), func((key, task): (Text, Task)) : Bool {
      Text.startsWith(key, #text userPrefix)
    });
    
    Iter.size(userTasks)
  };

  /**
   * Mengambil tugas berdasarkan status completed - hanya milik caller
   * @param completed - Status yang dicari (true/false)
   * @return Array tugas milik caller dengan status yang sesuai
   */
  public shared query(msg) func getTasksByStatus(completed: Bool) : async [Task] {
    let caller = msg.caller;
    let userPrefix = makeUserPrefix(caller);
    
    let filteredTasks = Iter.filter<(Text, Task)>(tasks.entries(), func((key, task): (Text, Task)) : Bool {
      Text.startsWith(key, #text userPrefix) and task.completed == completed
    });
    
    Iter.toArray(Iter.map<(Text, Task), Task>(filteredTasks, func((_, task): (Text, Task)) : Task { task }))
  };

  /**
   * Menghapus semua tugas yang sudah completed - hanya milik caller
   * @return Jumlah tugas yang dihapus
   */
  public shared(msg) func clearCompletedTasks() : async Nat {
    let caller = msg.caller;
    let userPrefix = makeUserPrefix(caller);
    
    let completedTasks = Iter.filter<(Text, Task)>(tasks.entries(), func((key, task): (Text, Task)) : Bool {
      Text.startsWith(key, #text userPrefix) and task.completed
    });
    
    var deletedCount: Nat = 0;
    for ((key, _) in completedTasks) {
      ignore tasks.remove(key);
      deletedCount += 1;
    };
    
    deletedCount
  };

  /**
   * Mengambil principal ID caller untuk debugging
   * @return Principal ID caller
   */
  public shared query(msg) func getMyPrincipal() : async Principal {
    msg.caller
  };
};
