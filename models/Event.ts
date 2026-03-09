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
  category?: string;
  category_data?: CategoryData; // Category-specific data
  attendees: Attendee[];
  createdAt: Date;
  updatedAt: Date;
}

// Category-specific data types
export interface CategoryData {
  [key: string]: any; // Flexible structure for different category types
}

// Specific category data interfaces
export interface ConferenceCategoryData extends CategoryData {
  keynote_speakers?: string;
  session_topics?: string[];
  networking_events?: boolean;
  exhibition_space?: boolean;
  registration_tiers?: string[];
  dietary_options?: string[];
  accessibility_features?: string[];
}

export interface RestaurantCategoryData extends CategoryData {
  party_size?: number;
  occasion_type?: string;
  seating_preference?: string;
  menu_type?: string;
  dietary_restrictions?: string[];
  bar_package?: string;
  special_requests?: string;
}

export interface WeddingCategoryData extends CategoryData {
  bride_name?: string;
  groom_name?: string;
  ceremony_time?: string;
  reception_time?: string;
  guest_count?: number;
  plus_one_policy?: string;
  meal_style?: string;
  dietary_accommodations?: string[];
  music_preferences?: string;
  special_traditions?: string;
}

export interface WorkshopCategoryData extends CategoryData {
  skill_level?: string;
  prerequisites?: string;
  materials_provided?: string[];
  certification_available?: boolean;
  workshop_duration?: string;
  max_participants?: number;
  equipment_needed?: string[];
}

export interface SportsCategoryData extends CategoryData {
  sport_type?: string;
  tournament_format?: string;
  age_divisions?: string[];
  skill_divisions?: string[];
  team_size?: number;
  registration_fee?: number;
  equipment_requirements?: string[];
  medical_requirements?: boolean;
  liability_waiver?: boolean;
}

export interface EventSummary {
  id: string;
  title: string;
  date: Date;
  attendeesCount: number;
  checkedInCount: number;
}
