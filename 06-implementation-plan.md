# Implementation Plan

Build the posting engine first and the screens second. If journal posting works by about 14:00 IST on Oct 31, everything else is repetition of the same pattern.

The schedule is in IST, includes five hours of sleep, and targets a submission at 08:00 IST on Nov 1. That leaves four and a half hours of buffer before the 12:29 PM IST deadline (11:59 PM PT, Oct 31).

## Timeline

| Phase | When (IST) | Build | Gate to move on |
| --- | --- | --- | --- |
| 0. Setup and spike | Sat Oct 31, 00:30 to 01:30 | Appwrite Cloud project, public GitHub repo, Next.js scaffold, docs saved in `/docs`, Antigravity ground rules, the four-point API spike below | A transaction with a create and an increment commits from code |
| 1. Schema, auth, company | 01:30 to 04:00 | `appwrite.json` with all ten tables, push with the CLI, sign up and sign in, onboarding creates the team, company row, counters and template accounts | A new user lands on an empty dashboard with 21 accounts |
| Sleep | 04:00 to 09:00 | | |
| 2. Ledger core | 09:00 to 14:00 | Validator with unit tests, `/api/journal/post`, accounts page, journal list, new entry form with live difference indicator, entry detail, void by reversal | An unbalanced entry is rejected; a balanced one changes two account balances; void restores them |
| 3. Invoices and dashboard | 14:00 to 19:00 | Contacts, invoice editor, auto-posting, payment drawer, dashboard KPIs, Realtime subscription | Invoice then payment leaves Receivable at zero; a second browser window updates live |
| 4. Reports and trust features | 19:00 to 23:00 | Trial balance, profit and loss, balance sheet, general ledger, audit log, integrity check, demo data seeder | Trial balance totals match on seeded data |
| Break | 23:00 to 00:00 | | |
| 5. Polish | Sun Nov 1, 00:00 to 04:00 | Empty states, skeletons, toasts, responsive layout, CSV export, fix the bug list | Full demo script runs without a surprise |
| 6. Ship | 04:00 to 08:00 | README, deploy (optional), record the 2 to 3 minute video, make the repo public, submit | Submission confirmed on the dashboard by 08:00 |

**Cut line:** if phase 3 is not done by 19:00, drop the balance sheet and general ledger. If phase 2 is not done by 14:00, drop invoices and demo the journal engine alone. A smaller app that works beats a bigger one that doesn't.

## Phase 0 checklist

1. Create a project at [cloud.appwrite.io](https://cloud.appwrite.io), copy the endpoint and project id, and add a Web platform for `localhost` in the console.
2. Install the CLI, log in, then `appwrite init project` and `appwrite init tables`. Later, `appwrite push tables` creates the schema from `appwrite.json`.
3. `git init`, make the GitHub repo public, and commit the scaffold today so the history proves the code is new.
4. Put these documents in `/docs` in the repo so Antigravity can read them.
5. **API spike (30 minutes), four points to confirm:**
   - (a) A client-side `createRow` with a team permission works.
   - (b) `createTransaction`, `createOperations` with a create plus an increment, and a commit all succeed.
   - (c) A Realtime subscription on a table fires when a row changes; note the exact channel string.
   - (d) Whether a `bulkCreate` counts as one operation or many toward the 100 limit.

   Write the results into `/docs/spike.md`.

## Suggested repo layout

```
ledgerlite/
  docs/                      # these documents + spike.md
  appwrite.json              # schema as code
  src/
    app/                     # Next.js routes (login, onboarding, journal, invoices, reports, ...)
    app/api/journal/post/    # posting route handler
    app/api/invoices/        # invoice post + payment route handlers
    lib/appwrite/            # client and server SDK setup
    lib/ledger/validate.ts   # pure validators (tested)
    lib/ledger/post.ts       # transaction posting routine
    lib/ledger/reports.ts    # trial balance, P&L, balance sheet, general ledger
    lib/money.ts             # minor units <-> display
    components/              # UI components
  scripts/seed.ts            # demo data
  .env.example
  README.md
```

## Antigravity ground rules

Paste this at the start of each session or save it as the project's rules file:

- Read `/docs` first. Do not invent tables, columns or routes that are not in the schema.
- Use the TablesDB API (`tablesDB.createRow`, `createTransaction`, `incrementRowColumn`), never the legacy Databases API. When unsure of an Appwrite method, check appwrite.io/docs or the Appwrite MCP server instead of guessing.
- Money is an integer in minor units. No floats for money anywhere; format only when displaying.
- Every ledger write goes through `lib/ledger/post.ts`, which uses a transaction. UI components never write journal lines directly.
- Server routes authenticate with the caller's JWT. No API key in the app.
- Validators are pure functions with Vitest tests.
- Commit after each working slice with a clear message.

## Prompts by phase

| Phase | Prompt to give Antigravity |
| --- | --- |
| 1 | "Read /docs. Generate appwrite.json for the ten tables in the schema section with the listed columns, indexes and permissions. Then build sign-in, sign-up and an onboarding page that creates an Appwrite team, a companies row with the same id, two counters rows, and the 21 template accounts." |
| 2 | "Implement lib/ledger/validate.ts and tests, then lib/ledger/post.ts and POST /api/journal/post exactly as in the TRD posting steps 1 to 8. Then the Journal list, New entry form with a live difference indicator, and Entry detail with a Void button that posts a reversal entry." |
| 3 | "Add contacts and the invoice editor. Saving an invoice posts one transaction containing the invoice, its items, its journal entry and the balance updates: Debit Receivable, Credit Revenue, Credit Tax payable. Add a Record payment drawer: Debit Bank, Credit Receivable, update paidMinor and status." |
| 3 | "Build the dashboard KPIs from account balances and subscribe to Realtime so they refresh when journalEntries changes." |
| 4 | "Build the trial balance and balance sheet from accounts.balanceMinor, and profit and loss and the general ledger from journalLines filtered by entryDate, paginating with cursors. Add the audit log page, an integrity check that rebuilds balances from lines and compares, and a seeder that posts about 40 realistic entries." |
| 5 | "Review every screen for empty, loading and error states; make it responsive; add CSV export to the report tabs." |

## Per-phase test checks

- **Phase 1:** sign up a second user in a private window; confirm they cannot read the first user's company rows.
- **Phase 2:** post one balanced and one unbalanced entry; confirm both account balances move together and a failed post changes nothing.
- **Phase 3:** open two browser windows; post in one and watch the other update.
- **Phase 4:** run the integrity check after seeding; it must report all accounts matching.
- **Phase 5:** run the full demo script from the checklist twice without touching the code.
