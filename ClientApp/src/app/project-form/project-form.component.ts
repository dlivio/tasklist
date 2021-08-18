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

  constructor(http: HttpClient, @Inject('BASE_URL') baseUrl: string, private router: Router) {
    this.client = http;
    this.baseUrl = baseUrl;
  }

  model = new Project("-1", "", "", false, "");

  projectName: string = "";

  onSubmit() {
    this.projectName = (<HTMLInputElement>document.getElementById("projectName")).value;

    if (this.projectName == "") {
      alert("Project name needed.");
      return;
    }

    let proj = new ProjectForm(this.projectName, new Date().toISOString());

    // change to post
    this.client.post<ProjectForm>(this.baseUrl + 'api/Projects', proj).subscribe(result => {
      let response = result
      console.log(response);
    }, error => console.error(error));

    console.log(this.projectName);
  }

  ngOnInit() {
  }

}
