# Design Document: Mobile-UI/UX Best Practices (Gasoline Web)

## 1. Mobile-First & Ergonomic Design Principles

- **Thumb Zone Optimization:** Primary interactive elements (action buttons, form inputs, primary tab switches) are placed within the natural "thumb zone" at the bottom half of the screen.
- **Max Width Container:** On larger screens or tablets, the app is constrained to a mobile-like frame (`max-w-md mx-auto`) to maintain optimal mobile UX ergonomics.
- **Bottom Navigation Bar:** Fixed bottom navigation (`BottomNav.tsx`) allows instant switching between Dashboard, Stock, and Finance with a single thumb tap.
- **Safe Area Insets:** The bottom navigation bar and fixed bottom components MUST include `pb-[env(safe-area-inset-bottom)]` (or equivalent safe-area padding) to prevent overlaps with native device home indicators on bezel-less displays (iOS/Android).

## 2. Typography & Readability

- **Font Stack:** Clean, system-native sans-serif fonts optimized for fast rendering on mobile browsers.
- **Data Hierarchy:** Financial figures (Omset, Net Profit) use bold, high-contrast typography with clear currency formatting (`Rp`).
- **Touch Targets:** Minimum touch target size of 48x48px for all interactive buttons and inputs to prevent mis-taps in outdoor lighting conditions.

## 3. Keyboard & Form Input Optimization

- **Volume & Decimal Inputs:** Liter volume and measurement input fields MUST use `inputmode="decimal"` and `type="text"` to trigger decimal-only numeric pads on mobile browsers (allowing commas/dots for e.g. `12.5` Liters).
- **Price & Integer Inputs:** Currency/IDR fields MUST use `inputmode="numeric"` to trigger standard numeric pads.
- **Auto-Focus Prevention:** Do not trigger auto-focus on input fields during screen navigation to avoid unexpected keyboard overlaps.

## 4. Color Palette & Visual Feedback

- **Color Theme:** Industrial yet modern color scheme tailored for retail/fuel operations:
  - Primary: Deep amber/orange or fuel-station blue for primary actions.
  - Success/Profit: Soft emerald green (`#10B981`) for positive margins and net income.
  - Warning/Cost: Muted slate or warm gray for modal/capital summaries.
  - Background: Clean off-white / light neutral (`#F8FAFC`) to reduce eye strain under direct sunlight.
- **Synchronized Status States:**
  - `Online`: Silent indicator (green dot or sync status banner).
  - `Offline (Local Storage)`: Persistent header banner warning operator that inputs are stored in local IndexedDB only.
  - `Syncing`: Spinning loader or indicator showing records are uploading.
  - `Sync Failed`: Red alert option offering manual retry when connection resets.

## 5. Accessibility & Performance

- **ARIA Semantics:** Visual icons on the `BottomNav` and visual status symbols MUST feature descriptive `aria-label` attributes (e.g. `aria-label="Stock Page"`, `aria-label="Network Status: Offline"`).
- **List Optimization:** Daily transaction logs and stock histories MUST use list virtualizers or lazy pagination to prevent memory overhead and DOM jank during long scrolls on low-end devices.
- **PWA install prompt:** `manifest.json` + Service Worker configuration for native app-like launch from the mobile home screen.
