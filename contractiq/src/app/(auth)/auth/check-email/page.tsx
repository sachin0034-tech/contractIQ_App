import type { Metadata } from 'next';
import Link from 'next/link';
import { ResendConfirmation } from '@/components/auth/ResendConfirmation';

export const metadata: Metadata = { title: 'Check your email | ContractIQ' };

export default function CheckEmailPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = typeof searchParams.email === 'string' ? searchParams.email.slice(0, 254) : '';

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="type-h5">Check your email</h1>
        <p className="type-body-lg text-text-secondary">
          {email ? (
            <>
              We sent a confirmation link to <span className="text-text-primary">{email}</span>.
            </>
          ) : (
            'We sent you a confirmation link.'
          )}{' '}
          Click it to finish creating your account.
        </p>
        <p className="type-body-sm text-text-secondary">
          Nothing there? Check your spam folder, or send the email again.
        </p>
      </div>
      <ResendConfirmation email={email} startCooling />
      <p className="type-body-sm text-text-secondary">
        Already confirmed?{' '}
        <Link href="/sign-in" className="text-brand underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
