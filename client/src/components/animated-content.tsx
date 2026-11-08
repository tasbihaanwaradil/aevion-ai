"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  delay?: number;
  duration?: number;
  ease?: string;
  threshold?: number;
  reverse?: boolean;
  animateOpacity?: boolean;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  distance = 12, // ✅ subtle like Socrative
  direction = "vertical",
  delay = 0,
  duration = 0.5, // ✅ faster
  ease = "power2.out", // ✅ clean SaaS easing
  threshold = 0.15, // ✅ triggers early like modern landing pages
  reverse = false,
  animateOpacity = true,
  className = "",
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const axis = direction === "horizontal" ? "x" : "y";
    const offset = reverse ? -distance : distance;

    // Initial state (soft & minimal)
    gsap.set(el, {
      [axis]: offset,
      opacity: animateOpacity ? 0 : 1,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: `top ${threshold * 100}%`,
        toggleActions: "play none none none",
      },
      delay,
    });

    tl.to(el, {
      [axis]: 0,
      opacity: 1,
      duration,
      ease,
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [distance, direction, delay, duration, ease, threshold, reverse, animateOpacity]);

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
};

export default AnimatedContent;