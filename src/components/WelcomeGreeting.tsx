
import { useState, useEffect } from "react";
import { Building2, Sun, Sunset, Moon, CloudMoon } from "lucide-react";

const WelcomeGreeting = () => {
  const [adminName, setAdminName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Carregar nome do administrador do localStorage
    const savedData = localStorage.getItem("companyProfile");
    if (savedData) {
      const companyData = JSON.parse(savedData);
      setAdminName(companyData.adminName || "");
    }

    // Atualizar horário a cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        text: "Bom dia",
        icon: Sun,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-700"
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        text: "Boa tarde",
        icon: Sun,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-700"
      };
    } else if (hour >= 18 && hour < 24) {
      return {
        text: "Boa noite",
        icon: Sunset,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-200 dark:border-purple-700"
      };
    } else {
      return {
        text: "Boa madrugada",
        icon: CloudMoon,
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        borderColor: "border-indigo-200 dark:border-indigo-700"
      };
    }
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const formatTime = () => {
    return currentTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className={`${greeting.bgColor} ${greeting.borderColor} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo do ContractPro */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ContractPro
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Gestão</p>
            </div>
          </div>
          
          {/* Separador */}
          <div className="w-px h-12 bg-gray-200 dark:bg-gray-600 mx-2"></div>
          
          {/* Saudação */}
          <div className="flex items-center gap-3">
            <div className={`${greeting.color} bg-white dark:bg-gray-800 rounded-full p-2 shadow-sm`}>
              <GreetingIcon className="w-6 h-6" />
            </div>
            <div>
              {adminName ? (
                <>
                  <p className={`${greeting.color} font-semibold text-lg`}>
                    {greeting.text}, {adminName}!
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate()}
                  </p>
                </>
              ) : (
                <>
                  <p className={`${greeting.color} font-semibold text-lg`}>
                    {greeting.text}!
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Sistema de Gestão de Contratos
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className={`${greeting.color} font-mono text-2xl font-bold`}>
            {formatTime()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Hora atual
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeGreeting;
