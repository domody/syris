import { cn } from "@/lib/utils";
import { StatusDot } from "./status-dot";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardTitle,
  CardFooter,
} from "./ui/card";

const MILESTONE_BLOCKED = [
  {
    title: "Normalize",
    descriptor: "No event log yet",
    data: "This will populate from /events + /audit",
    milestone: 1,
  },
  {
    title: "Route",
    descriptor: "Router decisions",
    data: "Router decision logs arrive here",
    milestone: 3,
  },
  {
    title: "Execute",
    descriptor: "Not available yet",
    data: "Tool calls + workflows arrive here",
    milestone: 4,
  },
];

export function EventLoopCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn("has-data-[slot=card-footer]:pb-4", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle>Event loop </CardTitle>
        {/* <CardDescription className="text-xs">Event loop</CardDescription> */}
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-2">
        <IngestStage />
        {MILESTONE_BLOCKED.map((item) => {
          return (
            <Card size="sm" key={item.title}>
              <CardHeader>
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardTitle>{item.descriptor}</CardTitle>
                <CardDescription>{item.data}</CardDescription>
              </CardContent>
              <CardFooter className="mt-auto">
                <CardDescription>Available from Milestone {item.milestone}</CardDescription>
              </CardFooter>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

function IngestStage({ ...props }: React.ComponentProps<"div">) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Ingest</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 items-center">
          <StatusDot />
          <p className="text-sm font-medium">API Reachable</p>
        </div>
        <p className="text-sm text-muted-foreground pl-4 mt-1">
          <span className="text-foreground font-semibold">0</span> events past
          hour
        </p>
        <p className="text-sm text-muted-foreground pl-4 mt-1">
          <span className="text-foreground font-semibold">0</span> events past
          24hr
        </p>
      </CardContent>
      <CardFooter>
        <CardDescription>Last contact 5m ago</CardDescription>
      </CardFooter>
    </Card>
  );
}
