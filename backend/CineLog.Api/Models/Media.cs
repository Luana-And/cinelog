namespace CineLog.Api.Models;

public class Media
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "filme" | "série"
    public int Rating { get; set; } = 0;             // 0–5
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public record CreateMediaDto(string Title, string Type);
public record UpdateMediaDto(int Rating, string Notes);
