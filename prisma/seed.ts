import { PrismaClient, Prisma } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

// ---------- Helpers ----------

const SENHA_PADRAO = "zimmer123";

/** Decimal a partir de número (centavos seguros). */
function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

/** Data relativa a hoje (dias, horas). */
function emDias(dias: number, hora = 9, minuto = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

/** Número sequencial de OS / Orçamento no formato AAAA-NNNN. */
function gerarNumero(prefixo: string, seq: number): string {
  const ano = new Date().getFullYear();
  return `${prefixo}-${ano}-${String(seq).padStart(4, "0")}`;
}

// ---------- Execução ----------

async function main() {
  console.log("🧹 Limpando dados antigos…");
  // Ordem respeita as dependências (filhos antes dos pais).
  await prisma.aiInteraction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.warranty.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.inspectionItem.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.serviceOrderItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.part.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.service.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // ---------------------------------------------------------
  // USUÁRIOS
  // ---------------------------------------------------------
  console.log("👤 Criando usuários (senha padrão: zimmer123)…");
  const hash = hashSync(SENHA_PADRAO, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Ricardo Zimmer",
      email: "admin@zimmer.com",
      passwordHash: hash,
      role: "ADMINISTRADOR",
      telefone: "(51) 99999-0001",
    },
  });

  const atendente = await prisma.user.create({
    data: {
      name: "Camila Ferreira",
      email: "atendente@zimmer.com",
      passwordHash: hash,
      role: "ATENDENTE",
      telefone: "(51) 99999-0002",
    },
  });

  const mecanico1 = await prisma.user.create({
    data: {
      name: "Anderson Schmidt",
      email: "mecanico@zimmer.com",
      passwordHash: hash,
      role: "MECANICO",
      telefone: "(51) 99999-0003",
    },
  });

  const mecanico2 = await prisma.user.create({
    data: {
      name: "Jonas Müller",
      email: "mecanico2@zimmer.com",
      passwordHash: hash,
      role: "MECANICO",
      telefone: "(51) 99999-0004",
    },
  });

  const financeiro = await prisma.user.create({
    data: {
      name: "Patrícia Lemos",
      email: "financeiro@zimmer.com",
      passwordHash: hash,
      role: "FINANCEIRO",
      telefone: "(51) 99999-0005",
    },
  });

  const estoque = await prisma.user.create({
    data: {
      name: "Lucas Hoffmann",
      email: "estoque@zimmer.com",
      passwordHash: hash,
      role: "ESTOQUE",
      telefone: "(51) 99999-0006",
    },
  });

  const mecanicos = [mecanico1, mecanico2];

  // ---------------------------------------------------------
  // CLIENTES + VEÍCULOS
  // ---------------------------------------------------------
  console.log("🧑‍🤝‍🧑 Criando clientes e veículos…");

  const clientesSeed: Array<{
    nome: string;
    tipoPessoa: "FISICA" | "JURIDICA";
    cpfCnpj: string;
    telefone: string;
    whatsapp: string;
    email: string;
    cidade: string;
    estado: string;
    cep: string;
    endereco: string;
    veiculo: {
      placa: string;
      marca: string;
      modelo: string;
      ano: number;
      cor: string;
      quilometragem: number;
      combustivel:
        | "GASOLINA"
        | "ETANOL"
        | "FLEX"
        | "DIESEL"
        | "GNV"
        | "ELETRICO"
        | "HIBRIDO";
    };
  }> = [
    {
      nome: "João Pedro Wagner",
      tipoPessoa: "FISICA",
      cpfCnpj: "012.345.678-90",
      telefone: "(51) 3592-1010",
      whatsapp: "(51) 98111-2233",
      email: "joao.wagner@email.com",
      cidade: "Santa Maria do Herval",
      estado: "RS",
      cep: "93730-000",
      endereco: "Rua das Flores, 120",
      veiculo: {
        placa: "IVR-5678",
        marca: "Volkswagen",
        modelo: "Gol 1.0",
        ano: 2014,
        cor: "Prata",
        quilometragem: 128500,
        combustivel: "FLEX",
      },
    },
    {
      nome: "Maria Eduarda Klein",
      tipoPessoa: "FISICA",
      cpfCnpj: "123.456.789-01",
      telefone: "(51) 3593-2020",
      whatsapp: "(51) 98222-3344",
      email: "duda.klein@email.com",
      cidade: "Novo Hamburgo",
      estado: "RS",
      cep: "93310-000",
      endereco: "Av. Pedro Adams Filho, 850",
      veiculo: {
        placa: "RGH4B22",
        marca: "Chevrolet",
        modelo: "Onix LT 1.0 Turbo",
        ano: 2021,
        cor: "Branco",
        quilometragem: 42300,
        combustivel: "FLEX",
      },
    },
    {
      nome: "Carlos Henrique Becker",
      tipoPessoa: "FISICA",
      cpfCnpj: "234.567.890-12",
      telefone: "(51) 3594-3030",
      whatsapp: "(51) 98333-4455",
      email: "carlos.becker@email.com",
      cidade: "São Leopoldo",
      estado: "RS",
      cep: "93010-000",
      endereco: "Rua Independência, 47",
      veiculo: {
        placa: "ABC-1234",
        marca: "Fiat",
        modelo: "Palio Fire 1.0",
        ano: 2012,
        cor: "Vermelho",
        quilometragem: 156000,
        combustivel: "FLEX",
      },
    },
    {
      nome: "Transportadora Vale dos Sinos Ltda",
      tipoPessoa: "JURIDICA",
      cpfCnpj: "12.345.678/0001-90",
      telefone: "(51) 3595-4040",
      whatsapp: "(51) 98444-5566",
      email: "frota@valedossinos.com.br",
      cidade: "Sapiranga",
      estado: "RS",
      cep: "93800-000",
      endereco: "Distrito Industrial, Lote 14",
      veiculo: {
        placa: "MNO2A45",
        marca: "Fiat",
        modelo: "Strada Working 1.4",
        ano: 2019,
        cor: "Branco",
        quilometragem: 98700,
        combustivel: "FLEX",
      },
    },
    {
      nome: "Fernanda Reinheimer",
      tipoPessoa: "FISICA",
      cpfCnpj: "345.678.901-23",
      telefone: "(51) 3596-5050",
      whatsapp: "(51) 98555-6677",
      email: "fernanda.r@email.com",
      cidade: "Gramado",
      estado: "RS",
      cep: "95670-000",
      endereco: "Rua Coberta, 200",
      veiculo: {
        placa: "JKL9F88",
        marca: "Toyota",
        modelo: "Hilux SRV 2.8",
        ano: 2020,
        cor: "Prata",
        quilometragem: 87000,
        combustivel: "DIESEL",
      },
    },
    {
      nome: "Eduardo Sperb",
      tipoPessoa: "FISICA",
      cpfCnpj: "456.789.012-34",
      telefone: "(51) 3597-6060",
      whatsapp: "(51) 98666-7788",
      email: "eduardo.sperb@email.com",
      cidade: "Dois Irmãos",
      estado: "RS",
      cep: "93950-000",
      endereco: "Av. São Miguel, 1500",
      veiculo: {
        placa: "PQR3C67",
        marca: "Toyota",
        modelo: "Corolla XEi 2.0",
        ano: 2022,
        cor: "Preto",
        quilometragem: 31200,
        combustivel: "FLEX",
      },
    },
    {
      nome: "Aline Brusius",
      tipoPessoa: "FISICA",
      cpfCnpj: "567.890.123-45",
      telefone: "(51) 3598-7070",
      whatsapp: "(51) 98777-8899",
      email: "aline.brusius@email.com",
      cidade: "Ivoti",
      estado: "RS",
      cep: "93900-000",
      endereco: "Rua Bento Gonçalves, 333",
      veiculo: {
        placa: "STU-7654",
        marca: "Volkswagen",
        modelo: "Saveiro Cross 1.6",
        ano: 2016,
        cor: "Cinza",
        quilometragem: 112400,
        combustivel: "FLEX",
      },
    },
    {
      nome: "Marcos Vinícius Petry",
      tipoPessoa: "FISICA",
      cpfCnpj: "678.901.234-56",
      telefone: "(51) 3599-8080",
      whatsapp: "(51) 98888-9900",
      email: "marcos.petry@email.com",
      cidade: "Estância Velha",
      estado: "RS",
      cep: "93600-000",
      endereco: "Rua Portugal, 90",
      veiculo: {
        placa: "VWX5D90",
        marca: "Hyundai",
        modelo: "HB20 Comfort 1.0",
        ano: 2018,
        cor: "Azul",
        quilometragem: 76500,
        combustivel: "FLEX",
      },
    },
  ];

  const clientes: Array<{ customerId: string; vehicleId: string; nome: string }> =
    [];

  for (const c of clientesSeed) {
    const created = await prisma.customer.create({
      data: {
        nome: c.nome,
        tipoPessoa: c.tipoPessoa,
        cpfCnpj: c.cpfCnpj,
        telefone: c.telefone,
        whatsapp: c.whatsapp,
        email: c.email,
        endereco: c.endereco,
        cidade: c.cidade,
        estado: c.estado,
        cep: c.cep,
        lgpdConsent: true,
        vehicles: {
          create: {
            placa: c.veiculo.placa,
            marca: c.veiculo.marca,
            modelo: c.veiculo.modelo,
            ano: c.veiculo.ano,
            cor: c.veiculo.cor,
            quilometragem: c.veiculo.quilometragem,
            combustivel: c.veiculo.combustivel,
          },
        },
      },
      include: { vehicles: true },
    });
    clientes.push({
      customerId: created.id,
      vehicleId: created.vehicles[0].id,
      nome: created.nome,
    });
  }

  // ---------------------------------------------------------
  // SERVIÇOS
  // ---------------------------------------------------------
  console.log("🔧 Criando catálogo de serviços…");

  const servicosSeed: Array<{
    nome: string;
    categoria:
      | "MECANICA_GERAL"
      | "ELETRONICA_EMBARCADA"
      | "SERVICOS_RAPIDOS"
      | "GEOMETRIA"
      | "CHAPEACAO"
      | "AUTOPECAS"
      | "ACESSORIOS"
      | "FREIOS"
      | "SUSPENSAO"
      | "MOTOR"
      | "ARREFECIMENTO";
    descricao: string;
    precoPadrao: number;
    tempoEstimadoMin: number;
  }> = [
    { nome: "Revisão Mecânica Geral", categoria: "MECANICA_GERAL", descricao: "Inspeção completa de itens mecânicos do veículo.", precoPadrao: 280, tempoEstimadoMin: 120 },
    { nome: "Troca de Óleo com Checklist", categoria: "SERVICOS_RAPIDOS", descricao: "Troca de óleo do motor e checklist de 20 itens.", precoPadrao: 120, tempoEstimadoMin: 40 },
    { nome: "Troca de Filtros (óleo, ar, combustível)", categoria: "SERVICOS_RAPIDOS", descricao: "Substituição do conjunto de filtros.", precoPadrao: 90, tempoEstimadoMin: 35 },
    { nome: "Geometria 3D (alinhamento)", categoria: "GEOMETRIA", descricao: "Alinhamento de direção computadorizado 3D.", precoPadrao: 130, tempoEstimadoMin: 45 },
    { nome: "Balanceamento de Rodas", categoria: "GEOMETRIA", descricao: "Balanceamento das quatro rodas.", precoPadrao: 80, tempoEstimadoMin: 40 },
    { nome: "Troca de Pastilhas de Freio", categoria: "FREIOS", descricao: "Substituição das pastilhas dianteiras.", precoPadrao: 150, tempoEstimadoMin: 60 },
    { nome: "Troca de Discos de Freio", categoria: "FREIOS", descricao: "Substituição dos discos dianteiros.", precoPadrao: 220, tempoEstimadoMin: 80 },
    { nome: "Troca de Fluido de Freio", categoria: "FREIOS", descricao: "Sangria e troca do fluido de freio.", precoPadrao: 110, tempoEstimadoMin: 45 },
    { nome: "Troca de Amortecedores (par)", categoria: "SUSPENSAO", descricao: "Substituição do par de amortecedores.", precoPadrao: 320, tempoEstimadoMin: 120 },
    { nome: "Revisão de Suspensão", categoria: "SUSPENSAO", descricao: "Verificação de batentes, coxins e pivôs.", precoPadrao: 180, tempoEstimadoMin: 90 },
    { nome: "Diagnóstico de Injeção Eletrônica", categoria: "ELETRONICA_EMBARCADA", descricao: "Leitura de falhas via scanner automotivo.", precoPadrao: 160, tempoEstimadoMin: 60 },
    { nome: "Troca de Velas de Ignição", categoria: "MOTOR", descricao: "Substituição do jogo de velas.", precoPadrao: 140, tempoEstimadoMin: 50 },
    { nome: "Troca de Correia Dentada", categoria: "MOTOR", descricao: "Substituição da correia dentada e tensor.", precoPadrao: 480, tempoEstimadoMin: 180 },
    { nome: "Teste e Troca de Bateria", categoria: "ELETRONICA_EMBARCADA", descricao: "Teste de carga e substituição da bateria.", precoPadrao: 70, tempoEstimadoMin: 30 },
    { nome: "Troca de Alternador", categoria: "ELETRONICA_EMBARCADA", descricao: "Substituição do alternador.", precoPadrao: 260, tempoEstimadoMin: 90 },
    { nome: "Reparo de Escapamento", categoria: "MECANICA_GERAL", descricao: "Solda e substituição de componentes do escapamento.", precoPadrao: 190, tempoEstimadoMin: 75 },
    { nome: "Troca de Pneus (unidade)", categoria: "GEOMETRIA", descricao: "Desmontagem, montagem e calibragem.", precoPadrao: 40, tempoEstimadoMin: 20 },
    { nome: "Higienização do Ar-Condicionado", categoria: "ARREFECIMENTO", descricao: "Limpeza e higienização do sistema de A/C.", precoPadrao: 130, tempoEstimadoMin: 60 },
    { nome: "Troca de Fluido de Arrefecimento", categoria: "ARREFECIMENTO", descricao: "Drenagem e reposição do líquido de arrefecimento.", precoPadrao: 120, tempoEstimadoMin: 50 },
    { nome: "Funilaria e Reparo de Lataria", categoria: "CHAPEACAO", descricao: "Reparo de amassados e preparação de superfície.", precoPadrao: 450, tempoEstimadoMin: 240 },
    { nome: "Pintura Automotiva (peça)", categoria: "CHAPEACAO", descricao: "Pintura de peça com tinta e verniz.", precoPadrao: 380, tempoEstimadoMin: 240 },
    { nome: "Polimento e Cristalização", categoria: "ACESSORIOS", descricao: "Polimento técnico e cristalização da pintura.", precoPadrao: 250, tempoEstimadoMin: 180 },
  ];

  const servicos = await Promise.all(
    servicosSeed.map((s) =>
      prisma.service.create({
        data: {
          nome: s.nome,
          categoria: s.categoria,
          descricao: s.descricao,
          precoPadrao: dec(s.precoPadrao),
          tempoEstimadoMin: s.tempoEstimadoMin,
        },
      }),
    ),
  );
  const servicoPorNome = (nome: string) =>
    servicos.find((s) => s.nome === nome)!;

  // ---------------------------------------------------------
  // FORNECEDORES
  // ---------------------------------------------------------
  console.log("🚚 Criando fornecedores…");

  const fornecedoresSeed = [
    { nome: "Distribuidora Sul Autopeças", cnpj: "11.222.333/0001-44", contato: "Roberto", telefone: "(51) 3030-1111", whatsapp: "(51) 99100-1111", email: "vendas@sulautopecas.com.br", endereco: "Av. das Indústrias, 2000 - Novo Hamburgo/RS" },
    { nome: "Bosch Peças e Serviços RS", cnpj: "22.333.444/0001-55", contato: "Sandra", telefone: "(51) 3030-2222", whatsapp: "(51) 99100-2222", email: "rs@boschpecas.com.br", endereco: "Rua Heinrich Bosch, 45 - Campo Bom/RS" },
    { nome: "Pneus & Cia Vale dos Sinos", cnpj: "33.444.555/0001-66", contato: "Márcio", telefone: "(51) 3030-3333", whatsapp: "(51) 99100-3333", email: "atendimento@pneusecia.com.br", endereco: "Av. Integração, 700 - São Leopoldo/RS" },
    { nome: "Lubrificantes Herval", cnpj: "44.555.666/0001-77", contato: "Tânia", telefone: "(51) 3030-4444", whatsapp: "(51) 99100-4444", email: "comercial@lubherval.com.br", endereco: "Rua Central, 12 - Santa Maria do Herval/RS" },
  ];

  const fornecedores = await Promise.all(
    fornecedoresSeed.map((f) => prisma.supplier.create({ data: f })),
  );

  // ---------------------------------------------------------
  // PEÇAS / ESTOQUE
  // ---------------------------------------------------------
  console.log("📦 Criando peças e estoque…");

  const pecasSeed: Array<{
    nome: string;
    codigoInterno: string;
    categoria: string;
    fornecedorIdx: number;
    precoCusto: number;
    precoVenda: number;
    quantidade: number;
    estoqueMinimo: number;
    localizacao: string;
    compatibilidade: string;
  }> = [
    { nome: "Bateria 60Ah", codigoInterno: "BAT-60AH", categoria: "Elétrica", fornecedorIdx: 1, precoCusto: 280, precoVenda: 430, quantidade: 8, estoqueMinimo: 4, localizacao: "Prateleira A1", compatibilidade: "Gol, Onix, Palio, HB20" },
    { nome: "Pastilha de Freio Dianteira", codigoInterno: "PAST-FRE-D", categoria: "Freios", fornecedorIdx: 0, precoCusto: 65, precoVenda: 120, quantidade: 3, estoqueMinimo: 6, localizacao: "Prateleira B2", compatibilidade: "Linha VW e GM populares" },
    { nome: "Filtro de Óleo", codigoInterno: "FILT-OLEO", categoria: "Filtros", fornecedorIdx: 0, precoCusto: 18, precoVenda: 38, quantidade: 25, estoqueMinimo: 10, localizacao: "Prateleira C1", compatibilidade: "Universal motores 1.0/1.4/1.6" },
    { nome: "Óleo Motor 5W30 Sintético (1L)", codigoInterno: "OLEO-5W30", categoria: "Lubrificantes", fornecedorIdx: 3, precoCusto: 32, precoVenda: 58, quantidade: 40, estoqueMinimo: 20, localizacao: "Prateleira C2", compatibilidade: "Motores flex e diesel leves" },
    { nome: "Amortecedor Dianteiro", codigoInterno: "AMORT-DIA", categoria: "Suspensão", fornecedorIdx: 1, precoCusto: 145, precoVenda: 240, quantidade: 6, estoqueMinimo: 4, localizacao: "Prateleira D1", compatibilidade: "Gol, Saveiro, Onix" },
    { nome: "Lâmpada Farol H4", codigoInterno: "LAMP-H4", categoria: "Elétrica", fornecedorIdx: 1, precoCusto: 12, precoVenda: 28, quantidade: 30, estoqueMinimo: 12, localizacao: "Gaveta E3", compatibilidade: "Universal" },
    { nome: "Correia Dentada", codigoInterno: "CORR-DENT", categoria: "Motor", fornecedorIdx: 1, precoCusto: 85, precoVenda: 160, quantidade: 2, estoqueMinimo: 4, localizacao: "Prateleira F1", compatibilidade: "Motores 1.0/1.6 flex" },
    { nome: "Vela de Ignição", codigoInterno: "VELA-IGN", categoria: "Motor", fornecedorIdx: 1, precoCusto: 14, precoVenda: 32, quantidade: 48, estoqueMinimo: 16, localizacao: "Gaveta F2", compatibilidade: "Linha flex nacional" },
    { nome: "Disco de Freio Dianteiro", codigoInterno: "DISC-FRE-D", categoria: "Freios", fornecedorIdx: 0, precoCusto: 95, precoVenda: 175, quantidade: 4, estoqueMinimo: 4, localizacao: "Prateleira B3", compatibilidade: "Linha VW e GM populares" },
    { nome: "Filtro de Ar", codigoInterno: "FILT-AR", categoria: "Filtros", fornecedorIdx: 0, precoCusto: 22, precoVenda: 45, quantidade: 5, estoqueMinimo: 8, localizacao: "Prateleira C3", compatibilidade: "Universal aspirado/turbo" },
    { nome: "Fluido de Freio DOT4 (500ml)", codigoInterno: "FLUI-DOT4", categoria: "Lubrificantes", fornecedorIdx: 3, precoCusto: 16, precoVenda: 34, quantidade: 18, estoqueMinimo: 8, localizacao: "Prateleira C4", compatibilidade: "Universal" },
    { nome: "Palheta Limpador (par)", codigoInterno: "PALH-PAR", categoria: "Acessórios", fornecedorIdx: 0, precoCusto: 24, precoVenda: 49, quantidade: 14, estoqueMinimo: 6, localizacao: "Gaveta E1", compatibilidade: "Universal encaixe rápido" },
    { nome: "Pneu Aro 15 185/65", codigoInterno: "PNEU-15-18565", categoria: "Pneus", fornecedorIdx: 2, precoCusto: 290, precoVenda: 460, quantidade: 12, estoqueMinimo: 8, localizacao: "Estoque Pneus", compatibilidade: "Onix, HB20, Gol" },
  ];

  const pecas = await Promise.all(
    pecasSeed.map((p) =>
      prisma.part.create({
        data: {
          nome: p.nome,
          codigoInterno: p.codigoInterno,
          categoria: p.categoria,
          supplierId: fornecedores[p.fornecedorIdx].id,
          precoCusto: dec(p.precoCusto),
          precoVenda: dec(p.precoVenda),
          quantidade: p.quantidade,
          estoqueMinimo: p.estoqueMinimo,
          localizacao: p.localizacao,
          compatibilidade: p.compatibilidade,
        },
      }),
    ),
  );
  const pecaPorCodigo = (codigo: string) =>
    pecas.find((p) => p.codigoInterno === codigo)!;

  // ---------------------------------------------------------
  // MOVIMENTAÇÕES DE ESTOQUE
  // ---------------------------------------------------------
  console.log("📊 Registrando movimentações de estoque…");

  await prisma.inventoryMovement.createMany({
    data: [
      { partId: pecaPorCodigo("BAT-60AH").id, tipo: "ENTRADA", quantidade: 10, motivo: "Compra Distribuidora Sul", createdById: estoque.id },
      { partId: pecaPorCodigo("BAT-60AH").id, tipo: "SAIDA", quantidade: 2, motivo: "Uso em OS", createdById: estoque.id },
      { partId: pecaPorCodigo("PAST-FRE-D").id, tipo: "SAIDA", quantidade: 3, motivo: "Uso em OS", createdById: estoque.id },
      { partId: pecaPorCodigo("OLEO-5W30").id, tipo: "ENTRADA", quantidade: 48, motivo: "Compra Lubrificantes Herval", createdById: estoque.id },
      { partId: pecaPorCodigo("FILT-OLEO").id, tipo: "ENTRADA", quantidade: 30, motivo: "Compra Distribuidora Sul", createdById: estoque.id },
      { partId: pecaPorCodigo("CORR-DENT").id, tipo: "AJUSTE", quantidade: -1, motivo: "Ajuste de inventário", createdById: estoque.id },
    ],
  });

  // ---------------------------------------------------------
  // ORDENS DE SERVIÇO (vários status)
  // ---------------------------------------------------------
  console.log("📋 Criando ordens de serviço…");

  type ItemSeed =
    | { tipo: "SERVICO"; servico: string; quantidade?: number; preco?: number }
    | { tipo: "PECA"; peca: string; quantidade?: number; preco?: number };

  type OsSeed = {
    clienteIdx: number;
    mecanicoIdx: number;
    status:
      | "ABERTA"
      | "AGUARDANDO_DIAGNOSTICO"
      | "AGUARDANDO_APROVACAO"
      | "APROVADA"
      | "EM_EXECUCAO"
      | "AGUARDANDO_PECAS"
      | "CONCLUIDA"
      | "ENTREGUE"
      | "CANCELADA";
    prioridade?: "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
    problema: string;
    diagnostico?: string;
    desconto?: number;
    itens: ItemSeed[];
    previsaoDias?: number;
  };

  const ordensSeed: OsSeed[] = [
    {
      clienteIdx: 0,
      mecanicoIdx: 0,
      status: "ABERTA",
      prioridade: "NORMAL",
      problema: "Cliente relata barulho na suspensão dianteira ao passar em lombadas.",
      itens: [{ tipo: "SERVICO", servico: "Revisão de Suspensão" }],
    },
    {
      clienteIdx: 1,
      mecanicoIdx: 1,
      status: "AGUARDANDO_DIAGNOSTICO",
      prioridade: "ALTA",
      problema: "Luz de injeção acesa no painel, perda de potência.",
      itens: [{ tipo: "SERVICO", servico: "Diagnóstico de Injeção Eletrônica" }],
    },
    {
      clienteIdx: 2,
      mecanicoIdx: 0,
      status: "AGUARDANDO_APROVACAO",
      prioridade: "NORMAL",
      problema: "Freio fazendo barulho e pedal baixo.",
      diagnostico: "Pastilhas no limite e fluido de freio vencido.",
      itens: [
        { tipo: "SERVICO", servico: "Troca de Pastilhas de Freio" },
        { tipo: "PECA", peca: "PAST-FRE-D", quantidade: 1 },
        { tipo: "SERVICO", servico: "Troca de Fluido de Freio" },
        { tipo: "PECA", peca: "FLUI-DOT4", quantidade: 1 },
      ],
    },
    {
      clienteIdx: 3,
      mecanicoIdx: 1,
      status: "APROVADA",
      prioridade: "ALTA",
      problema: "Veículo de frota para manutenção preventiva.",
      diagnostico: "Necessária troca de óleo, filtros e correia dentada.",
      itens: [
        { tipo: "SERVICO", servico: "Troca de Óleo com Checklist" },
        { tipo: "PECA", peca: "OLEO-5W30", quantidade: 4 },
        { tipo: "PECA", peca: "FILT-OLEO", quantidade: 1 },
        { tipo: "SERVICO", servico: "Troca de Correia Dentada" },
        { tipo: "PECA", peca: "CORR-DENT", quantidade: 1 },
      ],
      previsaoDias: 2,
    },
    {
      clienteIdx: 4,
      mecanicoIdx: 0,
      status: "EM_EXECUCAO",
      prioridade: "NORMAL",
      problema: "Revisão dos 90 mil km da Hilux.",
      diagnostico: "Revisão geral conforme plano de manutenção.",
      itens: [
        { tipo: "SERVICO", servico: "Revisão Mecânica Geral" },
        { tipo: "SERVICO", servico: "Troca de Óleo com Checklist" },
        { tipo: "PECA", peca: "OLEO-5W30", quantidade: 6 },
        { tipo: "PECA", peca: "FILT-OLEO", quantidade: 1 },
        { tipo: "PECA", peca: "FILT-AR", quantidade: 1 },
      ],
      previsaoDias: 1,
    },
    {
      clienteIdx: 5,
      mecanicoIdx: 1,
      status: "AGUARDANDO_PECAS",
      prioridade: "ALTA",
      problema: "Corolla com falha de carga na bateria.",
      diagnostico: "Alternador com defeito, aguardando peça do fornecedor.",
      itens: [
        { tipo: "SERVICO", servico: "Troca de Alternador" },
        { tipo: "SERVICO", servico: "Teste e Troca de Bateria" },
        { tipo: "PECA", peca: "BAT-60AH", quantidade: 1 },
      ],
      previsaoDias: 3,
    },
    {
      clienteIdx: 6,
      mecanicoIdx: 0,
      status: "CONCLUIDA",
      prioridade: "NORMAL",
      problema: "Troca de amortecedores e alinhamento.",
      diagnostico: "Amortecedores dianteiros vencidos.",
      itens: [
        { tipo: "SERVICO", servico: "Troca de Amortecedores (par)" },
        { tipo: "PECA", peca: "AMORT-DIA", quantidade: 2 },
        { tipo: "SERVICO", servico: "Geometria 3D (alinhamento)" },
        { tipo: "SERVICO", servico: "Balanceamento de Rodas" },
      ],
    },
    {
      clienteIdx: 7,
      mecanicoIdx: 1,
      status: "ENTREGUE",
      prioridade: "NORMAL",
      problema: "Troca de óleo e velas do HB20.",
      diagnostico: "Manutenção preventiva realizada.",
      desconto: 20,
      itens: [
        { tipo: "SERVICO", servico: "Troca de Óleo com Checklist" },
        { tipo: "PECA", peca: "OLEO-5W30", quantidade: 4 },
        { tipo: "PECA", peca: "FILT-OLEO", quantidade: 1 },
        { tipo: "SERVICO", servico: "Troca de Velas de Ignição" },
        { tipo: "PECA", peca: "VELA-IGN", quantidade: 4 },
      ],
    },
    {
      clienteIdx: 2,
      mecanicoIdx: 0,
      status: "CANCELADA",
      prioridade: "BAIXA",
      problema: "Cliente solicitou orçamento de pintura mas desistiu.",
      itens: [{ tipo: "SERVICO", servico: "Pintura Automotiva (peça)" }],
    },
  ];

  const ordensCriadas: Array<{
    id: string;
    numero: string;
    clienteIdx: number;
    total: number;
    status: string;
  }> = [];

  let seqOs = 1;
  for (const os of ordensSeed) {
    const cli = clientes[os.clienteIdx];
    const mec = mecanicos[os.mecanicoIdx];

    // Calcular itens, valores.
    let valorMaoObra = 0;
    let valorPecas = 0;
    const itensData = os.itens.map((it) => {
      if (it.tipo === "SERVICO") {
        const s = servicoPorNome(it.servico);
        const qtd = it.quantidade ?? 1;
        const preco = it.preco ?? Number(s.precoPadrao);
        const subtotal = preco * qtd;
        valorMaoObra += subtotal;
        return {
          tipo: "SERVICO" as const,
          serviceId: s.id,
          descricao: s.nome,
          quantidade: qtd,
          precoUnitario: dec(preco),
          subtotal: dec(subtotal),
        };
      } else {
        const p = pecaPorCodigo(it.peca);
        const qtd = it.quantidade ?? 1;
        const preco = it.preco ?? Number(p.precoVenda);
        const subtotal = preco * qtd;
        valorPecas += subtotal;
        return {
          tipo: "PECA" as const,
          partId: p.id,
          descricao: p.nome,
          quantidade: qtd,
          precoUnitario: dec(preco),
          subtotal: dec(subtotal),
        };
      }
    });

    const desconto = os.desconto ?? 0;
    const total = valorMaoObra + valorPecas - desconto;

    const created = await prisma.serviceOrder.create({
      data: {
        numero: gerarNumero("OS", seqOs++),
        customerId: cli.customerId,
        vehicleId: cli.vehicleId,
        mecanicoId: mec.id,
        quilometragem: 100000 + os.clienteIdx * 5000,
        problemaRelatado: os.problema,
        diagnostico: os.diagnostico ?? null,
        status: os.status,
        prioridade: os.prioridade ?? "NORMAL",
        previsaoEntrega: os.previsaoDias ? emDias(os.previsaoDias, 17) : null,
        valorMaoObra: dec(valorMaoObra),
        valorPecas: dec(valorPecas),
        desconto: dec(desconto),
        total: dec(total),
        items: { create: itensData },
      },
    });

    ordensCriadas.push({
      id: created.id,
      numero: created.numero,
      clienteIdx: os.clienteIdx,
      total,
      status: os.status,
    });
  }

  // ---------------------------------------------------------
  // ORÇAMENTOS
  // ---------------------------------------------------------
  console.log("🧾 Criando orçamentos…");

  const orcamentosSeed: Array<{
    clienteIdx: number;
    status: "RASCUNHO" | "ENVIADO" | "APROVADO" | "REJEITADO";
    validadeDias?: number;
    desconto?: number;
    observacoes: string;
    itens: ItemSeed[];
  }> = [
    {
      clienteIdx: 0,
      status: "RASCUNHO",
      observacoes: "Orçamento preliminar de suspensão, aguardando avaliação.",
      itens: [
        { tipo: "SERVICO", servico: "Troca de Amortecedores (par)" },
        { tipo: "PECA", peca: "AMORT-DIA", quantidade: 2 },
      ],
    },
    {
      clienteIdx: 1,
      status: "ENVIADO",
      validadeDias: 7,
      observacoes: "Enviado por WhatsApp. Aguardando aprovação do cliente.",
      itens: [
        { tipo: "SERVICO", servico: "Diagnóstico de Injeção Eletrônica" },
        { tipo: "SERVICO", servico: "Troca de Velas de Ignição" },
        { tipo: "PECA", peca: "VELA-IGN", quantidade: 4 },
      ],
    },
    {
      clienteIdx: 4,
      status: "APROVADO",
      validadeDias: 10,
      desconto: 30,
      observacoes: "Cliente aprovou. Gerar OS para execução.",
      itens: [
        { tipo: "SERVICO", servico: "Revisão Mecânica Geral" },
        { tipo: "SERVICO", servico: "Higienização do Ar-Condicionado" },
      ],
    },
    {
      clienteIdx: 6,
      status: "REJEITADO",
      validadeDias: 5,
      observacoes: "Cliente achou o valor da pintura alto e recusou.",
      itens: [
        { tipo: "SERVICO", servico: "Funilaria e Reparo de Lataria" },
        { tipo: "SERVICO", servico: "Pintura Automotiva (peça)" },
      ],
    },
  ];

  let seqOrc = 1;
  for (const orc of orcamentosSeed) {
    const cli = clientes[orc.clienteIdx];
    let total = 0;
    const itensData = orc.itens.map((it) => {
      if (it.tipo === "SERVICO") {
        const s = servicoPorNome(it.servico);
        const qtd = it.quantidade ?? 1;
        const preco = Number(s.precoPadrao);
        const subtotal = preco * qtd;
        total += subtotal;
        return {
          tipo: "SERVICO" as const,
          serviceId: s.id,
          descricao: s.nome,
          quantidade: qtd,
          precoUnitario: dec(preco),
          subtotal: dec(subtotal),
        };
      } else {
        const p = pecaPorCodigo(it.peca);
        const qtd = it.quantidade ?? 1;
        const preco = Number(p.precoVenda);
        const subtotal = preco * qtd;
        total += subtotal;
        return {
          tipo: "PECA" as const,
          partId: p.id,
          descricao: p.nome,
          quantidade: qtd,
          precoUnitario: dec(preco),
          subtotal: dec(subtotal),
        };
      }
    });
    const desconto = orc.desconto ?? 0;

    await prisma.quote.create({
      data: {
        numero: gerarNumero("ORC", seqOrc++),
        customerId: cli.customerId,
        vehicleId: cli.vehicleId,
        status: orc.status,
        validade: orc.validadeDias ? emDias(orc.validadeDias, 18) : null,
        desconto: dec(desconto),
        total: dec(total - desconto),
        observacoes: orc.observacoes,
        items: { create: itensData },
      },
    });
  }

  // ---------------------------------------------------------
  // AGENDAMENTOS
  // ---------------------------------------------------------
  console.log("📅 Criando agendamentos…");

  await prisma.appointment.create({
    data: {
      customerId: clientes[0].customerId,
      vehicleId: clientes[0].vehicleId,
      mecanicoId: mecanico1.id,
      servicoDesejado: "Revisão de suspensão",
      dataHora: emDias(0, 14, 0),
      duracaoMin: 90,
      status: "CONFIRMADO",
      observacoes: "Cliente prefere o turno da tarde.",
    },
  });
  await prisma.appointment.create({
    data: {
      customerId: clientes[3].customerId,
      vehicleId: clientes[3].vehicleId,
      mecanicoId: mecanico2.id,
      servicoDesejado: "Manutenção preventiva da frota",
      dataHora: emDias(0, 8, 30),
      duracaoMin: 180,
      status: "VEICULO_RECEBIDO",
    },
  });
  await prisma.appointment.create({
    data: {
      customerId: clientes[2].customerId,
      vehicleId: clientes[2].vehicleId,
      mecanicoId: mecanico1.id,
      servicoDesejado: "Troca de pastilhas de freio",
      dataHora: emDias(1, 10, 0),
      duracaoMin: 60,
      status: "AGENDADO",
    },
  });
  await prisma.appointment.create({
    data: {
      customerId: clientes[5].customerId,
      vehicleId: clientes[5].vehicleId,
      mecanicoId: mecanico2.id,
      servicoDesejado: "Diagnóstico elétrico",
      dataHora: emDias(2, 9, 0),
      duracaoMin: 60,
      status: "AGENDADO",
    },
  });
  await prisma.appointment.create({
    data: {
      customerId: clientes[7].customerId,
      vehicleId: clientes[7].vehicleId,
      servicoDesejado: "Troca de óleo",
      dataHora: emDias(-2, 11, 0),
      duracaoMin: 40,
      status: "NAO_COMPARECEU",
      observacoes: "Cliente não compareceu, reagendar.",
    },
  });
  await prisma.appointment.create({
    data: {
      customerId: clientes[6].customerId,
      vehicleId: clientes[6].vehicleId,
      mecanicoId: mecanico1.id,
      servicoDesejado: "Alinhamento e balanceamento",
      dataHora: emDias(-5, 15, 0),
      duracaoMin: 90,
      status: "CONCLUIDO",
    },
  });

  // ---------------------------------------------------------
  // INSPEÇÕES / CHECKLISTS
  // ---------------------------------------------------------
  console.log("📝 Criando inspeções (checklists)…");

  const osConcluida = ordensCriadas.find((o) => o.status === "CONCLUIDA");
  const osExecucao = ordensCriadas.find((o) => o.status === "EM_EXECUCAO");

  await prisma.inspection.create({
    data: {
      serviceOrderId: osConcluida?.id,
      vehicleId: clientes[6].vehicleId,
      mecanicoId: mecanico1.id,
      observacoes: "Checklist de entrega do veículo.",
      resumoIA:
        "Veículo em boas condições gerais. Suspensão recuperada após troca de amortecedores. Recomenda-se atenção aos pneus dianteiros nos próximos meses.",
      items: {
        create: [
          { item: "Freios", status: "OK", observacao: "Pastilhas em bom estado." },
          { item: "Suspensão", status: "OK", observacao: "Amortecedores novos instalados." },
          { item: "Pneus", status: "ATENCAO", observacao: "Desgaste irregular dianteiro." },
          { item: "Iluminação", status: "OK" },
          { item: "Fluidos", status: "OK" },
          { item: "Escapamento", status: "OK" },
        ],
      },
    },
  });

  await prisma.inspection.create({
    data: {
      serviceOrderId: osExecucao?.id,
      vehicleId: clientes[4].vehicleId,
      mecanicoId: mecanico1.id,
      observacoes: "Inspeção de recebimento - revisão 90 mil km.",
      items: {
        create: [
          { item: "Freios", status: "ATENCAO", observacao: "Discos no limite, monitorar." },
          { item: "Suspensão", status: "OK" },
          { item: "Pneus", status: "CRITICO", observacao: "Pneus traseiros carecas, trocar." },
          { item: "Bateria", status: "OK" },
          { item: "Correias", status: "ATENCAO", observacao: "Verificar tensão." },
          { item: "Filtros", status: "CRITICO", observacao: "Filtro de ar muito sujo." },
          { item: "Ar-condicionado", status: "NAO_VERIFICADO" },
        ],
      },
    },
  });

  // ---------------------------------------------------------
  // PAGAMENTOS
  // ---------------------------------------------------------
  console.log("💳 Criando pagamentos…");

  const osEntregue = ordensCriadas.find((o) => o.status === "ENTREGUE");
  const osAprovada = ordensCriadas.find((o) => o.status === "APROVADA");

  if (osEntregue) {
    await prisma.payment.create({
      data: {
        serviceOrderId: osEntregue.id,
        valorTotal: dec(osEntregue.total),
        valorPago: dec(osEntregue.total),
        forma: "PIX",
        status: "PAGO",
        dataPagamento: emDias(-1, 16, 30),
        observacoes: "Pagamento integral via PIX.",
      },
    });
  }
  if (osConcluida) {
    await prisma.payment.create({
      data: {
        serviceOrderId: osConcluida.id,
        valorTotal: dec(osConcluida.total),
        valorPago: dec(osConcluida.total / 2),
        forma: "CARTAO_CREDITO",
        status: "PARCIAL",
        dataPagamento: emDias(0, 10, 0),
        observacoes: "Entrada de 50%, restante na entrega.",
      },
    });
  }
  if (osAprovada) {
    await prisma.payment.create({
      data: {
        serviceOrderId: osAprovada.id,
        valorTotal: dec(osAprovada.total),
        valorPago: dec(0),
        forma: "BOLETO",
        status: "PENDENTE",
        observacoes: "Frota - faturamento mensal, aguardando emissão de boleto.",
      },
    });
  }

  // ---------------------------------------------------------
  // GARANTIAS
  // ---------------------------------------------------------
  console.log("🛡️ Criando garantias…");

  if (osEntregue) {
    await prisma.warranty.create({
      data: {
        serviceOrderId: osEntregue.id,
        descricao: "Garantia de 90 dias para serviço e peças (velas e óleo).",
        validadeAte: emDias(90, 23, 59),
        observacoes: "Conforme política da oficina Irmãos Zimmer.",
      },
    });
  }
  if (osConcluida) {
    await prisma.warranty.create({
      data: {
        serviceOrderId: osConcluida.id,
        descricao: "Garantia de 6 meses para amortecedores instalados.",
        validadeAte: emDias(180, 23, 59),
      },
    });
  }

  // ---------------------------------------------------------
  // INTERAÇÕES DE IA
  // ---------------------------------------------------------
  console.log("🤖 Criando interações de IA (exemplos)…");

  if (osConcluida) {
    await prisma.aiInteraction.create({
      data: {
        userId: atendente.id,
        tipo: "MENSAGEM_WHATSAPP",
        input: `Gerar mensagem de veículo pronto para a OS ${osConcluida.numero}.`,
        output:
          "Olá! Aqui é da Irmãos Zimmer. Seu veículo já está pronto para retirada. Qualquer dúvida, estamos à disposição! 🚗",
        model: "mock",
      },
    });
  }
  await prisma.aiInteraction.create({
    data: {
      userId: mecanico1.id,
      tipo: "RESUMO_INSPECAO",
      input: "Resumir checklist da revisão de 90 mil km.",
      output:
        "Veículo necessita troca de pneus traseiros (crítico) e filtro de ar (crítico). Discos de freio e correias merecem atenção. Demais itens em condições normais.",
      model: "mock",
    },
  });

  // ---------------------------------------------------------
  // RESUMO
  // ---------------------------------------------------------
  const totals = {
    usuarios: await prisma.user.count(),
    clientes: await prisma.customer.count(),
    veiculos: await prisma.vehicle.count(),
    servicos: await prisma.service.count(),
    fornecedores: await prisma.supplier.count(),
    pecas: await prisma.part.count(),
    ordens: await prisma.serviceOrder.count(),
    orcamentos: await prisma.quote.count(),
    agendamentos: await prisma.appointment.count(),
    inspecoes: await prisma.inspection.count(),
    pagamentos: await prisma.payment.count(),
  };

  console.log("\n✅ Seed concluído com sucesso!");
  console.table(totals);
  console.log("\n🔑 Login (senha para todos: zimmer123):");
  console.log("   admin@zimmer.com        → ADMINISTRADOR");
  console.log("   atendente@zimmer.com    → ATENDENTE");
  console.log("   mecanico@zimmer.com     → MECANICO");
  console.log("   mecanico2@zimmer.com    → MECANICO");
  console.log("   financeiro@zimmer.com   → FINANCEIRO");
  console.log("   estoque@zimmer.com      → ESTOQUE");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
