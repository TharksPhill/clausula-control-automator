
import { useState, useEffect } from "react";
import { Link2, Plus, Copy, Eye, Trash2, MessageSquare, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatLink {
  id: string;
  name: string;
  chatId: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'expired';
  visits: number;
  lastVisit?: Date;
}

const ChatManagement = () => {
  const [chatLinks, setChatLinks] = useState<ChatLink[]>([]);
  const [newChatName, setNewChatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar links salvos do localStorage
    const savedLinks = localStorage.getItem('chatLinks');
    if (savedLinks) {
      const links = JSON.parse(savedLinks).map((link: any) => ({
        ...link,
        createdAt: new Date(link.createdAt),
        lastVisit: link.lastVisit ? new Date(link.lastVisit) : undefined,
      }));
      setChatLinks(links);
    }
  }, []);

  const saveLinks = (links: ChatLink[]) => {
    localStorage.setItem('chatLinks', JSON.stringify(links));
    setChatLinks(links);
  };

  const generateChatId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const createNewChatLink = () => {
    if (!newChatName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o chat",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const newChat: ChatLink = {
      id: Date.now().toString(),
      name: newChatName,
      chatId: generateChatId(),
      createdAt: new Date(),
      status: 'active',
      visits: 0,
    };

    const updatedLinks = [...chatLinks, newChat];
    saveLinks(updatedLinks);
    setNewChatName("");
    setIsCreating(false);

    toast({
      title: "Sucesso!",
      description: "Link de chat criado com sucesso",
    });
  };

  const copyToClipboard = (chatId: string) => {
    const url = `${window.location.origin}/client-chat/${chatId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
  };

  const deleteChat = (id: string) => {
    const updatedLinks = chatLinks.filter(link => link.id !== id);
    saveLinks(updatedLinks);
    toast({
      title: "Excluído",
      description: "Link de chat excluído com sucesso",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Chats</p>
                <p className="text-2xl font-bold text-gray-900">{chatLinks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chats Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {chatLinks.filter(chat => chat.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {chatLinks.filter(chat => chat.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visitas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {chatLinks.reduce((total, chat) => total + chat.visits, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar novo chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Criar Novo Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Nome do chat (ex: Contrato Cliente XYZ)"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createNewChatLink} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de chats */}
      <Card>
        <CardHeader>
          <CardTitle>Chats Criados</CardTitle>
        </CardHeader>
        <CardContent>
          {chatLinks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum chat criado ainda</p>
              <p className="text-sm">Crie seu primeiro chat para começar a coletar dados de contratos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatLinks.map((chat) => (
                <div key={chat.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                        <Badge className={getStatusColor(chat.status)}>
                          {getStatusText(chat.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>ID: {chat.chatId}</span>
                        <span>Criado: {chat.createdAt.toLocaleDateString('pt-BR')}</span>
                        <span>Visitas: {chat.visits}</span>
                        {chat.lastVisit && (
                          <span>Última visita: {chat.lastVisit.toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(chat.chatId)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Link do Chat</DialogTitle>
                            <DialogDescription>
                              Compartilhe este link com seu cliente para que ele possa preencher os dados do contrato
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-gray-100 rounded-lg">
                              <p className="font-mono text-sm break-all">
                                {`${window.location.origin}/client-chat/${chat.chatId}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => copyToClipboard(chat.chatId)}
                                className="flex-1"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Link
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => window.open(`/client-chat/${chat.chatId}`, '_blank')}
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Abrir Chat
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteChat(chat.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatManagement;
