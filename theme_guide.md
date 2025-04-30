# Ventry — Theme & Branding Guide

## 1. Brand Identity

### Core Concept
Ventry provides an ultra-simple, efficient, and reliable offline solution for event check-ins. The visual identity should reflect professionalism, speed, clarity, and trustworthiness.

### Primary Brand Colors
- **Primary Teal**: #0D9488 (A professional, calming, yet modern teal suggesting efficiency and success)
  - RGB: 13, 148, 136
  - HSL: 175°, 83%, 35%
- **Accent Amber**: #F59E0B (A warm, energetic accent for calls-to-action, highlights, and scanning focus)
  - RGB: 245, 158, 11
  - HSL: 38°, 92%, 50%

### Supporting Brand Colors
- **Success Green**: #10B981 (For successful check-ins, confirmations)
- **Warning/Error Red**: #EF4444 (For issues, failed scans, alerts)
- **Neutral Dark**: #1F2937 (Primary text in light mode, surfaces in dark mode)
- **Neutral Medium**: #6B7280 (Secondary text)
- **Neutral Light**: #E5E7EB (Borders, dividers in light mode)
- **Neutral Extra Light**: #F9FAFB (Background surfaces in light mode)
- **Neutral White**: #FFFFFF (Primary background in light mode, text in dark mode)
- **Neutral Black**: #111827 (Primary background in dark mode)

### Brand Personality
- **Efficient & Fast**: Streamlined, quick interactions.
- **Reliable & Trustworthy**: Stable, clear, dependable (especially offline).
- **Organized & Clear**: Easy to read lists, intuitive navigation.
- **Modern & Professional**: Clean aesthetics reflecting a capable tool.
- **Approachable**: Simple enough for non-technical users.

### Logo Design (Conceptual)
- Clean, modern logotype "Ventry".
- Consider incorporating a subtle checkmark, QR code element, or stylized "V".
- Iconography should be simple, recognizable, and work well at small sizes (e.g., app icon).
- Use Primary Teal as the main color, potentially with Accent Amber as a small highlight.

## 2. Theme System

The app utilizes a dynamic theming system supporting both light and dark modes, managed via a ThemeContext (or similar state management).
- Defaults to system preference.
- Allows manual user override via settings.
- Ensures consistent color and style application across all screens and components.

## 3. Light Theme Color Palette

### Background Colors
- **BackgroundPrimary**: #FFFFFF (White) - Main screen background
- **BackgroundSecondary**: #F9FAFB (Neutral Extra Light) - Subtle surfaces, cards
- **Surface**: #FFFFFF (White) - Card backgrounds, dialogs

### Text Colors
- **TextPrimary**: #1F2937 (Neutral Dark) - Headings, important text
- **TextSecondary**: #6B7280 (Neutral Medium) - Sub-headings, descriptions, less important info
- **TextTertiary**: #9CA3AF (Lighter Medium Gray) - Hints, disabled text, captions

### Accent Colors
- **Primary**: #0D9488 (Primary Teal) - Buttons, active states, interactive elements
- **Accent**: #F59E0B (Accent Amber) - Key calls-to-action (e.g., Scan button), highlights
- **Success**: #10B981 (Success Green) - Confirmation messages, check-in success indicators
- **Error**: #EF4444 (Warning/Error Red) - Error messages, check-in failure indicators
- **Border**: #E5E7EB (Neutral Light) - Card borders, dividers
- **Divider**: #E5E7EB (Neutral Light) - List separators

## 4. Dark Theme Color Palette

### Background Colors
- **BackgroundPrimary**: #111827 (Neutral Black) - Main screen background
- **BackgroundSecondary**: #1F2937 (Neutral Dark) - Subtle surfaces, cards
- **Surface**: #1F2937 (Neutral Dark) - Card backgrounds, dialogs

### Text Colors
- **TextPrimary**: #F9FAFB (Neutral Extra Light / Near White) - Headings, important text
- **TextSecondary**: #9CA3AF (Lighter Medium Gray) - Sub-headings, descriptions
- **TextTertiary**: #6B7280 (Neutral Medium) - Hints, disabled text, captions

