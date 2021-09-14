using System.Collections.Generic;

namespace tasklist.Models
{
	public class HistoryTasks
	{
		public IEnumerable<string> CurrentActivityIds { get; set; }
		public IEnumerable<string> HistoryActivityIds { get; set; }

		public HistoryTasks(IEnumerable<string> currentActivityIds, IEnumerable<string> historyActivityIds)
		{
			this.CurrentActivityIds = currentActivityIds;
			this.HistoryActivityIds = historyActivityIds;
		}
	}
}