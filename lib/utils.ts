import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStudentAvatarSrc(avatar: string | null, gender: string | null | undefined): string | undefined {
  if (avatar) {
    return avatar;
  }
  // Return default avatar based on gender
  if (gender && gender.toLowerCase() === 'male') {
    return '/default-male.jpeg';
  } else if (gender && gender.toLowerCase() === 'female') {
    return '/default-female.jpeg';
  }
  // Fallback to male if gender is not recognized or null/undefined
  return '/default-male.jpeg';
}