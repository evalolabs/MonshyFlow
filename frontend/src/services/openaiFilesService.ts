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

export const openaiFilesService = new OpenAIFilesService();

