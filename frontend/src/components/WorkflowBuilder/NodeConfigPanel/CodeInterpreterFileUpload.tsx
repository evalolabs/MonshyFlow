import { useState, useRef, useEffect } from 'react';
import { openaiFilesService, type OpenAIFile } from '../../../services/openaiFilesService';
import { X, Upload, File as FileIcon, Loader2, ExternalLink } from 'lucide-react';
import { useCurrentUserTenantId } from '../../../utils/permissions';

// Helper to create a stable string key from fileIds array
const fileIdsKey = (ids: string[]) => ids.sort().join(',');

interface CodeInterpreterFileUploadProps {
  fileIds: string[];
  onFilesChange: (fileIds: string[]) => void;
}

export function CodeInterpreterFileUpload({ fileIds, onFilesChange }: CodeInterpreterFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<OpenAIFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedFileIdsRef = useRef<Set<string>>(new Set());
  const tenantId = useCurrentUserTenantId();

  // Load file information when component mounts or fileIds change
  useEffect(() => {
    const loadFileInfo = async () => {
      console.log('[CodeInterpreterFileUpload] useEffect triggered', { 
        fileIds, 
        tenantId, 
        fileIdsLength: fileIds?.length 
      });

      if (!tenantId) {
        console.log('[CodeInterpreterFileUpload] No tenantId, skipping file load');
        return;
      }

      if (!fileIds || fileIds.length === 0) {
        console.log('[CodeInterpreterFileUpload] No fileIds, skipping file load');
        return;
      }

      // Only fetch files that we haven't loaded yet
      const fileIdsToFetch = fileIds.filter(id => !loadedFileIdsRef.current.has(id));
      
      console.log('[CodeInterpreterFileUpload] File IDs to fetch:', fileIdsToFetch);
      
      if (fileIdsToFetch.length === 0) {
        console.log('[CodeInterpreterFileUpload] All files already loaded');
        return;
      }

      setLoadingFiles(true);
      setError(null);

      try {
        console.log('[CodeInterpreterFileUpload] Fetching file info for:', fileIdsToFetch);
        const files = await openaiFilesService.getFileInfo(fileIdsToFetch, tenantId);
        console.log('[CodeInterpreterFileUpload] Received file info:', files);
        
        // Filter out files with errors and add valid files
        const validFiles = files.filter((f): f is OpenAIFile => !('error' in f));
        console.log('[CodeInterpreterFileUpload] Valid files:', validFiles);
        
        // Mark these file IDs as loaded
        validFiles.forEach(f => loadedFileIdsRef.current.add(f.id));
        
        setUploadedFiles(prev => {
          // Merge with existing files, avoiding duplicates
          const existingIds = new Set(prev.map(f => f.id));
          const newFiles = validFiles.filter(f => !existingIds.has(f.id));
          console.log('[CodeInterpreterFileUpload] Adding new files to state:', newFiles);
          return [...prev, ...newFiles];
        });
      } catch (err: any) {
        console.error('[CodeInterpreterFileUpload] Error loading file information:', err);
        setError(`Failed to load file information: ${err.message || 'Unknown error'}`);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadFileInfo();
  }, [fileIds?.join(','), tenantId]); // Re-run when fileIds array or tenantId changes

  // Track which file IDs we've uploaded in this session vs. which were already in config
  // For files already in config, we only have the ID, not the full file info
  const existingFileIds = fileIds.filter(id => !uploadedFiles.some(f => f.id === id));

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!tenantId) {
      setError('Tenant ID not found. Please log in again.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(file => 
        openaiFilesService.uploadFile(file, tenantId, 'assistants')
      );

      const uploaded = await Promise.all(uploadPromises);
      const newFileIds = uploaded.map(file => file.id);
      
      // Mark newly uploaded files as loaded
      uploaded.forEach(file => loadedFileIdsRef.current.add(file.id));
      
      setUploadedFiles(prev => [...prev, ...uploaded]);
      onFilesChange([...fileIds, ...newFileIds]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
      console.error('File upload error:', err);
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
      setError('Tenant ID not found. Cannot delete file.');
      return;
    }

    // Optimistically remove from UI
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    onFilesChange(fileIds.filter(id => id !== fileId));
    
    // Also remove from loadedFileIdsRef
    loadedFileIdsRef.current.delete(fileId);

    // Delete from OpenAI in the background
    try {
      console.log('[CodeInterpreterFileUpload] Deleting file from OpenAI:', fileId);
      await openaiFilesService.deleteFile(fileId, tenantId);
      console.log('[CodeInterpreterFileUpload] Successfully deleted file from OpenAI:', fileId);
    } catch (err: any) {
      console.error('[CodeInterpreterFileUpload] Failed to delete file from OpenAI:', err);
      // Don't show error to user - file is already removed from UI
      // The file will remain on OpenAI platform, but that's okay
      // User can manually delete it if needed
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
        Uploaded Files (Optional)
      </label>
      
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
            <p className="text-xs text-gray-600">Uploading files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-700">
                Drag your files here or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Adding files is optional
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

      {/* Loading State */}
      {loadingFiles && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <p className="text-xs text-blue-700">Loading file information...</p>
        </div>
      )}

      {/* Uploaded Files List */}
      {(uploadedFiles.length > 0 || existingFileIds.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Uploaded Files:</p>
          <div className="space-y-1">
            {/* Files uploaded in this session (with full info) */}
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
            {/* Files from config (only ID available) */}
            {existingFileIds.map((fileId) => (
              <div
                key={fileId}
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      File ID: {fileId.substring(0, 20)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded previously
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`https://platform.openai.com/storage/files/${fileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                    title="View on OpenAI Platform"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleRemoveFile(fileId)}
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
        Files uploaded here will be available to the Code Interpreter during execution.
      </p>
    </div>
  );
}

