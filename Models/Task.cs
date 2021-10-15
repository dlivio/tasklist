using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Models
{
    public class Task
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("activityId")]
        public string ActivityId { get; set; }

        [BsonElement("processInstanceId")]
        public string ProcessInstanceId { get; set; }

        [BsonElement("startTime")]
        public DateTime StartTime { get; set; }

        [BsonElement("completionTime")]
        public DateTime CompletionTime { get; set; }

        public Task(string activityId, string processInstanceId, string startTime, string completionTime)
		{
            this.ActivityId = activityId;
            this.ProcessInstanceId = processInstanceId;
            this.StartTime = DateTime.Parse(startTime);
            this.CompletionTime = DateTime.Parse(completionTime);
		}
    }
}
