import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css'; 

const API_BASE_URL = 'http://localhost:5062/api'; 

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [novaTarefaDescricao, setNovaTarefaDescricao] = useState('');
  
  const [categorias, setCategorias] = useState([]); 
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState(''); 
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

  // --- Funções com useCallback ---

  const listarTarefas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tarefas`);
      setTarefas(response.data); 
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  }, []);

  const listarCategorias = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categorias`);
      setCategorias(response.data);
      if (response.data.length > 0 && !categoriaSelecionadaId) {
        setCategoriaSelecionadaId(response.data[0].id);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  }, [categoriaSelecionadaId]); // Dependência intencional


  useEffect(() => {
    listarTarefas();
    listarCategorias();
  }, [listarTarefas, listarCategorias]);


  // --- Funções de Ação ---

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
      listarTarefas(); 
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Não é possível remover: a categoria está sendo usada por uma tarefa.");
      } else {
        console.error("Erro ao remover categoria:", error);
      }
    }
  };

  // --- Lógica de Agrupamento (para a coluna da direita) ---
  const tarefasSemCategoria = tarefas.filter(t => !t.categoriaId);

  // --- Renderização (HTML com as novas classes de coluna) ---

  return (
    <div className="App">
      <div className="coluna-esquerda">
        <h1>Organizador</h1>

        {/* Formulário Adicionar Tarefa */}
        <h2 className="subtitulo">Adicionar Tarefa</h2>
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
            <option value="">Selecione...</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
          <button type="submit">Adicionar</button>
        </form>

        {/* --- Gerenciar Categorias --- */}
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
      </div>

      {/* --- COLUNA DA DIREITA (TAREFAS AGRUPADAS) --- */}
      <div className="coluna-direita">
        <h2 className="subtitulo-direita">Minhas Tarefas</h2>

        {/* Itera primeiro nas CATEGORIAS */}
        {categorias.map(categoria => {
          // Filtra as tarefas para esta categoria
          const tarefasDaCategoria = tarefas.filter(t => t.categoriaId === categoria.id);
          
          // Só mostra o grupo se houver tarefas
          if (tarefasDaCategoria.length === 0) return null;

          return (
            <div key={categoria.id} className="grupo-tarefas">
              <h3>{categoria.nome}</h3>
              <ul className="tarefa-lista">
                {tarefasDaCategoria.map((tarefa) => (
                  <li key={tarefa.id} className={tarefa.concluida ? 'concluida' : ''}>
                    <span>{tarefa.descricao}</span>
                    <div> 
                      <button onClick={() => marcarComoConcluida(tarefa.id)} className="btn-concluir">
                        {tarefa.concluida ? 'Desmarcar' : 'Concluir'}
                      </button>
                      <button onClick={() => removerTarefa(tarefa.id)} className="btn-remover">
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Grupo "Sem Categoria" */}
        {tarefasSemCategoria.length > 0 && (
          <div className="grupo-tarefas">
            <h3>Sem Categoria</h3>
            <ul className="tarefa-lista">
              {tarefasSemCategoria.map((tarefa) => (
                <li key={tarefa.id} className={tarefa.concluida ? 'concluida' : ''}>
                  <span>{tarefa.descricao}</span>
                  <div> 
                    <button onClick={() => marcarComoConcluida(tarefa.id)} className="btn-concluir">
                      {tarefa.concluida ? 'Desmarcar' : 'Concluir'}
                    </button>
                    <button onClick={() => removerTarefa(tarefa.id)} className="btn-remover">
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;