### Accent Colors
- **Primary**: #0D9488 (Primary Teal) - Buttons, active states (Ensure sufficient contrast on dark bg)
- **Accent**: #F59E0B (Accent Amber) - Key calls-to-action, highlights
- **Success**: #10B981 (Success Green) - Confirmation messages, success indicators
- **Error**: #EF4444 (Warning/Error Red) - Error messages, failure indicators
- **Border**: #374151 (Dark Gray) - Card borders, dividers
- **Divider**: #374151 (Dark Gray) - List separators

## 5. Typography

### Font Families
- Prioritize System Fonts (San Francisco for iOS, Roboto for Android) for native feel and performance.
- Fallback: Standard sans-serif fonts.
- Emphasis on readability and clarity, especially for attendee names in lists.

### Font Sizes
- **Display**: 28px (Event Titles)
- **Heading 1**: 22px (Screen Titles)
- **Heading 2**: 18px (Section Headers)
- **Body Large**: 16px (Primary list text, e.g., Attendee Names)
- **Body**: 14px (Secondary list text, descriptions, button text)
- **Caption**: 12px (Helper text, timestamps, metadata)

### Font Weights
- **Regular**: 400 (Body text)
- **Medium**: 500 (Sub-headings, emphasized text)
- **Semi Bold**: 600 (Button text, list item primary text)
- **Bold**: 700 (Headings)

## 6. UI Component Styling

### Cards
- Slightly rounded corners (e.g., 8px-12px radius).
- Subtle shadow in light mode, potentially a border or slightly lighter background in dark mode.
- Consistent padding (e.g., 16px). Used for event summaries, attendee details.

### Buttons
- **Primary Button**: Solid fill (Primary Teal), white/light text. Used for main actions (e.g., "Save", "Import").
- **Accent Button**: Solid fill (Accent Amber), white/light text. Used for primary action on screen (e.g., "Scan QR Code", "Check-In").
- **Secondary Button**: Outlined (Primary Teal border and text), transparent/surface background.
- **Text Button**: Simple text (Primary Teal) for less prominent actions.
- Ensure clear touch targets (min 48x48dp/pt).

### Navigation
- Typically Bottom Tab Navigation for main sections (Events, Scan, Settings).
- Active tab uses Primary Teal for icon/label.
- Stack Navigation for drilling down into events/attendees. Clear back buttons.

### Lists (Attendee Lists)
- **High Readability**: Clear distinction between names and secondary info (e.g., status, email). Use Body Large / Semi Bold for names.
- **Check-in Status**: Use icons (Success Green checkmark for checked-in, subtle indicator for pending) and potentially a subtle background highlight.
- **Performance**: Optimize for potentially long lists.
- Consistent item height and padding. Subtle Divider between items.
- Touch feedback on row press.

### Inputs & Search
- Clean, clear input fields with sufficient padding.
- Focus state highlighted with Primary Teal.
- Error state highlighted with Error Red.
- Search Bar: Prominently displayed on attendee list screens. Fast, responsive filtering.

### Check-in Feedback
- **Visual**: Clear visual confirmation (e.g., brief Success Green flash/overlay, checkmark animation) or failure (Error Red flash/overlay, cross icon).
- **Auditory (Optional)**: Subtle positive/negative sounds for scan results.
- **Haptic (Optional)**: Brief vibration feedback.

## 7. Icons

