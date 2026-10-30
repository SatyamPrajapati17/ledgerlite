# Contributing to LedgerLite

Thank you for your interest in contributing to LedgerLite!

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/ledgerlite.git
   cd ledgerlite
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and add your Appwrite Cloud project credentials:
   ```bash
   cp .env.example .env.local
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

- Maintain strict double-entry ledger invariants: every journal entry must balance ($\sum \text{Debits} = \sum \text{Credits}$).
- Store money values strictly in integer minor units (`bigint` or minor unit numbers in cents/paise).
- Preserve the Neo-Brutalist design language (`brutal-red`, `brutal-yellow`, `brutal-black`, `brutal-white`, high contrast borders and shadows).
- Run `npm run build` prior to submitting a Pull Request to ensure zero TypeScript or build errors.

## Pull Requests

1. Create a feature branch: `git checkout -b feat/your-feature-name`.
2. Commit your changes with clear, descriptive messages: `git commit -m "feat: add invoice pdf export"`.
3. Push to your branch: `git push origin feat/your-feature-name`.
4. Open a Pull Request targeting `main`.
