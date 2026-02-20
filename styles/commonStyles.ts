
import { StyleSheet } from 'react-native';

// Outdoor safety theme colors
export const colors = {
  // Light mode
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#1A2332',
  textSecondary: '#6B7280',
  primary: '#10B981', // Green for safety/go
  secondary: '#3B82F6', // Blue for info
  accent: '#F59E0B', // Amber for warnings
  danger: '#EF4444', // Red for SOS/danger
  success: '#10B981',
  border: '#E5E7EB',
  highlight: '#DBEAFE',
  
  // Dark mode variants
  darkBackground: '#0F172A',
  darkCard: '#1E293B',
  darkText: '#F1F5F9',
  darkTextSecondary: '#94A3B8',
  darkBorder: '#334155',
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
