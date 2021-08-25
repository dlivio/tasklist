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


        public async Task<List<string>> GetDiagramTaskHistoryAsync(string processInstanceId)
        {
            List<CamundaHistoryTask> history = new();

            // history/activity-instance?processInstanceId=3a57a92b-04f3-11ec-8247-0242ac110003
            HttpResponseMessage response = await _client.GetAsync(BASE_URL + "history/activity-instance?processInstanceId=" + processInstanceId);
            if (response.IsSuccessStatusCode)
            {
                history = await response.Content.ReadFromJsonAsync<List<CamundaHistoryTask>>();
            }

            // get all activityId's that correspond to UserTasks, ManualTasks or unassigned Tasks
            List<string> taskIds = history.Where(t => t.ActivityType == "userTask" || t.ActivityType == "manualTask" 
                || t.ActivityType == "task").Select(t => t.ActivityId).ToList();

            return taskIds;
        }


    }
}
