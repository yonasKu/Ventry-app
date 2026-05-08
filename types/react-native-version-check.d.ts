declare module 'react-native-version-check' {
  const VersionCheck: {
    needUpdate: () => Promise<{
      isNeeded: boolean;
      latestVersion: string;
      storeUrl: string;
    } | null>;
  };

  export default VersionCheck;
}
