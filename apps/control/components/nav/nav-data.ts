import { House, LucideIcon, ScanHeart } from "lucide-react";

type NavMainItem = {
  title: string;
  icon: LucideIcon;
  url: string;
};

type NavData = {
  navMain: NavMainItem[];
};

export const data: NavData = {
  navMain: [
    {
      title: "Overview",
      icon: House,
      url: "/",
    },
    {
      title: "System Health",
      icon: ScanHeart,
      url: "/system-health",
    },
  ],
};
