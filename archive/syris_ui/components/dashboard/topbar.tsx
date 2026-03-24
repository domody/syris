"use client";

import * as React from "react";

import { useDashboardStore } from "@/state/dashboard-store";

import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrain05Icon, Search01Icon } from "@hugeicons/core-free-icons";

function MetaBadges() {
  const wsStatus = useDashboardStore((s) => s.wsStatus);

  function variant() {
    switch (wsStatus) {
      case "connected":
        return "success";
      case "connecting":
        return "default";
      case "disconnected":
        return "destructive";
    }
  }

  function label() {
    switch (wsStatus) {
      case "connected":
        return "Running";
      case "connecting":
        return "Connecting";
      case "disconnected":
        return "Disconnected";
    }
  }

  return (
    <>
      <Badge variant={variant()}>Core: {label()}</Badge>
      {wsStatus === "connected" && (
        <>
          <Badge className="pl-0.5">
            <Badge className="bg-white/20 h-4 px-1 rounded-full">11</Badge>{" "}
            Integrations
          </Badge>
          <Badge className="pl-0.5">
            <Badge className="bg-white/20 h-4 px-1 rounded-full">3</Badge>{" "}
            WS Clients
          </Badge>
        </>
      )}
    </>
  );
}
export function Topbar() {
  return (
    <div className="border-b h-12 shrink-0 w-full flex items-center justify-start px-2 py-2 gap-2">
      <div className="rounded bg-white text-background h-full aspect-square flex items-center justify-center">
        <HugeiconsIcon
          icon={AiBrain05Icon}
          strokeWidth={2}
          className="aspect-square"
        />
      </div>
      <p className="mr-auto">SYRIS</p>

      <MetaBadges />

      <InputGroup className="max-w-90">
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">cmd + k</InputGroupAddon>
      </InputGroup>
    </div>
  );
}
