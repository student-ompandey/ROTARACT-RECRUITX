import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ElementType;
}

export function MetricCard({
  title,
  value,
  description,
  change,
  isPositive = true,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card className="hover:border-slate-700/80 transition-all duration-200">
      <CardContent className="p-0 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">{title}</span>
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-100 tracking-tight">{value}</span>
          {change && (
            <span
              className={cn(
                'inline-flex items-center text-[11px] font-medium',
                isPositive ? 'text-emerald-400' : 'text-slate-400'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {change}
            </span>
          )}
        </div>

        <p className="mt-1 text-[11px] text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
