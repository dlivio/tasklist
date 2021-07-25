export interface Task {
  id: string;
  projectName: string;
  startDate: string;
  completedTasks: string[];
  tasksForApproval: string[];
  isComplete: boolean;
}
