export interface Task {
  id: string;
  taskName: string;
  projectId: string;
  completed: boolean;
}

/*
export class TasksToApprove {
  public activityIds: string[];// [activityId, completingDate]
  public variables: string[][];

  constructor(activityIds: string[], variables: string[][]) {
    this.activityIds = activityIds;
    this.variables = variables;
  }
}
*/

export class TasksToApprove {
  public tasks: string[][];// [activityId, completingDate]
  public variables: string[][];

  constructor(tasks: string[][], variables: string[][]) {
    this.tasks = tasks;
    this.variables = variables;
  }
}