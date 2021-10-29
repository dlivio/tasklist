export interface Task {
  id: string;
  taskName: string;
  projectId: string;
  completed: boolean;
}

export class TasksToApprove {
  public tasks: string[][];
  public variables: string[][];
  public startEventTriggers: string[];

  constructor(tasks: string[][], variables: string[][], startEventTriggers: string[]) {
    this.tasks = tasks;
    this.variables = variables;
    this.startEventTriggers = startEventTriggers;
  }
}

export interface PredictedTasks {
  activityId: string;
  startTime: string;
  endTime: string;
}

export interface CompletedHistoryTasks {
  activityName: string;
  startTime: string;
  completionTime: string;
}