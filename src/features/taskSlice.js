// features/taskSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksAPI } from '../api/api';

// ==================== ASYNC THUNKS ====================

export const fetchAssignableUsers = createAsyncThunk(
   'tasks/fetchAssignableUsers',
   async (_, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.getAssignableUsers();
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки пользователей');
      }
   }
);

export const fetchTasks = createAsyncThunk(
   'tasks/fetchTasks',
   async ({ role = 'assignee', status = null, sortBy = 'created_at', sortOrder = 'desc', limit = 50, offset = 0 }, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.getMyTasks(role, status, sortBy, sortOrder, limit, offset);
         return {
            tasks: response.data.data,
            total: response.data.total,
            role,
            status,
            sortBy,
            sortOrder,
            limit,
            offset
         };
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заданий');
      }
   }
);

export const fetchTaskById = createAsyncThunk(
   'tasks/fetchTaskById',
   async (taskId, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.getTaskById(taskId);
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки задания');
      }
   }
);

export const createTask = createAsyncThunk(
   'tasks/createTask',
   async (taskData, { rejectWithValue }) => {
      try {
         console.log('📤 createTask thunk: отправка запроса', taskData);
         const response = await tasksAPI.createTask(taskData);
         const newTask = response.data.data;
         console.log('📥 createTask thunk: получен ответ', { id: newTask?.id, userId: newTask?.user_id, status: newTask?.status });
         return newTask;
      } catch (error) {
         console.error('❌ createTask thunk: ошибка', error);
         return rejectWithValue(error.response?.data?.message || 'Ошибка создания задания');
      }
   }
);

export const updateTask = createAsyncThunk(
   'tasks/updateTask',
   async ({ taskId, data }, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.updateTask(taskId, data);
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка обновления задания');
      }
   }
);

export const completeTask = createAsyncThunk(
   'tasks/completeTask',
   async ({ taskId, result }, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.completeTask(taskId, result);
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка завершения задания');
      }
   }
);

export const deleteTask = createAsyncThunk(
   'tasks/deleteTask',
   async (taskId, { rejectWithValue }) => {
      try {
         await tasksAPI.deleteTask(taskId);
         return taskId;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка удаления задания');
      }
   }
);

export const fetchActiveTasks = createAsyncThunk(
   'tasks/fetchActiveTasks',
   async (limit = 10, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.getActiveTasks(limit);
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки активных заданий');
      }
   }
);

export const fetchTaskStats = createAsyncThunk(
   'tasks/fetchTaskStats',
   async (_, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.getTaskStats();
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки статистики');
      }
   }
);

export const fetchExpiringTasks = createAsyncThunk(
   'tasks/fetchExpiringTasks',
   async (days = 3, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.getExpiringTasks(days);
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки истекающих заданий');
      }
   }
);

export const saveTaskToLibrary = createAsyncThunk(
   'tasks/saveTaskToLibrary',
   async (taskId, { rejectWithValue }) => {
      try {
         const response = await tasksAPI.saveToLibrary(taskId);
         return response.data.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || 'Ошибка сохранения в библиотеку');
      }
   }
);

// ==================== INITIAL STATE ====================

const initialState = {
   tasks: [],
   activeTasks: [],
   expiringTasks: [],
   assignableUsers: [],
   currentTask: null,
   stats: {
      active: 0,
      completed: 0,
      archived: 0,
      created: 0
   },
   pagination: {
      total: 0,
      limit: 50,
      offset: 0
   },
   filters: {
      role: 'assignee',
      status: null,
      sortBy: 'created_at',  // ← ИСПРАВЛЕНО
      sortOrder: 'desc'
   },
   loading: false,
   error: null,
   createLoading: false,
   updateLoading: false,
   completeLoading: false,
   deleteLoading: false,

   // ========== ПОЛЯ ДЛЯ БЕЙДЖА И УВЕДОМЛЕНИЙ ==========
   currentUserId: null,
   hasNewIncomingTask: false,
   lastIncomingTaskId: null,
   unreadIncomingTaskIds: [],
};

// ==================== SLICE ====================

