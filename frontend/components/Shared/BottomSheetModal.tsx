import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { createThemedStyles, useAppTheme } from '../../app/theme';

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightRatio?: number;
  topOffset?: number;
};

const WINDOW_HEIGHT = Dimensions.get('window').height;

const SPRING_IN  = { damping: 28, stiffness: 280, mass: 0.85 } as const;
const TIMING_OUT = { duration: 240, easing: Easing.in(Easing.cubic) } as const;

export default function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.94,
  topOffset = 12,
}: BottomSheetModalProps) {
  const theme = useAppTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  // Keep sheet mounted until exit animation finishes
  const [mounted, setMounted] = useState(visible);

  const translateY      = useSharedValue(WINDOW_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const sheetHeight = useMemo(() => {
    const available = WINDOW_HEIGHT - Math.max(insets.top, 20) - topOffset;
    return Math.max(WINDOW_HEIGHT * 0.72, Math.min(WINDOW_HEIGHT * maxHeightRatio, available));
  }, [insets.top, maxHeightRatio, topOffset]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;

    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
      translateY.value = withSpring(0, SPRING_IN);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(WINDOW_HEIGHT, TIMING_OUT, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, mounted, translateY, backdropOpacity]);

  const animatedSheet    = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const animatedBackdrop = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, animatedBackdrop]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: theme.colors.background,
            },
            animatedSheet,
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.modalBackdrop,
    },
    sheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
      ...theme.shadows.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.border,
      marginTop: 10,
      marginBottom: 6,
    },
    content: {
      flex: 1,
      minHeight: 0,
    },
  }),
);
