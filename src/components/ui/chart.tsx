import * as React from "react";
import * as RechartsPrimitive from "recharts";
import {
  type TooltipProps,
  type TooltipPayload,
} from "recharts/types/component/Tooltip";
import { cn } from "@/lib/utils";

const Chart = RechartsPrimitive.ResponsiveContainer;

interface ChartConfig {
  [k: string]: {
    label?: string;
    icon?: React.ComponentType<React.PropsWithChildren<{ className?: string }>>;
    color?: string; // Added color property
  };
}

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <Chart />");
  }
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    config: ChartConfig;
    children: React.ReactNode;
  }
>(({ config, className, children, ...props }, ref) => {
  const newConfig = React.useMemo(() => {
    return Object.entries(config || {}).map(([key, value]) => {
      if (value.color) {
        return [key, { color: `hsl(var(${value.color}))`, ...value }];
      }
      return [key, value];
    });
  }, [config]);

  return (
    <ChartContext.Provider value={{ config: Object.fromEntries(newConfig) }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    nameKey?: string;
    valueKey?: string;
  } & Pick<TooltipProps<any, any>, "payload" | "label" | "formatter"> // Explicitly pick props from TooltipProps
>(
  (
    {
      className,
      hideLabel = false,
      hideIndicator = false,
      nameKey,
      valueKey,
      payload,
      label,
      formatter,
      ...props
    },
    ref,
  ) => {
    const { config } = useChart();

    if (!payload || !payload.length) {
      return null;
    }

    const relevantPayload = payload.filter((item: TooltipPayload) => item.value !== undefined).sort((a: TooltipPayload, b: TooltipPayload) => {
      const aValue = typeof a.value === 'number' ? a.value : parseFloat(String(a.value));
      const bValue = typeof b.value === 'number' ? b.value : parseFloat(String(b.value));
      return bValue - aValue;
    });

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[130px] items-center rounded-xl border border-border bg-background/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-2xl",
          className,
        )}
        {...props}
      >
        {!hideLabel && label && (
          <div className="border-b border-muted pb-2 text-foreground">
            <ChartTooltipLabel label={label} />
          </div>
        )}
        <div className="grid gap-1.5 pt-2">
          {relevantPayload.map((item: TooltipPayload, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = item.dataKey && config[item.dataKey] ? config[item.dataKey] : undefined;
            const indicatorColor = itemConfig?.color || item.color;
            const value = valueKey && item.payload ? item.payload[valueKey] : item.value;

            return (
              <div
                key={key}
                className="flex items-center justify-between space-x-2"
              >
                <ChartTooltipIndicator
                  hide={hideIndicator}
                  color={indicatorColor}
                />
                <ChartTooltipName configItem={itemConfig}>
                  {item.name || item.dataKey}
                </ChartTooltipName>
                <ChartTooltipValue formatter={formatter}>
                  {value}
                </ChartTooltipValue>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartTooltipLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    label: any;
  }
>(({ className, label, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-medium text-foreground", className)}
    {...props}
  >
    {label}
  </div>
));
ChartTooltipLabel.displayName = "ChartTooltipLabel";

const ChartTooltipName = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    configItem?: {
      label?: string;
      icon?: React.ComponentType<React.PropsWithChildren<{ className?: string }>>;
      color?: string; // Added color property here as well for consistency
    };
  }
>(({ className, configItem, children, ...props }, ref) => {
  const Icon = configItem?.icon;

  return (
    <div
      ref={ref}
      className={cn("flex items-center", className)}
      {...props}
    >
      {Icon && (
        <Icon
          className="mr-2 h-3 w-3 shrink-0"
          style={{ // This style prop is valid for SVG elements, but not for a generic div.
            fill: configItem?.color,
            stroke: configItem?.color,
          }}
        />
      )}
      <span className="text-muted-foreground">{configItem?.label || children}</span>
    </div>
  );
});
ChartTooltipName.displayName = "ChartTooltipName";

const ChartTooltipValue = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    formatter?: (value: any, name: string, props: any) => any;
  }
>(({ className, formatter, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-medium text-foreground", className)}
    {...props}
  >
    {formatter ? formatter(children, "", {}) : children}
  </div>
));
ChartTooltipValue.displayName = "ChartTooltipValue";

const ChartTooltipIndicator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    hide?: boolean;
    color?: string;
  }
>(({ className, hide, color, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "h-2 w-2 shrink-0 rounded-full",
      hide && "opacity-0",
      color,
      className,
    )}
    {...props}
    style={{
      backgroundColor: color,
    }}
  />
));
ChartTooltipIndicator.displayName = "ChartTooltipIndicator";

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartTooltipLabel,
  ChartTooltipName,
  ChartTooltipValue,
};