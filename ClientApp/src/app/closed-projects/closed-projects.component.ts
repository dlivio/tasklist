import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Project } from '../project';

@Component({
  selector: 'app-closed-projects',
  templateUrl: './closed-projects.component.html',
  styleUrls: ['./closed-projects.component.css']
})
export class ClosedProjectsComponent implements OnInit {

  public projects: Project[];

  public visibleProjects: Project[];
  public search: string;

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router) { 
    this.projects = [];
    this.visibleProjects = [];
    this.search = "";

    http.get<Project[]>(baseUrl + 'api/Projects/Closed').subscribe(result => {
      this.projects = result;
      this.visibleProjects = this.projects;
    }, error => console.error(error));
  }

  ngOnInit(): void {
  }

  changeVisibleProjects() {
    let searchWord: string = this.search.trim().toLowerCase();
    this.visibleProjects = this.projects.filter(p => p.projectName.toLowerCase().includes(searchWord));
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
