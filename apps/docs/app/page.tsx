import { ComponentExample } from "@/components/component-example";
import { source } from "@/lib/source";

export default function Page() {
  return (
    <div className="w-screen min-h-screen pt-4 pb-6 md:pb-12 flex flex-col">
      <div className="relative flex min-h-[600px] h-[70vh] max-h-[900px] border rounded-2xl overflow-hidden mx-auto w-full container bg-origin-border"></div>
    </div>
  );
}
