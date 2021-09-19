export interface Task {
  id: string;
  taskName: string;
  projectId: string;
  completed: boolean;
}

export class TasksToApprove {
  public activityIds: string[];
  public variables: string[][];//Map<string, string>;

  constructor(activityIds: string[], variables: string[][]) {
    this.activityIds = activityIds;
    this.variables = variables;
  }
}
