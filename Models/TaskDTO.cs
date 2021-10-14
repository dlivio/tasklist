namespace tasklist.Models
{
    public class TaskDTO
    {
        public string Id { get; set; }

        public string TaskName { get; set; }

        public string ProjectId { get; set; }

        public bool Completed { get; set; }

        /*
        public TaskDTO(Task task)
        {
            Id = task.Id;
            TaskName = task.TaskName;
            ProjectId = task.ProjectId;
            Completed = task.Completed;
        }
        */
    }
}
