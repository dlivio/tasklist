using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using tasklist.Models;

namespace tasklist.Services
{
    /// <summary>
    /// Service that establishes the communication between the Camunda Workflow Engine and our application by 
    /// using REST calls made by HttpClient.
    /// </summary>
    public class CamundaService
    {
        private static readonly string BASE_URL = "http://194.210.120.169:591/engine-rest/";

        private static readonly HttpClient _client;

        static CamundaService()
        {
            _client = new HttpClient();
        }

        /// <summary>
        /// Make a request to Camunda Workflow Engine to retrieve all open tasks awaiting completion.
        /// </summary>
        /// <returns>A List containing all the open tasks.</returns>
        public async Task<List<CamundaTask>> GetOpenTasksAsync()
        {
            List<CamundaTask> tasks = new();

            HttpResponseMessage response = await _client.GetAsync(BASE_URL + "task");
            if (response.IsSuccessStatusCode)
            {
                tasks = await response.Content.ReadFromJsonAsync<List<CamundaTask>>();
            }

            return tasks;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="caseInstanceId"></param>
        /// <returns></returns>
        public async Task<List<CamundaTask>> GetOpenTasksFromProcessAsync(string caseInstanceId)
        {
            List<CamundaTask> tasks = new();

            HttpResponseMessage response = await _client.GetAsync(BASE_URL + "task");
            if (response.IsSuccessStatusCode)
            {
                tasks = await response.Content.ReadFromJsonAsync<List<CamundaTask>>();
            }

            tasks = tasks.FindAll(t => t.CaseInstanceId == caseInstanceId);

            return tasks;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="processInstanceId"></param>
        /// <returns></returns>
        public async Task<List<CamundaTask>> GetOpenTasksByProcessInstanceIDAsync(string processInstanceId)
        {
            List<CamundaTask> tasks = new();

            HttpResponseMessage response = await _client.GetAsync(BASE_URL + "task?processInstanceId=" + processInstanceId);
            if (response.IsSuccessStatusCode)
            {
                tasks = await response.Content.ReadFromJsonAsync<List<CamundaTask>>();
            }

            return tasks;
        }

        /// <summary>
        /// Make a request to Camunda Workflow Engine to start a process with the given 'processId' and a 
        /// given 'caseInstanceId'.
        /// </summary>
        /// <param name="processId">The id of the process to begin.</param>
        /// <param name="caseInstanceIdToCreate">The caseInstantId to identify the process.</param>
        /// <returns>The caseInstanceId used to begin the process.</returns>
        public async Task<string> StartProcessInstanceAsync(string processId, string caseInstanceIdToCreate)
        {
            var processArgs = new CamundaStartProcess(caseInstanceIdToCreate);
            var serializeOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
            var processArgsSerialized = JsonSerializer.Serialize(processArgs, serializeOptions);
            var requestContent = new StringContent(processArgsSerialized, Encoding.UTF8, "application/json");

            string caseInstanceId = null;

            HttpResponseMessage response = await _client.PostAsync(BASE_URL + "process-definition/key/" + processId
                + "/start", requestContent);
            if (response.IsSuccessStatusCode)
            {
                caseInstanceId = caseInstanceIdToCreate;
                var res = response.Content.ReadAsStringAsync();
            }


            return caseInstanceId;
        }

        /// <summary>
        /// Make a request to Camunda Workflow Engine to retrieve the diagram related to the requested 
        /// processDefinitionId.
        /// </summary>
        /// <param name="processDefinitionId"></param>
        /// <returns>An object containing an ID and the XML of the diagram requested</returns>
        public async Task<CamundaDiagramXML> GetXMLAsync(string processDefinitionId)
        {
            CamundaDiagramXML xml = null;

            HttpResponseMessage response = await _client.GetAsync(BASE_URL + "process-definition/" + processDefinitionId + "/xml");
            if (response.IsSuccessStatusCode)
            {
                xml = await response.Content.ReadFromJsonAsync<CamundaDiagramXML>();
            }

            return xml;
        }

        /// <summary>
        /// Make a request to Camunda Workflow Engine to retrieve the task history of the diagram related 
        /// to the requested processDefinitionId.
        /// </summary>
        /// <param name="processInstanceId"></param>
        /// <returns>A List of id's of the tasks in the diagram related to the processInstanceId.</returns>
        public async Task<List<CamundaHistoryTask>> GetDiagramTaskHistoryAsync(string processInstanceId)
        {
            List<CamundaHistoryTask> history = new();

            HttpResponseMessage response = await _client.GetAsync(BASE_URL + "history/activity-instance?processInstanceId=" + processInstanceId);
            if (response.IsSuccessStatusCode)
            {
                history = await response.Content.ReadFromJsonAsync<List<CamundaHistoryTask>>();
            }

            // sort the list to order the elements by execution
            history = history.OrderBy(t => t.StartTime).ToList();

            /*
            // get all activityId's that correspond to UserTasks, ManualTasks or unassigned Tasks
            List<string> taskIds = history.Where(t => t.ActivityType == "userTask" || t.ActivityType == "manualTask" 
                || t.ActivityType == "task").Select(t => t.ActivityId).ToList();
            */

            // get all activityId's that correspond to UserTasks, ManualTasks or unassigned Tasks
            history = history.Where(t => t.ActivityType == "userTask" || t.ActivityType == "manualTask"
                || t.ActivityType == "task" || t.ActivityType == "callActivity" || t.ActivityType == "businessRuleTask").ToList();

            return history;
        }


    }
}
