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
        [BsonElement("taskName")]
        public string TaskName { get; set; }
        [BsonElement("parentId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ParentId { get; set; }
    }
}
