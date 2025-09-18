
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProfitAnalysisCardProps {
  title: string;
  value: number;
  percentage?: number;
  format?: 'currency' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'indigo' | 'yellow';
}

const ProfitAnalysisCard = ({ 
  title, 
  value, 
  percentage, 
  format = 'currency', 
  trend,
  subtitle,
  icon,
  color = 'blue'
}: ProfitAnalysisCardProps) => {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return `${val.toFixed(2)}%`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getColorClasses = () => {
    const colors = {
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-600 dark:text-blue-400',
      green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-600 dark:text-green-400',
      red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-600 dark:text-red-400',
      orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-600 dark:text-orange-400',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-600 dark:text-purple-400',
      indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
      yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
    };
    return colors[color];
  };

  return (
    <Card className={`bg-gradient-to-br ${getColorClasses()} bg-card/50 backdrop-blur-sm`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {trend && getTrendIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatValue(value)}
        </div>
        {percentage !== undefined && (
          <Badge variant={percentage >= 0 ? "default" : "destructive"} className="mb-2">
            {percentage.toFixed(1)}%
          </Badge>
        )}
        {subtitle && (
          <p className="text-xs opacity-75">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitAnalysisCard;
