
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Cloud, Sun, CloudRain, Wind, Droplets, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
}

const WeatherWidget = () => {
  const { toast } = useToast();
  const [weatherData, setWeatherData] = useState<WeatherData>({
    city: 'Araraquara',
    temperature: 16,
    condition: 'Ensolarado',
    humidity: 65,
    windSpeed: 8,
    forecast: [
      { day: 'Hoje', temp: 16, condition: 'Ensolarado' },
      { day: 'Amanhã', temp: 18, condition: 'Parcialmente nublado' },
      { day: 'Sexta', temp: 20, condition: 'Chuvoso' },
    ]
  });
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState('open-meteo');
  const [apiKey, setApiKey] = useState('');
  const [selectedCity, setSelectedCity] = useState('araraquara');
  const [isLoading, setIsLoading] = useState(false);

  // Persistir configurações no localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('weather-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setSelectedApi(config.api || 'open-meteo');
        setApiKey(config.apiKey || '');
        setSelectedCity(config.city || 'araraquara');
      } catch (error) {
        console.error('Erro ao carregar configurações do clima:', error);
      }
    }
  }, []);

  const saveConfig = () => {
    const config = {
      api: selectedApi,
      apiKey: apiKey,
      city: selectedCity
    };
    localStorage.setItem('weather-config', JSON.stringify(config));
  };

  const fetchWeatherData = async () => {
    setIsLoading(true);
    
    try {
      if (selectedApi === 'open-meteo') {
        // Open-Meteo não precisa de API key
        const cityCoords = getCityCoordinates(selectedCity);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${cityCoords.lat}&longitude=${cityCoords.lon}&current_weather=true&daily=temperature_2m_max,weather_code&timezone=America/Sao_Paulo&forecast_days=3`
        );
        
        if (response.ok) {
          const data = await response.json();
          const newWeatherData = {
            city: getCityName(selectedCity),
            temperature: Math.round(data.current_weather.temperature),
            condition: getWeatherCondition(data.current_weather.weather_code),
            humidity: 65, // Open-Meteo versão gratuita não tem umidade
            windSpeed: Math.round(data.current_weather.windspeed),
            forecast: data.daily.temperature_2m_max.slice(0, 3).map((temp: number, index: number) => ({
              day: index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : getDayName(index),
              temp: Math.round(temp),
              condition: getWeatherCondition(data.daily.weather_code[index])
            }))
          };
          
          setWeatherData(newWeatherData);
          saveConfig();
          setIsConfigOpen(false);
          
          toast({
            title: "Sucesso!",
            description: "Dados do clima atualizados.",
          });
        } else {
          throw new Error('Erro na resposta da API');
        }
      } else if (selectedApi === 'weatherapi' && apiKey) {
        // WeatherAPI
        const cityName = getCityName(selectedCity);
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${cityName}&days=3&lang=pt`
        );
        
        if (response.ok) {
          const data = await response.json();
          const newWeatherData = {
            city: data.location.name,
            temperature: Math.round(data.current.temp_c),
            condition: data.current.condition.text,
            humidity: data.current.humidity,
            windSpeed: Math.round(data.current.wind_kph),
            forecast: data.forecast.forecastday.map((day: any, index: number) => ({
              day: index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : getDayName(index),
              temp: Math.round(day.day.maxtemp_c),
              condition: day.day.condition.text
            }))
          };
          
          setWeatherData(newWeatherData);
          saveConfig();
          setIsConfigOpen(false);
          
          toast({
            title: "Sucesso!",
            description: "Dados do clima atualizados.",
          });
        } else {
          throw new Error('Erro na resposta da API ou chave inválida');
        }
      } else {
        throw new Error('Configuração incompleta');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do clima:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados do clima. Verifique a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCityCoordinates = (city: string) => {
    const coordinates: { [key: string]: { lat: number; lon: number } } = {
      'araraquara': { lat: -21.7947, lon: -48.1757 },
      'sao-paulo': { lat: -23.5505, lon: -46.6333 },
      'campinas': { lat: -22.9099, lon: -47.0626 },
      'ribeirao-preto': { lat: -21.1775, lon: -47.8208 },
      'santos': { lat: -23.9608, lon: -46.3331 }
    };
    return coordinates[city] || coordinates['araraquara'];
  };

  const getCityName = (city: string) => {
    const names: { [key: string]: string } = {
      'araraquara': 'Araraquara',
      'sao-paulo': 'São Paulo',
      'campinas': 'Campinas',
      'ribeirao-preto': 'Ribeirão Preto',
      'santos': 'Santos'
    };
    return names[city] || 'Araraquara';
  };

  const getWeatherCondition = (code: number) => {
    const conditions: { [key: number]: string } = {
      0: 'Céu limpo',
      1: 'Principalmente limpo',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Neblina',
      48: 'Neblina com geada',
      51: 'Garoa leve',
      53: 'Garoa moderada',
      55: 'Garoa intensa',
      61: 'Chuva leve',
      63: 'Chuva moderada',
      65: 'Chuva intensa',
      80: 'Pancadas leves',
      81: 'Pancadas moderadas',
      82: 'Pancadas intensas'
    };
    return conditions[code] || 'Ensolarado';
  };

  const getDayName = (index: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const today = new Date();
    const targetDay = new Date(today);
    targetDay.setDate(today.getDate() + index);
    return days[targetDay.getDay()];
  };

  const getWeatherIcon = (condition: string) => {
    if (condition.toLowerCase().includes('sol') || condition.toLowerCase().includes('limpo')) {
      return <Sun className="w-6 h-6 text-yellow-500" />;
    } else if (condition.toLowerCase().includes('chuv') || condition.toLowerCase().includes('garoa')) {
      return <CloudRain className="w-6 h-6 text-blue-500" />;
    } else {
      return <Cloud className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            {getWeatherIcon(weatherData.condition)}
            Clima em {weatherData.city}
          </CardTitle>
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-700 hover:bg-blue-200">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Clima</DialogTitle>
                <DialogDescription>
                  Configure a API e localização para dados atualizados do clima.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API de Clima</Label>
                  <Select value={selectedApi} onValueChange={setSelectedApi}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma API" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open-meteo">Open-Meteo (Gratuita)</SelectItem>
                      <SelectItem value="weatherapi">WeatherAPI (Necessita chave)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="araraquara">Araraquara</SelectItem>
                      <SelectItem value="sao-paulo">São Paulo</SelectItem>
                      <SelectItem value="campinas">Campinas</SelectItem>
                      <SelectItem value="ribeirao-preto">Ribeirão Preto</SelectItem>
                      <SelectItem value="santos">Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedApi === 'weatherapi' && (
                  <div className="space-y-2">
                    <Label>Chave da API</Label>
                    <Input
                      type="password"
                      placeholder="Sua chave da WeatherAPI"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                )}

                <Button 
                  onClick={fetchWeatherData} 
                  className="w-full"
                  disabled={isLoading || (selectedApi === 'weatherapi' && !apiKey)}
                >
                  {isLoading ? 'Atualizando...' : 'Atualizar Clima'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-900">{weatherData.temperature}°C</div>
              <div className="text-sm text-blue-700">{weatherData.condition}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Droplets className="w-3 h-3" />
                {weatherData.humidity}%
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Wind className="w-3 h-3" />
                {weatherData.windSpeed} km/h
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="text-center p-2 bg-white/50 rounded-lg">
                <div className="text-xs text-blue-700 font-medium">{day.day}</div>
                <div className="text-sm font-bold text-blue-900">{day.temp}°</div>
                <div className="text-xs text-blue-600">{day.condition}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
