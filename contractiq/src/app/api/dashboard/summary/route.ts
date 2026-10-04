import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { getDashboardSummary } from '@/services/dashboard.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async ({ supabase, user }) => {
  const summary = await getDashboardSummary(supabase, user.id);
  return NextResponse.json(summary, { headers: { 'Cache-Control': 'private, no-store' } });
});
