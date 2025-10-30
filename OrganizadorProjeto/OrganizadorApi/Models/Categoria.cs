using System.Collections.Generic;

namespace OrganizadorApi.Models
{
    public class Categoria
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty; 
        public ICollection<Tarefa> Tarefas { get; set; } = new List<Tarefa>(); 
    }
}