# The database

**The real schema history lives in the Supabase project, not in this folder.**

That is worth knowing before you trust anything in here.

## What happened

The eleven `.sql` files now in `legacy/` were written by hand early on. Every
migration since has been applied directly against the remote database, where
Supabase records it in `supabase_migrations.schema_migrations`. As of
14 September 2026 that table holds **77 migrations**; `legacy/` accounts for
roughly the first eleven of them.

So the gap is not small:

| | in `legacy/*.sql` | in the live database |
|---|---|---|
| tables | 44 | 84 |
| migrations | ~11 | 77 |

Forty tables — courses, wardrobe, studio, money, household, the whole
`transformation_*` layer — exist only in the remote project. **This repository
cannot currently rebuild the database from scratch.** Nothing is lost while the
Supabase project exists, but the repo is not a backup of it, and it would be
easy to assume otherwise from the presence of a `supabase/` folder.

## What is in here now

- **`schema-snapshot.txt`** — every table and column in the public schema,
  names only. Checked in so `npm run check:columns` can run offline, and so
  there is *some* record of the shape of the database in version control.
- **`legacy/`** — the original hand-written files. Kept because they are real
  history, moved because leaving them at the top level made them look current.
- **`deferred/`** — untouched.

## Pulling the full history down

With the Supabase CLI and the database password (which lives in Vercel):

```bash
npx supabase login
npx supabase link --project-ref dxwkfijdoqnculclecmx
npx supabase db pull
```

That writes every one of the 77 migrations into `supabase/migrations/` and
makes this folder authoritative again. It is worth doing once.

## Why the snapshot matters day to day

The Supabase client in this app is **untyped**. `tsc --noEmit` — the gate
everything else passes through — has nothing to say about a column name that
does not exist. A real example that was live in this codebase:

```ts
.select('completed_on').gte('completed_on', from)   // the column is completed_at
```

That compiles cleanly. At runtime the query returns an error, the caller does
`?? []`, and the feature is silently empty for ever. No crash, no log, no test
failure.

`npm run check:columns` walks every `.from('table')` chain in the codebase and
checks each column against the snapshot. It catches exactly that.

```bash
npm run verify        # tsc --noEmit && check:columns
```

**After any migration that adds, renames or drops a column, refresh the
snapshot** — `npm run db:snapshot` prints the query and the steps. If you skip
it, the checker starts reporting new columns as missing, which is annoying but
safe; the dangerous direction is a column that was dropped, and the refresh is
what catches that.
