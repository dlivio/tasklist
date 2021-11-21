using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using tasklist.Models;
using tasklist.Services;

namespace tasklist
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        readonly string MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            /*
            services.AddCors(options =>
            {
                options.AddPolicy(name: MyAllowSpecificOrigins,
                                  builder =>
                                  {
                                      builder.WithOrigins("http://194.210.120.34*",
                                                          "https://194.210.120.34*",
                                                          "*")
                                                            .AllowAnyHeader()
                                                            .AllowAnyMethod()
                                                            .SetIsOriginAllowedToAllowWildcardSubdomains();
                                  });

            });
            */

            services.AddCors(options =>
            {
                options.AddPolicy(name: MyAllowSpecificOrigins,
                    builder => builder
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .WithOrigins("http://194.210.120.34",
                                     "https://194.210.120.34", 
                                     "http://194.210.120.34*",
                                     "https://194.210.120.34*",
                                     "https://o3tbzwf5ek.execute-api.eu-central-1.amazonaws.com/prod",
                                     "http://0.0.0.0:8000")
                        .AllowAnyMethod()
                        .AllowCredentials()
                        .AllowAnyHeader());
            });

            // requires using Microsoft.Extensions.Options
            services.Configure<ProjectsDatabaseSettings>(
                Configuration.GetSection(nameof(ProjectsDatabaseSettings)));

            services.AddSingleton<IProjectsDatabaseSettings>(sp =>
                sp.GetRequiredService<IOptions<ProjectsDatabaseSettings>>().Value);

            services.Configure<TasksDatabaseSettings>(
                Configuration.GetSection(nameof(TasksDatabaseSettings)));

            services.AddSingleton<ITasksDatabaseSettings>(sp =>
                sp.GetRequiredService<IOptions<TasksDatabaseSettings>>().Value);

            services.Configure<SensorTasksDatabaseSettings>(
                Configuration.GetSection(nameof(SensorTasksDatabaseSettings)));

            services.AddSingleton<ISensorTasksDatabaseSettings>(sp =>
                sp.GetRequiredService<IOptions<SensorTasksDatabaseSettings>>().Value);

            services.Configure<CredentialsDatabaseSettings>(
                Configuration.GetSection(nameof(CredentialsDatabaseSettings)));

            services.AddSingleton<ICredentialsDatabaseSettings>(sp =>
                sp.GetRequiredService<IOptions<CredentialsDatabaseSettings>>().Value);

            services.Configure<ActivityMapsDatabaseSettings>(
                Configuration.GetSection(nameof(ActivityMapsDatabaseSettings)));

            services.AddSingleton<IActivityMapsDatabaseSettings>(sp =>
                sp.GetRequiredService<IOptions<ActivityMapsDatabaseSettings>>().Value);

            services.AddSingleton<ProjectService>();

            services.AddSingleton<TaskService>();

            services.AddSingleton<SensorTaskService>();

            services.AddSingleton<CamundaService>();

            services.AddSingleton<AmazonS3Service>();

            services.AddSingleton<ActivityMapService>();

            services.AddSingleton<ERPNextService>();

            services.AddControllersWithViews();
            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist/ClientApp";
            });
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "tasklist_api", Version = "v1" });
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                //app.UseSwagger();
                //app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "tasklist_api v1"));
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "tasklist_api v1"));

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }

            app.UseRouting();

            app.UseCors(MyAllowSpecificOrigins);

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });
        }
    }
}