### Icon System
- Use **Phosphor Icons** for a modern, consistent, and professional icon set.
- Phosphor offers a cohesive design language with over 6,000 icons in 6 weights.
- Standard size: 24dp/pt for primary icons, 20dp/pt for secondary/contextual icons.
- Use the "Regular" weight for most UI elements, "Bold" for emphasis, and "Light" for subtle indicators.
- Interactive icons use Primary Teal (#0D9488) or text color depending on context.
- Decorative/inactive icons use TextTertiary or TextSecondary colors.

### Installation
```bash
npm install phosphor-react-native
```

### Key Icons (with Phosphor Icons references)

#### Navigation & Core UI
- **Home/Dashboard**: `<House />`
- **Events/Calendar**: `<CalendarBlank />` 
- **Backup/Storage**: `<CloudArrowDown />` or `<Database />`
- **Account/Profile**: `<User />` or `<IdentificationCard />`
- **Settings**: `<Gear />` or `<Sliders />`
- **Back**: `<CaretLeft />` or `<ArrowLeft />`

#### Event Management
- **Add/Create**: `<Plus />` or `<PlusCircle />`
- **Edit**: `<PencilSimple />` or `<NotePencil />`
- **Delete**: `<Trash />` or `<TrashSimple />`
- **List View**: `<Rows />` or `<ListBullets />`
- **Calendar View**: `<CalendarBlank />` or `<Calendar />`

#### Check-in Functionality
- **QR Code Scan**: `<QrCode />` or `<Scan />`
- **Search**: `<MagnifyingGlass />` or `<MagnifyingGlassPlus />`
- **Check-in Success**: `<CheckCircle weight="fill" color="#10B981" />`
- **Check-in Pending**: `<Circle weight="light" color="#6B7280" />`
- **Check-in Error**: `<XCircle weight="fill" color="#EF4444" />`

#### Data Management
- **Import/Upload**: `<UploadSimple />` or `<ArrowSquareUp />`
- **Export/Download**: `<DownloadSimple />` or `<ArrowSquareDown />`
- **Filter**: `<Funnel />` or `<SlidersHorizontal />`
- **Sort**: `<SortAscending />` or `<SortDescending />`
- **Info/Details**: `<Info />` or `<CircleWavyQuestion />`

### Implementation Example
```tsx
import { CheckCircle, House, QrCode } from 'phosphor-react-native';

// In your component
return (
  <View style={styles.container}>
    <CheckCircle
      weight="fill"
      size={24}
      color={colors.success}
      style={styles.icon}
    />
    <Text style={styles.text}>Successfully checked in</Text>
  </View>
);
```

### Icon Weights
Phosphor Icons come in 6 weights, offering flexibility for different UI contexts:
- **Thin**: Very light, for subtle decorative elements
- **Light**: For secondary UI elements
- **Regular**: Default weight, for most UI elements
- **Bold**: For emphasis and important elements
- **Fill**: Solid versions for active states and indicators
- **Duotone**: For special emphasis with two-tone styling

## 8. Animations & Transitions
- Keep animations subtle and purposeful. Focus on smooth screen transitions (e.g., slide, fade ~250-300ms).
- Use micro-animations for feedback (button press, toggle switch).
- Check-in confirmation/error animations should be quick and clear, not obstructive.
- Loading indicators should be clean (e.g., spinner using Primary Teal).

## 9. Accessibility (WCAG 2.1 AA+)
- **Color Contrast**: Ensure all text/background and interactive element/background combinations meet minimum contrast ratios (4.5:1 for normal text, 3:1 for large text/UI elements). Use contrast checking tools.
- **Touch Targets**: Minimum 48x48dp/pt touch targets for all interactive elements.
- **Dynamic Type**: Support system font size settings where feasible.
- **Screen Reader Support**: Provide appropriate labels and hints for interactive elements and icons.
- **Dark Mode**: Ensure true dark mode (not just inverted) with sufficient contrast and reduced glare.

## 10. Implementation Guidelines

### Theme Provider
- Utilize a central ThemeProvider and useTheme hook (or equivalent).
- Theme object should provide access to all defined colors (colors.primary, colors.accent, colors.textPrimary, colors.backgroundPrimary, etc.), typography styles, spacing units, and the current mode (isDarkMode: boolean).

### Styling
- Always reference theme variables instead of hardcoding colors, fonts, or spacing.
- Use platform-adaptive styling where necessary (e.g., slight variations for iOS/Android).

### Example (React Native conceptual):
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from './themeContext'; // Your theme context hook

const AttendeeListItem = ({ name, status }) => {
  const { colors, typography, spacing } = useTheme();

  const getStatusStyle = () => {
    if (status === 'checked-in') {
      return { color: colors.success };
    }
    // Add other statuses if needed
    return { color: colors.textSecondary };
  };

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.surface }]}>
      <View>
        <Text style={[typography.bodyLarge, { color: colors.textPrimary, fontWeight: '600' }]}>
          {name}
        </Text>
        <Text style={[typography.body, getStatusStyle()]}>
          {status}
        </Text>
      </View>
      {/* Optionally add a checkmark icon based on status */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16, // Use theme spacing: spacing.medium etc.
    borderBottomWidth: 1,
    // Border color set dynamically below or use theme color directly
  },
  // ... other styles
});

// In component rendering/styling logic:
// containerStyle.borderBottomColor = colors.divider;
```

### Status Bar
- Dynamically adjust the status bar style (light-content/dark-content) based on the active theme to ensure visibility.
