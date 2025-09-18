// Mapeamento de CNAE para segmentos de mercado
export const cnaeToSegment: Record<string, string> = {
  // Alimentação
  '5611-2': 'Alimentação',
  '5612-1': 'Alimentação',
  '5620-1': 'Alimentação',
  '4721-1': 'Alimentação',
  '4722-9': 'Alimentação',
  '1091-1': 'Alimentação',
  '1092-9': 'Alimentação',
  '1093-7': 'Alimentação',
  '1094-5': 'Alimentação',
  '1095-3': 'Alimentação',
  '1096-1': 'Alimentação',
  '1099-6': 'Alimentação',
  
  // Construção
  '4120-4': 'Construção',
  '4211-1': 'Construção',
  '4212-0': 'Construção',
  '4213-8': 'Construção',
  '4221-9': 'Construção',
  '4222-7': 'Construção',
  '4223-5': 'Construção',
  '4291-0': 'Construção',
  '4292-8': 'Construção',
  '4299-5': 'Construção',
  '4311-8': 'Construção',
  '4312-6': 'Construção',
  '4313-4': 'Construção',
  '4319-3': 'Construção',
  '4321-5': 'Construção',
  '4322-3': 'Construção',
  '4329-1': 'Construção',
  '4330-4': 'Construção',
  '4391-6': 'Construção',
  '4399-1': 'Construção',
  
  // Comércio Varejista
  '4711-3': 'Comércio',
  '4712-1': 'Comércio',
  '4713-0': 'Comércio',
  '4723-7': 'Comércio',
  '4724-5': 'Comércio',
  '4729-6': 'Comércio',
  '4731-8': 'Comércio',
  '4732-6': 'Comércio',
  '4741-5': 'Comércio',
  '4742-3': 'Comércio',
  '4743-1': 'Comércio',
  '4744-0': 'Comércio',
  '4751-2': 'Comércio',
  '4752-1': 'Comércio',
  '4753-9': 'Comércio',
  '4754-7': 'Comércio',
  '4755-5': 'Comércio',
  '4757-1': 'Comércio',
  '4759-8': 'Comércio',
  '4761-0': 'Comércio',
  '4762-8': 'Comércio',
  '4763-6': 'Comércio',
  '4771-7': 'Comércio',
  '4772-5': 'Comércio',
  '4773-3': 'Comércio',
  '4774-1': 'Comércio',
  '4781-4': 'Comércio',
  '4782-2': 'Comércio',
  '4783-1': 'Comércio',
  '4784-9': 'Comércio',
  '4785-7': 'Comércio',
  '4789-0': 'Comércio',
  
  // Saúde
  '8610-1': 'Saúde',
  '8620-6': 'Saúde',
  '8621-6': 'Saúde',
  '8622-4': 'Saúde',
  '8630-5': 'Saúde',
  '8640-2': 'Saúde',
  '8650-0': 'Saúde',
  '8660-7': 'Saúde',
  '8690-9': 'Saúde',
  '8711-5': 'Saúde',
  '8712-3': 'Saúde',
  '8720-4': 'Saúde',
  '8730-1': 'Saúde',
  '8800-6': 'Saúde',
  
  // Educação
  '8511-2': 'Educação',
  '8512-1': 'Educação',
  '8513-9': 'Educação',
  '8520-1': 'Educação',
  '8531-7': 'Educação',
  '8532-5': 'Educação',
  '8533-3': 'Educação',
  '8541-4': 'Educação',
  '8542-2': 'Educação',
  '8550-3': 'Educação',
  '8591-1': 'Educação',
  '8592-9': 'Educação',
  '8593-7': 'Educação',
  '8599-6': 'Educação',
  
  // Tecnologia
  '6201-5': 'Tecnologia',
  '6202-3': 'Tecnologia',
  '6203-1': 'Tecnologia',
  '6204-0': 'Tecnologia',
  '6209-1': 'Tecnologia',
  '6311-9': 'Tecnologia',
  '6312-7': 'Tecnologia',
  '6319-4': 'Tecnologia',
  '6391-7': 'Tecnologia',
  '6399-2': 'Tecnologia',
  '9511-8': 'Tecnologia',
  '9512-6': 'Tecnologia',
  
  // Indústria
  '1011-2': 'Indústria',
  '1012-1': 'Indústria',
  '1013-9': 'Indústria',
  '1020-1': 'Indústria',
  '1031-7': 'Indústria',
  '1032-5': 'Indústria',
  '1033-3': 'Indústria',
  '1041-4': 'Indústria',
  '1042-2': 'Indústria',
  '1043-1': 'Indústria',
  '1051-1': 'Indústria',
  '1052-0': 'Indústria',
  '1053-8': 'Indústria',
  '1061-9': 'Indústria',
  '1062-7': 'Indústria',
  '1063-5': 'Indústria',
  '1064-3': 'Indústria',
  '1065-1': 'Indústria',
  '1066-0': 'Indústria',
  '1069-4': 'Indústria',
  '1071-6': 'Indústria',
  '1072-4': 'Indústria',
  '1081-3': 'Indústria',
  '1082-1': 'Indústria',
  
  // Transporte
  '4911-6': 'Transporte',
  '4912-4': 'Transporte',
  '4921-3': 'Transporte',
  '4922-1': 'Transporte',
  '4923-0': 'Transporte',
  '4924-8': 'Transporte',
  '4929-9': 'Transporte',
  '4930-2': 'Transporte',
  '4940-0': 'Transporte',
  '4950-7': 'Transporte',
  '5011-4': 'Transporte',
  '5012-2': 'Transporte',
  '5021-1': 'Transporte',
  '5022-0': 'Transporte',
  '5030-1': 'Transporte',
  '5091-2': 'Transporte',
  '5099-8': 'Transporte',
  
  // Serviços
  '9601-7': 'Serviços',
  '9602-5': 'Serviços',
  '9603-3': 'Serviços',
  '9609-2': 'Serviços',
  '8011-1': 'Serviços',
  '8012-9': 'Serviços',
  '8020-0': 'Serviços',
  '8111-7': 'Serviços',
  '8112-5': 'Serviços',
  '8121-4': 'Serviços',
  '8122-2': 'Serviços',
  '8129-0': 'Serviços',
  '8130-3': 'Serviços',
  '8211-3': 'Serviços',
  '8219-9': 'Serviços',
  '8220-2': 'Serviços',
  '8230-0': 'Serviços',
  '8291-1': 'Serviços',
  '8292-0': 'Serviços',
  '8299-7': 'Serviços',
  
  // Agronegócio
  '0111-3': 'Agronegócio',
  '0112-1': 'Agronegócio',
  '0113-0': 'Agronegócio',
  '0114-8': 'Agronegócio',
  '0115-6': 'Agronegócio',
  '0116-4': 'Agronegócio',
  '0119-9': 'Agronegócio',
  '0121-1': 'Agronegócio',
  '0122-9': 'Agronegócio',
  '0131-8': 'Agronegócio',
  '0132-6': 'Agronegócio',
  '0133-4': 'Agronegócio',
  '0134-2': 'Agronegócio',
  '0135-1': 'Agronegócio',
  '0139-3': 'Agronegócio',
  '0141-5': 'Agronegócio',
  '0142-3': 'Agronegócio',
  '0151-2': 'Agronegócio',
  '0152-1': 'Agronegócio',
  '0153-9': 'Agronegócio',
  '0154-7': 'Agronegócio',
  '0155-5': 'Agronegócio',
  '0159-8': 'Agronegócio',
  '0161-0': 'Agronegócio',
  '0162-8': 'Agronegócio',
  '0163-6': 'Agronegócio',
  
  // Setor Público
  '8411-6': 'Setor Público',
  '8412-4': 'Setor Público',
  '8413-2': 'Setor Público',
  '8421-3': 'Setor Público',
  '8422-1': 'Setor Público',
  '8423-0': 'Setor Público',
  '8424-8': 'Setor Público',
  '8425-6': 'Setor Público',
  '8430-2': 'Setor Público',
};

