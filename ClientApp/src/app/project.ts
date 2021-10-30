export class Project {
  constructor(
    public id: string,
    public projectName: string,
    public licencePlate: string,
    public startDate: string,
    public endDate: string,
    public isComplete: boolean,
    public caseInstanceId: string,
    public nextTaskName: string[]
  ) { }
}


export class ProjectForm {
  constructor(
    public projectName: string,
    public licencePlate: string,
    public clientExpectation: string,
    public originalMaterials: boolean,
    public carDocuments: boolean,
    public startDate: string
  ) { }
}

