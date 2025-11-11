/**
 * Converts a 24-hour time string (e.g., "13:10" or "09:05")
 * into a 12-hour AM/PM format (e.g., "1:10 PM" or "9:05 AM").
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

    const h12String = h12.toString(); // No leading zero
    const mPadded = minutes.toString().padStart(2, "0");

    return `${h12String}:${mPadded} ${ampm}`;
  } catch (e) {
    console.error("Failed to format time:", time, e);
    return time; // Return original string on error
  }
}

/**
 * Formats an ISO date string (or Date object) into a 12-hour AM/PM time.
 * e.g., "2024-10-27T13:15:00.000Z" -> "1:15 PM"
 */
export function formatTimeFromDate(
  date: string | Date | number | undefined | null
): string {
  if (!date) {
    return "--:-- --";
  }
  try {
    const d = new Date(date);
    // Using 'en-US' locale inherently gives 12-hour format without leading zero
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("Failed to format date-time:", date, e);
    return "--:-- --";
  }
}