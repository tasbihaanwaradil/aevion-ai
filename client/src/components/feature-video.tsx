
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2Icon, PauseIcon, PlayIcon } from "lucide-react";
import type { FeatureVideoClip } from "../data/featureVideos";

type Props = {
  clips: FeatureVideoClip[];
};

export default function FeatureVideo({ clips }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false); // currently on screen
  const [nearView, setNearView] = useState(false); // has been close to screen at least once
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userPicked, setUserPicked] = useState(false);

  // Respect "reduce motion"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Load the video only once the card is near the viewport; play only while visible
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearView(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );

    const viewObserver = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.5 }
    );

    nearObserver.observe(el);
    viewObserver.observe(el);
    return () => {
      nearObserver.disconnect();
      viewObserver.disconnect();
    };
  }, []);

  const shouldPlay = inView && nearView && !paused && !reduceMotion && !failed;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (shouldPlay) {
      el.play().catch(() => {
        /* autoplay blocked; poster stays visible */
      });
    } else {
      el.pause();
    }
  }, [shouldPlay, active, nearView]);

  // Reset per-clip state when switching clips
  useEffect(() => {
    setReady(false);
    setFailed(false);
    setProgress(0);
  }, [active]);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  }, []);

  const handleEnded = useCallback(() => {
    setActive((a) => (a + 1) % clips.length);
  }, [clips.length]);

  const selectClip = (i: number) => {
    setUserPicked(true);
    setPaused(false);
    if (i === active) {
      const el = videoRef.current;
      if (el) el.currentTime = 0;
      return;
    }
    setActive(i);
  };

  if (!clips.length) return null;
  const clip = clips[active];
  const multi = clips.length > 1;
  const loop = !multi || userPicked;
  const showPlayOverlay = paused || reduceMotion;
  const buffering = shouldPlay && !ready && !failed;

  return (
    <div ref={wrapRef} className="w-full mt-5">
      {/* Frame */}
      <div className="group relative w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-md shadow-black/5">
        {/* Window bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100/90 border-b border-black/5">
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="ml-3 text-[11px] font-medium text-zinc-500 truncate">
            {clip.label}
          </span>
        </div>

        {/* Media area (fixed aspect ratio, so no layout shift) */}
        <div className="relative w-full aspect-video bg-[#0b1020]">
          {/* Lazy poster: always rendered, sits under the video */}
          <img
            src={clip.poster}
            alt={failed ? `${clip.label} preview` : ""}
            aria-hidden={!failed}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 block w-full h-full object-contain"
          />

          {/* Video is only mounted once the card is near the viewport */}
          {nearView && !failed && (
            <video
              key={clip.src}
              ref={videoRef}
              className={`absolute inset-0 block w-full h-full object-contain transition-opacity duration-500 ${
                ready ? "opacity-100" : "opacity-0"
              }`}
              src={clip.src}
              muted
              loop={loop}
              playsInline
              preload="metadata"
              aria-label={`${clip.label} demo`}
              onLoadedData={() => setReady(true)}
              onPlaying={() => setReady(true)}
              onWaiting={() => setReady(false)}
              onError={() => setFailed(true)}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onClick={() => setPaused((p) => !p)}
            />
          )}

          {/* Buffering spinner */}
          {buffering && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
              <Loader2Icon className="size-6 text-white/90 animate-spin" />
            </div>
          )}

          {/* Big play overlay when paused / reduced motion */}
          {!failed && showPlayOverlay && (
            <button
              type="button"
              onClick={() => {
                setPaused(false);
                setReduceMotion(false);
              }}
              aria-label="Play demo"
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              <span className="rounded-full bg-white/95 p-3 shadow-lg">
                <PlayIcon className="size-5 text-[#007a8c]" />
              </span>
            </button>
          )}

          {/* Small pause/play control */}
          {!failed && !showPlayOverlay && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play demo" : "Pause demo"}
              className="absolute bottom-3 right-3 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/70"
            >
              {paused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
            </button>
          )}

          {/* Thin progress bar for single-clip features */}
          {!multi && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15">
              <div
                className="h-full bg-[#00b4cc] transition-[width] duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Clip switcher with per-tab progress fill */}
      {multi && (
        <div role="tablist" aria-label="Demo clips" className="mt-3 flex flex-wrap gap-2">
          {clips.map((c, i) => {
            const isActive = i === active;
            return (
              <button
                key={c.src}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectClip(i)}
                className={`relative overflow-hidden px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 border ${
                  isActive
                    ? "border-[#007a8c]/40 bg-white text-[#007a8c] shadow-sm"
                    : "border-black/10 bg-white/60 text-zinc-600 hover:bg-white hover:text-zinc-900"
                }`}
              >
                {isActive && !userPicked && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-[#007a8c]/12 transition-[width] duration-300 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}