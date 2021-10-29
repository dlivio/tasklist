import { Component, Inject, OnInit, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

import { Project } from '../project';
import { CompletedHistoryTasks, Task } from '../task';
import { DiagramXML } from '../diagram';
import { DiagramComponent } from '../diagram/diagram.component';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
  ,
  encapsulation: ViewEncapsulation.None
})
export class ProjectDetailsComponent implements OnInit {

  @ViewChild(DiagramComponent, {static: false})
  private diagramComponent!: DiagramComponent;

  public project: Project;
  public projectName: string;
  public projectLicencePlate: string;
  public projectStartDate: string;
  public projectStartTime: string;
  public projectId: string;
  public tasksForApproval: Task[];

  title = 'bpmn-js-angular';
  diagramUrl = '';//'https://cdn.staticaly.com/gh/bpmn-io/bpmn-js-examples/dfceecba/starter/diagram.bpmn';
  importError?: Error;

  camundaCaseInstanceId = "";

  private currentBaseUrl: string;

  constructor(private http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router, private activatedRoute: ActivatedRoute) {
    this.project = new Project("-1", "", "", "", false, "", []);
    this.projectId = this.project.id;
    this.tasksForApproval = [];

    this.currentBaseUrl = baseUrl;

    // get the selected Project info
    if (this.router != null && this.router.getCurrentNavigation()?.extras.state) {
      console.log("by state");

      this.project = this.router.getCurrentNavigation()!.extras.state!.project;

    } else { // retrieve the project by id from url

      console.log("by url");
      // get id from url
      this.activatedRoute.paramMap.subscribe(params => {
        var tmpProjectId: string| null = params.get('projectId');
        if (tmpProjectId != null)
          this.projectId = tmpProjectId;
      })

      http.get<Project>(baseUrl + 'api/Projects/' + this.projectId).subscribe(result => {
        this.project = result;
      }, error => console.error(error));

    }

    this.projectName = this.project.projectName;
    this.projectLicencePlate = this.project.licencePlate;

    let startDateTime: string[] = this.project.startDate.split("T");
    this.projectStartDate = startDateTime[0];
    this.projectStartTime = startDateTime[1].substring(0, 8);

    console.log(this.project);

    // get the correct diagram for the instance
    this.diagramUrl = baseUrl + 'api/Projects/' + this.project.caseInstanceId + '/Diagram';
    console.log(this.diagramUrl);

    // fill the Camunda's caseInstanceId
    this.camundaCaseInstanceId = this.project.caseInstanceId;

  }

  setDate(): void {
    alert("it works parent");
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    /*
    var columnOfDiagram = document.getElementsByTagName("app-diagram")[0];
    if (columnOfDiagram != null || columnOfDiagram != undefined) {
      columnOfDiagram.addEventListener("contextmenu", (e) => { 
        e.preventDefault();
        alert("hello");
      });
    }
    */
  }

  submitTasks() {
    console.log("Submit tasks was clicked");
    console.log(this.project.id);
    if (this.diagramComponent.submitTasks(this.project.id) ) {
      this.diagramUrl = this.currentBaseUrl + 'api/Projects/' + this.project.caseInstanceId + '/Diagram';
    }

    this.http.get<Project>(this.currentBaseUrl + 'api/Projects/' + this.project.id).subscribe(result => {
      this.project = new Project(result.id, result.licencePlate, result.projectName, result.startDate, result.isComplete, 
        result.caseInstanceId, result.nextTaskName);
    }, error => console.error(error));
  }

  downloadProjectHistory() {
    var completedHistoryTasks: CompletedHistoryTasks[] = [];

    this.http.get<CompletedHistoryTasks[]>(this.currentBaseUrl + 'api/Tasks/' + this.camundaCaseInstanceId + "/History").subscribe(result => {
      completedHistoryTasks = result;

    }, error => console.error(error)
    , () => {
      // auxiliary button to build the file contents and avoid the user having to click x2 times
      var ghostDownload = document.createElement("a");

      // get the button from the diagram
      //var downloadButton: HTMLAnchorElement =  (document.getElementById("download-history") as HTMLAnchorElement);

      var filename = this.camundaCaseInstanceId + "-history.txt";
      var filetype = "text/plain";

      var fileContents = "";
      
      // fill the start of the file with car info
      fileContents = fileContents + this.projectName + '\n'; // Car make and model
      fileContents = fileContents + '\n'; // Blank line
      fileContents = fileContents + "Licence Plate: " + this.projectLicencePlate + '\n'; // Licence plate
      fileContents = fileContents + "Start Date: " + this.projectStartDate + " - " + this.projectStartTime + '\n'; // Start date
      if (this.project.isComplete)
        fileContents = fileContents + "Completion Date: " + this.projectStartDate + " - " + this.projectStartTime + '\n'; // Completion date
      else
        fileContents = fileContents + "Completion Date: " + "ongoing project" + '\n'; 
      fileContents = fileContents + '\n'; // Blank line

      fileContents = fileContents + "Timeline of completed activities:" + '\n'; // Activities title
      fileContents = fileContents + '\n'; // Blank line

      // fill the completed tasks
      completedHistoryTasks.forEach(t => {
        fileContents = fileContents + t.activityName + '\n'; // Activity name

        let startDateTime: string[] = t.startTime.split("T");
        let projectStartDate = startDateTime[0];
        let projectStartTime = startDateTime[1].substring(0, 8);

        fileContents = fileContents + " - Started at: " + projectStartDate + " - " + projectStartTime + '\n'; // Start time

        let endDateTime: string[] = t.completionTime.split("T");
        let projectEndDate = endDateTime[0];
        let projectEndTime = endDateTime[1].substring(0, 8);

        fileContents = fileContents + " - Finished at: " + projectEndDate + " - " + projectEndTime + '\n'; // End time
        fileContents = fileContents + '\n'; // Blank line
      });

      var dataURI = "data:" + filetype + ";base64," + btoa(fileContents);
      ghostDownload.href = dataURI;
      ghostDownload['download'] = filename;
      // "click" the ghost button when the info is built
      ghostDownload.click();
      // delete the element
      ghostDownload.remove();
    });

  }

  handleImported(event: any) {

    const {
      type,
      error,
      warnings
    } = event;

    if (type === 'success') {
      console.log(`Rendered diagram (%s warnings)`, warnings.length);
    }

    if (type === 'error') {
      console.error('Failed to render diagram', error);
    }

    this.importError = error;
  }

}
