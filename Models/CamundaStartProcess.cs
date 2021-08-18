namespace tasklist.Models
{
    public class CamundaStartProcess
    {
        public string CaseInstanceId { get; set; }

        public CamundaStartProcess(string caseInstanceId)
        {
            this.CaseInstanceId = caseInstanceId;
        }
    }
}
