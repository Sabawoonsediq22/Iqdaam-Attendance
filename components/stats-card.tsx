import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  description?: string;
  border?: string;
  iconStyle?: string;
  bg?: string;
  iconColor?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, description, border, iconStyle, bg, iconColor }: StatsCardProps) {
  return (
    <Card data-testid={`stats-${title.toLowerCase().replace(/\s+/g, '-')}`} className={`shadow-sm ${border} ${bg || ''} dark:bg-blue-950`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-1 rounded-md bg-primary/10 ${iconStyle}`}>
          <Icon className={`h-6 w-6 ${iconColor || 'text-primary'}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold" data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        {trend && (
          <p className={`text-xs ${trend.positive ? 'text-attendance-present' : 'text-attendance-absent'}`}>
            {trend.value}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
