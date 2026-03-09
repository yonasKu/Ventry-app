import { CategoryFormConfig, EventCategory, CategoryInfo } from '../types/FormTypes';

// Conference Form Configuration
export const CONFERENCE_FORM: CategoryFormConfig = {
  category: EventCategory.CONFERENCE,
  displayName: 'Conference',
  description: 'Professional conferences, seminars, and business events',
  icon: 'presentation',
  estimatedTime: '4-6 minutes',
  specialFields: ['Sessions', 'Speakers', 'Networking', 'Dietary Options'],
  sections: [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Essential event details',
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Conference Name',
          placeholder: 'e.g., Tech Innovation Summit 2026',
          required: true,
          validation: [
            { type: 'required', message: 'Conference name is required' },
            { type: 'minLength', value: 3, message: 'Conference name must be at least 3 characters' }
          ]
        },
        {
          id: 'location',
          type: 'text',
          label: 'Venue',
          placeholder: 'e.g., Convention Center, Downtown',
          required: true,
          validation: [
            { type: 'required', message: 'Venue location is required' }
          ]
        },
        {
          id: 'date',
          type: 'date',
          label: 'Conference Date',
          required: true,
          validation: [
            { type: 'required', message: 'Conference date is required' }
          ]
        },
        {
          id: 'time',
          type: 'time',
          label: 'Start Time',
          required: true,
          validation: [
            { type: 'required', message: 'Start time is required' }
          ]
        },
        {
          id: 'expected_attendees',
          type: 'number',
          label: 'Expected Attendees',
          placeholder: 'e.g., 150',
          required: false,
          validation: [
            { type: 'min', value: 1, message: 'Must be at least 1 attendee' }
          ]
        }
      ]
    },
    {
      id: 'conference_details',
      title: 'Conference Details',
      description: 'Specific information about your conference',
      fields: [
        {
          id: 'keynote_speakers',
          type: 'textarea',
          label: 'Keynote Speakers',
          placeholder: 'List your keynote speakers and their topics...',
          required: false,
          helpText: 'Include speaker names and brief topic descriptions'
        },
        {
          id: 'session_topics',
          type: 'multiselect',
          label: 'Session Topics',
          required: false,
          options: [
            'Technology & Innovation',
            'Business Strategy',
            'Marketing & Sales',
            'Artificial Intelligence',
            'Blockchain & Crypto',
            'Sustainability',
            'Leadership',
            'Entrepreneurship',
            'Data Science',
            'Cybersecurity',
            'Digital Transformation',
            'Future of Work'
          ],
          helpText: 'Select all topics that will be covered'
        },
        {
          id: 'networking_events',
          type: 'checkbox',
          label: 'Include Networking Events',
          required: false,
          helpText: 'Coffee breaks, lunch networking, evening reception, etc.'
        },
        {
          id: 'exhibition_space',
          type: 'checkbox',
          label: 'Exhibition Space Available',
          required: false,
          helpText: 'Space for sponsors and exhibitors to showcase products'
        }
      ]
    },
    {
      id: 'attendee_requirements',
      title: 'Attendee Requirements',
      description: 'Registration and accommodation details',
      fields: [
        {
          id: 'registration_tiers',
          type: 'multiselect',
          label: 'Registration Tiers',
          required: false,
          options: [
            'Early Bird',
            'Regular',
            'Student Discount',
            'VIP Access',
            'Speaker Pass',
            'Press Pass',
            'Group Discount'
          ],
          helpText: 'Different pricing or access levels for attendees'
        },
        {
          id: 'dietary_options',
          type: 'multiselect',
          label: 'Dietary Options',
          required: false,
          options: [
            'Vegetarian',
            'Vegan',
            'Gluten-Free',
            'Halal',
            'Kosher',
            'Dairy-Free',
            'Nut-Free',
            'Low-Sodium'
          ],
          helpText: 'Dietary accommodations for meals and refreshments'
        },
        {
          id: 'accessibility_features',
          type: 'multiselect',
          label: 'Accessibility Features',
          required: false,
          options: [
            'Wheelchair Access',
            'Sign Language Interpretation',
            'Audio Loop System',
            'Large Print Materials',
            'Braille Materials',
            'Accessible Parking',
            'Quiet Room Available'
          ],
          helpText: 'Accessibility accommodations for attendees'
        }
      ]
    }
  ]
};

