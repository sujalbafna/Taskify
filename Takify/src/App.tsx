import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Calendar, Briefcase, User, ShoppingCart, MoreHorizontal, Check, Trash2, Flag, ArrowUpDown, Clock } from 'lucide-react';
import type { Task, Category, Priority } from './types';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { collection, addDoc, query, where, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

type SortField = 'priority' | 'deadline' | 'createdAt';
type FilterType = 'all' | 'pending' | 'completed' | 'high-priority';

function App() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'personal' as Category,
    priority: 'medium' as Priority,
    deadline: '',
  });

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasksData.push({
          ...data,
          id: doc.id,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          createdAt: new Date(data.createdAt),
        } as Task);
      });
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTask.title.trim()) return;

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        completed: false,
        progress: 0,
        deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : null,
        createdAt: new Date().toISOString(),
        userId: currentUser.uid,
      };

      await addDoc(collection(db, 'tasks'), taskData);
      setNewTask({ title: '', description: '', category: 'personal', priority: 'medium', deadline: '' });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !task.completed,
        progress: task.completed ? task.progress : 100
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateProgress = async (taskId: string, progress: number) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        progress,
        completed: progress === 100
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'work': return <Briefcase className="w-4 h-4" />;
      case 'personal': return <User className="w-4 h-4" />;
      case 'shopping': return <ShoppingCart className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    switch (filterType) {
      case 'pending':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'high-priority':
        filtered = filtered.filter(task => task.priority === 'high');
        break;
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        }
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          comparison = a.deadline.getTime() - b.deadline.getTime();
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection, filterType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            
          </h1>
          {currentUser && <Auth />}
        </div>

        {currentUser ? (
          <>
            <form onSubmit={addTask} className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value as Category })}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="shopping">Shopping</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="mb-4">
                <textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add Task
                </button>
              </div>
            </form>

            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending Tasks</option>
                    <option value="completed">Completed Tasks</option>
                    <option value="high-priority">High Priority</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSort('priority')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                      sortField === 'priority' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    Priority
                    {sortField === 'priority' && <ArrowUpDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => toggleSort('deadline')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                      sortField === 'deadline' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Deadline
                    {sortField === 'deadline' && <ArrowUpDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => toggleSort('createdAt')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                      sortField === 'createdAt' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Created
                    {sortField === 'createdAt' && <ArrowUpDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAndSortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow-md p-4 transition-all ${
                    task.completed ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}>
                          {task.title}
                        </h3>
                        <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getCategoryIcon(task.category)}
                          {task.category}
                        </span>
                        <span className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                          <Flag className="w-4 h-4" />
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-gray-600 mb-2">{task.description}</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.progress}
                            onChange={(e) => updateProgress(task.id, parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium text-gray-600">
                            {task.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${getProgressColor(task.progress)}`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {task.deadline && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(task.deadline).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredAndSortedTasks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No tasks found for the current filter.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-8">
            <Auth />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;