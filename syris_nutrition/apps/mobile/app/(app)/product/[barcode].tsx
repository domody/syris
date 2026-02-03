import { useLocalSearchParams } from "expo-router";
import { PageWrap } from "@/components/common/page-wrap";
import { Text } from "@/components/ui/text";

export default function ProductScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  return (
    <PageWrap>
      <Text>Barcode: {barcode}</Text>
    </PageWrap>
  );
}
