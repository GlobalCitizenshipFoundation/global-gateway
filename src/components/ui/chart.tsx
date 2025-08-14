"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip, // Import Tooltip from recharts
  type TooltipProps,
} from "recharts";

import { cn } from "@/lib/utils";

// Define ChartConfig type locally as it's used here
export type ChartConfig = {
  [k: string]: {
    label?: string;
    color?: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    unit?: string; // Added unit property
  };
};

// Define a type for the payload if TooltipPayload is not directly exported
type CustomTooltipPayload = {
  dataKey?: string | number;
  name?: string;
  value?: number | string | Array<any>;
  unit?: string;
  color?: string;
  payload?: any;
  inactive?: boolean;
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

type ChartContainerProps = React.ComponentPropsWithoutRef<"div"> & {
  config: ChartConfig;
  children: React.ReactElement; // Expecting a single chart component as child
};

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(({ config, className, children, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex h-[300px] w-full flex-col items-center justify-center",
          className
        )}
        {...props}
      >
        <ResponsiveContainer>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

type ChartTooltipContentProps = TooltipProps<any, any> & React.HTMLAttributes<HTMLDivElement> & {
  hideLabel?: boolean;
  hideIndicator?: boolean;
  formatter?: (
    value: any,
    name: string,
    props: any,
    index: number,
    payload: CustomTooltipPayload[]
  ) => React.ReactNode;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ active, payload, label, formatter, hideLabel = false, hideIndicator = false, className, ...props }, ref) => {
  const { config } = useChart();

  if (!(active && payload && payload.length)) return null;

  const defaultFormatter = (value: any, name: string) => {
    const configItem = name ? config[name] : undefined;
    const unit = configItem?.unit;
    return `${value}${unit ? unit : ""}`;
  };

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[120px] items-center gap-1 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {!hideLabel && label && <div className="text-sm text-muted-foreground">{label}</div>}
      <div className="grid gap-1">
        {(payload as CustomTooltipPayload[]).map((item, index) => {
          const key = item.dataKey || item.name || index;
          const configItem = item.dataKey ? config[item.dataKey] : undefined;
          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between gap-4",
                item.inactive && "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                {!hideIndicator && (
                  configItem?.icon ? (
                    <configItem.icon className="h-3 w-3" />
                  ) : (
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: item.color || configItem?.color,
                      }}
                    />
                  )
                )}
                <span className="truncate text-muted-foreground">
                  {configItem?.label || item.name}
                </span>
              </div>
              <div className="font-medium text-foreground">
                {formatter
                  ? formatter(item.value, item.name || "", item, index, payload as CustomTooltipPayload[])
                  : defaultFormatter(item.value, item.name || "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    payload?: CustomTooltipPayload[];
  }
>(({ className, payload, ...props }, ref) => {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4 pt-2",
        className
      )}
      {...props}
    >
      {payload.map((item) => {
        const configItem = item.dataKey ? config[item.dataKey] : undefined;

        return (
          <div
            key={item.dataKey}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3",
              item.inactive && "text-muted-foreground"
            )}
          >
            {configItem?.icon ? (
              <configItem.icon />
            ) : (
              <div
                className="mr-2 h-3 w-3 shrink-0 rounded-full"
                style={{
                  fill: configItem?.color, // Changed to fill for SVG compatibility
                  stroke: configItem?.color, // Changed to stroke for SVG compatibility
                  backgroundColor: item.color || configItem?.color,
                }}
              />
            )}
            <span>{configItem?.label || item.name}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";

const ChartTooltipName = ({ className, ...props }: React.ComponentPropsWithoutRef<"span">) => (
  <span className={cn("text-muted-foreground", className)} {...props} />
);
ChartTooltipName.displayName = "ChartTooltipName";

const ChartTooltipValue = ({ className, formatter, ...props }: React.ComponentPropsWithoutRef<"span"> & {
  formatter?: (
    value: any,
    name: string,
    props: any,
    index: number,
    payload: CustomTooltipPayload[]
  ) => React.ReactNode;
}) => (
  <span className={cn("font-medium text-foreground", className)} {...props} />
);
ChartTooltipValue.displayName = "ChartTooltipValue";


export {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartTooltipName,
  ChartTooltipValue,
  Area,
  Bar,
  Line,
  LineChart,
  BarChart,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
};