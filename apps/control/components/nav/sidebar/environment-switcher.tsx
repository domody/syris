"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RocketIcon, WrenchIcon } from "lucide-react";
import {
  type Environment,
  getActiveEnvironment,
  setActiveEnvironment,
} from "@/lib/http/environments";

export function EnvironmentSwitcher() {
  const [env, setEnv] = useState<Environment>("dev");

  useEffect(() => {
    setEnv(getActiveEnvironment());
  }, []);

  function handleSwitch(next: Environment) {
    setActiveEnvironment(next);
    setEnv(next);
    window.location.reload();
  }

  return (
    <div className="p-0.5 grid grid-cols-2 bg-sidebar-accent rounded-lg border">
      <Button
        variant={env === "dev" ? "outline" : "ghost"}
        size="xs"
        onClick={() => handleSwitch("dev")}
      >
        <WrenchIcon /> Dev
      </Button>
      <Button
        variant={env === "prod" ? "outline" : "ghost"}
        size="xs"
        onClick={() => handleSwitch("prod")}
      >
        <RocketIcon /> Prod
      </Button>
    </div>
  );
}
