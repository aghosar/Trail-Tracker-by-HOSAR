import twilio from 'twilio';
import type { FastifyBaseLogger } from 'fastify';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

const client = twilio(accountSid, authToken);

export async function sendSMS(
  toNumber: string,
  message: string,
  logger: FastifyBaseLogger
): Promise<boolean> {
  if (!accountSid || !authToken || !fromNumber) {
    logger.warn(
      { toNumber },
      'SMS service not configured - skipping SMS send'
    );
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });
    logger.info({ toNumber }, 'SMS sent successfully');
    return true;
  } catch (error) {
    logger.error({ err: error, toNumber }, 'Failed to send SMS');
    return false;
  }
}

export function buildTripStartMessage(
  activityType: string,
  clothingDescription: string | null | undefined,
  vehicleDescription: string | null | undefined,
  latitude: string,
  longitude: string
): string {
  let message = `SAFETY ALERT: Trip started\n`;
  message += `Activity: ${activityType}\n`;

  if (clothingDescription) {
    message += `Clothing: ${clothingDescription}\n`;
  }

  if (vehicleDescription) {
    message += `Vehicle: ${vehicleDescription}\n`;
  }

  message += `Location: ${latitude}, ${longitude}`;

  return message;
}

export function buildLocationUpdateMessage(
  latitude: string,
  longitude: string
): string {
  return `Location update: ${latitude}, ${longitude}`;
}

export function buildSOSMessage(
  clothingDescription: string | null | undefined,
  vehicleDescription: string | null | undefined,
  latitude: string,
  longitude: string
): string {
  let message = `🚨 SOS EMERGENCY ALERT 🚨\n`;
  message += `URGENT: User needs help!\n`;

  if (clothingDescription) {
    message += `Clothing: ${clothingDescription}\n`;
  }

  if (vehicleDescription) {
    message += `Vehicle: ${vehicleDescription}\n`;
  }

  message += `Current Location: ${latitude}, ${longitude}`;

  return message;
}

export function buildTripCompleteMessage(): string {
  return `Trip completed and tracking stopped.`;
}

export function formatDecimal(value: any): string {
  if (value === null || value === undefined) return '0';
  const str = String(value);

  const num = parseFloat(str);
  if (isNaN(num)) return '0';

  // Format with 4 decimal places for GPS coordinates (standard precision)
  const formatted = num.toFixed(4);

  // Return as-is - keep all 4 decimal places since they are significant
  // for GPS coordinate representation (40.7580 vs 40.758 represent different precisions)
  return formatted;
}
