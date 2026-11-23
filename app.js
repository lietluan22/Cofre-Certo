const CHAVE = 'cofre-certo-simples'

const exemplo = {
  investimentos: [
    { id: 1, produto: 'CDB', instituicao: 'Banco Aurora', valor: 18000, taxa: 11.2, fgc: true },
    { id: 2, produto: 'LCI', instituicao: 'Cooperativa Horizonte', valor: 12000, taxa: 10.4, fgc: true },
    { id: 3, produto: 'Tesouro Direto', instituicao: 'Tesouro Nacional', valor: 9500, taxa: 10.8, fgc: false }
  ],
  objetivos: [
    { id: 1, nome: 'Reserva de emergência', alvo: 30000, guardado: 18500 }
  ]
}

let dados = carregar()

function carregar() {
  try {
    const salvo = localStorage.getItem(CHAVE)
    return salvo ? JSON.parse(salvo) : structuredClone(exemplo)
  } catch {
    return structuredClone(exemplo)
  }
}

function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(dados))
}

function dinheiro(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(valor || 0)
}

function totalInvestido() {
  return dados.investimentos.reduce((soma, item) => soma + Number(item.valor), 0)
}

function calcularFgc() {
  const grupos = {}
  dados.investimentos
    .filter((item) => item.fgc)
    .forEach((item) => {
      grupos[item.instituicao] = (grupos[item.instituicao] || 0) + Number(item.valor)
    })

  return Object.entries(grupos).map(([instituicao, total]) => ({
    instituicao,
    total,
    coberto: Math.min(total, 250000),
    descoberto: Math.max(0, total - 250000)
  }))
}

function renderizar() {
  const total = totalInvestido()
  const grupos = calcularFgc()
  const protegido = grupos.reduce((soma, grupo) => soma + grupo.coberto, 0)
  const descoberto = grupos.reduce((soma, grupo) => soma + grupo.descoberto, 0)
  const alvoTotal = dados.objetivos.reduce((soma, item) => soma + Number(item.alvo), 0)
  const guardadoTotal = dados.objetivos.reduce((soma, item) => soma + Number(item.guardado), 0)
  const progresso = alvoTotal ? Math.round((guardadoTotal / alvoTotal) * 100) : 0

  document.getElementById('totalInvestido').textContent = dinheiro(total)
  document.getElementById('qtdProdutos').textContent = dados.investimentos.length + ' produtos'
  document.getElementById('totalProtegido').textContent = dinheiro(protegido)
  document.getElementById('totalDescoberto').textContent = dinheiro(descoberto)
  document.getElementById('progressoGeral').textContent = progresso + '%'
  document.getElementById('resumoObjetivos').textContent = dinheiro(guardadoTotal) + ' de ' + dinheiro(alvoTotal)

  const resumo = document.getElementById('resumoCarteira')
  resumo.innerHTML = dados.investimentos.length
    ? dados.investimentos.slice(0, 4).map((item) => `
      <div class="item">
        <div class="item-info">
          <strong>${item.instituicao}</strong>
          <span>${item.produto} · ${item.fgc ? 'Coberto pelo FGC' : 'Sem FGC'}</span>
        </div>
        <div class="item-valor">
          <strong>${dinheiro(item.valor)}</strong>
          <span>${item.taxa || 0}% a.a.</span>
        </div>
      </div>
    `).join('')
    : '<div class="vazio">Nenhum investimento cadastrado.</div>'

  const tabela = document.getElementById('tabelaCarteira')
  tabela.innerHTML = dados.investimentos.length
    ? dados.investimentos.map((item) => `
      <div class="item">
        <div class="item-info">
          <strong>${item.instituicao}</strong>
          <span>${item.produto} · ${item.taxa || 0}% a.a.</span>
        </div>
        <div class="item-valor">
          <strong>${dinheiro(item.valor)}</strong>
          <span class="${item.fgc ? 'selo' : 'selo neutro'}">${item.fgc ? 'Coberto' : 'Sem FGC'}</span>
        </div>
        <button class="botao perigo" onclick="removerInvestimento(${item.id})">Excluir</button>
      </div>
    `).join('')
    : '<div class="vazio">Adicione seu primeiro investimento acima.</div>'

  const listaFgc = document.getElementById('listaFgc')
  listaFgc.innerHTML = grupos.length
    ? grupos.map((grupo) => {
        const pct = Math.min(100, (grupo.total / 250000) * 100)
        return `
          <div class="item" style="display:block">
            <div style="display:flex;justify-content:space-between;gap:10px">
              <div class="item-info">
                <strong>${grupo.instituicao}</strong>
                <span>${dinheiro(grupo.total)} em produtos cobertos</span>
              </div>
              <span class="${grupo.descoberto > 0 ? 'selo ruim' : 'selo'}">
                ${grupo.descoberto > 0 ? dinheiro(grupo.descoberto) + ' descoberto' : 'Dentro do limite'}
              </span>
            </div>
            <div class="barra"><div style="width:${pct}%"></div></div>
            <div class="rodape" style="display:flex;justify-content:space-between;font-size:10px;color:#68746d;margin-top:5px">
              <span>${dinheiro(grupo.coberto)} cobertos</span>
              <span>${Math.round(pct)}% do limite</span>
            </div>
          </div>
        `
      }).join('')
    : '<div class="vazio">Cadastre produtos cobertos pelo FGC para ver o mapa.</div>'

  const listaObjetivos = document.getElementById('listaObjetivos')
  listaObjetivos.innerHTML = dados.objetivos.length
    ? dados.objetivos.map((item) => {
        const pct = Math.min(100, Math.round((item.guardado / Math.max(1, item.alvo)) * 100))
        return `
          <article class="objetivo">
            <h3>${item.nome}</h3>
            <div class="valor">${dinheiro(item.guardado)} <span>de ${dinheiro(item.alvo)}</span></div>
            <div class="barra"><div style="width:${pct}%"></div></div>
            <div class="rodape">
              <span>${pct}% concluído</span>
              <button class="botao perigo" onclick="removerObjetivo(${item.id})">Excluir</button>
            </div>
          </article>
        `
      }).join('')
    : '<div class="vazio">Crie seu primeiro objetivo acima.</div>'
}

