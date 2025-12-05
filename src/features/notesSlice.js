import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Получить все заметки (с пагинацией)
export const getAllNotes = createAsyncThunk(
   'notes/getAllNotes',
   async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
      try {
         const response = await api.get(`/api/notes?page=${page}&limit=${limit}`, {
            withCredentials: true,
         });
         console.log('Ответ сервера getAllNotes:', response.data);
         return response.data; // { notes: [...], totalPages, currentPage, totalCount }
      } catch (err) {
         console.error('Ошибка getAllNotes:', err);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Создать заметку
export const createNote = createAsyncThunk(
   'notes/createNote',
   async (noteData, { rejectWithValue }) => {
      try {
         console.log('Отправляемые данные createNote:', noteData); // Лог: что отправляем
         const response = await api.post('/api/notes', noteData, {
            withCredentials: true,
         });
         console.log('Ответ сервера createNote:', response.data);
         return response.data;
      } catch (err) {
         console.error('Ошибка createNote:', err.response?.data); // Лог: тело ошибки от сервера
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Получить одну заметку (для редактирования)
export const getOneNote = createAsyncThunk(
   'notes/getOneNote',
   async (id, { rejectWithValue }) => {
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) return rejectWithValue('Неверный ID заметки');
      try {
         const response = await api.get(`/api/notes/${noteId}`, {
            withCredentials: true,
         });
         console.log('Ответ сервера getOneNote:', response.data);
         return response.data;
      } catch (err) {
         console.error('Ошибка getOneNote:', err);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Обновить заметку
export const updateNote = createAsyncThunk(
   'notes/updateNote',
   async (note, { rejectWithValue }) => {
      const { id, noteData } = note;  // Изменено: теперь явно деструктурируем id и noteData
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) return rejectWithValue('Неверный ID заметки');
      try {
         const response = await api.patch(`/api/notes/${noteId}`, noteData, {  // noteData уже плоский объект с полями заметки
            withCredentials: true,
         });
         console.log('Ответ сервера updateNote:', response.data);
         return response.data;
      } catch (err) {
         console.error('Ошибка updateNote:', err);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);


// Удалить заметку
export const deleteNote = createAsyncThunk(
   'notes/deleteNote',
   async (id, { rejectWithValue }) => {
      const noteId = parseInt(id, 10);
      if (isNaN(noteId)) return rejectWithValue('Неверный ID заметки');
      try {
         const response = await api.delete(`/api/notes/${noteId}`, {
            withCredentials: true,
         });
         console.log('Ответ сервера deleteNote:', response.data);
         return { id: noteId }; // Возвращаем число для обновления state
      } catch (err) {
         console.error('Ошибка deleteNote:', err);
         return rejectWithValue(err.response?.data?.message || err.message);
      }
   }
);

// Slice
const notesSlice = createSlice({
   name: 'notes',
   initialState: {
      notes: [],
      currentNote: null, // Для редактирования
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
   },
   reducers: {
      setPage(state, action) {
         state.currentPage = action.payload;
      },
      clearError(state) {
         state.error = null;
      },
   },
   extraReducers: builder => {
      builder
         // getAllNotes
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

         // createNote
         .addCase(createNote.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(createNote.fulfilled, (state, action) => {
            state.loading = false;
            // Добавляем новую заметку в список и обновляем totalCount
            state.notes.unshift(action.payload); // Добавляем в начало (можно в конец: push)
            state.totalCount += 1;
            state.totalPages = Math.ceil(state.totalCount / 10); // Пересчитываем страницы (limit=10)
            console.log('Заметка создана и добавлена в список');
         })
         .addCase(createNote.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка создания заметки';
         })

         // getOneNote
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

         // updateNote
         .addCase(updateNote.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(updateNote.fulfilled, (state, action) => {
            state.loading = false;
            // Обновляем заметку в списке
            const index = state.notes.findIndex(note => note.id === action.payload.id);
            if (index !== -1) {
               state.notes[index] = action.payload;
            }
            console.log('Заметка обновлена в списке');
         })
         .addCase(updateNote.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка обновления заметки';
            console.error('Ошибка updateNote в slice:', action.payload);  // Доп. лог
         })

         // deleteNote
         .addCase(deleteNote.pending, state => {
            state.loading = true;
            state.error = null;
         })
         .addCase(deleteNote.fulfilled, (state, action) => {
            state.loading = false;
            state.notes = state.notes.filter(note => note.id !== action.payload.id); // Теперь action.payload.id — число
            state.totalCount -= 1;
            state.totalPages = Math.ceil(state.totalCount / 10);
            console.log('Заметка удалена из списка');
         })

         .addCase(deleteNote.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Ошибка удаления заметки';
         });
   },
});

// Селекторы
export const selectNotes = state => state.notes.notes;
export const selectCurrentNote = state => state.notes.currentNote;
export const selectLoading = state => state.notes.loading;
export const selectError = state => state.notes.error;
export const selectCurrentPage = state => state.notes.currentPage;
export const selectTotalPages = state => state.notes.totalPages;

export const { setPage, clearError } = notesSlice.actions;
export default notesSlice.reducer;
