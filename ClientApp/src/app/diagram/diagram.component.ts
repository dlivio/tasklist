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

import { from, Observable, Subscriber, Subscription } from 'rxjs';
import { BasicNode } from '../basic-node';
import { DiagramNode } from '../diagram-node';
import { ExclusiveNode } from '../exclusive-node';
import { InclusiveNode } from '../inclusive-node';
import { ParallelNode } from '../parallel-node';
import { HistoryTasks } from '../diagram';
import { SubmittedNode } from '../submitted-node';
import { TasksToApprove } from '../task';
import { SequenceFlowNode } from '../sequence-flow-node';

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

  private currentBaseUrl: string;


  private canvas: any;
  private elementRegistry: any;

  constructor(private http: HttpClient, @Inject('BASE_URL') baseUrl: string) {
    // Global variables init
    this.taskHistoryIds = [];
    this.currentTaskIds = [];

    this.nodesEnableable = [];
    this.nodesDisableable = [];

    this.currentBaseUrl = baseUrl;

    // bpmn.io variables
    this.bpmnJS = new BpmnJS();

    var eventBus = this.bpmnJS.get('eventBus');

    this.canvas = this.bpmnJS.get('canvas');
    this.elementRegistry = this.bpmnJS.get('elementRegistry');

    // Initialize the BPMN viewer and build the graph with current diagram information
    this.bpmnJS.on('import.done', ({ error }) => {
      if (!error) {
        this.bpmnJS.get('canvas').zoom('fit-viewport');
      }

      this.importDiagramHistory(this.canvas, this.elementRegistry);
    });

    // interpret the click events
    this.events.forEach(event => {

      eventBus.on(event, e => {
        // e.element = the model element
        // e.gfx = the graphical element
        console.log(event, 'on', e.gfx);
        console.log(event, 'on', e.element);
        console.log(this.currentTaskIds);
        console.log("nodes enableable:");
        console.log(this.nodesEnableable);

        var nodeForEnableFound: DiagramNode = this.nodesEnableable.find(n => n.id == e.element.id);

        var nodeForDisableFound: DiagramNode = this.nodesDisableable.find(n => n.id == e.element.id);

        if (nodeForEnableFound != undefined) {
          console.log("found it enable");

          if (nodeForEnableFound instanceof SequenceFlowNode) 
            this.canvas.addMarker(e.element.id, 'highlight-flow');

          if (!this.canvas.hasMarker(e.element.id, 'highlight') || !this.canvas.hasMarker(e.element.id, 'highlight-flow')) {
            
            if (nodeForEnableFound instanceof SequenceFlowNode) 
              this.canvas.addMarker(e.element.id, 'highlight-flow');
            else
              this.canvas.addMarker(e.element.id, 'highlight');
            
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
          if (this.canvas.hasMarker(e.element.id, 'highlight') || this.canvas.hasMarker(e.element.id, 'highlight-flow')) {
            if (nodeForEnableFound instanceof SequenceFlowNode) 
              this.canvas.removeMarker(e.element.id, 'highlight-flow');
            else
              this.canvas.removeMarker(e.element.id, 'highlight');
            
            // unselect the node and update the array with nodes available to select
            var nodesDisabled = nodeForDisableFound.disable();

            // trigger a function to cleanup colored nodes that have been removed
            this.disableColorCleanup(this.canvas, nodesDisabled);

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

        // add the cursor html change to the new enableable nodes
        if (nodeForEnableFound != undefined || nodeForDisableFound != undefined) {
          // filter the elements in the diagram to limit those who are clickable
          var tasksFound = this.elementRegistry.filter(function (el) {
            return (el.type == "bpmn:UserTask" || el.type == "bpmn:SequenceFlow")
          });
          // remove the 'pointer' property from all user tasks
          for (let i = 0; i < tasksFound.length; i++) {
            this.canvas.removeMarker(tasksFound[i].id, 'pointer');
            this.canvas.removeMarker(tasksFound[i].id, 'highlight-flow-hover');
          }

          // add the 'pointer' html property to the enableable nodes
          for (let i = 0; i < tasksFound.length; i++) {
            if (this.nodesEnableable.find(n => n.id == tasksFound[i].id) != undefined) {
              this.canvas.addMarker(tasksFound[i].id, 'pointer');
              this.canvas.addMarker(tasksFound[i].id, 'highlight-flow-hover');
            }
          }
          // add the 'pointer' html property to the disableable nodes
          for (let i = 0; i < tasksFound.length; i++) {
            if (this.nodesDisableable.find(n => n.id == tasksFound[i].id) != undefined) {
              this.canvas.addMarker(tasksFound[i].id, 'pointer');
              this.canvas.addMarker(tasksFound[i].id, 'highlight-flow-hover');
            }
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
   * Method called by the clicking of the button 'Submit tasks' in the parent component.
   * This method sends an object containing all the clicked diagram tasks to the server for them
   * to be approved in the Camunda Workflow Engine.
   */
  submitTasks(projectId: string): boolean {
    if (!this.currentNode.canBeValidated()) {
      alert("Please select a task inside de decision or remove the last selected task.");
      return false;
    }

    console.log("inside submit tasks");

    console.log(this.currentNode.canDisable());

    var nodesSelected: BasicNode[] = this.currentNode.canDisable();

    var variablesToSend: Map<string, string> = this.currentNode.getVariables();

    console.log("inside submit tasks variables");
    console.log(variablesToSend);

    return; // temp

    console.log("variables map hereeeeee");
    console.log(variablesToSend);

    // if the list to submit is empty do nothing
    if (nodesSelected.length == 0) return; 

    var activityIds: string[] = [];
    nodesSelected.forEach(node => activityIds.push(node.id) );

    console.log(activityIds);

    var variablesArray = Array.from(variablesToSend.entries());

    var tasksToApprove: TasksToApprove = new TasksToApprove(activityIds, variablesArray);
    
    console.log(tasksToApprove);

    // get the tasks completed in the current diagram
    this.http.post<TasksToApprove>(this.currentBaseUrl + 'api/Tasks/' + projectId + '/Approve', tasksToApprove).subscribe(result => {
      alert("Tasks approved successfully.");
      this.importDiagramHistory(this.canvas, this.elementRegistry);

      this.loadUrl(this.url);
      return true;

    }, error => { 
      alert("An error has occured with the task submission. Please refresh the page and try again.");
      console.error(error);
    });
    
    return false;
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
   * Method used to retrieve the diagram history for the current project and current diagram from Camunda Workflow Engine, and build 
   * the graph accordingly. Additionally, it colors the tasks which have already been submitted for better user understanding.
   * 
   * @param canvas the canvas of the bpmnjs viewer
   * @param elementRegistry the registry containing all the nodes, and enables their access
   */
  private importDiagramHistory(canvas: any, elementRegistry: any) {
    // get the tasks completed in the current diagram
    this.http.get<HistoryTasks>(this.currentBaseUrl + 'api/Tasks/' + this.caseInstanceId + '/Diagram/History').subscribe(result => {

      console.log("history request result");
      console.log(result);

      this.taskHistoryIds = result.historyActivityIds;

      console.log("history");
      console.log(this.taskHistoryIds);

      // remove the current task to be approved from the list and save it
      this.currentTaskIds = result.currentActivityIds;                               // TODO: needs to be changed to retrieve current tasks hereeeee

      console.log("current tasks");
      console.log(this.currentTaskIds);
      console.log(this.currentTaskIds[0]);

      // filter the elements in the diagram to limit those who are clickable
      var tasksFound = elementRegistry.filter(function (el) {
        return (el.type == "bpmn:Task" || el.type == "bpmn:UserTask" || el.type == "bpmn:ManualTask" || 
          el.type == "bpmn:CallActivity" || el.type == "bpmn:CallActivity" || el.type == "bpmn:BusinessRuleTask");
      });
      // add color to all the elements in the history
      for (let i = 0; i < tasksFound.length; i++) {
        if (this.taskHistoryIds.indexOf(tasksFound[i].id) > -1) { //&& !canvas.hasMarker(tasksFound[i].id, 'highlight-history')) {
          canvas.addMarker(tasksFound[i].id, 'highlight-history');
        }

      }

    }, error => console.error(error)
      , () => { // on complete this path is activated

        // get the start event of the diagram
        // var foundEl = elementRegistry.filter(el => el.id == this.currentTaskIds[0])[0];
        var foundEl = elementRegistry.filter(el => el.type == "bpmn:StartEvent")[0];

        // parse the diagram be calling the parseNode on the pseudo-root (first task to approve)
        this.currentNode = this.parseNode(foundEl.outgoing[0]);                                                 // change var name
        console.log("Built graph:");
        console.log(this.currentNode);

        var nodesAbleToSelect: Array<BasicNode> = this.currentNode.canEnable();

        nodesAbleToSelect.forEach(n => this.currentTaskIds.push(n.id));

        this.nodesEnableable = this.currentNode.canEnable();
        console.log(this.nodesEnableable);

        // filter the elements in the diagram to limit those who are clickable
        var tasksFound = elementRegistry.filter(function (el) {
          return (el.type == "bpmn:UserTask")
        });
        // add the 'pointer' html property to the enableable nodes
        for (let i = 0; i < tasksFound.length; i++) {
          if (this.nodesEnableable.find(n => n.id == tasksFound[i].id) != undefined) 
            canvas.addMarker(tasksFound[i].id, 'pointer');
        }

      });
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
        return this.parseSequenceFlow(node, stoppingNode);
        break;
      case "bpmn:ManualTask":
        return this.parseManualTask(node, stoppingNode);
        break;
      case "bpmn:BusinessRuleTask":
        return this.parseBusinessTask(node, stoppingNode);
        break;
      case "bpmn:CallActivity":
        return this.parseBusinessTask(node, stoppingNode);
        break;
      case "bpmn:EndEvent":
        return null;
        break;
      default:
        console.log("Node type not found.");
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

    // if node is in historyNodes then return new SubmittedNode
    if (this.taskHistoryIds.indexOf(node.id) != -1) {
      console.log("user task " + node.id + " parsed as submitted node");
      return new SubmittedNode(nextNode, node.id);
    }

    return new BasicNode(nextNode, false, node.id);
  }

  /**
   * Auxiliary method to retrieve the object containing the joining gateway of the requested type.
   * 
   * @param beginningGatewayNode
   * @param gatewayType
   */
  private getLastGateway(beginningGatewayNode: any, gatewayType: string): any { //TODO: if no gateway is found and an endEvent is found return null
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

    var branches: Array<SequenceFlowNode> = new Array<SequenceFlowNode>();
    var pathVariables: Array<string> = new Array<string>();
    node.outgoing.forEach(obj => {

      var nodeType: string = this.getNodeType(obj);

      if (nodeType == "bpmn:SequenceFlow") {
        var flowId: string = obj.id;

        pathVariables.push(flowId);

        branches.push(this.parseSequenceFlow(obj, endGateway));
      }

      //branches.push(this.parseNode(obj, endGateway));
    });

    var nextNode: DiagramNode = this.parseNode(endGateway.outgoing[0], stoppingNode);

    console.log("parsing gateway: ");
    console.log(node);
    console.log("next node: ");
    console.log(nextNode);
    console.log("branches: ");
    console.log(branches);
    console.log("end gateway: ");
    console.log(endGateway);

    switch (gatewayType) {
      case "exclusive":
        if (ExclusiveNode.inferGatewayInstance(nextNode, branches)) {
          return new ExclusiveNode(nextNode, false, branches, node.id, pathVariables);
        } else {
          return new SubmittedNode(nextNode, node.id);
        }

        break;
      case "inclusive":
        if (InclusiveNode.inferGatewayInstance(nextNode, branches, this.currentTaskIds)) {
          return new InclusiveNode(nextNode, false, branches, node.id, pathVariables);
        } else {
          return new SubmittedNode(nextNode, node.id);
        }

        break;
      case "parallel":
        if (ParallelNode.inferGatewayInstance(nextNode, branches)) {
          return new ParallelNode(nextNode, false, branches, node.id, pathVariables);
        } else {
          return new SubmittedNode(nextNode, node.id);
        }

        break;
      default:
        console.log("Gateway type not found.");
        break;
    }

  }

  /**
   * TODO
   * 
   */
   private parseSequenceFlow(node: any, stoppingNode: any = null): SequenceFlowNode {
    var nextObj: any = this.getSequenceFlowOutgoing(node);
    var nextNode: DiagramNode = this.parseNode(nextObj, stoppingNode);

    var builtNode: SequenceFlowNode;// = new SequenceFlowNode(nextNode, false, node.id, nextObj.id);

    // if node is in historyNodes then return new SubmittedNode
    if (nextNode != null) {
      builtNode = new SequenceFlowNode(nextNode, false, node.id, nextObj.id);

      if (nextNode.isSubmitted() || this.currentTaskIds.indexOf(nextNode.id) != -1) {
        console.log("gateway path " + node.id + " updated as submitted node");
        builtNode.submitted = true;
      }

    } else {
      if (stoppingNode != null && nextObj.id == stoppingNode.id)
        builtNode = new SequenceFlowNode(nextNode, false, node.id, nextObj.id);
      else
        builtNode = new SequenceFlowNode(nextNode, false, node.id, "");

    }

    return builtNode;
  }

  private parseManualTask(node: any, stoppingNode: any = null): DiagramNode {       // TODO: shouldn't exist
    var nextNode: DiagramNode = this.parseNode(node.outgoing[0], stoppingNode);

    // if node is in historyNodes then return new SubmittedNode
    if (this.taskHistoryIds.indexOf(node.id) != -1) {
      return new SubmittedNode(nextNode, node.id);
    }

    return null;
  }

  private parseBusinessTask(node: any, stoppingNode: any = null): DiagramNode {
    var nextNode: DiagramNode = this.parseNode(node.outgoing[0], stoppingNode);

    // if node is in historyNodes then return new SubmittedNode
    if (this.taskHistoryIds.indexOf(node.id) != -1) 
      return new SubmittedNode(nextNode, node.id);

    return null;
  }

  /**
   * Method to remove the coloring of the tasks that have been unselected by an action on previous 
   * nodes (i.e. unselecting a node before another should automatically unselect the next one, if it was selected)
   * 
   * @param canvas 
   * @param nodesToUncolor
   */
  private disableColorCleanup(canvas: any, nodesToUncolor: BasicNode[]): void {
    nodesToUncolor.forEach(n => {
      canvas.removeMarker(n.id, 'highlight');
      canvas.removeMarker(n.id, 'highlight-flow');
    });
  }

  private disablePointerCleanup(canvas: any, elementRegistry: any) {
    // filter the elements in the diagram to limit those who are clickable
    var tasksFound = elementRegistry.filter(function (el) {
      return (el.type == "bpmn:UserTask")
    });

    // remove the 'pointer' property from all user tasks
    for (let i = 0; i < tasksFound.length; i++) {
      canvas.removeMarker(tasksFound[i].id, 'pointer');
    }
  }

}
