"use client";

import React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";

const timeframeOptions = [
  { label: "30 days", value: "30_days", number: 30 },
  { label: "45 days", value: "45_days", number: 45 },
  { label: "90 days", value: "90_days", number: 90 },
] as const;

type TimeframeOption = (typeof timeframeOptions)[number]["value"];

export function UptimeBars({ ...props }: React.ComponentProps<"div">) {
  const [timeframeOption, setTimeframeOption] =
    React.useState<TimeframeOption>("90_days");

  const correspondingOption = timeframeOptions.find(
    (option) => option.value === timeframeOption,
  );

  const labelValue = correspondingOption ? correspondingOption.label : null;
  const numberValue = correspondingOption ? correspondingOption.number : null;

  return (
    <Card {...props}>
      <CardHeader className="">
        <CardTitle className="">Uptime</CardTitle>
        <CardDescription>Uptime of the SYRIS Backend over the last 90 days</CardDescription>
        <CardAction className="">
          <Select
            value={timeframeOption}
            onValueChange={(value) =>
              setTimeframeOption(value as TimeframeOption)
            }
            items={timeframeOptions}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {timeframeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="">
        <div className="flex flex-1 h-8 items-end justify-start gap-1">
          {[...Array(numberValue)].map((_, i) => (
            <div
              key={i}
              className="w-full h-6 hover:h-8 transition-all hover:cursor-pointer rounded bg-green-500"
            />
          ))}
        </div>
        <div className="flex flex-1 pt-3 items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>{labelValue} ago</p>
          <p>99.9%</p>
          <p>Today</p>
        </div>
      </CardContent>
    </Card>
  );
}
