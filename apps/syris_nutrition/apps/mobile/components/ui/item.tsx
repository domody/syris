import * as React from "react";
import { Platform, View, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Text, TextClassContext } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";

function ItemGroup({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      role="list"
      data-slot="item-group"
      className={cn(
        "gap-4 has-[[data-size=sm]]:gap-2.5 has-[[data-size=xs]]:gap-2 group/item-group flex w-full flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator> & React.RefAttributes<any>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-2", className)}
      {...props}
    />
  );
}

const itemVariants = cva(
  cn(
    "[a]:hover:bg-muted rounded-md border text-xs/relaxed w-full group/item focus-visible:border-ring focus-visible:ring-ring/50 flex flex-row items-center flex-wrap outline-none transition-colors duration-100 focus-visible:ring-[3px] [a]:transition-colors",
    // keep structure: allow web-only additions later without touching the base styles
    Platform.select({ web: "" }),
  ),
  {
    variants: {
      variant: {
        default: "border-transparent",
        outline: "border-border",
        muted: "bg-muted/50 border-transparent",
      },
      size: {
        default: "gap-2.5 px-3 py-2.5",
        sm: "gap-2.5 px-3 py-2.5",
        xs: "gap-2.5 px-2.5 py-2 [[data-slot=dropdown-menu-content]_&]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ItemProps = ViewProps &
  React.RefAttributes<View> &
  VariantProps<typeof itemVariants> & {
    asChild?: boolean;
  };

function Item({
  className,
  variant = "default",
  size = "default",
  ...props
}: ItemProps) {
  return (
    <TextClassContext.Provider value="text-foreground">
      <View
        data-slot="item"
        data-variant={variant}
        data-size={size}
        className={cn(itemVariants({ variant, size }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

const itemMediaVariants = cva(
  "gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start flex shrink-0 items-center justify-center [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "[&_svg:not([class*='size-'])]:size-4",
        image:
          "size-8 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ItemMediaProps = ViewProps &
  React.RefAttributes<View> &
  VariantProps<typeof itemMediaVariants> & {
    asChild?: boolean;
  };

function ItemMedia({
  className,
  variant = "default",
  ...props
}: ItemMediaProps) {
  return (
    <View
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

function ItemContent({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      data-slot="item-content"
      className={cn(
        "gap-1 group-data-[size=xs]/item:gap-0.5 flex-col flex-1 [&+[data-slot=item-content]]:flex-none",
        className,
      )}
      {...props}
    />
  );
}

function ItemTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      data-slot="item-title"
      className={cn(
        "gap-2 text-sm leading-snug font-medium underline-offset-4 line-clamp-1 flex w-fit items-center",
        className,
      )}
      numberOfLines={1}
      {...props}
    />
  );
}

function ItemDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      data-slot="item-description"
      className={cn(
        "text-muted-foreground text-left text-xs/relaxed [&>a:hover]:text-primary line-clamp-2 font-normal [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      numberOfLines={2}
      {...props}
    />
  );
}

function ItemActions({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      data-slot="item-actions"
      className={cn("gap-2 flex items-center", className)}
      {...props}
    />
  );
}

function ItemHeader({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      data-slot="item-header"
      className={cn(
        "gap-2 flex basis-full items-center justify-between",
        className,
      )}
      {...props}
    />
  );
}

function ItemFooter({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      data-slot="item-footer"
      className={cn(
        "gap-2 flex basis-full items-center justify-between",
        className,
      )}
      {...props}
    />
  );
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};

export type { ItemProps, ItemMediaProps };
