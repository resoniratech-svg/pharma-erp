export interface ActivityLog {
  id: string;
  userId: number;
  userName: string;
  action: string;
  module: string;
  timestamp: string;
  status: string;
}