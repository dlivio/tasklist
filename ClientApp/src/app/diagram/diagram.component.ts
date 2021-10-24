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
// @ts-ignore
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
import { GatewayNode } from '../gateway-node';
import { ReceiveMessageNode } from '../receive-message-node';
import { SendMessageNode } from '../send-message-node';
import { ProcessNode } from '../process-node';

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css']
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
  //
  private sequenceFlowHistoryIds: string[];
  // the current task activity id available to click
  private currentTaskIds: string[];

  
  // the starting node that can be approved
  private currentNode: DiagramNode;
  // nodes that can be selected
  private nodesEnableable: DiagramNode[];
  // nodes that can be unselected
  private nodesDisableable: DiagramNode[];
  // the base url to be used on http requests (since the server side operates in the same ip
  private currentBaseUrl: string;

  private canvas: any;
  private elementRegistry: any;

  // the currently selected node on the 'date-picker', injected to the component with 
  // the @Inject parameter
  private selectedNode: BasicNode;

  constructor(private http: HttpClient, @Inject('BASE_URL') baseUrl: string) {

    // Global variables init
    this.taskHistoryIds = [];
    this.currentTaskIds = [];

    this.nodesEnableable = [];
    this.nodesDisableable = [];

    this.currentBaseUrl = baseUrl;

    this.selectedNode = null;

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

    // open datetime picker if user right clicks on element
    this.bpmnJS.on('element.contextmenu', (e) => {
      // prevent the default right click event
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      let columnOfDiagram = document.getElementById("diagram-viewer-col");

      // check if the user clicked on the background
      if (e.element.type == "bpmn:Lane" || e.element.type == "bpmn:Participant" || e.element.type == "bpmn:Collaboration") {
        this.selectedNode = null; // null so the 'date-picker' tab disappears

        columnOfDiagram.classList.remove('col-9');

        return;
      }

      // check if the right click was on a disableable node
      var nodeForDisableFound: DiagramNode = this.nodesDisableable.find(n => n.id == e.element.id);

      if (nodeForDisableFound != undefined && nodeForDisableFound instanceof BasicNode ) {
        this.selectedNode = nodeForDisableFound;
        columnOfDiagram.classList.add('col-9');

      } else {
        this.selectedNode = null; // null so the 'date-picker' tab disappears

        columnOfDiagram.classList.remove('col-9');
      }
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

          if (!this.canvas.hasMarker(e.element.id, 'highlight') || !this.canvas.hasMarker(e.element.id, 'highlight-flow')) {
            
             // select the node and get the new array with nodes available to select
             nodeForEnableFound.enable();

            if (nodeForEnableFound instanceof SequenceFlowNode) 
              this.canvas.addMarker(e.element.id, 'highlight-flow');
            else {
              this.canvas.addMarker(e.element.id, 'highlight');
              // highlight the next SequenceFlow (that had been automatically enabled)
              this.canvas.addMarker(nodeForEnableFound.nextNode.id, 'highlight-flow');
            }

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
            return (el.type == "bpmn:UserTask" || el.type == "bpmn:SendTask" || 
              el.type == "bpmn:ReceiveTask" || el.type == "bpmn:SequenceFlow")
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

  setDate() {
    alert("it works");
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

    //var nodesSelected: BasicNode[] = this.currentNode.canDisable();
    var nodesSelected: BasicNode[] = this.currentNode.getNodesForSubmission();

    var variablesToSend: Map<string, string> = this.currentNode.getVariables();

    console.log("inside submit tasks variables");
    console.log(variablesToSend);

    console.log("nodes to submit: ");
    console.log(nodesSelected);

    //return; // temp

    console.log("variables map hereeeeee");
    console.log(variablesToSend);

    // if the list to submit is empty do nothing
    if (nodesSelected.length == 0) return; 

    var tasks: Array<Array<string>> = new Array<Array<string>>();
    //var tasks: Map<string, string> = new Map<string, string>();
    //var activityIds: string[] = [];
    nodesSelected.forEach(node => {
      //tasks.set(node.id, node.completionTime.toISOString() );
      let arr: Array<string> = [node.id, node.startTime.toISOString(), node.completionTime.toISOString(), 
        node instanceof ReceiveMessageNode? node.getMessageRefForSubmission() : ""];
      tasks.push(arr);
    });

    console.log(tasks);

    var variablesArray = Array.from(variablesToSend.entries());
    //var tasksArray = Array.from(tasks.entries());

    var tasksToApprove: TasksToApprove = new TasksToApprove(tasks, variablesArray);
    
    console.log(tasksToApprove);

    // return; // temp

    // send the tasks for approval to the server
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
   * Auxiliar method to be called in a callback in the 'date-picker' child component.
   * This method is used only to close the 'date-picker' tab by clicking the 'x' button on the UI.
   */
  closeDatePickerButton() {
    this.selectedNode = null;

    let columnOfDiagram = document.getElementById("diagram-viewer-col");
    columnOfDiagram.classList.remove('col-9');
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
   * Auxiliary method to retrieve the node type of the parent of the requested node
   * 
   * @param node the unparsed node
   * @returns the string with the node type
   */
  private getParentNodeType(node: any): any {
    var nodeParent: string = node.parent;

    if (parent == undefined) {
      parent = node.businessObject.$parent;
    }

    return this.getNodeType(nodeParent);
  }

  /**
   * Auxiliary method that receives every found 'bpmn:StartEvent' nodes in the diagram and returns the main start event,
   * which is the one where the process starts.
   *  
   * @param startNodes an array of start nodes 
   * @returns the main start event
   */
  private getMainStartEventNode(startNodes: any[]): any {
    var startNode: any = null;

    startNodes.forEach(n => {
      if (this.getParentNodeType(n) == "bpmn:Process" || this.getParentNodeType(n) == "bpmn:Participant" ) 
        startNode = n;
    });

    return startNode;
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

      console.log("history variable result");
      console.log(result);

      this.sequenceFlowHistoryIds = result.historySequenceFlowIds;

      console.log("current tasks");
      console.log(this.currentTaskIds);
      console.log(this.currentTaskIds[0]);

    }, error => console.error(error)
      , () => { // on complete this path is activated

        // get the start event of the diagram
        // var foundEl = elementRegistry.filter(el => el.id == this.currentTaskIds[0])[0];
        
        //var foundEl = elementRegistry.filter(el => el.type == "bpmn:StartEvent")[0];
        var foundStartEvents: any[] = elementRegistry.filter(el => el.type == "bpmn:StartEvent");
        // get the main start event of the process
        var foundStart = this.getMainStartEventNode(foundStartEvents);
        console.log("start node found:");
        console.log(foundStart);
        // filter the 'foundStartEvents' array to get only the secondary
        var conditionalStartingNodes = foundStartEvents.filter(n => n != foundStart && this.getParentNodeType(n) != "bpmn:SubProcess");

        // parse the diagram be calling the parseNode on the pseudo-root (first task to approve)
        //this.currentNode = this.parseNode(foundEl.outgoing[0]);                                                 // change var name
        //this.currentNode = this.parseNode(foundStart.outgoing[0], null, true, conditionalStartingNodes);
        this.currentNode = this.parseProcess(foundStart, conditionalStartingNodes);
        console.log("Built graph:");
        console.log(this.currentNode);

        var nodesAbleToSelect: Array<DiagramNode> = this.currentNode.canEnable();

        nodesAbleToSelect.forEach(n => this.currentTaskIds.push(n.id));

        this.nodesEnableable = this.currentNode.canEnable();
        console.log(this.nodesEnableable);

        // filter the elements in the diagram to limit those who are clickable
        var tasksFound = elementRegistry.filter(function (el) {
          return (el.type == "bpmn:UserTask" || el.type == "bpmn:SendTask" || el.type == "bpmn:ReceiveTask")
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
   * @param node the unparsed node
   * @param stoppingNode the node that serves as criteria to stop the parsing
   * @param isMainStartEvent boolean that identifies that the main start event of the diagram is being parsed
   * @returns the built 'node' called with the entire graph built
   */
  private parseNode(node: any, stoppingNode: any = null, isMainStartEvent: boolean = false, conditionalStartingNodes: any[] = []): DiagramNode {
    if (stoppingNode != null && node.id == stoppingNode.id) return null; 

    var nodeType: string = this.getNodeType(node);

    switch (nodeType) {
      case "bpmn:StartEvent":
        return this.parseNode(node.outgoing[0], stoppingNode);
      case "bpmn:SubProcess":
        return this.parseSubProcess(node, stoppingNode);
      case "bpmn:UserTask":
        return this.parseBasicTask(node, stoppingNode);
      case "bpmn:SendTask":
        return this.parseBasicTask(node, stoppingNode, true);
      case "bpmn:ReceiveTask":
        return this.parseBasicTask(node, stoppingNode, false, true);
      case "bpmn:ExclusiveGateway":
        return this.parseGateway(node, stoppingNode, "exclusive");
      case "bpmn:InclusiveGateway":
        return this.parseGateway(node, stoppingNode, "inclusive");
      case "bpmn:ParallelGateway":
        return this.parseGateway(node, stoppingNode, "parallel");
      case "bpmn:SequenceFlow":
        return this.parseSequenceFlow(node, stoppingNode);
      case "bpmn:ManualTask":
      case "bpmn:BusinessRuleTask":
      case "bpmn:CallActivity":
        return this.parseServerRequiredTask(node, stoppingNode);
      case "bpmn:EndEvent":
        return null;
      default:
        console.log("Node type not found.");
        return null;
    }
  }

  /**
   * Auxiliary method to retrive the next node in the case of a sequence flow. This is needed due to the 
   * existance of a 'businessObject' property in the outer nodes that is seemingly inexistant in the inner 
   * nodes, in which case to retrieve the next node the property 'targetRef' is needed to be called.
   * 
   * @param sequenceFlowNode the unparsed SequenceFlow
   * @returns the seuq
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
   * @param node the unparsed node
   * @returns the string with the node type
   */
  private getNodeType(node: any): string {
    var nodeType: string = node.type;
    if (nodeType == undefined) {
      nodeType = node.$type;
    }

    return nodeType;
  }

  /**
   * Method to build a node of type ProcessNode which contains the entire process definition for the entire diagram.
   * 
   * @param startEventNode the unparsed main event node where the diagram starts
   * @param conditionalStartingEventNodes an array of the remaining unparsed secondary event nodes
   * @returns the parsed node as a ProcessNode
   */
  private parseProcess(startEventNode: any, conditionalStartingEventNodes: any[]): DiagramNode {
    var nextNode: DiagramNode = null;

    var startNode: DiagramNode = this.parseNode(startEventNode);

    var conditionalStartingNodes: DiagramNode[] = [];

    conditionalStartingEventNodes.forEach(n => conditionalStartingNodes.push(this.parseNode(n) ) );

    return new ProcessNode(nextNode, false, "", startNode, conditionalStartingNodes);
  }

  /**
   * Auxiliary method to extract the start event node from a subProcess node.
   * 
   * @param subProcessNode the unparsed subProcess node
   * @returns the unparsed start event
   */
  private getSubProcessStart(subProcessNode: any): any {
    var children: any[] = subProcessNode.children;
    var foundStart: any = null;

    if (children == undefined) 
      children = subProcessNode.flowElements;

    for(let node of children) {
      if (this.getNodeType(node) == "bpmn:StartEvent") { 
        foundStart = node;
        break;
      }
    }

    return foundStart;
  }

  /**
   * Method to build a node of type ProcessNode (which in this case correlates to a node of type 'SubProcess' in 
   * BPMN), which encapsules the entire collection of nodes between the start and end event of the 'SubProcess' 
   * (including possible ProcessNode's).
   * 
   * @param node the unparsed node
   * @param stoppingNode the node that serves as criteria to stop the parsing
   * @returns the parsed node as a ProcessNode
   */
  private parseSubProcess(node: any, stoppingNode: any = null): DiagramNode {
    var unparsedStartNode: any = this.getSubProcessStart(node);

    var startNode: DiagramNode = this.parseNode(unparsedStartNode);
    var nextNode: DiagramNode = this.parseNode(node.outgoing[0], stoppingNode);

    if (ProcessNode.inferSubProcessInstance(startNode, nextNode) ) 
      return new ProcessNode(nextNode, false, node.id, startNode);

    return new SubmittedNode(nextNode, node.id);
  }

  /**
   * Auxiliary method to retrive the messageRef in the case of a 'bpmn:ReceiveTask'. This is needed due to the 
   * existance of a 'businessObject' property in the outer nodes that is seemingly inexistant in the inner 
   * nodes, in which case to retrieve the next node the property 'messageRef' is needed to be called.
   * 
   * @param node the unparsed node
   * @returns the string with the message referenced
   */
  private getMessageRef(node: any): string {
    if (node.businessObject != undefined) {
      return node.businessObject.messageRef.name;
    }
    return node.messageRef.name;
  }

  /**
   * Method to build a node of type BasicNode (which correlates to nodes of type 'UserTask', 'SendTask', 
   * and 'ReceiveTask' in BPMN). This are the types of Tasks that are 'clickable' in the user interface.
   * 
   * @param node the unparsed node
   * @param stoppingNode the node that serves as criteria to stop the parsing
   * @param isSendTask a boolean to distinguish a 'SendTask' parse
   * @param isReceiveTask a boolean to distinguish a 'ReceiveTask' parse
   * @returns the parsed node as a BasicNode (subtype of DiagramNode), ReceiveMessageNode  (subtype of 
   * BasicNode), or SendMessageNode (subtype of BasicNode)
   */
  private parseBasicTask(node: any, stoppingNode: any = null, isSendTask: boolean = false, 
    isReceiveTask: boolean = false): DiagramNode {
    var nextNode: DiagramNode;

    // if a 'bpmn:SendTask' is being processed, make sure to follow the 'bpmn:SequenceFlow' 
    // instead of the 'bpmn:MessageFlow'
    if (isSendTask) {
      if (this.getNodeType(node.outgoing[0]) == "bpmn:SequenceFlow") 
        nextNode = this.parseNode(node.outgoing[0], stoppingNode);
      else
        nextNode = this.parseNode(node.outgoing[1], stoppingNode);
      
    } else
      nextNode = this.parseNode(node.outgoing[0], stoppingNode);

    // if node is in historyNodes then return new SubmittedNode
    if (this.taskHistoryIds.indexOf(node.id) != -1) {
      
      // if the node is submitted the following sequence flow node should also be
      if (nextNode instanceof SequenceFlowNode)
        nextNode.submitted = true; 

      // color the affected nodes by making a submitted node
      this.colourHistoryNode("basic", node.id, nextNode.id);
      return new SubmittedNode(nextNode, node.id);
    }

    if (isReceiveTask) 
      return new ReceiveMessageNode(nextNode, false, node.id, this.getMessageRef(node));
    else if (isSendTask)
      return new SendMessageNode(nextNode, false, node.id);
    else
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
      } else if (nodeType == "bpmn:EndEvent") { // create a imaginary end-gateway to build the gateway node
        return beginningGatewayNode;
      } else {
        node = node.outgoing[0];
      }
    }

    return node;
  }

  /**
   * Method to build a node of type GatewayNode, which encapsules the entire collection of nodes between 
   * the opening and the respective closing gateway (including possible GatewayNode's).
   * 
   * @param node the unparsed node
   * @param stoppingNode the node that serves as criteria to stop the parsing
   * @param gatewayType the type of gateway to create ("exclusive", "inclusive", and "parallel")
   * @returns the parsed node as a GatewayNode (subtype of DiagramNode)
   */
  private parseGateway(node: any, stoppingNode: any = null, gatewayType: string): DiagramNode {
    var endGateway = this.getLastGateway(node, this.getNodeType(node));

    // if the gateway found equals the endGateway, the first node of the graph is inside a gateway;
    // in this case we want to skip the interpretation of the gateway as a gatewayNode and just interpret 
    // it as a regular node
    /*
    if (node.id == endGateway.id) {
      return this.parseNode(node.outgoing[0], stoppingNode);
    }
    */

    var branches: Array<SequenceFlowNode> = new Array<SequenceFlowNode>();
    var nextNode: DiagramNode;

    if (node.id == endGateway.id) {
      node.outgoing.forEach(obj => branches.push(this.parseSequenceFlow(obj) ) );

      nextNode = null;
    } else {
      node.outgoing.forEach(obj => branches.push(this.parseSequenceFlow(obj, endGateway) ) );

      nextNode = this.parseNode(endGateway.outgoing[0], stoppingNode);
    }
    

    switch (gatewayType) {
      case "exclusive":
        if (ExclusiveNode.inferGatewayInstance(nextNode, branches)) {
          return new ExclusiveNode(nextNode, false, branches, node.id);
        } else {
          // if the node is submitted the following sequence flow node should also be
          if (nextNode instanceof SequenceFlowNode)
            nextNode.submitted = true;
          // color the affected nodes by making a submitted node
          this.colourHistoryNode("gateway", node.id, nextNode.id);
          return new SubmittedNode(nextNode, node.id);
        }

        break;
      case "inclusive":
        if (InclusiveNode.inferGatewayInstance(nextNode, branches, this.currentTaskIds)) {
          return new InclusiveNode(nextNode, false, branches, node.id);
        } else {
          // if the node is submitted the following sequence flow node should also be
          if (nextNode instanceof SequenceFlowNode)
            nextNode.submitted = true;
          // color the affected nodes by making a submitted node
          this.colourHistoryNode("gateway", node.id, nextNode.id);
          return new SubmittedNode(nextNode, node.id);
        }

        break;
      case "parallel":
        if (ParallelNode.inferGatewayInstance(nextNode, branches)) {
          return new ParallelNode(nextNode, false, branches, node.id);
        } else {
          // if the node is submitted the following sequence flow node should also be
          if (nextNode instanceof SequenceFlowNode)
            nextNode.submitted = true;
          // color the affected nodes by making a submitted node
          this.colourHistoryNode("gateway", node.id, nextNode.id);
          return new SubmittedNode(nextNode, node.id);
        }

        break;
      default:
        console.log("Gateway type not found.");
        return null;
        break;
    }

  }

  /**
   * Method to build a node of type SequenceFlowNode (which correlates to a 'SequenceFlow' in BPMN)
   * 
   * @param node the unparsed node
   * @param stoppingNode the node that serves as criteria to stop the parsing
   * @returns the parsed node as a SequenceFlowNode (subtype of DiagramNode)
   */
  private parseSequenceFlow(node: any, stoppingNode: any = null): SequenceFlowNode {
    var nextObj: any = this.getSequenceFlowOutgoing(node);
    var nextNode: DiagramNode = this.parseNode(nextObj, stoppingNode);

    var builtNode: SequenceFlowNode;// = new SequenceFlowNode(nextNode, false, node.id, nextObj.id);

    if (nextNode != null) {

      builtNode = new SequenceFlowNode(nextNode, false, node.id, nextObj.id);

      if (this.sequenceFlowHistoryIds.indexOf(node.id) != -1) {
        builtNode.submitted = true;
        this.colourHistoryNode("flow", builtNode.id);
      
      // if the sequence flow is either before a submitted node or before a current node,
      // consider it submitted
      } else if (nextNode.isSubmitted() || this.currentTaskIds.indexOf(nextNode.id) != -1) {
        builtNode.submitted = true;
        this.colourHistoryNode("flow", builtNode.id);
      
      } else if (nextNode instanceof GatewayNode) {
        this.currentTaskIds.forEach(id => {
      
          if (nextNode.hasActivityId(id)) { 
            builtNode.submitted = true;
            this.colourHistoryNode("flow", builtNode.id);
          }
        });
      }

    } else {

      if (stoppingNode != null && nextObj.id == stoppingNode.id) {
        builtNode = new SequenceFlowNode(nextNode, false, node.id, nextObj.id);

        if (this.sequenceFlowHistoryIds.indexOf(node.id) != -1) {
          builtNode.submitted = true;
          this.colourHistoryNode("flow", builtNode.id);
        
        }

      } else {
        builtNode = new SequenceFlowNode(nextNode, false, node.id, nextObj.id)//""); // WARNING: This may give an error but I can't see it now
      }

    }

    return builtNode;
  }

  /**
   * Method to build a special type of node of type SubmittedNode or 'null'. This type of node has some 
   * requirements that can only be satisfied by the server. Therefore, this node should be interpreted as 
   * either a stopping point where the user must submit everything immediatly before it to be able to 
   * proceed, or simply part of the history of the diagram. This method is called for ManualTask's, 
   * BusinessRuleTask's, or CallActivity's.
   * 
   * @param node the unparsed node
   * @param stoppingNode the node that serves as criteria to stop the parsing
   * @returns the parsed node as a SubmittedNode (subtype of DiagramNode), or null if it hasn't occurred yet
   */
  private parseServerRequiredTask(node: any, stoppingNode: any = null): DiagramNode {
    var nextNode: DiagramNode = this.parseNode(node.outgoing[0], stoppingNode);

    // if node is in historyNodes then return new SubmittedNode
    if (this.taskHistoryIds.indexOf(node.id) != -1) {
      this.colourHistoryNode("basic", node.id, nextNode.id);
      return new SubmittedNode(nextNode, node.id);
    }
    return null;
  }

  /**
   * Method to remove the coloring of the tasks that have been unselected by an action on previous 
   * nodes (i.e. unselecting a node before another should automatically unselect the next one, if it was selected)
   * 
   * @param canvas 
   * @param nodesToUncolor
   */
  private disableColorCleanup(canvas: any, nodesToUncolor: DiagramNode[]): void {
    nodesToUncolor.forEach(n => {
      canvas.removeMarker(n.id, 'highlight');
      canvas.removeMarker(n.id, 'highlight-flow');
    });
  }

  /**
   * Method to color the submitted nodes and their surrounding affected nodes (SequenceFlowNode's).
   * 
   * @param nodeType the type of node to color ("flow", "basic", or "gateway")
   * @param nodeId the id of the node to color
   * @param nextNodeId the id of the next node (can be ommited in case of being null, after SequenceFlowNode)
   */
  private colourHistoryNode(nodeType: string, nodeId: string, nextNodeId: string = null) {
    
    switch (nodeType) {
      case "flow": // color only itself
        if (!this.canvas.hasMarker(nodeId, 'highlight-flow-history') )
          this.canvas.addMarker(nodeId, 'highlight-flow-history');

        break;
      case "basic": // color itself and the following sequence flow
        if (!this.canvas.hasMarker(nodeId, 'highlight-history') )
          this.canvas.addMarker(nodeId, 'highlight-history');

        if (!this.canvas.hasMarker(nextNodeId, 'highlight-flow-history') )
          this.canvas.addMarker(nextNodeId, 'highlight-flow-history');

        break;
      case "gateway": // color only the following sequence flow
        if (!this.canvas.hasMarker(nextNodeId, 'highlight-flow-history') )
          this.canvas.addMarker(nextNodeId, 'highlight-flow-history');
        
        break;
      default:
        console.log("Node type not found.");
        break;
    }
  }

}
