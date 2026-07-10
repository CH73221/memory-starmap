import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "yyyy-MM-dd HH:mm");
}

export function formatRelativeDate(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

export function getMasteryColor(level: number): string {
  if (level >= 0.8) return "#10B981";
  if (level >= 0.6) return "#34D399";
  if (level >= 0.4) return "#F59E0B";
  if (level >= 0.2) return "#F97316";
  return "#EF4444";
}

export function getMasteryLabel(level: number): string {
  if (level >= 0.8) return "已掌握";
  if (level >= 0.6) return "较熟悉";
  if (level >= 0.4) return "一般";
  if (level >= 0.2) return "较薄弱";
  return "未掌握";
}
