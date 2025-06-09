import React, { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import Layout from "../components/Layout";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: "Low" | "Medium" | "High" | "Critical";
  assignee?: string;
  tags?: string[];
  column_id: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface Column {
  id: string;
  title: string;
  order_index: number;
  tasks: Task[];
}

interface Board {
  id: string;
  title: string;
  columns: Column[];
}

export default function Tasks() {
  const [board, setBoard] = useState<Board>({
    id: "main-board",
    title: "Project Management Board",
    columns: [],
  });

  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [editingColumn, setEditingColumn] = useState<string>("");
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium" as Task["priority"],
    assignee: "",
  });

  // Load tasks and columns from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      
      setBoard({
        id: "main-board",
        title: "Project Management Board",
        columns: data.columns || [],
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Keep empty state on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Optimistically update the UI
    setBoard((prevBoard) => {
      const newBoard = { ...prevBoard };
      const sourceColumn = newBoard.columns.find(col => col.id === source.droppableId);
      const destColumn = newBoard.columns.find(col => col.id === destination.droppableId);

      if (!sourceColumn || !destColumn) return prevBoard;

      const task = sourceColumn.tasks.find(task => task.id === draggableId);
      if (!task) return prevBoard;

      // Remove task from source column
      sourceColumn.tasks = sourceColumn.tasks.filter(task => task.id !== draggableId);

      // Add task to destination column
      const updatedTask = { ...task, column_id: destination.droppableId };
      destColumn.tasks.splice(destination.index, 0, updatedTask);

      return newBoard;
    });

    // Update task in database
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: draggableId,
          column_id: destination.droppableId,
          order_index: destination.index,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Reload data to get correct state
      loadData();
    }
  }, [loadData]);

  const addTask = useCallback(async () => {
    if (!newTask.title.trim() || !selectedColumn) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          assignee: newTask.assignee,
          tags: [],
          column_id: selectedColumn,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      // Reload data to get the new task
      await loadData();

      setNewTask({ title: "", description: "", priority: "Medium", assignee: "" });
      setShowAddTaskModal(false);
      setSelectedColumn("");
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }, [newTask, selectedColumn, loadData]);

  const addColumn = useCallback(async () => {
    if (!newColumnTitle.trim()) return;

    try {
      const response = await fetch('/api/task-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newColumnTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create column');
      }

      // Reload data to get the new column
      await loadData();

      setNewColumnTitle("");
      setShowAddColumnModal(false);
    } catch (error) {
      console.error('Error creating column:', error);
    }
  }, [newColumnTitle, loadData]);

  const deleteColumn = useCallback(async (columnId: string) => {
    if (window.confirm("Are you sure you want to delete this column? All tasks in this column will be lost.")) {
      try {
        const response = await fetch('/api/task-columns', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: columnId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete column');
        }

        // Reload data to reflect the deletion
        await loadData();
      } catch (error) {
        console.error('Error deleting column:', error);
      }
    }
  }, [loadData]);

  const updateColumnTitle = useCallback(async (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/task-columns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: columnId,
          title: newTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update column');
      }

      // Reload data to reflect the change
      await loadData();

      setEditingColumn("");
      setEditingColumnTitle("");
    } catch (error) {
      console.error('Error updating column:', error);
    }
  }, [loadData]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setShowEditTaskModal(true);
  }, []);

  const updateTask = useCallback(async () => {
    if (!editingTask) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTask.id,
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          assignee: editingTask.assignee,
          tags: editingTask.tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Reload data to get updated task
      await loadData();

      setShowEditTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, [editingTask, loadData]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: taskId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete task');
        }

        // Reload data to reflect deletion
        await loadData();

        setShowEditTaskModal(false);
        setEditingTask(null);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  }, [loadData]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800 border-red-200";
      case "High": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{board.title}</h1>
              <p className="text-gray-600 mt-1">Manage your tasks and track progress • Live data from Supabase</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddColumnModal(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <span>+ Add Column</span>
              </button>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>+ Add Task</span>
              </button>
              <button
                onClick={loadData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>↻ Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 p-6 overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex space-x-6 overflow-x-auto pb-4 h-full">
              {board.columns.map((column) => (
                <Droppable key={column.id} droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col ${
                        snapshot.isDraggingOver ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      {/* Column Header */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          {editingColumn === column.id ? (
                            <input
                              type="text"
                              value={editingColumnTitle}
                              onChange={(e) => setEditingColumnTitle(e.target.value)}
                              onBlur={() => updateColumnTitle(column.id, editingColumnTitle)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateColumnTitle(column.id, editingColumnTitle);
                                } else if (e.key === 'Escape') {
                                  setEditingColumn("");
                                  setEditingColumnTitle("");
                                }
                              }}
                              className="font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                              autoFocus
                            />
                          ) : (
                            <h3
                              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                              onClick={() => {
                                setEditingColumn(column.id);
                                setEditingColumnTitle(column.title);
                              }}
                              title="Click to edit column title"
                            >
                              {column.title}
                            </h3>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                              {column.tasks.length}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedColumn(column.id);
                                setShowAddTaskModal(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="Add task"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteColumn(column.id)}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Delete column"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tasks */}
                      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                        {column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={(e) => {
                                  // Only open edit modal if not dragging
                                  if (!snapshot.isDragging) {
                                    e.preventDefault();
                                    handleEditTask(task);
                                  }
                                }}
                                className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                                  snapshot.isDragging ? "shadow-lg transform rotate-2" : ""
                                }`}
                                title="Click to edit task"
                              >
                                <div className="space-y-2">
                                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                                    {task.title}
                                  </h4>
                                  
                                  {task.description && (
                                    <p className="text-gray-600 text-xs leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between">
                                    {task.priority && (
                                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                      </span>
                                    )}
                                    
                                    {task.assignee && (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs font-medium">
                                            {task.assignee.charAt(0)}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-600">{task.assignee}</span>
                                      </div>
                                    )}
                                  </div>

                                  {task.tags && task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {task.tags.map((tag, i) => (
                                        <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>

        {/* Add Task Modal */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task title"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Assign to team member"
                  />
                </div>

                {!selectedColumn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Column *
                    </label>
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a column</option>
                      {board.columns.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddTaskModal(false);
                    setSelectedColumn("");
                    setNewTask({ title: "", description: "", priority: "Medium", assignee: "" });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  disabled={!newTask.title.trim() || (!selectedColumn)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Column Modal */}
        {showAddColumnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Column</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Column Title *
                  </label>
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter column title"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddColumnModal(false);
                    setNewColumnTitle("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addColumn}
                  disabled={!newColumnTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Column
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditTaskModal && editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingTask.description || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editingTask.priority || "Medium"}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task["priority"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={editingTask.assignee || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Assign to team member"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingTask.tags?.join(", ") || ""}
                    onChange={(e) => setEditingTask({ 
                      ...editingTask, 
                      tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., frontend, urgent, bug-fix"
                  />
                </div>

                <div className="text-xs text-gray-500">
                  <p>Created: {new Date(editingTask.created_at).toLocaleDateString()}</p>
                  <p>Last updated: {new Date(editingTask.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-between space-x-3 mt-6">
                <button
                  onClick={() => deleteTask(editingTask.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Task
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowEditTaskModal(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateTask}
                    disabled={!editingTask.title.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 