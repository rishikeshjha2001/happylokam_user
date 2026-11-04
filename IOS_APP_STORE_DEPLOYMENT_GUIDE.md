# 🍏 HappyLokam iOS App Store Deployment Guide

Complete step-by-step guide to configure, build, archive, and upload both the **HappyLokam User App** and **HappyLokam Partner App** to Apple App Store & TestFlight using **Xcode** and your **Apple Developer Account**.

---

## 📋 1. App Identifiers & Credentials Summary

| App | Bundle Identifier | Version Name | Build Number (Version Code) | Xcode Workspace File |
| :--- | :--- | :---: | :---: | :--- |
| **User App** | `com.happylokam.app` | `14.0.12` | `136` | `ios/happylokam.xcworkspace` |
| **Partner App** | `com.happylokam.partner` | `1.0.30` | `30` | `ios/happylokampartner.xcworkspace` |

---

## 🛠️ 2. Mac Prerequisites

On your Mac, ensure you have:
1. **macOS** with **Xcode 15 or 16** installed from the Mac App Store.
2. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **Node.js** (v18+ or v20+ recommended) and **CocoaPods**:
   ```bash
   # Verify node and npm
   node -v
   npm -v

   # Install CocoaPods if not installed
   sudo gem install cocoapods
   # Or using Homebrew:
   # brew install cocoapods
   ```

---

## 🚀 3. Clone Repository & Install Pods

### For User App:
```bash
# Clone the repository
git clone https://github.com/rishikeshjha2001/happylokam_user.git
cd happylokam_user

# Install JavaScript dependencies
npm install

# Install iOS native CocoaPods
cd ios
pod install
cd ..
```

### For Partner App:
```bash
# Clone the repository
git clone https://github.com/rishikeshjha2001/happylokam_partner.git
cd happylokam_partner

# Install JavaScript dependencies
npm install

# Install iOS native CocoaPods
cd ios
pod install
cd ..
```

> [!IMPORTANT]
> **Always open `.xcworkspace`, NEVER `.xcodeproj`!**
> CocoaPods links dependencies through the workspace file. Opening `.xcodeproj` directly will cause header and linker errors.

---

## 🔐 4. Apple Developer Portal Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/account).
2. Under **Certificates, Identifiers & Profiles** > **Identifiers**:
   * Click **`+`** > **App IDs** > **App**.
   * **Description**: `HappyLokam User App` (or `HappyLokam Partner App`).
   * **Bundle ID**: Select **Explicit** and enter:
     * User App: `com.happylokam.app`
     * Partner App: `com.happylokam.partner`
   * Enable any required capabilities (e.g. **Push Notifications**).
   * Click **Continue** > **Register**.

---

## 🌐 5. App Store Connect App Registration

1. Go to [App Store Connect](https://appstoreconnect.apple.com).
2. Go to **My Apps** > Click **`+`** > **New App**.
3. Fill in details:
   * **Platforms**: iOS
   * **Name**: `HappyLokam` (or `HappyLokam Partner`)
   * **Primary Language**: English (US / India)
   * **Bundle ID**: Choose `com.happylokam.app` or `com.happylokam.partner`
   * **SKU**: `happylokam-user` or `happylokam-partner`
   * **User Access**: Full Access
4. Click **Create**.

---

## 🖥️ 6. Xcode Configuration & Signing

1. Open the project in Xcode:
   ```bash
   # For User App:
   open ios/happylokam.xcworkspace

   # For Partner App:
   open ios/happylokampartner.xcworkspace
   ```
2. **Sign In with your Apple ID**:
   * In Xcode, go to top menu **Xcode** > **Settings** (or **Preferences**) > **Accounts**.
   * Click **`+`** > **Apple ID** > Sign in with your Apple Developer credentials.
3. **Configure Automatic Signing**:
   * In the left Project Navigator, select the root project (`happylokam` or `happylokampartner`).
   * In the main area, select the **Target** (`happylokam` or `happylokampartner`).
   * Go to the **Signing & Capabilities** tab.
   * Check **"Automatically manage signing"**.
   * In **Team**, select your Apple Developer account / Team from the dropdown.
   * Verify **Bundle Identifier**:
     * User App: `com.happylokam.app`
     * Partner App: `com.happylokam.partner`
   * Verify Xcode displays: `Provisioning Profile: Xcode Managed Profile` with a green checkmark.

---

## 📦 7. Build and Archive for App Store

1. In the top toolbar of Xcode, set the build destination to **Any iOS Device (arm64)**:
   * Click on the device dropdown (next to the play/stop buttons) and select:
     `Any iOS Device (arm64)`
   *(Do NOT select an iPhone Simulator, as simulator builds cannot be uploaded to App Store)*.
2. From the top menu, click **Product** > **Archive**.
3. Xcode will now build, compile, and bundle your app. This typically takes 3–5 minutes.
4. Once completed, the **Organizer** window will automatically open with your newly generated Archive.

---

## ☁️ 8. Upload to App Store Connect / TestFlight

1. In the **Organizer** window, select your build from the list.
2. Click the blue **Distribute App** button on the right side.
3. Select **App Store Connect** > Click **Next**.
4. Select **Upload** (sends directly to Apple) > Click **Next**.
5. Leave the default distribution options checked:
   * `✓ Strip Swift symbols`
   * `✓ Upload your app's symbols to receive symbolicated crash logs from Apple`
   * Click **Next**.
6. Select **Automatically manage signing** > Click **Next**.
7. Review the app summary and click **Upload**.
8. Xcode will upload the build to App Store Connect. You will see:
   > **"Upload Succeeded"** 🎉

---

## 📱 9. Test on TestFlight & Submit for Review

1. Go to [App Store Connect](https://appstoreconnect.apple.com) > your app > **TestFlight** tab.
2. Within 10–15 minutes, Apple will finish processing the build.
3. If Apple asks: *"Does this app use encryption?"*, select **No** (already pre-configured with `ITSAppUsesNonExemptEncryption: false`).
4. **Internal Testing**: Add internal testers (email addresses) to test the app live on physical iPhones via Apple's **TestFlight** app.
5. **App Store Release Submission**:
   * Go to the **App Store** tab.
   * Under **Build**, click **`+`** and choose the uploaded build (`136` for User, `30` for Partner).
   * Fill in:
     * App description & keywords.
     * Support URL: `https://happylokam.com/contact`
     * Privacy Policy URL: `https://happylokam.com/privacy-policy`
     * App screenshots for 6.7" (iPhone 15/16 Pro Max) and 6.5" displays.
   * Click **Save** and **Submit for Review**.

---

## ⚡ 10. Alternative: EAS Cloud Build (No Mac Required)

If you ever want to build and submit without manually opening Xcode:
```bash
# Login to Expo EAS
npx eas-cli login

# Build & upload directly to Apple Cloud:
npx eas-cli build --platform ios --profile production --auto-submit
```
EAS Cloud will handle certificates, compile on Apple Silicon in the cloud, and upload directly to App Store Connect!
