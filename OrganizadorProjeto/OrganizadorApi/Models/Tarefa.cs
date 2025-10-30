namespace OrganizadorApi.Models
{
    public class Tarefa
    {
        public int Id { get; set; }
        public string Descricao { get; set; } = string.Empty;
        public bool Concluida { get; set; }
        public int? CategoriaId { get; set; }
        public Categoria? Categoria { get; set; } 
        public int Prioridade { get; set; } 
    }
}