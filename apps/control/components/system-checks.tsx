import { ChevronRight } from "lucide-react";
import { StatusDot } from "./status-dot";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "./ui/item";

const checksItems = [
  { title: "", label: "API Reachable", status: "ok" },
  { title: "", label: "Heartbeat 3m old", status: "ok" },
  { title: "", label: "DB Connected", status: "ok" },
  { title: "", label: "No clock skew detected", status: "ok" },
];

export function SystemChecksCard({ ...props }: React.ComponentProps<"div">) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardDescription className="text-xs">Checks</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {checksItems.map((item) => {
          return (
            <Item
              className="rounded-none"
              key={item.label}
              render={<a href="#" />}
            >
              <ItemMedia>
                <StatusDot />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{item.label}</ItemTitle>
              </ItemContent>

              <ItemActions>
                <ChevronRight className="size-4" />
              </ItemActions>
            </Item>
          );
        })}
      </CardContent>
    </Card>
  );
}
