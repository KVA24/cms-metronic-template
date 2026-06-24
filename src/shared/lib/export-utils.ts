/**
 * Export utilities for downloading files (Excel, CSV, PDF, etc.)
 */

export interface DownloadFileOptions {
  /**
   * The blob data to download
   */
  blob: Blob;
  
  /**
   * The filename for the downloaded file
   */
  filename: string;
  
  /**
   * Optional callback after successful download
   */
  onSuccess?: () => void;
  
  /**
   * Optional callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Download a blob as a file
 * 
 * @example
 * ```ts
 * const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
 * downloadFile({
 *   blob,
 *   filename: 'export-2024-01-01.xlsx',
 *   onSuccess: () => console.log('Downloaded!'),
 * });
 * ```
 */
export function downloadFile(options: DownloadFileOptions): void {
  const { blob, filename, onSuccess, onError } = options;

  try {
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
    
    // Call success callback
    onSuccess?.();
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Failed to download file'));
  }
}

/**
 * Generate a filename with timestamp
 * 
 * @param prefix - The prefix for the filename (e.g., 'transactions', 'users')
 * @param extension - The file extension (e.g., 'xlsx', 'csv', 'pdf')
 * @param includeTime - Whether to include time in the timestamp (default: false)
 * 
 * @example
 * ```ts
 * generateFilename('transactions', 'xlsx') // 'transactions-2024-01-01.xlsx'
 * generateFilename('users', 'csv', true) // 'users-2024-01-01-143022.csv'
 * ```
 */
export function generateFilename(
  prefix: string,
  extension: string,
  includeTime = false,
): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (includeTime) {
    const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
    return `${prefix}-${date}-${time}.${extension}`;
  }
  
  return `${prefix}-${date}.${extension}`;
}

/**
 * Generate a filename with custom ID and timestamp
 * 
 * @param prefix - The prefix for the filename
 * @param id - The ID to include in the filename
 * @param extension - The file extension
 * @param includeTime - Whether to include time in the timestamp
 * 
 * @example
 * ```ts
 * generateFilenameWithId('campaign', '12345', 'xlsx') // 'campaign-12345-2024-01-01.xlsx'
 * ```
 */
export function generateFilenameWithId(
  prefix: string,
  id: string,
  extension: string,
  includeTime = false,
): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  
  if (includeTime) {
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    return `${prefix}-${id}-${date}-${time}.${extension}`;
  }
  
  return `${prefix}-${id}-${date}.${extension}`;
}

/**
 * Common MIME types for exports
 */
export const EXPORT_MIME_TYPES = {
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  CSV: 'text/csv',
  PDF: 'application/pdf',
  JSON: 'application/json',
  XML: 'application/xml',
  ZIP: 'application/zip',
} as const;

/**
 * Check if the browser supports file downloads
 */
export function supportsDownload(): boolean {
  return typeof window !== 'undefined' && 'URL' in window && 'createObjectURL' in window.URL;
}
