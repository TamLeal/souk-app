import React, { useState } from 'react';
import {
  ShoppingCart,
  Edit,
  Trash2,
  Send,
  Plus,
  Minus,
  ChefHat,
  ArrowUp,
  ArrowDown,
  Pause,
  Play,
  AlertTriangle,
} from 'lucide-react';

const produtos = [
  { id: 1, nome: 'KFT', preco: 15 },
  { id: 2, nome: 'Falafel', preco: 12 },
  { id: 3, nome: 'Marys', preco: 18 },
  { id: 4, nome: 'Fritas', preco: 8 },
];

const ControleCaixaExpedicao = () => {
  const [carrinho, setCarrinho] = useState({});
  const [editando, setEditando] = useState(false);
  const [filaPedidos, setFilaPedidos] = useState([]);
  const [pedidosOnHold, setPedidosOnHold] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState({});
  const [numeroPedido, setNumeroPedido] = useState(1);
  const [pedidoPrioritario, setPedidoPrioritario] = useState(false);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prev) => ({
      ...prev,
      [produto.id]: (prev[produto.id] || 0) + 1,
    }));
  };

  const editarQuantidade = (id, delta) => {
    setCarrinho((prev) => {
      const novaQuantidade = Math.max(0, (prev[id] || 0) + delta);
      if (novaQuantidade === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: novaQuantidade };
    });
  };

  const apagarPedido = () => {
    setCarrinho({});
    setPedidoPrioritario(false);
  };

  const enviarParaProducao = () => {
    const novoPedido = {
      id: numeroPedido,
      itens: carrinho,
      total: calcularTotal(carrinho),
      prioritario: pedidoPrioritario,
    };
    setFilaPedidos((prev) => [...prev, novoPedido]);
    setNumeroPedido((prev) => prev + 1);

    setHistoricoVendas((prev) => {
      const novoHistorico = { ...prev };
      Object.entries(carrinho).forEach(([id, qtd]) => {
        novoHistorico[id] = (novoHistorico[id] || 0) + qtd;
      });
      return novoHistorico;
    });

    setCarrinho({});
    setPedidoPrioritario(false);
  };

  const calcularTotal = (itens) => {
    return Object.entries(itens).reduce((total, [id, qtd]) => {
      const produto = produtos.find((p) => p.id === parseInt(id));
      return total + produto.preco * qtd;
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
      setFilaPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
      setPedidosOnHold((prev) => [...prev, pedido]);
    } else {
      setPedidosOnHold((prev) => prev.filter((p) => p.id !== pedido.id));
      setFilaPedidos((prev) => [...prev, pedido]);
    }
  };

  const togglePrioridade = () => {
    setPedidoPrioritario(!pedidoPrioritario);
  };

  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);
  const totalValor = calcularTotal(carrinho);
  const faturamentoTotal = calcularTotal(historicoVendas);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Controle de Caixa</h1>

      <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Resumo do Evento</h2>
        <div className="flex flex-wrap justify-between items-center">
          {produtos.map((produto) => (
            <div key={produto.id} className="flex items-center mr-4 mb-2">
              <span className="font-medium mr-2">{produto.nome}:</span>
              <span className="bg-white px-2 py-1 rounded">
                {historicoVendas[produto.id] || 0}
              </span>
            </div>
          ))}
          <div className="flex items-center">
            <span className="font-medium mr-2">Faturamento:</span>
            <span className="bg-white px-2 py-1 rounded font-bold">
              R$ {faturamentoTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {produtos.map((produto) => (
          <button
            key={produto.id}
            onClick={() => adicionarAoCarrinho(produto)}
            className="bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow text-left border border-gray-200"
          >
            <h3 className="text-md font-semibold">{produto.nome}</h3>
            <p className="text-gray-600 text-sm">
              R$ {produto.preco.toFixed(2)}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold flex items-center">
            <ShoppingCart className="mr-2" size={20} />
            Carrinho
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={togglePrioridade}
              className={`p-1 rounded hover:bg-gray-200 ${
                pedidoPrioritario ? 'text-red-500' : ''
              }`}
              title={
                pedidoPrioritario
                  ? 'Remover prioridade'
                  : 'Marcar como prioritário'
              }
            >
              <AlertTriangle size={20} />
            </button>
            <button
              onClick={() => setEditando(!editando)}
              className="p-1 rounded hover:bg-gray-200"
              title={editando ? 'Concluir Edição' : 'Editar Pedido'}
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
          {Object.entries(carrinho).map(([id, qtd]) => {
            const produto = produtos.find((p) => p.id === parseInt(id));
            return (
              <li key={id} className="flex justify-between items-center mb-2">
                <span>{produto.nome}</span>
                <div className="flex items-center">
                  {editando && (
                    <button
                      onClick={() => editarQuantidade(id, -1)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                  <span className="mx-2">x {qtd}</span>
                  {editando && (
                    <button
                      onClick={() => editarQuantidade(id, 1)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                  <span className="ml-4">
                    R$ {(produto.preco * qtd).toFixed(2)}
                  </span>
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
                  className={`mb-4 p-3 rounded-lg shadow ${
                    pedido.prioritario ? 'bg-red-100' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Pedido #{pedido.id}</h3>
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
                    </div>
                  </div>
                  <ul>
                    {Object.entries(pedido.itens).map(([id, qtd]) => {
                      const produto = produtos.find(
                        (p) => p.id === parseInt(id)
                      );
                      return (
                        <li key={id} className="flex justify-between">
                          <span>
                            {produto.nome} x {qtd}
                          </span>
                          <span>R$ {(produto.preco * qtd).toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-right mt-2 font-bold">
                    Total: R$ {pedido.total.toFixed(2)}
                  </p>
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
                <li
                  key={pedido.id}
                  className="mb-4 p-3 bg-blue-100 rounded-lg shadow"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Pedido #{pedido.id}</h3>
                    <button
                      onClick={() => togglePedidoOnHold(pedido)}
                      className="p-1 rounded hover:bg-blue-200"
                      title="Finalizar pedido"
                    >
                      <Play size={16} />
                    </button>
                  </div>
                  <ul>
                    {Object.entries(pedido.itens).map(([id, qtd]) => {
                      const produto = produtos.find(
                        (p) => p.id === parseInt(id)
                      );
                      return (
                        <li key={id} className="flex justify-between">
                          <span>
                            {produto.nome} x {qtd}
                          </span>
                          <span>R$ {(produto.preco * qtd).toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-right mt-2 font-bold">
                    Total: R$ {pedido.total.toFixed(2)}
                  </p>
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
