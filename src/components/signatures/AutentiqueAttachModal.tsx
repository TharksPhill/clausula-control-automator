
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileSignature, Paperclip, CheckCircle, AlertCircle, Upload, X, FileText } from 'lucide-react';

interface AutentiqueAttachModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  onSuccess: () => void;
}

const AutentiqueAttachModal: React.FC<AutentiqueAttachModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    documentId: '',
    publicId: '',
    signerName: '',
    signerEmail: '',
    signedDate: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione apenas arquivos PDF',
          variant: 'destructive',
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: 'Erro',
          description: 'O arquivo deve ter no máximo 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPdfFile = async (userId: string, contractId: string, documentId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      setUploadingFile(true);
      
      const fileName = `${userId}/${contractId}/${documentId}_${Date.now()}.pdf`;
      
      const { data, error } = await supabase.storage
        .from('autentique-contracts')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      return data.path;
    } catch (error: any) {
      console.error('Erro ao fazer upload do PDF:', error);
      toast({
        title: 'Erro no Upload',
        description: 'Erro ao fazer upload do PDF: ' + error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAttachContract = async () => {
    if (!formData.documentId || !formData.publicId || !formData.signerName) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      console.log('🔄 Iniciando processo de anexar contrato Autentique');
      console.log('📋 Dados do contrato:', contract);

      // Buscar os dados do contrato e contratante com melhor tratamento de erro
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          contractors(*),
          companies(*)
        `)
        .eq('id', contract.id)
        .single();

      if (contractError) {
        console.error('❌ Erro ao buscar contrato:', contractError);
        throw new Error('Erro ao buscar dados do contrato: ' + contractError.message);
      }

      if (!contractData) {
        throw new Error('Contrato não encontrado');
      }

      console.log('✅ Dados do contrato carregados:', contractData);

      const contractor = contractData.contractors?.[0];
      if (!contractor) {
        throw new Error('Contratante não encontrado para este contrato');
      }

      // Obter ID do usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('✅ Usuário autenticado:', user.id);

      // Fazer upload do PDF se foi selecionado
      let pdfFilePath: string | null = null;
      if (selectedFile) {
        console.log('📄 Fazendo upload do PDF...');
        pdfFilePath = await uploadPdfFile(user.id, contract.id, formData.documentId);
        if (!pdfFilePath) {
          throw new Error('Falha no upload do PDF');
        }
        console.log('✅ PDF enviado para:', pdfFilePath);
      }

      // Criar registro na tabela autentique_documents
      console.log('💾 Criando registro na tabela autentique_documents...');
      const { error: autentiqueError } = await supabase
        .from('autentique_documents')
        .insert({
          contract_id: contract.id,
          contractor_id: contractor.id,
          created_by_user: user.id,
          document_id: formData.documentId,
          public_id: formData.publicId,
          signer_name: formData.signerName,
          signer_email: formData.signerEmail || contractor.email || '',
          document_name: `Contrato ${contract.contract_number} - Autentique`,
          status: 'signed',
          signed_at: formData.signedDate ? new Date(formData.signedDate).toISOString() : new Date().toISOString(),
          pdf_file_path: pdfFilePath,
          autentique_data: {
            attached_manually: true,
            notes: formData.notes,
            attached_at: new Date().toISOString(),
            has_pdf_attachment: !!pdfFilePath
          }
        });

      if (autentiqueError) {
        console.error('❌ Erro ao criar documento Autentique:', autentiqueError);
        throw new Error('Erro ao salvar documento Autentique: ' + autentiqueError.message);
      }

      console.log('✅ Documento Autentique criado com sucesso');

      // Criar assinatura do contratante na tabela signed_contracts
      console.log('✍️ Criando assinatura do contratante...');
      const signedHtmlContent = `
        <div>
          <h3>Contrato Assinado via Autentique (Anexado Manualmente)</h3>
          <p><strong>Contrato:</strong> ${contract.contract_number}</p>
          <p><strong>Assinante:</strong> ${formData.signerName}</p>
          <p><strong>Email:</strong> ${formData.signerEmail || contractor.email || 'Não informado'}</p>
          <p><strong>Data da Assinatura:</strong> ${formData.signedDate ? new Date(formData.signedDate).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Documento Autentique ID:</strong> ${formData.documentId}</p>
          <p><strong>Documento Público ID:</strong> ${formData.publicId}</p>
          ${formData.notes ? `<p><strong>Observações:</strong> ${formData.notes}</p>` : ''}
          <p><em>Contrato anexado manualmente pelo sistema</em></p>
        </div>
      `;

      const { error: signedContractError } = await supabase
        .from('signed_contracts')
        .insert({
          contract_id: contract.id,
          contractor_id: contractor.id,
          signature_data: `autentique_${formData.documentId}`,
          signed_html_content: signedHtmlContent,
          signed_at: formData.signedDate ? new Date(formData.signedDate).toISOString() : new Date().toISOString(),
          ip_address: 'manual_attachment',
          user_agent: 'Manual Autentique Attachment'
        });

      if (signedContractError) {
        console.error('❌ Erro ao criar assinatura do contratante:', signedContractError);
        throw new Error('Erro ao registrar assinatura do contratante: ' + signedContractError.message);
      }

      console.log('✅ Assinatura do contratante criada');

      // Criar assinatura da empresa na tabela admin_contract_signatures
      console.log('🏢 Criando assinatura da empresa...');
      const adminSignedHtmlContent = `
        <div>
          <h3>Assinatura da Empresa (Autentique - Anexado Manualmente)</h3>
          <p><strong>Contrato:</strong> ${contract.contract_number}</p>
          <p><strong>Empresa:</strong> ${contractData.companies?.name || 'Empresa'}</p>
          <p><strong>Responsável:</strong> ${contractData.companies?.responsible_name || 'Responsável da Empresa'}</p>
          <p><strong>Data da Assinatura:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Documento Anexado:</strong> ${formData.publicId}</p>
          <p><em>Assinatura confirmada através do anexo do contrato do Autentique</em></p>
        </div>
      `;

      const { error: adminSignatureError } = await supabase
        .from('admin_contract_signatures')
        .insert({
          contract_id: contract.id,
          signature_data: `admin_autentique_${formData.documentId}`,
          signed_html_content: adminSignedHtmlContent,
          signed_at: new Date().toISOString(),
          ip_address: 'manual_attachment',
          user_agent: 'Manual Autentique Attachment'
        });

      if (adminSignatureError) {
        console.error('❌ Erro ao criar assinatura da empresa:', adminSignatureError);
        throw new Error('Erro ao registrar assinatura da empresa: ' + adminSignatureError.message);
      }

      console.log('✅ Assinatura da empresa criada');

      toast({
        title: 'Sucesso!',
        description: `Contrato do Autentique anexado com sucesso${pdfFilePath ? ' com PDF' : ''}. Status de assinaturas atualizado.`,
      });

      onSuccess();
      onClose();
      
      // Limpar formulário
      setFormData({
        documentId: '',
        publicId: '',
        signerName: '',
        signerEmail: '',
        signedDate: '',
        notes: ''
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('❌ Erro ao anexar contrato do Autentique:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro inesperado ao anexar contrato',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-orange-600" />
            Anexar Contrato Assinado do Autentique
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do contrato */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Contrato Selecionado</h4>
            <p className="text-sm text-blue-700">
              <strong>Número:</strong> {contract?.contract_number} | 
              <strong> Contratante:</strong> {contract?.contractors?.[0]?.name || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentId">
                ID do Documento *
              </Label>
              <Input
                id="documentId"
                value={formData.documentId}
                onChange={(e) => handleInputChange('documentId', e.target.value)}
                placeholder="Ex: 67890abc-def1-2345-6789-0abcdef12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicId">
                ID Público *
              </Label>
              <Input
                id="publicId"
                value={formData.publicId}
                onChange={(e) => handleInputChange('publicId', e.target.value)}
                placeholder="Ex: ABCD-1234-EFGH-5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">
                Nome do Assinante *
              </Label>
              <Input
                id="signerName"
                value={formData.signerName}
                onChange={(e) => handleInputChange('signerName', e.target.value)}
                placeholder="Nome completo do assinante"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerEmail">
                Email do Assinante
              </Label>
              <Input
                id="signerEmail"
                type="email"
                value={formData.signerEmail}
                onChange={(e) => handleInputChange('signerEmail', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signedDate">
              Data da Assinatura
            </Label>
            <Input
              id="signedDate"
              type="datetime-local"
              value={formData.signedDate}
              onChange={(e) => handleInputChange('signedDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Observações
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre o anexo..."
              rows={3}
            />
          </div>

          {/* Upload de PDF */}
          <div className="space-y-2">
            <Label>
              Anexar PDF do Contrato (opcional)
            </Label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Arraste o PDF aqui ou clique para selecionar
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadingFile}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Selecionar PDF
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Apenas arquivos PDF (máx. 10MB)
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-green-600">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={loading || uploadingFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Aviso importante */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Atenção</h4>
                <p className="text-sm text-amber-700">
                  Ao anexar este contrato, o sistema irá automaticamente:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Marcar o contratante como "Assinado"
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Marcar a empresa como "Assinado"
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Registrar o documento na base de dados
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAttachContract}
              disabled={loading || uploadingFile || !formData.documentId || !formData.publicId || !formData.signerName}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading || uploadingFile ? (
                <>
                  {uploadingFile ? 'Fazendo upload...' : 'Anexando...'}
                </>
              ) : (
                <>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar Contrato
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutentiqueAttachModal;
