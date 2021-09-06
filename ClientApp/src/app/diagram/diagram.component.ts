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

  
  // the starting node that can be approved
  private currentNode: DiagramNode;
  // nodes that can be selected
  private nodesEnableable: BasicNode[];
  // nodes that can be unselected
  private nodesDisableable: BasicNode[];

  constructor(private http: HttpClient, @Inject('BASE_URL') baseUrl: string) {
    // Global variables init
    this.taskHistoryIds = [];
    this.currentTaskIds = [];

    this.nodesEnableable = [];
    this.nodesDisableable = [];

    // bpmn.io variables
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

          // parse the diagram be calling the parseNode on the pseudo-root (first task to approve)
          this.currentNode = this.parseNode(foundEl);

          console.log(this.currentNode);

          var nodesAbleToSelect: Array<BasicNode> = this.currentNode.canEnable();

          nodesAbleToSelect.forEach(n => this.currentTaskIds.push(n.activityId));

          this.nodesEnableable = this.currentNode.canEnable();
          console.log(this.nodesEnableable);

        });

    });

    this.events.forEach(event => {

      eventBus.on(event, e => {
        // e.element = the model element
        // e.gfx = the graphical element
        console.log(event, 'on', e.element);
        console.log(this.currentTaskIds);
        console.log("nodes enableable:");
        console.log(this.nodesEnableable);

        var nodeForEnableFound: DiagramNode = this.nodesEnableable.find(n => n.activityId == e.element.id);

        var nodeForDisableFound: DiagramNode = this.nodesDisableable.find(n => n.activityId == e.element.id);

        if (nodeForEnableFound != undefined) {
          console.log("found it enable");
          if (!canvas.hasMarker(e.element.id, 'highlight')) {
            canvas.addMarker(e.element.id, 'highlight');
            
            // select the node and get the new array with nodes available to select
            nodeForEnableFound.enable();

            this.nodesEnableable = this.currentNode.canEnable();

            console.log("new nodes enableable:");
            console.log(this.nodesEnableable);

            this.nodesDisableable = this.currentNode.canDisable();

            console.log("new nodes disableable:");
            console.log(this.nodesDisableable);

          }
        }

        if (nodeForDisableFound != undefined) {
          console.log("found it disable");
          if (canvas.hasMarker(e.element.id, 'highlight')) {
            canvas.removeMarker(e.element.id, 'highlight');
            
            // unselect the node and update the array with nodes available to select
            var nodesDisabled = nodeForDisableFound.disable();

            // trigger a function to cleanup colored nodes that have been removed
            this.disableColorCleanup(canvas, nodesDisabled);

            console.log("nodes disabled");
            console.log(nodesDisabled);

            this.nodesEnableable = this.currentNode.canEnable();

            console.log("new nodes enableable:");
            console.log(this.nodesEnableable);

            this.nodesDisableable = this.currentNode.canDisable();

            console.log("new nodes disableable:");
            console.log(this.nodesDisableable);

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

  submitTasks(): void {
    if (!this.currentNode.canBeValidated()) 
      alert("Please select a task inside de decision or remove the last selected task.");
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
   * Method to build the graph recursively through the call of the parsing of the root (or first) node 
   * in the graph.
   * 
   * @param node 
   * @param stoppingNode, the node that serves as criteria to stop the parsing
   * @returns the built 'node' called with the entire graph built
   */
  private parseNode(node: any, stoppingNode: any = null): DiagramNode {
    if (stoppingNode != null && node.id == stoppingNode.id) return null; 

    var nodeType: string = this.getNodeType(node);

    switch (nodeType) {
      case "bpmn:UserTask":
        return this.parseUserTask(node, stoppingNode);
        break;
      case "bpmn:ExclusiveGateway":
        return this.parseGateway(node, stoppingNode, "exclusive");
        break;
      case "bpmn:InclusiveGateway":
        return this.parseGateway(node, stoppingNode, "inclusive");
        break;
      case "bpmn:ParallelGateway":
        return this.parseGateway(node, stoppingNode, "parallel");
        break;
      case "bpmn:SequenceFlow":
        return this.parseNode(this.getSequenceFlowOutgoing(node), stoppingNode);
        break;
      case "bpmn:EndEvent":
        return null;
        break;
      default:
        console.log("Andre says Oi");
        return null;
        break;
    }
  }

  /**
   * Auxiliary method to retrive the next node in the case of a sequence flow. This is needed due to the 
   * existance of a 'businessObject' property in the outer nodes that is seemingly inexistant in the inner 
   * nodes, in which case to retrieve the next node the property 'targetRef' is needed to be called.
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
   * Auxiliary method to retrieve the node type of a requested node.
   * 
   * @param node
   */
  private getNodeType(node: any): string {
    var nodeType: string = node.type;
    if (nodeType == undefined) {
      nodeType = node.$type;
    }

    return nodeType;
  }

  /**
   * Method to build a node of type BasicNode (which correlates to a 'UserTask' in BPMN).
   * 
   * @param node 
   * @param stoppingNode, the node that serves as criteria to stop the parsing
   * @returns 
   */
  private parseUserTask(node: any, stoppingNode: any = null): DiagramNode {
    var nextNode: DiagramNode = this.parseNode(node.outgoing[0], stoppingNode);

    return new BasicNode(nextNode, false, node.id);
  }

  /**
   * Auxiliary method to retrieve the object containing the joining gateway of the requested type.
   * 
   * @param beginningGatewayNode
   * @param gatewayType
   */
  private getLastGateway(beginningGatewayNode: any, gatewayType: string): any {
    // check if the beginningGatewayNode is the ending node of a gateway
    if (beginningGatewayNode.incoming.length > 1 && beginningGatewayNode.outgoing.length == 1) {
      return beginningGatewayNode;
    }

    var node = beginningGatewayNode.outgoing[0];
    var nodeDepth: number = 1;

    while (nodeDepth > 0) {
      var nodeType: string = this.getNodeType(node);

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
        node = node.outgoing[0];
      }
    }

    return node;
  }

  private parseGateway(node: any, stoppingNode: any = null, gatewayType: string) {
    var endGateway = this.getLastGateway(node, this.getNodeType(node));

    // if the gateway found equals the endGateway, the first node of the graph is inside a gateway;
    // in this case we want to skip the interpretation of the gateway as a gatewayNode and just interpret 
    // it as a regular node
    if (node.id == endGateway.id) {
      return this.parseNode(node.outgoing[0], stoppingNode);
    }

    var branches: Array<DiagramNode> = new Array<DiagramNode>();
    node.outgoing.forEach(obj => branches.push(this.parseNode(obj, endGateway)));

    var nextNode: DiagramNode = this.parseNode(endGateway.outgoing[0], stoppingNode);

    switch (gatewayType) {
      case "exclusive":
        return new ExclusiveNode(nextNode, false, branches);
        break;
      case "inclusive":
        return new InclusiveNode(nextNode, false, branches);
        break;
      case "parallel":
        return new ParallelNode(nextNode, false, branches);
        break;
      default:
        console.log("Andre says Oi");
        break;
    }

  }

  /**
   * Method to remove the coloring of the tasks that have been unselected by an action on previous 
   * nodes (i.e. unselecting a node before another should automatically unselect the next one, if it was selected)
   * 
   * @param canvas 
   * @param nodesToUncolor
   */
  private disableColorCleanup(canvas: any, nodesToUncolor: BasicNode[]): void {
    nodesToUncolor.forEach(n => canvas.removeMarker(n.activityId, 'highlight') );
  }

}
