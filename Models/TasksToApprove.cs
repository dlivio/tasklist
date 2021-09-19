using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Models
{
	public class TasksToApprove
	{
		public string[] ActivityIds { get; set; }
		public string[][] Variables { get; set; }
	}
}
