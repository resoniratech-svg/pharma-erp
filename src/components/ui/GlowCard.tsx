import React from 'react';
import { motion, type Variants } from 'framer-motion';

export interface GlowCardProps {
  borderGradient: string;
  glowColor: string;
  glowColorIdle: string;
  children: React.ReactNode;
  className?: string;
  animationVariants?: Variants;
  animationDelay?: number;
}

export function GlowCard({
  borderGradient,
  glowColor,
  glowColorIdle,
  children,
  className = '',
  animationVariants,
  animationDelay = 0,
}: GlowCardProps) {
  return (
    <motion.div
      variants={animationVariants}
      // Idle pulse: every ~7s, just opacity of the outer glow layer
      animate={{
        boxShadow: [
          `0 0 0 1px transparent, 0 4px 16px 0 ${glowColorIdle}, 0 1px 3px 0 rgba(0,0,0,0.06)`,
          `0 0 0 1px transparent, 0 4px 22px 2px ${glowColor}55, 0 1px 3px 0 rgba(0,0,0,0.06)`,
          `0 0 0 1px transparent, 0 4px 16px 0 ${glowColorIdle}, 0 1px 3px 0 rgba(0,0,0,0.06)`,
        ],
      }}
      transition={{
        boxShadow: {
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: animationDelay,
        },
      }}
      whileHover={{
        y: -4,
        boxShadow: `0 0 0 1px transparent, 0 8px 28px 4px ${glowColor}, 0 2px 8px 0 rgba(0,0,0,0.08)`,
        transition: { duration: 0.25, ease: 'easeOut' },
      }}
      className={`relative rounded-[24px] bg-white p-6 ${className}`}
      style={{
        // Gradient border via background-clip technique on a pseudo-element wrapper
        // We achieve it with a 1px inset box-shadow + pseudo background
        outline: 'none',
      }}
    >
      {/* 1px gradient border ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{
          padding: '1px',
          background: borderGradient,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {children}
    </motion.div>
  );
}
