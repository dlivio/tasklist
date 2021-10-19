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

  model = new Project("-1", "", "", "", false, "", []);

  projectName: string = "";
  licencePlate: string = "";
  clientExpectation: string = "";
  originalMaterials: boolean = false;
  carDocuments: boolean = false;

  onSubmit() {

    this.projectName = (<HTMLInputElement>document.getElementById("projectName")).value;

    // disallow submitting without writting a name
    if (this.projectName.trim() == "") 
      return document.getElementById("projectNameEmpty").innerHTML = "Project name can't be empty"; 
    else 
      document.getElementById("projectNameEmpty").innerHTML = "";

    this.licencePlate = (<HTMLInputElement>document.getElementById("licencePlate")).value;
    
    // disallow submitting without writting a license plate
    if (this.licencePlate.trim() == "") 
      return document.getElementById("licencePlateEmpty").innerHTML = "Vehicle's license plate can't be empty"; 
    else 
      document.getElementById("licencePlateEmpty").innerHTML = "";
    

    this.clientExpectation = (<HTMLInputElement>document.getElementById("clientExpectation")).value;
    this.originalMaterials = (<HTMLInputElement>document.getElementById("originalMaterials")).checked;
    this.carDocuments = (<HTMLInputElement>document.getElementById("carDocuments")).checked;

    // build an object with the project name and creation datetime
    let proj = new ProjectForm(this.projectName, this.licencePlate, this.clientExpectation, this.originalMaterials, 
      this.carDocuments, new Date().toISOString());

    // 
    this.client.post<ProjectForm>(this.baseUrl + 'api/Projects', proj).subscribe(result => {
      let response = result;
      this.route.navigate(['/projects']);
    }, error => console.error(error));

  }

  ngOnInit() {
  }

}
