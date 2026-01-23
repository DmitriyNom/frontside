// src/features/mediaSlice.js - ИСПРАВЛЕННАЯ ВЕРСИЯ (исправлена структура ответа)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Асинхронные Thunk-actions

// 1. Получить медиа текущего пользователя
export const fetchUserMedia = createAsyncThunk(
   'media/fetchUserMedia',
   async (_, { rejectWithValue }) => {
      try {
         const response = await api.get('/api/media/my');
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// 2. Загрузить медиа
export const uploadMedia = createAsyncThunk(
   'media/uploadMedia',
   async ({ file, privacy = 'private' }, { rejectWithValue, dispatch }) => {
      try {
         console.log('🚀 START uploadMedia for file:', file.name, file.size, 'bytes');

         // Шаг 1: Получаем upload request
         dispatch(setUploadProgress(10));
         console.log('📤 Step 1: Requesting upload URL...');

         const uploadRequest = await api.post('/api/media/upload-request', {
            filename: file.name,
            fileType: file.type.startsWith('image/') ? 'photo' : 'video',
            mimeType: file.type,
            size: file.size,
            privacy: privacy,
            isPublic: privacy === 'public'
         });

         console.log('✅ Step 1 OK. Response:', uploadRequest.data);

         const { uploadUrl: uploadUrlObj, mediaId } = uploadRequest.data;
         const { url: actualUploadUrl, fields, headers: uploadHeaders } = uploadUrlObj;

         console.log('📊 Upload details:', {
            actualUploadUrl,
            fields,
            uploadHeaders,  // Проверьте, есть ли тут X-Temp-File
            mediaId
         });

         // Шаг 2: Загружаем файл
         dispatch(setUploadProgress(30));
         console.log('📤 Step 2: Uploading file to:', actualUploadUrl);

         const formData = new FormData();

         // Добавляем поля
         if (fields && typeof fields === 'object') {
            Object.keys(fields).forEach(key => {
               formData.append(key, fields[key]);
            });
         }
         formData.append('file', file);

         // Очищаем заголовки от Content-Type
         const cleanedHeaders = { ...uploadHeaders };
         if (cleanedHeaders['Content-Type']) {
            console.log('⚠️ Removing Content-Type header for FormData');
            delete cleanedHeaders['Content-Type'];
         }

         console.log('📤 Sending fetch request with headers:', cleanedHeaders);

         const uploadResponse = await fetch(actualUploadUrl, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: cleanedHeaders
         });

         console.log('📡 Fetch response status:', uploadResponse.status);

         if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ Fetch error:', errorText);
            throw new Error(`Upload failed: ${uploadResponse.status}`);
         }

         const uploadResult = await uploadResponse.json();
         console.log('✅ Step 2 OK. Upload result:', uploadResult);

         // Шаг 3: Подтверждаем загрузку
         dispatch(setUploadProgress(80));
         console.log('📤 Step 3: Confirming upload...');

         const confirmResponse = await api.post('/api/media/confirm', { mediaId });
         console.log('✅ Step 3 OK. Confirm response:', confirmResponse.data);

         dispatch(setUploadProgress(100));
         return confirmResponse.data;

      } catch (error) {
         console.error('💥 UPLOAD ERROR:', error);
         return rejectWithValue(error.message);
      }
   }
);

// 3. Удалить медиа
export const deleteMedia = createAsyncThunk(
   'media/deleteMedia',
   async (mediaId, { rejectWithValue }) => {
      try {
         await api.delete(`/api/media/${mediaId}`);
         return mediaId;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// 4. Обновить приватность
export const updateMediaPrivacy = createAsyncThunk(
   'media/updateMediaPrivacy',
   async ({ mediaId, privacy }, { rejectWithValue }) => {
      try {
         const response = await api.put(`/api/media/${mediaId}/privacy`, { privacy });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// 5. Поделиться медиа
export const shareMedia = createAsyncThunk(
   'media/shareMedia',
   async ({ mediaId, userIds, accessLevel = 'view' }, { rejectWithValue }) => {
      try {
         const response = await api.post(`/api/media/${mediaId}/share`, {
            userIds,
            accessLevel
         });
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

const mediaSlice = createSlice({
   name: 'media',
   initialState: {
      items: [],
      currentItem: null,
      isLoading: false,
      isUploading: false,
      error: null,
      uploadProgress: 0,
   },
   reducers: {
      clearMediaError: (state) => {
         state.error = null;
      },
      setCurrentMedia: (state, action) => {
         state.currentItem = action.payload;
      },
      clearCurrentMedia: (state) => {
         state.currentItem = null;
      },
      setUploadProgress: (state, action) => {
         state.uploadProgress = action.payload;
      },
   },
   extraReducers: (builder) => {
      builder
         // ===== FETCH USER MEDIA =====
         .addCase(fetchUserMedia.pending, (state) => {
            state.isLoading = true;
            state.error = null;
         })
         .addCase(fetchUserMedia.fulfilled, (state, action) => {
            state.isLoading = false;
            state.items = action.payload;
         })
         .addCase(fetchUserMedia.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
         })
         // ===== UPLOAD MEDIA =====
         .addCase(uploadMedia.pending, (state) => {
            state.isUploading = true;
            state.uploadProgress = 0;
            state.error = null;
         })
         .addCase(uploadMedia.fulfilled, (state, action) => {
            state.isUploading = false;
            state.uploadProgress = 100;
            state.items.unshift(action.payload);
         })
         .addCase(uploadMedia.rejected, (state, action) => {
            state.isUploading = false;
            state.uploadProgress = 0;
            state.error = action.payload;
         })
         // ===== DELETE MEDIA =====
         .addCase(deleteMedia.fulfilled, (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
            if (state.currentItem?.id === action.payload) {
               state.currentItem = null;
            }
         })
         // ===== UPDATE PRIVACY =====
         .addCase(updateMediaPrivacy.fulfilled, (state, action) => {
            const index = state.items.findIndex(item => item.id === action.payload.id);
            if (index !== -1) {
               state.items[index] = action.payload;
            }
            if (state.currentItem?.id === action.payload.id) {
               state.currentItem = action.payload;
            }
         })
         // ===== SHARE MEDIA =====
         .addCase(shareMedia.fulfilled, (state, action) => {
            const index = state.items.findIndex(item => item.id === action.payload.mediaId);
            if (index !== -1) {
               state.items[index].shared_count = (state.items[index].shared_count || 0) + 1;
            }
         });
   },
});

export const {
   clearMediaError,
   setCurrentMedia,
   clearCurrentMedia,
   setUploadProgress
} = mediaSlice.actions;

// ===== SELECTORS =====
export const selectMediaItems = (state) => state.media.items;
export const selectMediaLoading = (state) => state.media.isLoading;
export const selectMediaError = (state) => state.media.error;
export const selectCurrentMedia = (state) => state.media.currentItem;
export const selectIsUploading = (state) => state.media.isUploading;
export const selectUploadProgress = (state) => state.media.uploadProgress;

export default mediaSlice.reducer;