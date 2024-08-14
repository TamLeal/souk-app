import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Edit3, Trash2, Plus, Minus, ChefHat, ArrowUp, ArrowDown,
  Pause, Check, Zap, AlertTriangle, Download, Settings, Send, Clock
} from 'lucide-react';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { CiFries } from "react-icons/ci";
import { FaHamburger } from "react-icons/fa";
import { GiHamburger } from "react-icons/gi";
import { PiHamburgerFill } from "react-icons/pi"; // Novo ícone para Marys

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
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Resumo do Evento</h2>
        <div className="flex space-x-2">
          <button onClick={exportarCSV} className="p-1 rounded hover:bg-gray-200">
            <Download size={20} />
          </button>
          <button onClick={limparDadosPersistidos} className="p-1 rounded hover:bg-gray-200">
            Limpar Dados
          </button>
        </div>
      </div>
      <div className="flex flex-wrap justify-between items-center">
        {produtos.map(produto => (
          <div key={produto.id} className="flex items-center mr-4 mb-2">
            <span className="font-medium mr-2">{produto.nome}:</span>
            <span className="bg-white px-2 py-1 rounded">{historicoVendas[produto.id] || 0}</span>
          </div>
        ))}
        <div className="flex items-center">
          <span className="font-medium mr-2">Faturamento:</span>
          <span className="bg-white px-2 py-1 rounded font-bold">R$ {faturamentoTotal.toFixed(2)}</span>
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

  // Configurações das features
  const [configExpedicao, setConfigExpedicao] = useState({
    subidaAutomatica: false,
    tempoSubida: 15, // tempo em minutos
    bordaPiscante: false,
    tempoBordaPiscante: 20 // tempo em minutos
  });
  const [mostrarConfig, setMostrarConfig] = useState(false);

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

  useEffect(() => {
    if (configExpedicao.subidaAutomatica) {
      const intervalo = setInterval(() => {
        verificarSubidaAutomatica();
      }, 60000); // verifica a cada minuto
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

    setCarrinho({});
    setPedidoPrioritario(false);
    setNomeCliente(''); // Limpa o campo do nome do cliente
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

  const moverPedido = (index, direcao) => {
    const novosPedidos = [...filaPedidos];
    const pedido = novosPedidos[index];
    const novoIndex = index + direcao;

    if (novoIndex >= 0 && novoIndex < novosPedidos.length) {
      novosPedidos.splice(index, 1);
      novosPedidos.splice(novoIndex, 0, pedido);
      setFilaPedidos(novosPedidos);
    }
  };

  const togglePedidoOnHold = (pedido) => {
    if (filaPedidos.includes(pedido)) {
      setFilaPedidos(prev => prev.filter(p => p.id !== pedido.id));
      setPedidosOnHold(prev => [...prev, pedido]);
    } else {
      setPedidosOnHold(prev => prev.filter(p => p.id !== pedido.id));
      setFilaPedidos(prev => [...prev, pedido]);
    }
  };

  const moverParaEsquecidos = (pedido) => {
    setPedidosOnHold(prev => prev.filter(p => p.id !== pedido.id));
    setEsquecidos(prev => [...prev, pedido]);
  };

  const removerPedido = (id) => {
    setFilaPedidos(prev => prev.filter(pedido => pedido.id !== id));
    setPedidosOnHold(prev => prev.filter(pedido => pedido.id !== id));
    setEsquecidos(prev => prev.filter(pedido => pedido.id !== id));
  };

  const togglePrioridade = () => {
    setPedidoPrioritario(!pedidoPrioritario);
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

  return (
    <div className="relative p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Controle de Caixa</h1>

      <div className="flex justify-end mb-6 relative">
        <button
          onClick={() => setMostrarInputSenha(!mostrarInputSenha)}
          className="p-1 rounded hover:bg-gray-200 relative z-10"
        >
          <Settings size={20} />
        </button>

        <div className={`absolute top-0 right-0 transition-all duration-300 transform ${mostrarInputSenha ? 'opacity-100 translate-x-[-70px]' : 'opacity-0 translate-x-full'}`}>
          <form onSubmit={handleSenhaSubmit} className="flex items-center space-x-2">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="p-1 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              style={{ width: '150px' }}
            />
            <button type="submit" className="p-2 bg-blue-500 text-white rounded text-sm">
              Confirmar
            </button>
          </form>
        </div>
      </div>

      {mostrarResumo && senhaCorreta && (
        <ResumoEvento
          historicoVendas={historicoVendas}
          faturamentoTotal={faturamentoTotal}
          exportarCSV={exportarCSV}
          limparDadosPersistidos={limparDadosPersistidos}
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {produtos.map(produto => (
          <div
            key={produto.id}
            className={`${produto.cor} p-2 rounded-lg shadow hover:shadow-md transition-shadow text-left border border-gray-200 cursor-pointer`}
            onClick={() => adicionarAoCarrinho(produto, [])}
          >
            <h3 className="text-sm font-semibold flex items-center">
              {produto.nome === 'KFT' && <GiHamburger className="mr-2" />}
              {produto.nome === 'Falafel' && <FaHamburger className="mr-2" />}
              {produto.nome === 'Marys' && <PiHamburgerFill className="mr-2" style={{ fontSize: '1.05rem' }} />}
              {produto.nome === 'Fritas' && <CiFries className="mr-2" style={{ fontSize: '1.25rem' }} />}
              {produto.nome}
            </h3>
            <p className="text-gray-600 text-xs">R$ {produto.preco.toFixed(2)}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                abrirModal(produto);
              }}
              className="mt-2 p-1 bg-white text-black rounded"
            >
              <Edit3 size={16} />
            </button>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Opcionais para {produtoSelecionado?.nome}</h2>
            <div className="mb-4">
              {opcionais.map(opcional => (
                <div key={opcional.id} className="mb-2">
                  <label className="flex items-center">
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
              className="p-2 bg-green-500 text-white rounded"
            >
              Confirmar
            </button>
            <button
              onClick={() => setMostrarModal(false)}
              className="p-2 bg-red-500 text-white rounded ml-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold flex items-center mr-4">
              <ShoppingCart className="mr-2" size={20} />
              Carrinho
            </h2>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              className="ml-1 p-1.5 border border-gray-300 rounded-full text-sm w-36 text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do cliente"
              style={{ height: '28px' }}
            />
            <button
              onClick={togglePrioridade}
              className={`ml-2 p-1 rounded ${pedidoPrioritario ? 'text-red-500' : ''}`}
              title={pedidoPrioritario ? "Remover prioridade" : "Marcar como prioritário"}
            >
              <AlertTriangle size={20} />
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={apagarPedido}
              className="p-1 rounded hover:bg-gray-200"
              title="Apagar Pedido"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <ul>
          {Object.entries(carrinho).map(([chave, { nome, preco, qtd, opcionais }]) => (
            <li key={chave} className="flex justify-between items-center mb-2">
              <div className="flex-1">
                <span>{nome}</span>
              </div>
              <div className="flex-1 text-center flex items-center justify-center">
                <button
                  onClick={() => editarQuantidade(chave, -1)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Minus size={16} />
                </button>
                <span className="mx-2">x {qtd}</span>
                <button
                  onClick={() => editarQuantidade(chave, 1)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex-1 text-right">
                {opcionais.length > 0 && (
                  <span className="text-xs text-gray-600">
                    Opcionais: {opcionais.join(', ')}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => editarOpcionais(chave)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => removerItem(chave)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-right">
          <p className="font-medium">Total de itens: {Object.keys(carrinho).length}</p>
          <p className="text-lg font-bold">Total: R$ {calcularTotal(carrinho).toFixed(2)}</p>
          <div className="flex justify-end">
            <button
              onClick={enviarParaProducao}
              className="mt-4 p-2 bg-blue-500 text-white rounded flex items-center justify-center"
              disabled={Object.keys(carrinho).length === 0}
            >
              <span>Enviar Pedido</span>
              <Send size={20} className="ml-2" />
            </button>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">Expedição</h1>

      <div className="relative bg-gray-300 p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold mb-3">Painel de Produção</h2>
        </div>

        <button
          onClick={() => setMostrarConfig(!mostrarConfig)}
          className="absolute top-0 right-0 mt-2 mr-2 p-1 rounded hover:bg-gray-200 z-20"
        >
          <Settings size={20} />
        </button>

        {mostrarConfig && (
          <div className="absolute right-0 top-0 mt-10 mr-2 bg-white p-4 rounded-lg shadow-lg z-20">
            <h3 className="text-md font-semibold mb-3">Configurações de Expedição</h3>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="subidaAutomatica"
                    checked={configExpedicao.subidaAutomatica}
                    onChange={handleConfigChange}
                  />
                  <span>Subida automática após</span>
                </label>
                <input
                  type="number"
                  name="tempoSubida"
                  value={configExpedicao.tempoSubida}
                  onChange={handleConfigChange}
                  className="p-1 border border-gray-300 rounded text-sm"
                  style={{ width: '50px' }}
                  disabled={!configExpedicao.subidaAutomatica}
                />
                <span>minutos</span>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="bordaPiscante"
                    checked={configExpedicao.bordaPiscante}
                    onChange={handleConfigChange}
                  />
                  <span>Borda piscante após</span>
                </label>
                <input
                  type="number"
                  name="tempoBordaPiscante"
                  value={configExpedicao.tempoBordaPiscante}
                  onChange={handleConfigChange}
                  className="p-1 border border-gray-300 rounded text-sm"
                  style={{ width: '50px' }}
                  disabled={!configExpedicao.bordaPiscante}
                />
                <span>minutos</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center">
          {produtos.map(produto => (
            <div key={produto.id} className="flex items-center mr-4 mb-2">
              <span className="font-medium mr-2">{produto.nome}:</span>
              <span className="bg-white px-2 py-1 rounded">{contadorFila[produto.nome] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg shadow mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <ChefHat className="mr-2" size={20} />
          Fila de Pedidos
        </h2>
        {filaPedidos.length === 0 ? (
          <p>Nenhum pedido na fila.</p>
        ) : (
          <div className="flex space-x-4">
            {filaPedidos.map((pedido, index) => {
              const tempoNaFila = (new Date().getTime() - new Date(pedido.horario).getTime()) / 60000;
              const isBordaPiscante = configExpedicao.bordaPiscante && tempoNaFila > configExpedicao.tempoBordaPiscante;
              return (
                <div
                  key={pedido.id}
                  className={`flex-shrink-0 w-80 p-4 rounded-lg shadow ${pedido.prioritario ? 'bg-red-100' : 'bg-white'} ${isBordaPiscante ? 'animate-pulse border-4 border-red-500' : ''}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{pedido.cliente} #{pedido.id}</h3>
                    <div className="text-xs text-gray-500">{new Date(pedido.horario).toLocaleTimeString()}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => moverPedido(index, -1)}
                        className="p-1 rounded hover:bg-gray-200"
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moverPedido(index, 1)}
                        className="p-1 rounded hover:bg-gray-200"
                        disabled={index === filaPedidos.length - 1}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => togglePedidoOnHold(pedido)}
                        className="p-1 rounded hover:bg-gray-200"
                        title="Colocar em espera"
                      >
                        <Pause size={16} />
                      </button>
                      <button
                        onClick={() => removerPedido(pedido.id)}
                        className="p-1 rounded hover:bg-gray-200"
                        title="Pedido entregue"
                      >
                        <Check size={16} />
                      </button>
                      {pedido.subidaAutomatica && <Clock className="text-red-500" size={16} />}
                    </div>
                  </div>
                  <ul>
                    {Object.entries(pedido.itens).map(([id, { nome, qtd, opcionais }]) => (
                      <li key={id} className="flex justify-between items-center mb-2">
                        <div className="flex-1">
                          <span>{nome} x {qtd}</span>
                        </div>
                        {opcionais && opcionais.length > 0 && (
                          <div className="flex-1 text-right text-xs text-gray-600">
                            Opcionais: {opcionais.join(', ')}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded-lg shadow overflow-y-auto" style={{ maxHeight: '200px' }}>
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <Pause className="mr-2" size={20} />
            Pedidos em Espera
          </h2>
          {pedidosOnHold.length === 0 ? (
            <p>Nenhum pedido em espera.</p>
          ) : (
            <ul>
              {pedidosOnHold.map((pedido) => (
                <li key={pedido.id} className="mb-4 p-3 bg-blue-100 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{pedido.cliente} #{pedido.id}</h3>
                    <div className="text-xs text-gray-500">{new Date(pedido.horario).toLocaleTimeString()}</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => moverParaEsquecidos(pedido)}
                        className="p-1 rounded hover:bg-yellow-200"
                        title="Mover para Esquecidos"
                      >
                        <Zap size={16} />
                      </button>
                      <button
                        onClick={() => removerPedido(pedido.id)}
                        className="p-1 rounded hover:bg-gray-200"
                        title="Pedido entregue"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                  <ul>
                    {Object.entries(pedido.itens).map(([id, { nome, qtd, opcionais }]) => (
                      <li key={id} className="flex justify-between items-center mb-2">
                        <div className="flex-1">
                          <span>{nome} x {qtd}</span>
                        </div>
                        {opcionais && opcionais.length > 0 && (
                          <div className="flex-1 text-right text-xs text-gray-600">
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

        <div className="bg-gray-100 p-4 rounded-lg shadow overflow-y-auto" style={{ maxHeight: '200px' }}>
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <Zap className="mr-2" size={20} />
            Esqueceram de Mim
          </h2>
          {esquecidos.length === 0 ? (
            <p>Nenhum pedido esquecido.</p>
          ) : (
            <ul>
              {esquecidos.map((pedido) => (
                <li key={pedido.id} className="mb-4 p-3 bg-yellow-100 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{pedido.cliente} #{pedido.id}</h3>
                    <div className="text-xs text-gray-500">{new Date(pedido.horario).toLocaleTimeString()}</div>
                    <button
                      onClick={() => removerPedido(pedido.id)}
                      className="p-1 rounded hover:bg-gray-200"
                      title="Pedido entregue"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                  <ul>
                    {Object.entries(pedido.itens).map(([id, { nome, qtd, opcionais }]) => (
                      <li key={id} className="flex justify-between items-center mb-2">
                        <div className="flex-1">
                          <span>{nome} x {qtd}</span>
                        </div>
                        {opcionais && opcionais.length > 0 && (
                          <div className="flex-1 text-right text-xs text-gray-600">
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
    </div>
  );
};

export default ControleCaixaExpedicao;
