# CodePush Implementation Guide

## What is CodePush?

CodePush is a cloud service by Microsoft that enables you to deploy mobile app updates directly to users' devices without going through the App Store/Play Store review process.

### What You CAN Update with CodePush:
- JavaScript code changes
- UI/styling changes
- Bug fixes
- New features (JS only)
- Assets (images, fonts)
- Configuration changes

### What You CANNOT Update with CodePush:
- Native code changes (iOS/Android)
- New native dependencies
- App permissions
- App icons/splash screens (requires native rebuild)

## Why Use CodePush?

✅ **Instant Updates** - Push fixes and features immediately  
✅ **No App Store Review** - Bypass 1-7 day review process  
✅ **Rollback Support** - Revert bad updates instantly  
✅ **Staged Rollouts** - Test with small user groups first  
✅ **Offline Support** - Updates download in background  

## Implementation Steps

### Step 1: Install Dependencies

```bash
# Install CodePush CLI globally
npm install -g appcenter-cli

# Install CodePush SDK for React Native
npm install --save react-native-code-push

# For Expo (alternative approach)
npx expo install expo-updates
```

### Step 2: Create App Center Account

1. Go to https://appcenter.ms
2. Sign up with Microsoft, GitHub, or email
3. Create two apps:
   - `Ventry-iOS`
   - `Ventry-Android`

### Step 3: Get Deployment Keys

```bash
# Login to App Center
appcenter login

# Get iOS deployment keys
appcenter codepush deployment list -a <username>/Ventry-iOS -k

# Get Android deployment keys
appcenter codepush deployment list -a <username>/Ventry-Android -k
```

You'll get keys for:
- **Staging** - For testing
- **Production** - For live users

### Step 4: Configure Your App

#### For React Native (without Expo):

**android/app/src/main/res/values/strings.xml:**
```xml
<resources>
    <string name="app_name">Ventry</string>
    <string moduleConfig="true" name="CodePushDeploymentKey">YOUR_ANDROID_DEPLOYMENT_KEY</string>
</resources>
```

**ios/Ventry/Info.plist:**
```xml
<key>CodePushDeploymentKey</key>
<string>YOUR_IOS_DEPLOYMENT_KEY</string>
```

#### For Expo (Recommended for your app):

**app.json:**
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/YOUR_PROJECT_ID"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### Step 5: Add CodePush to Your App

Create `services/CodePushService.ts`:

```typescript
import CodePush from 'react-native-code-push';
import { Alert } from 'react-native';

class CodePushService {
  private static instance: CodePushService;

  private constructor() {}

  static getInstance(): CodePushService {
    if (!CodePushService.instance) {
      CodePushService.instance = new CodePushService();
    }
    return CodePushService.instance;
  }

  /**
   * Check for updates on app start
   */
  async checkForUpdate(): Promise<void> {
    try {
      const update = await CodePush.checkForUpdate();
      
      if (update) {
        Alert.alert(
          'Update Available',
          'A new version is available. Would you like to update now?',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Update', 
              onPress: () => this.downloadAndInstall() 
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for update:', error);
    }
  }

  /**
   * Download and install update
   */
  async downloadAndInstall(): Promise<void> {
    try {
      await CodePush.sync(
        {
          installMode: CodePush.InstallMode.IMMEDIATE,
          updateDialog: {
            title: 'Updating Ventry',
            optionalUpdateMessage: 'Downloading update...',
            optionalIgnoreButtonLabel: 'Later',
            optionalInstallButtonLabel: 'Install',
          },
        },
        (status) => {
          switch (status) {
            case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
              console.log('Downloading update...');
              break;
            case CodePush.SyncStatus.INSTALLING_UPDATE:
              console.log('Installing update...');
              break;
            case CodePush.SyncStatus.UPDATE_INSTALLED:
              console.log('Update installed successfully');
              break;
          }
        }
      );
    } catch (error) {
      console.error('Error installing update:', error);
    }
  }

  /**
   * Silent update in background
   */
  async silentUpdate(): Promise<void> {
    try {
      await CodePush.sync({
        installMode: CodePush.InstallMode.ON_NEXT_RESTART,
      });
    } catch (error) {
      console.error('Error with silent update:', error);
    }
  }

  /**
   * Get current update metadata
   */
  async getCurrentVersion(): Promise<any> {
    try {
      const metadata = await CodePush.getUpdateMetadata();
      return metadata;
    } catch (error) {
      console.error('Error getting version:', error);
      return null;
    }
  }
}

export default CodePushService.getInstance();
```

