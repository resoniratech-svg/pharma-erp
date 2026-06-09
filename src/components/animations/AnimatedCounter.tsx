import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
  value: number;
  suffix?: string;
  label: string;
  /** Set true when placed on a dark background */
  dark?: boolean;
}

export const AnimatedCounter = ({ value, suffix = '', label, dark = true }: Props) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const steps = 50;
    const inc = Math.ceil(value / steps);
    const delay = 1800 / steps;

    const t = setInterval(() => {
      current += inc;
      if (current >= value) { setCount(value); clearInterval(t); }
      else setCount(current);
    }, delay);

    return () => clearInterval(t);
  }, [isInView, value]);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-center p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
        dark
          ? 'bg-white/5 backdrop-blur border-white/10 hover:bg-white/8'
          : 'bg-white/80 backdrop-blur border-white shadow-xl shadow-slate-200/60'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-4xl lg:text-5xl font-black mb-2"
        style={{
          background: 'linear-gradient(135deg, #00D9A3, #00BCD4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {count.toLocaleString()}{suffix}
      </motion.div>
      <span className={`text-sm font-semibold text-center leading-snug ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
};
