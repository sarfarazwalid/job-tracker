"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, text: "text-base" },
  md: { icon: 32, text: "text-lg" },
  lg: { icon: 40, text: "text-xl" },
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <motion.div
        className="relative shrink-0"
        style={{ width: icon, height: icon }}
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <Image
          src="/career.gif"
          alt="JobTracker"
          width={64}
          height={64}
          className="w-full h-full object-contain drop-shadow-md"
          aria-hidden="true"
          unoptimized
        />
      </motion.div>

      {showText && (
        <span className={`font-bold tracking-tight text-[#FFFFFF] ${text} font-orbitron leading-none self-center`}>
          JobTracker
        </span>
      )}
    </div>
  );
}
