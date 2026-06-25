using Microsoft.EntityFrameworkCore;
using CineLog.Api.Models;

namespace CineLog.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Media> Medias => Set<Media>();
}
