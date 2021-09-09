import { getLocaleDateTimeFormat } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Project, ProjectForm } from '../project';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css']
})
export class ProjectFormComponent implements OnInit {

  public client: HttpClient;
  public baseUrl: string;
  public route: Router;

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router) {
    this.client = http;
    this.baseUrl = baseUrl;
    this.route = router;
  }

  model = new Project("-1", "", "", false, "", []);

  projectName: string = "";

  onSubmit() {
    this.projectName = (<HTMLInputElement>document.getElementById("projectName")).value;

    // disallow submitting without writting a name
    if (this.projectName == "") {
      alert("Project name can't be empty.");
      return;
    }

    // build an object with the project name and creation datetime
    let proj = new ProjectForm(this.projectName, new Date().toISOString());

    // 
    this.client.post<ProjectForm>(this.baseUrl + 'api/Projects', proj).subscribe(result => {
      let response = result;
      this.route.navigate(['/projects']);
    }, error => console.error(error));

  }

  ngOnInit() {
  }

}
