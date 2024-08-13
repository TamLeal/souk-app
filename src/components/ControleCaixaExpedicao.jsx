import React, { useState } from 'react';
import { ShoppingCart, Edit, Trash2, Send, Plus, Minus, ChefHat, ArrowUp, ArrowDown, Pause, Play, Check, AlertTriangle, Zap } from 'lucide-react';

const opcionais = [
  { id: 1, nome: 'Sem alface' },
  { id: 2, nome: 'Sem maionese' },
  { id: 3, nome: 'Rúcula extra' },
  { id: 4, nome: 'Duplo burger' },
];

const produtos = [
  { id: 1, nome: 'KFT', preco: 15 },
  { id: 2, nome: 'Falafel', preco: 12 },
  { id: 3, nome: 'Marys', preco: 18 },
  { id: 4, nome: 'Fritas', preco: 8 },
];

const ControleCaixaExpedicao = () => {
  const [carrinho, setCarrinho] = useState({});
  const [opcionaisSelecionados, setOpcionaisSelecionados] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [filaPedidos, setFilaPedidos] = useState([]);
  const [pedidosOnHold, setPedidosOnHold] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState({});
  const [numeroPedido, setNumeroPedido] = useState(1);
  const [pedidoPrioritario, setPedidoPrioritario] = useState(false);

  const adicionarAoCarrinho = (produto, opcionais) => {
    if (!produto) {
      console.error('Produto não encontrado ou inválido.');
      return;
    }

    const chaveProduto = `${produto.id}-${opcionais.join('-')}`;

    setCarrinho(prev => {
      const itemExistente = prev[chaveProduto];

      const atualizado = {
        ...prev,
        [chaveProduto]: {
          ...produto,
          qtd: (itemExistente?.qtd || 0) + 1,
          opcionais: [...(itemExistente?.opcionais || []), ...opcionais]
        }
      };

      return atualizado;
    });

    setMostrarModal(false);
  };

  const abrirModal = (produto) => {
    setProdutoSelecionado(produto);
    setOpcionaisSelecionados([]); // Resetar opcionais selecionados ao abrir o modal
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

  const apagarPedido = () => {
    setCarrinho({});
    setPedidoPrioritario(false);
  };

  const enviarParaProducao = () => {
    const horarioAtual = new Date().toLocaleTimeString();
    const novoPedido = {
      id: numeroPedido,
      itens: carrinho,
      total: calcularTotal(carrinho),
      prioritario: pedidoPrioritario,
      horario: horarioAtual // Adiciona o horário ao pedido
    };
  
    setFilaPedidos(prev => [...prev, novoPedido]);
    setNumeroPedido(prev => prev + 1);
    
    setHistoricoVendas(prev => {
      const novoHistorico = { ...prev };
      Object.entries(carrinho).forEach(([id, { qtd, nome }]) => {
        const produtoId = parseInt(id.split('-')[0]);
        novoHistorico[produtoId] = (novoHistorico[produtoId] || 0) + qtd;
      });
      return novoHistorico;
    });
  
    setCarrinho({});
    setPedidoPrioritario(false);
  };
  
  const calcularTotal = (itens) => {
    return Object.entries(itens).reduce((total, [id, { qtd }]) => {
      const produtoId = parseInt(id.split('-')[0]);
      const produto = produtos.find(p => p.id === produtoId);
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
      const produtoId = parseInt(id);
      const produto = produtos.find(p => p.id === produtoId);
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

  const removerPedido = (id) => {
    setFilaPedidos(prev => prev.filter(pedido => pedido.id !== id));
    setPedidosOnHold(prev => prev.filter(pedido => pedido.id !== id)); // Remover do On Hold se necessário
  };

  const togglePrioridade = () => {
    setPedidoPrioritario(!pedidoPrioritario);
  };

  const totalItens = Object.values(carrinho).reduce((acc, { qtd }) => acc + qtd, 0);
  const totalValor = calcularTotal(carrinho);
  const faturamentoTotal = calcularFaturamentoTotal();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Controle de Caixa</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Resumo do Evento</h2>
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
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {produtos.map(produto => (
          <div
            key={produto.id}
            className="bg-white p-2 rounded-lg shadow hover:shadow-md transition-shadow text-left border border-gray-200"
          >
            <h3 className="text-sm font-semibold">{produto.nome}</h3>
            <p className="text-gray-600 text-xs">R$ {produto.preco.toFixed(2)}</p>
            <button
              onClick={() => abrirModal(produto)}
              className="mt-2 p-1 bg-blue-500 text-white rounded"
            >
              <ShoppingCart size={16} />
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
          <h2 className="text-lg font-semibold flex items-center">
            <ShoppingCart className="mr-2" size={20} />
            Carrinho
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={togglePrioridade}
              className={`p-1 rounded hover:bg-gray-200 ${pedidoPrioritario ? 'text-red-500' : ''}`}
              title={pedidoPrioritario ? "Remover prioridade" : "Marcar como prioritário"}
            >
              <AlertTriangle size={20} />
            </button>
            <button
              onClick={() => setEditando(!editando)}
              className="p-1 rounded hover:bg-gray-200"
              title={editando ? "Concluir Edição" : "Editar Pedido"}
            >
              <Edit size={20} />
            </button>
            <button
              onClick={apagarPedido}
              className="p-1 rounded hover:bg-gray-200"
              title="Apagar Pedido"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={enviarParaProducao}
              className="p-1 rounded hover:bg-gray-200"
              disabled={totalItens === 0}
              title="Enviar para Produção"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <ul>
        {Object.entries(carrinho).map(([chave, { nome, preco, qtd, opcionais }]) => {
          return (
            <li key={chave} className="flex justify-between items-center mb-2">
              <div className="flex-1">
                <span>{nome}</span>
              </div>
              <div className="flex items-center flex-1 justify-center">
                {editando && (
                  <button 
                    onClick={() => editarQuantidade(chave, -1)}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <Minus size={16} />
                  </button>
                )}
                <span className="mx-2">x {qtd}</span>
                {editando && (
                  <button 
                    onClick={() => editarQuantidade(chave, 1)}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
              <div className="flex-1 text-right text-xs text-gray-600">
                {opcionais && opcionais.length > 0 ? (
                  <span>Opcionais: {opcionais.join(', ')} <Zap className="animate-pulse inline-block text-red-500 border border-red-500 rounded-full" size={12} /></span>
                ) : (
                  <span>&nbsp;</span> // Espaço vazio para manter o alinhamento
                )}
              </div>
            </li>
          );
        })}
        </ul>
        <div className="mt-4 text-right">
          <p className="font-medium">Total de itens: {totalItens}</p>
          <p className="text-lg font-bold">Total: R$ {totalValor.toFixed(2)}</p>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">Expedição</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <ChefHat className="mr-2" size={20} />
            Fila de Pedidos
          </h2>
          {filaPedidos.length === 0 ? (
            <p>Nenhum pedido na fila.</p>
          ) : (
            <ul>
              {filaPedidos.map((pedido, index) => (
                <li
                  key={pedido.id}
                  className={`mb-4 p-3 rounded-lg shadow ${pedido.prioritario ? 'bg-red-100' : 'bg-white'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Pedido #{pedido.id}</h3>
                    <div className="text-xs text-gray-500">{pedido.horario}</div> {/* Exibe o horário */}
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
                            Opcionais: {opcionais.join(', ')} <Zap className="animate-pulse inline-block text-red-500 border border-red-500 rounded-full" size={12} />
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

        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <Pause className="mr-2" size={20} />
            Pedidos em Espera (On Hold)
          </h2>
          {pedidosOnHold.length === 0 ? (
            <p>Nenhum pedido em espera.</p>
          ) : (
            <ul>
              {pedidosOnHold.map((pedido) => (
                <li key={pedido.id} className="mb-4 p-3 bg-blue-100 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Pedido #{pedido.id}</h3>
                    <div className="text-xs text-gray-500">{pedido.horario}</div> {/* Exibe o horário */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePedidoOnHold(pedido)}
                        className="p-1 rounded hover:bg-blue-200"
                        title="Retomar pedido"
                      >
                        <Play size={16} />
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
                            Opcionais: {opcionais.join(', ')} <Zap className="animate-pulse inline-block text-red-500 border border-red-500 rounded-full" size={12} />
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
