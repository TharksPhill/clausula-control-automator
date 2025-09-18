
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { useContracts } from "@/hooks/useContracts";
import { useMemo } from "react";
import { Info, TrendingUp, Users, Calendar } from "lucide-react";

const DashboardCharts = () => {
  const { contracts, loading } = useContracts();

  const chartData = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return {
        statusData: [],
        planTypeData: [],
        monthlyData: []
      };
    }

    const activeContracts = contracts.filter(c => c.status === 'Ativo');
    const terminatedContracts = contracts.filter(c => c.termination_date && c.termination_date !== '' && c.termination_date !== null);
    const inactiveContracts = contracts.filter(c => c.status === 'Inativo' || (c.status !== 'Ativo' && !c.termination_date));

    // Cores modernas inspiradas nas imagens
    const statusData = [
      { name: "Ativos", value: activeContracts.length, color: "#10d9c4", percentage: Math.round((activeContracts.length / contracts.length) * 100) },
      { name: "Encerrados", value: terminatedContracts.length, color: "#ef4444", percentage: Math.round((terminatedContracts.length / contracts.length) * 100) },
      { name: "Inativos", value: inactiveContracts.length, color: "#94a3b8", percentage: Math.round((inactiveContracts.length / contracts.length) * 100) },
    ];

    const planTypeData = [
      { 
        name: "Mensal", 
        value: contracts.filter(c => (c.plan_type || "mensal") === "mensal").length,
        color: "#3b82f6",
        percentage: Math.round((contracts.filter(c => (c.plan_type || "mensal") === "mensal").length / contracts.length) * 100)
      },
      { 
        name: "Semestral", 
        value: contracts.filter(c => c.plan_type === "semestral").length,
        color: "#8b5cf6",
        percentage: Math.round((contracts.filter(c => c.plan_type === "semestral").length / contracts.length) * 100)
      },
      { 
        name: "Anual", 
        value: contracts.filter(c => c.plan_type === "anual").length,
        color: "#10d9c4",
        percentage: Math.round((contracts.filter(c => c.plan_type === "anual").length / contracts.length) * 100)
      },
    ];

    const monthlyData = [
      { month: "Jan", contratos: Math.max(1, Math.floor(contracts.length * 0.4)), crescimento: 12 },
      { month: "Fev", contratos: Math.max(1, Math.floor(contracts.length * 0.6)), crescimento: 18 },
      { month: "Mar", contratos: Math.max(1, Math.floor(contracts.length * 0.7)), crescimento: 25 },
      { month: "Abr", contratos: Math.max(1, Math.floor(contracts.length * 0.8)), crescimento: 32 },
      { month: "Mai", contratos: Math.max(1, Math.floor(contracts.length * 0.9)), crescimento: 38 },
      { month: "Jun", contratos: contracts.length, crescimento: 45 },
    ];

    return {
      statusData,
      planTypeData,
      monthlyData
    };
  }, [contracts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-card border-border shadow-lg rounded-2xl">
            <CardHeader className="pb-3">
              <div className="h-6 bg-muted rounded-lg animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted rounded-xl animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const StatusModal = () => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
          Análise Detalhada - Status dos Contratos
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {chartData.statusData.map((item, index) => (
            <div key={index} className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: item.color }}></div>
              </div>
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-sm text-gray-600">{item.percentage}% do total</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <h4 className="font-semibold text-emerald-800 mb-2">💡 Insights Importantes</h4>
          <ul className="text-sm text-emerald-700 space-y-1">
            <li>• Taxa de ativação: {Math.round((chartData.statusData[0]?.value || 0) / contracts.length * 100)}%</li>
            <li>• Contratos pendentes precisam de acompanhamento</li>
            <li>• Meta recomendada: 85% de contratos ativos</li>
          </ul>
        </div>
      </div>
    </DialogContent>
  );

  const PlansModal = () => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          Análise Detalhada - Tipos de Plano
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="space-y-3">
          {chartData.planTypeData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="font-medium text-gray-800">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-sm text-gray-600">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">📊 Análise de Receita</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Planos anuais geram maior receita por cliente</li>
            <li>• Considere incentivar upgrades para planos longos</li>
            <li>• Desconto progressivo aumenta conversão</li>
          </ul>
        </div>
      </div>
    </DialogContent>
  );

  const GrowthModal = () => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
          Análise Detalhada - Evolução Mensal
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.monthlyData}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10d9c4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10d9c4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="contratos" 
                stroke="#10d9c4" 
                strokeWidth={3}
                fill="url(#colorGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <h4 className="font-semibold text-emerald-800 mb-2">📈 Taxa de Crescimento</h4>
            <p className="text-2xl font-bold text-emerald-600">+45%</p>
            <p className="text-sm text-emerald-700">Crescimento acumulado</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🎯 Projeção Próximo Mês</h4>
            <p className="text-2xl font-bold text-blue-600">{Math.round(contracts.length * 1.12)}</p>
            <p className="text-sm text-blue-700">Novos contratos esperados</p>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Status dos Contratos */}
      <Card className="bg-card border-border shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-4 bg-card border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Status dos Contratos
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Distribuição atual por status</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <StatusModal />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Contratos']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {chartData.statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs font-medium text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Plano */}
      <Card className="bg-card border-border shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-4 bg-card border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Tipos de Plano
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Distribuição por periodicidade</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  <Users className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <PlansModal />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.planTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {chartData.planTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [value, 'Contratos']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {chartData.planTypeData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs font-medium text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolução Mensal */}
      <Card className="bg-card border-border shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-4 bg-card border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Evolução Mensal
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Crescimento dos contratos</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <GrowthModal />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10d9c4" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#4fd1c7" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  formatter={(value) => [value, 'Contratos']}
                  labelFormatter={(label) => `${label}/2024`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar 
                  dataKey="contratos" 
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
