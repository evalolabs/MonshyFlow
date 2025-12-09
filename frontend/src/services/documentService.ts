import { api } from './api';

export interface DocumentUploadRequest {
  fileName: string;
  contentBase64: string;
  workflowId?: string;
}

export interface DocumentUploadResponse {
  documentId: string;
  fileName: string;
  fileSize: number;
  status: string;
  content?: string;
}

export interface Document {
  id: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType: string;
  filePath: string;
  fileSize: number;
  content?: string;
  metadata?: any;
  workflowId?: string;
  uploadedBy?: string;
  uploadedAt: string;
  status: string;
  error?: string;
}

class DocumentService {
  async uploadDocument(file: File, workflowId?: string): Promise<DocumentUploadResponse> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      const request: DocumentUploadRequest = {
        fileName: file.name,
        contentBase64: base64,
        workflowId
      };

      const response = await api.post<DocumentUploadResponse>('/api/Documents/upload', request);
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async getDocument(documentId: string): Promise<Document> {
    const response = await api.get<Document>(`/api/Documents/${documentId}`);
    return response.data;
  }

  async getWorkflowDocuments(workflowId: string): Promise<Document[]> {
    const response = await api.get<Document[]>(`/api/Documents/workflow/${workflowId}`);
    return response.data;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/api/Documents/${documentId}`);
  }

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

export const documentService = new DocumentService();

