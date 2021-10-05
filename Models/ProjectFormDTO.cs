using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace tasklist.Models
{
    public class ProjectFormDTO
    {
        public string ProjectName { get; set; }

        public string ClientExpectation { get; set; }

        public bool OriginalMaterials { get; set; }

        public bool CarDocuments { get; set; }

        public DateTime StartDate { get; set; }
    }
}
