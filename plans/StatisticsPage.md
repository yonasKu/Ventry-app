# Statistics Page Development Plan

## Overview
This document outlines a plan to transform the current Account tab into a comprehensive Statistics dashboard in the Ventry app. This page will provide users with meaningful insights about their events and attendees based on data already available in the application's database.

## Current Data Available in Codebase

Based on our analysis of the codebase, we have access to the following data points:

### Event Data
- Event ID, title, date, time
- Location
- Notes
- Expected attendees count
- Created/updated timestamps
- Actual attendee count
- Checked-in attendee count

### Attendee Data
- Attendee ID, name
- Email, phone (optional)
- Check-in status (boolean)
- Check-in timestamp
- Created/updated timestamps

## Key Statistics Features

### 1. Event Overview
- **Total Events**: Simple counter of all events created
- **Total Attendees**: Aggregate count across all events
- **Check-in Rate**: Percentage of attendees who have checked in
- **Active Events**: Count of upcoming events

### 2. Attendance Analytics
- **Event Comparison Chart**: Bar chart comparing registered vs. checked-in attendees for recent events
- **Time-based Trends**: Line chart showing attendance patterns over time (weekly, monthly)
- **Event Distribution**: Breakdown of events by date (this week, this month, past)

### 3. Check-in Efficiency
- **Check-in Rate Display**: Visual representation of check-in percentages
- **Check-in Timeline**: Analyze when attendees typically check in (if timestamp data is used)

### 4. Event Performance Metrics
- **Event Success Rate**: Based on percentage of expected vs. actual attendees
- **Top Events**: Highlighting events with highest attendance or check-in rates

## Implementation Approach

### Phase 1: Basic Structure & Layout
1. Create the Statistics screen with a clean, organized layout
2. Implement period selectors (day, week, month, all time)
3. Design card components for key metrics

### Phase 2: Data Processing
1. Develop utility functions to calculate statistics from existing data:
   - Event counts by time period
   - Attendee aggregation
   - Check-in rate calculations
   - Trend analysis (comparing to previous periods)

### Phase 3: Data Visualization
1. Implement charts using victory-native:
   - VictoryBar for event comparisons
   - VictoryLine/VictoryArea for trends over time
   - VictoryPie for check-in distribution
   - VictoryChart for customized axes and grid lines

### Phase 4: Optimizations
1. Add data caching to improve performance
2. Implement pagination for handling large datasets
3. Add refresh functionality to update statistics

## Technical Considerations

### Required Libraries
- **victory-native**: For rendering beautiful, interactive, and customizable charts and graphs
- **date-fns**: For date manipulation and calculations

### Data Processing
We'll need to implement functions to:
- Filter events by time periods
- Calculate aggregate statistics
- Format data for victory-native chart components

### Performance Considerations
- Memoize calculated values to avoid redundant processing
- Consider pagination or data windowing for users with many events
- Implement efficient filtering methods
- Use VictoryGroup and VictoryStack for optimized grouped chart rendering

## UI/UX Design Elements

### Main Dashboard Layout
```
+---------------------------------------+
|              STATISTICS               |
+---------------------------------------+
| [Day] [Week] [Month] [All Time]       |
+---------------------------------------+
| OVERVIEW                              |
+---------------+---------------+-------+
| Total Events  | Total         | Check-|
|      ##       | Attendees     | in    |
|               |    ####       | Rate  |
|               |               | ##%   |
+---------------+---------------+-------+
|                                       |
|        EVENT ATTENDANCE CHART         |
|                                       |
|   [Bar chart comparing attendance]    |
|                                       |
+---------------------------------------+
|                                       |
|        CHECK-IN DISTRIBUTION          |
|                                       |
|   [Pie chart of check-in status]      |
|                                       |
+---------------------------------------+
```

### Card Component Design
- Clean, minimalist cards with primary statistics
- Clear typography hierarchy
- Visual indicators for trends (up/down arrows)
- Consistent color scheme matching app theme
- Subtle gradient or shadow effects for depth

### Chart Design
- Custom Victory themes to match app's color scheme
- Interactive tooltips for data points
- Animated transitions between data sets
- Responsive sizing for different devices
- Custom legend components

## Victory-Native Specific Features to Leverage

### Interactive Elements
- Implement touch interaction with VictoryVoronoiContainer
- Add tooltips for data point inspection
- Enable pinch-to-zoom for detailed analysis

### Animation
- Use Victory's animation props for engaging transitions
- Animate between different time periods
- Implement sequential rendering of complex charts

### Theming
- Create a custom VictoryTheme that matches app styling
- Ensure consistent typography and colors across charts
- Provide light/dark mode themes that follow app preferences

## Data Calculations

### Check-in Rate
```javascript
const checkInRate = (totalCheckedIn / totalAttendees) * 100;
```

### Event Growth Calculation
```javascript
const growthRate = ((currentPeriodEvents - previousPeriodEvents) / previousPeriodEvents) * 100;
```

### Time Period Filtering
```javascript
// Example of filtering events for current month
const thisMonthEvents = events.filter(event => {
  const eventDate = parseISO(event.date);
  return isThisMonth(eventDate);
});
```

## Integration with Existing Code

We'll leverage the current EventContext which provides:
- events array with all event data
- loading and error states
- refreshEvents function for data updates

The Statistics page will use these existing methods to access data without duplicating logic.

## Future Enhancement Possibilities

### Phase 5: Advanced Analytics
- Predictive attendance based on historical data
- Day-of-week and time-of-day analysis for optimal scheduling
- Attendee retention metrics (recurring attendees)
- Multi-axis charts for complex data relationships

### Phase 6: Export Capabilities
- Export statistics as PDF reports
- Share event performance via messaging apps
- Generate performance summaries
- Export charts as images for sharing

## Success Metrics
How we'll measure the success of the Statistics page:
- User engagement with the page (time spent viewing)
- User feedback on usefulness of provided insights
- Impact on event planning decisions (via user interviews)

## Timeline Estimate
- Phase 1 (Basic Structure): 1-2 days
- Phase 2 (Data Processing): 2-3 days
- Phase 3 (Data Visualization): 2-3 days
- Phase 4 (Optimizations): 1-2 days
- Testing and refinement: 2-3 days

Total estimated development time: 8-13 days 