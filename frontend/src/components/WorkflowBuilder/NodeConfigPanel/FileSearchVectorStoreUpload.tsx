import { useState, useRef, useEffect } from 'react';
import { openaiFilesService, type OpenAIFile } from '../../../services/openaiFilesService';
import { openaiVectorStoresService, type OpenAIVectorStore } from '../../../services/openaiFilesService';
import { X, Upload, File as FileIcon, Loader2, ExternalLink, Database } from 'lucide-react';
import { useCurrentUserTenantId } from '../../../utils/permissions';

interface FileSearchVectorStoreUploadProps {
  vectorStoreId: string | null | undefined;
  onVectorStoreChange: (vectorStoreId: string | null) => void;
}

export function FileSearchVectorStoreUpload({ vectorStoreId, onVectorStoreChange }: FileSearchVectorStoreUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<OpenAIFile[]>([]);
  const [vectorStore, setVectorStore] = useState<OpenAIVectorStore | null>(null);
  const [loadingVectorStore, setLoadingVectorStore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vectorStoreName, setVectorStoreName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedFileIdsRef = useRef<Set<string>>(new Set());
  const tenantId = useCurrentUserTenantId();

  // Load vector store information when vectorStoreId changes
  useEffect(() => {
    const loadVectorStoreInfo = async () => {
      if (!tenantId || !vectorStoreId) {
        setVectorStore(null);
        return;
      }

      setLoadingVectorStore(true);
      setError(null);

      try {
        console.log('[FileSearchVectorStoreUpload] Loading vector store info:', vectorStoreId);
        const vs = await openaiVectorStoresService.getVectorStoreInfo(vectorStoreId, tenantId);
        console.log('[FileSearchVectorStoreUpload] Vector store loaded:', vs);
        setVectorStore(vs);
      } catch (err: any) {
        console.error('[FileSearchVectorStoreUpload] Error loading vector store:', err);
        setError(`Failed to load vector store: ${err.message || 'Unknown error'}`);
        setVectorStore(null);
      } finally {
        setLoadingVectorStore(false);
      }
    };

    loadVectorStoreInfo();
  }, [vectorStoreId, tenantId]);

  // Poll vector store status if it's in progress
  useEffect(() => {
    if (!tenantId || !vectorStoreId || !vectorStore) {
      return;
    }

    // Only poll if status is in_progress
    if (vectorStore.status !== 'in_progress') {
      return;
    }

    // Poll every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        console.log('[FileSearchVectorStoreUpload] Polling vector store status:', vectorStoreId);
        const vs = await openaiVectorStoresService.getVectorStoreInfo(vectorStoreId, tenantId);
        console.log('[FileSearchVectorStoreUpload] Polled vector store status:', vs.status);
        setVectorStore(vs);
        
        // Stop polling if status changed to completed or failed
        if (vs.status === 'completed' || vs.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.error('[FileSearchVectorStoreUpload] Error polling vector store:', err);
        // Don't show error to user, just stop polling
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup on unmount or when dependencies change
    return () => {
      clearInterval(pollInterval);
    };
  }, [vectorStoreId, tenantId, vectorStore?.status]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!tenantId) {
      setError('Tenant ID not found. Please log in again.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload files
      console.log('[FileSearchVectorStoreUpload] Uploading files...');
      const uploadPromises = Array.from(files).map(file => 
        openaiFilesService.uploadFile(file, tenantId, 'assistants')
      );

      const uploaded = await Promise.all(uploadPromises);
      const uploadedFileIds = uploaded.map(file => file.id);
      
      // Mark files as loaded
      uploaded.forEach(file => loadedFileIdsRef.current.add(file.id));
      setUploadedFiles(prev => [...prev, ...uploaded]);

      console.log('[FileSearchVectorStoreUpload] Files uploaded:', uploadedFileIds);

      // Step 2: Create or use existing vector store
      let currentVectorStoreId = vectorStoreId;
      
      if (!currentVectorStoreId) {
        // Create new vector store
        const name = vectorStoreName.trim() || `Vector Store ${new Date().toISOString()}`;
        console.log('[FileSearchVectorStoreUpload] Creating vector store:', name);
        const newVectorStore = await openaiVectorStoresService.createVectorStore(name, tenantId);
        currentVectorStoreId = newVectorStore.id;
        setVectorStore(newVectorStore);
        onVectorStoreChange(currentVectorStoreId);
        console.log('[FileSearchVectorStoreUpload] Vector store created:', currentVectorStoreId);
      }

      // Step 3: Add files to vector store
      console.log('[FileSearchVectorStoreUpload] Adding files to vector store:', currentVectorStoreId);
      const updatedVectorStore = await openaiVectorStoresService.addFilesToVectorStore(
        currentVectorStoreId,
        uploadedFileIds,
        tenantId
      );
      setVectorStore(updatedVectorStore);
      
      console.log('[FileSearchVectorStoreUpload] Files added to vector store successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to upload files and create vector store');
      console.error('File upload/vector store error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = async (fileId: string) => {
    if (!tenantId) {
      setError('Tenant ID not found. Cannot remove file.');
      return;
    }

    // Remove from local state
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    loadedFileIdsRef.current.delete(fileId);

    // Delete from OpenAI in the background
    try {
      await openaiFilesService.deleteFile(fileId, tenantId);
      console.log('[FileSearchVectorStoreUpload] File deleted from OpenAI:', fileId);
      
      // Reload vector store info to update file counts
      if (vectorStoreId) {
        const updated = await openaiVectorStoresService.getVectorStoreInfo(vectorStoreId, tenantId);
        setVectorStore(updated);
      }
    } catch (err: any) {
      console.error('[FileSearchVectorStoreUpload] Failed to delete file:', err);
      // Don't show error - file is already removed from UI
    }
  };

  const handleDeleteVectorStore = async () => {
    if (!vectorStoreId || !tenantId) {
      return;
    }

    if (!confirm('Are you sure you want to delete this vector store? This action cannot be undone.')) {
      return;
    }

    try {
      await openaiVectorStoresService.deleteVectorStore(vectorStoreId, tenantId);
      setVectorStore(null);
      onVectorStoreChange(null);
      setUploadedFiles([]);
      loadedFileIdsRef.current.clear();
    } catch (err: any) {
      setError(`Failed to delete vector store: ${err.message || 'Unknown error'}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-700">
        Vector Store & Files
      </label>

      {/* Vector Store Info */}
      {vectorStore && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-900">
                  {vectorStore.name}
                </p>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  vectorStore.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : vectorStore.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {vectorStore.status}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                ID: {vectorStore.id.substring(0, 20)}...
              </p>
              {vectorStore.file_counts && (
                <p className="text-xs text-blue-600 mt-1">
                  Files: {vectorStore.file_counts.completed || 0} completed, {vectorStore.file_counts.in_progress || 0} in progress
                </p>
              )}
              <a
                href={`https://platform.openai.com/storage/files`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View on OpenAI Platform</span>
              </a>
            </div>
            <button
              onClick={handleDeleteVectorStore}
              className="p-1 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
              title="Delete vector store"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create New Vector Store (if no vector store exists) */}
      {!vectorStoreId && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Vector Store Name (Optional)
          </label>
          <input
            type="text"
            value={vectorStoreName}
            onChange={(e) => setVectorStoreName(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Document Store"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use auto-generated name
          </p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${uploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-gray-600">Uploading files and creating vector store...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-700">
                Drag your files here or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {vectorStoreId 
                  ? 'Files will be added to the existing vector store'
                  : 'A new vector store will be created automatically'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Loading Vector Store */}
      {loadingVectorStore && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <p className="text-xs text-blue-700">Loading vector store information...</p>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Uploaded Files:</p>
          <div className="space-y-1">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.bytes)} • ID: {file.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`https://platform.openai.com/storage/files/${file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                    title="View on OpenAI Platform"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500">
        {vectorStoreId 
          ? 'Upload files to add them to the vector store. The files will be automatically indexed for semantic search.'
          : 'Upload files to create a new vector store. The files will be automatically indexed for semantic search.'
        }
      </p>
    </div>
  );
}

