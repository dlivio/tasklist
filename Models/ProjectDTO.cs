using System;

namespace tasklist.Models
{
    public class ProjectDTO
    {
        public string Id { get; set; }

        public string ProjectName { get; set; }

        public DateTime StartDate { get; set; }

        public long NoTasksCompleted { get; set; }

        public long NoTasksToApprove { get; set; }

        public bool IsComplete { get; set; }

        public ProjectDTO(Project project, long noTasksCompleted, long noTasksToApprove)
        {
            Id = project.Id;
            ProjectName = project.ProjectName;
            StartDate = project.StartDate;
            IsComplete = project.IsComplete;
            NoTasksCompleted = noTasksCompleted;
            NoTasksToApprove = noTasksToApprove;
        }

    }
}
