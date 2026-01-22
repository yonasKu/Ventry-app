import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomHeaderProps {
  children?: React.ReactNode;
}

export default function CustomHeader({ children }: CustomHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
      <Image 
        source={require('../assets/images/icon.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  logo: {
    width: 100,
    height: 40,
  },
}); 