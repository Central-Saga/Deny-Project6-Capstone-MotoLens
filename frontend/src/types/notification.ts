export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  is_read: boolean;
  created_at: string | null;
}
