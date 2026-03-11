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
import { SYSTEM_STATES } from "@/features/health/system-state";

const timeframeOptions = [
  { label: "30 days", value: "30_days", number: 30 },
  { label: "45 days", value: "45_days", number: 45 },
  { label: "90 days", value: "90_days", number: 90 },
] as const;

type TimeframeOption = (typeof timeframeOptions)[number]["value"];

type UptimeDay = {
  date: string;
  uptimePct: number | null;
  incidents?: number;
  downtimeMinutes?: number;
};

const uptimeData: UptimeDay[] = [
  { date: "2026-03-01", uptimePct: 99.1, incidents: 1 },
  { date: "2026-03-02", uptimePct: 100, incidents: 0 },
  { date: "2026-03-03", uptimePct: 97.8, incidents: 1 },
  { date: "2026-03-05", uptimePct: 92.4, incidents: 2 },
  { date: "2026-03-06", uptimePct: 100, incidents: 0 },
];

export function UptimeBars({ ...props }: React.ComponentProps<"div">) {
  const [timeframeOption, setTimeframeOption] =
    React.useState<TimeframeOption>("45_days");
  const [hoveredDay, setHoveredDay] = React.useState<UptimeDay | null>(null);

  const correspondingOption = timeframeOptions.find(
    (option) => option.value === timeframeOption,
  );

  const labelValue = correspondingOption
    ? correspondingOption.label
    : "45 days";
  const numberValue = correspondingOption ? correspondingOption.number : 45;

  const visibleDays = React.useMemo(() => {
    return normalizeUptimeData(uptimeData, numberValue);
  }, [numberValue]);

  const averageUptime = React.useMemo(() => {
    return getAverageUptime(visibleDays);
  }, [visibleDays]);

  const headerTitle = hoveredDay ? getDayStatus(hoveredDay).title : "Uptime";

  const headerDescription = hoveredDay
    ? formatHoverDescription(hoveredDay)
    : `Uptime of the SYRIS Backend over the last ${numberValue} days`;

  return (
    <Card {...props}>
      <CardHeader className="">
        <CardTitle>{headerTitle}</CardTitle>
        <CardDescription>{headerDescription}</CardDescription>
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
          {visibleDays.map((day) => {
            const status = getDayStatus(day);

            return (
              <div
                key={day.date}
                className={`w-full rounded transition-all hover:h-8 hover:cursor-pointer ${
                  hoveredDay?.date === day.date ? "h-8" : "h-6"
                } ${status.color}`}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                aria-label={`${day.date} - ${status.title}`}
                // title={`${status.title} • ${formatHoverDescription(day)}`}
              />
            );
          })}
        </div>
        <div className="flex flex-1 pt-3 items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>{labelValue} ago</p>
          <p>
            {hoveredDay?.uptimePct
              ? `${hoveredDay.uptimePct}%`
              : averageUptime
                ? `${averageUptime}% avg`
                : "No data"}
          </p>
          <p>Today</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPastDates(days: number) {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatDateKey(date));
  }

  return dates;
}

function normalizeUptimeData(data: UptimeDay[], days: number): UptimeDay[] {
  const dates = getPastDates(days);
  const dataByDate = new Map(data.map((day) => [day.date, day]));

  return dates.map((date) => {
    return (
      dataByDate.get(date) ?? {
        date,
        uptimePct: null,
        incidents: 0,
      }
    );
  });
}

const STATUS_RULES = [
  {
    test: (uptimePct: number | null) => uptimePct === null,
    color: SYSTEM_STATES.unknown.color,
    title: SYSTEM_STATES.unknown.title,
  },
  {
    test: (uptimePct: number | null) => uptimePct === 100,
    color: SYSTEM_STATES.healthy.color,
    title: SYSTEM_STATES.healthy.title,
  },
  {
    test: (uptimePct: number | null) => uptimePct !== null && uptimePct >= 99,
    color: SYSTEM_STATES.degraded.color,
    title: SYSTEM_STATES.degraded.title,
  },
  {
    test: (uptimePct: number | null) => uptimePct !== null && uptimePct >= 95,
    color: SYSTEM_STATES.partial_outage.color,
    title: SYSTEM_STATES.partial_outage.title,
  },
  {
    test: (_uptimePct: number | null) => true,
    color: SYSTEM_STATES.major_outage.color,
    title: SYSTEM_STATES.major_outage.title,
  },
] as const;

function getDayStatus(day: UptimeDay) {
  const match = STATUS_RULES.find((rule) => rule.test(day.uptimePct))!;
  return {
    color: match.color,
    title: match.title,
  };
}

function formatHoverDescription(day: UptimeDay) {
  const date = new Date(day.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (day.uptimePct === null) {
    return `${date} - No data`;
  }

  const incidents = day.incidents ?? 0;

  if (incidents > 0) {
    return `${date} - ${incidents} incident${incidents === 1 ? "" : "s"}`;
  }

  return `${date}`;
}

function getAverageUptime(days: UptimeDay[]) {
  const withData = days.filter((day) => day.uptimePct !== null);

  if (withData.length === 0) return null;

  const avg =
    withData.reduce((sum, day) => sum + (day.uptimePct ?? 0), 0) /
    withData.length;

  return avg.toFixed(1);
}
