-- Admin's own tables (lib/neon.ts adminDb, DATABASE_URL). Applicant tables live in the forms DB, not here.
-- Safe to re-run.

-- position: free text title ("Chief of Staff"). category: fixed group, used for filtering.
CREATE TABLE IF NOT EXISTS members (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  department text NOT NULL,
  college    text,
  position   text NOT NULL,
  category   text NOT NULL
);
-- Upgrades from earlier versions (position used to be limited to the groups; college was required).
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_position_check;
ALTER TABLE members ALTER COLUMN college DROP NOT NULL;
ALTER TABLE members ALTER COLUMN position DROP DEFAULT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE members ALTER COLUMN category DROP DEFAULT;
-- Re-created each run so changing the list here is enough (keep in sync with lib/statuses.ts).
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_category_check;
ALTER TABLE members ADD CONSTRAINT members_category_check
  CHECK (category IN ('Executive', 'Consultant', 'Lead', 'Chapter Lead', 'Ambassador'));
ALTER TABLE members ALTER COLUMN category SET NOT NULL;

CREATE TABLE IF NOT EXISTS deadlines (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title  text NOT NULL,
  owner  text NOT NULL,
  due    date NOT NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Done'))
);

-- Row level security: only the admin app's role (neondb_owner, DATABASE_URL) may read or write.
-- Any other role (e.g. Data API / token roles) gets no grants and no policy, so it sees nothing.
-- FORCE applies RLS to the table owner too; neondb_owner still passes through its own policy.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['members', 'deadlines'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON %I FROM PUBLIC', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_only ON %I', t);
    EXECUTE format('CREATE POLICY admin_only ON %I FOR ALL TO neondb_owner USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
