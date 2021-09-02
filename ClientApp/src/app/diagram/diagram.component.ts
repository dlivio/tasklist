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
  ViewEncapsulation,
  Inject
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
import { BasicNode } from '../basic-node';
import { DiagramNode } from '../diagram-node';
import { ExclusiveNode } from '../exclusive-node';
import { InclusiveNode } from '../inclusive-node';
import { ParallelNode } from '../parallel-node';

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

  @Input() private caseInstanceId: string;

  private events = [
    'element.click'
  ];

  // the history of activity id's of the current diagram
  private taskHistoryIds: string[];
  // the current task activity id available to click
  private currentTaskIds: string[];

  private tasksToSubmit: string[];

  private currentNode: DiagramNode;

  constructor(private http: HttpClient, @Inject('BASE_URL') baseUrl: string) {
     
    this.taskHistoryIds = [];
    this.currentTaskIds = [];
    this.tasksToSubmit = [];

    // retrieve process instance history

    // color in the diagram all the tasks from the history from that specific diagram

    this.bpmnJS = new BpmnJS();

    var eventBus = this.bpmnJS.get('eventBus');

    var canvas = this.bpmnJS.get('canvas');

    this.bpmnJS.on('import.done', ({ error }) => {
      if (!error) {
        this.bpmnJS.get('canvas').zoom('fit-viewport');
      }
      
      var elementRegistry = this.bpmnJS.get('elementRegistry');

      // get the tasks completed in the current diagram
      http.get<string[]>(baseUrl + 'api/Projects/' + this.caseInstanceId + '/Diagram/History').subscribe(result => {

        this.taskHistoryIds = result;

        // remove the current task to be approved from the list and save it
        this.currentTaskIds.push(this.taskHistoryIds.pop());                                // TODO: needs to be changed to retrieve current tasks

        console.log(this.currentTaskIds);
        console.log(this.currentTaskIds[0]);

        // filter the elements in the diagram to limit those who are clickable
        var tasksFound = elementRegistry.filter(function (el) {
          return (el.type == "bpmn:Task" || el.type == "bpmn:UserTask" || el.type == "bpmn:ManualTask")
        });
        // add color to all the elements in the history
        for (let i = 0; i < tasksFound.length; i++) {
          if (result.indexOf(tasksFound[i].id) > -1) { //&& !canvas.hasMarker(tasksFound[i].id, 'highlight-history')) {
            canvas.addMarker(tasksFound[i].id, 'highlight-history');
          }

        }

      }, error => console.error(error)
        , () => { // on complete this path is activated

          // get the start event of the diagram
          var foundEl = elementRegistry.filter(el => el.id == this.currentTaskIds[0])[0];

          this.currentNode = this.parseNode(foundEl);

          console.log(this.currentNode);

        });

     

      // build the node graph

      var nodes: Array<DiagramNode> = new Array<DiagramNode>(10);

      var currentNode: DiagramNode;


      /*
      tasksFound.forEach(function (task) {
        if (this.taskHistoryIds.indexOf(task.id) > -1 && !canvas.hasMarker(task.id, 'highlight')) {
          canvas.addMarker(task.id, 'highlight');
        }
      });
      */

    });

    this.events.forEach(event => {

      eventBus.on(event, e => {
        // e.element = the model element
        // e.gfx = the graphical element
        console.log(event, 'on', e.element.type);

        if ((e.element.type == "bpmn:Task" || e.element.type == "bpmn:UserTask" || e.element.type == "bpmn:ManualTask")
          && !canvas.hasMarker(e.element.id, 'highlight-history')) {

          if (!canvas.hasMarker(e.element.id, 'highlight')) {
            canvas.addMarker(e.element.id, 'highlight');
            this.tasksToSubmit.push(e.element.id);

          } else {
            canvas.removeMarker(e.element.id, 'highlight');
            this.tasksToSubmit = this.tasksToSubmit.filter(t => t != e.element.id);
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

  /**
   * 
   * @param node 
   * @param stoppingNode, the criteria to stop parsing the node
   * @returns 
   */
  private parseNode(node: any, stoppingNode: any = null): DiagramNode {

    if (stoppingNode != null) {
      console.log("current parse: " + node.id + " stopping parse: " + stoppingNode.id);
    }
    

    if (stoppingNode != null && node.id == stoppingNode.id) return null; 

    var nodeType: string = this.getNodeType(node);

    console.log("before switch");
    console.log(node);

    switch (nodeType) {
      case "bpmn:UserTask":
        return this.parseUserTask(node, stoppingNode);
        break;
      case "bpmn:ExclusiveGateway":
        return this.parseExclusiveGateway(node, stoppingNode);
        break;
      case "bpmn:InclusiveGateway":
        return this.parseInclusiveGateway(node, stoppingNode);
        break;
      case "bpmn:ParallelGateway":
        return this.parseParallelGateway(node, stoppingNode);
        break;
      case "bpmn:SequenceFlow":
        return this.parseNode(this.getSequenceFlowOutgoing(node), stoppingNode);
        break;
      case "bpmn:EndEvent":
        return null;
        break;
      default:
        console.log("Andre says Oi");
        break;
    }
  }

  /**
   * 
   * @param sequenceFlowNode
   */
  private getSequenceFlowOutgoing(sequenceFlowNode: any): any {
    if (sequenceFlowNode.businessObject != undefined) {
      return sequenceFlowNode.businessObject.targetRef;
    }
    return sequenceFlowNode.targetRef;
  }

  /**
   *
   * @param node
   */
  private getNodeType(node: any): string {
    console.log(node);

    var nodeType: string = node.type;
    if (nodeType == undefined) {
      nodeType = node.$type;
    }

    return nodeType;
  }

  private parseUserTask(node: any, stoppingNode: any = null): DiagramNode {
    var nextNode: DiagramNode = this.parseNode(node.outgoing[0], stoppingNode);

    return new BasicNode(nextNode, false, node.id);
  }

  /**
   * Auxiliar method to retrieve the object containing the joining gateway of the requested type.
   * 
   * @param beginningGatewayNode
   * @param gatewayType
   */
  private getLastGateway(beginningGatewayNode: any, gatewayType: string): any {
    console.log("inside last gateway");
    console.log(beginningGatewayNode);

    var node = beginningGatewayNode.outgoing[0];
    var nodeDepth: number = 1;

    console.log(node);
    console.log("before while");

    while (nodeDepth > 0) {
      var nodeType: string = this.getNodeType(node);
      console.log("type: " + nodeType);

      if (nodeType == gatewayType) {
        if (node.outgoing.length == 1) {
          nodeDepth--;
        } else {
          nodeDepth++;
        }
        // if the stopping condition is reached, don't override current found node
        if (nodeDepth != 0) node = node.outgoing[0];

      } else if (nodeType == "bpmn:SequenceFlow") {
        node = this.getSequenceFlowOutgoing(node);
      } else {
        console.log("error here");
        console.log(node);
        node = node.outgoing[0];
      }
      console.log(node);
    }
    console.log("after while");
    console.log("last gateway result");
    console.log(node);

    return node;
  }

  private parseExclusiveGateway(node: any, stoppingNode: any = null): DiagramNode {
    var endGateway = this.getLastGateway(node, this.getNodeType(node));

    var branches: Array<DiagramNode> = new Array<DiagramNode>();
    node.outgoing.forEach(obj => {
      branches.push(this.parseNode(obj, endGateway));
      console.log("for each branch end");
    });

    var nextNode: DiagramNode = this.parseNode(endGateway.outgoing[0], stoppingNode);

    return new ExclusiveNode(nextNode, false, branches);
  }

  private parseInclusiveGateway(node: any, stoppingNode: any = null): DiagramNode {
    var endGateway = this.getLastGateway(node, this.getNodeType(node));

    var branches: Array<DiagramNode> = new Array<DiagramNode>();
    node.outgoing.forEach(obj => {
      console.log("branch here: ");
      console.log(obj);
      branches.push(this.parseNode(obj, endGateway));
      console.log("for each branch end");
    });

    var nextNode: DiagramNode = this.parseNode(endGateway.outgoing[0], stoppingNode);

    return new InclusiveNode(nextNode, false, branches);
  }

  private parseParallelGateway(node: any, stoppingNode: any = null): DiagramNode {
    var endGateway = this.getLastGateway(node, this.getNodeType(node));

    var branches: Array<DiagramNode> = new Array<DiagramNode>();
    node.outgoing.forEach(obj => branches.push(this.parseNode(obj, endGateway)));

    var nextNode: DiagramNode = this.parseNode(endGateway.outgoing[0], stoppingNode);

    return new ParallelNode(nextNode, false, branches);
  }

}
