import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatName(name: string) {
  if (!name) return ""
  return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}
