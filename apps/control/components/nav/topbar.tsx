import { cn } from "@/lib/utils"



export function Topbar({className, ...props}: React.ComponentProps<"div">) {

    return (
        <div className={cn("h-(--header-height) border-b w-full flex items-center p-4", className)} {...props}></div>
    )
}