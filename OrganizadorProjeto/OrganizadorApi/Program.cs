using Microsoft.EntityFrameworkCore;
using OrganizadorApi.Data;
using OrganizadorApi.Models;

var builder = WebApplication.CreateBuilder(args);

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

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

builder.Services.AddControllers();
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

app.MapGet("/api/tarefas", async (AppDbContext context) =>
{
    var tarefas = await context.Tarefas
                               .Include(t => t.Categoria) 
                               .OrderByDescending(t => t.Prioridade) // Ordena por Prioridade (Alta primeiro)
                               .Select(t => new // Projeta para um novo objeto (evita ciclo)
                               {
                                   t.Id,
                                   t.Descricao,
                                   t.Concluida,
                                   t.CategoriaId,
                                   Categoria = t.Categoria == null ? null : new 
                                   {
                                       t.Categoria.Id,
                                       t.Categoria.Nome 
                                   }
                               })
                               .ToListAsync();
    
    return Results.Ok(tarefas);
});

app.MapPost("/api/tarefas", async (AppDbContext context, Tarefa tarefa) =>
{
    var novaTarefa = new Tarefa
    {
        Descricao = tarefa.Descricao,
        Concluida = false,
        CategoriaId = tarefa.CategoriaId == 0 ? null : tarefa.CategoriaId,
    };
    
    context.Tarefas.Add(novaTarefa);
    await context.SaveChangesAsync();
    return Results.Created($"/api/tarefas/{novaTarefa.Id}", novaTarefa);
});

app.MapPut("/api/tarefas/{id}/concluir", async (AppDbContext context, int id) =>
{
    var tarefa = await context.Tarefas.FindAsync(id);
    if (tarefa == null) return Results.NotFound();

    tarefa.Concluida = !tarefa.Concluida; 
    await context.SaveChangesAsync();
    return Results.Ok(tarefa);
});

app.MapDelete("/api/tarefas/{id}", async (AppDbContext context, int id) =>
{
    var tarefa = await context.Tarefas.FindAsync(id);
    if (tarefa == null) return Results.NotFound();

    context.Tarefas.Remove(tarefa);
    await context.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/api/categorias", async (AppDbContext context) =>
{
    var categorias = await context.Categorias.ToListAsync();
    return Results.Ok(categorias);
});

app.MapPost("/api/categorias", async (AppDbContext context, Categoria categoria) =>
{
    var novaCategoria = new Categoria { Nome = categoria.Nome };
    context.Categorias.Add(novaCategoria);
    await context.SaveChangesAsync();
    return Results.Created($"/api/categorias/{novaCategoria.Id}", novaCategoria);
});

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


app.Run();