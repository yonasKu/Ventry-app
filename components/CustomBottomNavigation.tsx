import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  Platform,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  House,
  CalendarBlank,
  CloudArrowDown,
  ChartPie,
} from 'phosphor-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface TabItem {
  label: string;
  icon: (color: string, size: number) => JSX.Element;
  path: string;
}

const NAV_BAR_HEIGHT = 65;
const ACTIVE_ICON_CONTAINER_SIZE = 50; // The blue circle
const ACTIVE_ICON_FLOAT_AMOUNT = 20; // How much the center of the icon is above the bar's top edge
const ICON_SIZE_INACTIVE = 22;
const ICON_SIZE_ACTIVE = 26;

import { useTheme } from '../context/ThemeContext';

export default function CustomBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  
  // Use theme colors for active and inactive states
  const ACTIVE_TAB_COLOR = theme.colors.primary;
  const INACTIVE_TAB_COLOR = theme.colors.textTertiary;
  const NAV_BACKGROUND_COLOR = theme.colors.backgroundSecondary;

  const tabs: TabItem[] = [
    {
      label: 'Events',
      icon: (color, size) => <CalendarBlank size={size} color={color} weight={pathname === '/' ? 'fill' : 'regular'} />,
      path: '/',
    },
    {
      label: 'Backup',
      icon: (color, size) => <CloudArrowDown size={size} color={color} weight={pathname.startsWith('/backup') ? 'fill' : 'regular'} />,
      path: '/backup',
    },
    {
      label: 'Stats',
      icon: (color, size) => <ChartPie size={size} color={color} weight={pathname.startsWith('/stats') ? 'fill' : 'regular'} />,
      path: '/stats',
    },
  ];

  const tabWidth = width / tabs.length;
  const activeIndex = React.useMemo(() => 
    tabs.findIndex(tab => tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path)),
    [pathname, tabs]
  );

  const activeIconX = useSharedValue(0);
  const activeLabelY = useSharedValue(0);
  const activeLabelOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (activeIndex !== -1) {
      const targetX = activeIndex * tabWidth + (tabWidth - ACTIVE_ICON_CONTAINER_SIZE) / 2;
      activeIconX.value = withTiming(targetX, {
        duration: 350,
        easing: Easing.bezier(0.33, 1, 0.68, 1), // Smoother easing
      });
    } else {
        // Hide active icon if no tab is active (e.g. on a screen not in tabs)
        activeIconX.value = withTiming(-ACTIVE_ICON_CONTAINER_SIZE - 50, { duration: 350 });
    }
  }, [activeIndex, tabWidth]);

  const activeIconContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: activeIconX.value }],
    };
  });

  return (
    <View style={[styles.outerContainer, { backgroundColor: NAV_BACKGROUND_COLOR }]}>
      <Animated.View
        style={[
          styles.activeIconContainer,
          activeIconContainerAnimatedStyle,
        ]}
      >
        <View style={[styles.activeIconCircle, { backgroundColor: ACTIVE_TAB_COLOR }]}>
          {activeIndex !== -1 && tabs[activeIndex].icon('white', ICON_SIZE_ACTIVE)}
        </View>
      </Animated.View>

      <View style={[styles.navBar, { backgroundColor: theme.colors.backgroundPrimary }]}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;

          const tabLabelAnimatedStyle = useAnimatedStyle(() => {
            return {
              transform: [
                { 
                  translateY: isActive 
                    ? withTiming(8, { duration: 200, easing: Easing.ease }) 
                    : withTiming(0, { duration: 200, easing: Easing.ease })
                }
              ],
              opacity: isActive 
                ? withTiming(1, { duration: 200 }) 
                : withTiming(1, { duration: 200 }), // Keep labels always somewhat visible
              color: isActive ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR,
            };
          });

          const tabIconAnimatedStyle = useAnimatedStyle(() => {
            return {
              opacity: isActive 
                ? withTiming(0, { duration: 150 }) // Hide inactive icon quickly
                : withTiming(1, { duration: 200 }), 
            };
          });

          return (
            <TouchableOpacity
              key={tab.path}
              style={styles.tabItem}
              onPress={() => router.push(tab.path as any)}
              activeOpacity={0.8}
            >
              <Animated.View style={[styles.tabIconView, tabIconAnimatedStyle]}>
                {tab.icon(INACTIVE_TAB_COLOR, ICON_SIZE_INACTIVE)}
              </Animated.View>
              <Animated.Text style={[styles.tabLabel, tabLabelAnimatedStyle]}>
                {tab.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: NAV_BAR_HEIGHT + ACTIVE_ICON_FLOAT_AMOUNT, // Enough space for bar and icon float
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // SafeArea for iOS bottom notch
  },
  navBar: {
    flexDirection: 'row',
    height: NAV_BAR_HEIGHT,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 5, // Small padding for tab items
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  activeIconContainer: {
    position: 'absolute',
    top: 0, // Will sit at the very top of outerContainer
    width: ACTIVE_ICON_CONTAINER_SIZE,
    height: ACTIVE_ICON_CONTAINER_SIZE,
    zIndex: 1, // Above the navBar
  },
  activeIconCircle: {
    width: ACTIVE_ICON_CONTAINER_SIZE,
    height: ACTIVE_ICON_CONTAINER_SIZE,
    borderRadius: ACTIVE_ICON_CONTAINER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'white',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5, // Space for icon
  },
  tabIconView: {
    width: ICON_SIZE_INACTIVE + 4, // ensure consistent space
    height: ICON_SIZE_INACTIVE + 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});
