import { differenceInMinutes } from "date-fns";

export const getDurationString = (start: string, end: string) => {
  const minutes = differenceInMinutes(new Date(end), new Date(start));
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  }
  return `${minutes}min`;
};

export const getInitials = (name: string) => {
  if (!name) return "??";
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};