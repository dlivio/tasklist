using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using tasklist.Services;
using Task = tasklist.Models.Task;

namespace tasklist.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly TaskService _taskService;

        public TasksController(TaskService taskService)
        {
            _taskService = taskService;
        }

        // GET: api/Tasks
        [HttpGet]
        public ActionResult<List<Task>> Get() =>
            _taskService.Get();

        // GET: api/Tasks/5
        [HttpGet("{id:length(24)}", Name = "GetTask")]
        public ActionResult<Task> Get(string id)
        {
            var task = _taskService.Get(id);

            if (task == null)
            {
                return NotFound();
            }

            return task;
        }

        // GET: api/Tasks/ProjectIdActive/5
        [HttpGet("ProjectIdActive/{projectId:length(24)}", Name = "GetTaskByProjectIdActive")]
        public ActionResult<List<Task>> GetByProjectIdActive(string projectId) =>
            _taskService.GetByProjectIdActive(projectId);

        // GET: api/Tasks/ProjectIdActive/5/Count
        [HttpGet("ProjectIdActive/{projectId:length(24)}/Count", Name = "GetCountTasksByProjectIdActive")]
        public ActionResult<long> GetCountByProjectIdActive(string projectId) =>
            _taskService.CountByProjectIdActive(projectId);

        // GET: api/Tasks/ProjectIdComplete/5
        [HttpGet("ProjectIdComplete/{projectId:length(24)}", Name = "GetTaskByProjectIdComplete")]
        public ActionResult<List<Task>> GetByProjectIdComplete(string projectId) =>
            _taskService.GetByProjectIdCompleted(projectId);

        // GET: api/Tasks/ProjectIdComplete/5/Count
        [HttpGet("ProjectIdComplete/{projectId:length(24)}/Count", Name = "GetCountTasksByProjectIdComplete")]
        public ActionResult<long> GetCountByProjectIdComplete(string projectId) =>
            _taskService.CountByProjectIdCompleted(projectId);

        // PUT: api/Tasks/5
        [HttpPut("{id:length(24)}")]
        public IActionResult Update(string id, Task taskIn)
        {
            var task = _taskService.Get(id);

            if (task == null)
            {
                return NotFound();
            }

            _taskService.Update(id, taskIn);

            return NoContent();
        }

        // POST: api/Tasks
        [HttpPost]
        public ActionResult<Task> Create(Task task)
        {
            _taskService.Create(task);

            return CreatedAtRoute("GetTask", new { id = task.Id.ToString() }, task);
        }

        // DELETE: api/Tasks/5
        [HttpDelete("{id:length(24)}")]
        public IActionResult Delete(string id)
        {
            var task = _taskService.Get(id);

            if (task == null)
            {
                return NotFound();
            }

            _taskService.Remove(task.Id);

            return NoContent();
        }
    }
}
