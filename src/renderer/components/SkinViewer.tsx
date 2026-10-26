import React, { useEffect, useRef } from 'react';
import { SkinViewer as Viewer } from 'skinview3d';

interface SkinViewerProps {
  skinUrl: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

export default function SkinViewer({ skinUrl, width = 200, height = 400, autoRotate = true }: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (viewerRef.current) viewerRef.current.dispose();

    const viewer = new Viewer({
      canvas: canvasRef.current,
      width,
      height,
      skin: skinUrl,
    });
    viewer.autoRotate = autoRotate;
    viewer.autoRotateSpeed = 0.5;
    viewer.camera.position.set(0, 10, 40); // Приближаем камеру
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [skinUrl, width, height, autoRotate]);

  return <canvas ref={canvasRef} />;
}