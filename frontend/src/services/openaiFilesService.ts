import { api } from './api';

export interface OpenAIFileUploadRequest {
  fileName: string;
  fileContent: string; // base64 encoded
  purpose?: 'assistants' | 'fine-tune' | 'batch' | 'vision';
  tenantId: string;
}

export interface OpenAIFile {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

export interface OpenAIFileUploadResponse {
  success: boolean;
  file?: OpenAIFile;
  error?: string;
}

class OpenAIFilesService {
  /**
   * Upload a file to OpenAI Files API
   * @param file - The file to upload
   * @param tenantId - The tenant ID to load secrets from
   * @param purpose - The purpose of the file (default: 'assistants')
   * @returns The uploaded file information
   */
  async uploadFile(file: File, tenantId: string, purpose: 'assistants' | 'fine-tune' | 'batch' | 'vision' = 'assistants'): Promise<OpenAIFile> {
    try {
      if (!tenantId) {
        throw new Error('tenantId is required');
      }

      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      const request: OpenAIFileUploadRequest = {
        fileName: file.name,
        fileContent: base64,
        purpose,
        tenantId,
      };

      const response = await api.post<OpenAIFileUploadResponse>('/api/openai/files/upload', request);
      
      if (!response.data.success || !response.data.file) {
        throw new Error(response.data.error || 'Failed to upload file');
      }

      return response.data.file;
    } catch (error: any) {
      console.error('Error uploading file to OpenAI:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload file to OpenAI');
    }
  }

