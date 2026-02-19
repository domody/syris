import { BottomBarPageWrapper } from "@/components/nav/bottom-bar/wrapper";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserSquareIcon } from "@hugeicons/core-free-icons";
import { TopBar } from "@/components/nav/mobile/top-bar/top-bar";
import { optionsMap } from "./optionsMap";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/");
  const user = data.user;
  return (
    <BottomBarPageWrapper className="flex flex-col">
      <TopBar className="justify-center">
        <p className="text-sm text-muted-foreground">More</p>
      </TopBar>
      <div className="w-full flex flex-col items-center gap-4 justify-center px-4">
        <HugeiconsIcon
          icon={UserSquareIcon}
          strokeWidth={2}
          className="size-8 text-primary"
        />
        <div className="grid grid-cols-1 text-center gap-1">
          <p className="text-lg">{user.email}</p>
          <p className="text-sm text-muted-foreground">
            Joined {user.confirmed_at?.slice(0, 10)}
          </p>
        </div>
      </div>
      {optionsMap.map((option) => {
        return (
          <Link
            key={option.label}
            href={option.link}
            className={[
              "col-span-1 w-full rounded-md flex items-center justify-start gap-y-2 [&>svg]:size-4.5 gap-4 px-4 py-2 border-b",
              option.disabled
                ? "text-muted-foreground pointer-events-none"
                : "text-foreground",
            ].join(" ")}
            aria-disabled={option.disabled}
          >
            <HugeiconsIcon icon={option.icon} strokeWidth={2} />
            <p className="text-base text-center">{option.label}</p>
          </Link>
        );
      })}
    </BottomBarPageWrapper>
  );
}
