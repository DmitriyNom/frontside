// src/features/notesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notesAPI } from '../api/api';

// ==================== ASYNC THUNKS ====================

/**
 * Получить все заметки с пагинацией и сортировкой
 */
export const getAllNotes = createAsyncThunk(
   'notes/getAllNotes',
   async ({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }, { rejectWithValue }) => {
      try {
         const response = await notesAPI.getAllNotes(page, limit, sortBy, sortOrder);
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const createNote = createAsyncThunk(
   'notes/createNote',
   async (noteData, { rejectWithValue }) => {
      try {
         const response = await notesAPI.createNote(noteData);
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const getOneNote = createAsyncThunk(
   'notes/getOneNote',
   async (id, { rejectWithValue }) => {
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) return rejectWithValue('Неверный ID заметки');
      try {
         const response = await notesAPI.getOneNote(noteId);
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const updateNote = createAsyncThunk(
   'notes/updateNote',
   async (note, { rejectWithValue }) => {
      const { id, noteData } = note;
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) return rejectWithValue('Неверный ID заметки');
      try {
         const response = await notesAPI.updateNote(noteId, noteData);
         return response.data;
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

export const deleteNote = createAsyncThunk(
   'notes/deleteNote',
   async (id, { rejectWithValue }) => {
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) return rejectWithValue('Неверный ID заметки');
      try {
         await notesAPI.deleteNote(noteId);
         return { id: noteId };
      } catch (err) {
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// ==================== INITIAL STATE ====================

const initialState = {
   notes: [],
   currentNote: null,
   loading: false,
   error: null,
   currentPage: 1,
   totalPages: 1,
   totalCount: 0,
   // Параметры сортировки
   sortBy: 'createdAt',
   sortOrder: 'desc',
};

// ==================== SLICE ====================

const notesSlice = createSlice({
   name: 'notes',
   initialState,
   reducers: {
      setPage(state, action) {
         state.currentPage = action.payload;
      },
      clearError(state) {
         state.error = null;
      },
      // Новый редьюсер для сортировки
      setNotesSort(state, action) {
         const { sortBy, sortOrder } = action.payload;
         if (sortBy !== undefined) state.sortBy = sortBy;
         if (sortOrder !== undefined) state.sortOrder = sortOrder;
         // При смене сортировки сбрасываем на первую страницу
         state.currentPage = 1;
      },
      // Сброс всех фильтров и сортировки
      resetNotesFilters(state) {
         state.sortBy = 'createdAt';
         state.sortOrder = 'desc';
         state.currentPage = 1;
      },
   },
   extraReducers: builder => {
      builder
         // ===== GET ALL NOTES =====
         .addCase(getAllNotes.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(getAllNotes.fulfilled, (state, action) => {
            state.loading = false;
            state.notes = action.payload.notes || [];
            state.totalPages = action.payload.totalPages || 1;
            state.currentPage = action.payload.currentPage || 1;
            state.totalCount = action.payload.totalCount || 0;
         })
         .addCase(getAllNotes.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка загрузки заметок';
         })

         // ===== CREATE NOTE =====
         .addCase(createNote.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(createNote.fulfilled, (state, action) => {
            state.loading = false;
            state.notes.unshift(action.payload);
            state.totalCount += 1;
            state.totalPages = Math.ceil(state.totalCount / 10);
         })
         .addCase(createNote.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка создания заметки';
         })

         // ===== GET ONE NOTE =====
         .addCase(getOneNote.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(getOneNote.fulfilled, (state, action) => {
            state.loading = false;
            state.currentNote = action.payload;
         })
         .addCase(getOneNote.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка загрузки заметки';
         })

         // ===== UPDATE NOTE =====
         .addCase(updateNote.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(updateNote.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.notes.findIndex(note => note.id === action.payload.id);
            if (index !== -1) {
               state.notes[index] = action.payload;
            }
            if (state.currentNote?.id === action.payload.id) {
               state.currentNote = action.payload;
            }
         })
         .addCase(updateNote.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка обновления заметки';
         })

         // ===== DELETE NOTE =====
         .addCase(deleteNote.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(deleteNote.fulfilled, (state, action) => {
            state.loading = false;
            state.notes = state.notes.filter(note => note.id !== action.payload.id);
            state.totalCount -= 1;
            state.totalPages = Math.ceil(state.totalCount / 10);
            if (state.currentNote?.id === action.payload.id) {
               state.currentNote = null;
            }
         })
         .addCase(deleteNote.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка удаления заметки';
         });
   },
});

// ==================== ACTIONS ====================

export const { setPage, clearError, setNotesSort, resetNotesFilters } = notesSlice.actions;

// ==================== SELECTORS ====================

export const selectNotes = state => state.notes.notes;
export const selectCurrentNote = state => state.notes.currentNote;
export const selectLoading = state => state.notes.loading;
export const selectError = state => state.notes.error;
export const selectCurrentPage = state => state.notes.currentPage;
export const selectTotalPages = state => state.notes.totalPages;
export const selectTotalCount = state => state.notes.totalCount;
export const selectNotesSortBy = state => state.notes.sortBy;
export const selectNotesSortOrder = state => state.notes.sortOrder;

// Параметры для запроса
export const selectNotesFetchParams = state => ({
   page: state.notes.currentPage,
   limit: 10,
   sortBy: state.notes.sortBy,
   sortOrder: state.notes.sortOrder,
});

export default notesSlice.reducer;