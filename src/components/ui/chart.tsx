"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { type ComponentType } from "react";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: [{ KEY: VALUE }] }
type ChartConfig = {
  [k: string]: {
    label?: string;
    color?: string;
    icon?: ComponentType<{ className?: string }>;
    hide?: boolean; // Added 'hide' property
  };
};

type ChartContextProps = {
  config: ChartConfig;
  children: React.ReactNode;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <Chart />");
  }
  return context;
}

type ChartProps = React.ComponentProps<typeof ChartContainer> & {
  config: ChartConfig;
};

function Chart({ config, className, children, ...props }: ChartProps) {
  return (
    <ChartContext.Provider value={{ config, children }}>
      <ChartContainer className={className} {...props}>
        {children}
      </ChartContainer>
    </ChartContext.Provider>
  );
}
Chart.displayName = "Chart";

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer> & {
    children: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex aspect-video justify-center text-label-small", className)}
  >
    <RechartsPrimitive.ResponsiveContainer {...props}>
      {children as React.ReactElement}
    </RechartsPrimitive.ResponsiveContainer>
  </div>
));
ChartContainer.displayName = "ChartContainer";

type ChartTooltipProps = {
  hideLabel?: boolean;
  hideIndicator?: boolean;
  formatter?: (
    value: number,
    name: string,
    item: RechartsPrimitive.Payload<any, any>, // Using RechartsPrimitive.Payload directly
    index: number,
    payload: RechartsPrimitive.Payload<any, any>[] // Using RechartsPrimitive.Payload directly
  ) => React.ReactNode;
  className?: string;
};

function ChartTooltip({
  hideLabel = false,
  hideIndicator = false,
  formatter,
  className,
}: ChartTooltipProps) {
  const { config } = useChart();

  return (
    <RechartsPrimitive.Tooltip
      cursor={{ stroke: "hsl(var(--border))", strokeDasharray: 2 }}
      content={({ active, payload, label }) => {
        if (active && payload && payload.length) {
          return (
            <div
              className={cn(
                "grid min-w-[130px] items-center rounded-lg border border-border bg-card px-2 py-1 text-card-foreground shadow-md",
                className
              )}
            >
              {!hideLabel ? (
                <div className="text-label-small text-muted-foreground">
                  {label}
                </div>
              ) : null}
              <div className="grid gap-1">
                {payload.map((item, index) => {
                  const key = item.dataKey || item.name || index;
                  // Ensure key is a valid string or number for config lookup
                  const configKey = (typeof key === 'string' || typeof key === 'number') ? String(key) : undefined;
                  const itemConfig = configKey !== undefined && configKey in config ? config[configKey] : undefined;
                  const hide = itemConfig?.hide;

                  if (hide) {
                    return null;
                  }

                  return (
                    <div
                      key={String(key)} // Ensure key is string for React key prop
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        {!hideIndicator ? (
                          <span
                            className={cn("h-3 w-3 shrink-0 rounded-full", {
                              [`bg-[--color-${String(configKey)}]`]: configKey !== undefined && configKey in config,
                            })}
                            style={{
                              backgroundColor: item.color || itemConfig?.color,
                            }}
                          />
                        ) : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      <span className="text-right font-medium">
                        {formatter
                          ? formatter(
                              item.value as number,
                              item.name as string,
                              item,
                              index,
                              payload
                            )
                          : item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return null;
      }}
    />
  );
}
ChartTooltip.displayName = "ChartTooltip";

type ChartLegendProps<TData extends Record<string, any> = Record<string, any>> = React.ComponentProps<typeof RechartsPrimitive.Legend> & {
  hideIcon?: boolean;
  nameKey?: keyof TData;
};

function ChartLegend<TData extends Record<string, any> = Record<string, any>>(
  { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...props }: ChartLegendProps<TData>,
  ref: React.Ref<HTMLDivElement>
) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item: RechartsPrimitive.LegendPayload) => { // Explicitly type item as RechartsPrimitive.LegendPayload
        // Ensure key is a string or number for config lookup
        const key = nameKey ? (item.payload as TData)?.[nameKey] : item.dataKey;
        const configKey = (typeof key === 'string' || typeof key === 'number') ? String(key) : undefined;
        if (configKey === undefined) return null;

        const itemConfig = configKey in config ? config[configKey] : undefined;
        const hide = itemConfig?.hide;

        if (hide) {
          return null;
        }

        // Access fill/stroke directly from item, as RechartsPrimitive.LegendPayload includes these
        const itemColor = item.color || item.fill || item.stroke;

        return (
          <div
            key={String(item.value)} // Ensure key is string for React key prop
            className="flex items-center gap-1.5"
          >
            {!hideIcon ? (
              <span
                className={cn("h-3 w-3 shrink-0 rounded-full", {
                  [`bg-[--color-${String(configKey)}]`]: configKey in config,
                })}
                style={{
                  backgroundColor: itemColor,
                }}
              />
            ) : null}
            <span className="text-muted-foreground">
              {itemConfig?.label || item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
const ForwardedChartLegend = React.forwardRef(ChartLegend) as <TData extends Record<string, any> = Record<string, any>>(
  props: ChartLegendProps<TData> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

export { Chart, ChartContainer, ChartTooltip, ForwardedChartLegend as ChartLegend };