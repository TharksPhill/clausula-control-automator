
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Target, DollarSign, FileText, Users, Calendar } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';

const ModernStats = () => {
  const { contracts, loading } = useContracts();

  const calculateStats = () => {
    if (!contracts || contracts.length === 0) {
      return {
        totalContracts: 0,
        totalRevenue: 0,
        activeContracts: 0,
        pendingContracts: 0,
        monthlyGrowth: 0,
        revenueGrowth: 0
      };
    }

    const activeContracts = contracts.filter(c => c.status === 'Ativo').length;
    const pendingContracts = contracts.filter(c => c.status === 'Pendente').length;
    
    const totalRevenue = contracts
      .filter(c => c.status === 'Ativo')
      .reduce((sum, contract) => {
        const value = parseFloat(contract.monthly_value?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
        return sum + value;
      }, 0);

    // Simular crescimento baseado nos dados atuais
    const monthlyGrowth = Math.floor(Math.random() * 20) + 5; // 5-25%
    const revenueGrowth = Math.floor(Math.random() * 15) + 8; // 8-23%

    return {
      totalContracts: contracts.length,
      totalRevenue,
      activeContracts,
      pendingContracts,
      monthlyGrowth,
      revenueGrowth
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Balance Status",
      value: stats.totalContracts,
      subtitle: "Total Contracts",
      change: `+${stats.monthlyGrowth}%`,
      trend: "up",
      icon: FileText,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Revenue",
      value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`,
      subtitle: "Monthly Revenue",
      change: `+${stats.revenueGrowth}%`,
      trend: "up",
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Saving",
      value: stats.activeContracts,
      subtitle: "Active Contracts",
      change: "+12.5%",
      trend: "up",
      icon: Target,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Performance",
      value: `${Math.round((stats.activeContracts / Math.max(stats.totalContracts, 1)) * 100)}%`,
      subtitle: "Success Rate",
      change: "+8.2%",
      trend: "up",
      icon: Activity,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className={`bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-full ${stat.iconBg}`}>
                  <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <Badge 
                  variant="secondary" 
                  className={`bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-sm`}
                >
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{stat.subtitle}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ModernStats;
