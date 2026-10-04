import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { Alert } from '@/components/ui/Alert';
import { safeNext } from '@/lib/validation/redirect';

export const metadata: Metadata = { title: 'Sign in | ContractIQ' };

export default function SignInPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = safeNext(searchParams.next);
  const linkExpired = searchParams.error === 'link_expired';

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="type-h5">Sign in</h1>
        <p className="type-body-sm text-text-secondary">Welcome back. Pick up where you left off.</p>
      </div>
      {linkExpired ? (
        <Alert tone="warning">
          That confirmation link has expired or was already used. Sign in below, or create your account again to get a
          new link.
        </Alert>
      ) : null}
      <AuthForm mode="sign-in" next={next} />
    </>
  );
}
