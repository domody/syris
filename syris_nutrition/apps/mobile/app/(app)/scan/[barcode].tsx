import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { PageWrap } from "@/components/common/page-wrap";
import { Text } from "@/components/ui/text";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useIsFocused } from "@react-navigation/native";
import { Href, router } from "expo-router";
import { ScanMask } from "@/components/add/scan-mask";

export default function BarcodeScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const lockRef = useRef(false);

  const insests = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (lockRef.current) return;
    lockRef.current = true;

    const barcode = result.data.replace(/\D/g, "");
    setScanned(true);

    router.replace(`/product/${barcode}` as Href);
    // Alert.alert(
    //   "Barcode scanned",
    //   `Type: ${result.type}\nData: ${result.data}`,
    //   [
    //     {
    //       text: "Scan again",
    //       onPress: () => {
    //         lockRef.current = false;
    //         setScanned(false);
    //       },
    //     },
    //     { text: "OK", style: "cancel" },
    //   ],
    // );
  }, []);

  if (!permission) {
    return <PageWrap />;
  }

  if (!permission.granted) {
    return (
      <PageWrap withScrollView={false} className="items-center justify-center">
        <Text className="text-center">
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </Button>
      </PageWrap>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        flash="off"
        active={isFocused}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a", "upc_e", "ean8"],
        }}
        onBarcodeScanned={lockRef.current ? undefined : handleBarcodeScanned}
      />
      <ScanMask boxSize={280} boxRadius={20} overlayOpacity={0.55} />
      <View
        className="absolute left-4 right-4 top-0 flex-row items-center justify-between"
        style={{
          paddingTop: insests.top + 16,
        }}
      >
        <Button
          variant={"secondary"}
          size={"icon"}
          onPress={() => router.push("/")}
        >
          <HugeiconsIcon size={20} icon={Cancel01Icon} color={"white"} />
        </Button>

        {scanned ? (
          <Button
            variant="secondary"
            onPress={() => {
              lockRef.current = false;
              setScanned(false);
            }}
          >
            <Text>Reset</Text>
          </Button>
        ) : (
          <Text>Scanning...</Text>
        )}
      </View>
      <View
        className="absolute left-4 right-4 bottom-0 flex-row items-center justify-between"
        style={{
          paddingBottom: insests.bottom + 16,
        }}
      >
        <Button variant="secondary" onPress={() => setTorchOn((v) => !v)}>
          <Text>Flash</Text>
        </Button>
        <Button variant="secondary" onPress={() => setTorchOn((v) => !v)}>
          <Text>Type Barcode</Text>
        </Button>
      </View>
    </View>
  );
}
