'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

const COOLDOWN_SECONDS = 60;

export interface ResendConfirmationProps {
  email: string;
  /** Start the cooldown immediately (true right after sign up, when an email was just sent). */
  startCooling?: boolean;
}

export function ResendConfirmation({ email, startCooling = false }: ResendConfirmationProps) {
  const [secondsLeft, setSecondsLeft] = useState(startCooling ? COOLDOWN_SECONDS : 0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resend = useCallback(async () => {
    setPending(true);
    setMessage(null);
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);
    if (error) {
      setMessage({ tone: 'error', text: 'We could not resend the email. Please try again in a minute.' });
      return;
    }
    setMessage({ tone: 'success', text: 'Confirmation email sent. Check your inbox.' });
    setSecondsLeft(COOLDOWN_SECONDS);
  }, [email]);

  if (!email) return null;

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" onClick={resend} loading={pending} disabled={secondsLeft > 0}>
        {secondsLeft > 0 ? `Resend email in ${secondsLeft}s` : 'Resend confirmation email'}
      </Button>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
    </div>
  );
}
