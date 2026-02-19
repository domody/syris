import {
  Target01Icon,
  Radar01Icon,
  Calendar01Icon,
  Clock01Icon,
  Apple01Icon,
  BookOpen02Icon,
  BarCode01Icon,
  Chart01Icon,
  RulerIcon,
  WeightScale01Icon,
  Link01Icon,
  Download01Icon,
  Upload01Icon,
  UserIcon,
  Shield01Icon,
  Configuration01Icon,
  HelpCircleIcon,
  Chat01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

import { IconSvgElement } from "@hugeicons/react";

type option = {
  label: string;
  icon: IconSvgElement;
  link: string;
  disabled?: boolean;
};

export const optionsMap: option[] = [
  { label: "Send Feedback", icon: Chat01Icon, link: "/" },

  { label: "Goals", icon: Target01Icon, link: "/" },
//   { label: "Nutrition Targets", icon: Radar01Icon, link: "/" },

//   { label: "Insights / Reports", icon: Chart01Icon, link: "/" },
  { label: "Measurements", icon: RulerIcon, link: "/" },
  //   { label: 'Weight Log', icon: WeightScale01Icon, link: '/' },

//   { label: "Integrations", icon: Link01Icon, link: "/" },
//   { label: "Export Data", icon: Download01Icon, link: "/" },
//   { label: "Import Data", icon: Upload01Icon, link: "/" },

//   { label: "Account", icon: UserIcon, link: "/" },
  { label: "Privacy", icon: Shield01Icon, link: "/" },
  { label: "Settings", icon: Configuration01Icon, link: "/" },

  { label: "Help", icon: HelpCircleIcon, link: "/" },
  { label: "About", icon: InformationCircleIcon, link: "/" },
];
