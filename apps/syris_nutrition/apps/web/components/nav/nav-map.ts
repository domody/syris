import * as React from "react";

import {
  Home04Icon,
  ChefHatIcon,
  PlusSignIcon,
  Activity01Icon,
  MoreHorizontalCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Label } from "radix-ui";

type IconSvgObject = ([string, {
    [key: string]: string | number;
}])[] | readonly (readonly [string, {
    readonly [key: string]: string | number;
}])[];

type NavItem = {
  label: string,
  link: string,
  icon: IconSvgObject,
  primary?: boolean,
}
export const navMap: Record<string, NavItem[]> = {
  mobile: [
    {
      label: "Home",
      link: "/",
      icon: Home04Icon,
    },
    {
      label: "Recipes",
      link: "/recipes",
      icon: ChefHatIcon,
    },
    {
      label: "Activity",
      link: "/activtiy",
      icon: Activity01Icon,
    },
    {
      label: "More",
      link: "/more",
      icon: MoreHorizontalCircle02Icon,
    },
    {
      label: "Add",
      link: "/add",
      icon: PlusSignIcon,
      primary: true,
    },
  ],

  // add: {
  //   link: "/add",
  //   icon: PlusSignIcon,
  //   primary: true,
  // },
};
