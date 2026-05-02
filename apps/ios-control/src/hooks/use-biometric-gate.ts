import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useState } from "react";

export function useBiometricGate() {
  const [authenticating, setAuthenticating] = useState(false);

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setAuthenticating(true);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm with Face ID",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });

      return result.success;
    } finally {
      setAuthenticating(false);
    }
  }, []);

  return { authenticate, authenticating };
}
