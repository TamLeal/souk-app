import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Edit3, Trash2, Plus, Minus, ChefHat, ArrowUp, ArrowDown,
  Pause, Check, Download, Settings, Send, Clock, ClipboardList, AlertTriangle, Zap
} from 'lucide-react';
import Switch from "react-switch";
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { CiFries } from "react-icons/ci";
import { FaHamburger } from "react-icons/fa";
import { GiHamburger } from "react-icons/gi";
import { PiHamburgerFill } from "react-icons/pi";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Chart from 'chart.js/auto';

// Componentes personalizados
const FlipNumber = ({ value }) => (
  <div className="flip-number">
    {value.toString().split('').map((digit, index) => (
      <div key={index} className="digit">
        {digit}
      </div>
    ))}
  </div>
);

const PanelCard = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-lg shadow-md bg-${color}-100 hover:bg-${color}-200 transition-all duration-300`}>
    <div className="flex items-center mb-2">
      {icon}
      <span className="ml-2 text-lg font-semibold text-gray-800">{label}</span>
    </div>
    <FlipNumber value={value} />
  </div>
);

// Dados iniciais
const opcionais = [
  { id: 1, nome: 'Sem alface' },
  { id: 2, nome: 'Sem maionese' },
  { id: 3, nome: 'Rúcula extra' },
  { id: 4, nome: 'Duplo burger' },
];

const produtos = [
  { id: 1, nome: 'KFT', preco: 15, cor: 'bg-red-200' },
  { id: 2, nome: 'Falafel', preco: 12, cor: 'bg-yellow-200' },
  { id: 3, nome: 'Marys', preco: 18, cor: 'bg-green-200' },
  { id: 4, nome: 'Fritas', preco: 8, cor: 'bg-yellow-100' },
];

const ResumoEvento = ({ historicoVendas, faturamentoTotal, exportarCSV, limparDadosPersistidos }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: produtos.map(p => p.nome),
        datasets: [{
          label: 'Vendas',
          data: produtos.map(p => historicoVendas[p.id] || 0),
          backgroundColor: produtos.map(p => p.cor.replace('bg-', '').replace('-', ''))
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    return () => {
      chart.destroy();
    };
  }, [historicoVendas]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Resumo do Evento</h2>
        <div className="flex space-x-2">
          <button onClick={exportarCSV} className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition duration-300">
            <Download size={20} />
          </button>
          <button onClick={limparDadosPersistidos} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition duration-300">
            Limpar Dados
          </button>
        </div>
      </div>
      <canvas id="vendasChart" ref={chartRef} className="mb-4" style={{ maxHeight: '200px', width: '100%' }}></canvas>
      <div className="flex flex-wrap justify-between items-center">
        {produtos.map(produto => (
          <div key={produto.id} className="flex items-center mr-4 mb-2">
            <span className="font-medium text-gray-700 mr-2">{produto.nome}:</span>
            <span className="bg-gray-200 px-3 py-1 rounded-lg text-gray-800">{historicoVendas[produto.id] || 0}</span>
          </div>
        ))}
        <div className="flex items-center mt-4">
          <span className="font-medium text-gray-700 mr-2">Faturamento:</span>
          <span className="bg-green-100 px-3 py-1 rounded-lg font-bold text-green-800">R$ {faturamentoTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const ControleCaixaExpedicao = () => {
  const [carrinho, setCarrinho] = useState({});
  const [opcionaisSelecionados, setOpcionaisSelecionados] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoItem, setEditandoItem] = useState(null);
  const [filaPedidos, setFilaPedidos] = useState(() => {
    const savedFilaPedidos = localStorage.getItem('filaPedidos');
    return savedFilaPedidos ? JSON.parse(savedFilaPedidos) : [];
  });
  const [pedidosOnHold, setPedidosOnHold] = useState([]);
  const [esquecidos, setEsquecidos] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState(() => {
    const savedHistoricoVendas = localStorage.getItem('historicoVendas');
    return savedHistoricoVendas ? JSON.parse(savedHistoricoVendas) : {};
  });
  const [numeroPedido, setNumeroPedido] = useState(() => {
    const savedNumeroPedido = localStorage.getItem('numeroPedido');
    return savedNumeroPedido ? parseInt(savedNumeroPedido, 10) : 1;
  });
  const [pedidoPrioritario, setPedidoPrioritario] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [contadorFila, setContadorFila] = useState({});
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const [senha, setSenha] = useState('');
  const [senhaCorreta, setSenhaCorreta] = useState(false);
  const [mostrarInputSenha, setMostrarInputSenha] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  // Histórico de ações
  const [historicoAcoes, setHistoricoAcoes] = useState([]);

  // Configurações das features
  const [configExpedicao, setConfigExpedicao] = useState({
    subidaAutomatica: false,
    tempoSubida: 15,
    bordaPiscante: false,
    tempoBordaPiscante: 20
  });
  const [mostrarConfig, setMostrarConfig] = useState(false); // Configurações da expedição
  const [mostrarHistorico, setMostrarHistorico] = useState(false); // Novo estado para controlar a visibilidade do histórico

  useEffect(() => {
    atualizarContadorFila();
  }, [filaPedidos]);

  useEffect(() => {
    localStorage.setItem('filaPedidos', JSON.stringify(filaPedidos));
  }, [filaPedidos]);

  useEffect(() => {
    localStorage.setItem('historicoVendas', JSON.stringify(historicoVendas));
  }, [historicoVendas]);

  useEffect(() => {
    localStorage.setItem('numeroPedido', numeroPedido);
  }, [numeroPedido]);

  const calcularFaturamentoTotal = () => {
    return Object.entries(historicoVendas).reduce((total, [id, qtd]) => {
      const produto = produtos.find(p => p.id === parseInt(id.split('-')[0]));
      if (produto) {
        return total + (produto.preco * qtd);
      } else {
        console.error(`Produto com ID ${id} não encontrado!`);
        return total;
      }
    }, 0);
  };

  const faturamentoTotal = calcularFaturamentoTotal();

  useEffect(() => {
    if (configExpedicao.subidaAutomatica) {
      const intervalo = setInterval(() => {
        verificarSubidaAutomatica();
      }, 60000);
      return () => clearInterval(intervalo);
    }
  }, [filaPedidos, configExpedicao]);

  const verificarSubidaAutomatica = () => {
    const agora = new Date().getTime();
    const novosPedidos = [...filaPedidos];

    novosPedidos.forEach((pedido, index) => {
      const tempoNaFila = (agora - new Date(pedido.horario).getTime()) / 60000;
      if (tempoNaFila > configExpedicao.tempoSubida) {
        novosPedidos.splice(index, 1);
        novosPedidos.unshift({ ...pedido, subidaAutomatica: true });
      }
    });

    setFilaPedidos(novosPedidos);
  };

  const atualizarContadorFila = () => {
    const novoContador = {};
    filaPedidos.forEach(pedido => {
      Object.entries(pedido.itens).forEach(([id, { nome, qtd }]) => {
        novoContador[nome] = (novoContador[nome] || 0) + qtd;
      });
    });
    setContadorFila(novoContador);
  };

  const adicionarAoCarrinho = (produto, opcionais) => {
    const chaveProduto = `${produto.id}-${opcionais.join('-')}`;

    setCarrinho(prev => {
      if (editandoItem) {
        return {
          ...prev,
          [editandoItem]: {
            ...prev[editandoItem],
            opcionais: [...opcionais]
          },
        };
      } else {
        return {
          ...prev,
          [chaveProduto]: {
            ...produto,
            qtd: (prev[chaveProduto]?.qtd || 0) + 1,
            opcionais: [...opcionais],
          },
        };
      }
    });

    setMostrarModal(false);
    setEditandoItem(null);
  };

  const abrirModal = (produto) => {
    setProdutoSelecionado(produto);
    setOpcionaisSelecionados([]);
    setMostrarModal(true);
  };

  const editarQuantidade = (chave, delta) => {
    setCarrinho(prev => {
      const itemExistente = prev[chave];
      if (!itemExistente) return prev;

      const novaQuantidade = Math.max(0, itemExistente.qtd + delta);
      if (novaQuantidade === 0) {
        const { [chave]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [chave]: { ...itemExistente, qtd: novaQuantidade } };
    });
  };

  const editarOpcionais = (chave) => {
    setEditandoItem(chave);
    const item = carrinho[chave];
    setProdutoSelecionado(item);
    setOpcionaisSelecionados(item.opcionais);
    setMostrarModal(true);
  };

  const removerItem = (chave) => {
    setCarrinho(prev => {
      const { [chave]: _, ...rest } = prev;
      return rest;
    });
  };

  const apagarPedido = () => {
    if (window.confirm('Tem certeza de que deseja limpar todos os dados?')) {
      setCarrinho({});
      setPedidoPrioritario(false);
      setNomeCliente('');
    }
  };

  const enviarParaProducao = () => {
    if (!nomeCliente.trim()) {
      alert("Por favor, insira o nome do cliente.");
      return;
    }

    const novoPedido = {
      id: numeroPedido,
      cliente: nomeCliente,
      itens: carrinho,
      total: calcularTotal(carrinho),
      prioritario: pedidoPrioritario,
      horario: new Date().toISOString(),
    };

    setFilaPedidos(prev => [...prev, novoPedido]);
    setNumeroPedido(prev => prev + 1);

    setHistoricoVendas(prev => {
      const novoHistorico = { ...prev };
      Object.entries(carrinho).forEach(([id, { qtd }]) => {
        const produtoId = parseInt(id.split('-')[0]);
        novoHistorico[produtoId] = (novoHistorico[produtoId] || 0) + qtd;
      });
      return novoHistorico;
    });

    const horarioAcao = new Date().toLocaleTimeString();
    setHistoricoAcoes(prev => [
      ...prev,
      `Pedido ${nomeCliente} #${numeroPedido} enviado para produção (${horarioAcao})`
    ]);

    setCarrinho({});
    setPedidoPrioritario(false);
    setNomeCliente('');
  };

  const calcularTotal = (itens) => {
    return Object.entries(itens).reduce((total, [id, { qtd }]) => {
      const produto = produtos.find(p => p.id === parseInt(id.split('-')[0]));
      if (produto) {
        return total + (produto.preco * qtd);
      } else {
        console.error(`Produto com ID ${id} não encontrado!`);
        return total;
      }
    }, 0);
  };

  const moverPedido = (sourceIndex, destinationIndex) => {
    const novosPedidos = Array.from(filaPedidos);
    const [movedPedido] = novosPedidos.splice(sourceIndex, 1);
    novosPedidos.splice(destinationIndex, 0, movedPedido);

    const horarioAcao = new Date().toLocaleTimeString();
    setFilaPedidos(novosPedidos);
    setHistoricoAcoes(prev => [
      ...prev,
      `Pedido ${movedPedido.cliente} #${movedPedido.id} movido na fila (${horarioAcao})`
    ]);
  };

  const togglePedidoOnHold = (pedido) => {
    const horarioAcao = new Date().toLocaleTimeString();
    if (filaPedidos.includes(pedido)) {
      setFilaPedidos(prev => prev.filter(p => p.id !== pedido.id));
      setPedidosOnHold(prev => [...prev, pedido]);
    } else {
      setPedidosOnHold(prev => prev.filter(p => p.id !== pedido.id));
      setFilaPedidos(prev => [...prev, pedido]);
    }
    setHistoricoAcoes(prev => [
      ...prev,
      `Pedido ${pedido.cliente} #${pedido.id} colocado em espera (${horarioAcao})`
    ]);
  };

  const moverParaEsquecidos = (pedido) => {
    const horarioAcao = new Date().toLocaleTimeString();
    setPedidosOnHold(prev => prev.filter(p => p.id !== pedido.id));
    setEsquecidos(prev => [...prev, pedido]);
    setHistoricoAcoes(prev => [
      ...prev,
      `Pedido ${pedido.cliente} #${pedido.id} movido para esquecidos (${horarioAcao})`
    ]);
  };

  const removerPedido = (id) => {
    const horarioAcao = new Date().toLocaleTimeString();
    const pedidoRemovido = filaPedidos.find(pedido => pedido.id === id) || pedidosOnHold.find(pedido => pedido.id === id) || esquecidos.find(pedido => pedido.id === id);

    setFilaPedidos(prev => prev.filter(pedido => pedido.id !== id));
    setPedidosOnHold(prev => prev.filter(pedido => pedido.id !== id));
    setEsquecidos(prev => prev.filter(pedido => pedido.id !== id));
    
    setHistoricoAcoes(prev => [
      ...prev,
      `Pedido ${pedidoRemovido.cliente} #${id} removido da fila (${horarioAcao})`
    ]);
  };

  const togglePrioridade = () => {
    const horarioAcao = new Date().toLocaleTimeString();
    setPedidoPrioritario(!pedidoPrioritario);
    setHistoricoAcoes(prev => [
      ...prev,
      `Pedido marcado como ${pedidoPrioritario ? 'normal' : 'prioritário'} (${horarioAcao})`
    ]);
  };

  const exportarCSV = () => {
    const dadosPedidos = gerarDadosCSV(filaPedidos);
    const consolidadoProdutos = gerarConsolidadoCSV(historicoVendas);

    const csvPedidos = Papa.unparse(dadosPedidos);
    const csvConsolidado = Papa.unparse(consolidadoProdutos);

    const csvCompleto = `${csvPedidos}\n\n--- Consolidado ---\n\n${csvConsolidado}`;

    const blob = new Blob([csvCompleto], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `exportacao_pedidos_consolidado_${new Date().toISOString()}.csv`);
  };

  const gerarDadosCSV = (filaPedidos) => {
    return filaPedidos.map(pedido => {
      const horario = new Date(pedido.horario).toLocaleTimeString();

      const produtoQuantidade = produtos.map(produto => {
        const itemPedido = Object.values(pedido.itens).find(item => item.nome === produto.nome);
        return itemPedido ? itemPedido.qtd : 0;
      });

      return {
        numero_pedido: pedido.id,
        nome_cliente: pedido.cliente,
        horario_pedido: horario,
        ...produtoQuantidade.reduce((acc, qtd, index) => {
          acc[produtos[index].nome] = qtd;
          return acc;
        }, {})
      };
    });
  };

  const gerarConsolidadoCSV = (historicoVendas) => {
    return Object.entries(historicoVendas).map(([id, qtd]) => {
      const produto = produtos.find(p => p.id === parseInt(id));
      return {
        produto: produto.nome,
        quantidade: qtd,
        total_faturado: `R$ ${(produto.preco * qtd).toFixed(2)}`
      };
    });
  };

  const limparDadosPersistidos = () => {
    if (window.confirm('Tem certeza de que deseja limpar todos os dados?')) {
      localStorage.removeItem('filaPedidos');
      localStorage.removeItem('historicoVendas');
      localStorage.removeItem('numeroPedido');
      setFilaPedidos([]);
      setHistoricoVendas({});
      setNumeroPedido(1);
      setHistoricoAcoes(prev => [...prev, `Todos os dados persistidos foram limpos (${new Date().toLocaleTimeString()})`]);
    }
  };

  const handleSenhaSubmit = (e) => {
    e.preventDefault();
    if (senha === 'lec123') {
      setSenhaCorreta(true);
      setMostrarResumo(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigExpedicao(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value, 10)
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    moverPedido(result.source.index, result.destination.index);
  };

  const filteredPedidos = filaPedidos.filter(pedido => {
    const matchSearch = pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'todos') return matchSearch;
    if (filterStatus === 'prioritario') return matchSearch && pedido.prioritario;
    if (filterStatus === 'normal') return matchSearch && !pedido.prioritario;
    return true;
  });

  const handleToggleResumo = () => {
    if (mostrarResumo) {
      setSenhaCorreta(false);
      setMostrarResumo(false);
      setMostrarInputSenha(false);
      setSenha('');
    } else {
      setMostrarInputSenha(!mostrarInputSenha);
    }
  };

  return (
    <div className="relative p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Controle de Caixa</h1>

      <div className="flex justify-end mb-6 relative">
        <button
          onClick={handleToggleResumo}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
        >
          <Settings size={24} />
        </button>

        {mostrarInputSenha && (
          <div className={`absolute top-0 right-0 transition-all duration-300 transform ${mostrarInputSenha ? 'opacity-100 translate-x-[-70px]' : 'opacity-0 translate-x-full'}`}>
            <form onSubmit={handleSenhaSubmit} className="flex items-center space-x-2">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="p-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ width: '150px' }}
              />
              <button type="submit" className="p-2 bg-blue-500 text-white rounded-lg text-sm">
                Confirmar
              </button>
            </form>
          </div>
        )}
      </div>

      {mostrarResumo && senhaCorreta && (
        <ResumoEvento
          historicoVendas={historicoVendas}
          faturamentoTotal={faturamentoTotal}
          exportarCSV={exportarCSV}
          limparDadosPersistidos={limparDadosPersistidos}
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        {produtos.map(produto => (
          <div
            key={produto.id}
            className={`${produto.cor} p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left border border-gray-300 cursor-pointer`}
            onClick={() => adicionarAoCarrinho(produto, [])}
          >
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              {produto.nome === 'KFT' && <GiHamburger className="mr-2" />}
              {produto.nome === 'Falafel' && <FaHamburger className="mr-2" />}
              {produto.nome === 'Marys' && <PiHamburgerFill className="mr-2" style={{ fontSize: '1.2rem' }} />}
              {produto.nome === 'Fritas' && <CiFries className="mr-2" style={{ fontSize: '1.4rem' }} />}
              {produto.nome}
            </h3>
            <p className="text-gray-600 text-sm mt-1">R$ {produto.preco.toFixed(2)}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                abrirModal(produto);
              }}
              className="mt-3 p-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              <Edit3 size={18} />
            </button>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-white p-8 rounded-lg shadow-lg relative z-50 animate-fadeInUp">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Opcionais para {produtoSelecionado?.nome}</h2>
            <div className="mb-6">
              {opcionais.map(opcional => (
                <div key={opcional.id} className="mb-4">
                  <label className="flex items-center text-gray-700">
                    <input
                      type="checkbox"
                      value={opcional.nome}
                      checked={opcionaisSelecionados.includes(opcional.nome)}
                      onChange={() => setOpcionaisSelecionados(prev =>
                        prev.includes(opcional.nome)
                          ? prev.filter(item => item !== opcional.nome)
                          : [...prev, opcional.nome]
                      )}
                      className="mr-2"
                    />
                    {opcional.nome}
                  </label>
                </div>
              ))}
            </div>
            <button
              onClick={() => adicionarAoCarrinho(produtoSelecionado, opcionaisSelecionados)}
              className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              Confirmar
            </button>
            <button
              onClick={() => setMostrarModal(false)}
              className="p-3 bg-red-500 text-white rounded-lg ml-4 hover:bg-red-600 transition-all duration-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg mb-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center mr-6">
              <ShoppingCart className="mr-2" size={24} />
              Carrinho
            </h2>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              className="ml-2 p-2 border border-gray-300 rounded-lg text-sm w-40 text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do cliente"
            />
            <button
              onClick={togglePrioridade}
              className={`ml-4 p-2 rounded-full ${pedidoPrioritario ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-red-500 hover:text-white transition-all duration-300`}
              title={pedidoPrioritario ? "Remover prioridade" : "Marcar como prioritário"}
            >
              <AlertTriangle size={24} />
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={apagarPedido}
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300"
              title="Apagar Pedido"
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>

        <ul className="mb-6">
          {Object.entries(carrinho).map(([chave, { nome, preco, qtd, opcionais }]) => (
            <li key={chave} className="flex justify-between items-center mb-4">
              <div className="flex-1">
                <span className="font-medium text-gray-800">{nome}</span>
              </div>
              <div className="flex-1 text-center flex items-center justify-center">
                <button
                  onClick={() => editarQuantidade(chave, -1)}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
                >
                  <Minus size={20} />
                </button>
                <span className="mx-4 text-gray-700 font-semibold">x {qtd}</span>
                <button
                  onClick={() => editarQuantidade(chave, 1)}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex-1 text-right">
                {opcionais.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Opcionais: {opcionais.join(', ')}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => editarOpcionais(chave)}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
                >
                  <Edit3 size={20} />
                </button>
                <button
                  onClick={() => removerItem(chave)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="text-right">
          <p className="font-medium text-gray-700">Total de itens: {Object.keys(carrinho).length}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">Total: R$ {calcularTotal(carrinho).toFixed(2)}</p>
          <div className="flex justify-end mt-6">
            <button
              onClick={enviarParaProducao}
              className="p-3 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300"
              disabled={Object.keys(carrinho).length === 0}
            >
              <span>Enviar Pedido</span>
              <Send size={24} className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Expedição</h1>

      <div className="relative bg-gray-200 p-6 rounded-lg shadow-md mb-8 transition-all duration-300 hover:shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-800">Painel de Produção</h2>
            <button
              onClick={() => setMostrarConfig(!mostrarConfig)}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
            >
              <Settings size={24} />
            </button>
          </div>
          <div className="flex items-center space-x-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar pedidos..."
              className="p-2 rounded-lg shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 rounded-lg shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            >
              <option value="todos">Todos</option>
              <option value="prioritario">Prioritário</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
        {mostrarConfig && (
          <div className="absolute left-0 top-0 mt-16 ml-0 bg-white p-6 rounded-lg shadow-lg z-20 animate-fadeInUp">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Configurações de Expedição</h3>
            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-6">
                <label className="flex items-center text-gray-800">
                  <Switch
                    onChange={() => setConfigExpedicao(prev => ({ ...prev, subidaAutomatica: !prev.subidaAutomatica }))}
                    checked={configExpedicao.subidaAutomatica}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={22}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={44}
                  />
                  <span className="ml-3">Subida automática após</span>
                </label>
                <input
                  type="number"
                  name="tempoSubida"
                  value={configExpedicao.tempoSubida}
                  onChange={handleConfigChange}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  style={{ width: '60px' }}
                  disabled={!configExpedicao.subidaAutomatica}
                />
                <span className="text-gray-800">minutos</span>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center text-gray-800">
                  <Switch
                    onChange={() => setConfigExpedicao(prev => ({ ...prev, bordaPiscante: !prev.bordaPiscante }))}
                    checked={configExpedicao.bordaPiscante}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={22}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={44}
                  />
                  <span className="ml-3">Borda piscante após</span>
                </label>
                <input
                  type="number"
                  name="tempoBordaPiscante"
                  value={configExpedicao.tempoBordaPiscante}
                  onChange={handleConfigChange}
                  className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  style={{ width: '60px' }}
                  disabled={!configExpedicao.bordaPiscante}
                />
                <span className="text-gray-800">minutos</span>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <PanelCard
            icon={<ChefHat size={24} />}
            label="Total de Itens"
            value={Object.keys(contadorFila).reduce((total, key) => total + contadorFila[key], 0)}
            color="blue"
          />
          <PanelCard
            icon={<Clock size={24} />}
            label="Tempo Médio na Fila"
            value={(filaPedidos.length > 0 ? Math.round(filaPedidos.reduce((total, pedido) => total + (new Date().getTime() - new Date(pedido.horario).getTime()) / 60000, 0) / filaPedidos.length) : 0)}
            color="green"
          />
          <PanelCard
            icon={<AlertTriangle size={24} />}
            label="Pedidos Prioritários"
            value={filaPedidos.filter(p => p.prioritario).length}
            color="red"
          />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="filaPedidos" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="bg-white p-6 rounded-lg shadow-md mb-8 overflow-x-auto transition-all duration-300 hover:shadow-lg flex space-x-4"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <ChefHat className="mr-2" size={24} />
                Fila de Pedidos
              </h2>
              {filteredPedidos.length === 0 ? (
                <p className="text-gray-700">Nenhum pedido na fila.</p>
              ) : (
                filteredPedidos.map((pedido, index) => {
                  const tempoNaFila = (new Date().getTime() - new Date(pedido.horario).getTime()) / 60000;
                  const isBordaPiscante = configExpedicao.bordaPiscante && tempoNaFila > configExpedicao.tempoBordaPiscante;
                  return (
                    <Draggable key={pedido.id} draggableId={`${pedido.id}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex-shrink-0 w-80 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${pedido.prioritario ? 'bg-red-100' : 'bg-white'} ${isBordaPiscante ? 'animate-pulse border-4 border-red-500' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">{pedido.cliente} #{pedido.id}</h3>
                            <div className="text-sm text-gray-500">{new Date(pedido.horario).toLocaleTimeString()}</div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => moverPedido(index, -1)}
                                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
                                disabled={index === 0}
                              >
                                <ArrowUp size={20} />
                              </button>
                              <button
                                onClick={() => moverPedido(index, 1)}
                                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
                                disabled={index === filaPedidos.length - 1}
                              >
                                <ArrowDown size={20} />
                              </button>
                              <button
                                onClick={() => togglePedidoOnHold(pedido)}
                                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300"
                                title="Colocar em espera"
                              >
                                <Pause size={20} />
                              </button>
                              <button
                                onClick={() => removerPedido(pedido.id)}
                                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300"
                                title="Pedido entregue"
                              >
                                <Check size={20} />
                              </button>
                              {pedido.subidaAutomatica && <Clock className="text-red-500" size={20} />}
                            </div>
                          </div>
                          <ul>
                            {Object.entries(pedido.itens).map(([id, { nome, qtd, opcionais }]) => (
                              <li key={id} className="flex justify-between items-center mb-4">
                                <div className="flex-1">
                                  <span className="text-gray-800 font-medium">{nome} x {qtd}</span>
                                </div>
                                {opcionais && opcionais.length > 0 && (
                                  <div className="flex-1 text-right text-sm text-gray-600">
                                    Opcionais: {opcionais.join(', ')}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Draggable>
                  );
                }))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-64 transition-all duration-300 hover:shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Pause className="mr-2" size={24} />
            Pedidos em Espera
          </h2>
          {pedidosOnHold.length === 0 ? (
            <p className="text-gray-700">Nenhum pedido em espera.</p>
          ) : (
            <ul>
              {pedidosOnHold.map((pedido) => (
                <li key={pedido.id} className="mb-4 p-4 bg-blue-100 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">{pedido.cliente} #{pedido.id}</h3>
                    <div className="text-sm text-gray-500">{new Date(pedido.horario).toLocaleTimeString()}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => moverParaEsquecidos(pedido)}
                        className="p-2 rounded-full bg-yellow-300 hover:bg-yellow-400 transition-all duration-300"
                        title="Mover para Esquecidos"
                      >
                        <Zap size={20} />
                      </button>
                      <button
                        onClick={() => removerPedido(pedido.id)}
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300"
                        title="Pedido entregue"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  </div>
                  <ul>
                    {Object.entries(pedido.itens).map(([id, { nome, qtd, opcionais }]) => (
                      <li key={id} className="flex justify-between items-center mb-4">
                        <div className="flex-1">
                          <span className="text-gray-800 font-medium">{nome} x {qtd}</span>
                        </div>
                        {opcionais && opcionais.length > 0 && (
                          <div className="flex-1 text-right text-sm text-gray-600">
                            Opcionais: {opcionais.join(', ')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-64 transition-all duration-300 hover:shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Zap className="mr-2" size={24} />
            Esqueceram de Mim
          </h2>
          {esquecidos.length === 0 ? (
            <p className="text-gray-700">Nenhum pedido esquecido.</p>
          ) : (
            <ul>
              {esquecidos.map((pedido) => (
                <li key={pedido.id} className="mb-4 p-4 bg-yellow-100 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">{pedido.cliente} #{pedido.id}</h3>
                    <div className="text-sm text-gray-500">{new Date(pedido.horario).toLocaleTimeString()}</div>
                    <button
                      onClick={() => removerPedido(pedido.id)}
                      className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300"
                      title="Pedido entregue"
                    >
                      <Check size={20} />
                    </button>
                  </div>
                  <ul>
                    {Object.entries(pedido.itens).map(([id, { nome, qtd, opcionais }]) => (
                      <li key={id} className="flex justify-between items-center mb-4">
                        <div className="flex-1">
                          <span className="text-gray-800 font-medium">{nome} x {qtd}</span>
                        </div>
                        {opcionais && opcionais.length > 0 && (
                          <div className="flex-1 text-right text-sm text-gray-600">
                            Opcionais: {opcionais.join(', ')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Histórico de Ações com scroll interno condicional */}
      <div
        className={`bg-white p-6 rounded-lg shadow-md mt-10 cursor-pointer transition-all duration-300 ease-in-out ${
          mostrarHistorico ? 'max-h-64 overflow-y-auto py-4' : 'max-h-14 py-2 flex items-center'
        }`}
        onClick={() => setMostrarHistorico(!mostrarHistorico)}
      >
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <ClipboardList className="mr-2" size={24} />
          Histórico de Ações
        </h2>
        {mostrarHistorico && historicoAcoes.length > 0 ? (
          <ul className="mt-4">
            {historicoAcoes.map((acao, index) => (
              <li
                key={index}
                className={`mb-2 p-4 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm ${
                  index === 0 ? 'mt-2' : ''
                }`}
              >
                {acao}
              </li>
            ))}
          </ul>
        ) : (
          mostrarHistorico && <p className="text-sm text-gray-700 mt-4">Nenhuma ação registrada.</p>
        )}
      </div>
    </div>
  );
};

export default ControleCaixaExpedicao;
