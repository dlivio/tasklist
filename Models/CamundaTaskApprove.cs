using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Models
{
	public class CamundaTaskApprove
	{
		public Dictionary<string, PairKeyValue> Variables { get; set; }

		public bool WithVariablesInReturn { get; set; }

	}

	public class PairKeyValue
	{
		public string Value { get; set; }

	}
}
