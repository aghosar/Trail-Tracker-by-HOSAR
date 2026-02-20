
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Linking,
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
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
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
  
  const sosLongPressTimer = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setFeedbackModal({ visible: true, title, message, type });
  };

  useEffect(() => {
    if (!user) return;
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
    
    if (!clothingDescription.trim()) {
      showFeedback('Missing Information', 'Clothing description is required', 'error');
      return;
    }
    
    if (!vehicleDescription.trim()) {
      showFeedback('Missing Information', 'Vehicle description is required', 'error');
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
        clothingDescription: clothingDescription.trim(),
        vehicleDescription: vehicleDescription.trim(),
      };

      const trip = await authenticatedPost<ActiveTrip>('/api/trips/start', body);
      
      console.log('HomeScreen: Trip started successfully', trip);
      setActiveTrip(trip);
      
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
    try {
      const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
      let message = '';
      
      const activityName = activityType.charAt(0).toUpperCase() + activityType.slice(1);
      const clothingInfo = clothingDescription ? `\nClothing: ${clothingDescription}` : '';
      const vehicleInfo = vehicleDescription ? `\nVehicle: ${vehicleDescription}` : '';
      
      if (type === 'start') {
        message = `🚨 SAFETY ALERT: I'm starting a ${activityName} trip.\nLocation: ${mapsUrl}${clothingInfo}${vehicleInfo}`;
      } else if (type === 'update') {
        message = `📍 Location Update: Still on my ${activityName} trip.\nCurrent location: ${mapsUrl}`;
      } else if (type === 'complete') {
        message = `✅ Trip Complete: I've safely finished my ${activityName} trip.\nFinal location: ${mapsUrl}`;
      } else if (type === 'sos') {
        message = `🆘 EMERGENCY SOS: I need help!\nActivity: ${activityName}\nLocation: ${mapsUrl}${clothingInfo}${vehicleInfo}\nPlease call emergency services!`;
      }
      
      console.log('HomeScreen: Opening SMS app', { type, phoneNumber, messageLength: message.length });
      
      const smsUrl = Platform.select({
        ios: `sms:${phoneNumber}&body=${encodeURIComponent(message)}`,
        android: `sms:${phoneNumber}?body=${encodeURIComponent(message)}`,
        default: `sms:${phoneNumber}?body=${encodeURIComponent(message)}`,
      });
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
        console.log('HomeScreen: SMS app opened successfully');
      } else {
        console.log('HomeScreen: Cannot open SMS URL');
        showFeedback(
          'SMS Unavailable',
          'Unable to open SMS app. Please send the message manually.',
          'error'
        );
      }
    } catch (error) {
      console.error('HomeScreen: Error opening SMS:', error);
      showFeedback(
        'SMS Error',
        'Failed to open SMS app. Your trip is still being tracked.',
        'error'
      );
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

  const handleDonatePress = () => {
    console.log('HomeScreen: Opening PayPal donation email');
    const email = 'a.gillis@hosar.org';
    const subject = 'Donation to HOSAR';
    const body = 'I would like to make a donation to HOSAR.';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch((error) => {
      console.error('HomeScreen: Error opening email client:', error);
      showFeedback('Error', 'Unable to open email client', 'error');
    });
  };

  const activityTypes = [
    { value: 'hiking', label: 'Hiking' },
    { value: 'biking', label: 'Mountain Biking' },
    { value: 'horseback', label: 'Horseback Riding' },
    { value: 'utv', label: 'UTV/SXS' },
  ];

  const selectedActivityLabel = activityTypes.find(a => a.value === activityType)?.label || 'Select Activity';

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
      <View style={styles.content}>
        <View style={styles.header}>
          <Image 
            source={resolveImageSource(require('@/assets/images/72090bad-4a5e-49d2-8aae-98dae4b6514d.png'))} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {!hasLocationPermission && (
          <View style={styles.warningCard}>
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={20} color={colors.accent} />
            <Text style={styles.warningText}>Location required</Text>
            <TouchableOpacity style={styles.warningButton} onPress={requestLocationPermission}>
              <Text style={styles.warningButtonText}>Grant</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTrip ? (
          <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
            </View>

            <Text style={styles.activityType}>{activityType.charAt(0).toUpperCase() + activityType.slice(1)}</Text>
            <Text style={styles.contactName}>{activeTrip.emergencyContact.name}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={completeTrip}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Complete</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.sosButton]}
                onPressIn={handleSOSLongPressIn}
                onPressOut={handleSOSLongPressOut}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>Hold SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.startCard}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setShowStartModal(true)}
              disabled={!hasLocationPermission}
            >
              <Text style={styles.startButtonText}>Start Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.donateButton}
              onPress={handleDonatePress}
            >
              <Text style={styles.donateButtonText}>Donate to HOSAR</Text>
            </TouchableOpacity>

            {emergencyContacts.length === 0 && (
              <TouchableOpacity
                style={styles.addContactButton}
                onPress={() => setShowContactModal(true)}
              >
                <Text style={styles.addContactText}>Add Emergency Contact</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Start Trip Modal */}
      <Modal visible={showStartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Trip</Text>

            <Text style={styles.inputLabel}>Activity Type *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowActivityDropdown(!showActivityDropdown)}
            >
              <Text style={styles.dropdownButtonText}>{selectedActivityLabel}</Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            {showActivityDropdown && (
              <View style={styles.dropdownList}>
                {activityTypes.map((activity) => (
                  <TouchableOpacity
                    key={activity.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setActivityType(activity.value);
                      setShowActivityDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{activity.label}</Text>
                    {activityType === activity.value && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.inputLabel}>Emergency Contact *</Text>
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
                      <Text style={[styles.contactNameText, isSelected && styles.contactNameSelected]}>{contact.name}</Text>
                      <Text style={[styles.contactPhone, isSelected && styles.contactPhoneSelected]}>{contact.phoneNumber}</Text>
                    </View>
                    {isSelected && (
                      <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={20} color="#FFFFFF" />
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
              <Text style={styles.addContactLinkText}>+ Add New Contact</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Clothing Description *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Red jacket, blue jeans"
              value={clothingDescription}
              onChangeText={setClothingDescription}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Vehicle Description *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., White Toyota 4Runner, ABC123"
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
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
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={48} color={colors.danger} style={styles.sosIcon} />
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Send SOS</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
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
                size={32}
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
  content: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 280,
    height: 280,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  warningButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  activeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  activityType: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  sosButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  startCard: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  donateButton: {
    backgroundColor: '#0070BA',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  addContactButton: {
    paddingVertical: 8,
  },
  addContactText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '500',
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
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownButton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 15,
    color: colors.text,
  },
  dropdownList: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    marginBottom: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
  },
  contactList: {
    gap: 6,
  },
  contactOption: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
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
  contactNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  contactPhoneSelected: {
    color: '#E0F2FE',
  },
  contactNameSelected: {
    color: '#FFFFFF',
  },
  addContactLink: {
    paddingVertical: 8,
    marginTop: 4,
  },
  addContactLinkText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
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
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sosIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  sosModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  sosModalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sosConfirmButton: {
    backgroundColor: colors.danger,
  },
  feedbackIconContainer: {
    alignSelf: 'center',
    marginBottom: 12,
    padding: 10,
    borderRadius: 40,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  feedbackMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
});
