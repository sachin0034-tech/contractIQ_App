import type { Config } from '@netlify/functions';

/** Scheduled daily at 03:00 UTC. Calls the app's retention route with the shared secret. */
export default async function handler(): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.CRON_SECRET;
  if (!baseUrl || !secret) {
    return new Response('NEXT_PUBLIC_APP_URL and CRON_SECRET must be set', { status: 500 });
  }
  const response = await fetch(`${baseUrl}/api/cron/retention`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return new Response(await response.text(), { status: response.status });
}

export const config: Config = { schedule: '0 3 * * *' };
