using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Models
{
	public class AmazonS3SensorInfo
	{
		public string BoxId { get; set; }
		public int Location { get; set; }
		public List<string> Event { get; set; }
		public long StartTimestamp { get; set; }
		public long EndTimestamp { get; set; }
	}
}
