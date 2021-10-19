using System;

namespace tasklist.Models
{
	public class ProjectFormDTO
    {
        public string ProjectName { get; set; }
        public string LicencePlate { get; set; }
        public string ClientExpectation { get; set; }
        public bool OriginalMaterials { get; set; }
        public bool CarDocuments { get; set; }
        public DateTime StartDate { get; set; }
    }
}
