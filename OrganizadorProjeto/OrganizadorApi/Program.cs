using Microsoft.EntityFrameworkCore;
using OrganizadorApi.Data;
using OrganizadorApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Definir a política de CORS (Permitir o React)
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // Permite que a aplicação React (rodando em localhost:3000) acesse a API
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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// (Descomente se estiver usando HTTPS)
// app.UseHttpsRedirection();

// 4. USAR O CORS
app.UseCors(MyAllowSpecificOrigins);

app.UseAuthorization();

app.MapControllers();

// --- Início: Endpoints da API (CRUD básico) ---

// GET (Listar Tarefas)
app.MapGet("/api/tarefas", async (AppDbContext context) =>
{
    var tarefas = await context.Tarefas.ToListAsync();
    return Results.Ok(tarefas);
});

// POST (Inserir Tarefa)
app.MapPost("/api/tarefas", async (AppDbContext context, Tarefa tarefa) =>
{
    // Ignora o ID enviado pelo front-end
    var novaTarefa = new Tarefa
    {
        Descricao = tarefa.Descricao,
        Concluida = false, // Sempre começa como não concluída
        CategoriaId = tarefa.CategoriaId > 0 ? tarefa.CategoriaId : null // Exemplo básico
    };

    context.Tarefas.Add(novaTarefa);
    await context.SaveChangesAsync();
    return Results.Created($"/api/tarefas/{novaTarefa.Id}", novaTarefa);
});

// PUT (Alterar Tarefa - Apenas marcar como concluída/não concluída)
app.MapPut("/api/tarefas/{id}/concluir", async (AppDbContext context, int id) =>
{
    var tarefa = await context.Tarefas.FindAsync(id);
    if (tarefa == null) return Results.NotFound();

    tarefa.Concluida = !tarefa.Concluida; // Inverte o status
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