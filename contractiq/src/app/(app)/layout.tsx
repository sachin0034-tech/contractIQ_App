import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { DISCLAIMER } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects signed-out visitors; this is the defence-in-depth check.
  if (!user) redirect('/sign-in');

  return (
    <div className="flex min-h-screen flex-col bg-bg-surface">
      <AppHeader email={user.email ?? 'Account'} />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border bg-bg-primary px-4 py-4 md:px-12">
        <p className="type-body-sm text-text-secondary">{DISCLAIMER} Powered by Microsoft Azure AI Foundry.</p>
      </footer>
    </div>
  );
}
