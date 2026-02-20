
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  createdAt?: string;
}

interface ActiveTrip {
  id: string;
  activityType: string;
  startTime: string;
  status: string;
  lastLatitude: string | number;
  lastLongitude: string | number;
  lastLocationUpdate?: string;
  emergencyContact: {
    name: string;
    phoneNumber: string;
  };
}

// Inline feedback modal state type
interface FeedbackModal {
  visible: boolean;
  title: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModal>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
  
  // Form states
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [activityType, setActivityType] = useState('hiking');
  const [clothingDescription, setClothingDescription] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');
  
  // New contact form
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const sosLongPressTimer = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setFeedbackModal({ visible: true, title, message, type });
  };

  useEffect(() => {
    if (!user) return; // Don't initialize until user is authenticated
    console.log('HomeScreen: Initializing for user', user.id);
    const init = async () => {
      await requestLocationPermission();
      await Promise.all([loadEmergencyContacts(), checkActiveTrip()]);
      setInitialLoading(false);
    };
    init();
  }, [user]);

  useEffect(() => {
    if (activeTrip) {
      const startTime = new Date(activeTrip.startTime).getTime();
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [activeTrip]);

  useEffect(() => {
    if (activeTrip && hasLocationPermission) {
      console.log('HomeScreen: Starting location update interval (15 minutes)');
      locationUpdateInterval.current = setInterval(() => {
        updateTripLocation();
      }, 15 * 60 * 1000); // 15 minutes
      
      return () => {
        if (locationUpdateInterval.current) {
          clearInterval(locationUpdateInterval.current);
        }
      };
    }
  }, [activeTrip, hasLocationPermission]);

  const requestLocationPermission = async () => {
    try {
      console.log('HomeScreen: Requesting foreground location permission');
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasLocationPermission(granted);
      
      if (granted) {
        console.log('HomeScreen: Location permission granted, getting current position');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
        console.log('HomeScreen: Current location obtained', location.coords);
      } else {
        console.log('HomeScreen: Location permission denied');
        showFeedback('Permission Required', 'Location permission is required for safety tracking.', 'error');
      }
    } catch (error) {
      console.error('HomeScreen: Error requesting location permission:', error);
    }
  };

  const loadEmergencyContacts = async () => {
    console.log('HomeScreen: Loading emergency contacts from API');
    try {
      const contacts = await authenticatedGet<EmergencyContact[]>('/api/emergency-contacts');
      console.log('HomeScreen: Emergency contacts loaded', contacts);
      setEmergencyContacts(contacts || []);
    } catch (error) {
      console.error('HomeScreen: Error loading emergency contacts:', error);
      // Don't show error on initial load - user may just not have contacts yet
      setEmergencyContacts([]);
    }
  };

  const checkActiveTrip = async () => {
    console.log('HomeScreen: Checking for active trip from API');
    try {
      const trip = await authenticatedGet<ActiveTrip | null>('/api/trips/active');
      console.log('HomeScreen: Active trip result', trip);
      if (trip && trip.id) {
        setActiveTrip(trip);
        // Restore activityType from active trip
        setActivityType(trip.activityType);
      } else {
        setActiveTrip(null);
      }
    } catch (error) {
      console.error('HomeScreen: Error checking active trip:', error);
      setActiveTrip(null);
    }
  };

  const addEmergencyContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      showFeedback('Missing Information', 'Please enter both name and phone number', 'error');
      return;
    }
    
    console.log('HomeScreen: Adding emergency contact', { name: newContactName, phone: newContactPhone });
    setLoading(true);
    
    try {
      const newContact = await authenticatedPost<EmergencyContact>('/api/emergency-contacts', {
        name: newContactName.trim(),
        phoneNumber: newContactPhone.trim(),
      });
      
      console.log('HomeScreen: Emergency contact added successfully', newContact);
      setEmergencyContacts(prev => [...prev, newContact]);
      setNewContactName('');
      setNewContactPhone('');
      setShowContactModal(false);
      showFeedback('Contact Added', `${newContact.name} has been added as an emergency contact.`, 'success');
    } catch (error: any) {
      console.error('HomeScreen: Error adding emergency contact:', error);
      showFeedback('Error', error.message || 'Failed to add emergency contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startTrip = async () => {
    if (!selectedContactId) {
      showFeedback('No Contact Selected', 'Please select an emergency contact', 'error');
      return;
    }
    
    if (!currentLocation) {
      showFeedback('Location Unavailable', 'Unable to get current location. Please try again.', 'error');
      return;
    }
    
    console.log('HomeScreen: Starting trip', { activityType, contactId: selectedContactId });
    setLoading(true);
    
    try {
      const { latitude, longitude } = currentLocation.coords;
      
      const body: any = {
        emergencyContactId: selectedContactId,
        activityType,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      };
      if (clothingDescription.trim()) body.clothingDescription = clothingDescription.trim();
      if (vehicleDescription.trim()) body.vehicleDescription = vehicleDescription.trim();

      const trip = await authenticatedPost<ActiveTrip>('/api/trips/start', body);
      
      console.log('HomeScreen: Trip started successfully', trip);
      setActiveTrip(trip);
      
      // Send initial SMS
      await sendSMS(trip.emergencyContact.phoneNumber, 'start', latitude, longitude);
      
      setShowStartModal(false);
      setClothingDescription('');
      setVehicleDescription('');
    } catch (error: any) {
      console.error('HomeScreen: Error starting trip:', error);
      showFeedback('Error', error.message || 'Failed to start trip', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateTripLocation = async () => {
    if (!activeTrip || !hasLocationPermission) {
      return;
    }
    
    console.log('HomeScreen: Updating trip location');
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      
      const updatedTrip = await authenticatedPut<ActiveTrip>(`/api/trips/${activeTrip.id}/location`, {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });
      
      console.log('HomeScreen: Location updated successfully', { latitude, longitude });
      setActiveTrip(updatedTrip);
      
      // Send location update SMS
      await sendSMS(activeTrip.emergencyContact.phoneNumber, 'update', latitude, longitude);
      
      setCurrentLocation(location);
    } catch (error) {
      console.error('HomeScreen: Error updating trip location:', error);
    }
  };

  const completeTrip = async () => {
    if (!activeTrip) {
      return;
    }
    
    console.log('HomeScreen: Completing trip', activeTrip.id);
    setLoading(true);
    
    try {
      await authenticatedPut(`/api/trips/${activeTrip.id}/complete`, {});
      
      console.log('HomeScreen: Trip completed successfully');
      
      if (currentLocation) {
        const { latitude, longitude } = currentLocation.coords;
        await sendSMS(activeTrip.emergencyContact.phoneNumber, 'complete', latitude, longitude);
      }
      
      setActiveTrip(null);
      setElapsedTime(0);
      showFeedback('Trip Complete', 'Your trip has been completed and your emergency contact has been notified.', 'success');
    } catch (error: any) {
      console.error('HomeScreen: Error completing trip:', error);
      showFeedback('Error', error.message || 'Failed to complete trip', 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerSOS = async () => {
    if (!activeTrip || !currentLocation) {
      return;
    }
    
    console.log('HomeScreen: Triggering SOS');
    setLoading(true);
    
    try {
      const { latitude, longitude } = currentLocation.coords;
      
      const updatedTrip = await authenticatedPut<ActiveTrip>(`/api/trips/${activeTrip.id}/sos`, {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });
      
      console.log('HomeScreen: SOS triggered successfully', updatedTrip);
      setActiveTrip(updatedTrip);
      
      await sendSMS(activeTrip.emergencyContact.phoneNumber, 'sos', latitude, longitude);
      
      setShowSOSModal(false);
      showFeedback('SOS Sent', 'Emergency message has been sent to your contact. Help is on the way!', 'error');
    } catch (error: any) {
      console.error('HomeScreen: Error triggering SOS:', error);
      showFeedback('Error', error.message || 'Failed to send SOS', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendSMS = async (phoneNumber: string, type: 'start' | 'update' | 'complete' | 'sos', lat: number, lon: number) => {
    const isAvailable = await SMS.isAvailableAsync();
    
    if (!isAvailable) {
      console.log('HomeScreen: SMS not available on this device');
      return;
    }
    
    const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    let message = '';
    
    const activityName = activityType.charAt(0).toUpperCase() + activityType.slice(1);
    const clothingInfo = clothingDescription ? `\nClothing: ${clothingDescription}` : '';
    const vehicleInfo = vehicleDescription ? `\nVehicle: ${vehicleDescription}` : '';
    
    if (type === 'start') {
      message = `🚨 SAFETY ALERT: I'm starting a ${activityName} trip.\nLocation: ${mapsUrl}${clothingInfo}${vehicleInfo}\nYou'll receive updates every 15 minutes.`;
    } else if (type === 'update') {
      message = `📍 Location Update: Still on my ${activityName} trip.\nCurrent location: ${mapsUrl}`;
    } else if (type === 'complete') {
      message = `✅ Trip Complete: I've safely finished my ${activityName} trip.\nFinal location: ${mapsUrl}`;
    } else if (type === 'sos') {
      message = `🆘 EMERGENCY SOS: I need help!\nActivity: ${activityName}\nLocation: ${mapsUrl}${clothingInfo}${vehicleInfo}\nPlease call emergency services!`;
    }
    
    console.log('HomeScreen: Sending SMS', { type, phoneNumber });
    
    try {
      await SMS.sendSMSAsync([phoneNumber], message);
    } catch (error) {
      console.error('HomeScreen: Error sending SMS:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const hoursStr = hours.toString();
    const minutesStr = minutes.toString().padStart(2, '0');
    const secsStr = secs.toString().padStart(2, '0');
    
    return `${hoursStr}:${minutesStr}:${secsStr}`;
  };

  const handleSOSLongPressIn = () => {
    console.log('HomeScreen: SOS long press started');
    sosLongPressTimer.current = setTimeout(() => {
      setShowSOSModal(true);
    }, 5000);
  };

  const handleSOSLongPressOut = () => {
    console.log('HomeScreen: SOS long press cancelled');
    if (sosLongPressTimer.current) {
      clearTimeout(sosLongPressTimer.current);
    }
  };

  const activityTypes = [
    { value: 'hiking', label: 'Hiking', icon: 'terrain' },
    { value: 'biking', label: 'Mountain Biking', icon: 'directions-bike' },
    { value: 'horseback', label: 'Horseback Riding', icon: 'pets' },
    { value: 'utv', label: 'UTV/SXS', icon: 'directions-car' },
  ];

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 16 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={resolveImageSource(require('@/assets/images/72090bad-4a5e-49d2-8aae-98dae4b6514d.png'))} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Safety Tracker</Text>
          <Text style={styles.headerSubtitle}>Stay safe on your outdoor adventures</Text>
        </View>

        {!hasLocationPermission && (
          <View style={styles.warningCard}>
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={24} color={colors.accent} />
            <Text style={styles.warningText}>Location permission required</Text>
            <TouchableOpacity style={styles.warningButton} onPress={requestLocationPermission}>
              <Text style={styles.warningButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTrip ? (
          <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active Trip</Text>
              </View>
              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
            </View>

            <View style={styles.activityInfo}>
              <IconSymbol ios_icon_name="figure.hiking" android_material_icon_name="terrain" size={32} color={colors.primary} />
              <View style={styles.activityDetails}>
                <Text style={styles.activityType}>{activityType.charAt(0).toUpperCase() + activityType.slice(1)}</Text>
                <Text style={styles.contactName}>Contact: {activeTrip.emergencyContact.name}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={completeTrip}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Complete Trip</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.sosButton]}
                onPressIn={handleSOSLongPressIn}
                onPressOut={handleSOSLongPressOut}
                disabled={loading}
              >
                <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Hold for SOS</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sosHint}>Hold SOS button for 5 seconds to send emergency alert</Text>
          </View>
        ) : (
          <View style={styles.startCard}>
            <IconSymbol ios_icon_name="location.circle" android_material_icon_name="location-on" size={64} color={colors.primary} style={styles.startIcon} />
            <Text style={styles.startTitle}>Ready to Start?</Text>
            <Text style={styles.startSubtitle}>Begin tracking your outdoor activity</Text>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setShowStartModal(true)}
              disabled={!hasLocationPermission}
            >
              <Text style={styles.startButtonText}>Start Trip</Text>
            </TouchableOpacity>

            {emergencyContacts.length === 0 && (
              <TouchableOpacity
                style={styles.addContactButton}
                onPress={() => setShowContactModal(true)}
              >
                <IconSymbol ios_icon_name="person.badge.plus" android_material_icon_name="person-add" size={20} color={colors.secondary} />
                <Text style={styles.addContactText}>Add Emergency Contact</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {currentLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <Text style={styles.locationCoords}>
              {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Start Trip Modal */}
      <Modal visible={showStartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Trip</Text>

            <Text style={styles.inputLabel}>Activity Type</Text>
            <View style={styles.activityGrid}>
              {activityTypes.map((activity) => {
                const isSelected = activityType === activity.value;
                return (
                  <TouchableOpacity
                    key={activity.value}
                    style={[styles.activityOption, isSelected && styles.activityOptionSelected]}
                    onPress={() => setActivityType(activity.value)}
                  >
                    <IconSymbol
                      ios_icon_name={activity.icon}
                      android_material_icon_name={activity.icon}
                      size={32}
                      color={isSelected ? '#FFFFFF' : colors.primary}
                    />
                    <Text style={[styles.activityOptionText, isSelected && styles.activityOptionTextSelected]}>
                      {activity.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Emergency Contact</Text>
            <View style={styles.contactList}>
              {emergencyContacts.map((contact) => {
                const isSelected = selectedContactId === contact.id;
                return (
                  <TouchableOpacity
                    key={contact.id}
                    style={[styles.contactOption, isSelected && styles.contactOptionSelected]}
                    onPress={() => setSelectedContactId(contact.id)}
                  >
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, isSelected && styles.contactNameSelected]}>{contact.name}</Text>
                      <Text style={[styles.contactPhone, isSelected && styles.contactPhoneSelected]}>{contact.phoneNumber}</Text>
                    </View>
                    {isSelected && (
                      <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.addContactLink}
              onPress={() => {
                setShowStartModal(false);
                setShowContactModal(true);
              }}
            >
              <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={20} color={colors.secondary} />
              <Text style={styles.addContactLinkText}>Add New Contact</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Clothing Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Red jacket, blue jeans"
              value={clothingDescription}
              onChangeText={setClothingDescription}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Vehicle Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., White Toyota 4Runner, plate ABC123"
              value={vehicleDescription}
              onChangeText={setVehicleDescription}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowStartModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={startTrip}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Start</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal visible={showContactModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact name"
              value={newContactName}
              onChangeText={setNewContactName}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+1234567890"
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={addEmergencyContact}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SOS Confirmation Modal */}
      <Modal visible={showSOSModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={64} color={colors.danger} style={styles.sosIcon} />
            <Text style={styles.sosModalTitle}>Send SOS?</Text>
            <Text style={styles.sosModalText}>
              This will send an emergency message to your contact with your current location.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSOSModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sosConfirmButton]}
                onPress={triggerSOS}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Send SOS</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal - replaces Alert.alert for web compatibility */}
      <Modal visible={feedbackModal.visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[
              styles.feedbackIconContainer,
              feedbackModal.type === 'error' && styles.feedbackIconError,
              feedbackModal.type === 'success' && styles.feedbackIconSuccess,
              feedbackModal.type === 'info' && styles.feedbackIconInfo,
            ]}>
              <IconSymbol
                ios_icon_name={feedbackModal.type === 'error' ? 'exclamationmark.circle' : feedbackModal.type === 'success' ? 'checkmark.circle' : 'info.circle'}
                android_material_icon_name={feedbackModal.type === 'error' ? 'error' : feedbackModal.type === 'success' ? 'check-circle' : 'info'}
                size={40}
                color={feedbackModal.type === 'error' ? colors.danger : feedbackModal.type === 'success' ? colors.primary : colors.secondary}
              />
            </View>
            <Text style={styles.feedbackTitle}>{feedbackModal.title}</Text>
            <Text style={styles.feedbackMessage}>{feedbackModal.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonPrimary,
                feedbackModal.type === 'error' && { backgroundColor: colors.danger },
                feedbackModal.type === 'success' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  warningButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  activityDetails: {
    flex: 1,
  },
  activityType: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  sosButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sosHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  startIcon: {
    marginBottom: 16,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  startSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  addContactText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 16,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  activityOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  activityOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  activityOptionTextSelected: {
    color: '#FFFFFF',
  },
  contactList: {
    gap: 8,
  },
  contactOption: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contactPhoneSelected: {
    color: '#E0F2FE',
  },
  contactNameSelected: {
    color: '#FFFFFF',
  },
  addContactLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  addContactLinkText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sosIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  sosModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  sosModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sosConfirmButton: {
    backgroundColor: colors.danger,
  },
  feedbackIconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 50,
  },
  feedbackIconError: {
    backgroundColor: '#FEE2E2',
  },
  feedbackIconSuccess: {
    backgroundColor: '#D1FAE5',
  },
  feedbackIconInfo: {
    backgroundColor: '#DBEAFE',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
});
