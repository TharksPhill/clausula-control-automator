
import React from 'react';
import { useContract } from '@/context/ContractContext';
import ContractSignatures from '@/components/ContractSignatures';
import { 
  getClause411Text, 
  getClause21Text, 
  getClause71Text, 
  getValueText,
  formatContractant 
} from '@/utils/contractClauses';

const ContractPreviewWithSignatures = () => {
  const { contractData } = useContract();
  const { 
    contractNumber,
    employeeCount,
    cnpjCount,
    monthlyValue,
    trialDays,
    startDate,
    renewalDate,
    paymentStartDate,
    paymentDay,
    planType,
    semestralDiscount,
    anualDiscount,
    contractors,
    companyData,
    planChangeSignatures
  } = contractData;

  console.log("🏢 CONTRACTPREVIEWWITHSIGNATURES: companyData recebido:", companyData);
  console.log("📝 CONTRACTPREVIEWWITHSIGNATURES: planChangeSignatures recebido:", planChangeSignatures);

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Determinar se usar singular ou plural para contratantes
  const contractorTermLabel = contractors.length === 1 ? "CONTRATANTE" : "CONTRATANTES";
  const contractorTermLower = contractors.length === 1 ? "contratante" : "contratantes";

  // Verificar se há assinaturas para mostrar
  const hasSignatures = planChangeSignatures && planChangeSignatures.length > 0;
  const contractSignature = hasSignatures ? planChangeSignatures.find(sig => sig.type === 'contract_signature') : null;

  // Calcular valores baseados no plano
  const baseValue = parseFloat(monthlyValue) || 0;
  let displayValue = baseValue;
  let valueLabel = "Valor Mensal";
  
  if (planType === 'semestral') {
    const discount = parseFloat(semestralDiscount) || 0;
    displayValue = (baseValue * 6) * (1 - discount / 100);
    valueLabel = "Valor Semestral";
  } else if (planType === 'anual') {
    const discount = parseFloat(anualDiscount) || 0;
    displayValue = (baseValue * 12) * (1 - discount / 100);
    valueLabel = "Valor Anual";
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-card text-card-foreground print:shadow-none print:bg-white print:text-black">
      {/* Contract Header */}
      <div className="text-center mb-8 border-b-2 border-border pb-6">
        <h1 className="text-2xl font-bold mb-2">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
        <h2 className="text-xl text-muted-foreground">Contrato #{contractNumber}</h2>
        {contractSignature && (
            <div className="mt-4 p-3 bg-muted border border-border rounded-md">
              <p className="text-sm font-semibold text-foreground mb-1">✓ CONTRATO ASSINADO</p>
              <p className="text-xs text-muted-foreground">
                Assinado em {new Date(contractSignature.signed_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {contractSignature.ip_address && (
                <p className="text-xs text-muted-foreground">IP: {contractSignature.ip_address}</p>
              )}
          </div>
        )}
      </div>

      {/* Company Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b border-border pb-1">CONTRATADA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <p><strong>Razão Social:</strong> {companyData?.name || 'Não informado'}</p>
          <p><strong>CNPJ:</strong> {companyData?.cnpj || 'Não informado'}</p>
          <p><strong>Endereço:</strong> {companyData?.address || 'Não informado'}</p>
          <p><strong>Cidade/Estado:</strong> {companyData?.city || 'Não informado'}/{companyData?.state || 'Não informado'}</p>
          <p><strong>Telefone:</strong> {companyData?.phone || 'Não informado'}</p>
          <p><strong>E-mail:</strong> {companyData?.email || 'Não informado'}</p>
          <p><strong>Website:</strong> {companyData?.website || 'Não informado'}</p>
          <p><strong>Responsável:</strong> {companyData?.responsibleName || 'Não informado'}</p>
        </div>
      </div>

      {/* Contractor Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b border-border pb-1">{contractorTermLabel}</h3>
        {contractors.map((contractor, index) => (
          <div key={contractor.id} className={`${index > 0 ? 'mt-4 pt-4 border-t border-border' : ''}`}>
            {contractors.length > 1 && (
              <h4 className="font-medium text-base mb-2 text-muted-foreground">CONTRATANTE {index + 1}</h4>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><strong>Razão Social:</strong> {contractor.name}</p>
              <p><strong>CNPJ:</strong> {contractor.cnpj}</p>
              <p><strong>Endereço:</strong> {contractor.address}</p>
              <p><strong>Cidade/Estado:</strong> {contractor.city}/{contractor.state}</p>
              <p><strong>Responsável:</strong> {contractor.responsibleName}</p>
              <p><strong>CPF do Responsável:</strong> {contractor.responsibleCpf}</p>
              <p><strong>RG do Responsável:</strong> {contractor.responsibleRg}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b border-border pb-1">DADOS DO CONTRATO</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <p><strong>{valueLabel}:</strong> {formatCurrency(displayValue)}</p>
          <p><strong>Tipo de Plano:</strong> {planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
          <p><strong>Quantidade de Funcionários:</strong> {employeeCount}</p>
          <p><strong>Quantidade de CNPJs:</strong> {cnpjCount}</p>
          <p><strong>Data de Início:</strong> {formatDate(startDate)}</p>
          <p><strong>Data de Renovação:</strong> {formatDate(renewalDate)}</p>
          <p><strong>Data de Início de Pagamento:</strong> {formatDate(paymentStartDate)}</p>
          <p><strong>Dia de Vencimento:</strong> {paymentDay}</p>
          <p><strong>Dias de Teste:</strong> {trialDays} dias</p>
          {planType === 'semestral' && semestralDiscount && (
            <p><strong>Desconto Semestral:</strong> {semestralDiscount}%</p>
          )}
          {planType === 'anual' && anualDiscount && (
            <p><strong>Desconto Anual:</strong> {anualDiscount}%</p>
          )}
        </div>
      </div>

      {/* Contract Clauses */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 border-b border-border pb-1">CLÁUSULAS CONTRATUAIS</h3>
        
        <div className="space-y-4 text-sm text-justify leading-relaxed">
          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 1ª - DO OBJETO</h4>
            <p className="mb-3">
              O presente contrato tem por objeto a prestação de serviços de software para gestão de recursos humanos, 
              incluindo controle de ponto eletrônico, gestão de funcionários e relatórios gerenciais, conforme especificações técnicas anexas.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 2ª - DO PRAZO E VIGÊNCIA</h4>
            <p className="mb-2">
              <strong>2.1.</strong> {getClause21Text(planType)}
            </p>
            <p className="mb-3">
              <strong>2.2.</strong> O presente contrato terá vigência de 12 (doze) meses, iniciando-se em {formatDate(startDate)} 
              e encerrando-se em {formatDate(renewalDate)}, renovando-se automaticamente por períodos iguais, 
              salvo manifestação em contrário de qualquer das partes com antecedência mínima de 30 (trinta) dias.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO</h4>
            <p className="mb-2">
              <strong>3.1.</strong> Pelos serviços prestados, {contractors.length > 1 ? 'os CONTRATANTES pagarão' : 'o CONTRATANTE pagará'} à CONTRATADA o {getValueText(planType)} de {formatCurrency(displayValue)}.
            </p>
            <p className="mb-2">
              <strong>3.2.</strong> Os pagamentos deverão ser efetuados até o dia {paymentDay} de cada mês/período, 
              conforme a periodicidade contratada.
            </p>
            <p className="mb-2">
              <strong>3.3.</strong> O valor contratado será reajustado anualmente pelo IGPM ou, na sua falta, 
              por índice que vier a substituí-lo.
            </p>
            <p className="mb-3">
              <strong>3.4.</strong> O não pagamento na data devida implicará em multa de 2% sobre o valor em atraso, 
              acrescida de juros de 1% ao mês.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 4ª - DOS SERVIÇOS INCLUSOS E ADICIONAIS</h4>
            <p className="mb-2">
              <strong>4.1.</strong> O plano contratado inclui o controle de até {employeeCount} funcionários e {cnpjCount} CNPJ(s).
            </p>
            <p className="mb-2" dangerouslySetInnerHTML={{ __html: formatContractant(`<strong>4.1.1.</strong> ${getClause411Text(planType)}`) }}>
            </p>
            <p className="mb-2">
              • <strong>Plano Mensal:</strong> R$ 33,00 por CNPJ adicional por mês;
            </p>
            <p className="mb-2">
              • <strong>Plano Semestral:</strong> R$ 198,00 por CNPJ adicional por semestre;
            </p>
            <p className="mb-2">
              • <strong>Plano Anual:</strong> R$ 396,00 por CNPJ adicional por ano.
            </p>
            <p className="mb-3">
              <strong>4.2.</strong> Funcionários adicionais além do limite contratado serão cobrados conforme tabela de preços vigente.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 5ª - DAS OBRIGAÇÕES DA CONTRATADA</h4>
            <p className="mb-2">
              <strong>5.1.</strong> Fornecer acesso contínuo aos sistemas contratados, 24 horas por dia, 7 dias por semana;
            </p>
            <p className="mb-2">
              <strong>5.2.</strong> Prestar suporte técnico via chat, e-mail ou telefone em horário comercial;
            </p>
            <p className="mb-2">
              <strong>5.3.</strong> Realizar backup diário dos dados e garantir a segurança das informações;
            </p>
            <p className="mb-2">
              <strong>5.4.</strong> Implementar atualizações e melhorias no sistema sem custo adicional;
            </p>
            <p className="mb-3">
              <strong>5.5.</strong> Garantir compliance com a legislação trabalhista vigente.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 6ª - DAS OBRIGAÇÕES DO{contractors.length > 1 ? 'S' : ''} {contractorTermLabel}</h4>
            <p className="mb-2">
              <strong>6.1.</strong> Efetuar o pagamento nas datas acordadas;
            </p>
            <p className="mb-2">
              <strong>6.2.</strong> Fornecer informações necessárias e corretas para a prestação dos serviços;
            </p>
            <p className="mb-2">
              <strong>6.3.</strong> Zelar pelo uso adequado do sistema e manter sigilo das credenciais de acesso;
            </p>
            <p className="mb-2">
              <strong>6.4.</strong> Comunicar imediatamente qualquer irregularidade ou problema técnico;
            </p>
            <p className="mb-3">
              <strong>6.5.</strong> Responsabilizar-se pela veracidade dos dados inseridos no sistema.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 7ª - DA VIGÊNCIA E RENOVAÇÃO</h4>
            <p className="mb-3">
              <strong>7.1.</strong> {getClause71Text(planType)}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 8ª - DA RESCISÃO</h4>
            <p className="mb-2">
              <strong>8.1.</strong> O presente contrato poderá ser rescindido por qualquer das partes mediante 
              aviso prévio de 30 (trinta) dias;
            </p>
            <p className="mb-2">
              <strong>8.2.</strong> Em caso de inadimplemento, a parte inocente poderá rescindir o contrato 
              independentemente de aviso prévio;
            </p>
            <p className="mb-3">
              <strong>8.3.</strong> Na rescisão, {contractors.length > 1 ? 'os CONTRATANTES terão' : 'o CONTRATANTE terá'} acesso aos dados 
              por até 30 (trinta) dias para migração.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 9ª - DA PROTEÇÃO DE DADOS</h4>
            <p className="mb-2">
              <strong>9.1.</strong> A CONTRATADA compromete-se a cumprir integralmente a Lei Geral de Proteção 
              de Dados (LGPD - Lei 13.709/2018);
            </p>
            <p className="mb-2">
              <strong>9.2.</strong> Os dados pessoais coletados serão utilizados exclusivamente para a prestação 
              dos serviços contratados;
            </p>
            <p className="mb-3">
              <strong>9.3.</strong> {contractors.length > 1 ? 'Os CONTRATANTES têm' : 'O CONTRATANTE tem'} direito de acesso, correção, 
              exclusão e portabilidade de seus dados conforme a LGPD.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CLÁUSULA 10ª - DO FORO</h4>
            <p className="mb-3">
              Fica eleito o foro da comarca de {companyData?.city || '[Cidade da Contratada]'}, {companyData?.state || '[Estado]'}, 
              para dirimir quaisquer questões oriundas do presente contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja.
            </p>
          </div>
        </div>
      </div>

      {/* Signatures Section */}
      <ContractSignatures planChangeSignatures={planChangeSignatures} />
    </div>
  );
};

export default ContractPreviewWithSignatures;
