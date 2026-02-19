import { ComponentExample } from "@/components/component-example";
import { source } from "@/lib/source";

export default function Page() {
  console.log(source);
  return <ComponentExample />;
}
