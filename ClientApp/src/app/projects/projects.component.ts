import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationExtras } from '@angular/router';

import { Project } from '../project';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {

  public projects: Project[];

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router) {
    http.get<Project[]>(baseUrl + 'api/Projects').subscribe(result => {
      this.projects = result;
    }, error => console.error(error));
  }

  ngOnInit() {
  }

  goToProjectDetails(project: Project) {
    let navigationExtras: NavigationExtras = {
      state: {
        project: project
      }
    };
    this.router.navigate(['/project-details/' + project.id], navigationExtras);
  }

}
