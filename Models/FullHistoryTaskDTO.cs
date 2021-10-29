using System;

namespace tasklist.Models
{
	public class FullHistoryTaskDTO
	{
        public string ActivityName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime CompletionTime { get; set; }

        public FullHistoryTaskDTO(CamundaHistoryTask camundaTask, Task task)
		{
            ActivityName = camundaTask.ActivityName;

            if (task != null)
			{
                StartTime = task.StartTime;
                CompletionTime = task.CompletionTime;
            } else
			{
                StartTime = DateTime.Parse(camundaTask.StartTime);
                CompletionTime = DateTime.Parse(camundaTask.EndTime);
            }
        }
    }
}
