
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Route, AlertTriangle, Loader2 } from 'lucide-react';
import { useGoogleMapsConfig } from '@/hooks/useGoogleMapsConfig';

interface RoutePoint {
  address: string;
  label: string;
  type: 'origin' | 'destination';
}

interface TravelRouteMapProps {
  origin: string;
  destinations: Array<{
    address: string;
    label: string;
  }>;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const TravelRouteMap: React.FC<TravelRouteMapProps> = ({ origin, destinations, className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { config, isLoading: configLoading } = useGoogleMapsConfig();

  const addDebugInfo = (info: string) => {
    console.log(`🗺️ ${info}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const initializeMap = async () => {
    if (!mapRef.current) {
      addDebugInfo('Referência do mapa não encontrada');
      setError('Referência do mapa não encontrada');
      setIsLoading(false);
      return;
    }

    if (!origin || destinations.length === 0) {
      addDebugInfo(`Dados insuficientes - Origin: ${origin}, Destinations: ${destinations.length}`);
      setError('Dados insuficientes para exibir o mapa');
      setIsLoading(false);
      return;
    }

    if (!config?.api_key) {
      addDebugInfo('API Key não configurada');
      setError('API Key do Google Maps não configurada');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      addDebugInfo('Iniciando inicialização do mapa');

      // Check if Google Maps is already loaded
      if (!window.google) {
        addDebugInfo('Carregando Google Maps API...');
        await loadGoogleMapsScript();
      } else {
        addDebugInfo('Google Maps API já disponível');
      }

      // Create map with a default center (Brazil)
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 6,
        center: { lat: -15.7801, lng: -47.9292 }, // Centro do Brasil
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ weight: "2.00" }]
          }
        ]
      });

      addDebugInfo('Mapa base criado com sucesso');

      // Create geocoder
      const geocoder = new window.google.maps.Geocoder();
      const bounds = new window.google.maps.LatLngBounds();

      // Geocode and add origin marker
      addDebugInfo(`Geocodificando origem: ${origin}`);
      
      const originPromise = new Promise((resolve, reject) => {
        geocoder.geocode({ address: origin }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            addDebugInfo('Origem geocodificada com sucesso');
            
            const originMarker = new window.google.maps.Marker({
              position: results[0].geometry.location,
              map: mapInstance,
              title: 'Origem',
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#10b981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });

            bounds.extend(results[0].geometry.location);
            resolve(results[0].geometry.location);
          } else {
            addDebugInfo(`Erro na geocodificação da origem: ${status}`);
            reject(new Error(`Erro na geocodificação da origem: ${status}`));
          }
        });
      });

      // Wait for origin to be geocoded
      await originPromise;

      // Geocode destinations
      const destinationPromises = destinations.map((destination, index) => {
        return new Promise((resolve, reject) => {
          addDebugInfo(`Geocodificando destino ${index + 1}: ${destination.address}`);
          
          geocoder.geocode({ address: destination.address }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              addDebugInfo(`Destino ${index + 1} geocodificado com sucesso`);
              
              const destinationMarker = new window.google.maps.Marker({
                position: results[0].geometry.location,
                map: mapInstance,
                title: destination.label,
                label: {
                  text: (index + 1).toString(),
                  color: 'white',
                  fontWeight: 'bold'
                },
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#ef4444',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                },
              });

              bounds.extend(results[0].geometry.location);
              resolve(results[0].geometry.location);
            } else {
              addDebugInfo(`Erro na geocodificação do destino ${index + 1}: ${status}`);
              reject(new Error(`Erro na geocodificação do destino ${index + 1}: ${status}`));
            }
          });
        });
      });

      // Wait for all destinations to be geocoded
      await Promise.all(destinationPromises);

      // Fit map to show all markers
      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds);
        addDebugInfo('Mapa ajustado para mostrar todos os marcadores');
      }

      addDebugInfo('Mapa inicializado com sucesso!');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido na inicialização do mapa';
      addDebugInfo(`Erro na inicialização: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      if (!config?.api_key) {
        reject(new Error('API Key do Google Maps não configurada'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.api_key}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        addDebugInfo('Script do Google Maps carregado');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Erro ao carregar script do Google Maps'));
      };
      
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    addDebugInfo(`useEffect triggered - configLoading: ${configLoading}, hasApiKey: ${!!config?.api_key}`);
    
    if (!configLoading && config?.api_key && origin && destinations.length > 0) {
      addDebugInfo('Condições atendidas, inicializando mapa');
      initializeMap();
    } else {
      addDebugInfo('Aguardando condições para inicializar mapa');
      setIsLoading(false);
    }
  }, [origin, destinations, config, configLoading]);

  if (configLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando configurações do Google Maps...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config?.api_key) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Mapa da Rota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Configure a API Key do Google Maps para visualizar o mapa
              </p>
              <p className="text-xs text-muted-foreground">
                Acesse as configurações para adicionar sua chave da API do Google Maps
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5" />
          Mapa da Rota de Viagem
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span>Origem</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Destinos</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <p className="text-sm text-destructive mb-2">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Verifique se a API Key do Google Maps está funcionando
                </p>
              </div>
            </div>
            {debugInfo.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Debug Info:</strong>
                <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {debugInfo.slice(-10).map((info, index) => (
                    <li key={index}>• {info}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando mapa...</p>
                  </div>
                </div>
              )}
              <div 
                ref={mapRef} 
                className="w-full h-64 md:h-80 lg:h-96 rounded-lg border border-border bg-muted/20"
                style={{ minHeight: '300px' }}
              />
            </div>
            
            {debugInfo.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Debug Info (últimas 5 entradas):</strong>
                <ul className="mt-2 space-y-1">
                  {debugInfo.slice(-5).map((info, index) => (
                    <li key={index}>• {info}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Lista de pontos */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">Origem:</span>
            <span className="text-muted-foreground">{origin}</span>
          </div>
          {destinations.map((destination, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <span className="font-medium">{destination.label}:</span>
              <span className="text-muted-foreground">{destination.address}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelRouteMap;
