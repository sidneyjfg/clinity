import type { MarketplaceComparison, MonetizationHighlight, Testimonial } from "@/lib/types";

export const clientLogos = ["Vitta Prime", "Oriz", "Pulse Care", "Harmonie", "Clarear"];

export const testimonials: Testimonial[] = [
  {
    name: "Juliana Rocha",
    role: "Sócia-diretora",
    organization: "Clínica Harmonie",
    quote: "A recepção ganhou previsibilidade e o no-show caiu já no primeiro mês com confirmações automáticas."
  },
  {
    name: "Eduardo Martins",
    role: "Gestor de operações",
    organization: "Vitta Prime",
    quote: "Conseguimos reagendar rápido, preencher lacunas e ter uma visão clara do que está impactando o faturamento."
  },
  {
    name: "Carolina Nery",
    role: "Head de atendimento",
    organization: "Pulse Care",
    quote: "A equipe deixou de correr atrás manualmente de pacientes e passou a operar a agenda com muito mais controle."
  }
];

export const monetizationHighlights: MonetizationHighlight[] = [
  {
    title: "Comece sem risco",
    description: "Periodo inicial gratuito para validar a plataforma antes de pagar qualquer coisa."
  },
  {
    title: "10% sobre clientes gerados",
    description: "Depois do periodo gratuito, a taxa incide apenas quando o Hubly traz um novo cliente."
  },
  {
    title: "Clientes próprios ficam fora",
    description: "Nenhuma cobrança sobre clientes que já eram seus ou chegaram por canais próprios."
  }
];

export const marketplaceComparison: MarketplaceComparison[] = [
  {
    name: "Marketplaces tradicionais",
    rate: "15% a 30%",
    description: "Comissões comuns em plataformas com intermediação, visibilidade e demanda."
  },
  {
    name: "iFood",
    rate: "12% a 23%",
    description: "Pode variar conforme modelo, categoria, serviços e entrega."
  },
  {
    name: "Hubly",
    rate: "10%",
    description: "Foco em crescimento sustentável para o profissional parceiro.",
    highlighted: true
  }
];
