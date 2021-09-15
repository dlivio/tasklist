export interface Task {
  id: string;
  taskName: string;
  projectId: string;
  completed: boolean;
}

export class TasksToApprove {
  public activityIds: string[];
  public variables: Map<string, string>;

  constructor(activityIds: string[], variables: Map<string, string>) {
    this.activityIds = activityIds;
    this.variables = variables;
  }
}
