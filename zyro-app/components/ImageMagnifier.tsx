'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageMagnifierProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  magnifierSize?: number;
  zoomLevel?: number;
  className?: string;
}

export function ImageMagnifier({
  src,
  alt,
  width,
  height,
  magnifierSize = 150,
  zoomLevel = 2.5,
  className = '',
}: ImageMagnifierProps) {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    setShowMagnifier(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowMagnifier(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      // Calculate cursor position relative to container (0-1 range)
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Clamp values between 0 and 1
      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      setCursorPosition({ x: clampedX, y: clampedY });

      // Position magnifier centered on cursor
      setMagnifierPosition({
        x: e.clientX - rect.left - magnifierSize / 2,
        y: e.clientY - rect.top - magnifierSize / 2,
      });
    },
    [magnifierSize]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Main Image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-contain w-full h-auto max-h-[600px]"
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
      />

      {/* Magnifier Lens */}
      {showMagnifier && (
        <div
          className="absolute pointer-events-none border-2 border-white shadow-lg rounded-sm hidden md:block"
          style={{
            width: magnifierSize,
            height: magnifierSize,
            left: magnifierPosition.x,
            top: magnifierPosition.y,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${width * zoomLevel}px ${height * zoomLevel}px`,
            backgroundPositionX: -cursorPosition.x * width * zoomLevel + magnifierSize / 2,
            backgroundPositionY: -cursorPosition.y * height * zoomLevel + magnifierSize / 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}

      {/* Zoom hint - shows briefly */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
        Hover para ampliar
      </div>
    </div>
  );
}