const tasksSlice = createSlice({
   name: 'tasks',
   initialState,
   reducers: {
      clearError: (state) => {
         state.error = null;
      },
      setTasksRoleFilter: (state, action) => {
         state.filters.role = action.payload;
      },
      setTasksStatusFilter: (state, action) => {
         state.filters.status = action.payload;
      },
      setTasksSort: (state, action) => {
         const { sortBy, sortOrder } = action.payload;
         if (sortBy !== undefined) state.filters.sortBy = sortBy;
         if (sortOrder !== undefined) state.filters.sortOrder = sortOrder;
      },
      resetFilters: (state) => {
         state.filters = {
            role: 'assignee',
            status: null,
            sortBy: 'created_at',  // ← ИСПРАВЛЕНО
            sortOrder: 'desc'
         };
      },
      clearCurrentTask: (state) => {
         state.currentTask = null;
      },
      updateTaskStatusLocally: (state, action) => {
         const { taskId, status, completed_at } = action.payload;
         const task = state.tasks.find(t => t.id === taskId);
         if (task) {
            task.status = status;
            if (completed_at) task.completed_at = completed_at;
         }
         if (state.currentTask?.id === taskId) {
            state.currentTask.status = status;
            if (completed_at) state.currentTask.completed_at = completed_at;
         }
      },
      addTaskToList: (state, action) => {
         state.tasks.unshift(action.payload);
      },
      removeTaskFromList: (state, action) => {
         state.tasks = state.tasks.filter(t => t.id !== action.payload);
      },

      // ========== УСТАНОВКА ТЕКУЩЕГО USER ID ==========
      setCurrentUserId: (state, action) => {
         console.log('🎯 setCurrentUserId reducer:', action.payload);
         state.currentUserId = action.payload;
      },

      // ========== РЕДЬЮСЕРЫ ДЛЯ НЕПРОЧИТАННЫХ ==========
      incomingTasksViewed: (state) => {
         console.log('👁️ incomingTasksViewed: сброс hasNewIncomingTask');
         state.hasNewIncomingTask = false;
      },
      setHasNewIncomingTask: (state, action) => {
         state.hasNewIncomingTask = action.payload;
      },

      markTasksAsRead: (state, action) => {
         const { taskIds } = action.payload;
         console.log('📖 markTasksAsRead:', taskIds);
         state.unreadIncomingTaskIds = state.unreadIncomingTaskIds.filter(
            id => !taskIds.includes(id)
         );
      },

      markAllTasksAsRead: (state) => {
         console.log('📖 markAllTasksAsRead: очистка всех непрочитанных');
         state.unreadIncomingTaskIds = [];
         state.hasNewIncomingTask = false;
      },

      addUnreadTask: (state, action) => {
         const taskId = action.payload;
         if (!state.unreadIncomingTaskIds.includes(taskId)) {
            state.unreadIncomingTaskIds.push(taskId);
         }
      },
   },
   extraReducers: (builder) => {
      builder
         // ========== FETCH ASSIGNABLE USERS ==========
         .addCase(fetchAssignableUsers.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchAssignableUsers.fulfilled, (state, action) => {
            state.loading = false;
            state.assignableUsers = action.payload;
         })
         .addCase(fetchAssignableUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         })

         // ========== FETCH TASKS ==========
         .addCase(fetchTasks.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchTasks.fulfilled, (state, action) => {
            state.loading = false;
            state.tasks = action.payload.tasks;
            state.pagination = {
               total: action.payload.total,
               limit: action.payload.limit,
               offset: action.payload.offset
            };
            state.filters.role = action.payload.role;
            state.filters.status = action.payload.status;
            if (action.payload.sortBy) state.filters.sortBy = action.payload.sortBy;
            if (action.payload.sortOrder) state.filters.sortOrder = action.payload.sortOrder;

            if (action.payload.role === 'assignee') {
               state.hasNewIncomingTask = false;
            }
         })
         .addCase(fetchTasks.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         })

         // ========== FETCH TASK BY ID ==========
         .addCase(fetchTaskById.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchTaskById.fulfilled, (state, action) => {
            state.loading = false;
            state.currentTask = action.payload;
         })
         .addCase(fetchTaskById.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         })

         // ========== CREATE TASK ==========
         .addCase(createTask.pending, (state) => {
            state.createLoading = true;
            state.error = null;
            console.log('⏳ createTask.pending');
         })
         .addCase(createTask.fulfilled, (state, action) => {
            state.createLoading = false;

            const newTask = action.payload;

            console.log('📝 createTask.fulfilled:', {
               taskId: newTask?.id,
               userId: newTask?.user_id,
               currentUserId: state.currentUserId,
               status: newTask?.status,
               isIncoming: state.currentUserId && newTask?.user_id === state.currentUserId,
               assignerName: newTask?.assigner?.userName
            });

            const isIncoming = state.currentUserId && newTask?.user_id === state.currentUserId;

            const taskWithFlag = {
               ...newTask,
               isIncoming
            };

            state.tasks.unshift(taskWithFlag);

            if (isIncoming && newTask?.status === 'active') {
               console.log('✅ Входящее активное задание! Добавляем в непрочитанные');

               if (state.lastIncomingTaskId !== newTask.id) {
                  state.hasNewIncomingTask = true;
                  state.lastIncomingTaskId = newTask.id;

                  if (!state.unreadIncomingTaskIds.includes(newTask.id)) {
                     state.unreadIncomingTaskIds.push(newTask.id);
                     console.log('📌 Добавлен ID в unreadIncomingTaskIds:', newTask.id);
                     console.log('📌 Текущие unreadIncomingTaskIds:', state.unreadIncomingTaskIds);
                  }

                  if (typeof window !== 'undefined') {
                     console.log('📡 Диспатчим tasks-updated событие');
                     window.dispatchEvent(new CustomEvent('tasks-updated'));

                     const toastEvent = new CustomEvent('new-task-toast', {
                        detail: {
                           taskId: newTask.id,
                           taskTitle: newTask.custom_title ||
                              newTask.exercise?.title ||
                              'Новое задание',
                           assignerName: newTask.assigner?.userName || 'Тренер'
                        }
                     });
                     console.log('🔔 Диспатчим new-task-toast событие:', toastEvent.detail);
                     window.dispatchEvent(toastEvent);
                  }
               } else {
                  console.log('⚠️ Задание уже было обработано (дубликат)');
               }
            } else {
               console.log('❌ Задание НЕ входящее или не активное:', {
                  isIncoming,
                  status: newTask?.status
               });
            }
         })
         .addCase(createTask.rejected, (state, action) => {
            state.createLoading = false;
            state.error = action.payload;
            console.error('❌ createTask.rejected:', action.payload);
         })

         // ========== UPDATE TASK ==========
         .addCase(updateTask.pending, (state) => {
            state.updateLoading = true;
            state.error = null;
         })
         .addCase(updateTask.fulfilled, (state, action) => {
            state.updateLoading = false;
            const index = state.tasks.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
               state.tasks[index] = action.payload;
            }
            if (state.currentTask?.id === action.payload.id) {
               state.currentTask = action.payload;
            }
         })
         .addCase(updateTask.rejected, (state, action) => {
            state.updateLoading = false;
            state.error = action.payload;
         })

         // ========== COMPLETE TASK ==========
         .addCase(completeTask.pending, (state) => {
            state.completeLoading = true;
            state.error = null;
         })
         .addCase(completeTask.fulfilled, (state, action) => {
            state.completeLoading = false;
            const index = state.tasks.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
               state.tasks[index] = action.payload;
            }
            if (state.currentTask?.id === action.payload.id) {
               state.currentTask = action.payload;
            }
            if (action.payload.status === 'completed') {
               state.stats.active = Math.max(0, (state.stats.active || 0) - 1);
               state.stats.completed = (state.stats.completed || 0) + 1;
            }

            state.unreadIncomingTaskIds = state.unreadIncomingTaskIds.filter(
               id => id !== action.payload.id
            );

            if (typeof window !== 'undefined') {
               window.dispatchEvent(new CustomEvent('tasks-updated'));
            }
         })
         .addCase(completeTask.rejected, (state, action) => {
            state.completeLoading = false;
            state.error = action.payload;
         })

         // ========== DELETE TASK ==========
         .addCase(deleteTask.pending, (state) => {
            state.deleteLoading = true;
            state.error = null;
         })
         .addCase(deleteTask.fulfilled, (state, action) => {
            state.deleteLoading = false;
            state.tasks = state.tasks.filter(t => t.id !== action.payload);
            if (state.currentTask?.id === action.payload) {
               state.currentTask = null;
            }
            state.unreadIncomingTaskIds = state.unreadIncomingTaskIds.filter(
               id => id !== action.payload
            );
            if (typeof window !== 'undefined') {
               window.dispatchEvent(new CustomEvent('tasks-updated'));
            }
         })
         .addCase(deleteTask.rejected, (state, action) => {
            state.deleteLoading = false;
            state.error = action.payload;
         })

         // ========== FETCH ACTIVE TASKS ==========
         .addCase(fetchActiveTasks.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchActiveTasks.fulfilled, (state, action) => {
            state.loading = false;
            state.activeTasks = action.payload;
         })
         .addCase(fetchActiveTasks.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         })

         // ========== FETCH TASK STATS ==========
         .addCase(fetchTaskStats.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchTaskStats.fulfilled, (state, action) => {
            state.loading = false;
            state.stats = {
               active: action.payload.active || 0,
               completed: action.payload.completed || 0,
               archived: action.payload.archived || 0,
               created: action.payload.created || 0
            };
         })
         .addCase(fetchTaskStats.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         })

         // ========== FETCH EXPIRING TASKS ==========
         .addCase(fetchExpiringTasks.pending, (state) => {
            state.loading = true;
            state.error = null;
         })
         .addCase(fetchExpiringTasks.fulfilled, (state, action) => {
            state.loading = false;
            state.expiringTasks = action.payload;
         })
         .addCase(fetchExpiringTasks.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
         })

         // ========== SAVE TASK TO LIBRARY ==========
         .addCase(saveTaskToLibrary.pending, (state) => {
            state.updateLoading = true;
            state.error = null;
         })
         .addCase(saveTaskToLibrary.fulfilled, (state, action) => {
            state.updateLoading = false;
            const index = state.tasks.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
               state.tasks[index] = action.payload;
            }
            if (state.currentTask?.id === action.payload.id) {
               state.currentTask = action.payload;
            }
         })
         .addCase(saveTaskToLibrary.rejected, (state, action) => {
            state.updateLoading = false;
            state.error = action.payload;
         });
   }
});