// Função para classificar o segmento baseado no CNAE
export function classifySegmentByCNAE(cnaePrincipal: string | number | null): string {
  if (!cnaePrincipal) return 'Outros';
  
  // Converter para string e remover formatação, pega apenas os primeiros 7 caracteres (formato XXXX-X)
  const cnaeFormatted = String(cnaePrincipal).replace(/[^\d-]/g, '').substring(0, 7);
  
  // Tenta encontrar correspondência exata
  if (cnaeToSegment[cnaeFormatted]) {
    return cnaeToSegment[cnaeFormatted];
  }
  
  // Tenta encontrar correspondência pelos primeiros 4 dígitos
  const cnaePrefix = cnaeFormatted.substring(0, 4);
  for (const [key, value] of Object.entries(cnaeToSegment)) {
    if (key.startsWith(cnaePrefix)) {
      return value;
    }
  }
  
  // Classificação genérica baseada no primeiro dígito
  const firstDigit = cnaeFormatted.charAt(0);
  switch (firstDigit) {
    case '0':
      return 'Agronegócio';
    case '1':
    case '2':
    case '3':
      return 'Indústria';
    case '4':
      return 'Comércio';
    case '5':
      return 'Alimentação';
    case '6':
      return 'Tecnologia';
    case '7':
      return 'Serviços';
    case '8':
      return 'Educação/Saúde';
    case '9':
      return 'Serviços';
    default:
      return 'Outros';
  }
}

// Cores e ícones para cada segmento
export const segmentConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Alimentação': { icon: '🍽️', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'Construção': { icon: '🏗️', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  'Comércio': { icon: '🛒', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'Saúde': { icon: '🏥', color: 'text-red-600', bgColor: 'bg-red-100' },
  'Educação': { icon: '📚', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'Tecnologia': { icon: '💻', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  'Indústria': { icon: '🏭', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  'Transporte': { icon: '🚚', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  'Serviços': { icon: '🔧', color: 'text-green-600', bgColor: 'bg-green-100' },
  'Agronegócio': { icon: '🌾', color: 'text-lime-600', bgColor: 'bg-lime-100' },
  'Setor Público': { icon: '🏛️', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'Outros': { icon: '📦', color: 'text-gray-500', bgColor: 'bg-gray-50' },
};

// Descrições dos segmentos
export const segmentDescriptions: Record<string, string> = {
  'Alimentação': 'Restaurantes, lanchonetes, padarias e serviços de alimentação',
  'Construção': 'Construção civil, empreiteiras e serviços de construção',
  'Comércio': 'Varejo, atacado, supermercados e lojas em geral',
  'Saúde': 'Hospitais, clínicas, laboratórios e serviços de saúde',
  'Educação': 'Escolas, universidades, cursos e treinamentos',
  'Tecnologia': 'Desenvolvimento de software, TI e serviços digitais',
  'Indústria': 'Manufatura, produção e transformação industrial',
  'Transporte': 'Logística, transporte de cargas e passageiros',
  'Serviços': 'Prestação de serviços diversos e manutenção',
  'Agronegócio': 'Agricultura, pecuária e atividades rurais',
  'Setor Público': 'Órgãos governamentais e administração pública',
  'Outros': 'Atividades não classificadas em outras categorias',
};