export interface CameraState {
  position: [number, number, number];
  rotation: [number, number, number];
  focalLength: number;
}

export type SceneObjectType = 'Sphere' | 'Cube' | 'Model';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  url?: string; // Chỉ dành cho type 'Model'
  name: string;
}

export interface GenHistoryItem {
  id: string;
  prompt: string;
  camera: CameraState;
  generatedImage?: string | null;
  isPending?: boolean;
}