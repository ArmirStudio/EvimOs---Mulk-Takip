import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  interpolate,
  runOnJS,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { createThemedStyles, useAppTheme } from '../../app/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 40;
const BUTTON_WIDTH = 80;
const INNER_PADDING = 10;
const MAX_TRANSLATE = (SLIDER_WIDTH / 2) - INNER_PADDING - (BUTTON_WIDTH / 2);
const THRESHOLD = SLIDER_WIDTH * 0.35;
const HINT_DISTANCE = 22;

interface ActionSliderProps {
  onApprove: () => void;
  onReject: () => void;
  approveText?: string;
  rejectText?: string;
  disabled?: boolean;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    width: '100%',
  },
  container: {
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    width: BUTTON_WIDTH,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.copper,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    flexDirection: 'row',
    gap: 0,
    ...theme.shadows.md,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 100,
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    fontSize: 13,
  },
  rejectText: {
    color: theme.colors.error,
  },
  approveText: {
    color: theme.colors.success,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  hintText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
}));

export const ActionSlider: React.FC<ActionSliderProps> = ({
  onApprove,
  onReject,
  approveText = 'Onayla',
  rejectText = 'Reddet',
  disabled = false,
}) => {
  const theme = useAppTheme();
  const styles = useStyles();
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const [triggered, setTriggered] = useState(false);

  // Hint animation on mount
  useEffect(() => {
    if (disabled || triggered) return;
    const runHint = () => {
      translateX.value = withSpring(HINT_DISTANCE, { damping: 12 }, () => {
        translateX.value = withSpring(0, { damping: 14 }, () => {
          translateX.value = withDelay(
            300,
            withSpring(-HINT_DISTANCE, { damping: 12 }, () => {
              translateX.value = withSpring(0, { damping: 14 });
            })
          );
        });
      });
    };
    // Small delay so screen transition completes first
    const t = setTimeout(runHint, 500);
    return () => clearTimeout(t);
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      if (disabled || triggered) return;
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd(() => {
      if (disabled || triggered) return;

      if (translateX.value > THRESHOLD) {
        translateX.value = withSpring(MAX_TRANSLATE);
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(setTriggered)(true);
        runOnJS(onApprove)();
      } else if (translateX.value < -THRESHOLD) {
        translateX.value = withSpring(-MAX_TRANSLATE);
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
        runOnJS(setTriggered)(true);
        runOnJS(onReject)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedLeftTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-THRESHOLD, 0], [1, 0.3], Extrapolate.CLAMP);
    return { opacity };
  });

  const animatedRightTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, THRESHOLD], [0.3, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  return (
    <View style={styles.outerContainer}>
      <Animated.View style={[styles.container, disabled && styles.disabled]}>
        <Animated.View style={[styles.textContainer, animatedLeftTextStyle]}>
          <MaterialIcons name="close" size={18} color={theme.colors.error} />
          <Text style={[styles.text, styles.rejectText]}>{rejectText}</Text>
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.button, animatedButtonStyle]}>
            <MaterialIcons name="chevron-left" size={22} color="#FFFFFF" />
            <MaterialIcons name="chevron-right" size={22} color="#FFFFFF" />
          </Animated.View>
        </GestureDetector>

        <Animated.View style={[styles.textContainer, animatedRightTextStyle]}>
          <Text style={[styles.text, styles.approveText]}>{approveText}</Text>
          <MaterialIcons name="check" size={18} color={theme.colors.success} />
        </Animated.View>
      </Animated.View>

      {!triggered && (
        <View style={styles.hintRow}>
          <Text style={styles.hintText}>← Reddet için kaydır</Text>
          <Text style={styles.hintText}>Onaylamak için kaydır →</Text>
        </View>
      )}
    </View>
  );
};
