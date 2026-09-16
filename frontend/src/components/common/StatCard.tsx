import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon: Icon,
  onClick,
}) => {
  return (
    <Card
      className={`p-5 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-400 hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {(subtitle || change) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {change && (
                <span
                  className={`font-semibold ${
                    isPositive ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {change}
                </span>
              )}
              {subtitle && <span className="text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
          <Icon className="h-5 w-5 stroke-[1.75]" />
        </div>
      </div>
    </Card>
  );
};
