import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { downloadFile, generateFilename, generateFilenameWithId } from '@/shared/lib/export-utils';

/**
 * Options for useExport hook
 */
export interface UseExportOptions<TParams = any> {
  /**
   * The API function that returns a Blob
   */
  exportFn: (params: TParams) => Promise<Blob>;
  
  /**
   * Function to generate the filename
   * Can be a static string or a function that receives the params
   */
  filename: string | ((params: TParams) => string);
  
  /**
   * Success message to show in toast
   * @default 'Export completed successfully'
   */
  successMessage?: string;
  
  /**
   * Error message to show in toast
   * @default 'Failed to export'
   */
  errorMessage?: string;
  
  /**
   * Additional mutation options
   */
  mutationOptions?: Omit<
    UseMutationOptions<Blob, Error, TParams>,
    'mutationFn' | 'onSuccess' | 'onError'
  >;
}

/**
 * Generic hook for exporting data to files (Excel, CSV, PDF, etc.)
 * 
 * @example
 * ```tsx
 * // Simple usage with static filename
 * const exportMutation = useExport({
 *   exportFn: (params) => api.exportTransactions(params),
 *   filename: 'transactions.xlsx',
 * });
 * 
 * // Usage with dynamic filename
 * const exportMutation = useExport({
 *   exportFn: (params) => api.exportUsers(params),
 *   filename: (params) => `users-${params.departmentId}-${Date.now()}.xlsx`,
 *   successMessage: 'Users exported successfully',
 * });
 * 
 * // In component
 * <Button onClick={() => exportMutation.mutate({ campaignId: '123' })}>
 *   Export
 * </Button>
 * ```
 */
export function useExport<TParams = any>(options: UseExportOptions<TParams>) {
  const {
    exportFn,
    filename,
    successMessage = 'Export completed successfully',
    errorMessage = 'Failed to export',
    mutationOptions,
  } = options;

  return useMutation({
    mutationFn: exportFn,
    onSuccess: (blob, params) => {
      const finalFilename = typeof filename === 'function' ? filename(params) : filename;
      
      downloadFile({
        blob,
        filename: finalFilename,
        onSuccess: () => {
          toast.success(successMessage);
        },
        onError: (error) => {
          toast.error(error.message || errorMessage);
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || errorMessage);
    },
    ...mutationOptions,
  });
}

/**
 * Hook for exporting with auto-generated filename (prefix + timestamp)
 * 
 * @example
 * ```tsx
 * const exportMutation = useExportWithTimestamp({
 *   exportFn: (params) => api.exportTransactions(params),
 *   filenamePrefix: 'transactions',
 *   extension: 'xlsx',
 * });
 * 
 * // Will generate: transactions-2024-01-01.xlsx
 * ```
 */
export function useExportWithTimestamp<TParams = any>(
  options: Omit<UseExportOptions<TParams>, 'filename'> & {
    filenamePrefix: string;
    extension: string;
    includeTime?: boolean;
  },
) {
  const { filenamePrefix, extension, includeTime = false, ...restOptions } = options;

  return useExport({
    ...restOptions,
    filename: () => generateFilename(filenamePrefix, extension, includeTime),
  });
}

/**
 * Hook for exporting with ID in filename (prefix + id + timestamp)
 * 
 * @example
 * ```tsx
 * const exportMutation = useExportWithId({
 *   exportFn: (params) => api.exportCampaignTransactions(params),
 *   filenamePrefix: 'campaign-transactions',
 *   extension: 'xlsx',
 *   getId: (params) => params.campaignId,
 * });
 * 
 * exportMutation.mutate({ campaignId: '12345' });
 * // Will generate: campaign-transactions-12345-2024-01-01.xlsx
 * ```
 */
export function useExportWithId<TParams = any>(
  options: Omit<UseExportOptions<TParams>, 'filename'> & {
    filenamePrefix: string;
    extension: string;
    getId: (params: TParams) => string;
    includeTime?: boolean;
  },
) {
  const { filenamePrefix, extension, getId, includeTime = false, ...restOptions } = options;

  return useExport({
    ...restOptions,
    filename: (params) => {
      const id = getId(params);
      return generateFilenameWithId(filenamePrefix, id, extension, includeTime);
    },
  });
}
