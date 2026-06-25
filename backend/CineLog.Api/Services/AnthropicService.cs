using System.Text;
using System.Text.Json;

namespace CineLog.Api.Services;

public class AnthropicService(IHttpClientFactory factory, IConfiguration config)
{
    private static readonly string[] RatingLabels = ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"];

    public async Task<string> AnalyzeAsync(string title, string type, int rating, string notes)
    {
        var apiKey = config["ANTHROPIC_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "COLOQUE_SUA_API_KEY_AQUI")
            throw new InvalidOperationException("ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente ANTHROPIC_API_KEY no Render/Railway.");

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("x-api-key", apiKey);
        client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var ratingCtx = rating > 0
            ? $"Avaliação do usuário: {rating}/5 ({RatingLabels[rating]})"
            : "Ainda sem avaliação.";
        var notesCtx = string.IsNullOrWhiteSpace(notes) ? "" : $"Impressões: \"{notes}\"";

        var body = new
        {
            model = "claude-sonnet-4-20250514",
            max_tokens = 1000,
            system = """
                Você é um crítico de cinema e TV bem-humorado e culto. Escreva em português brasileiro.
                Dê: 1) breve contexto (2-3 frases) 2) pontos fortes em bullets 3) comentário sobre a avaliação do usuário se houver 4) sugestão de algo parecido.
                Seja conciso e com personalidade. Máximo 200 palavras.
                """,
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = $"{(type == "filme" ? "Filme" : "Série")}: \"{title}\"\n{ratingCtx}\n{notesCtx}\n\nMe dê uma análise rápida."
                }
            }
        };

        var json = JsonSerializer.Serialize(body);
        var response = await client.PostAsync(
            "https://api.anthropic.com/v1/messages",
            new StringContent(json, Encoding.UTF8, "application/json")
        );

        var raw = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Erro da API Anthropic ({(int)response.StatusCode}): {raw}");

        using var doc = JsonDocument.Parse(raw);
        return doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "Sem resposta.";
    }
}
