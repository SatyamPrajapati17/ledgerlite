# Submission Checklist

Submit by Nov 1, 08:00 IST. The form needs only a public repo link and a demo video of at most 3 minutes, so the video script and the criteria mapping below are what win points. The hard deadline is 11:59 PM PT on Oct 31 (Nov 1, 12:29 PM IST).

## Before you press Submit

- [ ] Repo is public; open it in a logged-out window to confirm
- [ ] First commit is dated Oct 19 or later, and no earlier code was copied in
- [ ] README covers what it is, setup steps, the full library list (the rules ask for it), screenshots, and a short section on how it uses TablesDB
- [ ] No secrets committed: `.env` is ignored, and only `.env.example` is in the repo
- [ ] A fresh clone runs with the README steps alone
- [ ] Demo video is 3 minutes or less and uploaded (YouTube or similar)
- [ ] Optional live link works with the demo data loaded
- [ ] Submitted through Sign in with Appwrite, then Submit project, and the dashboard shows it as received

## Demo video script (about 2:50)

| Time | Show | Say |
| --- | --- | --- |
| 0:00 to 0:20 | Title and dashboard | The problem with spreadsheet books, and that LedgerLite cannot go out of balance |
| 0:20 to 0:50 | Sign up, onboarding, load template | A company is an Appwrite team; 21 accounts in one click |
| 0:50 to 1:25 | New entry: try to post unbalanced, then fix it | The difference indicator, then the all-or-nothing transaction |
| 1:25 to 2:00 | Invoice, then payment, second window updating | Auto-posting and Realtime |
| 2:00 to 2:30 | Trial balance, integrity check, audit log, void | Immutable entries and reversals |
| 2:30 to 2:50 | Architecture diagram or the schema | Which TablesDB features did the work |

## How LedgerLite maps to the judging criteria

| Criterion | Evidence to show |
| --- | --- |
| Idea and innovation | Books that cannot be unbalanced, immutable entries corrected by reversal, live dashboard |
| Technical execution | Transactions with conflict retry, tested validators, integrity check that rebuilds balances, schema as code in `appwrite.json` |
| Design and experience | Live difference indicator, empty and loading states, consistent number formatting, responsive layout |
| Usage of Appwrite Databases | Multi-table transactions, atomic increments for balances and counters, row-level permissions by team role, unique, composite and fulltext indexes, Realtime, CLI schema push |

## README outline

1. One-line description and a screenshot
2. Why it matters (balanced by construction, immutable history, live books)
3. How it uses Appwrite TablesDB (transactions, atomic increments, permissions, indexes, Realtime)
4. Tech stack and libraries (full list)
5. Setup: create an Appwrite project, `appwrite push tables`, set `.env`, `npm install`, `npm run dev`
6. Demo data and the demo script
7. Architecture diagram (copy the Mermaid block from the TRD)
8. Limitations and what's next
