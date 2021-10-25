using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Models
{
    public class Project
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("projectName")]
        public string ProjectName { get; set; }

        [BsonElement("licencePlate")]
        public string LicencePlate { get; set; }

        [BsonElement("startDate")]
        [DataType(DataType.Date)]
        public DateTime StartDate { get; set; }

        [BsonElement("isComplete")]
        public bool IsComplete { get; set; }

        [BsonElement("caseInstanceId")]
        public string CaseInstanceId { get; set; }

        [BsonElement("processInstanceIds")]
        public List<string> ProcessInstanceIds { get; set; }

        [BsonElement("lastProcessDefinitionId")]
        public string LastProcessDefinitionId { get; set; }

        public Project(string projectName, string licencePlate, DateTime startDate, string caseInstanceId)
        {
            ProjectName = projectName;
            LicencePlate = licencePlate;
            StartDate = startDate;
            IsComplete = false;
            CaseInstanceId = caseInstanceId;
            ProcessInstanceIds = new List<string>();
            LastProcessDefinitionId = null;
        }
    }
}
