import {
  AfterContentInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  SimpleChanges,
  EventEmitter,
  ViewEncapsulation
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';

/**
 * You may include a different variant of BpmnJS:
 *
 * bpmn-viewer  - displays BPMN diagrams without the ability
 *                to navigate them
 * bpmn-modeler - bootstraps a full-fledged BPMN editor
 */
import * as BpmnJS from 'src/app/diagram/bpmn-navigated-viewer.development.js';

import { from, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-diagram',
  template: `
    <div #ref class="diagram-container"></div>
  `,
  styles: [
    `
      .diagram-container {
        height: 100%;
        width: 100%;
      }
    `
  ]
})
export class DiagramComponent implements AfterContentInit, OnChanges, OnDestroy {
  private bpmnJS: BpmnJS;
  @ViewChild('ref', { static: true }) private el: ElementRef;
  @Output() private importDone: EventEmitter<any> = new EventEmitter();

  @Input() private url: string;

  private events = [
    'element.click'
  ];

  private nextPossibleIds: string[];
  private clickedIds: string[];

  constructor(private http: HttpClient) {

    // retrieve current task to complete from the process instance
     

    // get current diagram from json of the task

    // retrieve process instance history

    // color in the diagram all the tasks from the history from that specific diagram


    this.bpmnJS = new BpmnJS();

    this.bpmnJS.on('import.done', ({ error }) => {
      if (!error) {
        this.bpmnJS.get('canvas').zoom('fit-viewport');
      }

      var elementRegistry = this.bpmnJS.get('elementRegistry');
      console.log("elements");

      // get the start event of the diagram
      var foundEl = elementRegistry.filter(function (el) { return el.type == "bpmn:StartEvent" })[0];

      foundEl.outgoing.forEach(function (connectedElem) { console.log(connectedElem) });

      console.log(foundEl);
      console.log("end elements");
    });

    var eventBus = this.bpmnJS.get('eventBus');

    var canvas = this.bpmnJS.get('canvas');


    this.events.forEach(function (event) {

      eventBus.on(event, function (e) {
        // e.element = the model element
        // e.gfx = the graphical element
        console.log(event, 'on', e.element.type);

        if (e.element.type == "bpmn:Task") {
          if (!canvas.hasMarker(e.element.id, 'highlight')) {
            canvas.addMarker(e.element.id, 'highlight');
            
          } else {
            canvas.removeMarker(e.element.id, 'highlight');

          }
          
        }

        console.log(event, 'on', e.element);

      });
    });
  }

  ngAfterContentInit(): void {
    this.bpmnJS.attachTo(this.el.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    // re-import whenever the url changes
    if (changes.url) {
      this.loadUrl(changes.url.currentValue);
    }
  }

  ngOnDestroy(): void {
    this.bpmnJS.destroy();
  }

  /**
   * Load diagram from URL and emit completion event
   */
  loadUrl(url: string): Subscription {

    return (
      this.http.get(url, { responseType: 'text' }).pipe(
        switchMap((xml: string) => this.importDiagram(xml)),
        map(result => result.warnings),
      ).subscribe(
        (warnings) => {
          this.importDone.emit({
            type: 'success',
            warnings
          });
        },
        (err) => {
          this.importDone.emit({
            type: 'error',
            error: err
          });
        }
      )
    );
  }

  /**
   * Creates a Promise to import the given XML into the current
   * BpmnJS instance, then returns it as an Observable.
   *
   * @see https://github.com/bpmn-io/bpmn-js-callbacks-to-promises#importxml
   */
  private importDiagram(xml: string): Observable<{ warnings: Array<any> }> {
    return from(this.bpmnJS.importXML(xml) as Promise<{ warnings: Array<any> }>);
  }
}