// Restaurant/Club Form Configuration
export const RESTAURANT_FORM: CategoryFormConfig = {
  category: EventCategory.RESTAURANT,
  displayName: 'Restaurant/Club Event',
  description: 'Private dining, celebrations, and club events',
  icon: 'fork-knife',
  estimatedTime: '3-4 minutes',
  specialFields: ['Party Size', 'Menu', 'Seating', 'Occasion'],
  sections: [
    {
      id: 'event_info',
      title: 'Event Information',
      description: 'Basic event and reservation details',
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Event Name',
          placeholder: 'e.g., Sarah\'s Birthday Dinner',
          required: true,
          validation: [
            { type: 'required', message: 'Event name is required' }
          ]
        },
        {
          id: 'location',
          type: 'text',
          label: 'Restaurant/Venue',
          placeholder: 'e.g., The Garden Restaurant',
          required: true,
          validation: [
            { type: 'required', message: 'Restaurant/venue is required' }
          ]
        },
        {
          id: 'date',
          type: 'date',
          label: 'Reservation Date',
          required: true,
          validation: [
            { type: 'required', message: 'Reservation date is required' }
          ]
        },
        {
          id: 'time',
          type: 'time',
          label: 'Reservation Time',
          required: true,
          validation: [
            { type: 'required', message: 'Reservation time is required' }
          ]
        }
      ]
    },
    {
      id: 'party_details',
      title: 'Party Details',
      description: 'Information about your group and occasion',
      fields: [
        {
          id: 'party_size',
          type: 'number',
          label: 'Party Size',
          placeholder: 'e.g., 8',
          required: true,
          validation: [
            { type: 'required', message: 'Party size is required' },
            { type: 'min', value: 1, message: 'Party size must be at least 1' }
          ],
          helpText: 'Total number of guests including yourself'
        },
        {
          id: 'occasion_type',
          type: 'select',
          label: 'Occasion',
          required: false,
          options: [
            'Birthday',
            'Anniversary',
            'Business Dinner',
            'Date Night',
            'Family Celebration',
            'Holiday Party',
            'Graduation',
            'Retirement',
            'Other'
          ],
          helpText: 'What are you celebrating?'
        },
        {
          id: 'seating_preference',
          type: 'select',
          label: 'Seating Preference',
          required: false,
          options: [
            'No Preference',
            'Booth',
            'Table',
            'Bar Seating',
            'Private Room',
            'Outdoor/Patio',
            'Window Table',
            'Quiet Area'
          ]
        },
        {
          id: 'special_requests',
          type: 'textarea',
          label: 'Special Requests',
          placeholder: 'Any special arrangements, decorations, or requests...',
          required: false,
          helpText: 'Birthday cake, decorations, special seating arrangements, etc.'
        }
      ]
    },
    {
      id: 'dining_preferences',
      title: 'Dining Preferences',
      description: 'Menu and dietary information',
      fields: [
        {
          id: 'menu_type',
          type: 'select',
          label: 'Menu Preference',
          required: false,
          options: [
            'À la carte',
            'Prix Fixe Menu',
            'Tasting Menu',
            'Buffet',
            'Family Style',
            'Chef\'s Choice'
          ]
        },
        {
          id: 'dietary_restrictions',
          type: 'multiselect',
          label: 'Dietary Restrictions',
          required: false,
          options: [
            'Vegetarian',
            'Vegan',
            'Gluten-Free',
            'Dairy-Free',
            'Nut Allergy',
            'Shellfish Allergy',
            'Kosher',
            'Halal',
            'Low-Sodium',
            'Diabetic-Friendly'
          ],
          helpText: 'Select all that apply for your party'
        },
        {
          id: 'bar_package',
          type: 'select',
          label: 'Bar Package',
          required: false,
          options: [
            'None',
            'Wine Only',
            'Beer & Wine',
            'Full Bar',
            'Premium Bar',
            'Signature Cocktails',
            'Open Bar'
          ]
        }
      ]
    }
  ]
};

