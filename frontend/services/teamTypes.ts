export type TeamTab = 'team' | 'tasks' | 'announcements' | 'messages' | 'meetings' | 'expenses' | 'report';

export type TeamTaskType =
  | 'property_showing'
  | 'office_meeting'
  | 'client_meeting'
  | 'document_delivery'
  | 'site_visit';

export type TeamTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TeamTaskTransitionAction = 'start' | 'complete' | 'cancel';

export type TeamAnnouncementAttachmentKind = 'image' | 'document' | 'file';

export type TeamMember = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: 'agent' | 'employee';
  employee_access_level?: 'full' | 'limited' | null;
  created_at: string | null;
  avatar_url?: string | null;
  city?: string | null;
  district?: string | null;
  member_type: 'owner' | 'employee';
  is_manager: boolean;
};

export type TeamMemberDetail = {
  member: TeamMember;
  metrics: {
    completed_tasks_this_month: number;
    property_showings_this_month: number;
  };
};

export type TeamTask = {
  id: string;
  office_owner_id: string;
  created_by: string | null;
  assignee_id: string | null;
  task_type: TeamTaskType;
  title: string;
  description?: string | null;
  property_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  scheduled_at: string;
  repeat_enabled: boolean;
  status: TeamTaskStatus;
  started_at?: string | null;
  completed_at?: string | null;
  completion_note?: string | null;
  completion_photo_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  assignee?: TeamMember | null;
  assignee_name?: string | null;
  creator?: TeamMember | null;
  creator_name?: string | null;
  property?: {
    id: string;
    address?: string | null;
    city?: string | null;
    district?: string | null;
  } | null;
  property_label?: string | null;
  is_overdue?: boolean;
};

export type TeamAnnouncementRecipient = {
  announcement_id: string;
  user_id: string;
  read_at?: string | null;
  reminded_at?: string | null;
  reminder_count: number;
  user?: TeamMember | null;
};

export type TeamAnnouncement = {
  id: string;
  office_owner_id: string;
  created_by: string | null;
  title: string;
  body: string;
  attachment_path?: string | null;
  attachment_kind?: TeamAnnouncementAttachmentKind | null;
  created_at: string;
  updated_at: string;
  creator?: TeamMember | null;
  creator_name?: string | null;
  recipients?: TeamAnnouncementRecipient[];
  recipient_count: number;
  read_count: number;
  unread_count: number;
  viewer_read_at?: string | null;
  viewer_is_read: boolean;
};

export type TeamMessageReplyPreview = {
  id: string;
  body: string;
  sender_name: string | null;
};

export type TeamMessage = {
  id: string;
  office_owner_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  reply_to_id?: string | null;
  reply_to?: TeamMessageReplyPreview | null;
  sender?: TeamMember | null;
  sender_name?: string | null;
};

export type TeamMessageReadStatus = {
  user_id: string;
  user_name: string | null;
  last_read_at: string;
};

export type TeamMeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export type TeamMeeting = {
  id: string;
  office_owner_id: string;
  created_by: string | null;
  title: string;
  description?: string | null;
  scheduled_at: string;
  notes?: string | null;
  status: TeamMeetingStatus;
  created_at: string;
  updated_at: string;
  creator?: TeamMember | null;
  creator_name?: string | null;
};

export type ExpenseCategory = 'kira' | 'fatura' | 'ulasim' | 'yemek' | 'malzeme' | 'diger';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  kira: 'Kira',
  fatura: 'Fatura',
  ulasim: 'Ulaşım',
  yemek: 'Yemek',
  malzeme: 'Malzeme',
  diger: 'Diğer',
};

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  kira: 'home',
  fatura: 'bolt',
  ulasim: 'directions-car',
  yemek: 'restaurant',
  malzeme: 'inventory',
  diger: 'more-horiz',
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  kira: '#4A90D9',
  fatura: '#F5A623',
  ulasim: '#7ED321',
  yemek: '#E74C3C',
  malzeme: '#9B59B6',
  diger: '#95A5A6',
};

export type OfficeExpense = {
  id: string;
  office_owner_id: string;
  created_by: string | null;
  amount: number;
  category: ExpenseCategory;
  category_label?: string;
  description?: string | null;
  expense_date: string;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
  creator?: TeamMember | null;
  creator_name?: string | null;
};

export type ExpenseMonthlySummary = {
  year_month: string;
  total: number;
  by_category: { category: ExpenseCategory; label: string; total: number }[];
};

export type TeamReportRange = 'this_week' | 'last_week' | 'this_month' | 'last_month';

export type TeamReportBar = {
  label: string;
  value: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
};

export type TeamReportMetric = {
  label: string;
  value: string;
  change?: string;
};

export type TeamReportSection = {
  title: string;
  subtitle: string;
  metrics: TeamReportMetric[];
  bars: TeamReportBar[];
};

export type TeamReportPayload = {
  range: TeamReportRange;
  label: string;
  sections: {
    teamPerformance: TeamReportSection;
    propertyStatus: TeamReportSection;
    operationsHealth: TeamReportSection;
    maintenanceHealth: TeamReportSection;
  };
};
