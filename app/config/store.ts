/**
 * Configurações centralizadas da loja Arterio
 * Todas as informações de contato e detalhes da loja devem ser mantidas aqui
 */

export const STORE_INFO = {
  name: 'Arterio',
  tagline: 'Suprimentos para Produção Audiovisual',
  line: 'Soluções completas em materiais técnicos e produtos profissionais para cinema, shows, TV e teatro',
  
  // Contato
  phones: [
    {
      display: '(21) 99871-2793',
      whatsapp: '5521998712793', // Formato internacional sem espaços
      label: 'Celular',
    },
    {
      display: '(21) 92551-9403',
      whatsapp: '5521925519403',
      label: 'Telefone',
    },
  ],
  
  email: {
    general: 'contato@arterio.com.br',
    support: 'suporte@arterio.com.br',
    sales: 'vendas@arterio.com.br',
  },
  
  // Localização
  address: {
    street: 'Rua Silveira Martins, 110 - Loja P',
    neighborhood: 'Catete',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '20000-000',
    full: 'Rio de Janeiro - RJ',
    notes: 'Retirada no local disponível',
  },
  
  // Horário de funcionamento
  hours: {
    weekdays: 'Segunda a Sexta: 10h às 17h',
    saturday: 'Sábado: Fechado',
    sunday: 'Domingo: Fechado',
  },
  
  // Redes sociais
  social: {
    instagram: 'https://instagram.com/arterio',
    facebook: 'https://facebook.com/arterio',
    linkedin: 'https://linkedin.com/company/arterio',
  },
  
  // Mensagens do WhatsApp
  whatsapp: {
    defaultMessage: 'Olá! Gostaria de mais informações sobre os produtos.',
    productInquiry: (productName: string) => 
      `Olá! Gostaria de mais informações sobre: ${productName}`,
  },
} as const;

// Helper para gerar link do WhatsApp
export function getWhatsAppLink(message?: string, phoneIndex: number = 0): string {
  const encodedMessage = message 
    ? encodeURIComponent(message) 
    : encodeURIComponent(STORE_INFO.whatsapp.defaultMessage);
  
  const phone = STORE_INFO.phones[phoneIndex]?.whatsapp || STORE_INFO.phones[0].whatsapp;
  
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
