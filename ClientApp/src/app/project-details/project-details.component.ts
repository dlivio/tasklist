import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

import { Project } from '../project';
import { Task } from '../task';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {

  public project: Project;
  public projectId: string;
  public tasksForApproval: Task[];

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router, private activatedRoute: ActivatedRoute) {

    // get the selected Project info
    if (this.router.getCurrentNavigation().extras.state) {
      this.project = this.router.getCurrentNavigation().extras.state.project;
      console.log(this.project);

    } else { // retrieve the project by id from url
      // get id from url
      this.activatedRoute.paramMap.subscribe(params => {
        this.projectId = params.get('projectId')
      })

      http.get<Project>(baseUrl + 'api/Projects/' + this.projectId).subscribe(result => {
        this.project = result;
      }, error => console.error(error));

    }
    
  }

  ngOnInit() {
  }

}

