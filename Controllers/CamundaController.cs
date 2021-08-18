using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using tasklist.Models;

namespace tasklist.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CamundaController : ControllerBase
    {
        private readonly string baseURL = "http://194.210.120.169:591/engine-rest/";

        private static readonly HttpClient client;

        static CamundaController()
        {
            client = new HttpClient();
        }

        // GET: api/Camunda/OpenTasks
        [HttpGet("OpenTasks", Name = "GetOpenTasksFromCamunda")]
        public async Task<ActionResult<List<CamundaTaskDTO>>> GetAsync()
        {
            List<CamundaTaskDTO> tasks = new List<CamundaTaskDTO>();
            
            HttpResponseMessage response = await client.GetAsync(baseURL + "task");
            if (response.IsSuccessStatusCode)
            {
                List<CamundaTask> camundaTasks = await response.Content.ReadFromJsonAsync<List<CamundaTask>>();

                foreach(CamundaTask camundaTask in camundaTasks)
                {
                    tasks.Add(new CamundaTaskDTO(camundaTask));
                }
            }
            return tasks;
        }
    }
}
