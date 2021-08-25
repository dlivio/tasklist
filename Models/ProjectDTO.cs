using System;

namespace tasklist.Models
{
    public class ProjectDTO
    {
        public string Id { get; set; }

        public string ProjectName { get; set; }

        public DateTime StartDate { get; set; }

        public bool IsComplete { get; set; }

        public string CaseInstanceId { get; set; }

        public string NextTaskName { get; set; }

        public ProjectDTO(Project project, string nextTaskName)
        {
            Id = project.Id;
            ProjectName = project.ProjectName;
            StartDate = project.StartDate;
            IsComplete = project.IsComplete;
            CaseInstanceId = project.CaseInstanceId;
            NextTaskName = nextTaskName;
        }

    }
}
