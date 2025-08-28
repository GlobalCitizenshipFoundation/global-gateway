"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_VARIABLE_PREFIX }
const THEMES = {
  light: "",
  dark: "dark",
} as const;

const COLOR_VARIANTS = {
  area: "fill",
  line: "stroke",
  bar: "fill",
  pie: "fill",
  radial: "fill",
  range: "fill",
  scatter: "fill",
  tooltip: "fill",
} as const;

type ChartConfig = {
  [k: string]: {
    label?: string;
    color?: string;
    theme?: keyof typeof COLOR_VARIANTS;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <Chart>");
  }

  return context;
}

type ChartProps = React.ComponentPropsWithoutRef<"div"> & {
  config: ChartConfig;
  id?: string;
};

const Chart = React.forwardRef<
  HTMLDivElement,
  ChartProps
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn("flex h-full w-full flex-col", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
Chart.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, configItem]) => configItem.theme || configItem.color
  ) as [string, { theme?: keyof typeof COLOR_VARIANTS; color?: string }][];

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
  ${colorConfig
    .map(([key, itemConfig]) => {
      const color = itemConfig.color || `hsl(var(--chart-${key}))`;
      return `
    --color-${key}: ${color};
    --${COLOR_VARIANTS[itemConfig.theme || "bar"]}-${key}: var(--color-${key});
  `;
    })
    .join("")}
}
`
          )
          .join("\n")}
      }}
    />
  );
};

type RechartsTooltipPayload = RechartsPrimitive.TooltipProps<any, any>["payload"][number];

type ChartTooltipProps = React.ComponentPropsWithoutRef<"div"> &
  RechartsPrimitive.TooltipProps<any, any> & {
    hideIndicator?: boolean;
    indicator?: "dot" | "line";
    labelFormatter?: (value: any, name: string, props: any) => React.ReactNode;
    valueFormatter?: (
      value: any,
      name: string,
      props: any,
      index: number
    ) => React.ReactNode;
    labelClassName?: string;
    formatter?: (
      value: any,
      name: string,
      props: any,
      index: number
    ) => React.ReactNode;
    color?: string;
    nameKey?: string;
    labelKey?: string;
  };

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  ChartTooltipProps
>(
  (
    {
      active,
      payload,
      className, // This className is for the outer div
      indicator = "dot",
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      ...props // Collect any other props that might be passed by Recharts
    },
    ref
  ) => {
    const { config } = useChart();
    const customLabel = labelKey ? payload?.[0]?.payload[labelKey] : label;

    if (active && payload && payload.length) {
      return (
        <div
          ref={ref}
          className={cn(
            "grid min-w-[130px] items-start gap-y-1.5 rounded-lg border bg-background px-2.5 py-2 text-sm shadow-as-tooltip",
            className
          )}
          {...props}
        >
          {customLabel ? (
            <div className={cn("font-medium", labelClassName)}>
              {labelFormatter ? labelFormatter(customLabel, "", {}) : customLabel}
            </div>
          ) : null}
          <div className="grid gap-1.5">
            {payload.map((item: RechartsTooltipPayload, index: number) => { // Use local RechartsTooltipPayload
              if (item.dataKey === undefined || item.value === undefined) {
                return null;
              }

              const itemConfig = item.dataKey
                ? config[item.dataKey as keyof typeof config]
                : undefined;
              const hide = itemConfig?.hide;

              if (hide) {
                return null;
              }

              const itemColor = color || item.stroke || item.fill;
              const nestLabel = (item: RechartsTooltipPayload) => {
                if (item.name && item.name !== item.dataKey) {
                  return item.name;
                }
                return null;
              };

              return (
                <div
                  key={item.dataKey || index}
                  className="flex w-full flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-x-2">
                    {!hideIndicator && (
                      <div
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          indicator === "dot" && "rounded-full",
                          indicator === "line" && "h-px w-3",
                          itemColor && `bg-[--color-${item.dataKey}]`
                        )}
                        style={
                          itemColor
                            ? {
                                backgroundColor: itemColor,
                              }
                            : {}
                        }
                      />
                    )}
                    {nestLabel(item) ? (
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    ) : null}
                  </div>
                  {formatter ? (
                    formatter(item.value, item.name || "", item, index)
                  ) : (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {item.value?.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }
);
ChartTooltip.displayName = "ChartTooltip";

type ChartLegendProps = React.ComponentPropsWithoutRef<"div"> &
  RechartsPrimitive.LegendProps & {
    hideIcon?: boolean;
    formatter?: (
      value: string,
      entry: RechartsPrimitive.LegendPayload,
      index: number
    ) => React.ReactNode;
  };

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  ChartLegendProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...props },
    ref
  ) => {
    const { config } = useChart();

    if (!payload || !payload.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" && "pb-8",
          verticalAlign === "bottom" && "pt-8",
          className
        )}
        {...props}
      >
        {payload.map((item, index) => {
          const itemConfig = item.dataKey
            ? config[item.dataKey as keyof typeof config]
            : undefined;
          const hide = itemConfig?.hide;

          if (hide) {
            return null;
          }

          const itemColor = item.color || item.payload?.fill || item.payload?.stroke;

          return (
            <div
              key={item.value}
              className="flex items-center gap-x-2"
            >
              {!hideIcon && (
                <div
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    itemColor && `bg-[--color-${item.dataKey}]`
                  )}
                  style={
                    itemColor
                      ? {
                          backgroundColor: itemColor,
                        }
                      : {}
                  }
                />
              )}
              <span className="text-sm text-muted-foreground">
                {itemConfig?.label || item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegend.displayName = "ChartLegend";

export { Chart, ChartTooltip, ChartLegend };