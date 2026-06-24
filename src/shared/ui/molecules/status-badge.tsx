import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/atoms/badge';

export type StatusType =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DELETED'
  | 'LOCKED'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'SCHEDULED';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  StatusType,
  {
    variant:
      | 'secondary'
      | 'destructive'
      | 'outline'
      | 'success'
      | 'warning'
      | 'info'
      | 'primary';
    label?: string;
  }
> = {
  // Active states
  ACTIVE: {
    variant: 'success',
    label: 'Active',
  },
  PUBLISHED: {
    variant: 'success',
    label: 'Published',
  },
  COMPLETED: {
    variant: 'success',
    label: 'Completed',
  },
  APPROVED: {
    variant: 'success',
    label: 'Approved',
  },

  // Inactive/Disabled states
  INACTIVE: {
    variant: 'secondary',
    label: 'Inactive',
  },
  ARCHIVED: {
    variant: 'secondary',
    label: 'Archived',
  },
  SUSPENDED: {
    variant: 'secondary',
    label: 'Suspended',
  },
  EXPIRED: {
    variant: 'secondary',
    label: 'Expired',
  },

  // Processing states
  PENDING: {
    variant: 'warning',
    label: 'Pending',
  },
  PROCESSING: {
    variant: 'info',
    label: 'Processing',
  },
  IN_PROGRESS: {
    variant: 'info',
    label: 'In Progress',
  },
  SCHEDULED: {
    variant: 'info',
    label: 'Scheduled',
  },
  ON_HOLD: {
    variant: 'warning',
    label: 'On Hold',
  },

  // Draft/Unpublished states
  DRAFT: {
    variant: 'outline',
    label: 'Draft',
  },

  // Error/Failed states
  FAILED: {
    variant: 'destructive',
    label: 'Failed',
  },
  REJECTED: {
    variant: 'destructive',
    label: 'Rejected',
  },
  CANCELLED: {
    variant: 'destructive',
    label: 'Cancelled',
  },
  DELETED: {
    variant: 'destructive',
    label: 'Deleted',
  },
  LOCKED: {
    variant: 'destructive',
    label: 'Locked',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export function StatusBadge({
  status,
  className,
  size = 'md',
}: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase() as StatusType;
  const config = statusConfig[normalizedStatus];

  // If status not found in config, use default
  const variant = config?.variant || 'primary';
  const label = config?.label || status;

  return (
    <Badge variant={variant} className={cn(sizeClasses[size], className)}>
      {label}
    </Badge>
  );
}

// Helper function to get status color for custom styling
function getStatusColor(status: StatusType | string): string {
  const normalizedStatus = status.toUpperCase() as StatusType;
  const config = statusConfig[normalizedStatus];

  switch (config?.variant) {
    case 'success':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950';
    case 'destructive':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
    case 'info':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950';
    case 'primary':
      return 'text-primary bg-primary/10';
    case 'secondary':
      return 'text-muted-foreground bg-muted';
    default:
      return 'text-foreground bg-background';
  }
}

// Helper function to check if status is active/positive
function isActiveStatus(status: StatusType | string): boolean {
  const normalizedStatus = status.toUpperCase() as StatusType;
  return ['ACTIVE', 'PUBLISHED', 'COMPLETED', 'APPROVED'].includes(
    normalizedStatus,
  );
}

// Helper function to check if status is processing
function isProcessingStatus(status: StatusType | string): boolean {
  const normalizedStatus = status.toUpperCase() as StatusType;
  return ['PENDING', 'PROCESSING', 'IN_PROGRESS', 'SCHEDULED'].includes(
    normalizedStatus,
  );
}

// Helper function to check if status is error/failed
function isErrorStatus(status: StatusType | string): boolean {
  const normalizedStatus = status.toUpperCase() as StatusType;
  return ['FAILED', 'REJECTED', 'CANCELLED', 'DELETED'].includes(
    normalizedStatus,
  );
}
