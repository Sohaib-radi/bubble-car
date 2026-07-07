# Black Bubble Wash — React Native (Expo) app

Real React Native screens generated 1:1 from the Black Bubble Wash design mockup —
same colors, gradients, spacing, and copy, built with actual native components
(no HTML/CSS) so it runs on iOS/Android via Expo.

## Screens
- `SplashScreen` — logo + CTA
- `LoginScreen` — phone + password sign in
- `RegisterScreen` — name / phone / address / password
- `HomeScreen` — greeting, VIP points card, upcoming booking, services grid, bottom nav
- `BookScreen` — vehicle, service picker, date/time grid, sticky total + confirm
- `ConfirmedScreen` — success state, booking summary, status timeline
- `HistoryScreen` — stats, filters, wash history list, bottom nav
- `ProfileScreen` — profile card, stats, settings menu, log out, bottom nav

## Setup

```bash
cd react-native
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a simulator.

## Structure

```
react-native/
  App.tsx                  # lightweight state-based screen switcher (swap for
                            # React Navigation's native-stack + bottom-tabs if you want
                            # deep linking / native transitions)
  src/theme.ts              # colors, gradients, radii, spacing, fonts — single source of truth
  src/components/
    GoldButton.tsx           # primary CTA (gold gradient button), reused everywhere
    BottomNav.tsx             # shared bottom tab bar (Home / Book / History / Profile)
  src/screens/
    SplashScreen.tsx
    LoginScreen.tsx
    RegisterScreen.tsx
    HomeScreen.tsx
    BookScreen.tsx
    ConfirmedScreen.tsx
    HistoryScreen.tsx
    ProfileScreen.tsx
  assets/logo.png
```

## Notes / next steps
- Navigation is intentionally minimal (local state in `App.tsx`) so you can drop it
  straight into a real project. Swap in `@react-navigation/native-stack` +
  `@react-navigation/bottom-tabs` for real transitions, deep linking, and back-gesture support.
- Icons use `@expo/vector-icons` (Feather set) — closest match to the thin line icons
  in the mockup. Swap for a custom icon set if the brand has one.
- Font is Manrope via `@expo-google-fonts/manrope`, matching the web design.
- All screens are functional components with local `useState` for form/selection state —
  wire them up to your real API / auth / booking backend.
- The phone mockup frame, status bar, and notch from the design are NOT included —
  those were mockup-only chrome. Real devices render their own status bar
  (`expo-status-bar` is already wired with `style="light"`).
