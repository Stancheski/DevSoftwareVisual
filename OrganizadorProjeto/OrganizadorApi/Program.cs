using System.Text.Json.Serialization; // <-- 1. ADICIONAR ESTA LINHA
using Microsoft.EntityFrameworkCore;
using OrganizadorApi.Data;
using OrganizadorApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Definir a política de CORS
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

// 2. Configurar o DbContext com MySQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// 3. Adicionar serviços padrão
// -------------------------------------------------------------------------
// v v v 2. ALTERAR A LINHA ABAIXO v v v
// builder.Services.AddControllers(); // Linha antiga
builder.Services.AddControllers().AddJsonOptions(x => 
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles); // <-- Linha Nova (Corrige o loop)
// ^ ^ ^ 2. ALTERAR A LINHA ACIMA ^ ^ ^
// -------------------------------------------------------------------------

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(MyAllowSpecificOrigins);
app.UseAuthorization();
app.MapControllers();

// --- Início: Endpoints da API ---

// GET (Listar Tarefas)
// GET (Listar Tarefas) - CORREÇÃO DEFINITIVA (Quebra o ciclo)
app.MapGet("/api/tarefas", async (AppDbContext context) =>
{
    var tarefas = await context.Tarefas
                               .Include(t => t.Categoria) // 1. Inclui a categoria
                               .Select(t => new // 2. Projeta para um novo objeto
                               {
                                   t.Id,
                                   t.Descricao,
                                   t.Concluida,
                                   t.CategoriaId,
                                   // 3. Só pegamos o que precisamos da Categoria
                                   Categoria = t.Categoria == null ? null : new 
                                   {
                                       t.Categoria.Id,
                                       t.Categoria.Nome 
                                       // Intencionalmente NÃO incluímos t.Categoria.Tarefas
                                   }
                               })
                               .ToListAsync();

    return Results.Ok(tarefas);
});

// GET (Listar Categorias)
app.MapGet("/api/categorias", async (AppDbContext context) =>
{
    var categorias = await context.Categorias.ToListAsync();
    return Results.Ok(categorias);
});

// POST (Inserir Categoria)
app.MapPost("/api/categorias", async (AppDbContext context, Categoria categoria) =>
{
    var novaCategoria = new Categoria { Nome = categoria.Nome };
    context.Categorias.Add(novaCategoria);
    await context.SaveChangesAsync();
    return Results.Created($"/api/categorias/{novaCategoria.Id}", novaCategoria);
});

// DELETE (Remover Categoria)
app.MapDelete("/api/categorias/{id}", async (AppDbContext context, int id) =>
{
    var categoria = await context.Categorias.FindAsync(id);
    if (categoria == null) return Results.NotFound();

    var tarefaUsandoCategoria = await context.Tarefas.AnyAsync(t => t.CategoriaId == id);
    if (tarefaUsandoCategoria)
    {
        return Results.Conflict("Não é possível remover a categoria, pois ela está em uso.");
    }

    context.Categorias.Remove(categoria);
    await context.SaveChangesAsync();
    return Results.NoContent();
});


// POST (Inserir Tarefa)
app.MapPost("/api/tarefas", async (AppDbContext context, Tarefa tarefa) =>
{
    var novaTarefa = new Tarefa
    {
        Descricao = tarefa.Descricao,
        Concluida = false,
        CategoriaId = tarefa.CategoriaId == 0 ? null : tarefa.CategoriaId
    };
    
    context.Tarefas.Add(novaTarefa);
    await context.SaveChangesAsync();
    return Results.Created($"/api/tarefas/{novaTarefa.Id}", novaTarefa);
});

// PUT (Alterar Tarefa - Concluir/Desconcluir)
app.MapPut("/api/tarefas/{id}/concluir", async (AppDbContext context, int id) =>
{
    var tarefa = await context.Tarefas.FindAsync(id);
    if (tarefa == null) return Results.NotFound();

    tarefa.Concluida = !tarefa.Concluida;
    await context.SaveChangesAsync();
    return Results.Ok(tarefa);
});

// DELETE (Remover Tarefa)
app.MapDelete("/api/tarefas/{id}", async (AppDbContext context, int id) =>
{
    var tarefa = await context.Tarefas.FindAsync(id);
    if (tarefa == null) return Results.NotFound();

    context.Tarefas.Remove(tarefa);
    await context.SaveChangesAsync();
    return Results.NoContent();
});

// --- Fim: Endpoints da API ---

app.Run();