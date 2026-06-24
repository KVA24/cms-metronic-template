/**
 * Format types for date formatting
 */
export type DateFormatType =
  | 'dd/MM/yyyy' // 25/12/2024
  | 'dd/MM/yyyy HH:mm:ss' // 25/12/2024 14:30:45
  | 'dd/MM/yyyy HH:mm' // 25/12/2024 14:30
  | 'yyyy-MM-dd' // 2024-12-25
  | 'yyyy-MM-dd HH:mm:ss' // 2024-12-25 14:30:45
  | 'yyyy-MM-dd HH:mm' // 2024-12-25 14:30
  | 'MM/dd/yyyy' // 12/25/2024
  | 'dd-MM-yyyy' // 25-12-2024
  | 'HH:mm:ss' // 14:30:45
  | 'HH:mm'; // 14:30

/**
 * Format date with specified format
 * @param date - Date object, timestamp (number), or date string
 * @param format - Format type for the output
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number | string | undefined | null,
  format: DateFormatType = 'dd/MM/yyyy',
): string {
  if (!date) return 'N/A';

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;

    case 'dd/MM/yyyy HH:mm:ss':
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

    case 'dd/MM/yyyy HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;

    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;

    case 'yyyy-MM-dd HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    case 'yyyy-MM-dd HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;

    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;

    case 'dd-MM-yyyy':
      return `${day}-${month}-${year}`;

    case 'HH:mm:ss':
      return `${hours}:${minutes}:${seconds}`;

    case 'HH:mm':
      return `${hours}:${minutes}`;

    default:
      return `${day}/${month}/${year}`;
  }
}
