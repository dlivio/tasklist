/*
export interface Project {
  id: string;
  projectName: string;
  startDate: string;
  isComplete: boolean;
  nextTaskName: string;
}
*/

export class Project {
  constructor(
    public id: string,
    public projectName: string,
    public startDate: string,
    public isComplete: boolean,
    public nextTaskName: string
  ) { }
}


export class ProjectForm {
  projectName: string;
  public startDate: string;

  constructor(projectName: string, startDate: string) {
    this.projectName = projectName;
    this.startDate = startDate;
  }
}
