import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Comentado

// URL base da API C# (Usando a porta correta)
const API_URL = 'http://localhost:5062/api/tarefas'; 

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [novaTarefaDescricao, setNovaTarefaDescricao] = useState('');

  // 1. useEffect: Carrega as tarefas quando o componente monta
  useEffect(() => {
    listarTarefas();
  }, []);

  // 2. GET (Listar)
  const listarTarefas = async () => {
    try {
      const response = await axios.get(API_URL);
      setTarefas(response.data);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  // 3. POST (Inserir)
  const adicionarTarefa = async (e) => {
    e.preventDefault(); 
    if (!novaTarefaDescricao) return; 

    try {
      const novaTarefa = { 
        descricao: novaTarefaDescricao, 
        categoriaId: 2 // Exemplo: Pessoal
      };
      
      await axios.post(API_URL, novaTarefa);
      
      setNovaTarefaDescricao(''); 
      listarTarefas(); 
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
    }
  };

  // 4. PUT (Alterar - Concluir/Desconcluir)
  const marcarComoConcluida = async (id) => {
    try {
      await axios.put(`${API_URL}/${id}/concluir`);
      listarTarefas(); 
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error);
    }
  };

  // 5. DELETE (Remover)
  const removerTarefa = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      listarTarefas(); 
    } catch (error) {
      console.error("Erro ao remover tarefa:", error);
    }
  };

  return (
    <div className="App">
      <h1>Organizador de Tarefas Básico</h1>

      {/* Formulário de Inserção */}
      <form onSubmit={adicionarTarefa}>
        <input
          type="text"
          value={novaTarefaDescricao}
          onChange={(e) => setNovaTarefaDescricao(e.target.value)}
          placeholder="Digite uma nova tarefa"
        />
        <button type="submit">Adicionar</button>
      </form>

      {/* Listagem */}
      <ul>
        {tarefas.map((tarefa) => (
          <li key={tarefa.id} style={{ textDecoration: tarefa.concluida ? 'line-through' : 'none' }}>
            {tarefa.descricao}
            
            {/* Botões de Ação */}
            <button onClick={() => marcarComoConcluida(tarefa.id)}>
              {tarefa.concluida ? 'Desmarcar' : 'Concluir'}
            </button>
            <button onClick={() => removerTarefa(tarefa.id)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// !! LINHA MAIS IMPORTANTE PARA CORRIGIR O ERRO !!
export default App;