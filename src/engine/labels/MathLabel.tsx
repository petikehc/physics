import { forwardRef } from 'react';
import { Html } from '@react-three/drei';

interface Props {
  className?: string;
  color?: string;
  children?: React.ReactNode;
}

/**
 * A DOM label pinned to a point in the 3D world. Position it by setting the group's position, and drive
 * its opacity/text through the forwarded ref from useFrame (no React re-render per frame).
 */
export const MathLabel = forwardRef<HTMLDivElement, Props>(function MathLabel(
  { className = 'math-label', color, children },
  ref,
) {
  return (
    <Html center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={ref} className={className} style={{ color, opacity: 0 }}>
        {children}
      </div>
    </Html>
  );
});
