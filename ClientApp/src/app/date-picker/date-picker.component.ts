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
  @Input() private selectedNode: BasicNode;
  // trigger to show the dateTime form on the parent component
  @Output() private closeDatePickerTrigger: EventEmitter<any> = new EventEmitter();
  
  private datePicker: HTMLInputElement;

  private _ref: ChangeDetectorRef;

  constructor(private ref: ChangeDetectorRef) { 
    this._ref = ref;
  }

  ngAfterViewInit() {
    this.datePicker = document.getElementById("task-completion-date-time") as HTMLInputElement;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.datePicker = document.getElementById("task-completion-date-time") as HTMLInputElement;

    // if no node is selected, change the current value to null
    if (changes.selectedNode.currentValue == null) {
      this.datePicker.value = null;
      return;
    } 
    
    let newSelectedNode: BasicNode = changes.selectedNode.currentValue;
    console.log("new node:");
    console.log(newSelectedNode);
    //let datePicker = document.getElementById("task-completion-date-time") as HTMLInputElement;

    if (newSelectedNode.completionTime == null) {
      // show the current time as the completion time
      let dateTimeUnparsed: Date = new Date();
      let dateTime: string = dateTimeUnparsed.toISOString().split(".")[0]; // remove the milliseconds to work on the form

      this.datePicker.value = dateTime;
      // insert the new value in the object
      this.selectedNode.completionTime = dateTimeUnparsed;
    
    } else {
      this.datePicker.value = newSelectedNode.completionTime.toISOString().split(".")[0];
    }

  }

  ngOnInit() {
  }

  saveChanges() {
    console.log("saved changes on element");
    this.datePicker = document.getElementById("task-completion-date-time") as HTMLInputElement;
    console.log(this.datePicker.value);
    this.selectedNode.completionTime = new Date(this.datePicker.value);
  }

  closeButton() {
    this.closeDatePickerTrigger.emit({});
  }

}
