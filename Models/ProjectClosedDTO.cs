using System;
using System.Collections.Generic;

namespace tasklist.Models
{
    public class ProjectClosedDTO
    {
        public string Id { get; set; }
        public string ProjectName { get; set; }
        public string LicencePlate { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsComplete { get; set; }
        public string CaseInstanceId { get; set; }

        public ProjectClosedDTO(Project project)
        {
            Id = project.Id;
            ProjectName = project.ProjectName;
            LicencePlate = project.LicencePlate;
            StartDate = project.StartDate;
            EndDate = project.EndDate;
            IsComplete = project.IsComplete;
            CaseInstanceId = project.CaseInstanceId;
        }

    }
}
