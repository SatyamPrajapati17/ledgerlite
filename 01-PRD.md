# PRD: LedgerLite (Product Requirements)

LedgerLite gives a small company books that cannot go out of balance: every business event becomes a balanced journal entry, saved all-or-nothing, and the reports update live. "LedgerLite" is a working name.

## Problem and users

Small companies keep accounts in spreadsheets, where one typo breaks totals and nobody can see who changed what. Three roles use LedgerLite, mapped to Appwrite team roles.

| Role | What they do | Access |
| --- | --- | --- |
| Owner | Creates the company, sends invoices, reads the dashboard and reports | Everything in their company |
| Accountant | Posts journal entries, manages accounts, runs reports | Read and write, no deleting posted entries |
| Viewer | Reads reports (auditor, investor) | Read only |

## What makes it stand out

- **Balanced by construction:** a journal entry is only saved if total debits equal total credits, and its lines and account balances commit together or not at all (TablesDB transactions).
- **Immutable history:** posted entries are never edited; a mistake is fixed by a reversal entry, and every action lands in an audit log.
- **Live books:** the dashboard updates in real time when another user posts.

## Scope

| # | Feature | Priority | Done when |
| --- | --- | --- | --- |
| 1 | Sign up, create company workspace | Must | A new user lands in an empty company dashboard |
| 2 | Chart of accounts from a template (about 21 accounts), add, rename, deactivate | Must | Template loads in one click |
| 3 | Manual journal entry with two or more lines | Must | Unbalanced entry is rejected; balanced one posts and changes account balances |
| 4 | Sales invoice with line items and tax, auto-posted | Must | Invoice creates Debit Receivable, Credit Revenue, Credit Tax payable |
| 5 | Record a payment against an invoice | Must | Invoice status moves to partial or paid; Debit Bank, Credit Receivable |
| 6 | Reports: trial balance, profit and loss (date range), balance sheet, general ledger | Must | Trial balance debits equal credits on seeded data |
| 7 | Dashboard with cash, receivables, month revenue and expenses, recent entries | Must | Updates without refresh when an entry is posted |
| 8 | Audit log of every post, void and edit | Must | Visible list, append-only |
| 9 | Void entry by reversal | Must | Creates an opposite entry linked to the original |
| 10 | Demo data seeder | Must | One button fills a realistic month of activity for the video |
| 11 | Purchase bills and vendor payments | Should | Same flow as sales, mirrored |
| 12 | Contacts (customers, vendors) | Should | Pick a contact on an invoice |
| 13 | Invite an accountant or viewer by email | Should | New member sees the company with the right role |
| 14 | CSV export of reports | Should | Downloads the shown table |
| 15 | Receipt or invoice attachment (Appwrite Storage) | Stretch | File linked to an entry |
| 16 | AI category suggestion for an entry description | Stretch | Suggests an account; user confirms |

**Out of scope:** payroll, tax filing, bank feeds, inventory, true multi-currency.

## Success criteria

- A 2 to 3 minute video can show: create company, load template, post an invoice, record a payment, see a balanced trial balance, watch the dashboard update live, and see an unbalanced entry rejected.
- Trial balance is balanced after every action in the demo.
- A first-time viewer understands the app without explanation.

## Mapping to the judging criteria

| Criterion | Evidence to show |
| --- | --- |
| Idea and innovation | Books that cannot be unbalanced, immutable entries corrected by reversal, live dashboard |
| Technical execution | Transactions with conflict retry, tested validators, integrity check that rebuilds balances, schema as code |
| Design and experience | Live difference indicator, empty and loading states, consistent number formatting, responsive layout |
| Usage of Appwrite Databases | Multi-table transactions, atomic increments for balances and counters, row-level permissions by team role, unique, composite and fulltext indexes, Realtime, CLI schema push |