// Wedding Form Configuration
export const WEDDING_FORM: CategoryFormConfig = {
  category: EventCategory.WEDDING,
  displayName: 'Wedding',
  description: 'Wedding ceremonies, receptions, and celebrations',
  icon: 'heart',
  estimatedTime: '5-7 minutes',
  specialFields: ['Bride & Groom', 'Ceremony', 'Reception', 'Guests'],
  sections: [
    {
      id: 'wedding_info',
      title: 'Wedding Information',
      description: 'Basic wedding details',
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Wedding Title',
          placeholder: 'e.g., Sarah & John\'s Wedding',
          required: true,
          validation: [
            { type: 'required', message: 'Wedding title is required' }
          ]
        },
        {
          id: 'bride_name',
          type: 'text',
          label: 'Bride\'s Name',
          placeholder: 'e.g., Sarah Johnson',
          required: true,
          validation: [
            { type: 'required', message: 'Bride\'s name is required' }
          ]
        },
        {
          id: 'groom_name',
          type: 'text',
          label: 'Groom\'s Name',
          placeholder: 'e.g., John Smith',
          required: true,
          validation: [
            { type: 'required', message: 'Groom\'s name is required' }
          ]
        },
        {
          id: 'date',
          type: 'date',
          label: 'Wedding Date',
          required: true,
          validation: [
            { type: 'required', message: 'Wedding date is required' }
          ]
        },
        {
          id: 'location',
          type: 'text',
          label: 'Venue',
          placeholder: 'e.g., Sunset Gardens, Malibu',
          required: true,
          validation: [
            { type: 'required', message: 'Wedding venue is required' }
          ]
        }
      ]
    },
    {
      id: 'ceremony_reception',
      title: 'Ceremony & Reception',
      description: 'Timing and guest information',
      fields: [
        {
          id: 'time',
          type: 'time',
          label: 'Ceremony Time',
          required: true,
          validation: [
            { type: 'required', message: 'Ceremony time is required' }
          ]
        },
        {
          id: 'reception_time',
          type: 'time',
          label: 'Reception Time',
          required: false,
          helpText: 'Leave blank if reception immediately follows ceremony'
        },
        {
          id: 'expected_attendees',
          type: 'number',
          label: 'Expected Guest Count',
          placeholder: 'e.g., 120',
          required: true,
          validation: [
            { type: 'required', message: 'Guest count is required' },
            { type: 'min', value: 1, message: 'Must have at least 1 guest' }
          ]
        },
        {
          id: 'plus_one_policy',
          type: 'select',
          label: 'Plus-One Policy',
          required: false,
          options: [
            'No Plus-Ones',
            'Married Couples Only',
            'Long-term Partners (1+ years)',
            'All Single Guests Get Plus-One',
            'Case by Case Basis'
          ],
          helpText: 'Who is allowed to bring a guest?'
        }
      ]
    },
    {
      id: 'reception_details',
      title: 'Reception Details',
      description: 'Food, music, and special arrangements',
      fields: [
        {
          id: 'meal_style',
          type: 'select',
          label: 'Meal Style',
          required: false,
          options: [
            'Plated Dinner',
            'Buffet',
            'Family Style',
            'Cocktail Reception',
            'Brunch',
            'Lunch',
            'Heavy Hors d\'oeuvres'
          ]
        },
        {
          id: 'dietary_accommodations',
          type: 'multiselect',
          label: 'Dietary Accommodations',
          required: false,
          options: [
            'Vegetarian Options',
            'Vegan Options',
            'Gluten-Free Options',
            'Kosher Meal',
            'Halal Meal',
            'Children\'s Menu',
            'Dairy-Free Options',
            'Nut-Free Options'
          ],
          helpText: 'What dietary options will you provide?'
        },
        {
          id: 'music_preferences',
          type: 'textarea',
          label: 'Music Preferences/Requests',
          placeholder: 'First dance song, must-play songs, do-not-play songs...',
          required: false,
          helpText: 'Special songs, genres, or music requests for the DJ/band'
        },
        {
          id: 'special_traditions',
          type: 'textarea',
          label: 'Special Traditions/Customs',
          placeholder: 'Cultural traditions, family customs, special ceremonies...',
          required: false,
          helpText: 'Any cultural or family traditions to incorporate'
        }
      ]
    }
  ]
};

