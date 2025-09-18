
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { useGoogleMapsConfig } from "@/hooks/useGoogleMapsConfig";

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Digite o endereço",
  label = "Endereço"
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { config } = useGoogleMapsConfig();

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);

    try {
      if (config?.api_key) {
        console.log('🔍 Buscando sugestões com Google Places API para:', query);
        
        // Usar a API do Google Places diretamente via JSONP para evitar problemas de CORS
        const script = document.createElement('script');
        const callbackName = `googlePlacesCallback_${Date.now()}`;
        
        // Timeout para evitar scripts órfãos
        const timeout = setTimeout(() => {
          if ((window as any)[callbackName]) {
            console.warn('⏰ Timeout na requisição do Google Places API');
            generateMockSuggestions(query);
            delete (window as any)[callbackName];
            if (script.parentNode) {
              document.head.removeChild(script);
            }
            setLoading(false);
          }
        }, 5000);
        
        // Criar função callback global
        (window as any)[callbackName] = (data: any) => {
          clearTimeout(timeout);
          console.log('📍 Resposta da Google Places API:', data);
          
          if (data.status === 'OK' && data.predictions) {
            const formattedSuggestions = data.predictions.slice(0, 5).map((prediction: any) => ({
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting?.main_text || prediction.description,
                secondary_text: prediction.structured_formatting?.secondary_text || ''
              }
            }));
            
            setSuggestions(formattedSuggestions);
            setShowSuggestions(true);
            console.log('✅ Sugestões carregadas:', formattedSuggestions.length);
          } else {
            console.warn('⚠️ Google Places API retornou status:', data.status);
            generateMockSuggestions(query);
          }
          
          // Limpar callback e script
          delete (window as any)[callbackName];
          if (script.parentNode) {
            document.head.removeChild(script);
          }
          setLoading(false);
        };

        // Fazer requisição JSONP com mais tipos de lugares e melhor formatação
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:br&types=address&language=pt-BR&key=${config.api_key}&callback=${callbackName}`;
        script.src = url;
        script.onerror = () => {
          clearTimeout(timeout);
          console.error('❌ Erro ao carregar script da Google Places API');
          generateMockSuggestions(query);
          delete (window as any)[callbackName];
          if (script.parentNode) {
            document.head.removeChild(script);
          }
          setLoading(false);
        };
        
        document.head.appendChild(script);
      } else {
        console.log('🎲 API key não configurada, usando sugestões simuladas');
        generateMockSuggestions(query);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar sugestões:', error);
      generateMockSuggestions(query);
      setLoading(false);
    }
  };

  const generateMockSuggestions = (query: string) => {
    const mockSuggestions: AddressSuggestion[] = [
      {
        place_id: '1',
        description: `${query}, São Paulo - SP, Brasil`,
        structured_formatting: {
          main_text: query,
          secondary_text: 'São Paulo - SP, Brasil'
        }
      },
      {
        place_id: '2',
        description: `${query}, Rio de Janeiro - RJ, Brasil`,
        structured_formatting: {
          main_text: query,
          secondary_text: 'Rio de Janeiro - RJ, Brasil'
        }
      },
      {
        place_id: '3',
        description: `${query}, Belo Horizonte - MG, Brasil`,
        structured_formatting: {
          main_text: query,
          secondary_text: 'Belo Horizonte - MG, Brasil'
        }
      }
    ].filter(suggestion => 
      suggestion.description.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(mockSuggestions);
    setShowSuggestions(mockSuggestions.length > 0);
    setLoading(false);
    
    console.log('🎭 Usando sugestões simuladas:', mockSuggestions.length);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 150); // Reduzido para resposta mais rápida

    return () => clearTimeout(timeoutId);
  }, [value, config?.api_key]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay para permitir clique nas sugestões
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="relative">
      <Label htmlFor="address-input">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  index === selectedIndex ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!config?.api_key && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          💡 <strong>Dica:</strong> Configure a API do Google Maps nas configurações do sistema para obter sugestões de endereços mais precisas e atualizadas
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
