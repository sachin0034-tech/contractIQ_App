import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = { title: 'Create account | ContractIQ' };

export default function SignUpPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="type-h5">Create your account</h1>
        <p className="type-body-sm text-text-secondary">
          Review NDAs and MSAs in minutes. Your contracts stay private to you.
        </p>
      </div>
      <AuthForm mode="sign-up" />
    </>
  );
}
