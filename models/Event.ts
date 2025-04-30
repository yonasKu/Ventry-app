export interface Attendee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  checkedIn: boolean;
  checkInTime?: Date;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  time: Date;
  location?: string;
  notes?: string;
  expectedAttendees?: number;
  attendees: Attendee[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventSummary {
  id: string;
  title: string;
  date: Date;
  attendeesCount: number;
  checkedInCount: number;
}
