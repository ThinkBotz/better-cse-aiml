import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import './FlipCard.css';

export interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  axis?: 'x' | 'y';
  flipOnClick?: boolean;
  draggable?: boolean;
  dragDistance?: number;
  tilt?: boolean;
  tiltMax?: number;
  glare?: boolean;
  glareOpacity?: number;
  hoverScale?: number;
  perspective?: number;
  stiffness?: number;
  damping?: number;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string | number;
  maxHeight?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  radius?: number;
  background?: string;
  color?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
  onFlipChange?: (flipped: boolean) => void;
  isFlipped?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  axis = 'y',
  flipOnClick = true,
  draggable = false,
  dragDistance = 0,
  tilt = true,
  tiltMax = 12,
  glare = false,
  glareOpacity = 0.22,
  hoverScale = 1.03,
  perspective = 1100,
  stiffness = 170,
  damping = 20,
  width = '100%',
  height,
  aspectRatio,
  maxHeight,
  maxWidth,
  minHeight,
  radius = 12,
  background = 'var(--nb-surface, #FFFFFF)',
  color = 'var(--nb-content, #1A1A1A)',
  shadow = true,
  shadowColor = 'var(--nb-ink, #000000)',
  shadowOpacity = 0.8,
  onFlipChange,
  isFlipped: controlledFlipped,
  className = '',
  style = {}
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const [tiltAngles, setTiltAngles] = useState({ x: 0, y: 0 });
  const [glareState, setGlareState] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  // Calculate CSS spring duration based on stiffness & damping
  const transitionDuration = useMemo(() => {
    // Standard spring oscillation duration approximation in seconds
    const dur = Math.max(0.4, Math.min(1.0, (2 * Math.PI * Math.sqrt(1 / Math.max(stiffness, 50))) * (1 + damping / 100)));
    return `${dur.toFixed(2)}s`;
  }, [stiffness, damping]);

  const handleToggleFlip = useCallback(() => {
    const next = !isFlipped;
    if (controlledFlipped === undefined) {
      setInternalFlipped(next);
    }
    onFlipChange?.(next);
  }, [isFlipped, controlledFlipped, onFlipChange]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragStartRef.current && draggable) {
      const dx = Math.abs(x - dragStartRef.current.x);
      const dy = Math.abs(y - dragStartRef.current.y);
      const dist = axis === 'x' ? dy : dx;
      if (dist > 5) {
        dragStartRef.current.moved = true;
      }
      if (dist > (dragDistance || 60)) {
        dragStartRef.current = null;
        handleToggleFlip();
        return;
      }
    }

    if (tilt) {
      const normX = (x / rect.width) * 2 - 1; // -1 to 1
      const normY = (y / rect.height) * 2 - 1; // -1 to 1

      // If card is flipped, invert rotation so tilt matches visible face
      const flipSign = isFlipped ? -1 : 1;
      const rotX = -normY * tiltMax * (axis === 'x' ? flipSign : 1);
      const rotY = normX * tiltMax * (axis === 'y' ? flipSign : 1);

      setTiltAngles({ x: rotX, y: rotY });
    }

    if (glare) {
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      setGlareState({
        x: percentX,
        y: percentY,
        opacity: glareOpacity
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggable) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        dragStartRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          moved: false
        };
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // If interactive child (button, input, etc.) was clicked, don't trigger flip
    const target = e.target as HTMLElement;
    if (target && target.closest('button, a, input, select, textarea, [data-no-flip="true"]')) {
      dragStartRef.current = null;
      return;
    }

    if (flipOnClick) {
      if (!dragStartRef.current || !dragStartRef.current.moved) {
        handleToggleFlip();
      }
    }
    dragStartRef.current = null;
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTiltAngles({ x: 0, y: 0 });
    setGlareState(prev => ({ ...prev, opacity: 0 }));
    dragStartRef.current = null;
  };

  // Rotation calculations
  const baseRotation = isFlipped
    ? axis === 'x'
      ? 'rotateX(180deg)'
      : 'rotateY(180deg)'
    : 'rotateX(0deg) rotateY(0deg)';

  const dynamicTilt = tilt
    ? `rotateX(${tiltAngles.x.toFixed(2)}deg) rotateY(${tiltAngles.y.toFixed(2)}deg)`
    : '';

  const scaleTransform = isHovered && hoverScale ? `scale(${hoverScale})` : 'scale(1)';

  const innerTransform = `${scaleTransform} ${baseRotation} ${dynamicTilt}`;

  // Back face pre-rotation
  const backFaceTransform = axis === 'x' ? 'rotateX(180deg)' : 'rotateY(180deg)';

  const cardShadow = shadow
    ? `0 24px 48px -12px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}, 0 0 0 1px rgba(255, 255, 255, 0.08)`
    : 'none';

  return (
    <div
      ref={containerRef}
      className={`flip-card-container ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : (aspectRatio ? undefined : '400px'),
        aspectRatio: aspectRatio !== undefined ? `${aspectRatio}` : undefined,
        maxHeight: maxHeight !== undefined ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
        maxWidth: maxWidth !== undefined ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined,
        minHeight: minHeight !== undefined ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : undefined,
        perspective: `${perspective}px`,
        ...style
      }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="flip-card-inner"
        style={{
          borderRadius: `${radius}px`,
          boxShadow: cardShadow,
          transform: innerTransform,
          transition: isHovered && tilt
            ? `transform ${transitionDuration} cubic-bezier(0.175, 0.885, 0.32, 1.275)`
            : `transform ${transitionDuration} cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease`
        }}
      >
        {/* FRONT FACE */}
        <div
          className="flip-card-face flip-card-front"
          style={{
            borderRadius: `${radius}px`,
            border: '2px solid var(--nb-ink)',
            backgroundColor: background,
            color
          }}
        >
          {front}
          {glare && !isFlipped && (
            <div
              className="flip-card-glare"
              style={{
                opacity: glareState.opacity,
                background: `radial-gradient(circle 380px at ${glareState.x}% ${glareState.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 80%)`
              }}
            />
          )}
        </div>

        {/* BACK FACE */}
        <div
          className="flip-card-face flip-card-back"
          style={{
            borderRadius: `${radius}px`,
            border: '2px solid var(--nb-ink)',
            backgroundColor: background,
            color,
            transform: backFaceTransform
          }}
        >
          {back}
          {glare && isFlipped && (
            <div
              className="flip-card-glare"
              style={{
                opacity: glareState.opacity,
                background: `radial-gradient(circle 380px at ${glareState.x}% ${glareState.y}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.06) 50%, transparent 80%)`
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipCard;
