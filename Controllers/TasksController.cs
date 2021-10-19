using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using tasklist.Models;
using tasklist.Services;
using Task = tasklist.Models.Task;

namespace tasklist.Controllers
{
	[Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly TaskService _taskService;
        private readonly ProjectService _projectService;
        private readonly CamundaService _camundaService;
        private readonly AmazonS3Service _amazonS3Service;

        private AmazonS3Client s3Client;

        public TasksController(TaskService taskService, ProjectService projectService, CamundaService camundaService, 
            AmazonS3Service amazonS3Service)
        {
            _taskService = taskService;
            _projectService = projectService;
            _camundaService = camundaService;
            _amazonS3Service = amazonS3Service;

            string AccessKeyId = "AKIA3XRN4IIB6P4QEL46";
            string SecretAccessKey = "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";
            BasicAWSCredentials awsCreds = new BasicAWSCredentials(AccessKeyId, SecretAccessKey);

            s3Client = new AmazonS3Client(awsCreds, RegionEndpoint.EUCentral1);
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

        // GET: api/Tasks/invoice:112/Diagram/History
        /// <summary>
        /// Method that retrieves the history of tasks in the Diagram in which the task from the requested caseInstanceId is currently in.
        /// </summary>
        /// <param name="caseInstanceId"></param>
        /// <returns>A List with the id's of the tasks completed in the diagram.</returns>
        [HttpGet("{caseInstanceId}/Diagram/History", Name = "GetCurrentDiagramHistory")]
        public async Task<ActionResult<HistoryTasks>> GetCurrentDiagramHistoryAsync(string caseInstanceId)
        {
            // get the last processDefinitionId from the project with the requested caseInstanceId
            string processInstanceId = _projectService.GetByCaseInstanceId(caseInstanceId).ProcessInstanceIds.LastOrDefault();

            if (processInstanceId == null) return NotFound();

            List<CamundaHistoryTask> historyTasks = await _camundaService.GetDiagramTaskHistoryAsync(processInstanceId);

            List<CamundaHistoryTask> currentTasks = historyTasks.Where(t => t.EndTime == null).ToList();

            List<string> currentTasksActivityIds = new();

            foreach (CamundaHistoryTask task in currentTasks)
            {
                currentTasksActivityIds.Add(task.ActivityId);
                historyTasks.Remove(task);

            }

            List<CamundaHistoryVariables> historyVariables = await _camundaService.GetDiagramVariableHistoryAsync(processInstanceId);

            return new HistoryTasks(currentTasksActivityIds, historyTasks.Select(t => t.ActivityId).ToList(), historyVariables.Select(v => v.Value).ToList());
        }

        /*
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
        */
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

        // POST: api/Tasks/5/Approve
        /// <summary>
        /// Method that follows the tasks in the 'tasks' object received, approving one by one in the Camunda Workflow Engine
        /// and creating the 'Task' objects in the database to save the inputed start and completion time.
        /// </summary>
        /// <param name="projectId">the id of the project related to the tasks</param>
        /// <param name="tasks">the tasks, necessary workflow variables, and task timings to approve</param>
        /// <returns>NoContent if successful, or NotFound if at least one task to be approved is not currently approvable</returns>
        [HttpPost("{projectId}/Approve")]
        public async Task<IActionResult> ApproveCamundaTasksAsync(string projectId, TasksToApprove tasks)
        {
            // get the process instance from the Project object
            string currentProcessInstanceId = _projectService.Get(projectId).ProcessInstanceIds.Last();

            if (currentProcessInstanceId == null)
                return NotFound();

            List<string> activityIdsList = new List<string>();

            foreach (string[] task in tasks.Tasks)
            {
                activityIdsList.Add(task[0]);
            }

            List<CamundaTask> currentTasks = await _camundaService.GetOpenTasksByProcessInstanceIDAsync(currentProcessInstanceId);

            foreach (string[] task in tasks.Tasks)
			{
                foreach (CamundaTask t in currentTasks)
                {
                    if (t.TaskDefinitionKey == task[0])
                    {
                        string id = await _camundaService.CompleteCamundaTask(t.Id, tasks.Variables);

                        if (id == null) 
                            return NotFound();
                        else {
                            _taskService.Create(new Task(task[0], currentProcessInstanceId, task[1], task[2]));

                            currentTasks = await _camundaService.GetOpenTasksByProcessInstanceIDAsync(currentProcessInstanceId);
                        }
                        break;
                    }
                }
            }

            return NoContent();
        }

        // POST: api/Tasks/Sensor/file_name_to_read
        // https://docs.aws.amazon.com/code-samples/latest/catalog/dotnetv3-S3-ListObjectsExample-ListObjectsExample-ListObjects.cs.html
        [HttpPost("/Sensor/{fileNameToRead}")]
        public async Task<IActionResult> NewSensorInformationAvailable(string fileNameToRead)
        {
            string bucketName = "general-system-data";

            try
            {
                GetObjectRequest request = new()
                {
                    BucketName = bucketName,
                    Key = "processed-data/SensorBox_01/processed_SensorBox_01_data_07_09_2021_2.json",// + fileNameToRead + "/", SensorBox_01/processed_SensorBox_01_data_07_09_2021_2.json
                };

				// Issue request and remember to dispose of the response
				using GetObjectResponse response = await s3Client.GetObjectAsync(request);

				using StreamReader reader = new StreamReader(response.ResponseStream);

				string contents = reader.ReadToEnd();
			}
            catch (AmazonS3Exception ex)
            {
                Console.WriteLine($"Error encountered on server. Message:'{ex.Message}' getting list of objects.");
            }


            return NoContent();
        }

        /// <summary>
        /// Uses the client object to get a  list of the objects in the S3
        /// bucket in the bucketName parameter.
        /// </summary>
        /// <param name="client">The initialized S3 client obect used to call
        /// the ListObjectsAsync method.</param>
        /// <param name="bucketName">The bucket name for which you want to
        /// retrieve a list of objects.</param>
        public static async void ListingObjectsAsync(IAmazonS3 client, string bucketName)
        {
            
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
