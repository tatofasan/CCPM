/**
 * Validates operating hours format
 * Accepted formats:
 * - "9:00-18:00" (single period)
 * - "9:00-13:00, 14:00-18:00" (multiple periods)
 * - "24/7" (always open)
 * - "Closed" (not operational)
 *
 * @param hours Operating hours string
 * @returns Object with validation result and optional error message
 */
export function validateOperatingHours(hours: string): { valid: boolean; error?: string } {
  if (!hours || typeof hours !== 'string') {
    return { valid: false, error: 'Operating hours are required' };
  }

  const trimmedHours = hours.trim();

  // Check for special cases
  if (trimmedHours.toLowerCase() === '24/7' || trimmedHours.toLowerCase() === 'closed') {
    return { valid: true };
  }

  // Split by comma for multiple periods
  const periods = trimmedHours.split(',').map(p => p.trim());

  for (const period of periods) {
    // Check format: HH:MM-HH:MM or H:MM-H:MM or HH:MM-HH:MM
    const timeRangeRegex = /^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/;
    const match = period.match(timeRangeRegex);

    if (!match) {
      return {
        valid: false,
        error: `Invalid time format in "${period}". Expected format: HH:MM-HH:MM (e.g., 9:00-18:00)`
      };
    }

    const [_, startTime, endTime] = match;

    // Validate start time
    const startValidation = validateTimeFormat(startTime);
    if (!startValidation.valid) {
      return { valid: false, error: `Invalid start time "${startTime}": ${startValidation.error}` };
    }

    // Validate end time
    const endValidation = validateTimeFormat(endTime);
    if (!endValidation.valid) {
      return { valid: false, error: `Invalid end time "${endTime}": ${endValidation.error}` };
    }

    // Check if start time is before end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      return {
        valid: false,
        error: `Start time "${startTime}" must be before end time "${endTime}"`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates a single time in HH:MM format
 *
 * @param time Time string to validate
 * @returns Object with validation result and optional error message
 */
function validateTimeFormat(time: string): { valid: boolean; error?: string } {
  const parts = time.split(':');

  if (parts.length !== 2) {
    return { valid: false, error: 'Time must be in format HH:MM' };
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return { valid: false, error: 'Hours and minutes must be numbers' };
  }

  if (hours < 0 || hours > 23) {
    return { valid: false, error: 'Hours must be between 0 and 23' };
  }

  if (minutes < 0 || minutes > 59) {
    return { valid: false, error: 'Minutes must be between 0 and 59' };
  }

  return { valid: true };
}

/**
 * Converts time string to minutes since midnight
 *
 * @param time Time string in HH:MM format
 * @returns Minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Formats operating hours string for display
 *
 * @param hours Operating hours string
 * @returns Formatted operating hours
 */
export function formatOperatingHours(hours: string): string {
  if (!hours) return '';

  const trimmedHours = hours.trim();

  // Return special cases as-is
  if (trimmedHours.toLowerCase() === '24/7' || trimmedHours.toLowerCase() === 'closed') {
    return trimmedHours.toUpperCase();
  }

  // Split by comma and format each period
  const periods = trimmedHours.split(',').map(p => p.trim());
  return periods.join(', ');
}