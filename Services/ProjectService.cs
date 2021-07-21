using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using tasklist.Models;

namespace tasklist.Services
{
    public class ProjectService
    {
        private readonly IMongoCollection<Project> _projects;

        public ProjectService(IProjectsDatabaseSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);

            _projects = database.GetCollection<Project>(settings.ProjectsCollectionName);
        }

        public List<Project> Get() =>
            _projects.Find(project => true).ToList();

        public Project Get(string id) =>
            _projects.Find<Project>(project => project.Id == id).FirstOrDefault();

        public Project Create(Project project)
        {
            _projects.InsertOne(project);
            return project;
        }

        public void Update(string id, Project projectIn) =>
            _projects.ReplaceOne(project => project.Id == id, projectIn);

        public void Remove(Project projectIn) =>
            _projects.DeleteOne(project => project.Id == projectIn.Id);

        public void Remove(string id) =>
            _projects.DeleteOne(project => project.Id == id);
    }
}
