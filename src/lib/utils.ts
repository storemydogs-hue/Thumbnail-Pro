import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractVideoId(url: string): string | null {
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function getThumbnailUrl(videoId: string, quality: 'maxresdefault' | 'sddefault' | 'hqdefault' = 'maxresdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
