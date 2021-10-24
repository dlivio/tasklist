import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, NavigationExtras } from '@angular/router';

import { Project } from '../project';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {

  public projects: Project[];

  public visibleProjects: Project[];
  public search: string = "";

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router) {
    http.get<Project[]>(baseUrl + 'api/Projects').subscribe(result => {
      this.projects = result;
      this.visibleProjects = this.projects;
    }, error => console.error(error));

  }

  ngOnInit() {
  }

  changeVisibleProjects() {
    let searchWord: string = this.search.trim();
    this.visibleProjects = this.projects.filter(p => p.projectName.includes(searchWord));
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
