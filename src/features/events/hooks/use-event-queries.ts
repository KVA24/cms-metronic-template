import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  eventApi,
  EventCreateDto,
  EventSearchParams,
  EventUpdateDto,
} from '../api/eventApi';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => ['events', 'list'] as const,
  list: (params: EventSearchParams) => {
    const key: (string | number)[] = ['events', 'list'];
    if (params.page !== undefined) {
      key.push('page');
      key.push(params.page);
    }
    if (params.size !== undefined) {
      key.push('size');
      key.push(params.size);
    }
    if (params.id) {
      key.push('id');
      key.push(params.id);
    }
    if (params.name) {
      key.push('name');
      key.push(params.name);
    }
    return key;
  },
  details: () => ['events', 'detail'] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};

/**
 * Hook to fetch event list with pagination and filters
 */
export function useEventList(params: EventSearchParams) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch all events without pagination
 */
export function useEventListAll(params?: EventSearchParams) {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: () => eventApi.getListALL(params),
    retry: false,
  });
}

/**
 * Hook to fetch event detail by ID
 */
export function useEventDetail(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.detail(id!),
    queryFn: () => eventApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: false,
  });
}

/**
 * Hook to create new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: { data: EventCreateDto }) =>
      eventApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success('Event created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create event');
    },
  });
}

/**
 * Hook to update existing event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: EventUpdateDto;
    }) => eventApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(variables.id),
      });
      toast.success('Event updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update event');
    },
  });
}

/**
 * Hook to delete event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      otpCode,
      sign,
    }: {
      id: string;
      otpCode: string;
      sign?: string;
    }) => eventApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      toast.success('Event deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete event');
    },
  });
}