### Step 6: Integrate in App

**app/_layout.tsx:**
```typescript
import { useEffect } from 'react';
import CodePushService from '@/services/CodePushService';

export default function RootLayout() {
  useEffect(() => {
    // Check for updates on app start
    CodePushService.checkForUpdate();
  }, []);

  // ... rest of your layout
}
```

### Step 7: Deploy Updates

```bash
# Release to staging (for testing)
appcenter codepush release-react -a <username>/Ventry-iOS -d Staging
appcenter codepush release-react -a <username>/Ventry-Android -d Staging

# After testing, promote to production
appcenter codepush promote -a <username>/Ventry-iOS -s Staging -d Production
appcenter codepush promote -a <username>/Ventry-Android -s Staging -d Production

# Or release directly to production
appcenter codepush release-react -a <username>/Ventry-iOS -d Production
appcenter codepush release-react -a <username>/Ventry-Android -d Production
```

### Step 8: Add Version Info to Settings

Update `app/(tabs)/settings.tsx`:

```typescript
import CodePushService from '@/services/CodePushService';

const [appVersion, setAppVersion] = useState('1.0.0');
const [codePushVersion, setCodePushVersion] = useState('');

useEffect(() => {
  loadVersionInfo();
}, []);

const loadVersionInfo = async () => {
  const metadata = await CodePushService.getCurrentVersion();
  if (metadata) {
    setCodePushVersion(metadata.label);
  }
};

// In your About section:
<Text>App Version: {appVersion}</Text>
<Text>CodePush Version: {codePushVersion}</Text>
```

## Update Strategies

### 1. Silent Updates (Recommended)
Updates download in background, install on next app restart.

```typescript
CodePush.sync({
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
});
```

### 2. Immediate Updates
Updates install immediately and restart app.

```typescript
CodePush.sync({
  installMode: CodePush.InstallMode.IMMEDIATE,
});
```

### 3. On Next Resume
Updates install when user backgrounds and resumes app.

```typescript
CodePush.sync({
  installMode: CodePush.InstallMode.ON_NEXT_RESUME,
  minimumBackgroundDuration: 60, // seconds
});
```

## Best Practices

### 1. Staged Rollouts
```bash
# Release to 25% of users first
appcenter codepush release-react -a <username>/Ventry-iOS \
  -d Production \
  --rollout 25

# If successful, increase to 100%
appcenter codepush patch -a <username>/Ventry-iOS \
  -d Production \
  --rollout 100
```

### 2. Mandatory Updates
```bash
# Force users to update (for critical fixes)
appcenter codepush release-react -a <username>/Ventry-iOS \
  -d Production \
  --mandatory
```

### 3. Target Specific Versions
```bash
# Only update users on version 1.0.0
appcenter codepush release-react -a <username>/Ventry-iOS \
  -d Production \
  --target-binary-version "1.0.0"
```

### 4. Rollback Bad Updates
```bash
# Rollback to previous version
appcenter codepush rollback -a <username>/Ventry-iOS -d Production
```

## Monitoring

### View Deployment History
```bash
appcenter codepush deployment history -a <username>/Ventry-iOS -d Production
```

### Check Metrics
```bash
appcenter codepush deployment list -a <username>/Ventry-iOS
```

Shows:
- Total installs
- Active installs
- Pending installs
- Failed installs
- Rollback count

## Cost

- **Free Tier**: Unlimited updates for open source apps
- **Paid Tier**: $40/month for commercial apps (includes analytics)

## Alternative: Expo Updates (EAS)

If you're using Expo (which you are), use Expo's built-in OTA updates:

```bash
# Configure EAS
npx eas-cli@latest init

# Build and publish update
eas update --branch production --message "Bug fixes"

# Automatic updates are already configured in app.json
```

## Security Considerations

1. **Use HTTPS only** - Updates are encrypted in transit
2. **Code signing** - Updates are signed and verified
3. **Rollback capability** - Always test before full rollout
4. **Version targeting** - Don't break older app versions

## When to Use App Store Updates Instead

Use traditional App Store/Play Store updates for:
- Native code changes
- New permissions
- Major version releases
- Marketing purposes (App Store visibility)
- Native dependency updates

## Summary

CodePush is perfect for your Ventry app because:
- ✅ Most of your code is JavaScript/React Native
- ✅ You can fix bugs instantly
- ✅ You can add features without waiting for review
- ✅ Your offline-first architecture works well with OTA updates
- ✅ Users get updates automatically

Start with Expo Updates (simpler) or use CodePush for more control!