// Workshop Form Configuration
export const WORKSHOP_FORM: CategoryFormConfig = {
  category: EventCategory.WORKSHOP,
  displayName: 'Workshop/Training',
  description: 'Educational workshops, training sessions, and skill-building events',
  icon: 'chalkboard-teacher',
  estimatedTime: '3-5 minutes',
  specialFields: ['Skills', 'Materials', 'Prerequisites', 'Certification'],
  sections: [
    {
      id: 'workshop_info',
      title: 'Workshop Information',
      description: 'Basic workshop details',
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Workshop Title',
          placeholder: 'e.g., Advanced React Development',
          required: true,
          validation: [
            { type: 'required', message: 'Workshop title is required' }
          ]
        },
        {
          id: 'location',
          type: 'text',
          label: 'Location',
          placeholder: 'e.g., Training Center Room A',
          required: true,
          validation: [
            { type: 'required', message: 'Workshop location is required' }
          ]
        },
        {
          id: 'date',
          type: 'date',
          label: 'Workshop Date',
          required: true,
          validation: [
            { type: 'required', message: 'Workshop date is required' }
          ]
        },
        {
          id: 'time',
          type: 'time',
          label: 'Start Time',
          required: true,
          validation: [
            { type: 'required', message: 'Start time is required' }
          ]
        },
        {
          id: 'workshop_duration',
          type: 'select',
          label: 'Duration',
          required: false,
          options: [
            '1 hour',
            '2 hours',
            '3 hours',
            '4 hours',
            'Half day (4-5 hours)',
            'Full day (6-8 hours)',
            'Multi-day'
          ]
        }
      ]
    },
    {
      id: 'workshop_details',
      title: 'Workshop Details',
      description: 'Skills, requirements, and logistics',
      fields: [
        {
          id: 'skill_level',
          type: 'select',
          label: 'Skill Level Required',
          required: false,
          options: [
            'Beginner',
            'Intermediate',
            'Advanced',
            'Expert',
            'All Levels',
            'Mixed Levels'
          ],
          helpText: 'What level of experience do participants need?'
        },
        {
          id: 'prerequisites',
          type: 'textarea',
          label: 'Prerequisites',
          placeholder: 'Required knowledge, skills, or preparation...',
          required: false,
          helpText: 'What should participants know or prepare beforehand?'
        },
        {
          id: 'max_participants',
          type: 'number',
          label: 'Maximum Participants',
          placeholder: 'e.g., 20',
          required: false,
          validation: [
            { type: 'min', value: 1, message: 'Must allow at least 1 participant' }
          ],
          helpText: 'Limit for effective learning experience'
        },
        {
          id: 'certification_available',
          type: 'checkbox',
          label: 'Certification Available',
          required: false,
          helpText: 'Will participants receive a certificate of completion?'
        }
      ]
    },
    {
      id: 'materials_equipment',
      title: 'Materials & Equipment',
      description: 'What\'s provided and what participants need to bring',
      fields: [
        {
          id: 'materials_provided',
          type: 'multiselect',
          label: 'Materials Provided',
          required: false,
          options: [
            'Workbook/Handouts',
            'Laptop/Computer',
            'Software Access',
            'Tools/Equipment',
            'Refreshments',
            'Lunch',
            'Notebooks/Pens',
            'Reference Materials'
          ],
          helpText: 'What will you provide to participants?'
        },
        {
          id: 'equipment_needed',
          type: 'multiselect',
          label: 'Equipment Participants Should Bring',
          required: false,
          options: [
            'Laptop',
            'Notebook',
            'Pens/Pencils',
            'Calculator',
            'Specific Software',
            'Work Samples',
            'Business Cards',
            'Nothing Required'
          ],
          helpText: 'What should participants bring with them?'
        }
      ]
    }
  ]
};

