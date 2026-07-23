import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@retail/database';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Can be ignored if called from Server Component
          }
        },
      },
    }
  );
}

export async function checkAdminAccess() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, error: 'Unauthorized: No active session' };
    }

    // Check role in our PostgreSQL database using Prisma
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return { authorized: false, error: 'Forbidden: Access restricted to Admin only' };
    }

    return { authorized: true, user, dbUser };
  } catch (error) {
    console.error('Admin authorization check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { authorized: false, error: errorMessage };
  }
}
