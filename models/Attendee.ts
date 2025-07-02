export type Attendee = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  checked_in: boolean;
  check_in_time: string | null;
  created_at: string;
  updated_at: string;
}; 