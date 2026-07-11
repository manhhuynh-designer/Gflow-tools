import React, { useRef, useImperativeHandle, forwardRef, useMemo, memo, useEffect } from 'react';
import { OrbitControls, PerspectiveCamera, useGLTF, Environment, TransformControls } from '@react-three/drei';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneObject, CameraState, AspectRatio } from '../type';

const DRACO_DECODER_JSDELIVR = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/';

interface Props {
  backgroundUrl: string | null;
  hdriUrl?: string;
  showTexture: boolean;
  focalLength: number;
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<SceneObject>) => void;
  isDrawingMode: boolean;
  drawColor: string;
  isGenerating?: boolean;
  viewMode?: string;
  aspectRatio: AspectRatio;
  transformMode: 'translate' | 'rotate' | 'scale';
}

export interface ViewportHandle {
  capture: () => Promise<string>;
  getCameraState: () => CameraState;
  resetCamera: () => void;
}

const CameraLight = () => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.position.copy(state.camera.position);
      lightRef.current.quaternion.copy(state.camera.quaternion);
    }
  });
  return <directionalLight ref={lightRef} intensity={1.2} />;
};

const ModelInstance = ({ obj, showTexture, onSelect, objectRefs }: { obj: SceneObject; showTexture: boolean; onSelect: () => void; objectRefs: any }) => {
  const { scene } = useGLTF(obj.url!, DRACO_DECODER_JSDELIVR);
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        if (!showTexture) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#888888',
            roughness: 0.6,
            metalness: 0.2,
          });
        }
      }
    });
    return clone;
  }, [scene, showTexture]);

  return (
    <primitive 
      ref={(ref: any) => { if (ref) objectRefs.current[obj.id] = ref; }}
      object={clonedScene} 
      position={obj.position} 
      rotation={obj.rotation} 
      scale={obj.scale}
      onClick={(e: any) => {
        e.stopPropagation();
        onSelect();
      }}
    />
  );
};

const Scene = ({ 
  hdriUrl, 
  showTexture, 
  objects, 
  selectedId, 
  onSelect, 
  onUpdateObject, 
  onCameraMove, 
  isDrawingMode, 
  isGenerating, 
  viewMode, 
  controlsRef,
  transformMode 
}: any) => {
  const objectRefs = useRef<Record<string, any>>({});
  const transformRef = useRef<any>(null);

  // Sync transform controls to orbit controls
  useEffect(() => {
    const transform = transformRef.current;
    if (!transform) return;

    const onDraggingChanged = (event: any) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = !event.value;
      }
      
      // Save transform to state when dragging stops
      if (!event.value && transform.object && selectedId) {
        const target = transform.object;
        onUpdateObject(selectedId, {
          position: [target.position.x, target.position.y, target.position.z],
          rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
          scale: [target.scale.x, target.scale.y, target.scale.z]
        });
      }
    };

    transform.addEventListener('dragging-changed', onDraggingChanged);
    return () => {
      transform.removeEventListener('dragging-changed', onDraggingChanged);
    };
  }, [selectedId, onUpdateObject]);

  return (
    <>
      {hdriUrl ? (
        <Environment files={hdriUrl} />
      ) : (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} />
        </>
      )}
      <CameraLight />
      
      <group onClick={() => onSelect(null)}>
        {objects.map((obj: SceneObject) => {
          if (obj.type === 'Model' && obj.url) {
            return (
              <ModelInstance 
                key={obj.id} 
                obj={obj} 
                showTexture={showTexture} 
                onSelect={() => onSelect(obj.id)}
                objectRefs={objectRefs}
              />
            );
          }
          return (
            <mesh 
              key={obj.id} 
              ref={(ref) => { if (ref) objectRefs.current[obj.id] = ref; }}
              position={obj.position} 
              rotation={obj.rotation} 
              scale={obj.scale}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(obj.id);
              }}
            >
              {obj.type === 'Cube' && <boxGeometry args={[2, 2, 2]} />}
              {obj.type === 'Sphere' && <sphereGeometry args={[1, 32, 32]} />}
              <meshStandardMaterial 
                color={selectedId === obj.id ? "#969696" : "#444444"} 
                roughness={0.6} 
                metalness={0.2}
              />
            </mesh>
          );
        })}
      </group>

      {selectedId && !isDrawingMode && objectRefs.current[selectedId] && (
        <TransformControls 
          ref={transformRef}
          object={objectRefs.current[selectedId]}
          mode={transformMode}
        />
      )}

      <OrbitControls 
        ref={controlsRef} 
        makeDefault 
        enableDamping={true} 
        dampingFactor={0.05}
        onChange={onCameraMove} 
        enabled={!isDrawingMode && !isGenerating && viewMode === '3D'} 
      />
    </>
  );
};

