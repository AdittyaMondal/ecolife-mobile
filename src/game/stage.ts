import type { ExpoWebGLRenderingContext } from 'expo-gl';
import Renderer from 'expo-three/build/Renderer';
import { Clock, Group, OrthographicCamera, Scene, type WebGLRenderer } from 'three';
import { colors } from '@/lib/theme';

/** One rendered frame. Coordinates are logical pixels, origin at the top-left, Y downward. */
export type StageFrame = {
  time: number;
  delta: number;
  width: number;
  height: number;
};

export type StageUpdate = (frame: StageFrame) => void;

export type Stage = {
  scene: Scene;
  camera: OrthographicCamera;
  /** Gameplay objects. Place sprites in this group. */
  world: Group;
  /** HUD drawn above the world. */
  overlay: Group;
  onUpdate: (update: StageUpdate) => () => void;
  resize: (width: number, height: number) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

const MAX_DELTA = 1 / 20;

/**
 * Orthographic Three.js stage for the future 2D game.
 * The camera maps 1 world unit to 1 logical pixel.
 */
export function createStage(gl: ExpoWebGLRenderingContext): Stage {
  const renderer = new Renderer({
    gl,
    clearColor: colors.background,
  }) as WebGLRenderer;
  const scene = new Scene();
  const world = new Group();
  const overlay = new Group();
  overlay.renderOrder = 1;
  scene.add(world);
  scene.add(overlay);

  const camera = new OrthographicCamera(0, 1, 0, 1, 0.1, 100);
  camera.position.z = 10;

  const size = { width: 1, height: 1 };
  const updates = new Set<StageUpdate>();
  const clock = new Clock();
  let frame = 0;
  let alive = true;
  let paused = false;

  const resize = (width: number, height: number) => {
    const nextWidth = Math.max(1, width);
    const nextHeight = Math.max(1, height);
    size.width = nextWidth;
    size.height = nextHeight;
    const ratio = gl.drawingBufferWidth / nextWidth;
    renderer.setPixelRatio(Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
    renderer.setSize(nextWidth, nextHeight, false);
    camera.left = 0;
    camera.right = nextWidth;
    camera.top = 0;
    camera.bottom = nextHeight;
    camera.updateProjectionMatrix();
  };

  const loop = () => {
    if (!alive || paused) return;
    frame = requestAnimationFrame(loop);
    const delta = Math.min(clock.getDelta(), MAX_DELTA);
    const snapshot: StageFrame = {
      time: clock.elapsedTime,
      delta,
      width: size.width,
      height: size.height,
    };
    for (const update of updates) update(snapshot);
    renderer.render(scene, camera);
    gl.endFrameEXP();
  };

  resize(gl.drawingBufferWidth || 1, gl.drawingBufferHeight || 1);
  loop();

  return {
    scene,
    camera,
    world,
    overlay,
    onUpdate(update) {
      updates.add(update);
      return () => updates.delete(update);
    },
    resize,
    setPaused(next) {
      if (paused === next) return;
      paused = next;
      if (!paused && alive) {
        clock.getDelta();
        loop();
      }
    },
    dispose() {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(frame);
      updates.clear();
      scene.clear();
      renderer.dispose();
    },
  };
}
