using System;
using System.Collections.Generic;

namespace tasklist.Models
{
    public class ProjectDTO
    {
        public string Id { get; set; }

        public string ProjectName { get; set; }

        public DateTime StartDate { get; set; }

        public bool IsComplete { get; set; }

        public string CaseInstanceId { get; set; }

        public List<string> NextTaskName { get; set; }

        public ProjectDTO(Project project, List<CamundaTask> nextTasks)
        {
            Id = project.Id;
            ProjectName = project.ProjectName;
            StartDate = project.StartDate;
            IsComplete = project.IsComplete;
            CaseInstanceId = project.CaseInstanceId;

            NextTaskName = new List<string>();
            foreach (CamundaTask task in nextTasks)
                NextTaskName.Add(task.Name);
        }

    }
}