export const ThreeViewport = memo(forwardRef<ViewportHandle, Props>(({ 
  backgroundUrl, 
  hdriUrl, 
  showTexture, 
  focalLength, 
  objects, 
  selectedId,
  onSelect,
  onUpdateObject,
  isDrawingMode, 
  drawColor, 
  isGenerating = false, 
  viewMode = '3D', 
  aspectRatio,
  transformMode
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);

  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const safeFov = useMemo(() => {
    const fovDegrees = 2 * Math.atan(12 / focalLength) * (180 / Math.PI);
    return Math.max(0.1, Math.min(170, fovDegrees));
  }, [focalLength]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current && drawingCanvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          drawingCanvasRef.current.width = clientWidth;
          drawingCanvasRef.current.height = clientHeight;
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [aspectRatio]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || isGenerating || viewMode !== '3D') return;
    isDrawing.current = true;
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (rect) lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !drawingCanvasRef.current) return;
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const currentPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = currentPos;
  };

  useImperativeHandle(ref, () => ({
    capture: async () => {
      const glCanvas = canvasRef.current;
      const drawCanvas = drawingCanvasRef.current;
      
      if (!glCanvas) return '';
      
      const width = glCanvas.width || 1280;
      const height = glCanvas.height || 720;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d', { alpha: false })!;
      
      // Draw background
      if (backgroundUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = backgroundUrl;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 1500);
          });
          
          const imgRatio = img.width / img.height;
          const canvasRatio = width / height;
          let drawW = width, drawH = height, drawX = 0, drawY = 0;
          
          if (imgRatio > canvasRatio) {
            drawW = height * imgRatio;
            drawX = (width - drawW) / 2;
          } else {
            drawH = width / imgRatio;
            drawY = (height - drawH) / 2;
          }
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } catch (e) {
          ctx.fillStyle = '#151515';
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(glCanvas, 0, 0, width, height);

      if (drawCanvas && drawCanvas.width > 0) {
        ctx.drawImage(drawCanvas, 0, 0, width, height);
      }

      return tempCanvas.toDataURL('image/jpeg', 0.9);
    },
    getCameraState: () => {
      if (!cameraRef.current) return { position: [12, 12, 12], rotation: [0, 0, 0], focalLength: 50 };
      const p = cameraRef.current.position;
      const r = cameraRef.current.rotation;
      return { position: [p.x, p.y, p.z], rotation: [r.x, r.y, r.z], focalLength };
    },
    resetCamera: () => {
      if (cameraRef.current) {
        cameraRef.current.position.set(12, 12, 12);
        cameraRef.current.updateProjectionMatrix();
      }
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }));

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#151515]">
      {backgroundUrl && (
        <div className="absolute inset-0 z-0 bg-center bg-cover opacity-50" style={{ backgroundImage: `url(${backgroundUrl})` }} />
      )}
      <div className="absolute inset-0 z-10">
        <Canvas 
          onCreated={({ gl }) => {
            canvasRef.current = gl.domElement;
          }}
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
          shadows
        >
          <PerspectiveCamera makeDefault ref={cameraRef} position={[12, 12, 12]} fov={safeFov} />
          <React.Suspense fallback={null}>
            <Scene 
              hdriUrl={hdriUrl}
              showTexture={showTexture}
              objects={objects} 
              selectedId={selectedId}
              onSelect={onSelect}
              onUpdateObject={onUpdateObject}
              transformMode={transformMode}
              onCameraMove={() => {
                const cvs = drawingCanvasRef.current;
                if (cvs) cvs.getContext('2d')?.clearRect(0,0,cvs.width,cvs.height);
              }} 
              isDrawingMode={isDrawingMode} 
              isGenerating={isGenerating} 
              viewMode={viewMode} 
              controlsRef={controlsRef} 
            />
          </React.Suspense>
        </Canvas>
      </div>
      <canvas
        ref={drawingCanvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={() => isDrawing.current = false}
        onPointerOut={() => isDrawing.current = false}
        className={`absolute inset-0 z-20 touch-none ${isDrawingMode && !isGenerating && viewMode === '3D' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
      />
    </div>
  );
}));
