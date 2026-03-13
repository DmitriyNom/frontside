// src/features/mediaSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

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
         // Шаг 1: Получаем upload request
         dispatch(setUploadProgress(10));

         const uploadRequest = await api.post('/api/media/upload-request', {
            filename: file.name,
            fileType: file.type.startsWith('image/') ? 'photo' : 'video',
            mimeType: file.type,
            size: file.size,
            privacy: privacy,
            isPublic: privacy === 'public'
         });

         const { uploadUrl: uploadUrlObj, mediaId } = uploadRequest.data;
         const { url: actualUploadUrl, fields, headers: uploadHeaders } = uploadUrlObj;

         // Шаг 2: Загружаем файл
         dispatch(setUploadProgress(30));

         const formData = new FormData();

         if (fields && typeof fields === 'object') {
            Object.keys(fields).forEach(key => {
               formData.append(key, fields[key]);
            });
         }
         formData.append('file', file);

         const cleanedHeaders = { ...uploadHeaders };
         if (cleanedHeaders['Content-Type']) {
            delete cleanedHeaders['Content-Type'];
         }

         const uploadResponse = await fetch(actualUploadUrl, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: cleanedHeaders
         });

         if (!uploadResponse.ok) {
            await uploadResponse.text();
            throw new Error(`Upload failed: ${uploadResponse.status}`);
         }

         await uploadResponse.json();

         // Шаг 3: Подтверждаем загрузку
         dispatch(setUploadProgress(80));

         const confirmResponse = await api.post('/api/media/confirm', { mediaId });

         dispatch(setUploadProgress(100));
         return confirmResponse.data;

      } catch (error) {
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

// 6. Обновить медиа
export const updateMedia = createAsyncThunk(
   'media/updateMedia',
   async ({ mediaId, updateData }, { rejectWithValue }) => {
      try {
         const response = await api.put(`/api/media/${mediaId}`, updateData);
         return response.data;
      } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
      }
   }
);

// 7. Сбросить состояние медиа (для выхода из системы)
export const resetMediaState = createAsyncThunk(
   'media/resetMediaState',
   async () => {
      return null;
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
      hasError: false,
      retryCount: 0,
      lastFetchAttempt: null,
      isInitialLoadComplete: false,
   },
   reducers: {
      clearMediaError: (state) => {
         state.error = null;
         state.hasError = false;
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
      resetMedia: (state) => {
         state.items = [];
         state.currentItem = null;
         state.isLoading = false;
         state.isUploading = false;
         state.error = null;
         state.uploadProgress = 0;
         state.hasError = false;
         state.retryCount = 0;
         state.lastFetchAttempt = null;
         state.isInitialLoadComplete = false;
      },
   },
   extraReducers: (builder) => {
      builder
         // ===== FETCH USER MEDIA =====
         .addCase(fetchUserMedia.pending, (state) => {
            state.isLoading = true;
            state.error = null;
            state.hasError = false;
            state.lastFetchAttempt = Date.now();
         })
         .addCase(fetchUserMedia.fulfilled, (state, action) => {
            state.isLoading = false;
            state.items = action.payload;
            state.hasError = false;
            state.retryCount = 0;
            state.isInitialLoadComplete = true;
            state.error = null;
         })
         .addCase(fetchUserMedia.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
            state.hasError = true;
            state.retryCount += 1;
            if (state.retryCount >= 3) {
               state.isInitialLoadComplete = true;
            }
         })

         // ===== UPLOAD MEDIA =====
         .addCase(uploadMedia.pending, (state) => {
            state.isUploading = true;
            state.uploadProgress = 0;
            state.error = null;
            state.hasError = false;
         })
         .addCase(uploadMedia.fulfilled, (state, action) => {
            state.isUploading = false;
            state.uploadProgress = 100;
            state.items.unshift(action.payload);
            state.hasError = false;
            state.error = null;
         })
         .addCase(uploadMedia.rejected, (state, action) => {
            state.isUploading = false;
            state.uploadProgress = 0;
            state.error = action.payload;
            state.hasError = true;
         })

         // ===== DELETE MEDIA =====
         .addCase(deleteMedia.fulfilled, (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
            if (state.currentItem?.id === action.payload) {
               state.currentItem = null;
            }
         })

         // ===== UPDATE MEDIA PRIVACY =====
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
         })

         // ===== UPDATE MEDIA =====
         .addCase(updateMedia.fulfilled, (state, action) => {
            const index = state.items.findIndex(item => item.id === action.payload.id);
            if (index !== -1) {
               state.items[index] = { ...state.items[index], ...action.payload };
            }
            if (state.currentItem?.id === action.payload.id) {
               state.currentItem = { ...state.currentItem, ...action.payload };
            }
         })

         // ===== RESET MEDIA STATE =====
         .addCase(resetMediaState.fulfilled, (state) => {
            state.items = [];
            state.currentItem = null;
            state.isLoading = false;
            state.isUploading = false;
            state.error = null;
            state.uploadProgress = 0;
            state.hasError = false;
            state.retryCount = 0;
            state.lastFetchAttempt = null;
            state.isInitialLoadComplete = false;
         });
   },
});

export const {
   clearMediaError,
   setCurrentMedia,
   clearCurrentMedia,
   setUploadProgress,
   resetMedia,
} = mediaSlice.actions;

// ===== СЕЛЕКТОРЫ =====
export const selectMediaItems = (state) => state.media.items;
export const selectMediaLoading = (state) => state.media.isLoading;
export const selectMediaError = (state) => state.media.error;
export const selectCurrentMedia = (state) => state.media.currentItem;
export const selectIsUploading = (state) => state.media.isUploading;
export const selectUploadProgress = (state) => state.media.uploadProgress;
export const selectMediaHasError = (state) => state.media.hasError;
export const selectMediaRetryCount = (state) => state.media.retryCount;
export const selectMediaLastFetchAttempt = (state) => state.media.lastFetchAttempt;
export const selectIsInitialMediaLoadComplete = (state) => state.media.isInitialLoadComplete;

// 🔥 Составной селектор для проверки, нужно ли загружать медиа
export const selectShouldFetchMedia = (state) => {
   const media = state.media;
   return (
      !media.isLoading &&
      !media.hasError &&
      !media.isInitialLoadComplete &&
      media.retryCount < 3 &&
      media.items.length === 0
   );
};

export default mediaSlice.reducer;