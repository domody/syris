import { Card, CardContent, CardDescription, CardHeader } from "./ui/card";
import { Item, ItemContent, ItemDescription, ItemTitle } from "./ui/item";

export function LatestIncidentsCard({ ...props }: React.ComponentProps<"div">) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardDescription className="text-xs">Latest Incidents</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-rows-5 h-full gap-2 px-2 grid-cols-1">
        <Item variant={"outline"} className="row-span-2 col-span-1">
          <ItemContent>
            <ItemDescription>28 Feb 2026</ItemDescription>
            <ItemTitle className="truncate">
              12 hour downtime - Server Overload
            </ItemTitle>
          </ItemContent>
        </Item>
        {/* <Item variant={"outline"} className="row-span-2 col-span-1">
          <ItemContent>
            <ItemDescription>26 Feb 2026</ItemDescription>
            <ItemTitle className="truncate">
              9 hour downtime - Server Overload
            </ItemTitle>
          </ItemContent>
        </Item> */}
        <Item
          variant={"outline"}
          className="border-dashed row-span-1 col-span-1"
        >
          <ItemContent>
            <ItemDescription>See more</ItemDescription>
          </ItemContent>
        </Item>
      </CardContent>
    </Card>
  );
}
