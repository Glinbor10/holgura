# Holgura

Personal app to track your monthly payroll, fixed and variable expenses, and how much you can
spend and save. Android-first, local-first: all data lives on the phone and works offline.

License: [PolyForm Noncommercial 1.0.0](../LICENSE). Commercial use needs the author's permission.

## Stack

React + TypeScript + Vite, MUI, React Router (data router), Capacitor (Android), SQLite plugin,
Vitest.

## Develop

```bash
npm install
npm run dev      # browser; data is kept in localStorage
npm test         # domain and data-layer tests
npm run build
```

Business rules live in `src/domain` as pure functions (balances, payroll split, closing,
recurring expenses, savings, pace). Persistence is in `src/data` (a `Repository` port with SQLite
on Android and localStorage in the browser).

## Build the APK

The easy way is GitHub Actions (see the root README and `docs/SIGNING.md`).

Locally you need Android Studio (Android SDK + JDK 21):

```bash
npm run build
npx cap sync android
npx cap open android   # Build > Build APK(s)
```

The app requests no Android permissions (it never uses the network). **Never commit the signing
keystore or its passwords.**

## Backups

Data is only on the phone. Use Settings > Export backup regularly (a JSON file you can send to
Drive, email, etc.) and Import backup to restore it on a new device.
