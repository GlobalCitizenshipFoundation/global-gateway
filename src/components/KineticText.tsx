"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface KineticTextProps {
  words: string[];
  intervalMs?: number; // Time a word is fully visible before starting to transition
  animationDurationMs?: number; // Duration of the transition itself
  className?: string; // Additional classes for the container
}

export function KineticText({
  words,
  intervalMs = 3000, // Default to 3 seconds visible + animation duration
  animationDurationMs = 500, // Default to 0.5 seconds for transition
  className,
}: KineticTextProps) {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [nextWord, setNextWord] = useState(words[1 % words.length]);
  const [isAnimating, setIsAnimating] = useState(false);
  const wordIndexRef = useRef(0);

  useEffect(() => {
    const cycleWords = () => {
      setIsAnimating(true); // Start animation (current word slides out, next word slides in)

      setTimeout(() => {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
        setCurrentWord(words[wordIndexRef.current]);
        setNextWord(words[(wordIndexRef.current + 1) % words.length]);
        setIsAnimating(false); // Reset animation state after transition completes
      }, animationDurationMs); // Duration of the slide animation
    };

    // Set interval for the full cycle (visible time + animation time)
    const intervalId = setInterval(cycleWords, intervalMs + animationDurationMs);

    return () => clearInterval(intervalId);
  }, [words, intervalMs, animationDurationMs]);

  // Use a CSS variable for dynamic duration
  const transitionStyle = {
    "--kinetic-duration": `${animationDurationMs}ms`,
  } as React.CSSProperties;

  const transitionClasses = `transition-all ease-in-out duration-[var(--kinetic-duration)]`;

  return (
    <div className={cn("relative inline-block overflow-hidden align-bottom h-[1.2em] min-w-[250px]", className)} style={transitionStyle}>
      {/* Current word exiting */}
      <span
        key={currentWord} // Key change forces re-render and re-applies transition
        className={cn(
          "inline-block absolute top-0 left-0 w-full",
          transitionClasses,
          isAnimating ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
        )}
      >
        {currentWord}
      </span>

      {/* Next word entering */}
      <span
        key={nextWord} // Key change forces re-render and re-applies transition
        className={cn(
          "inline-block absolute top-0 left-0 w-full",
          transitionClasses,
          isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        )}
      >
        {nextWord}
      </span>
    </div>
  );
}