// Sports Tournament Form Configuration
export const SPORTS_FORM: CategoryFormConfig = {
  category: EventCategory.SPORTS,
  displayName: 'Sports Tournament',
  description: 'Sports tournaments, competitions, and athletic events',
  icon: 'trophy',
  estimatedTime: '4-6 minutes',
  specialFields: ['Teams', 'Divisions', 'Rules', 'Waivers'],
  sections: [
    {
      id: 'tournament_info',
      title: 'Tournament Information',
      description: 'Basic tournament details',
      fields: [
        {
          id: 'title',
          type: 'text',
          label: 'Tournament Name',
          placeholder: 'e.g., Spring Soccer Championship',
          required: true,
          validation: [
            { type: 'required', message: 'Tournament name is required' }
          ]
        },
        {
          id: 'sport_type',
          type: 'select',
          label: 'Sport',
          required: true,
          options: [
            'Soccer/Football',
            'Basketball',
            'Baseball',
            'Softball',
            'Tennis',
            'Volleyball',
            'Golf',
            'Swimming',
            'Track & Field',
            'Wrestling',
            'Martial Arts',
            'Other'
          ],
          validation: [
            { type: 'required', message: 'Sport type is required' }
          ]
        },
        {
          id: 'location',
          type: 'text',
          label: 'Venue',
          placeholder: 'e.g., City Sports Complex',
          required: true,
          validation: [
            { type: 'required', message: 'Tournament venue is required' }
          ]
        },
        {
          id: 'date',
          type: 'date',
          label: 'Tournament Date',
          required: true,
          validation: [
            { type: 'required', message: 'Tournament date is required' }
          ]
        },
        {
          id: 'time',
          type: 'time',
          label: 'Start Time',
          required: true,
          validation: [
            { type: 'required', message: 'Start time is required' }
          ]
        }
      ]
    },
    {
      id: 'tournament_format',
      title: 'Tournament Format',
      description: 'Competition structure and divisions',
      fields: [
        {
          id: 'tournament_format',
          type: 'select',
          label: 'Tournament Format',
          required: false,
          options: [
            'Single Elimination',
            'Double Elimination',
            'Round Robin',
            'Swiss System',
            'Pool Play + Playoffs',
            'Ladder Tournament'
          ]
        },
        {
          id: 'age_divisions',
          type: 'multiselect',
          label: 'Age Divisions',
          required: false,
          options: [
            'Under 8',
            'Under 10',
            'Under 12',
            'Under 14',
            'Under 16',
            'Under 18',
            'Adult (18+)',
            'Masters (35+)',
            'Seniors (50+)',
            'Open (All Ages)'
          ],
          helpText: 'Select all age groups that can participate'
        },
        {
          id: 'skill_divisions',
          type: 'multiselect',
          label: 'Skill Divisions',
          required: false,
          options: [
            'Beginner',
            'Recreational',
            'Intermediate',
            'Competitive',
            'Advanced',
            'Elite',
            'Professional'
          ]
        },
        {
          id: 'team_size',
          type: 'number',
          label: 'Team Size',
          placeholder: 'e.g., 11 (for soccer)',
          required: false,
          validation: [
            { type: 'min', value: 1, message: 'Team size must be at least 1' }
          ],
          helpText: 'Number of players per team'
        }
      ]
    },
    {
      id: 'registration_requirements',
      title: 'Registration & Requirements',
      description: 'Fees, equipment, and legal requirements',
      fields: [
        {
          id: 'registration_fee',
          type: 'number',
          label: 'Registration Fee ($)',
          placeholder: 'e.g., 25',
          required: false,
          validation: [
            { type: 'min', value: 0, message: 'Fee cannot be negative' }
          ]
        },
        {
          id: 'equipment_requirements',
          type: 'multiselect',
          label: 'Required Equipment',
          required: false,
          options: [
            'Uniform/Jersey',
            'Cleats',
            'Shin Guards',
            'Helmet',
            'Protective Gear',
            'Own Equipment',
            'Water Bottle',
            'Medical Forms',
            'Insurance Proof'
          ],
          helpText: 'What must participants bring or have?'
        },
        {
          id: 'medical_requirements',
          type: 'checkbox',
          label: 'Medical Clearance Required',
          required: false,
          helpText: 'Participants must provide medical clearance to participate'
        },
        {
          id: 'liability_waiver',
          type: 'checkbox',
          label: 'Liability Waiver Required',
          required: false,
          helpText: 'Participants must sign liability waiver (strongly recommended)'
        }
      ]
    }
  ]
};

