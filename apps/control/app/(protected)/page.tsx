import { ComponentExample } from "@/components/component-example";
import { Topbar } from "@/components/nav/topbar";

export default function Page() {
  return (
    <div className="flex flex-1 items-start justify-start">
      <Topbar>
        <h1 className="font-semibold text-lg">Overview</h1>
        </Topbar>
    </div>
  );
}
