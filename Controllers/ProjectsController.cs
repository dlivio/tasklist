using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using tasklist.Models;
using tasklist.Services;

namespace tasklist.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly ProjectService _projectService;
        private readonly TaskService _taskService;

        public ProjectsController(ProjectService projectService, TaskService taskService)
        {
            _projectService = projectService;
            _taskService = taskService;
        }

        // GET: api/Projects
        [HttpGet]
        public ActionResult<List<ProjectDTO>> Get()
        {
            var projects = _projectService.Get();

            List<ProjectDTO> projectDTOs = new();
            long noTasksCompleted, noTasksToApprove;

            foreach(Project project in projects)
            {
                var test = _taskService.GetByProjectId(project.Id);

                noTasksToApprove = _taskService.CountByProjectIdActive(project.Id);
                noTasksCompleted = _taskService.CountByProjectIdCompleted(project.Id);

                projectDTOs.Add(new ProjectDTO(project, noTasksCompleted, noTasksToApprove));
            }


            return projectDTOs;
        }
           

        // GET: api/Projects/5
        [HttpGet("{id:length(24)}", Name = "GetProject")]
        public ActionResult<Project> Get(string id)
        {
            var project = _projectService.Get(id);

            if (project == null)
            {
                return NotFound();
            }

            return project;
        }

        // PUT: api/Projects/5
        [HttpPut("{id:length(24)}")]
        public IActionResult Update(string id, Project projectIn)
        {
            var project = _projectService.Get(id);

            if (project == null)
            {
                return NotFound();
            }

            _projectService.Update(id, projectIn);

            return NoContent();
        }

        // POST: api/Projects
        [HttpPost]
        public ActionResult<Project> Create(Project project)
        {
            _projectService.Create(project);

            return CreatedAtRoute("GetProject", new { id = project.Id.ToString() }, project);
        }

        // DELETE: api/Projects/5
        [HttpDelete("{id:length(24)}")]
        public IActionResult Delete(string id)
        {
            var project = _projectService.Get(id);

            if (project == null)
            {
                return NotFound();
            }

            _projectService.Remove(project.Id);

            return NoContent();
        }
    }
}
