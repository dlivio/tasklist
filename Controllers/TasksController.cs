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
        private readonly SensorTaskService _sensorTaskService;
        private readonly AmazonS3Service _amazonS3Service;
        private readonly ActivityMapService _activityMapService;

        public TasksController(TaskService taskService, ProjectService projectService, CamundaService camundaService,
            SensorTaskService sensorTaskService, AmazonS3Service amazonS3Service, ActivityMapService activityMapService)
        {
            _taskService = taskService;
            _projectService = projectService;
            _camundaService = camundaService;
            _sensorTaskService = sensorTaskService;
            _amazonS3Service = amazonS3Service;
            _activityMapService = activityMapService;
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
        /// Method that retrieves the 'HistoryTasks' object for the Diagram in which the task from the requested caseInstanceId is currently in. 
        /// This object is composed by an array of the current activity id's, the previously completed activity id's, and some completed sequence 
        /// flows infered from the variables existing in the system (variables used to pick paths in gateways).
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

            //List<string> historyVars = historyVariables.Where(v => v.Value is string).Select(v => v.Value as string).ToList(); Convert.ToString(t.Value)

            return new HistoryTasks(currentTasksActivityIds, historyTasks.Select(t => t.ActivityId).ToList(), historyVariables.Select(v => (string)Convert.ToString(v.Value)).ToList());
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="caseInstanceId"></param>
        /// <returns></returns>
        [HttpGet("{caseInstanceId}/Diagram/Predictions", Name = "GetCurrentDiagramPredictions")]
        public ActionResult<List<TaskPredictionsDTO>> GetCurrentDiagramPredictions(string caseInstanceId)
		{
            Project currentProject = _projectService.GetByCaseInstanceId(caseInstanceId);

            if (currentProject == null) return NotFound();

            // get the last processDefinitionId from the project with the requested caseInstanceId
            string processInstanceId = currentProject.ProcessInstanceIds.LastOrDefault();

            if (processInstanceId == null) return NotFound();

            IEnumerable<SensorTask> predictions = _sensorTaskService.GetByProjectId(currentProject.Id).OrderBy(pred => pred.StartTime);

            List<ActivityMap> mappings = _activityMapService.GetByDiagramId(currentProject.LastDiagramId).OrderBy(map => map.DiagramOrder).ToList();

            List<TaskPredictionsDTO> predictionsToReturn = new();

            if (mappings.Count > 0)
			{
                foreach (SensorTask task in predictions)
                {

                    foreach (ActivityMap activity in mappings)
                    {
                        // check if a mapping has any of the found sensor events
                        if (activity.SensorsRelated.Exists(s => task.Events.Contains(s)))
                        {
                            predictionsToReturn.Add(new TaskPredictionsDTO { ActivityId = activity.ActivityId, StartTime = task.StartTime, EndTime = task.EndTime });
                            mappings.Remove(activity); // remove the mapping to avoid correlating another SensorTask to it

                            task.ActivityId = activity.ActivityId;
                            _sensorTaskService.Update(task.Id, task); // update the object with the id to indicate it was a prediction for it
                        }

                        break;
                    }
                }
            }

            return predictionsToReturn;
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
            Project currentProject = _projectService.Get(projectId);
            // get the process instance from the Project object
            string currentProcessInstanceId = currentProject.ProcessInstanceIds.Last();

            if (currentProcessInstanceId == null)
                return NotFound();

            // start by triggering the Signal Start Events of the subprocesses
            foreach (string signalRefName in tasks.StartEventTriggers)
            {
                string triggerResult = await _camundaService.TriggerCamundaSignalStartEvent(signalRefName, currentProcessInstanceId);

                if (triggerResult != currentProcessInstanceId)
                    return NotFound();
            }

            List<string> activityIdsList = new List<string>();

            foreach (string[] task in tasks.Tasks)
            {
                activityIdsList.Add(task[0]);
            }

            List<CamundaTask> currentTasks = await _camundaService.GetOpenTasksByProcessInstanceIDAsync(currentProcessInstanceId);

            List<SensorTask> predictions = _sensorTaskService.GetByProjectId(currentProject.Id).ToList();

            foreach (string[] task in tasks.Tasks)
			{
                // the result of the task approval
                string id = null;

                foreach (CamundaTask t in currentTasks)
                {
                    if (t.TaskDefinitionKey == task[0])
                    {
                        id = await _camundaService.CompleteCamundaTask(t.Id, tasks.Variables);

                        if (id == null) 
                            return NotFound();
                        else {
                            _taskService.Create(new Task(task[0], currentProcessInstanceId, task[1], task[2]));

                            currentTasks = await _camundaService.GetOpenTasksByProcessInstanceIDAsync(currentProcessInstanceId);

                            // delete the prediction if it was submitted
                            SensorTask prediction = predictions.Find(p => p.ActivityId != null && p.ActivityId == t.TaskDefinitionKey);
                            if (prediction != null)
                                _sensorTaskService.Remove(prediction);

                            // complete the current project
                            if (t.TaskDefinitionKey == "Activity_096zd4f") // last task of the diagram
                                _projectService.Complete(currentProject.Id, currentProject);
                            
                        }
                        break;
                    }
                }
                // if no current open task corresponds, check if a message task is waiting
                if (id == null)
				{
                    // check if the task is a 'ReceiveTask' to approve accordingly
                    if (task[3] != "")
                        id = await _camundaService.SignalCamundaReceiveTask(task[3], currentProcessInstanceId, tasks.Variables);

                    if (id == null)
                        return NotFound();
                    else
                    {
                        _taskService.Create(new Task(task[0], currentProcessInstanceId, task[1], task[2]));

                        currentTasks = await _camundaService.GetOpenTasksByProcessInstanceIDAsync(currentProcessInstanceId);
                    }
                }

            }

            return NoContent();
        }

        // POST: api/Tasks/Sensor/SensorBox_01/processed_SensorBox_01_data_07_09_2021_2.json
        /// <summary>
        /// Method that serves as a trigger to retrieve sensor information from the Amazon servers.
        /// </summary>
        /// <param name="folderName">the name of the folder to get the file from (i.e. 'SensorBox_01')</param>
        /// <param name="fileName">the name of the file to retrieve (i.e. 'processed_SensorBox_01_data_07_09_2021_1.json')</param>
        /// <returns>a List containing the parsed SensorInfo objects</returns>
        [HttpPost("/Sensor/{folderName}/{fileName}")]
        public async Task<List<AmazonS3SensorInfo>> NewSensorInformationAvailable(string folderName, string fileName)
        {
            List<AmazonS3SensorInfo> list = await _amazonS3Service.GetSensorInformation(folderName, fileName);

            List<AmazonS3SensorInfo> tmp = list;

            list.ForEach(si => {
                Project p = _projectService.GetByCaseInstanceId(si.Car);
                if (p != null) {
                    SensorTask st = new SensorTask(si, p.Id);
                    _sensorTaskService.Create(st);
                }
            });

            return tmp;
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
