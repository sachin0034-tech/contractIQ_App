import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ERROR_DEFINITIONS, type ErrorEnvelope } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface RouteContext {
  req: Request;
  /** Null only when the route was declared with { auth: false }. */
  user: User;
  supabase: SupabaseClient;
  params: Record<string, string>;
  requestId: string;
}

export interface PublicRouteContext {
  req: Request;
  params: Record<string, string>;
  requestId: string;
}

type NextRouteArgs = { params?: Record<string, string> };

function errorResponse(envelope: ErrorEnvelope, status: number, requestId: string, retryAfter?: number) {
  const headers: Record<string, string> = { 'x-request-id': requestId };
  if (retryAfter !== undefined) headers['Retry-After'] = String(retryAfter);
  return NextResponse.json(envelope, { status, headers });
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError('INVALID_INPUT', {
      details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  return new AppError('INTERNAL', { cause: error });
}

async function run(
  req: Request,
  routeName: string,
  fn: (requestId: string) => Promise<Response>,
  getUserId: () => string | undefined,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const url = new URL(req.url);

  try {
    const response = await fn(requestId);
    response.headers.set('x-request-id', requestId);
    logger.info({
      requestId,
      route: routeName,
      method: req.method,
      status: response.status,
      userId: getUserId(),
      latencyMs: Date.now() - startedAt,
    });
    return response;
  } catch (error) {
    const appError = toAppError(error);
    if (appError.code === 'INTERNAL') {
      logger.error({ requestId, route: url.pathname, method: req.method, err: error });
    } else {
      logger.warn({
        requestId,
        route: url.pathname,
        method: req.method,
        status: appError.status,
        code: appError.code,
        userId: getUserId(),
        latencyMs: Date.now() - startedAt,
      });
    }
    return errorResponse(appError.toEnvelope(), appError.status, requestId, appError.retryAfterSeconds);
  }
}

/**
 * Wraps an authenticated route handler: request id, session check (getUser, not getSession),
 * error envelope mapping, and one structured log line per request.
 */
export function route(handler: (ctx: RouteContext) => Promise<Response>) {
  return async (req: Request, args: NextRouteArgs = {}): Promise<Response> => {
    let userId: string | undefined;
    return run(
      req,
      new URL(req.url).pathname,
      async (requestId) => {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) throw new AppError('UNAUTHENTICATED');
        userId = user.id;
        return handler({ req, user, supabase, params: args.params ?? {}, requestId });
      },
      () => userId,
    );
  };
}

/** Wraps a public route handler (no session required). */
export function publicRoute(handler: (ctx: PublicRouteContext) => Promise<Response>) {
  return async (req: Request, args: NextRouteArgs = {}): Promise<Response> =>
    run(
      req,
      new URL(req.url).pathname,
      (requestId) => handler({ req, params: args.params ?? {}, requestId }),
      () => undefined,
    );
}

/** Parses and validates a JSON request body. Throws INVALID_INPUT for malformed JSON or schema errors. */
export async function parseJson<T>(req: Request, schema: { parse: (data: unknown) => T }): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError('INVALID_INPUT', { message: ERROR_DEFINITIONS.INVALID_INPUT.message });
  }
  return schema.parse(body);
}

/**
 * Loads a contract owned by the caller. Foreign and missing rows both yield NOT_FOUND
 * so existence is never leaked. Pass `columns` to limit what is fetched.
 */
export async function getOwnedContract<Row = Record<string, unknown>>(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
  columns = '*',
): Promise<Row> {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(contractId)) throw new AppError('NOT_FOUND');

  const { data, error } = await supabase
    .from('contracts')
    .select(columns)
    .eq('id', contractId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new AppError('INTERNAL', { cause: error });
  if (!data) throw new AppError('NOT_FOUND');
  return data as unknown as Row;
}
