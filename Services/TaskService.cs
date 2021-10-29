using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using tasklist.Models;
using Task = tasklist.Models.Task;

namespace tasklist.Services
{
    public class TaskService
    {
        private readonly IMongoCollection<Task> _tasks;

        public TaskService(ITasksDatabaseSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);

            _tasks = database.GetCollection<Task>(settings.TasksCollectionName);
        }

        public List<Task> Get() =>
            _tasks.Find(task => true).ToList();

        public List<Task> GetByProcessInstanceId(string processInstanceId) =>
            _tasks.Find(task => task.ProcessInstanceId == processInstanceId).ToList();

        public Task Get(string id) =>
            _tasks.Find<Task>(task => task.Id == id).FirstOrDefault();

        /*
        /// <summary>
        /// Retrieves the Tasks that have the requested projectId.
        /// </summary>
        /// <param name="projectId">The Id of the Project which the task belongs to.</param>
        /// <returns>A List of Tasks</returns>
        public List<Task> GetByProjectId(string projectId) =>
            _tasks.Find<Task>(task => task.ProjectId == projectId).ToList();

        /// <summary>
        /// Retrieves the Tasks that have the requested projectId and are not completed.
        /// </summary>
        /// <param name="projectId">The Id of the Project which the task belongs to.</param>
        /// <returns>A List of Tasks</returns>
        public List<Task> GetByProjectIdActive(string projectId) =>
            _tasks.Find<Task>(task => (task.ProjectId == projectId && task.Completed == false)).ToList();

        /// <summary>
        /// Returns the number of Tasks that have the requested projectId and are not completed.
        /// </summary>
        /// <param name="projectId">The Id of the Project which the task belongs to.</param>
        /// <returns>A List of Tasks</returns>
        public long CountByProjectIdActive(string projectId) =>
            _tasks.CountDocuments<Task>(task => (task.ProjectId == projectId && task.Completed == false));

        /// <summary>
        /// Retrieves the Tasks that have the requested projectId and are completed.
        /// </summary>
        /// <param name="projectId">The Id of the Project which the task belongs to.</param>
        /// <returns>A List of Tasks</returns>
        public List<Task> GetByProjectIdCompleted(string projectId) =>
            _tasks.Find<Task>(task => (task.ProjectId == projectId && task.Completed == true)).ToList();

        /// <summary>
        /// Returns the number of Tasks that have the requested projectId and are completed.
        /// </summary>
        /// <param name="projectId">The Id of the Project which the task belongs to.</param>
        /// <returns>A List of Tasks</returns>
        public long CountByProjectIdCompleted(string projectId) =>
            _tasks.CountDocuments<Task>(task => (task.ProjectId == projectId && task.Completed == true));
        */
        public Task Create(Task task)
        {
            _tasks.InsertOne(task);
            return task;
        }

        public void Update(string id, Task taskIn) =>
            _tasks.ReplaceOne(task => task.Id == id, taskIn);

        public void Remove(Task taskIn) =>
            _tasks.DeleteOne(task => task.Id == taskIn.Id);

        public void Remove(string id) =>
            _tasks.DeleteOne(task => task.Id == id);
    }
}