// ==================== SELECTORS ====================

export const selectAllTasks = (state) => state.tasks.tasks;
export const selectActiveTasks = (state) => state.tasks.activeTasks;
export const selectExpiringTasks = (state) => state.tasks.expiringTasks;
export const selectAssignableUsers = (state) => state.tasks.assignableUsers;
export const selectCurrentTask = (state) => state.tasks.currentTask;
export const selectTaskStats = (state) => state.tasks.stats;
export const selectTasksLoading = (state) => state.tasks.loading;
export const selectTasksError = (state) => state.tasks.error;
export const selectTasksFilters = (state) => state.tasks.filters;
export const selectTasksPagination = (state) => state.tasks.pagination;
export const selectCreateTaskLoading = (state) => state.tasks.createLoading;
export const selectUpdateTaskLoading = (state) => state.tasks.updateLoading;
export const selectCompleteTaskLoading = (state) => state.tasks.completeLoading;
export const selectDeleteTaskLoading = (state) => state.tasks.deleteLoading;

// ========== СЕЛЕКТОРЫ ДЛЯ НЕПРОЧИТАННЫХ ==========
export const selectHasNewIncomingTask = (state) => state.tasks.hasNewIncomingTask;
export const selectLastIncomingTaskId = (state) => state.tasks.lastIncomingTaskId;
export const selectUnreadIncomingTaskIds = (state) => state.tasks.unreadIncomingTaskIds;
export const selectUnreadTasksCount = (state) => state.tasks.unreadIncomingTaskIds.length;
export const selectIsTaskRead = (state, taskId) =>
   !state.tasks.unreadIncomingTaskIds.includes(taskId);

export const selectFilteredTasks = (state) => {
   const { tasks, filters } = state.tasks;
   if (!filters.status) return tasks;
   return tasks.filter(task => task.status === filters.status);
};

export const selectTasksGroupedByStatus = (state) => {
   const tasks = state.tasks.tasks;
   return {
      active: tasks.filter(t => t.status === 'active'),
      completed: tasks.filter(t => t.status === 'completed'),
      archived: tasks.filter(t => t.status === 'archived')
   };
};

// ==================== EXPORT ====================

export const {
   clearError,
   setTasksRoleFilter,
   setTasksStatusFilter,
   setTasksSort,
   resetFilters,
   clearCurrentTask,
   updateTaskStatusLocally,
   addTaskToList,
   removeTaskFromList,
   setCurrentUserId,
   incomingTasksViewed,
   setHasNewIncomingTask,
   markTasksAsRead,
   markAllTasksAsRead,
   addUnreadTask
} = tasksSlice.actions;

export default tasksSlice.reducer;