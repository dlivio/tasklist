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

        // GET: api/Projects
        /// <summary>
        /// Method that retrieves all open Projects and the currently open Tasks in Camunda to build objects containing both the 
        /// Project properties and the name of the next Task awaiting approval.
        /// </summary>
        /// <returns>A list of Projects with the next Task name.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetAsync()
        {
            // get the tasks from Camunda
            List<CamundaTask> tasks = await _camundaService.GetOpenTasksAsync();

            // get the projects created in the system
            List<Project> projects = _projectService.GetOpenProjects();

            List<ProjectDTO> projectDTOs = new();

            foreach (Project project in projects)
            {
                List<CamundaTask> foundTasks = tasks.FindAll(t => t.CaseInstanceId == project.CaseInstanceId);

                if (foundTasks.Count > 0)
                    projectDTOs.Add(new ProjectDTO(project, foundTasks));

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

        // GET: api/Projects/invoice:112/Diagram
        /// <summary>
        /// Method that retrieves the current XML Diagram in which the task from the requested caseInstanceId is currently in.
        /// </summary>
        /// <param name="caseInstanceId"></param>
        /// <returns>The XML of the Diagram of the current found task.</returns>
        [HttpGet("{caseInstanceId}/Diagram", Name = "GetCurrentDiagram")]
        public async Task<ActionResult<string>> GetCurrentDiagramAsync(string caseInstanceId)
        {
            // get the project with the requested caseInstanceId
            Project project = _projectService.GetByCaseInstanceId(caseInstanceId);

            // get the task from Camunda
            CamundaTask task = (await _camundaService.GetOpenTasksAsync()).Find(t => t.CaseInstanceId == caseInstanceId);

            if (task == null) { 
                return NotFound(); 
            
            } else
            {
                // if the current ProcessInstanceId is not on the list add it and update the object (useful when retrieving history)
                if (task.ProcessInstanceId != project.ProcessInstanceIds.LastOrDefault())
                {
                    project.ProcessInstanceIds.Add(task.ProcessInstanceId);

                    _projectService.Update(project.Id, project);
                } 
            }

            // get the diagram xml from Camunda
            CamundaDiagramXML xml = await _camundaService.GetXMLAsync(task.ProcessDefinitionId);

            return xml.Bpmn20Xml;
        }

        // PUT: api/Projects/5
        [HttpPut("{id:length(24)}")]
        public IActionResult Update(string id, Project projectIn)
        {
            var project = _projectService.Get(id);

            if (project == null)
                return NotFound();

            _projectService.Update(id, projectIn);

            return NoContent();
        }

        // POST: api/Projects
        [HttpPost]
        public async Task<ActionResult<Project>> CreateAsync(ProjectFormDTO projectForm)
        {
            // make a unique key to use while starting the process in Camunda
            // string hash = projectForm.ProjectName + "_" + SHA256ToString(projectForm.ProjectName + projectForm.StartDate);
            int noProjects = _projectService.Get().Count;
            string generatedId = projectForm.ProjectName + "_" + noProjects;

            Project project = new Project(projectForm.ProjectName, projectForm.StartDate, generatedId);

            _projectService.Create(project);
            // start the process in Camunda with the generated ID
            await _camundaService.StartProcessInstanceAsync("restoration_base", generatedId, projectForm);

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
