import { GLView } from 'expo-gl';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { createStage, type Stage } from './stage';

/** Mounts the shared 2D stage. Touches pass through until the game is built on top of it. */
export function GameStageView({ style }: { style?: StyleProp<ViewStyle> }) {
  const focused = useIsFocused();
  const stageRef = useRef<Stage | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const focusedRef = useRef(focused);
  focusedRef.current = focused;

  useEffect(() => {
    stageRef.current?.setPaused(!focused);
  }, [focused]);

  useEffect(
    () => () => {
      stageRef.current?.dispose();
      stageRef.current = null;
    },
    [],
  );

  return (
    <GLView
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        sizeRef.current = { width, height };
        if (width > 0 && height > 0) stageRef.current?.resize(width, height);
      }}
      onContextCreate={(gl) => {
        stageRef.current?.dispose();
        const stage = createStage(gl);
        stageRef.current = stage;
        const { width, height } = sizeRef.current;
        if (width > 0 && height > 0) stage.resize(width, height);
        stage.setPaused(!focusedRef.current);
      }}
    />
  );
}
