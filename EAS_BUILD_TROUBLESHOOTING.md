
# EAS Build & Submit Troubleshooting Guide

## Common Issues & Solutions

### 1. **Bundle Identifier Issues**
**Error:** "Bundle identifier is invalid" or "Package name already exists"

**Solution:**
- Changed from `com.anonymous.TrailTracker` to `com.hosar.trailtracker`
- Ensure you own this identifier in Apple Developer Portal and Google Play Console
- If you need a different identifier, update both `ios.bundleIdentifier` and `android.package` in `app.json`

### 2. **Missing EAS Project ID**
**Error:** "No project ID found"

**Solution:**
- Run: `eas init` (Note: You'll need to do this via EAS CLI if you have access)
- This will add your project ID to `app.json` under `extra.eas.projectId`

### 3. **iOS Submission Requirements**
**Errors:**
- "Missing compliance information"
- "Missing privacy policy"
- "Invalid provisioning profile"

**Solutions:**
- ✅ Set `ITSAppUsesNonExemptEncryption: false` (already configured)
- ✅ Added detailed location permission descriptions
- ⚠️ You need to configure in `eas.json` submit section:
  - `appleId`: Your Apple ID email
  - `ascAppId`: App Store Connect App ID (found in App Store Connect)
  - `appleTeamId`: Your Apple Developer Team ID

### 4. **Android Submission Requirements**
**Errors:**
- "Missing service account key"
- "Invalid package name"

**Solutions:**
- ✅ Changed package to `com.hosar.trailtracker`
- ⚠️ You need to:
  1. Create a service account in Google Play Console
  2. Download the JSON key file
  3. Update `serviceAccountKeyPath` in `eas.json`

### 5. **Version & Build Number Issues**
**Error:** "Version already exists" or "Build number must be higher"

**Solution:**
- ✅ Enabled `autoIncrement: true` in `eas.json` (already configured)
- This automatically increments build numbers
- For manual control, update `ios.buildNumber` and `android.versionCode` in `app.json`

### 6. **Asset Issues**
**Errors:**
- "Icon not found"
- "Splash screen invalid"

**Solution:**
- ✅ Verified all asset paths exist:
  - `./assets/icon.png`
  - `./assets/images/app-icon-ohb.png`
  - `./assets/images/final_quest_240x240.png`

### 7. **Scheme Configuration**
**Error:** "Invalid URL scheme"

**Solution:**
- ✅ Changed scheme from `trailtrackerbyhosar` to `trailtracker` (simpler, more standard)
- This affects deep linking and OAuth redirects

## Next Steps for Successful Build

### For iOS:
1. **Apple Developer Account Setup:**
   - Ensure you have an active Apple Developer account ($99/year)
   - Create an App ID in Apple Developer Portal with identifier: `com.hosar.trailtracker`
   - Create provisioning profiles for development and distribution

2. **App Store Connect Setup:**
   - Create a new app in App Store Connect
   - Note the App Store Connect App ID (numeric ID)
   - Update `eas.json` with your Apple ID, ASC App ID, and Team ID

3. **Build Command:**
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit Command:**
   ```bash
   eas submit --platform ios --profile production
   ```

### For Android:
1. **Google Play Console Setup:**
   - Create a Google Play Developer account ($25 one-time fee)
   - Create a new app with package name: `com.hosar.trailtracker`
   - Set up API access and create a service account
   - Download the service account JSON key

2. **Update Configuration:**
   - Place the service account JSON key in your project
   - Update `serviceAccountKeyPath` in `eas.json` to point to this file

3. **Build Command:**
   ```bash
   eas build --platform android --profile production
   ```

4. **Submit Command:**
   ```bash
   eas submit --platform android --profile production
   ```

## Configuration Changes Made

### ✅ Fixed in `app.json`:
- Changed iOS `bundleIdentifier` from `com.anonymous.TrailTracker` to `com.hosar.trailtracker`
- Changed Android `package` from `com.anonymous.TrailTracker` to `com.hosar.trailtracker`
- Simplified `scheme` from `trailtrackerbyhosar` to `trailtracker`
- Added explicit `buildNumber` (iOS) and `versionCode` (Android)
- Enhanced location permission descriptions
- Added `NSLocationAlwaysUsageDescription` for iOS
- Added `ACCESS_BACKGROUND_LOCATION` permission for Android
- Enabled background location in expo-location plugin

### ✅ Fixed in `eas.json`:
- Added `submit` configuration section
- Added iOS submission placeholders (appleId, ascAppId, appleTeamId)
- Added Android submission placeholders (serviceAccountKeyPath, track)
- Configured production build settings for both platforms

## Common Exit Code 1 Errors

**Exit code 1** typically means:
1. **Build failed during compilation** - Check build logs for specific errors
2. **Missing credentials** - Ensure Apple/Google credentials are configured
3. **Invalid configuration** - Verify all paths and identifiers are correct
4. **Asset issues** - Ensure all referenced assets exist
5. **Dependency conflicts** - Check for incompatible package versions

## Verification Checklist

Before submitting again:
- [ ] EAS project initialized (`eas init`)
- [ ] Apple Developer account active (for iOS)
- [ ] Google Play Developer account active (for Android)
- [ ] Bundle identifiers registered in respective portals
- [ ] Service account key created and configured (Android)
- [ ] Apple ID, ASC App ID, and Team ID configured (iOS)
- [ ] All asset files exist at specified paths
- [ ] Version numbers are higher than previous submissions
- [ ] Location permissions properly described
- [ ] Privacy policy URL added (if required by stores)

## Getting More Information

To see detailed build logs:
```bash
eas build:list
eas build:view [build-id]
```

The build logs will show the exact error that caused exit code 1.

## Contact & Support

If you continue to experience issues:
1. Check the detailed build logs in EAS dashboard
2. Verify all credentials are correctly configured
3. Ensure bundle identifiers are registered and available
4. Review Apple/Google submission guidelines for any policy violations
