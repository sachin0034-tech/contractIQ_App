import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { deleteContract, getContractDetail } from '@/services/contract.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async ({ supabase, user, params }) => {
  const detail = await getContractDetail(supabase, params.id, user.id);
  return NextResponse.json(detail);
});

export const DELETE = route(async ({ supabase, user, params }) => {
  await deleteContract(supabase, params.id, user.id);
  return new NextResponse(null, { status: 204 });
});
