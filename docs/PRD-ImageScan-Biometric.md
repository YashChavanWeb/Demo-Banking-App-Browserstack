# Product Requirements Document
## Image Scan (Liveness / KYC) & Biometric Authentication
**App:** BrowserStack Bank (Demo Banking App)
**Version:** 1.0
**Date:** 2025
**Status:** Draft

---

## 1. Overview

This PRD covers two security verification features in the BrowserStack Bank app:

1. **Image Scan** — a two-part identity verification flow consisting of a **Video Liveness Check** (Step 3 of 5) followed by a **KYC Document Upload** (Step 5 of 5), used exclusively during new user signup.
2. **Biometric Authentication** — fingerprint / Face ID verification (Step 4 of 5 during signup; standalone gate during login), used to confirm user identity before granting access to the banking dashboard.

Both features are part of the 5-step signup onboarding flow and are also invoked independently during login.

---

## 2. User Flows

### 2.1 Signup Onboarding (5-Step Flow)

```
Step 1: Enter credentials (email + password)
Step 2: OTP verification (6-digit code)
Step 3: Video Liveness Check        ← Image Scan (Part 1)
Step 4: Biometric Registration      ← Biometric
Step 5: KYC Document Upload         ← Image Scan (Part 2)
        ↓
    Banking Home
```

### 2.2 Login Flow

```
Enter credentials → OTP → Biometric Verification → Banking Home (or Admin)
```

### 2.3 Flow Config Gates

The `AuthStore.getFlowConfig()` object controls which steps are active:

| Config Flag        | Controls                                      |
|--------------------|-----------------------------------------------|
| `cameraInjection`  | Whether Liveness screen is shown (Step 3)     |
| `fileUpload`       | Whether KYC screen is shown (Step 5)          |

If `cameraInjection` is `false`, the app skips directly to `/biometric`.
If `fileUpload` is `false`, the app auto-marks KYC complete and routes to `/(banking)/home`.

---

## 3. Feature: Video Liveness Check (Image Scan — Part 1)

### 3.1 Purpose
Verify that the person signing up is physically present (anti-spoofing) by recording an 8-second front-camera video and detecting open eyes via `expo-face-detector`.

### 3.2 Screen: `/liveness`

#### States
| Phase       | Description                                                  |
|-------------|--------------------------------------------------------------|
| `ready`     | Camera preview shown; "Start Verification" button active     |
| `recording` | 8-second countdown; periodic face snapshots every 800ms      |
| `done`      | Liveness verified; "Continue to Biometric Setup" shown       |
| `retry`     | Eyes not detected for >2s; error state with "Try Again"      |

#### Camera Permissions
- If permission not yet requested → request on "Start Verification" tap.
- If permission denied → show "Camera Access Required" screen with "Grant Camera Access" and "Skip this step" buttons.

#### Face Detection Logic
- Snapshots taken every **800ms** using `CameraView.takePictureAsync`.
- `expo-face-detector` checks `leftEyeOpenProbability` and `rightEyeOpenProbability` (threshold > 0.3).
- If no eyes detected for **2 seconds** → transition to `retry` phase.
- Fallback (no native face detector): camera snapshot success = user present.

#### Eye Detection Feedback
- "Eyes detected ✓" badge overlaid on camera frame when eyes confirmed.
- Recording label updates: `✓ Eyes detected · Xs remaining` vs `Scanning... Xs`.

#### Skip Option
- Available on: permission-denied screen, recording screen, retry screen.
- Navigates to `/biometric` (proceeds to Step 4).

#### testIDs
| Element                  | testID                    |
|--------------------------|---------------------------|
| Camera view              | `liveness-camera-view`    |
| Start Verification btn   | `start-verification-btn`  |
| Continue btn (done)      | `continue-btn`            |
| Retry btn                | `retry-btn`               |
| Skip btn                 | `skip-liveness-btn`       |

### 3.3 Acceptance Criteria
- [ ] Camera preview renders when permission is granted.
- [ ] Countdown runs from 8 to 0 during recording.
- [ ] "Eyes detected ✓" badge appears when face is in frame.
- [ ] After 8s with eyes detected → `done` phase → "Video Verified Successfully".
- [ ] If eyes lost for 2s → `retry` phase → "Eyes Not Detected" error.
- [ ] "Try Again" resets to `ready` phase.
- [ ] "Skip this step" navigates to `/biometric` from any phase.
- [ ] Camera permission denial shows the permission-request screen.
- [ ] Step badge reads "Step 3 of 5 — Liveness Check".

---

## 4. Feature: Biometric Authentication (Image Scan — Part 2 / Login Gate)

### 4.1 Purpose
Use the device's native biometric hardware (fingerprint sensor / Face ID) to register or verify the user's identity. No biometric data leaves the device.

### 4.2 Screen: `/biometric`

#### Modes
| Mode    | Trigger                        | Subtitle text                                          |
|---------|--------------------------------|--------------------------------------------------------|
| Signup  | `AuthStore.getFlow() === 'signup'` | "Register your fingerprint to secure your account" |
| Login   | All other flows                | "Confirm your identity to access your account"         |

#### States
| State      | UI                                                        |
|------------|-----------------------------------------------------------|
| `idle`     | Fingerprint icon; "Tap to scan fingerprint"               |
| `scanning` | Activity spinner; button disabled                         |
| `success`  | Green checkmark; "Identity Verified!"; auto-navigate 700ms|
| `error`    | Red X icon; error message; "Try Again" button             |

#### Authentication
- Uses `expo-local-authentication.authenticateAsync` with:
  - `promptMessage`: "Verify your identity to continue"
  - `fallbackLabel`: "Use Passcode"
  - `cancelLabel`: "Cancel"
  - `disableDeviceFallback`: false (passcode fallback allowed)

