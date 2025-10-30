import React, { useState, useEffect, useCallback } from 'react'; // Importar useCallback
import axios from 'axios';
import './App.css'; 

const API_BASE_URL = 'http://localhost:5062/api'; // Verifique a porta

function App() {
  // Estados
  const [tarefas, setTarefas] = useState([]);
  const [categorias, setCategorias] = useState([]); 
  const [novaTarefaDescricao, setNovaTarefaDescricao] = useState('');
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState(''); 
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

  // --- Funções com useCallback (para corrigir o aviso do useEffect) ---

  const listarTarefas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tarefas`);
      setTarefas(response.data); 
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  }, []); // Dependência vazia, a função não muda

  const listarCategorias = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categorias`);
      setCategorias(response.data);
      // Define a primeira categoria como padrão, se nenhuma estiver selecionada
      if (response.data.length > 0 && categoriaSelecionadaId === '') {
        setCategoriaSelecionadaId(response.data[0].id);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  }, [categoriaSelecionadaId]); // Depende de 'categoriaSelecionadaId'

  // useEffect corrigido
  useEffect(() => {
    listarTarefas();
    listarCategorias();
  }, [listarTarefas, listarCategorias]); // Chama as funções 'memoriazadas'

  
  // --- Funções de Manipulação (Handlers) ---

  const adicionarTarefa = async (e) => {
    e.preventDefault(); 
    if (!novaTarefaDescricao || !categoriaSelecionadaId) {
        alert("Por favor, preencha a descrição e selecione uma categoria.");
        return;
    }
    try {
      const novaTarefa = { 
        descricao: novaTarefaDescricao, 
        categoriaId: parseInt(categoriaSelecionadaId) 
      };
      await axios.post(`${API_BASE_URL}/tarefas`, novaTarefa);
      setNovaTarefaDescricao(''); 
      listarTarefas();
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
    }
  };

  const marcarComoConcluida = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/tarefas/${id}/concluir`);
      listarTarefas(); 
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error);
    }
  };

  const removerTarefa = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/tarefas/${id}`);
      listarTarefas(); 
    } catch (error) {
      console.error("Erro ao remover tarefa:", error);
    }
  };

  const adicionarCategoria = async (e) => {
    e.preventDefault();
    if (!novaCategoriaNome) return;
    try {
      await axios.post(`${API_BASE_URL}/categorias`, { nome: novaCategoriaNome });
      setNovaCategoriaNome('');
      listarCategorias();
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
    }
  };

  const removerCategoria = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover esta categoria?")) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/categorias/${id}`);
      listarCategorias();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Não é possível remover: a categoria está sendo usada por uma tarefa.");
      } else {
        console.error("Erro ao remover categoria:", error);
      }
    }
  };

  // --- Renderização ---
  return (
    <div className="App">
      <h1>Organizador de Tarefas</h1>

      {/* Adicionar Tarefa */}
      <form onSubmit={adicionarTarefa} className="form-tarefa">
        <input
          type="text"
          value={novaTarefaDescricao}
          onChange={(e) => setNovaTarefaDescricao(e.target.value)}
          placeholder="Digite uma nova tarefa"
        />
        <select 
          value={categoriaSelecionadaId} 
          onChange={(e) => setCategoriaSelecionadaId(e.target.value)}
        >
          <option value="" disabled>Selecione...</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
        <button type="submit">Adicionar</button>
      </form>

      {/* Gerenciar Categorias */}
      <h2 className="subtitulo">Gerenciar Categorias</h2>
      <form onSubmit={adicionarCategoria} className="form-categoria">
        <input
          type="text"
          value={novaCategoriaNome}
          onChange={(e) => setNovaCategoriaNome(e.target.value)}
          placeholder="Nova categoria"
        />
        <button type="submit">Adicionar Categoria</button>
      </form>

      <ul className="categoria-lista">
        {categorias.map((cat) => (
          <li key={cat.id} className="categoria-item">
            <span>{cat.nome}</span>
            <div>
              <button className="btn-editar" disabled>Editar</button>
              <button className="btn-remover" onClick={() => removerCategoria(cat.id)}>Remover</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Minhas Tarefas */}
      <h2 className="subtitulo">Minhas Tarefas</h2>
      <ul className="tarefa-lista">
        {tarefas.map((tarefa) => (
          <li key={tarefa.id} className={tarefa.concluida ? 'concluida' : ''}>
            <span>
              {tarefa.descricao}
              {/* Agora isto vai funcionar graças à correção no backend */}
              <small className="categoria-nome">
                {tarefa.categoria?.nome || 'Sem Categoria'}
              </small>
            </span>
            
            <div> 
              <button 
                onClick={() => marcarComoConcluida(tarefa.id)}
                className="btn-concluir"
              >
                {tarefa.concluida ? 'Desmarcar' : 'Concluir'}
              </button>
              <button 
                onClick={() => removerTarefa(tarefa.id)}
                className="btn-remover"
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;