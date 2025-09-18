
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User } from "lucide-react";
import BackButton from "@/components/BackButton";

interface Message {
  role: "user" | "bot";
  content: string;
}

const ClientChat = () => {
  const { contractId } = useParams();
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Olá! Como posso ajudá-lo com questões sobre seu contrato?" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    if (!contractId) return;

    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          contractors (*)
        `)
        .eq("id", contractId)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error("Error fetching contract:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: "user", content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const botResponse: Message = {
        role: "bot",
        content: "Obrigado pela sua mensagem. Nossa equipe analisará sua solicitação e retornará em breve."
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton onClick={() => window.history.back()} label="Voltar" />
        
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Chat - Contrato {contract?.contract_number}
            </CardTitle>
            {contract && (
              <Badge variant="secondary" className="w-fit">
                Status: {contract.status || "Ativo"}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-2 max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {message.role === "bot" ? (
                        <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                      ) : (
                        <User className="w-4 h-4 mt-1 flex-shrink-0" />
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-2 max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                      <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                      <p className="text-sm">Digitando...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientChat;
