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
        [BsonElement("startDate")]
        [DataType(DataType.Date)]
        public DateTime StartDate { get; set; }
        [BsonElement("completedTasksIds")]
        public List<String> CompletedTasks { get; set; }
        [BsonElement("taskForApprovalIds")]
        public List<String> TasksForApproval { get; set; }
        [BsonElement("isComplete")]
        public bool IsComplete { get; set; }
    }
}
