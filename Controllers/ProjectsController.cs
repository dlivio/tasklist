using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
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
        private readonly CamundaService _camundaService;

        public ProjectsController(ProjectService projectService, TaskService taskService, CamundaService camundaService)
        {
            _projectService = projectService;
            _taskService = taskService;
            _camundaService = camundaService;
        }

        // GET: api/Projects  //TODO
        [HttpGet]
        public async Task<ActionResult<List<ProjectDTO>>> GetAsync()
        {
            // get the tasks from Camunda
            List<CamundaTask> tasks = await _camundaService.GetOpenTasksAsync();

            // get the projects created in the system
            List<Project> projects = _projectService.GetOpenProjects();

            List<ProjectDTO> projectDTOs = new();

            foreach (CamundaTask task in tasks)
            {
                Project foundProject = projects.Find(project => project.CaseInstanceId == task.CaseInstanceId);

                if (foundProject != null)
                {
                    projectDTOs.Add(new ProjectDTO(foundProject, task.Name));
                }
  
            }

            
            /*
            List<ProjectDTO> projectDTOs = new();
            long noTasksCompleted, noTasksToApprove;

            foreach(Project project in projects)
            {
                var test = _taskService.GetByProjectId(project.Id);

                noTasksToApprove = _taskService.CountByProjectIdActive(project.Id);
                noTasksCompleted = _taskService.CountByProjectIdCompleted(project.Id);

                projectDTOs.Add(new ProjectDTO(project, "testID"));
            }
            */

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

        /// <summary>
        /// https://stackoverflow.com/questions/3984138/hash-string-in-c-sharp
        /// </summary>
        /// <param name="s"></param>
        /// <returns></returns>
        private static string SHA256ToString(string s)
        {
            using (var alg = SHA256.Create())
                return alg.ComputeHash(Encoding.UTF8.GetBytes(s)).Aggregate(new StringBuilder(), (sb, x) => sb.Append(x.ToString("x2"))).ToString();
        }

        // POST: api/Projects
        [HttpPost]
        public async Task<ActionResult<Project>> CreateAsync(ProjectFormDTO projectForm)
        {
            // make a unique key to use while starting the process in Camunda
            //string hash = projectForm.ProjectName + "_" + SHA256ToString(projectForm.ProjectName + projectForm.StartDate);
            int noProjects = _projectService.Get().Count();
            string generatedId = projectForm.ProjectName + "_" + noProjects;

            Project project = new Project(projectForm.ProjectName, projectForm.StartDate, generatedId);

            _projectService.Create(project);
            // start the process in Camunda with the generated ID
            await _camundaService.StartProcessInstanceAsync("HelpLafayetteEscape", generatedId);

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
