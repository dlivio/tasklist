using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using tasklist.Models;
using Task = System.Threading.Tasks.Task;

namespace tasklist.Services
{
	public class ERPNextService
    {
        private static readonly string BASE_URL = "http://194.210.120.34/";

        private static readonly HttpClient _client;

        private static readonly string Authentication = "<api_key>:<api_secret>";

        static ERPNextService()
        {
            _client = new HttpClient();

            byte[] auth = Encoding.UTF8.GetBytes(Authentication);
            // add Basic Authentication to the headers
            _client.DefaultRequestHeaders.Add("Authentication", "Basic " + Convert.ToBase64String(auth));
        }

        /// <summary>
        /// Method to update a Project doctype in the deployed ERPNext system to add the
        /// "tasklist_string_id" property with the value of the caseInstanceId of the Project it created in
        /// our system.
        /// </summary>
        /// <param name="erpnextProjectId">the ID of the erpnext Project</param>
        /// <param name="caseInstanceId">the ID of the Project in our database</param>
        public async Task UpdateProjectDoctype(string erpnextProjectId, string caseInstanceId)
        {
            ERPNextProjectIDPut tasklist_project_id = new ERPNextProjectIDPut { Tasklist_string_id = caseInstanceId };

            var erpnextProjectIDPutJson = new StringContent(JsonSerializer.Serialize(tasklist_project_id), 
                Encoding.UTF8, "application/json");

            HttpResponseMessage response = await _client.PutAsync(
                BASE_URL + "api/resource/Project/" + erpnextProjectId, erpnextProjectIDPutJson);
            
            response.EnsureSuccessStatusCode();
        }

    }
}
