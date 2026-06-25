using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineLog.Api.Data;
using CineLog.Api.Models;
using CineLog.Api.Services;

namespace CineLog.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController(AppDbContext db, AnthropicService ai) : ControllerBase
{
    // GET /api/media
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? type, [FromQuery] string? q)
    {
        var query = db.Medias.AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(m => m.Type == type);

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(m => m.Title.ToLower().Contains(q.ToLower()) ||
                                     m.Notes.ToLower().Contains(q.ToLower()));

        var result = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
        return Ok(result);
    }

    // GET /api/media/stats  (must come before {id} route to avoid route conflict)
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.Medias.ToListAsync();
        var rated = all.Where(m => m.Rating > 0).ToList();
        return Ok(new
        {
            total = all.Count,
            movies = all.Count(m => m.Type == "filme"),
            series = all.Count(m => m.Type == "série"),
            avgRating = rated.Count > 0 ? Math.Round(rated.Average(m => m.Rating), 1) : (double?)null
        });
    }

    // GET /api/media/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var media = await db.Medias.FindAsync(id);
        return media is null ? NotFound() : Ok(media);
    }

    // POST /api/media
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMediaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { error = "Título é obrigatório." });

        var duplicate = await db.Medias.AnyAsync(m => m.Title.ToLower() == dto.Title.ToLower());
        if (duplicate)
            return Conflict(new { error = "Título já existe na lista." });

        var media = new Media { Title = dto.Title, Type = dto.Type };
        db.Medias.Add(media);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = media.Id }, media);
    }

    // PATCH /api/media/{id}
    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMediaDto dto)
    {
        var media = await db.Medias.FindAsync(id);
        if (media is null) return NotFound();

        if (dto.Rating is < 0 or > 5)
            return BadRequest(new { error = "Avaliação deve ser entre 0 e 5." });

        media.Rating = dto.Rating;
        media.Notes = dto.Notes;
        await db.SaveChangesAsync();
        return Ok(media);
    }

    // DELETE /api/media/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var media = await db.Medias.FindAsync(id);
        if (media is null) return NotFound();
        db.Medias.Remove(media);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/media/{id}/analyze
    [HttpPost("{id:int}/analyze")]
    public async Task<IActionResult> Analyze(int id)
    {
        var media = await db.Medias.FindAsync(id);
        if (media is null) return NotFound();

        try
        {
            var analysis = await ai.AnalyzeAsync(media.Title, media.Type, media.Rating, media.Notes);
            return Ok(new { analysis });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
