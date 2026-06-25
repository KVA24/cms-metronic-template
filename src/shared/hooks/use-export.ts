import { downloadFile, generateFilename } from '@/shared/lib/export-utils';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface UseExportOptions<TParams = any> {
  exportFn: (params: TParams) => Promise<Blob>;
  filename: string | ((params: TParams) => string);
  successMessage?: string;
  errorMessage?: string;
  mutationOptions?: Omit<
    UseMutationOptions<Blob, Error, TParams>,
    'mutationFn' | 'onSuccess' | 'onError'
  >;
}

function useExport<TParams = any>(options: UseExportOptions<TParams>) {
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
      const finalFilename =
        typeof filename === 'function' ? filename(params) : filename;

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

export function useExportWithTimestamp<TParams = any>(
  options: Omit<UseExportOptions<TParams>, 'filename'> & {
    filenamePrefix: string;
    extension: string;
    includeTime?: boolean;
  },
) {
  const {
    filenamePrefix,
    extension,
    includeTime = false,
    ...restOptions
  } = options;

  return useExport({
    ...restOptions,
    filename: () => generateFilename(filenamePrefix, extension, includeTime),
  });
}
