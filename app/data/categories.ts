export interface Category {
  name: string;
  subcategories: string[];
}

export const categories: Category[] = [
  {
    name: "Gelatinas",
    subcategories: [
      "Gelatinas de correção",
      "Gelatinas de difusão",
      "Gelatinas de efeito",
    ],
  },
  {
    name: "Câmera",
    subcategories: [
      "Nacionais",
      "Importados",
    ],
  },
  {
    name: "Elétrica",
    subcategories: [
      "Abraçadeira",
      "Conectores",
      "Ferramentas",
      "Sprays",
    ],
  },
  {
    name: "Fitas",
    subcategories: [
      "Fita Gaffer (Tecido)",
      "Fita Gaffer (Fluorescente)",
      "Papel",
      "PVC",
      "Durex",
      "Antiderrapante",
    ],
  },
  {
    name: "Pilhas",
    subcategories: [
      "Baterias",
      "Pilhas AA",
      "Pilhas AAA",
    ],
  },
  {
    name: "Farmácia",
    subcategories: [
      "Higiene e proteção",
      "3M Nexcare",
      "Acessórios",
    ],
  },
  {
    name: "Papelaria",
    subcategories: [
      "Canetas",
      "Saco Zip Lock",
      "Velcro",
      "Corda",
      "Itens de escritório",
    ],
  },
  {
    name: "Diversos",
    subcategories: [],
  },
  {
    name: "Itens sob consulta",
    subcategories: [
      "Líquido de fumaça",
      "Tecidos",
      "Lonas",
      "Caixas",
      "Outros",
    ],
  },
];
