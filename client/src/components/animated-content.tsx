import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  delay?: number;
  threshold?: number;
  duration?: number;
  ease?: string;
  animateOpacity?: boolean;
  reverse?: boolean;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  distance = 60,          // noticeable slide distance
  direction = 'vertical',
  delay = 0,
  threshold = 0.3,         // trigger earlier
  duration = 0.8,
  ease = 'power3.out',
  animateOpacity = true,
  reverse = false,
  className = '',
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const axis = direction === 'horizontal' ? 'x' : 'y';
    const offset = reverse ? -distance : distance;

    // Initial state
    gsap.set(el, {
      [axis]: offset,
      opacity: animateOpacity ? 0 : 1,
      visibility: 'visible',
    });

    const tl = gsap.timeline({ paused: true, delay });
    tl.to(el, {
      [axis]: 0,
      opacity: 1,
      duration,
      ease,
    });

    const st = ScrollTrigger.create({
      trigger: el,
      start: `top ${threshold * 100}%`, // scroll start
      once: true,
      onEnter: () => tl.play(),
    });

    return () => {
      st.kill();
      tl.kill();
    };
  }, [distance, direction, delay, threshold, duration, ease, animateOpacity, reverse]);

  return (
    <div ref={ref} className={`opacity-0 ${className}`} {...props}>
      {children}
    </div>
  );
};



export default AnimatedContent;
