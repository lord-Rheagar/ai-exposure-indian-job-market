import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatJobs(value: number): string {
  if (value >= 10_000_000) {
    return `${(value / 10_000_000).toFixed(1)}Cr`;
  }
  if (value >= 100_000) {
    return `${(value / 100_000).toFixed(1)}L`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

export function formatLargeCurrency(value: number): string {
  if (value >= 10_000_000_000_000) {
    return `₹${(value / 10_000_000_000_000).toFixed(1)} Lakh Cr`;
  }
  if (value >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(1)} Cr`;
  }
  return formatINR(value);
}

// Map exposure scores 0-10 to a gradient from Green -> Yellow -> Red
export const EXPOSURE_COLORS = [
  "#10b981", // 0: Emerald 500
  "#34d399", // 1: Emerald 400
  "#6ee7b7", // 2: Emerald 300
  "#a7f3d0", // 3: Emerald 200
  "#fef08a", // 4: Yellow 200
  "#facc15", // 5: Yellow 400
  "#f59e0b", // 6: Amber 500
  "#ea580c", // 7: Orange 600
  "#ef4444", // 8: Red 500
  "#dc2626", // 9: Red 600
  "#991b1b", // 10: Red 800
];

export function getExposureColor(score: number): string {
  const clamped = Math.max(0, Math.min(10, Math.round(score)));
  return EXPOSURE_COLORS[clamped];
}
