import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { BasicNode } from '../basic-node';
import { DiagramNode } from '../diagram-node';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnInit {
  // node of which the date in the date picker relates to
  @Input() public selectedNode: BasicNode|null = null;
  // trigger to show the dateTime form on the parent component
  @Output() private closeDatePickerTrigger: EventEmitter<any> = new EventEmitter();
  
  private startDatePicker: HTMLInputElement|undefined = undefined;
  private completedDatePicker: HTMLInputElement|undefined = undefined;

  // number of days between the start and end date
  public dayDifference: number;
  // remaining time after the 'dayDifference' in hours
  public hourDifference: number;
  // remaining time after the 'hourDifference' in minute
  public minuteDifference: number;

  // error triggered by dayDifference < 0 || hourDifference < 0 || minuteDifference < 0
  public error: boolean;

  constructor() { 
    this.dayDifference = 0;
    this.hourDifference = 0;
    this.minuteDifference = 0;
    this.error = false;
  }

  ngAfterViewInit() {
    this.startDatePicker = document.getElementById("task-completion-date-time") as HTMLInputElement;
    this.completedDatePicker = document.getElementById("task-start-date-time") as HTMLInputElement;

    // update the values displayed at the start
    this.updateDateDifference();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.startDatePicker = document.getElementById("task-start-date-time") as HTMLInputElement;
    this.completedDatePicker = document.getElementById("task-completion-date-time") as HTMLInputElement;

    // if no node is selected, change the current value to null
    if (changes.selectedNode.currentValue == null) {
      this.startDatePicker.value = "";
      this.completedDatePicker.value = "";
      return;
    } 
    
    let newSelectedNode: BasicNode = changes.selectedNode.currentValue;
    if (newSelectedNode != null) {
      this.startDatePicker.value = newSelectedNode.startTime!.toISOString().split(".")[0];
      this.completedDatePicker.value = newSelectedNode.completionTime!.toISOString().split(".")[0];
    }

  }

  ngOnInit() {
  }

  saveChanges() {
    this.startDatePicker = document.getElementById("task-start-date-time") as HTMLInputElement;
    this.selectedNode!.startTime = new Date(this.startDatePicker.value);

    this.completedDatePicker = document.getElementById("task-completion-date-time") as HTMLInputElement;
    this.selectedNode!.completionTime = new Date(this.completedDatePicker.value);

    this.updateDateDifference();
  }

  closeButton() {
    this.closeDatePickerTrigger.emit({});
  }

  /**
   * 
   */
  private updateDateDifference() {
    let difference: number = this.selectedNode!.completionTime!.getTime() - this.selectedNode!.startTime!.getTime();
    
    let differenceInDays: number = difference / (1000 * 60 * 60 * 24);
    this.dayDifference = Math.floor(differenceInDays);
    
    let differenceOfHours = (differenceInDays - this.dayDifference) * 24;
    this.hourDifference = Math.floor(differenceOfHours);
    
    this.minuteDifference = Math.round((differenceOfHours - this.hourDifference) * 60);

    // catch the error of the completionDate < startDate
    if (this.dayDifference < 0 || this.hourDifference < 0 || this.minuteDifference < 0) 
      this.error = true;
    else
      this.error = false;
  }

}
