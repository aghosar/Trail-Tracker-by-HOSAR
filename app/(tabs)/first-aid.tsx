
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface FirstAidTopic {
  id: string;
  title: string;
  icon: string;
  steps: string[];
  warnings?: string[];
}

export default function FirstAidScreen() {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const firstAidTopics: FirstAidTopic[] = [
    {
      id: 'bleeding',
      title: 'Severe Bleeding',
      icon: 'healing',
      steps: [
        'Call 911 if bleeding is severe',
        'Apply direct pressure with a clean cloth',
        'Maintain pressure for at least 10 minutes',
        'If blood soaks through, add more cloth on top',
        'Elevate the injured area above the heart if possible',
        'Once bleeding stops, secure with a bandage',
      ],
      warnings: ['Do not remove embedded objects', 'Do not peek at the wound while applying pressure'],
    },
    {
      id: 'fracture',
      title: 'Broken Bones / Fractures',
      icon: 'accessible',
      steps: [
        'Do not move the injured person unless necessary',
        'Immobilize the injured area',
        'Apply ice packs to reduce swelling',
        'Treat for shock if needed',
        'Seek medical attention immediately',
      ],
      warnings: ['Do not try to realign the bone', 'Do not test the bone by moving it'],
    },
    {
      id: 'burn',
      title: 'Burns',
      icon: 'local-fire-department',
      steps: [
        'Remove from heat source immediately',
        'Cool the burn with cool (not cold) running water for 10-20 minutes',
        'Remove jewelry and tight clothing before swelling',
        'Cover with a sterile, non-stick bandage',
        'Take over-the-counter pain reliever if needed',
        'Seek medical attention for severe burns',
      ],
      warnings: ['Do not use ice', 'Do not apply butter or ointments', 'Do not break blisters'],
    },
    {
      id: 'choking',
      title: 'Choking',
      icon: 'warning',
      steps: [
        'Ask "Are you choking?" If they can speak or cough, encourage coughing',
        'If unable to speak or cough, perform Heimlich maneuver:',
        '  - Stand behind the person',
        '  - Make a fist above their navel',
        '  - Grasp fist with other hand',
        '  - Give quick upward thrusts',
        'Repeat until object is dislodged',
        'Call 911 if unsuccessful',
      ],
    },
    {
      id: 'cpr',
      title: 'CPR (Cardiopulmonary Resuscitation)',
      icon: 'favorite',
      steps: [
        'Call 911 immediately',
        'Check for responsiveness and breathing',
        'Place person on firm, flat surface',
        'Position hands in center of chest',
        'Push hard and fast: 100-120 compressions per minute',
        'Push down at least 2 inches',
        'Allow chest to return to normal position between compressions',
        'Continue until help arrives or person starts breathing',
      ],
      warnings: ['Only perform if trained', 'Do not stop compressions unless absolutely necessary'],
    },
    {
      id: 'shock',
      title: 'Shock',
      icon: 'bolt',
      steps: [
        'Call 911',
        'Lay person down and elevate legs about 12 inches',
        'Keep person warm with blanket or coat',
        'Do not give anything to eat or drink',
        'Turn head to side if vomiting',
        'Monitor breathing and pulse',
      ],
      warnings: ['Do not move if head, neck, or back injury suspected'],
    },
    {
      id: 'snakebite',
      title: 'Snake Bite',
      icon: 'pets',
      steps: [
        'Call 911 or get to emergency room immediately',
        'Keep calm and still to slow venom spread',
        'Remove jewelry and tight clothing',
        'Position bitten area below heart level',
        'Clean wound with soap and water',
        'Cover with clean, dry dressing',
        'Mark the edge of swelling with pen and note time',
      ],
      warnings: [
        'Do not apply tourniquet',
        'Do not apply ice',
        'Do not cut the wound',
        'Do not try to suck out venom',
        'Do not give alcohol or caffeine',
      ],
    },
    {
      id: 'heatstroke',
      title: 'Heat Stroke',
      icon: 'wb-sunny',
      steps: [
        'Call 911 immediately - this is life-threatening',
        'Move person to cool, shaded area',
        'Remove excess clothing',
        'Cool person rapidly with cool water or wet cloths',
        'Fan the person',
        'Apply ice packs to armpits, groin, neck, and back',
        'Monitor body temperature',
      ],
      warnings: ['Do not give aspirin or acetaminophen', 'Do not give anything to drink if unconscious'],
    },
    {
      id: 'hypothermia',
      title: 'Hypothermia',
      icon: 'ac-unit',
      steps: [
        'Call 911 if severe',
        'Move person to warm, dry location',
        'Remove wet clothing',
        'Warm center of body first (chest, neck, head, groin)',
        'Use warm, dry blankets or skin-to-skin contact',
        'Give warm, non-alcoholic beverages if conscious',
      ],
      warnings: ['Do not use direct heat', 'Do not massage or rub the person', 'Do not give alcohol'],
    },
    {
      id: 'sprain',
      title: 'Sprains & Strains',
      icon: 'sports',
      steps: [
        'Rest the injured area',
        'Ice for 20 minutes every 2-3 hours',
        'Compress with elastic bandage',
        'Elevate above heart level',
        'Take over-the-counter pain reliever',
        'Seek medical attention if severe pain or unable to bear weight',
      ],
    },
  ];

  const toggleTopic = (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={resolveImageSource(require('@/assets/images/72090bad-4a5e-49d2-8aae-98dae4b6514d.png'))} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>First Aid Guide</Text>
          <Text style={styles.headerSubtitle}>Essential emergency procedures</Text>
        </View>

        <View style={styles.emergencyCard}>
          <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={32} color={colors.danger} />
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>Emergency: 911</Text>
            <Text style={styles.emergencySubtitle}>Call immediately for life-threatening situations</Text>
          </View>
        </View>

        <View style={styles.topicsList}>
          {firstAidTopics.map((topic) => {
            const isExpanded = expandedTopic === topic.id;
            return (
              <View key={topic.id} style={styles.topicCard}>
                <TouchableOpacity
                  style={styles.topicHeader}
                  onPress={() => toggleTopic(topic.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicTitleRow}>
                    <IconSymbol
                      ios_icon_name={topic.icon}
                      android_material_icon_name={topic.icon}
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                    android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.topicContent}>
                    <Text style={styles.stepsTitle}>Steps:</Text>
                    {topic.steps.map((step, index) => (
                      <View key={index} style={styles.stepRow}>
                        <Text style={styles.stepNumber}>{index + 1}.</Text>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}

                    {topic.warnings && topic.warnings.length > 0 && (
                      <View style={styles.warningsSection}>
                        <View style={styles.warningsHeader}>
                          <IconSymbol
                            ios_icon_name="exclamationmark.triangle"
                            android_material_icon_name="warning"
                            size={20}
                            color={colors.danger}
                          />
                          <Text style={styles.warningsTitle}>Important Warnings:</Text>
                        </View>
                        {topic.warnings.map((warning, index) => (
                          <View key={index} style={styles.warningRow}>
                            <Text style={styles.warningBullet}>•</Text>
                            <Text style={styles.warningText}>{warning}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.disclaimer}>
          <IconSymbol ios_icon_name="info.circle" android_material_icon_name="info" size={20} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            This guide is for informational purposes only. Always seek professional medical help in emergencies. 
            Consider taking a certified first aid course for proper training.
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
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
  emergencyCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  topicsList: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  topicContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
    minWidth: 24,
  },
  stepText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  warningsSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  warningRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  warningBullet: {
    fontSize: 15,
    color: '#92400E',
    marginRight: 8,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
    lineHeight: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
