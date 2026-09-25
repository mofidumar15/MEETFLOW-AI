'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RobotState } from '@/types';
import { cn } from '@/lib/utils';

interface RobotMascotProps {
  state: RobotState;
  size?: number;
  className?: string;
}

// ============================================================
// RobotMascot — animated CSS/SVG cyber robot with reactive states
// idle / thinking / success / error / talking
// ============================================================

export function RobotMascot({
  state,
  size = 220,
  className,
}: RobotMascotProps) {
  const isProcessing = state === 'thinking' || state === 'talking';

  const eyeColor =
    state === 'error'
      ? '#ef4444'
      : state === 'success'
        ? '#22c55e'
        : state === 'thinking'
          ? '#FACC15'
          : state === 'talking'
            ? '#3B82F6'
            : '#0052FF';

  const glowColor =
    state === 'error'
      ? 'rgba(239,68,68,0.6)'
      : state === 'success'
        ? 'rgba(34,197,94,0.6)'
        : state === 'thinking'
          ? 'rgba(250,204,21,0.5)'
          : state === 'talking'
            ? 'rgba(59,130,246,0.6)'
            : 'rgba(0,82,255,0.5)';

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* Ambient floating glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{ scale: isProcessing ? [1, 1.15, 1] : [1, 1.05, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: isProcessing ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rotating ring */}
      <motion.div
        className="absolute rounded-full border-2 border-dashed"
        style={{
          width: size * 0.95,
          height: size * 0.95,
          borderColor: isProcessing ? `${glowColor}` : 'rgba(59,130,246,0.25)',
        }}
        animate={{ rotate: isProcessing ? 360 : 0 }}
        transition={{ duration: isProcessing ? 3 : 0, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner orbiting dots */}
      {isProcessing && (
        <>
          {[0, 120, 240].map((angle) => (
            <motion.div
              key={angle}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: eyeColor,
                boxShadow: `0 0 8px ${glowColor}`,
              }}
              animate={{
                rotate: 360,
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              // Position dots on the ring via transform origin
            >
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${angle}deg) translateX(${size * 0.45}px)`,
                }}
                className="w-2 h-2 rounded-full"
              />
            </motion.div>
          ))}
        </>
      )}

      {/* Robot body container — floating */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
        style={{ width: size * 0.6, height: size * 0.72 }}
      >
        <svg
          viewBox="0 0 120 144"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenna */}
          <motion.line
            x1="60" y1="6" x2="60" y2="20"
            stroke={eyeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <motion.circle
            cx="60" cy="6" r="4"
            fill={eyeColor}
            animate={{ opacity: isProcessing ? [1, 0.3, 1] : [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />

          {/* Head */}
          <rect
            x="24" y="20" width="72" height="56" rx="14"
            fill="#0f172a"
            stroke={eyeColor}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}
          />
          {/* Head highlight */}
          <rect x="30" y="24" width="60" height="6" rx="3" fill={`url(#headShine)`} opacity="0.15" />

          {/* Eyes — animated */}
          <motion.ellipse
            cx="46" cy="48" rx="9" ry="9"
            fill={eyeColor}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            animate={{
              scaleY: state === 'thinking' ? [1, 0.1, 1] : state === 'talking' ? [1, 0.6, 1] : 1,
            }}
            transition={{ duration: state === 'thinking' ? 1.5 : 0.3, repeat: Infinity }}
          />
          <motion.ellipse
            cx="74" cy="48" rx="9" ry="9"
            fill={eyeColor}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            animate={{
              scaleY: state === 'thinking' ? [1, 0.1, 1] : state === 'talking' ? [1, 0.6, 1] : 1,
            }}
            transition={{ duration: state === 'thinking' ? 1.5 : 0.3, repeat: Infinity }}
          />
          {/* Pupil shine */}
          <circle cx="48" cy="46" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="76" cy="46" r="2.5" fill="#ffffff" opacity="0.8" />

          {/* Mouth — state dependent */}
          {state === 'talking' ? (
            <motion.rect
              x="48" y="64" width="24" height="6" rx="3"
              fill={eyeColor}
              animate={{ height: [3, 8, 3], y: [65, 62, 65] }}
              transition={{ duration: 0.25, repeat: Infinity }}
              style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
            />
          ) : state === 'success' ? (
            <path
              d="M48 64 Q60 74 72 64"
              stroke={eyeColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
            />
          ) : state === 'error' ? (
            <path
              d="M48 70 Q60 60 72 70"
              stroke={eyeColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <rect x="50" y="64" width="20" height="3" rx="1.5" fill={eyeColor} opacity="0.7" />
          )}

          {/* Neck */}
          <rect x="54" y="76" width="12" height="8" fill="#1e293b" stroke={eyeColor} strokeWidth="1" opacity="0.6" />

          {/* Body */}
          <rect
            x="20" y="84" width="80" height="52" rx="12"
            fill="#0f172a"
            stroke={eyeColor}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />

          {/* Chest core — glowing reactor */}
          <motion.circle
            cx="60" cy="110" r="10"
            fill={eyeColor}
            animate={{
              scale: isProcessing ? [1, 1.3, 1] : [1, 1.08, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: isProcessing ? 0.8 : 2.5, repeat: Infinity }}
            style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
          />
          <circle cx="60" cy="110" r="5" fill="#ffffff" opacity="0.6" />

          {/* Body panel lines */}
          <line x1="32" y1="92" x2="42" y2="92" stroke={eyeColor} strokeWidth="1.5" opacity="0.4" />
          <line x1="32" y1="98" x2="38" y2="98" stroke={eyeColor} strokeWidth="1.5" opacity="0.3" />
          <line x1="78" y1="92" x2="88" y2="92" stroke={eyeColor} strokeWidth="1.5" opacity="0.4" />
          <line x1="82" y1="98" x2="88" y2="98" stroke={eyeColor} strokeWidth="1.5" opacity="0.3" />

          {/* Side ear pods */}
          <rect x="16" y="36" width="8" height="24" rx="4" fill="#1e293b" stroke={eyeColor} strokeWidth="1.5" />
          <rect x="96" y="36" width="8" height="24" rx="4" fill="#1e293b" stroke={eyeColor} strokeWidth="1.5" />

          {/* Gradient defs */}
          <defs>
            <linearGradient id="headShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Audio wave bars — only when talking */}
      <AnimatePresence>
        {state === 'talking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-2 flex items-end gap-1"
            style={{ height: 24 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ background: eyeColor, boxShadow: `0 0 6px ${glowColor}` }}
                animate={{ height: [6, 20, 6] }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span
          className="text-xs font-mono font-semibold uppercase tracking-widest"
          style={{ color: eyeColor }}
        >
          {state === 'idle' && '● Standby'}
          {state === 'thinking' && '⚡ Processing'}
          {state === 'talking' && '🎙 Transmitting'}
          {state === 'success' && '✓ Complete'}
          {state === 'error' && '✗ Error'}
        </span>
      </div>
    </div>
  );
}