// Category Information for Selection Screen
export const CATEGORY_INFO: CategoryInfo[] = [
  {
    id: EventCategory.CONFERENCE,
    name: 'Conference',
    description: 'Professional conferences, seminars, and business events',
    icon: 'presentation',
    specialFields: ['Sessions', 'Speakers', 'Networking', 'Dietary Options'],
    estimatedTime: '4-6 minutes',
    examples: ['Tech Summit', 'Business Conference', 'Academic Symposium']
  },
  {
    id: EventCategory.RESTAURANT,
    name: 'Restaurant/Club',
    description: 'Private dining, celebrations, and club events',
    icon: 'fork-knife',
    specialFields: ['Party Size', 'Menu', 'Seating', 'Occasion'],
    estimatedTime: '3-4 minutes',
    examples: ['Birthday Dinner', 'Business Lunch', 'Anniversary Celebration']
  },
  {
    id: EventCategory.WEDDING,
    name: 'Wedding',
    description: 'Wedding ceremonies, receptions, and celebrations',
    icon: 'heart',
    specialFields: ['Bride & Groom', 'Ceremony', 'Reception', 'Guests'],
    estimatedTime: '5-7 minutes',
    examples: ['Wedding Ceremony', 'Reception', 'Engagement Party']
  },
  {
    id: EventCategory.WORKSHOP,
    name: 'Workshop/Training',
    description: 'Educational workshops, training sessions, and skill-building',
    icon: 'chalkboard-teacher',
    specialFields: ['Skills', 'Materials', 'Prerequisites', 'Certification'],
    estimatedTime: '3-5 minutes',
    examples: ['Coding Workshop', 'Leadership Training', 'Art Class']
  },
  {
    id: EventCategory.SPORTS,
    name: 'Sports Tournament',
    description: 'Sports tournaments, competitions, and athletic events',
    icon: 'trophy',
    specialFields: ['Teams', 'Divisions', 'Rules', 'Waivers'],
    estimatedTime: '4-6 minutes',
    examples: ['Soccer Tournament', 'Basketball League', 'Tennis Championship']
  }
];

// Form configuration getter
export const getFormConfig = (category: EventCategory): CategoryFormConfig => {
  switch (category) {
    case EventCategory.CONFERENCE:
      return CONFERENCE_FORM;
    case EventCategory.RESTAURANT:
      return RESTAURANT_FORM;
    case EventCategory.WEDDING:
      return WEDDING_FORM;
    case EventCategory.WORKSHOP:
      return WORKSHOP_FORM;
    case EventCategory.SPORTS:
      return SPORTS_FORM;
    default:
      throw new Error(`No form configuration found for category: ${category}`);
  }
};

// Get category info
export const getCategoryInfo = (category: EventCategory): CategoryInfo => {
  const info = CATEGORY_INFO.find(c => c.id === category);
  if (!info) {
    throw new Error(`No category info found for: ${category}`);
  }
  return info;
};

// Get all available categories
export const getAllCategories = (): CategoryInfo[] => {
  return CATEGORY_INFO;
};