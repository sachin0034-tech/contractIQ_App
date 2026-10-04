import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { route } from '@/lib/http';
import { createFromUpload, listUserContracts } from '@/services/contract.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const uploadFormSchema = z.object({ contract_type: z.enum(['NDA', 'MSA']) });

const listQuerySchema = z.object({
  sort: z.enum(['created_at', 'name', 'contract_type']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(64).optional(),
});

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const offset = Number.parseInt(Buffer.from(cursor, 'base64url').toString('utf8'), 10);
  if (!Number.isInteger(offset) || offset < 0) throw new AppError('INVALID_INPUT');
  return offset;
}

export const POST = route(async ({ req, supabase, user }) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new AppError('INVALID_INPUT');
  }

  const { contract_type } = uploadFormSchema.parse({ contract_type: form.get('contract_type') });
  const file = form.get('file');
  if (!(file instanceof File)) throw new AppError('INVALID_INPUT');

  const result = await createFromUpload(supabase, user, file, contract_type);
  return NextResponse.json(result, { status: 201 });
});

export const GET = route(async ({ req, supabase, user }) => {
  const query = listQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const offset = decodeCursor(query.cursor);

  const { items, nextOffset } = await listUserContracts(supabase, user.id, {
    sort: query.sort,
    ascending: query.order === 'asc',
    limit: query.limit,
    offset,
  });

  return NextResponse.json({
    items,
    next_cursor: nextOffset === null ? null : Buffer.from(String(nextOffset), 'utf8').toString('base64url'),
  });
});
