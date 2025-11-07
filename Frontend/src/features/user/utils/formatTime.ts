/**
 * Converts a 24-hour time string (e.g., "13:10" or "09:05")
 * into a 12-hour AM/PM format (e.g., "01:10 PM" or "09:05 AM").
 */
export function format24HourTime(time: string | undefined | null): string {
  if (!time) {
    return "--:-- --";
  }

  try {
    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return time; // Return original string if parsing fails
    }

    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12; // Convert 0 or 12 to 12

    const h12Padded = h12.toString().padStart(2, "0");
    const mPadded = minutes.toString().padStart(2, "0");

    return `${h12Padded}:${mPadded} ${ampm}`;
  } catch (e) {
    console.error("Failed to format time:", time, e);
    return time; // Return original string on error
  }
}

/**
 * Formats an ISO date string (or Date object) into a 12-hour AM/PM time.
 * e.g., "2024-10-27T13:15:00.000Z" -> "01:15 PM"
 */
export function formatTimeFromDate(
  date: string | Date | number | undefined | null
): string {
  if (!date) {
    return "--:-- --";
  }
  try {
    const d = new Date(date);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("Failed to format date-time:", date, e);
    return "--:-- --";
  }
}