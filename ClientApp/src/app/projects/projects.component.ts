import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {

  public projects: Project[];

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string) {
    http.get<Project[]>(baseUrl + '/api/Projects').subscribe(result => {
      this.projects = result;
    }, error => console.error(error));
  }

  ngOnInit() {
  }

}

interface Project {
  Id: string;
  ProjectName: string;
  StartDate: string;
  CompletedTasks: string[];
  TasksForApproval: string[];
  IsComplete: boolean;
}