#### Post-Success Navigation
| Condition                              | Destination              |
|----------------------------------------|--------------------------|
| Signup flow + `fileUpload` enabled     | `/kyc`                   |
| Signup flow + `fileUpload` disabled    | `/(banking)/home`        |
| Login flow + admin role                | `/(admin)/users`         |
| Login flow + regular user              | `/(banking)/home`        |

#### testIDs
| Element              | testID            |
|----------------------|-------------------|
| BrowserStack logo    | `bs-logo-bio`     |
| Fingerprint circle   | `fingerprint-btn` |
| Scan button          | `scan-btn`        |
| Error message        | `bio-error`       |

### 4.3 Acceptance Criteria
- [ ] Tapping fingerprint circle or "Scan Fingerprint" triggers native biometric prompt.
- [ ] Spinner shown during scanning; button disabled.
- [ ] On success → green checkmark → auto-navigate after 700ms.
- [ ] On failure → red X → error message → "Try Again" button active.
- [ ] Signup mode shows step badge "Step 4 of 5 — Biometric Registration".
- [ ] Login mode does NOT show step badge.
- [ ] Passcode fallback available via device prompt.
- [ ] "Secured by device biometrics — no data leaves your device" note visible.
- [ ] Admin users routed to `/(admin)/users` after login biometric success.

---

## 5. Feature: KYC Document Upload (Image Scan — Part 2)

### 5.1 Purpose
Collect a government-issued PDF identity document to complete Know Your Customer (KYC) compliance during signup.

### 5.2 Screen: `/kyc`

#### Document Requirements
- Government-issued photo ID (Passport, Driver's License)
- PDF format only
- Clearly legible
- Max file size: 10 MB

#### Platform Behaviour
| Platform | MIME filter                  | Reason                                      |
|----------|------------------------------|---------------------------------------------|
| iOS      | `*/*` then validate `.pdf`   | Avoid blank picker bug with `application/pdf` |
| Android  | `application/pdf`            | Direct PDF restriction                      |

#### Consent Modal
- Shown before document picker opens.
- User must accept consent before file selection proceeds.

#### Upload States
| State         | UI                                                        |
|---------------|-----------------------------------------------------------|
| No file       | Upload area with cloud icon; "Upload Identity PDF"        |
| File selected | File name, size, green checkmark; download option shown   |
| Error         | Red error text below upload area                          |

#### Download Feature
- After selecting a file, user can download/save it to device documents.
- Uses `expo-file-system` `copyAsync` to `documentDirectory`.
- Success: Alert "Download Complete — file saved to your documents."
- Failure: Alert "Download Failed — could not save the file."

#### Completion
- "Complete KYC" button calls `api.markKyc()` then routes to `/(banking)/home`.
- "Skip" button routes directly to `/(banking)/home` without marking KYC.

#### testIDs
| Element       | testID        |
|---------------|---------------|
| Upload button | `upload-btn`  |

### 5.3 Acceptance Criteria
- [ ] Step badge reads "Step 5 of 5 — KYC Verification".
- [ ] Document requirements card lists all 4 requirements.
- [ ] Tapping upload area shows consent modal first.
- [ ] Accepting consent opens the device file picker.
- [ ] Non-PDF files on iOS show validation error.
- [ ] Selected file name and size displayed after pick.
- [ ] Download button saves file and shows success alert.
- [ ] "Complete KYC" without a file shows "Please upload your identity document" error.
- [ ] "Complete KYC" with a file calls `markKyc` and navigates to home.
- [ ] "Skip" navigates to home without calling `markKyc`.
- [ ] If `fileUpload` config is false, screen is skipped automatically.

---

## 6. End-to-End Signup Flow (All Features Combined)

```
/index (login screen)
  → tap "Sign Up"
  → /signup (credentials)
  → /otp (6-digit OTP)
  → /liveness (Step 3 — camera liveness, if cameraInjection=true)
  → /biometric (Step 4 — fingerprint registration)
  → /kyc (Step 5 — PDF upload, if fileUpload=true)
  → /(banking)/home
```

---

## 7. Non-Functional Requirements

| Requirement        | Detail                                                                 |
|--------------------|------------------------------------------------------------------------|
| Privacy            | Biometric data processed on-device only; no server transmission        |
| Camera             | Front-facing camera required for liveness; graceful degradation if absent |
| Permissions        | Camera permission requested at runtime; denied state handled gracefully |
| File size          | KYC PDF capped at 10 MB                                                |
| Offline            | Biometric works offline (device-local); liveness and KYC require device storage |
| Accessibility      | All interactive elements have `testID` props for automation            |
| Error recovery     | All three screens provide retry / skip paths; no dead ends             |

---

## 8. Out of Scope

- Server-side liveness video analysis (current implementation is client-side only)
- Multi-document KYC (only one document per signup)
- Biometric re-enrollment after initial registration
- Face ID vs fingerprint differentiation in UI (handled by OS)

---

## 9. Dependencies

| Dependency                    | Usage                                      |
|-------------------------------|--------------------------------------------|
| `expo-local-authentication`   | Biometric prompt (fingerprint / Face ID)   |
| `expo-camera` / `CameraView`  | Front-camera feed for liveness             |
| `expo-face-detector`          | Eye-open probability detection (optional)  |
| `expo-document-picker`        | PDF file selection for KYC                 |
| `expo-file-system`            | Save KYC document to device storage        |
| `AuthStore`                   | Flow config, role, and flow-type gating    |
| `api.markKyc()`               | Server-side KYC completion marker          |