  /**
   * Get file information from OpenAI Files API
   * @param fileIds - Array of file IDs to retrieve
   * @param tenantId - The tenant ID to load secrets from
   * @returns Array of file information
   */
  async getFileInfo(fileIds: string[], tenantId: string): Promise<OpenAIFile[]> {
    try {
      console.log('[OpenAIFilesService] getFileInfo called:', { fileIds, tenantId });
      
      if (!fileIds || fileIds.length === 0) {
        console.log('[OpenAIFilesService] No fileIds provided, returning empty array');
        return [];
      }

      if (!tenantId) {
        throw new Error('tenantId is required');
      }

      console.log('[OpenAIFilesService] Making API call to /api/openai/files/info');
      const response = await api.post<{
        success: boolean;
        files?: OpenAIFile[];
        error?: string;
      }>('/api/openai/files/info', {
        fileIds,
        tenantId,
      });

      console.log('[OpenAIFilesService] API response:', response.data);

      if (!response.data.success || !response.data.files) {
        const errorMsg = response.data.error || 'Failed to retrieve file information';
        console.error('[OpenAIFilesService] API returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[OpenAIFilesService] Successfully retrieved file info:', response.data.files);
      return response.data.files;
    } catch (error: any) {
      console.error('[OpenAIFilesService] Error retrieving file information:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to retrieve file information from OpenAI');
    }
  }

  /**
   * Delete a file from OpenAI Files API
   * @param fileId - The file ID to delete
   * @param tenantId - The tenant ID to load secrets from
   * @returns True if the file was deleted successfully
   */
  async deleteFile(fileId: string, tenantId: string): Promise<boolean> {
    try {
      console.log('[OpenAIFilesService] deleteFile called:', { fileId, tenantId });
      
      if (!fileId) {
        throw new Error('fileId is required');
      }

      if (!tenantId) {
        throw new Error('tenantId is required');
      }

      console.log('[OpenAIFilesService] Making API call to DELETE /api/openai/files/' + fileId);
      const response = await api.delete<{
        success: boolean;
        deleted?: boolean;
        fileId?: string;
        error?: string;
        message?: string;
      }>(`/api/openai/files/${fileId}`, {
        data: { tenantId },
      });

      console.log('[OpenAIFilesService] API response:', response.data);

      if (!response.data.success) {
        const errorMsg = response.data.error || 'Failed to delete file';
        console.error('[OpenAIFilesService] API returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[OpenAIFilesService] Successfully deleted file:', fileId);
      return response.data.deleted !== false; // Default to true if not specified
    } catch (error: any) {
      console.error('[OpenAIFilesService] Error deleting file:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete file from OpenAI');
    }
  }

  /**
   * Convert a File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:mime/type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

export interface OpenAIVectorStore {
  id: string;
  name: string;
  status: string;
  created_at: number;
  file_counts?: {
    in_progress?: number;
    completed?: number;
    failed?: number;
    cancelled?: number;
    total?: number;
  };
}

export interface OpenAIVectorStoreCreateRequest {
  name: string;
  tenantId: string;
}

export interface OpenAIVectorStoreCreateResponse {
  success: boolean;
  vectorStore?: OpenAIVectorStore;
  error?: string;
}

export interface OpenAIVectorStoreAddFilesRequest {
  fileIds: string[];
  tenantId: string;
}

export interface OpenAIVectorStoreAddFilesResponse {
  success: boolean;
  vectorStore?: OpenAIVectorStore;
  filesAdded?: number;
  error?: string;
}

class OpenAIVectorStoresService {
  /**
   * Create a new vector store
   * @param name - The name of the vector store
   * @param tenantId - The tenant ID to load secrets from
   * @returns The created vector store information
   */
  async createVectorStore(name: string, tenantId: string): Promise<OpenAIVectorStore> {
    try {
      console.log('[OpenAIVectorStoresService] createVectorStore called:', { name, tenantId });
      
      if (!name || !tenantId) {
        throw new Error('name and tenantId are required');
      }

      const response = await api.post<OpenAIVectorStoreCreateResponse>('/api/openai/vector-stores/create', {
        name,
        tenantId,
      });

      console.log('[OpenAIVectorStoresService] API response:', response.data);

      if (!response.data.success || !response.data.vectorStore) {
        throw new Error(response.data.error || 'Failed to create vector store');
      }

      console.log('[OpenAIVectorStoresService] Successfully created vector store:', response.data.vectorStore.id);
      return response.data.vectorStore;
    } catch (error: any) {
      console.error('[OpenAIVectorStoresService] Error creating vector store:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to create vector store');
    }
  }

  /**
   * Add files to a vector store
   * @param vectorStoreId - The vector store ID
   * @param fileIds - Array of file IDs to add
   * @param tenantId - The tenant ID to load secrets from
   * @returns The updated vector store information
   */
  async addFilesToVectorStore(vectorStoreId: string, fileIds: string[], tenantId: string): Promise<OpenAIVectorStore> {
    try {
      console.log('[OpenAIVectorStoresService] addFilesToVectorStore called:', { vectorStoreId, fileIds, tenantId });
      
      if (!vectorStoreId || !fileIds || fileIds.length === 0 || !tenantId) {
        throw new Error('vectorStoreId, fileIds array, and tenantId are required');
      }

      const response = await api.post<OpenAIVectorStoreAddFilesResponse>(
        `/api/openai/vector-stores/${vectorStoreId}/files`,
        {
          fileIds,
          tenantId,
        }
      );

      console.log('[OpenAIVectorStoresService] API response:', response.data);

      if (!response.data.success || !response.data.vectorStore) {
        throw new Error(response.data.error || 'Failed to add files to vector store');
      }

      console.log('[OpenAIVectorStoresService] Successfully added files to vector store:', response.data.filesAdded);
      return response.data.vectorStore;
    } catch (error: any) {
      console.error('[OpenAIVectorStoresService] Error adding files to vector store:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to add files to vector store');
    }
  }

  /**
   * Get vector store information
   * @param vectorStoreId - The vector store ID
   * @param tenantId - The tenant ID to load secrets from
   * @returns The vector store information
   */
  async getVectorStoreInfo(vectorStoreId: string, tenantId: string): Promise<OpenAIVectorStore> {
    try {
      console.log('[OpenAIVectorStoresService] getVectorStoreInfo called:', { vectorStoreId, tenantId });
      
      if (!vectorStoreId || !tenantId) {
        throw new Error('vectorStoreId and tenantId are required');
      }

      const response = await api.get<{
        success: boolean;
        vectorStore?: OpenAIVectorStore;
        error?: string;
      }>(`/api/openai/vector-stores/${vectorStoreId}`, {
        params: { tenantId },
      });

      console.log('[OpenAIVectorStoresService] API response:', response.data);

      if (!response.data.success || !response.data.vectorStore) {
        throw new Error(response.data.error || 'Failed to retrieve vector store information');
      }

      return response.data.vectorStore;
    } catch (error: any) {
      console.error('[OpenAIVectorStoresService] Error retrieving vector store info:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to retrieve vector store information');
    }
  }

  /**
   * List files in a vector store
   * @param vectorStoreId - The vector store ID
   * @param tenantId - The tenant ID to load secrets from
   * @param limit - Maximum number of files to retrieve (default: 100)
   * @returns Array of file information
   */
  async listVectorStoreFiles(vectorStoreId: string, tenantId: string, limit: number = 100): Promise<OpenAIFile[]> {
    try {
      console.log('[OpenAIVectorStoresService] listVectorStoreFiles called:', { vectorStoreId, tenantId, limit });
      
      if (!vectorStoreId || !tenantId) {
        throw new Error('vectorStoreId and tenantId are required');
      }

      const response = await api.get<{
        success: boolean;
        files?: OpenAIFile[];
        error?: string;
      }>(`/api/openai/vector-stores/${vectorStoreId}/files`, {
        params: { tenantId, limit },
      });

      console.log('[OpenAIVectorStoresService] API response:', response.data);
      console.log('[OpenAIVectorStoresService] Files in response:', response.data.files);

      if (!response.data.success || !response.data.files) {
        throw new Error(response.data.error || 'Failed to list files in vector store');
      }

      return response.data.files;
    } catch (error: any) {
      console.error('[OpenAIVectorStoresService] Error listing vector store files:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to list files in vector store');
    }
  }

  /**
   * Remove a file from a vector store (without deleting the file itself)
   * @param vectorStoreId - The vector store ID
   * @param fileId - The file ID to remove
   * @param tenantId - The tenant ID to load secrets from
   * @returns True if the file was removed successfully
   */
  async removeFileFromVectorStore(vectorStoreId: string, fileId: string, tenantId: string): Promise<boolean> {
    try {
      console.log('[OpenAIVectorStoresService] removeFileFromVectorStore called:', { vectorStoreId, fileId, tenantId });
      
      if (!vectorStoreId || !fileId || !tenantId) {
        throw new Error('vectorStoreId, fileId, and tenantId are required');
      }

      const response = await api.delete<{
        success: boolean;
        deleted?: boolean;
        vectorStoreId?: string;
        fileId?: string;
        error?: string;
      }>(`/api/openai/vector-stores/${vectorStoreId}/files/${fileId}`, {
        params: { tenantId },
      });

      console.log('[OpenAIVectorStoresService] API response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove file from vector store');
      }

      return response.data.deleted !== false;
    } catch (error: any) {
      console.error('[OpenAIVectorStoresService] Error removing file from vector store:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to remove file from vector store');
    }
  }

  /**
   * Delete a vector store
   * @param vectorStoreId - The vector store ID
   * @param tenantId - The tenant ID to load secrets from
   * @returns True if the vector store was deleted successfully
   */
  async deleteVectorStore(vectorStoreId: string, tenantId: string): Promise<boolean> {
    try {
      console.log('[OpenAIVectorStoresService] deleteVectorStore called:', { vectorStoreId, tenantId });
      
      if (!vectorStoreId || !tenantId) {
        throw new Error('vectorStoreId and tenantId are required');
      }

      const response = await api.delete<{
        success: boolean;
        deleted?: boolean;
        vectorStoreId?: string;
        error?: string;
      }>(`/api/openai/vector-stores/${vectorStoreId}`, {
        data: { tenantId },
      });

      console.log('[OpenAIVectorStoresService] API response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete vector store');
      }

      return response.data.deleted !== false;
    } catch (error: any) {
      console.error('[OpenAIVectorStoresService] Error deleting vector store:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete vector store');
    }
  }
}

export const openaiVectorStoresService = new OpenAIVectorStoresService();

export const openaiFilesService = new OpenAIFilesService();