document.querySelectorAll('.menu button').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.menu button').forEach((b) => b.classList.remove('ativo'))
    document.querySelectorAll('.tela').forEach((tela) => tela.classList.remove('ativa'))
    botao.classList.add('ativo')
    document.getElementById(botao.dataset.tab).classList.add('ativa')
  })
})

document.querySelectorAll('[data-ir]').forEach((botao) => {
  botao.addEventListener('click', () => {
    const destino = botao.dataset.ir
    document.querySelectorAll('.menu button').forEach((b) => b.classList.toggle('ativo', b.dataset.tab === destino))
    document.querySelectorAll('.tela').forEach((tela) => tela.classList.toggle('ativa', tela.id === destino))
  })
})

document.getElementById('formInvestimento').addEventListener('submit', (evento) => {
  evento.preventDefault()
  const form = new FormData(evento.target)
  dados.investimentos.unshift({
    id: Date.now(),
    produto: form.get('produto'),
    instituicao: form.get('instituicao').trim(),
    valor: Number(form.get('valor')),
    taxa: Number(form.get('taxa')) || 0,
    fgc: form.get('fgc') === 'on'
  })
  salvar()
  renderizar()
  evento.target.reset()
})

document.getElementById('formObjetivo').addEventListener('submit', (evento) => {
  evento.preventDefault()
  const form = new FormData(evento.target)
  dados.objetivos.unshift({
    id: Date.now(),
    nome: form.get('nome').trim(),
    alvo: Number(form.get('alvo')),
    guardado: Number(form.get('guardado')) || 0
  })
  salvar()
  renderizar()
  evento.target.reset()
})

function removerInvestimento(id) {
  dados.investimentos = dados.investimentos.filter((item) => item.id !== id)
  salvar()
  renderizar()
}

function removerObjetivo(id) {
  dados.objetivos = dados.objetivos.filter((item) => item.id !== id)
  salvar()
  renderizar()
}

document.getElementById('limparDados').addEventListener('click', () => {
  if (!confirm('Apagar todos os dados e voltar ao exemplo?')) return
  dados = structuredClone(exemplo)
  salvar()
  renderizar()
})

renderizar()
