import { Component, Inject, OnInit, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

import { Project } from '../project';
import { Task } from '../task';
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

    this.currentBaseUrl = baseUrl;

    // get the selected Project info
    if (this.router.getCurrentNavigation().extras.state) {
      console.log("by state");

      this.project = this.router.getCurrentNavigation().extras.state.project;

    } else { // retrieve the project by id from url

      console.log("by url");
      // get id from url
      this.activatedRoute.paramMap.subscribe(params => {
        this.projectId = params.get('projectId')
      })

      http.get<Project>(baseUrl + 'api/Projects/' + this.projectId).subscribe(result => {
        this.project = result;
      }, error => console.error(error));

    }

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
      this.project = new Project(result.id, result.projectName, result.startDate, result.isComplete, 
        result.caseInstanceId, result.nextTaskName);
    }, error => console.error(error));
  }

  handleImported(event) {

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
