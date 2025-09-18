import React, { useRef, useEffect } from "react";
import { useContract } from "@/context/ContractContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, User, Building, Calendar, DollarSign, AlertCircle, Clock, CheckCircle, Shield, Download, Printer } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import CompanyHeader from "@/components/CompanyHeader";
import { formatDateToBrazilian } from "@/utils/dateUtils";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { getClause411Text, getClause21Text, getClause71Text, getClause47Text, getPaymentTermText, getTechnicalVisitText, getTechnicalVisitDetailText, formatContractant as formatContractantUtil } from "@/utils/contractClauses";
import { useTechnicalVisitSettings } from "@/hooks/useTechnicalVisitSettings";
const ContractPreview = () => {
  const {
    contractData,
    activeClauseId,
    setActiveClauseId
  } = useContract();
  const {
    toast
  } = useToast();
  const {
    plans
  } = usePlans();
  const {
    planAddons
  } = usePlanAddons();
  const {
    settings: technicalVisitSettings
  } = useTechnicalVisitSettings();
  const contractRef = useRef<HTMLDivElement>(null);
  const hasMultipleContractors = contractData.contractors.length > 1;

  // Log detalhado dos dados do contrato no ContractPreview
  console.log("📋 CONTRACTPREVIEW: contractData completo:", contractData);
  console.log("📋 CONTRACTPREVIEW: monthlyValue:", contractData.monthlyValue);
  console.log("📋 CONTRACTPREVIEW: planType:", contractData.planType);
  console.log("📋 CONTRACTPREVIEW: employeeCount:", contractData.employeeCount);
  console.log("📋 CONTRACTPREVIEW: trialDays:", contractData.trialDays);

  // Referência para cada seção do contrato que possui ID para ancoragem
  const clauseRefs = useRef<Record<string, HTMLElement | null>>({});

  // Efeito para rolar para a cláusula ativa
  useEffect(() => {
    if (activeClauseId && clauseRefs.current[activeClauseId]) {
      const element = clauseRefs.current[activeClauseId];
      if (element) {
        // Aguarda um momento para garantir que a renderização está completa
        setTimeout(() => {
          // Rola suavemente para o elemento
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Adiciona um destaque temporário
          element.classList.add('bg-yellow-100', 'transition-colors', 'duration-500');

          // Remove o destaque após alguns segundos
          setTimeout(() => {
            element.classList.remove('bg-yellow-100');
          }, 2000);
        }, 100);
      }
    }
  }, [activeClauseId]);

  // Função para formatar o termo "CONTRATANTE" no plural ou singular
  const formatContractant = () => {
    return hasMultipleContractors ? <strong>AS CONTRATANTES</strong> : <strong>A CONTRATANTE</strong>;
  };

  // Função para formatar o termo "CONTRATANTE" como string HTML
  const formatContractantText = () => {
    return hasMultipleContractors ? '<strong>AS CONTRATANTES</strong>' : '<strong>A CONTRATANTE</strong>';
  };

  // Função para formatar os números de tópicos em negrito
  const formatTopicNumber = number => {
    return <strong>{number}</strong>;
  };

  // Função para obter a data atual formatada
  const getCurrentDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para gerar o texto dinâmico da cláusula 1.5 - CORRIGIDA
  const getClause15Text = () => {
    const planType = contractData.planType || 'mensal';
    const monthlyValue = contractData.monthlyValue || '0,00';
    console.log("🔧 getClause15Text - planType:", planType);
    console.log("🔧 getClause15Text - monthlyValue:", monthlyValue);
    let periodicity = '';
    let discountText = '';
    switch (planType) {
      case 'mensal':
        periodicity = 'mensalmente';
        break;
      case 'semestral':
        periodicity = 'semestralmente';
        const semestralDiscount = contractData.semestralDiscount || '0';
        if (parseFloat(semestralDiscount) > 0) {
          discountText = ` (com desconto de ${semestralDiscount}%)`;
        }
        break;
      case 'anual':
        periodicity = 'anualmente';
        const anualDiscount = contractData.anualDiscount || '0';
        if (parseFloat(anualDiscount) > 0) {
          discountText = ` (com desconto de ${anualDiscount}%)`;
        }
        break;
      default:
        periodicity = 'mensalmente';
    }
    const finalText = `Após o período gratuito, a utilização do software RHiD será cobrada ${periodicity} no valor de <strong>R$ ${monthlyValue}</strong>${discountText}. Este valor será reajustado anualmente, de acordo com:`;
    console.log("🔧 getClause15Text - texto final:", finalText);
    return finalText;
  };

  // Função para gerar o texto dinâmico da cláusula 1.7
  const getClause17Text = () => {
    const planType = contractData.planType || 'mensal';
    if (planType === 'mensal') {
      return `A renovação do contrato ocorrerá automaticamente todo mês, sendo a próxima data de reajuste dos valores em <strong>${formatDateDisplay(contractData.renewalDate)}</strong>.`;
    }
    let renewalPeriod = '';
    switch (planType) {
      case 'semestral':
        renewalPeriod = 'semestralmente';
        break;
      case 'anual':
        renewalPeriod = 'anualmente';
        break;
      default:
        renewalPeriod = 'anualmente';
    }
    return `A renovação do contrato ocorrerá ${renewalPeriod}, sendo a próxima data de renovação fixada para <strong>${formatDateDisplay(contractData.renewalDate)}</strong>.`;
  };

  // Função para gerar o texto dinâmico da cláusula 1.11
  const getClause111Text = () => {
    const planType = contractData.planType || 'mensal';
    let paymentFrequency = '';
    switch (planType) {
      case 'mensal':
        paymentFrequency = 'mensalidade';
        break;
      case 'semestral':
        paymentFrequency = 'semestralidade';
        break;
      case 'anual':
        paymentFrequency = 'anuidade';
        break;
      default:
        paymentFrequency = 'mensalidade';
    }
    return `<strong>A CONTRATANTE</strong> deverá pagar a ${paymentFrequency} pontualmente e informar qualquer mudança no número de funcionários ou no CNPJ que ultrapasse seu limite contratado, além de utilizar o software em conformidade com as leis e normas aplicáveis, incluindo a Consolidação das Leis do Trabalho (CLT) e acordos coletivos.`;
  };

  // Função para gerar o texto dinâmico da cláusula 2.1
  const getClause21Text = () => {
    const planType = contractData.planType || 'mensal';
    const monthlyValue = contractData.monthlyValue || '0,00';
    let paymentFrequency = '';
    let periodicity = '';
    switch (planType) {
      case 'mensal':
        paymentFrequency = 'mensal';
        periodicity = 'mensalmente';
        break;
      case 'semestral':
        paymentFrequency = 'semestral';
        periodicity = 'semestralmente';
        break;
      case 'anual':
        paymentFrequency = 'anual';
        periodicity = 'anualmente';
        break;
      default:
        paymentFrequency = 'mensal';
        periodicity = 'mensalmente';
    }
    return `Valor ${paymentFrequency}: O valor ${paymentFrequency} devido <strong>A CONTRATANTE</strong> à <strong>CONTRATADA</strong> pela prestação dos serviços de licença do software RHiD será de <strong>R$ ${monthlyValue}</strong>. Este valor será reajustado anualmente conforme clausula 1.5.`;
  };

  // Função para gerar o texto dinâmico da cláusula 2.7
  const getClause27Text = () => {
    const planType = contractData.planType || 'mensal';
    let paymentFrequency = '';
    switch (planType) {
      case 'mensal':
        paymentFrequency = 'mensal';
        break;
      case 'semestral':
        paymentFrequency = 'semestral';
        break;
      case 'anual':
        paymentFrequency = 'anual';
        break;
      default:
        paymentFrequency = 'mensal';
    }
    return `Licença de Uso: A licença concedida pelo presente contrato é uma licença de uso cedida, o que significa que <strong>A CONTRATANTE</strong> obtém o direito de utilizar o software RHiD de acordo com os termos estabelecidos neste contrato. O valor ${paymentFrequency} pago, conforme disposto na cláusula 2.1, não se destina à aquisição do software em propriedade, mas sim a assegurar o suporte técnico e a manutenção necessária para a utilização eficiente do sistema. Dessa forma, o pagamento garantirá não apenas o acesso contínuo ao software, mas também a suporte tecnico, atualizações e melhorias, assegurando que <strong>A CONTRATANTE</strong> tenha sempre à disposição um software otimizado e em consonância com suas necessidades operacionais.`;
  };

  // Função para gerar o texto dinâmico da cláusula 3.1
  const getClause31Text = () => {
    const planType = contractData.planType || 'mensal';
    let vigencyText = '';
    let durationText = '';
    switch (planType) {
      case 'mensal':
        vigencyText = 'Mensal: vigência de 30 (trinta) dias';
        durationText = 'períodos iguais ao inicialmente contratado';
        break;
      case 'semestral':
        vigencyText = 'Semestral: vigência de 6 (seis) meses';
        durationText = 'períodos iguais ao inicialmente contratado';
        break;
      case 'anual':
        vigencyText = 'Anual: vigência de 12 (doze) meses';
        durationText = 'períodos iguais ao inicialmente contratado';
        break;
      default:
        vigencyText = 'Mensal: vigência de 30 (trinta) dias';
        durationText = 'períodos iguais ao inicialmente contratado';
    }
    return `O presente contrato terá vigência inicial conforme o plano contratado, sendo: <strong>${vigencyText}</strong>; contados a partir da data de sua assinatura, podendo ser renovado automaticamente por ${durationText}, salvo manifestação em contrário por qualquer das partes, com antecedência mínima de 30 (trinta) dias antes do término do período vigente.`;
  };

  // Função para gerar o texto dinâmico da cláusula 4.11
  const getClause411Text = () => {
    return `Fica expressamente acordado entre as partes que, caso <strong>A CONTRATANTE</strong> solicite a adição de funcionários que ultrapassem o limite de cadastros ativos previstos no plano contratado, o valor do contrato será reajustado proporcionalmente, conforme a modalidade contratual vigente (mensal, semestral ou anual), tomando por base a tabela abaixo:`;
  };

  // Função para gerar o texto dinâmico da cláusula 4.12
  const getClause412Text = () => {
    const planType = contractData.planType || 'mensal';
    let timeAdjustmentText = '';
    switch (planType) {
      case 'mensal':
        timeAdjustmentText = 'Para contratos mensais, a cobrança será feita a partir do mês subsequente à solicitação.';
        break;
      case 'semestral':
        timeAdjustmentText = 'Para contratos semestrais, será calculado o valor proporcional em relação aos meses restantes do semestre.';
        break;
      case 'anual':
        timeAdjustmentText = 'Para contratos anuais, a diferença será proporcional aos meses restantes do período anual.';
        break;
      default:
        timeAdjustmentText = 'Para contratos mensais, a cobrança será feita a partir do mês subsequente à solicitação.';
    }
    return `Caso <strong>A CONTRATANTE</strong> solicite, durante a vigência do contrato, aditivos contratuais para inclusão de novos funcionários, CNPJs ou funcionalidades opcionais, como o reconhecimento facial, o valor correspondente será ajustado proporcionalmente ao tempo restante do plano vigente.

${timeAdjustmentText}

O valor final poderá ainda ser impactado por eventuais descontos previamente acordados entre as partes na contratação do plano semestral ou anual.`;
  };

  // Função para gerar as tabelas dinâmicas baseadas no plano e nos dados do gerenciamento
  const generateDynamicTables = () => {
    const planType = contractData.planType || 'mensal';

    // Usar dados dos planos cadastrados no gerenciamento
    const monthlyValues = plans.map(plan => ({
      range: plan.employee_range === plan.employee_range.split('-')[0] ? `${plan.employee_range} funcionário${parseInt(plan.employee_range) > 1 ? 's' : ''}` : `${plan.employee_range} funcionários`,
      cnpjs: `${plan.allowed_cnpjs} CNPJ${plan.allowed_cnpjs > 1 ? 's' : ''}`,
      monthly: parseFloat(plan.monthly_price.toString())
    })).sort((a, b) => a.monthly - b.monthly);

    // Buscar valores dos addons do gerenciamento de planos
    const getAddonValue = (addonName: string) => {
      const addon = planAddons.find(addon => addon.name.toLowerCase().includes(addonName.toLowerCase()));
      return addon ? parseFloat(addon.price_per_unit.toString()) : 0;
    };
    const additionalValues = {
      extraEmployees: getAddonValue('funcionários extras') || 149,
      extraCNPJ: getAddonValue('cnpjs extras') || 33,
      facialRecognition: getAddonValue('reconhecimento facial') || 1.19
    };

    // Multiplicadores baseados no plano
    const multipliers = {
      mensal: {
        factor: 1,
        label: "Mensal"
      },
      semestral: {
        factor: 6,
        label: "Semestral (×6)"
      },
      anual: {
        factor: 12,
        label: "Anual (×12)"
      }
    };
    
    // Corrigir valores incorretos de planType (como "mnesal" para "mensal")
    const correctedPlanType = planType === 'mnesal' ? 'mensal' : planType;
    
    // Usar mensal como fallback se o planType não for reconhecido
    const currentMultiplier = multipliers[correctedPlanType] || multipliers.mensal;
    
    return {
      mainTable: monthlyValues.map(item => ({
        ...item,
        planValue: item.monthly * currentMultiplier.factor
      })),
      additionalEmployees: additionalValues.extraEmployees * currentMultiplier.factor,
      additionalCNPJ: additionalValues.extraCNPJ * currentMultiplier.factor,
      facialRecognition: additionalValues.facialRecognition * currentMultiplier.factor,
      multiplier: currentMultiplier
    };
  };

  // Função para abrir o contrato em uma nova janela
  const openContractInNewWindow = () => {
    if (!contractRef.current) return;
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contrato de Prestação de Serviços</title>
        <style>
          ${`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
              color: #333;
            }
            
            .contract-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            /* Ocultar ícones na impressão e PDF */
            .print-hide-icon {
              display: none !important;
            }
            
            /* Cabeçalho da empresa para PDF/HTML - ESTILO MELHORADO */
            .preview-company-header {
              border: 1px solid #d1d5db;
              margin-bottom: 32px;
              padding: 40px;
              background-color: white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            
            .preview-company-header .flex {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 32px;
            }
            
            .preview-company-header .flex-shrink-0 {
              flex-shrink: 0;
            }
            
            .preview-company-header .bg-gray-50 {
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            
            .preview-company-header .w-40 {
              width: 160px;
              height: 80px;
              background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
              border: 2px dashed #d1d5db;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #6b7280;
              font-size: 14px;
              font-weight: 500;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            
            .preview-company-header img {
              max-height: 80px !important;
              max-width: 160px !important;
              object-fit: contain;
            }
            
            .preview-company-header .text-right {
              text-align: right;
              flex: 1;
            }
            
            .preview-company-header .space-y-3 > * + * {
              margin-top: 12px;
            }
            
            .preview-company-header .font-bold.text-2xl {
              font-weight: bold;
              font-size: 24px;
              color: #111827;
              line-height: 1.2;
              letter-spacing: -0.025em;
            }
            
            .preview-company-header .space-y-2 > * + * {
              margin-top: 8px;
            }
            
            .preview-company-header .text-gray-700 {
              color: #374151;
            }
            
            .preview-company-header .flex.items-center.justify-end {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: 8px;
            }
            
            .preview-company-header .text-gray-500.text-sm.font-medium {
              color: #6b7280;
              font-size: 14px;
              font-weight: 500;
            }
            
            .preview-company-header .text-sm {
              font-size: 14px;
            }
            
            .preview-company-header .text-sm.font-medium {
              font-size: 14px;
              font-weight: 500;
            }
            
            .preview-company-header .pt-2.border-t {
              padding-top: 8px;
              border-top: 1px solid #e5e7eb;
            }
            
            .preview-company-header .space-y-1 > * + * {
              margin-top: 4px;
            }
            
            .preview-company-header .text-blue-600 {
              color: #2563eb;
            }
            
            .preview-company-header a {
              color: #2563eb;
              text-decoration: none;
              transition: color 0.15s ease-in-out;
            }
            
            .preview-company-header a:hover {
              color: #1d4ed8;
              text-decoration: underline;
            }
            
            h1, h2, h3 {
              color: #1e40af;
              margin-top: 25px;
              margin-bottom: 15px;
            }
            
            /* Estilo uniforme para todas as seções */
            .section-header {
              background-color: #1e40af !important;
              color: white !important;
              padding: 10px 15px;
              margin: 20px 0 15px 0;
              font-weight: bold !important;
              text-transform: uppercase;
              font-size: 14px !important;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .section-header h2 {
              margin: 0 !important;
              color: white !important;
              text-transform: uppercase;
              font-size: 14px !important;
              font-weight: bold !important;
              background: transparent !important;
            }
            
            .section-header * {
              color: white !important;
              background: transparent !important;
            }
            
            /* Força o texto branco em todos os elementos dentro do cabeçalho */
            .section-header, 
            .section-header *, 
            .section-header h2, 
            .section-header span,
            .section-header div {
              color: white !important;
              background-color: transparent !important;
            }
            
            /* Linha de assinatura */
            .signature-line {
              border-bottom: 2px solid #000;
              width: 320px;
              margin: 0 auto 8px auto;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
            .signature-area {
              margin-top: 40px;
            }
            
            .signature-block {
              text-align: center;
              margin: 60px 0;
            }
            
            .pdf-controls {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1000;
            }
            
            .pdf-controls button {
              background: #1e40af;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin-left: 10px;
              font-weight: bold;
            }
            
            .pdf-controls button:hover {
              background: #1d4ed8;
            }
            
            @media print {
              .pdf-controls {
                display: none;
              }
              .print-hide-icon {
                display: none !important;
              }
              body {
                padding: 0;
                margin: 0;
              }
              .contract-container {
                box-shadow: none;
                padding: 0;
                margin: 0;
              }
            }
          `}
        </style>
      </head>
      <body>
        <div class="contract-container">
    `);

    // Pega o conteúdo do contrato
    const contractContent = contractRef.current.innerHTML;
    newWindow.document.write(contractContent);

    // Adiciona os controles do PDF
    newWindow.document.write(`
        </div>
        <div class="pdf-controls">
          <button onclick="window.print()">Imprimir</button>
          <button onclick="window.close()">Fechar</button>
        </div>
      </body>
      </html>
    `);
    newWindow.document.close();
  };

  // Função para formatar datas usando a função utilitária
  const formatDateDisplay = (dateStr: string): string => {
    console.log("formatDateDisplay - entrada:", dateStr);
    if (!dateStr || dateStr.trim() === "" || dateStr === "NaN/NaN/NaN") {
      console.log("formatDateDisplay - string vazia ou inválida");
      return "Data não informada";
    }
    const formatted = formatDateToBrazilian(dateStr);
    console.log("formatDateDisplay - resultado:", formatted);
    return formatted || "Data não informada";
  };

  // Helper function to create section headers - ABNT compliant with consistent styling
  const SectionHeader = ({
    children,
    icon = null
  }) => <div className="bg-primary text-primary-foreground p-3 my-4 font-bold text-sm uppercase flex items-center gap-2 print:bg-blue-600 print:text-white">
      {icon && <span className="print-hide-icon">{icon}</span>}
      <h2 className="m-0 text-primary-foreground text-sm font-bold uppercase print:text-white">{children}</h2>
    </div>;
  return <Card className="w-full h-full overflow-y-auto shadow-lg">
      
      <CardContent className="text-sm p-0 h-full overflow-y-auto">
        <div ref={contractRef} className="p-4 pdf-document bg-card text-card-foreground print:bg-white print:text-black">
          {/* Company Header - único cabeçalho que aparece tanto na preview quanto no PDF */}
          <CompanyHeader />

          {/* Contract Header - ABNT compliant */}
          <div className="no-page-break mt-8">
            <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
            <p className="contract-number">(N°{contractData.contractNumber})</p>
          </div>

          {/* Parties Section */}
          <div className="no-page-break">
            <SectionHeader icon={<User className="h-4 w-4" />}>PARTES CONTRATANTES</SectionHeader>
            
            {contractData.contractors.map((contractor, index) => <div key={contractor.id} className="contractor-block no-page-break mb-4">
                <p>
                  <span className="font-bold">CONTRATANTE {index > 0 ? index + 1 : ''}:</span> <strong>{contractor.name}</strong>, pessoa jurídica de direito privado, inscrita no <strong>CNPJ/MF</strong> sob o nº <strong>{contractor.cnpj}</strong> com sede na <strong>Rua/Av: {contractor.address}</strong>, na <strong>cidade de {contractor.city}</strong>, <strong>estado {contractor.state}</strong>, neste ato representada por seu responsavel, <strong>{contractor.responsibleName}</strong>, inscrito(a) no <strong>CPF/MF</strong> sob o nº <strong>{contractor.responsibleCpf}</strong>.
                </p>
              </div>)}

            <div className="contractor-block no-page-break mb-4 bg-muted p-4 rounded-lg border border-border">
              <p className="text-foreground">
                <span className="font-bold">CONTRATADO:</span> <strong>{contractData.companyData.name || "M.L.C. LEITE"}</strong>, pessoa jurídica de direito privado, inscrita no <strong>CNPJ/MF</strong> sob o nº <strong>{contractData.companyData.cnpj || "27.995.971/0001-75"}</strong>, com sede na <strong>{contractData.companyData.address || "Av: PADRE ANTONIO CESARINO"}</strong>, na <strong>cidade de {contractData.companyData.city || "ARARAQUARA"}</strong>, <strong>estado {contractData.companyData.state || "SÃO PAULO"}</strong>, neste ato representada por seu GERENTE COMERCIAL, <strong>{contractData.companyData.responsibleName || "EDSON ROBERTO PIRES"}</strong>, inscrito(a) no <strong>CPF/MF</strong> sob o nº <strong>378.259.038.46</strong>.
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Object of Contract Section */}
          <div>
            <SectionHeader icon={<Building className="h-4 w-4" />}>OBJETO DO CONTRATO</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <p>
                <strong>1.1.</strong> O presente contrato tem por objeto a prestação de serviços pela <strong>CONTRATADA</strong>, consistindo em uma solução 
                para controle de ponto online, que abrange a liberação de um software de ponto denominado RHiD, do desenvolvedor 
                ControliD, para gerenciar marcações provenientes de relógios de ponto homologados, coletores de ponto como REP-P, 
                seja do mesmo fabricante ou terceiros desde que estjam homologados no software RHiD. Com esse software, {formatContractant()} 
                poderá optar tambem por utilizar a funcionalidade de marcação de ponto por aplicativo ou de forma web.
              </p>

              <p>
                <strong>1.2.</strong> O software fornecido está em conformidade com as diretrizes estabelecidas pela Portaria 671/21, permitindo a 
                gestão das marcações de ponto realizadas por equipamentos mencionado na clausula 1.1, bem como a possibilidade de 
                marcação de ponto via dispositivos móveis e computadores integrados ao sistema.
              </p>

              <div id="employee-count-clause" ref={el => clauseRefs.current['employee-count-clause'] = el} className="highlight-clause no-page-break">
                <p>
                  <strong>1.3.</strong> A licença do software cedida {hasMultipleContractors ? <strong>ÀS CONTRATANTES</strong> : <strong>À CONTRATANTE</strong>} permitirá o gerenciamento de até <strong className="text-blue-600">{contractData.employeeCount}</strong> colaboradores 
                  ativos e <strong className="text-blue-600">{contractData.cnpjCount}</strong> CNPJs podendo ser alterado conforme clausula 4.11. O software RHiD oferece as seguintes 
                  funcionalidades liberadas:
                </p>

                <ul className="two-column-list">
                  <li>Dashboard completo.</li>
                  <li>Gerenciamento de marcação de ponto por relógios de ponto e coletores de marcação</li>
                  <li>Marcação de ponto por celular, tablet e computador.</li>
                  <li>Tecnologia de Identificador facial servidor</li>
                  <li>Tecnologia por geolocalização.</li>
                  <li>Assinatura do cartão ponto online.</li>
                  <li>Integração com sistema de folha de pagamento.</li>
                  <li>Aplicativo para monitoramento (gestor).</li>
                  <li>Controle de horas trabalhadas.</li>
                  <li>Controle de horas faltas e atrasos.</li>
                  <li>Controle de horas extras e Banco de Horas.</li>
                  <li>Gerenciamento de horários fixos, flexíveis e escalas.</li>
                  <li>Controle de intervalos – fixos e flexíveis.</li>
                  <li>Geração de relatórios em formatos PDF, CSV e HTML.</li>
                  <li>Total conformidade com a legislação vigente.</li>
                </ul>
              </div>

              <div id="trial-period-clause" ref={el => clauseRefs.current['trial-period-clause'] = el} className="highlight-clause no-page-break">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0 print-hide-icon" />
                  <p>
                    <strong>1.4.</strong> {formatContractant()} terá um período de <strong className="text-blue-600">{contractData.trialDays}</strong> dias de utilização do software de ponto com início em <strong className="text-blue-600">{formatDateDisplay(contractData.startDate)}</strong>, para fazer teste.
                  </p>
                </div>
              </div>

              <div id="monthly-value-clause" ref={el => clauseRefs.current['monthly-value-clause'] = el} className="highlight-clause no-page-break">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-accent-foreground flex-shrink-0 print-hide-icon" />
                  <div>
                    <p dangerouslySetInnerHTML={{
                    __html: `<strong>1.5.</strong> ${getClause15Text().replace(/R\$ ([0-9,\.]+)/, '<strong class="text-blue-600">R$ $1</strong>')}`
                  }} />
                  </div>
                </div>
                <ul className="mt-2">
                  <li>Índice de Preços ao Consumidor Amplo (IPCA);</li>
                  <li>Percentual de reajuste definido pela ControliD para a revenda de licenças do software;</li>
                </ul>
              </div>

              <p>
                <strong>1.6.</strong> A licença inclui suporte técnico online ilimitado, disponibilizado pela <strong>CONTRATADA</strong> para auxiliar na utilização e na resolução de eventuais duvidas do software juntamente a equipamentos da marca ControliD.
              </p>

              <div id="renewal-date-clause" ref={el => clauseRefs.current['renewal-date-clause'] = el} className="highlight-clause no-page-break">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent-foreground flex-shrink-0 print-hide-icon" />
                  <p dangerouslySetInnerHTML={{
                  __html: `<strong>1.7.</strong> ${getClause17Text().replace(formatDateDisplay(contractData.renewalDate), `<strong class="text-blue-600">${formatDateDisplay(contractData.renewalDate)}</strong>`)}`
                }} />
                </div>
              </div>

              <p>
                <strong>1.8.</strong> A <strong>CONTRATADA</strong> se compromete a fornecer todas as funcionalidades previstas na clausula 1.3 do plano adquirido, conforme a proposta comercial aprovada por quaisquer meios de comunicação enviado.
              </p>

              <p dangerouslySetInnerHTML={{
              __html: `<strong>1.9.</strong> ${formatContractantText()} podera solicitar visitas presenciais para suporte técnico, treinamento ${formatContractantUtil(getTechnicalVisitText(technicalVisitSettings?.visit_cost || 250, technicalVisitSettings?.km_cost || 1))}`
            }} />

              <p>
                <strong>1.10.</strong> A <strong>CONTRATADA</strong> se reserva o direito de avaliar a necessidade de deslocamento técnico presencial, considerando a viabilidade e urgência do atendimento solicitado {hasMultipleContractors ? <strong>PELAS CONTRATANTES</strong> : <strong>PELA CONTRATANTE</strong>}. Caso a visita técnica seja impossibilitada, o suporte será realizado de forma remota.
              </p>

              <p dangerouslySetInnerHTML={{
              __html: `<strong>1.11.</strong> ${getClause111Text()}`
            }} />

              <p>
                <strong>1.12.</strong> A <strong>CONTRATADA</strong> se responsabiliza pela instrução do software de acordo com as normas e leis aplicáveis, bem como pelo suporte técnico via telefone, e-mail, acesso remoto e WhatsApp, de segunda a sexta-feira, das <strong className="text-blue-600">08:00 às 17:30</strong>, com <strong className="text-blue-600">1 (UMA)</strong> hora de intervalo para almoço, exceto em feriados municipais, estaduais e nacionais, não havendo expediente.
              </p>

              <p>
                <strong>1.13.</strong> O suporte técnico oferecido pela <strong>CONTRATADA</strong> deverá responder às solicitações enviadas via chat, WhatsApp ou e-mail em até <strong className="text-blue-600">4 (QUATRO)</strong> horas úteis após o recebimento da dúvida {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>}. Para solicitações realizadas por telefone, caso as linhas de suporte estejam disponíveis, o atendimento será imediato. No caso de linhas ocupadas, a <strong>CONTRATADA</strong> se compromete a retornar o contato em até <strong className="text-blue-600">24 (VINTE E QUATRO HORAS)</strong> úteis após o telefonema não atendido.
              </p>
            </div>
          </div>

          {/* Payment Section */}
          <div className="no-page-break">
            <SectionHeader icon={<DollarSign className="h-4 w-4" />}>VALOR E FORMA DE PAGAMENTO DA LICENÇA DO SOFTWARE</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <div id="monthly-payment-clause" ref={el => clauseRefs.current['monthly-payment-clause'] = el} className="highlight-clause no-page-break">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-accent-foreground flex-shrink-0 print-hide-icon" />
                  <p dangerouslySetInnerHTML={{
                  __html: `<strong>2.1.</strong> ${getClause21Text().replace(/R\$ ([0-9,\.]+)/, '<strong class="text-blue-600">R$ $1</strong>')}`
                }} />
                </div>
              </div>
              
              <div id="payment-date-clause" ref={el => clauseRefs.current['payment-date-clause'] = el} className="highlight-clause no-page-break">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0 print-hide-icon" />
                  <p>
                    <strong>2.2.</strong> Formas de Pagamento: Os pagamentos poderão ser realizados por meio de boleto bancário ou via Pix, de acordo com a preferência {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>}. O vencimento das faturas acontecerá todo dia <strong className="text-blue-600">{contractData.paymentDay}</strong>, com a primeira {getPaymentTermText(contractData.planType)} estabelecida para o dia <strong className="text-blue-600">{formatDateDisplay(contractData.paymentStartDate)}</strong>.
                  </p>
                </div>
              </div>

              <p>
                <strong>2.3.</strong> Juros e Multa por Atraso: Em caso de atraso no pagamento, incidirão juros de mora à taxa de <strong className="text-blue-600">0,33%</strong> (trinta e três centésimos por cento) ao dia, além de uma multa de <strong className="text-blue-600">2%</strong> (dois por cento) sobre o valor da fatura em atraso.
              </p>

              <p>
                <strong>2.4.</strong> Suspensão do Serviço: A inadimplência {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>} poderá resultar na suspensão imediata dos serviços prestados pela <strong>CONTRATADA</strong>, sem prejuízo à cobrança das parcelas devidas e às penalidades aplicáveis. A suspensão permanecerá em vigor até que todos os pagamentos pendentes sejam regularizados.
              </p>

              <p>
                <strong>2.5.</strong> Notificação: {formatContractant()} será devidamente notificada, por e-mail ou outro meio de comunicação sobre a suspensão dos serviços em decorrência de inadimplência, bem como acerca de qualquer alteração no valor do reajuste anual.
              </p>

              <p>
                <strong>2.6.</strong> Reajuste anual: O reajuste anual mencionado do valor na cláusula 1.5 será aplicado de forma automática na data da renovação do contrato, conforme estabelecido no objeto do contrato. A <strong>CONTRATADA</strong> se compromete a notificar {formatContractant()} sobre o novo valor reajustado com antecedência mínima de <strong className="text-blue-600">10 (dez)</strong> dias antes da renovação.
              </p>

              <p dangerouslySetInnerHTML={{
              __html: `<strong>2.7.</strong> ${getClause27Text().replace(/R\$ ([0-9,\.]+)/, '<strong class="text-blue-600">R$ $1</strong>')}`
            }} />
            </div>
          </div>

          {/* Contract Term Section */}
          <div className="contract-section">
            <SectionHeader>PRAZO DE VIGÊNCIA</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <p dangerouslySetInnerHTML={{
              __html: `<strong>3.1.</strong> ${getClause31Text()}`
            }} />

              <p>
                <strong>3.2.</strong> Na hipótese de renovação automática, o valor do contrato será reajustado conforme previsto na cláusula 1.5, respeitando o intervalo mínimo de 12 (doze) meses entre reajustes, a fim de garantir a manutenção do equilíbrio econômico-financeiro do contrato.
              </p>

              <p>
                <strong>3.3.</strong> A manifestação de qualquer das partes para a não renovação do contrato deverá ser formalizada por escrito, podendo ocorrer por meio eletrônico, desde que haja confirmação de recebimento pela outra parte.
              </p>
            </div>
          </div>

          {/* Plan Changes Section */}
          <div className="no-page-break">
            <SectionHeader>ALTERAÇÕES DE PLANO DA LICENÇA DO SOFTWARE DE PONTO</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <p>
                <strong>4.1.</strong> Qualquer alteração no plano da licença do software de ponto modelo RHiD, inicialmente adquirido {hasMultipleContractors ? <strong>PELAS CONTRATANTES</strong> : <strong>PELA CONTRATANTE</strong>} conforme objeto desse contrato, acarretará na modificação do valor a ser pago, conforme o novo plano escolhido ou conforme os acréscimos de valores relativos a serviços adicionais solicitados {hasMultipleContractors ? <strong>PELAS CONTRATANTES</strong> : <strong>PELA CONTRATANTE</strong>}, de acordo com a tabela de adicionais vigente na data da solicitação.
              </p>

              <p>
                <strong>4.2.</strong> {formatContractant()} deverá solicitar a alteração do plano por escrito, por meio de e-mail ou outro meio de comunicação acordado entre as partes, detalhando as especificidades da alteração desejada, incluindo a possível inclusão de novos funcionários e/ou CNPJs.
              </p>

              <p>
                <strong>4.3.</strong> A <strong>CONTRATADA</strong> se compromete a fornecer, em até 1 (um) dia útil, uma proposta de aditivo contratual contendo os novos termos e condições, incluindo o novo valor do plano ou os acréscimos de valores conforme a tabela de adicionais, bem como os ajustes referentes à inclusão de novos funcionários e/ou CNPJs, se aplicável.
              </p>

              <p>
                <strong>4.4.</strong> O aditivo contratual ou a alteração do plano atual, mencionada na cláusula 4.1, deverá ser formalmente aceito por ambas as partes, seja por assinatura ou por meio de comunicação acordado, para que a alteração do plano ou a implementação dos serviços adicionais solicitados, incluindo a inclusão de novos funcionários e/ou CNPJs, seja efetivada.
              </p>

              <p>
                <strong>4.5.</strong> {formatContractant()} concordan que, enquanto o aditivo contratual não for formalmente aceito ou confirmado por meio de comunicação, continuará a ser cobrado o valor do plano vigente da cláusula 2.1.
              </p>

              <p>
                <strong>4.6.</strong> Caso {formatContractant()} não concorde com os novos termos e condições propostos no aditivo contratual, deverá comunicar formalmente à <strong>CONTRATADA</strong>, em até 5 (cinco) dias úteis após o recebimento do valor do aditivo, permanecendo, nesse caso, as condições do plano inicialmente adquirido.
              </p>

              <p dangerouslySetInnerHTML={{
              __html: `<strong>4.7.</strong> ${formatContractantUtil(getClause47Text(contractData.planType || "mensal"))}`
            }} />

              <p>
                <strong>4.8.</strong> A <strong>CONTRATADA</strong> reserva-se o direito de modificar a tabela de adicionais e/ou os valores dos novos planos a qualquer momento, sem a necessidade de aviso prévio.
              </p>

              <p>
                <strong>4.9.</strong> Em caso de discordância {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>} quanto às modificações mencionadas na cláusula 4.8, esta poderá rescindir o contrato, sem qualquer penalidade, desde que comunique formalmente a <strong>CONTRATADA</strong> em até 30 (trinta) dias após o recebimento do aviso das modificações.
              </p>

              <p>
                <strong>4.10.</strong> O não exercício, por qualquer das partes, de qualquer direito ou faculdade que lhe caiba por força deste contrato ou da legislação aplicável, bem como eventual tolerância a infrações contratuais da outra parte, não implicará em renúncia de direito ou novação contratual.
              </p>

              <div className="p-3 rounded-lg border border-amber-200 my-3 no-page-break bg-transparent">
                <p className="mb-2" dangerouslySetInnerHTML={{
                __html: `<strong>4.11.</strong> ${getClause411Text()}`
              }} />

                {(() => {
                const tableData = generateDynamicTables();
                return <>
                      <div className="mb-4">
                        <p className="font-semibold mb-2">Tabela de Valores por Faixa de Funcionários e CNPJs</p>
                        <Table className="my-3 border-collapse">
                          <TableHeader>
                            <TableRow className="bg-contract hover:bg-contract">
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3 bg-transparent">Faixa de Funcionários</TableHead>
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3">CNPJs Incluídos</TableHead>
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3 bg-transparent">{tableData.multiplier.label}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData.mainTable.map((row, index) => <TableRow key={index} className={index % 2 === 0 ? "bg-card hover:bg-muted" : "bg-muted hover:bg-accent"}>
                                <TableCell className="border border-gray-300 py-1.5 px-3">{row.range}</TableCell>
                                <TableCell className="border border-gray-300 py-1.5 px-3">{row.cnpjs}</TableCell>
                                <TableCell className="border border-gray-300 py-1.5 px-3">R$ {row.planValue.toFixed(2).replace('.', ',')}</TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>

                       <div className="mb-4">
                         <p className="mb-2">Para faixas superiores ao maior plano cadastrado, será cobrado o valor adicional de R$ {(tableData.additionalEmployees / tableData.multiplier.factor).toFixed(2).replace('.', ',')} por mês para cada novo grupo de até 100 funcionários. Esse valor também será ajustado conforme o plano contratado, conforme abaixo:</p>
                        <Table className="my-3 border-collapse">
                          <TableHeader>
                            <TableRow className="bg-contract hover:bg-contract">
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3">Grupo adicional de até 100 funcionários</TableHead>
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3">{tableData.multiplier.label}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="bg-card hover:bg-muted">
                              <TableCell className="border border-gray-300 py-1.5 px-3">Valor adicional</TableCell>
                              <TableCell className="border border-gray-300 py-1.5 px-3">R$ {tableData.additionalEmployees.toFixed(2).replace('.', ',')}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                       <div className="mb-4">
                         <p className="mb-2">Caso {formatContractant()} deseje adicionar CNPJs extras além dos incluídos no plano contratado, será cobrado o valor adicional de <strong>R$ {(tableData.additionalCNPJ / tableData.multiplier.factor).toFixed(2).replace('.', ',')}</strong> por CNPJ adicional, também proporcional à periodicidade contratada:</p>
                        <Table className="my-3 border-collapse">
                          <TableHeader>
                            <TableRow className="bg-contract hover:bg-contract">
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3">CNPJ adicional</TableHead>
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3">{tableData.multiplier.label}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="bg-card hover:bg-muted">
                              <TableCell className="border border-gray-300 py-1.5 px-3">Valor adicional</TableCell>
                              <TableCell className="border border-gray-300 py-1.5 px-3">R$ {tableData.additionalCNPJ.toFixed(2).replace('.', ',')}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div className="mb-4">
                        <p className="mb-2">Se for contratado o recurso opcional de reconhecimento facial, em que o funcionário realiza a marcação de ponto via celular com uma foto comparada à imagem cadastrada (com fluxo de aprovação em caso de não reconhecimento), será cobrado o valor adicional por funcionário ativo conforme o plano contratado:</p>
                        <Table className="my-3 border-collapse">
                          <TableHeader>
                            <TableRow className="bg-contract hover:bg-contract">
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3">Reconhecimento facial por funcionário ativo</TableHead>
                              <TableHead className="text-white font-medium border border-gray-300 py-2 px-3">{tableData.multiplier.label}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="bg-card hover:bg-muted">
                              <TableCell className="border border-gray-300 py-1.5 px-3">Valor adicional</TableCell>
                              <TableCell className="border border-gray-300 py-1.5 px-3">R$ {tableData.facialRecognition.toFixed(2).replace('.', ',')}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </>;
              })()}
              </div>

              <p dangerouslySetInnerHTML={{
              __html: `<strong>4.12.</strong> ${getClause412Text()}`
            }} />
            </div>
          </div>

          {/* Cancellation Section */}
          <div className="no-page-break">
            <SectionHeader icon={<AlertCircle className="h-4 w-4" />}>CANCELAMENTO</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <p>
                <strong>5.1.</strong> Caso {formatContractant()} decida cancelar a utilização da licença do software RHiD, deverá comunicar a decisão com, no mínimo, 30 (trinta) dias de antecedência à <strong>CONTRATADA</strong>, por meio de notificação escrita enviada ao endereço de e-mail ou whatsApp informado neste contrato.
              </p>

              <p>
                <strong>5.2.</strong> Durante o período de aviso prévio de 30 (trinta) dias, {formatContractant()} deverá extrair todas as informações e dados que considerar pertinentes do sistema, sendo de sua inteira responsabilidade realizar backups e assegurar a integridade das informações desejadas para migração ou arquivamento.
              </p>

              <p>
                <strong>5.3.</strong> A <strong>CONTRATADA</strong> não se responsabilizará por qualquer perda de dados ou informações {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>} após a inativação do sistema decorrente do cancelamento da licença, ficando isenta de qualquer obrigação de recuperação ou restituição de dados a partir dessa data.
              </p>

              <p>
                <strong>5.4.</strong> {formatContractant()} reconhece e concorda que, após o término do período de aviso prévio e a efetivação do cancelamento, todos os acessos ao software RHiD serão imediatamente suspensos. {formatContractant()} poderá solicitar a reativação do software, bem como a recuperação dos dados armazenados, mediante novo pedido de ativação. As condições para a reativação seguirão as mesmas cláusulas deste contrato, sendo aplicável o valor da tabela atual em vigor na data do pedido.
              </p>

              <p>
                <strong>5.5.</strong> No caso de não observância do prazo de 30 (trinta) dias para a comunicação prévia do cancelamento, {formatContractant()} ficará sujeita ao pagamento de uma nova mensalidade, conforme estipulado nas cláusulas de renovação e multa deste contrato, até que o cancelamento seja devidamente processado e confirmado pela <strong>CONTRATADA</strong>.
              </p>

              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border no-page-break">
                <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0 print-hide-icon" />
                <p>
                  <strong>5.6.</strong> Rescisão Antecipada: Se {formatContractant()} optar por encerrar o contrato antes do prazo acordado, não haverá devolução de valores já pagos, mesmo que correspondam a períodos não utilizados. O valor pago refere-se à prestação dos serviços e à licença do software durante o tempo contratado.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Support Section */}
          <div className="no-page-break">
            <SectionHeader icon={<Clock className="h-4 w-4" />}>SUPORTE TÉCNICO ONLINE E PRESENCIAL</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border no-page-break">
                <Clock className="h-3 w-3 text-primary flex-shrink-0 print-hide-icon" />
                <p>
                  <strong>6.1.</strong> O suporte técnico oferecido pela <strong>CONTRATADA</strong> deverá responder às solicitações enviadas via chat, WhatsApp ou e-mail em até 4 (quatro) horas úteis após o recebimento da dúvida ou problema reportado {hasMultipleContractors ? <strong>PELAS CONTRATANTES</strong> : <strong>PELA CONTRATANTE</strong>}, sem qualquer custo adicional.
                </p>
              </div>

              <p>
                <strong>6.2.</strong> Para as solicitações realizadas por telefone, o atendimento será imediato, desde que as linhas de suporte estejam disponíveis. Caso as linhas estejam ocupadas, a <strong>CONTRATADA</strong> se compromete a retornar o contato em até 24 (vinte e quatro) horas úteis após a tentativa de telefonema não atendido, também sem custos para {formatContractant()}.
              </p>

              <p>
                <strong>6.3.</strong> A <strong>CONTRATADA</strong> reserva-se o direito de conceder férias coletivas durante o período de final de ano, durante o qual o suporte técnico será disponibilizado apenas para atendimentos emergenciais. A <strong>CONTRATADA</strong> deverá informar {hasMultipleContractors ? <strong>ÀS CONTRATANTES</strong> : <strong>À CONTRATANTE</strong>} com uma antecedência mínima de 10 (dez) dias sobre o período das férias coletivas e os procedimentos a serem seguidos para o acionamento do suporte emergencial.
              </p>

              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border no-page-break">
                <Clock className="h-3 w-3 text-accent-foreground flex-shrink-0 print-hide-icon" />
                <p>
                  <strong>6.4.</strong> O suporte técnico será prestado através de telefone, e-mail, acesso remoto e WhatsApp, de segunda a sexta-feira, das 08:00 às 17:30, com 1 (uma) hora de intervalo para almoço, exceto em feriados municipais, estaduais e nacionais, quando não haverá expediente. Todos esses atendimentos online serão realizados sem custo para {formatContractant()}.
                </p>
              </div>

              <p dangerouslySetInnerHTML={{
              __html: `<strong>6.5.</strong> Atendimentos presenciais, por sua vez, ${getTechnicalVisitDetailText(technicalVisitSettings?.visit_cost || 250, technicalVisitSettings?.km_cost || 1)} ${hasMultipleContractors ? '<strong>DAS CONTRATANTES</strong>' : '<strong>DA CONTRATANTE</strong>'}. A <strong>CONTRATADA</strong> deve ser notificada previamente e deve concordar com a realização do atendimento presencial, reservando-se o direito de analisar a viabilidade do atendimento. Contudo, não deixará de prestar suporte para a execução do atendimento, garantindo que ${hasMultipleContractors ? '<strong>AS CONTRATANTES</strong>' : '<strong>A CONTRATANTE</strong>'} receba a assistência necessária. É importante ressaltar que os valores determinados poderão sofrer alterações a depender da data da solicitação do atendimento técnico, devendo ${hasMultipleContractors ? '<strong>AS CONTRATANTES</strong>' : '<strong>A CONTRATANTE</strong>'} ser informada sobre os valores atuais.`
            }} />
            </div>
          </div>

          {/* Client Obligations Section */}
          <div className="no-page-break">
            <SectionHeader icon={<CheckCircle className="h-4 w-4" />}>OBRIGAÇÕES DA CONTRATANTE</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <div id="payment-obligation-clause" ref={el => clauseRefs.current['payment-obligation-clause'] = el} className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border no-page-break">
                <Calendar className="h-3 w-3 text-primary flex-shrink-0 print-hide-icon" />
                <p dangerouslySetInnerHTML={{
                __html: `<strong>7.1.</strong> ${getClause71Text(contractData.planType || 'mensal')}`
              }} />
              </div>

              <p>
                <strong>7.2.</strong> O responsável pela utilização do software de ponto RHiD, nos termos deste contrato, deverá fornecer informações verdadeiras, precisas e atualizadas. Tais informações devem estar em estrita conformidade com a legislação trabalhista vigente, incluindo, mas não se limitando, à Consolidação das Leis do Trabalho (CLT), às normas regulamentadoras do Ministério do Trabalho e Emprego (MTE) e aos acordos coletivos aplicáveis à categoria profissional dos colaboradores gerenciados {hasMultipleContractors ? <strong>PELAS CONTRATANTES</strong> : <strong>PELA CONTRATANTE</strong>}.
              </p>

              <p>
                <strong>7.3.</strong> {formatContractant()} assume total responsabilidade pelos ajustes na apuração do ponto e pelas configurações dos equipamentos adquiridos, seja da <strong>CONTRATADA</strong> ou de terceiros. Qualquer inserção incorreta de dados que venha a prejudicar o colaborador, as própria CONTRATANTE ou terceiros será de sua exclusiva responsabilidade, isentando a <strong>CONTRATADA</strong> de qualquer ônus, responsabilidade ou sanção que possa ser imposta {hasMultipleContractors ? <strong>ÀS CONTRATANTES</strong> : <strong>À CONTRATANTE</strong>} ou a terceiros.
              </p>

              <p>
                <strong>7.4.</strong> {formatContractant()} compromete-se a utilizar o software e os equipamentos exclusivamente para os fins previstos no contrato, abstendo-se de qualquer uso inadequado ou em desacordo com as orientações fornecidas pela <strong>CONTRATADA</strong> ou pelo fabricante.
              </p>

              <p>
                <strong>7.5.</strong> {formatContractant()} deverá comunicar à <strong>CONTRATADA</strong> qualquer defeito ou problema técnico nos equipamentos ou no software, tão logo tome conhecimento, para que as medidas de suporte e manutenção possam ser realizadas de forma oportuna e eficaz.
              </p>

              <p>
                <strong>7.6.</strong> {formatContractant()} assume plena responsabilidade por quaisquer sanções, multas ou danos decorrentes do uso inadequado dos equipamentos ou do software, bem como pela inserção de informações falsas ou incorretas, que possam resultar em infrações às leis trabalhistas ou aos acordos coletivos aplicáveis.
              </p>
            </div>
          </div>

          {/* Vendor Obligations Section */}
          <div className="no-page-break">
            <SectionHeader icon={<Shield className="h-4 w-4" />}>OBRIGAÇÕES DA CONTRATADA</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border no-page-break">
                <CheckCircle className="h-3 w-3 text-accent-foreground flex-shrink-0 print-hide-icon" />
                <p>
                  <strong>8.1.</strong> A <strong>CONTRATADA</strong> obriga-se a fornecer a licença de uso do software modelo RHiD, conforme as funcionalidades especificada no objeto da clausula 1.3 deste contrato, garantindo a funcionalidade plena e operante do software para {formatContractant()}.
                </p>
              </div>

              <p>
                <strong>8.2.</strong> A <strong>CONTRATADA</strong> deverá prestar suporte técnico online de maneira contínua, abrangendo auxílio via telefone, e-mail, acesso remoto e WhatsApp. Este suporte será disponibilizado de segunda a sexta-feira, das 08:00 às 17:30, com uma hora de intervalo para almoço, excetuando-se os feriados municipais, estaduais e nacionais.
              </p>

              <p>
                <strong>8.3.</strong> A <strong>CONTRATADA</strong> compromete-se a realizar a configuração inicial juntamente {hasMultipleContractors ? <strong>ÀS CONTRATANTES</strong> : <strong>À CONTRATANTE</strong>} do software RHiD, de acordo com as normas, acordos e leis aplicáveis, assegurando que o software atenda às necessidades operacionais {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>} e esteja em conformidade com padrões técnicos e legais vigentes.
              </p>

              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border no-page-break">
                <Shield className="h-3 w-3 text-accent-foreground flex-shrink-0 print-hide-icon" />
                <p>
                  <strong>8.4.</strong> A <strong>CONTRATADA</strong> deve garantir que todos os processos e funcionalidades do software estejam em conformidade com a Lei Geral de Proteção de Dados (LGPD), Lei nº 13.709/2018, assegurando a privacidade e proteção dos dados pessoais dos colaboradores {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>}.
                </p>
              </div>

              <p>
                <strong>8.5.</strong> A <strong>CONTRATADA</strong> terá a responsabilidade de disponibilizar todas as funcionalidades previstas no plano adquirido {hasMultipleContractors ? <strong>PELAS CONTRATANTES</strong> : <strong>PELA CONTRATANTE</strong>}, conforme detalhado na proposta comercial anexada a este contrato.
              </p>

              <p>
                <strong>8.6.</strong> A <strong>CONTRATADA</strong> se compromete a manter a qualidade e continuidade dos serviços de suporte técnico, devendo resolver eventuais problemas técnicos de forma célere e eficaz, minimizando qualquer impacto nas operações {hasMultipleContractors ? <strong>DAS CONTRATANTES</strong> : <strong>DA CONTRATANTE</strong>}.
              </p>
            </div>
          </div>

          {/* Other Provisions Section */}
          <div className="no-page-break">
            <SectionHeader>OUTRAS DISPOSIÇÕES</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <p>
                <strong>9.1.</strong> A <strong>CONTRATADA</strong> declara, para todos os efeitos legais, que está devidamente autorizada pela CONTROLID Indústria, Comércio de Hardware e Serviços de Tecnologia Ltda, inscrita no CNPJ nº 08.238.299/0001-29, a comercializar tanto o hardware quanto o software fornecidos pela CONTROLID, garantindo que todas as transações estejam em conformidade com as normas e requisitos legais aplicáveis.
              </p>

              <p>
                <strong>9.2.</strong> A autorização referida abrange tanto a venda quanto a locação dos equipamentos e licenças de softwares da ControliD, conforme os termos expressos neste contrato, assegurando que {formatContractant()} tenha acesso às soluções tecnológicas necessárias conforme as especificações acordadas.
              </p>

              <p>
                <strong>9.3.</strong> A <strong>CONTRATADA</strong> certifica que possui autorização da CONTROLID Indústria, Comércio de Hardware e Serviços de Tecnologia Ltda para a comercialização do hardware e da licença do software de ponto RHiD. Contudo, a <strong>CONTRATADA</strong> não se responsabiliza pelo desenvolvimento contínuo, manutenção ou atualização do mencionado software, responsabilidades essa que são exclusivamente atribuídas à CONTROLID Indústria, Comércio de Hardware e Serviços de Tecnologia Ltda.
              </p>

              <p>
                <strong>9.4.</strong> A <strong>CONTRATADA</strong> não será responsabilizada por falhas, bugs, interrupções ou quaisquer problemas técnicos que possam ocorrer no software RHiD, desde que tais questões não sejam atribuíveis à sua competência direta. Nesses casos, {formatContractant()} deverá notificar a <strong>CONTRATADA</strong>, que, por sua vez, buscará a solução diretamente com a CONTROLID Indústria, Comércio de Hardware e Serviços de Tecnologia Ltda, a fim de resolver os problemas identificados.
              </p>

              <p>
                <strong>9.5.</strong> {formatContractant()} reconhece e aceita que a utilização do software RHiD está sujeita às condições e termos de uso estabelecidos pela CONTROLID Indústria, Comércio de Hardware e Serviços de Tecnologia Ltda. A <strong>CONTRATADA</strong> não terá ingerência sobre eventuais alterações que esses termos possam sofrer, assim como não será responsável por notificações ou quaisquer modificações que a CONTROLID venha a implementar.
              </p>

              <p>
                <strong>9.6.</strong> Na hipótese de que a <strong>CONTRATADA</strong> venha a ser impossibilitada de prestar os serviços de suporte técnico em decorrência de alterações, descontinuação ou quaisquer modificações no software RHiD, promovidas pela CONTROLID Indústria, Comércio de Hardware e Serviços de Tecnologia Ltda, {formatContractant()} será notificada com antecedência mínima de 30 (trinta) dias. Essa notificação terá o intuito de proporcionar um tempo hábil para que ambas as partes possam tomar as medidas necessárias à minimização dos impactos decorrentes dessa impossibilidade.
              </p>
            </div>
          </div>

          {/* Jurisdiction Section */}
          <div className="no-page-break">
            <SectionHeader>FORO</SectionHeader>
            
            <div className="space-y-4 text-foreground">
              <p>
                <strong>10.1.</strong> Fica eleito o foro da Comarca de Araraquara/SP para dirimir quaisquer dúvidas, controvérsias ou litígios oriundos do presente contrato. A parte {formatContractant()} concordam expressamente em renunciar a qualquer outro foro, por mais privilegiado que seja, para a resolução de questões decorrentes deste instrumento, inclusive aquelas relativas à sua interpretação, execução, cumprimento, inadimplemento, revisão e rescisão.
              </p>

              <p>
                <strong>10.2.</strong> A renúncia a qualquer outro foro não prejudica o direito das partes de recorrer a outros mecanismos alternativos de resolução de conflitos, como mediação e arbitragem, desde que haja acordo mútuo e expresso nesse sentido.
              </p>
            </div>
          </div>

          {/* Signature Section - styled per ABNT */}
          <div className="signature-area no-page-break">
            <p className="text-center font-semibold">TERMO DE ASSINATURA</p>
            
            <p className="text-center mt-4">
              As partes abaixo identificadas declaram ter lido e compreendido integralmente os termos e condições do contrato mencionado, concordando em cumpri-los em sua totalidade.
            </p>

            <p className="text-center mt-4 text-muted-foreground">
              {contractData.companyData.city || "Araraquara"}, {getCurrentDate()}
            </p>

            <div className="space-y-16 mt-12">
              {contractData.contractors.map((contractor, index) => <div key={contractor.id} className="signature-block">
                  <div className="signature-line"></div>
                  <p>Assinatura do (a) responsável {hasMultipleContractors ? `da CONTRATANTE ${index + 1}` : "da CONTRATANTE"}: {contractor.name}</p>
                </div>)}

              <div className="signature-block">
                <div className="signature-line"></div>
                <p>Assinatura do (a) responsável <strong>CONTRATADA</strong>: {contractData.companyData.name || "M.L.C. LEITE - ARAPONTO"}</p>
              </div>
            </div>

            <p className="mt-6 text-center text-gray-700">
              Este Termo de Assinatura tem a finalidade de confirmar o acordo mútuo entre as partes e será considerado parte integrante do contrato.
            </p>
          </div>
        </div>
        <div className="sticky bottom-4 z-10 flex justify-center">
          <Button onClick={openContractInNewWindow} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 flex items-center gap-2 shadow-lg">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default ContractPreview;