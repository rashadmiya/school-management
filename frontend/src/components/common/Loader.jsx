// components/ui/Loader.jsx

import { cn } from "@/lib/utils";
import { RotateCw } from "lucide-react";
import React from "react";


/**
 * A simple spinning loader component using a Lucide icon.
 * @param {string} className - Optional Tailwind classes to customize size/color.
 * @param {boolean} fullScreen - If true, centers the loader on the entire viewport.
 */
export default function Loader({ className, fullScreen = false }) {
  // Styles for the spinner itself
  const spinnerStyle = cn(
    "animate-spin", // Tailwind utility for continuous rotation
    "h-6 w-6 text-primary", // Default size and color
    className
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {/* <RotateCw className={spinnerStyle} /> */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // Default behavior (inline or centered in a container)
  return (
    <div className="flex justify-center items-center w-full h-full">
      {/* <RotateCw className={spinnerStyle} /> */}
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  );
}