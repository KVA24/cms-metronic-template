import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { UseFormReturn } from 'react-hook-form';
import { ZodError, ZodSchema } from 'zod';

/**
 * Translates Zod validation error messages using i18n translation function
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   const translatedErrors = translateZodErrors(result.error, t);
 *   console.log(translatedErrors);
 *   // [{ path: 'metricName', message: 'Tên chỉ số là bắt buộc' }]
 * }
 * ```
 *
 * @param error - ZodError object from validation
 * @param t - Translation function from useTranslations hook
 * @returns Array of translated error objects with path and message
 */
export const translateZodErrors = (
  error: ZodError,
  t: (key: string) => string,
) => {
  return error.errors.map((err) => ({
    path: err.path.join('.'),
    message: t(err.message),
  }));
};

/**
 * Gets the first translated error message from ZodError
 * @param error - ZodError object from validation
 * @param t - Translation function from useTranslations hook
 * @returns First translated error message or empty string
 */
export const getFirstTranslatedError = (
  error: ZodError,
  t: (key: string) => string,
): string => {
  const errors = translateZodErrors(error, t);
  return errors.length > 0 ? errors[0].message : '';
};

/**
 * Gets translated error messages grouped by field path
 * @param error - ZodError object from validation
 * @param t - Translation function from useTranslations hook
 * @returns Object with field paths as keys and translated messages as values
 */
export const getTranslatedErrorsByField = (
  error: ZodError,
  t: (key: string) => string,
): Record<string, string> => {
  const errors = translateZodErrors(error, t);
  return errors.reduce(
    (acc, err) => {
      acc[err.path] = err.message;
      return acc;
    },
    {} as Record<string, string>,
  );
};

/**
 * Creates a Zod resolver with automatic i18n translation for error messages
 *
 * @example
 * ```typescript
 * const { t } = useTranslations();
 *
 * const form = useForm<FormValues>({
 *   resolver: createTranslatedZodResolver(mySchema, t),
 *   defaultValues: { ... }
 * });
 *
 * // Error messages will be automatically translated
 * // Schema: z.string().min(1, 'TIER_METRICS.METRIC_NAME_REQUIRED')
 * // Display: "Tên chỉ số là bắt buộc"
 * ```
 *
 * @param schema - Zod schema to validate against
 * @param t - Translation function from useTranslations hook
 * @returns Resolver function compatible with react-hook-form
 */
export const createTranslatedZodResolver = <T extends ZodSchema>(
  schema: T,
  t: (key: string) => string,
) => {
  // Recursively translate error messages in nested error objects

  const translateErrors = (
    errors: Record<string, any>,
  ): Record<string, any> => {
    return Object.entries(errors).reduce(
      (acc, [key, error]) => {
        if (error && typeof error === 'object') {
          if ('message' in error && typeof error.message === 'string') {
            // Leaf error node — translate the message
            acc[key] = { ...error, message: t(error.message) };
          } else {
            // Nested object (array index or nested field) — recurse
            acc[key] = translateErrors(error as Record<string, any>);
          }
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (data: any, context: any, options: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await zodResolver(schema as any)(data, context, options);

    if (result.errors && Object.keys(result.errors).length > 0) {
      return {
        values: result.values,
        errors: translateErrors(result.errors),
      };
    }

    return result;
  };
};

/**
 * Hook to automatically re-validate form when language changes
 * This ensures error messages are updated with the new language
 *
 * @example
 * ```typescript
 * const { t, language } = useTranslations();
 *
 * const form = useForm<FormValues>({
 *   resolver: createTranslatedZodResolver(mySchema, t),
 *   defaultValues: { ... }
 * });
 *
 * // Automatically re-validate when language changes
 * useFormLanguageSync(form, language);
 * ```
 *
 * @param form - React Hook Form instance
 * @param language - Current language from useTranslations
 */
export const useFormLanguageSync = <T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  language: string,
) => {
  useEffect(() => {
    const formState = form.formState;
    // Only re-validate if form has been submitted and has errors
    if (formState.isSubmitted && Object.keys(formState.errors).length > 0) {
      form.trigger();
    }
  }, [language, form]);
};
