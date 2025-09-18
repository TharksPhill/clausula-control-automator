
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuoteCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          Gerador de Orçamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-purple-100 mb-6 leading-relaxed">
          Crie orçamentos profissionais com os planos cadastrados, funcionalidades personalizadas e compartilhe facilmente com seus clientes.
        </p>
        <Button
          onClick={() => navigate('/quote-generator')}
          className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Criar Novo Orçamento
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuoteCard;
