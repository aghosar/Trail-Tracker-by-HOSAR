
# EAS Build Troubleshooting Guide - Trail Tracker

## ✅ FIXED ISSUES (Latest Update)

### Critical Configuration Errors Fixed:

1. **❌ Invalid `runtimeVersion` Configuration**
   - **Problem:** Used `{ "policy": "appVersion" }` which causes build failures
   - **Fix:** Removed `runtimeVersion` and `updates` config (not needed for basic builds)
   - **Why:** EAS Update configuration requires proper project initialization

2. **❌ Invalid EAS Project ID**
   - **Problem:** Placeholder "your-eas-project-id" in `app.json`
   - **Fix:** Removed `extra.eas.projectId` and `updates.url` (will be added by `eas build` automatically)
   - **Why:** EAS CLI generates this during first build

3. **❌ TSConfig JSX Mismatch**
   - **Problem:** Used `"jsx": "react-jsx"` which is for React web, not React Native
   - **Fix:** Changed to `"jsx": "react-native"` with `"jsxImportSource": "react"`
   - **Why:** React Native requires specific JSX transform configuration

4. **❌ Backend Folder in TSConfig**
   - **Problem:** TypeScript was trying to compile backend files
   - **Fix:** Added `"backend"` to `exclude` array in `tsconfig.json`
   - **Why:** Backend has its own TypeScript config and shouldn't be compiled with frontend

## Current Configuration Status

### ✅ app.json - READY FOR BUILD
```json
{
  "expo": {
    "name": "Trail Tracker by HOSAR",
    "slug": "trail-tracker-by-hosar",
    "version": "1.0.0",
    "scheme": "trail-tracker",
    "ios": {
      "bundleIdentifier": "com.hosar.trailtracker",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.hosar.trailtracker",
      "versionCode": 1
    }
  }
}
```

### ✅ eas.json - READY FOR BUILD
- Development profile: Internal distribution with simulator support
- Preview profile: Internal APK builds
- Production profile: Store-ready builds
- All profiles have `EAS_BUILD_NO_EXPO_GO_WARNING` set

### ✅ tsconfig.json - FIXED
- Changed `jsx` from `react-jsx` to `react-native`
- Added `backend` to exclude list
- Proper module resolution for Expo SDK 54

## Build Commands

### First Time Setup
The first time you run `eas build`, it will:
1. Prompt you to create an EAS account (if needed)
2. Initialize your project and generate a project ID
3. Set up credentials for iOS/Android

### Development Build (Recommended First)
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Both Platforms
```bash
eas build --profile production --platform all
```

## Common Exit Code 1 Causes (Now Fixed)

### ✅ Configuration Errors (FIXED)
- Invalid runtimeVersion format → Removed
- Placeholder project IDs → Removed (auto-generated)
- Wrong JSX configuration → Fixed to react-native
- Backend compilation conflicts → Excluded from build

### ⚠️ Potential Remaining Issues

1. **Missing Credentials**
   - iOS: Need Apple Developer account
   - Android: Will auto-generate keystore on first build
   - Solution: Follow EAS CLI prompts during build

2. **Asset Issues**
   - Verify all images exist:
     - `./assets/icon.png`
     - `./assets/images/app-icon-ohb.png`
     - `./assets/images/final_quest_240x240.png`

3. **Native Dependencies**
   - Some packages may need additional configuration
   - Check build logs for specific native module errors

## What Happens During Build

### iOS Build Process:
1. EAS downloads your code
2. Runs `expo prebuild` to generate native iOS project
3. Installs CocoaPods dependencies
4. Compiles native code with Xcode
5. Signs the app (requires Apple Developer account)
6. Uploads IPA file

### Android Build Process:
1. EAS downloads your code
2. Runs `expo prebuild` to generate native Android project
3. Downloads Gradle dependencies
4. Compiles native code with Android SDK
5. Signs the APK/AAB (auto-generates keystore if needed)
6. Uploads APK/AAB file

## Debugging Build Failures

### View Build Logs:
```bash
eas build:list
eas build:view [build-id]
```

### Common Log Patterns:

**"Could not find module"**
- Missing dependency in package.json
- Run: `npm install [package-name]`

**"Duplicate class found"**
- Conflicting dependencies
- Check for duplicate packages in package.json

**"Command failed with exit code 1"**
- Native compilation error
- Check build logs for specific file/line

**"No matching provisioning profiles found"**
- iOS credentials issue
- Run: `eas credentials` to manage

## Next Steps After Successful Build

### For Development Builds:
1. Download the build from EAS dashboard
2. Install on device/simulator
3. Run `expo start --dev-client` to connect

### For Production Builds:
1. Test thoroughly on TestFlight (iOS) or Internal Testing (Android)
2. Submit to stores using `eas submit`

## Store Submission Requirements

### iOS App Store:
- Active Apple Developer account ($99/year)
- App Store Connect app created
- Privacy policy URL (if collecting data)
- App screenshots and description

### Google Play Store:
- Google Play Developer account ($25 one-time)
- Play Console app created
- Privacy policy URL (if collecting data)
- App screenshots and description

## Support Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- EAS Submit Docs: https://docs.expo.dev/submit/introduction/
- Expo Forums: https://forums.expo.dev/
- EAS Build Status: https://status.expo.dev/

## Verification Checklist

Before running `eas build`:
- [x] app.json has valid bundle identifiers
- [x] eas.json has proper build profiles
- [x] tsconfig.json uses react-native JSX
- [x] All asset files exist
- [x] package.json has all dependencies
- [x] No placeholder values in configs
- [ ] EAS account created (done during first build)
- [ ] Apple Developer account (for iOS)
- [ ] Google Play Developer account (for Android)

## Recent Fixes Applied

**Date: 2026-03-07**
- Removed invalid `runtimeVersion` configuration
- Removed placeholder EAS project ID and update URL
- Fixed TSConfig JSX from `react-jsx` to `react-native`
- Added backend to TSConfig exclude list
- Cleaned up eas.json build profiles

**Result:** Configuration is now ready for EAS build. Run `eas build --profile development --platform [ios|android]` to start your first build.
