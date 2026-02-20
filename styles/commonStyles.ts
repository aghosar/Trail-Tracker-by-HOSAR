
import { StyleSheet } from 'react-native';

// Outdoor safety theme colors
export const colors = {
  // Dark theme (black background)
  background: '#000000',
  card: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  primary: '#10B981', // Green for safety/go
  secondary: '#3B82F6', // Blue for info
  accent: '#F59E0B', // Amber for warnings
  danger: '#EF4444', // Red for SOS/danger
  success: '#10B981',
  border: '#333333',
  highlight: '#1E3A5F',
  
  // Legacy light mode variants (kept for compatibility)
  darkBackground: '#000000',
  darkCard: '#1A1A1A',
  darkText: '#FFFFFF',
  darkTextSecondary: '#A0A0A0',
  darkBorder: '#333333',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
