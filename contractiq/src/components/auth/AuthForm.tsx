'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { createClient } from '@/lib/supabase/client';
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from '@/lib/validation/auth';
import { safeNext } from '@/lib/validation/redirect';
import { ResendConfirmation } from './ResendConfirmation';

type FormValues = SignUpInput & SignInInput;

export interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  next?: string;
}

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === 'sign-up';
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: { email: '', password: '', fullName: '' },
    mode: 'onSubmit',
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setUnconfirmedEmail(null);
    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: values.fullName ? { full_name: values.fullName } : undefined,
        },
      });
      if (error) {
        setFormError(
          error.code === 'weak_password'
            ? 'Choose a stronger password with at least 8 characters, a letter and a number.'
            : error.status === 429
              ? 'Too many attempts. Please wait a minute and try again.'
              : GENERIC_ERROR,
        );
        return;
      }
      // Supabase returns success for already-registered emails too, so this screen never reveals
      // whether an account exists.
      router.push(`/auth/check-email?email=${encodeURIComponent(values.email)}`);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      if (error.code === 'email_not_confirmed') {
        setUnconfirmedEmail(values.email);
        setFormError('Please confirm your email first. Check your inbox for the confirmation link.');
      } else if (error.code === 'invalid_credentials') {
        setFormError('Email or password is incorrect.');
      } else if (error.status === 429) {
        setFormError('Too many attempts. Please wait a minute and try again.');
      } else {
        setFormError(GENERIC_ERROR);
      }
      return;
    }
    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4" aria-label={isSignUp ? 'Sign up' : 'Sign in'}>
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      {unconfirmedEmail ? <ResendConfirmation email={unconfirmedEmail} /> : null}

      {isSignUp ? (
        <TextField
          label="Full name (optional)"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
      ) : null}

      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        hint={isSignUp ? 'At least 8 characters, with a letter and a number.' : undefined}
        error={errors.password?.message}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        }
        {...register('password')}
      />

      <Button type="submit" loading={isSubmitting} fullWidth>
        {isSignUp ? 'Create account' : 'Sign in'}
      </Button>

      <p className="type-body-sm text-text-secondary">
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link href={next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in'} className="text-brand underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to ContractIQ?{' '}
            <Link href="/sign-up" className="text-brand underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
