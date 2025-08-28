"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { light: CSS_VAR_NAME, dark: CSS_VAR_NAME }
const COLOR_VARIANTS = {
  area: {
    light: "hsl(var(--chart-1))",
    dark: "hsl(var(--chart-1))",
  },
  areaStrong: {
    light: "hsl(var(--chart-1))",
    dark: "hsl(var(--chart-1))",
  },
  line: {
    light: "hsl(var(--chart-1))",
    dark: "hsl(var(--chart-1))",
  },
  bar: {
    light: "hsl(var(--chart-1))",
    dark: "hsl(var(--chart-1))",
  },
  pie: {
    light: "hsl(var(--chart-1))",
    dark: "hsl(var(--chart-1))",
  },
  radial: {
    light: "hsl(var(--chart-1))",
    dark: "hsl(var(--chart-1))",
  },
};

type ChartConfig = {
  [k: string]: {
    label?: string;
    color?: string;
    theme?: typeof COLOR_VARIANTS.area;
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

type ChartProps = React.ComponentPropsWithoutRef<typeof RechartsPrimitive.ResponsiveContainer> & {
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
        <RechartsPrimitive.ResponsiveContainer {...props}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
Chart.displayName = "Chart";

const THEMES = {
  light: "",
  dark: ".dark",
};

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, configItem]) => configItem.theme || configItem.color
  ) as [string, { theme?: typeof COLOR_VARIANTS.area; color?: string }][];

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
    const color =
      itemConfig.color || (itemConfig.theme && itemConfig.theme[theme as keyof typeof itemConfig.theme]);
    return color ? `  --color-${key}: ${color};` : "";
  })
  .join("\n")}
}
`
          )
          .join("\n")
      }}
    />
  );
};

// Props that Recharts' Tooltip component passes to its content prop
type RechartsTooltipContentProps = {
  active?: boolean;
  payload?: RechartsPrimitive.TooltipPayload[];
  label?: string | number;
  coordinate?: { x: number; y: number };
  viewBox?: { x: number; y: number; width: number; height: number };
  offset?: number;
  wrapperStyle?: React.CSSProperties;
};

type ChartTooltipProps = RechartsTooltipContentProps & {
  // Custom props for the wrapper div
  className?: string; // For the outer div
  hideIndicator?: boolean;
  indicator?: "dot" | "line" | "dashed";
  labelFormatter?: (value: string | number, payload: RechartsPrimitive.TooltipPayload[]) => React.ReactNode;
  labelClassName?: string;
  formatter?: (value: string | number, name: string, item: RechartsPrimitive.TooltipPayload, index: number) => React.ReactNode;
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
    const nestLabel = React.useCallback(
      (item: RechartsPrimitive.TooltipPayload) => {
        if (labelKey && item.dataKey === labelKey) {
          return false;
        }
        return true;
      },
      [labelKey]
    );

    const customLabel = React.useMemo(() => {
      if (labelFormatter) {
        return labelFormatter(label as string | number, payload || []);
      }
      if (labelKey && payload?.length) {
        const item = payload.find((item: RechartsPrimitive.TooltipPayload) => item.dataKey === labelKey);
        if (item) {
          return item.value;
        }
      }
      return label;
    }, [label, labelFormatter, payload, labelKey]);

    if (active && payload?.length) {
      return (
        <div
          ref={ref}
          className={cn(
            "grid min-w-[8rem] items-start gap-y-1 border border-border bg-background px-2.5 py-1.5 text-sm shadow-xl",
            className // Apply the className to the outer div
          )}
          {...props} // Spread any other Recharts-passed props here if they are valid HTMLDivElement attributes
        >
          {customLabel ? (
            <div className={cn("font-medium", labelClassName)}>
              {customLabel}
            </div>
          ) : null}
          <div className="grid gap-1.5">
            {payload.map((item: RechartsPrimitive.TooltipPayload, index: number) => {
              const key = `${nameKey || item.name || item.dataKey || "value"}`;
              const itemConfig = config[key];
              const indicatorColor = color || itemConfig?.color || item.stroke || item.fill;

              return (
                <div
                  key={item.dataKey || index}
                  className="flex items-center justify-between gap-x-4"
                >
                  <div className="flex items-center gap-x-2">
                    {!hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                          {
                            "h-2 w-2": indicator === "dot",
                            "h-0.5 w-4": indicator === "line",
                            "h-0.5 w-4 border-dashed": indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
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
                    formatter(item.value, item.name || '', item, index)
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

type ChartLegendProps = React.ComponentPropsWithoutRef<typeof RechartsPrimitive.Legend> & {
  hideIcon?: boolean;
  indicator?: "dot" | "line" | "dashed";
  nameKey?: string;
};

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  ChartLegendProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-x-4",
          verticalAlign === "top" ? "pb-8" : "pt-8",
          className
        )}
      >
        {payload.map((item: RechartsPrimitive.LegendPayload) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = config[key];

          return (
            <div
              key={item.value}
              className="flex items-center gap-x-2"
            >
              {!hideIcon && (
                <div
                  className={cn(
                    "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                    {
                      "h-2 w-2": item.indicator === "dot",
                      "h-0.5 w-4": item.indicator === "line",
                      "h-0.5 w-4 border-dashed": item.indicator === "dashed",
                    }
                  )}
                  style={
                    {
                      "--color-bg": itemConfig?.color || item.color,
                      "--color-border": itemConfig?.color || item.color,
                    } as React.CSSProperties
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