# Setting up CampusConnect

CampusConnect stores accounts, classes, groups and messages in [Supabase](https://supabase.com) (free tier is enough for a few classes). You set this up once; after that, professors and students only need the website.

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) and click **New project**. Pick any name and a strong database password, and the region closest to you (for example *West US*).
2. When the project is ready, open **SQL Editor**, click **New query**, paste the whole file [`supabase/migrations/20261019000000_classes_and_group_chats.sql`](../supabase/migrations/20261019000000_classes_and_group_chats.sql), and click **Run**. It should finish with "Success. No rows returned".

That file creates the tables, the access rules (who can see which groups and messages), and turns on live updates for chat messages.

## 2. Configure sign-in

In **Authentication**:

1. **Sign In / Providers → Email:** turn **Confirm email** off.
   Supabase's built-in email service only sends a few emails per hour, which is not enough for a whole class signing up at once. Leave it on only if you add your own email provider under **Emails → SMTP Settings**.
2. **URL Configuration:** set **Site URL** to `https://campus-connect-two-theta.vercel.app` and add `https://campus-connect-two-theta.vercel.app/**` under **Redirect URLs**.

## 3. Connect the website

1. In Supabase, open **Project Settings → API** (or **Connect**) and copy the **Project URL** and the **anon / publishable key**. The anon key is safe to put in a website; the access rules from step 1 protect the data. Never use the `service_role` / secret key here.
2. In [Vercel](https://vercel.com), open the CampusConnect project → **Settings → Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | the Project URL |
   | `VITE_SUPABASE_ANON_KEY` | the anon / publishable key |

3. Redeploy (**Deployments → ⋯ → Redeploy**). The site now shows the sign-in page instead of "Almost ready".

## 4. Try it

1. Create an account and create a class. You're its professor.
2. Add a couple of groups.
3. Open the invite link in a private window, create a student account, and join a group.
4. Back as the professor, open the group's chat.

## Running locally

```bash
cp .env.example .env.local   # then fill in the two values
npm install
npm run dev
```

To check the access rules against a local Supabase (needs Docker and the [Supabase CLI](https://supabase.com/docs/guides/local-development)):

```bash
supabase start
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=<publishable key from supabase start> npm run test:db
```
