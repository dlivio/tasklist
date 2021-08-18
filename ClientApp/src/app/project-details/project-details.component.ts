import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

import { Project } from '../project';
import { Task } from '../task';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
  ,
  encapsulation: ViewEncapsulation.None
})
export class ProjectDetailsComponent implements OnInit {

  public project: Project;
  public projectId: string;
  public tasksForApproval: Task[];

  title = 'bpmn-js-angular';
  diagramUrl = 'https://cdn.staticaly.com/gh/bpmn-io/bpmn-js-examples/dfceecba/starter/diagram.bpmn';
  importError?: Error;

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router, private activatedRoute: ActivatedRoute) {

    http.get<Task[]>(baseUrl + 'api/Tasks/ProjectIdActive/' + this.projectId).subscribe(result => {
      this.tasksForApproval = result;
      //console.error(this.tasksForApproval);
    }, error => console.error(error));


    // get the selected Project info
    if (this.router.getCurrentNavigation().extras.state) {
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

    http.get<Task[]>(baseUrl + 'api/Tasks/ProjectIdActive/' + this.projectId).subscribe(result => {
      this.tasksForApproval = result;
      //console.error(this.tasksForApproval);
    }, error => console.error(error));
    
  }

  ngOnInit() {
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
