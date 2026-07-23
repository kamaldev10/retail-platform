import { PrismaClient, Role } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error('⚠️ Error: SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD must be set in your .env file.');
    process.exit(1);
  }

  console.log(`\n🚀 Starting database seeding...`);
  console.log(`Admin User: "${name}" <${email}>`);

  // 1. Create/invite user in Supabase Auth using Service Role key if available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    console.log('🔄 Connecting to Supabase Auth to ensure user account exists...');
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user already exists in Supabase Auth
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.warn('⚠️ Warning: Could not list Supabase Auth users.', listError.message);
    } else {
      const existingAuthUser = listData.users.find(u => u.email === email);
      if (existingAuthUser) {
        console.log('✅ User already exists in Supabase Auth. Skipping auth creation.');
      } else {
        console.log('➕ Creating user account in Supabase Auth...');
        const { error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          console.error('❌ Error creating Supabase Auth user:', createError.message);
          process.exit(1);
        } else {
          console.log('✅ User account created in Supabase Auth successfully.');
        }
      }
    }
  } else {
    console.warn('⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Skipping Supabase Auth creation.');
  }

  // 2. Upsert admin user inside public.User table in PostgreSQL using Prisma
  console.log('🔄 Upserting admin record in public.User table...');
  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password, // Stored as raw or managed by external auth
      role: Role.ADMIN,
    },
    create: {
      name,
      email,
      password,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin record upserted in PostgreSQL successfully:', adminUser.id);
  console.log('🎉 Database seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
