using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Models
{
	public class SensorTask
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
    }
}
