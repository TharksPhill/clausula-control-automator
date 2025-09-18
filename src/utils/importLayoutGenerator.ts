
// Função para gerar CPF válido
function generateValidCPF(): string {
  const randomDigits = () => Math.floor(Math.random() * 10);
  
  // Gera os 9 primeiros dígitos
  const digits = [];
  for (let i = 0; i < 9; i++) {
    digits.push(randomDigits());
  }
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  const digit1 = remainder === 10 || remainder === 11 ? 0 : remainder;
  digits.push(digit1);
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = (sum * 10) % 11;
  const digit2 = remainder === 10 || remainder === 11 ? 0 : remainder;
  digits.push(digit2);
  
  // Formata o CPF
  const cpf = digits.join('');
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

// Função para gerar CNPJ válido
function generateValidCNPJ(): string {
  const randomDigits = () => Math.floor(Math.random() * 10);
  
  // Gera os 12 primeiros dígitos
  const digits = [];
  for (let i = 0; i < 8; i++) {
    digits.push(randomDigits());
  }
  digits.push(0, 0, 0, 1); // Branch comum
  
  // Calcula o primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  digits.push(digit1);
  
  // Calcula o segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  digits.push(digit2);
  
  // Formata o CNPJ
  const cnpj = digits.join('');
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}

export class ImportLayoutGenerator {
  static generateImportLayout() {
    const headers = [
      // Colunas obrigatórias
      'Número do contrato (*)',
      'Nome do contratante (*)',
      'CPF do contratante',  // Agora opcional
      'CNPJ (*)',
      'Quantidade de funcionários (*)',
      'Quantidade de CNPJs (*)',
      'Nome do responsável (*)',
      'CPF do responsável (*)',
      'Data de pagamento (dia do mês)',
      'Data de início do contrato (*)',
      'Data de início dos pagamentos',
      'Cidade (*)',
      'Estado (*)',
      'Email',
      'Endereço completo',
      'Valor do contrato (*)',
      'Tipo de plano (*)',
      'RG do responsável',
      'Desconto semestral (%)',
      'Desconto anual (%)',
      'Dias de teste',
      'Data de renovação'
    ];

    // Criar linha de exemplo com dados válidos
    const exampleData = [
      '001',                      // Número do contrato
      'Empresa Exemplo Ltda',     // Nome do contratante
      generateValidCPF(),         // CPF do contratante (válido e opcional)
      generateValidCNPJ(),        // CNPJ (válido)
      '50',                      // Quantidade de funcionários
      '1',                       // Quantidade de CNPJs
      'João Silva',              // Nome do responsável
      generateValidCPF(),        // CPF do responsável (válido)
      '10',                      // Data de pagamento
      '2024-01-01',              // Data de início (formato YYYY-MM-DD)
      '2024-02-01',              // Data de início dos pagamentos
      'São Paulo',               // Cidade
      'SP',                      // Estado
      'joao@empresa.com',        // Email
      'Rua das Flores, 123, Centro', // Endereço
      '1500.00',                 // Valor do contrato
      'mensal',                  // Tipo de plano
      '12.345.678-9',            // RG do responsável
      '5',                       // Desconto semestral
      '10',                      // Desconto anual
      '30',                      // Dias de teste
      '2025-01-01'               // Data de renovação
    ];

    // Instruções detalhadas
    const instructions = [
      '',
      '=== INSTRUÇÕES PARA IMPORTAÇÃO ===',
      '',
      '1. FORMATO DO ARQUIVO:',
      '   - Salve como: CSV (separado por vírgula)',
      '   - Codificação: UTF-8',
      '   - Extensão: .csv',
      '',
      '2. COMO SALVAR NO EXCEL:',
      '   - Arquivo → Salvar Como → Escolha "CSV (separado por vírgulas) (*.csv)"',
      '   - Certifique-se de usar vírgula como separador',
      '',
      '3. COMO SALVAR NO GOOGLE SHEETS:',
      '   - Arquivo → Fazer download → Valores separados por vírgula (.csv)',
      '',
      '4. COLUNAS OBRIGATÓRIAS (marcadas com *):',
      '   - Devem estar sempre preenchidas',
      '   - Não podem estar vazias',
      '',
      '5. FORMATOS ESPECÍFICOS:',
      '   - Datas: YYYY-MM-DD (exemplo: 2024-03-15)',
      '   - CPF: XXX.XXX.XXX-XX (com pontos e hífen) - deve ser válido',
      '   - CNPJ: XX.XXX.XXX/XXXX-XX (com pontos, barra e hífen) - deve ser válido',
      '   - Valores monetários: use ponto para decimais (exemplo: 1500.00)',
      '   - Tipo de plano: exatamente "mensal", "semestral" ou "anual"',
      '   - Estados: use siglas (SP, RJ, MG, etc.)',
      '',
      '6. OBSERVAÇÕES IMPORTANTES:',
      '   - Não altere os nomes das colunas',
      '   - Não deixe linhas vazias entre os dados',
      '   - Remova esta seção de instruções antes de importar',
      '   - A primeira linha deve conter apenas os cabeçalhos',
      '   - Máximo de 1000 contratos por importação',
      '   - Use CPFs e CNPJs válidos (o sistema valida os documentos)',
      '   - CPF do contratante é opcional (pode ficar vazio)',
      '',
      '7. DICA IMPORTANTE:',
      '   - Os CPFs e CNPJs precisam ser VÁLIDOS',
      '   - Use geradores online de CPF/CNPJ válidos se necessário',
      '   - O sistema verifica a validade dos documentos',
      '',
      '8. ERROS COMUNS:',
      '   - CPF/CNPJ inválidos ou mal formatados',
      '   - Datas em formato brasileiro (DD/MM/AAAA)',
      '   - Tipo de plano com texto diferente de mensal/semestral/anual',
      '   - Valores com vírgula como separador decimal',
      '',
      '=== FIM DAS INSTRUÇÕES ==='
    ];

    // Combinar tudo
    const csvContent = [
      headers.join(','),
      exampleData.join(','),
      ...instructions
    ].join('\n');

    // Download do arquivo
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `layout_importacao_contratos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  }
}
