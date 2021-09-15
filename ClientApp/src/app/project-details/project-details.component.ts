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
  public projectId: string;
  public tasksForApproval: Task[];

  title = 'bpmn-js-angular';
  diagramUrl = '';//'https://cdn.staticaly.com/gh/bpmn-io/bpmn-js-examples/dfceecba/starter/diagram.bpmn';
  importError?: Error;

  camundaCaseInstanceId = "";

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router, private activatedRoute: ActivatedRoute) {

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

    console.log(this.project);

    // get the correct diagram for the instance
    this.diagramUrl = baseUrl + 'api/Projects/' + this.project.caseInstanceId + '/Diagram';
    console.log(this.diagramUrl);

    // fill the Camunda's caseInstanceId
    this.camundaCaseInstanceId = this.project.caseInstanceId;

  }

  ngOnInit() {
  }

  submitTasks() {
    console.log("Submit tasks was clicked");
    console.log(this.project.id);
    this.diagramComponent.submitTasks(this.project.id);
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
