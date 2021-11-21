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
        private readonly CamundaService _camundaService;
        private readonly ERPNextService _erpnextService;
        public ProjectsController(ProjectService projectService, CamundaService camundaService, ERPNextService erpnextService)
        {
            _projectService = projectService;
            _camundaService = camundaService;
            _erpnextService = erpnextService;
        }

        // GET: api/Projects
        /// <summary>
        /// Method that retrieves all open Projects and the currently open Tasks in Camunda to build objects containing both the 
        /// Project properties and the name of the next Task awaiting approval.
        /// </summary>
        /// <returns>A list of Projects with the next Task name.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetOpenProjectsAsync()
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
                else
                { // the case when it's waiting for a message trigger
                    CamundaTask waitingForMessage = new CamundaTask { Name = "Waiting for message"};
                    projectDTOs.Add(new ProjectDTO(project, new List<CamundaTask>() { waitingForMessage }));
                }
            }

            return projectDTOs;

        }

        [HttpGet("Closed", Name = "GetClosedProjects")]
        public ActionResult<IEnumerable<ProjectDTO>> GetClosedProjectsAsync()
        {
            // get the projects created in the system
            List<Project> projects = _projectService.GetClosedProjects();

            List<ProjectDTO> projectDTOs = new();

            foreach (Project project in projects)
            {
                projectDTOs.Add(new ProjectDTO(project, new List<CamundaTask>() ) );
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

        // GET: api/Projects/DTO/5
        [HttpGet("{id:length(24)}/DTO", Name = "GetProjectDTO")]
        public async Task<ActionResult<ProjectDTO>> GetProjectDTO(string id)
        {
            Project project = _projectService.Get(id);

            if (project == null)
            {
                return NotFound();
            }

            // get the tasks from Camunda
            List<CamundaTask> tasks = await _camundaService.GetOpenTasksAsync();

            List<CamundaTask> foundTasks = tasks.FindAll(t => t.CaseInstanceId == project.CaseInstanceId);

            ProjectDTO projectDTO = null;

            if (foundTasks.Count > 0)
                projectDTO = new ProjectDTO(project, foundTasks);
            else
            { // the case when it's waiting for a message trigger
                CamundaTask waitingForMessage = new CamundaTask { Name = "Waiting for message" };
                projectDTO = new ProjectDTO(project, new List<CamundaTask>() { waitingForMessage });
            }

            return projectDTO;
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

			bool updateLastDiagramId = false;

            if (task == null) { 
                if (project.ProcessInstanceIds.Count == 0) 
                    return NotFound();

            }
            else
            {
                // if the current ProcessInstanceId is not on the list add it and update the object (useful when retrieving history)
                if (task.ProcessInstanceId != project.ProcessInstanceIds.LastOrDefault())
                {
                    updateLastDiagramId = true;

                    project.ProcessInstanceIds.Add(task.ProcessInstanceId);
                    project.LastProcessDefinitionId = task.ProcessDefinitionId;

                    _projectService.Update(project.Id, project);
                } 
            }

            // get the diagram xml from Camunda
            CamundaDiagramXML xml = await _camundaService.GetXMLAsync(project.LastProcessDefinitionId);

            // update the last diagram name on the 'Project' object if needed
            if (updateLastDiagramId) { 
                project.LastDiagramId = xml.DiagramId;
                _projectService.Update(project.Id, project);
            }

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
            int noProjects = _projectService.Get().Count;
            string generatedId = projectForm.ProjectName + "_" + noProjects;

            // clean the string input of licence plate from possible unecessary characters
            string sanitizedLicencePlate = projectForm.LicencePlate.Replace("-", "").Trim();

            Project project = new Project(projectForm.ProjectName, sanitizedLicencePlate, projectForm.StartDate, generatedId);

            _projectService.Create(project);
            // start the process in Camunda with the generated ID
            await _camundaService.StartProcessInstanceAsync("restoration_base", generatedId, projectForm);

            return CreatedAtRoute("GetProject", new { id = project.Id.ToString() }, project);
        }

        // POST: api/Projects
        [HttpPost("ERPNext")]
        public async Task<ActionResult<Project>> CreateFromERPNextAsync(ProjectERPNextDTO projectForm)
        {
            // make a unique key to use while starting the process in Camunda
            int noProjects = _projectService.Get().Count;
            string generatedId = projectForm.ProjectName + "_" + noProjects;

            // clean the string input of licence plate from possible unecessary characters
            string sanitizedLicencePlate = projectForm.LicencePlate.Replace("-", "").Trim();

            Project existingLicencePlate = _projectService.GetByLicencePlate(sanitizedLicencePlate);

            if (existingLicencePlate != null)
			{
                return Conflict();
            }

            // initialize a creation date
            DateTime startDate = DateTime.Now;

            Project project = new Project(projectForm.ProjectName, sanitizedLicencePlate, startDate, generatedId);
            _projectService.Create(project);

            ProjectFormDTO projectFormConverted = new ProjectFormDTO { ProjectName = projectForm.ProjectName, 
                LicencePlate = projectForm.LicencePlate, ClientExpectation = projectForm.ClientExpectation, 
                OriginalMaterials = projectForm.OriginalMaterials, CarDocuments = projectForm.CarDocuments, 
                StartDate = startDate};

            // start the process in Camunda with the generated ID
            await _camundaService.StartProcessInstanceAsync("restoration_base", generatedId, projectFormConverted);

            // update the object in ERPNext to add the created ProjectID variable
            await _erpnextService.UpdateProjectDoctype(projectForm.ERPNextProjectId, project.CaseInstanceId);

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
