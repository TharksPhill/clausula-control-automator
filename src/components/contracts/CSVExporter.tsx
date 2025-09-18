
export class CSVExporter {
  static exportContracts(contracts: any[]) {
    const headers = [
      'Número do contrato',
      'Nome do contratante',
      'CPF do contratante',
      'CNPJ',
      'Quantidade de funcionários',
      'Quantidade de CNPJs',
      'Nome do responsável',
      'CPF do responsável',
      'Data de pagamento',
      'Data de início do contrato',
      'Cidade',
      'Estado',
      'CEP',
      'Número (endereço)',
      'Valor do contrato',
      'Tipo de plano'
    ];

    const csvData = contracts.map(contract => {
      const contractor = contract.contractors?.[0] || {};
      
      return [
        contract.contract_number || '',
        contractor.name || '',
        contractor.responsible_cpf || '',
        contractor.cnpj || '',
        contract.employee_count || '0',
        contract.cnpj_count || '1',
        contractor.responsible_name || '',
        contractor.responsible_cpf || '',
        contract.payment_day || '',
        contract.start_date || '',
        contractor.city || '',
        contractor.state || '',
        '', // CEP - não temos no modelo atual
        '', // Número do endereço - extrair do address se necessário
        contract.monthly_value || '0',
        contract.plan_type || 'mensal'
      ];
    });

    // Adicionar headers no início
    const allData = [headers, ...csvData];

    // Converter para CSV
    const csvContent = allData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`)
         .join(',')
    ).join('\n');

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `contratos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
