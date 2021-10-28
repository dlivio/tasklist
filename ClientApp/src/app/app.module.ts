import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { DiagramComponent } from './diagram/diagram.component';
import { ProjectFormComponent } from './project-form/project-form.component';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { ClosedProjectsComponent } from './closed-projects/closed-projects.component';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    ProjectsComponent,
    ProjectDetailsComponent,
    DiagramComponent,
    ProjectFormComponent,
    DatePickerComponent,
    ClosedProjectsComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      /*
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'counter', component: CounterComponent },
      { path: 'fetch-data', component: FetchDataComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'projects/new', component: ProjectFormComponent },
      { path: 'project-details/:projectId', component: ProjectDetailsComponent }
      */
      { path: '', component: ProjectsComponent, pathMatch: 'full' },
      { path: 'closed', component: ClosedProjectsComponent },
      { path: 'projects/new', component: ProjectFormComponent },
      { path: 'project-details/:projectId', component: ProjectDetailsComponent }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
