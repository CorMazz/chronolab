import { parseISO } from "date-fns";

// We don't want to deal with timezones so make everything UTC
export function dateToUtcString(date: Date | null): string | null {
    if (!date) return null;
    return date.toISOString().slice(0, 19);
}

export function parseUtcString(dateString: string | null): Date | null {
    if (!dateString) return null;
    return parseISO(dateString + 'Z');
}