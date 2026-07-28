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
