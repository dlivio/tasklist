import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { SequenceFlowNode } from "./sequence-flow-node";

export class ProcessNode extends DiagramNode {
  // the starting node of the process
  public startNode: DiagramNode;
  // the starting nodes of the event subProcesses (in case of an Start Conditional Event)
  public conditionalStartingNodes: DiagramNode[]; 

  constructor(nextNode: DiagramNode, greenLight: boolean, activityId: string, startNode: DiagramNode) {
    super(nextNode, activityId, greenLight);
    this.startNode = startNode;
  }

  public canEnable(): DiagramNode[] {
    var canEnable: Array<DiagramNode> = new Array<DiagramNode>();
    
    // get the nodes enableable for the main 'Start to End' node group
    canEnable = canEnable.concat(this.startNode.canEnable());
    // get the nodes enableable for each event subProcesses
    this.conditionalStartingNodes.forEach(n => {
      canEnable = canEnable.concat(n.canEnable());
    });

    if (this.getGreenLight() && this.nextNode != null)
      canEnable = canEnable.concat(this.nextNode.canEnable());

    return canEnable;
  }

  public canDisable(): DiagramNode[] {
    var canDisable: Array<DiagramNode> = new Array<DiagramNode>();

    // get the nodes disableable for the main 'Start to End' node group
    canDisable = canDisable.concat(this.startNode.canDisable());
    // get the nodes disableable for each event subProcesses
    this.conditionalStartingNodes.forEach(n => {
      canDisable = canDisable.concat(n.canDisable());
    });

    if (this.nextNode != null)
      canDisable = canDisable.concat(this.nextNode.canDisable());

    return canDisable;
  }

  public canBeValidated(): boolean {
    var isValid: boolean = true;

    // see if there is a 'Start to End' node group that can't be validated
    isValid = isValid && this.startNode.canBeValidated();
    // see if there is a 'Start to End' node group that can't be validated
    this.conditionalStartingNodes.forEach(n => {
      isValid = isValid && n.canBeValidated();
    });

    if (!isValid) return false;

    if (this.nextNode != null && this.getGreenLight()) return this.nextNode.canBeValidated();

    return true;
  }

  public getNodesForSubmission(): BasicNode[] {
    var nodesToSubmit: Array<BasicNode> = new Array<BasicNode>();

    nodesToSubmit = nodesToSubmit.concat(this.startNode.getNodesForSubmission());

    this.conditionalStartingNodes.forEach(n => nodesToSubmit = nodesToSubmit.concat(n.getNodesForSubmission()) );

    if (this.nextNode != null)
      nodesToSubmit = nodesToSubmit.concat(this.nextNode.getNodesForSubmission());

    return nodesToSubmit;
  }

  public enable(): void {
    throw new Error("Method not implemented.");
  }

  public disable(): DiagramNode[] {
    var nodesDisabled: Array<DiagramNode> = new Array<DiagramNode>();
    
    nodesDisabled = nodesDisabled.concat(this.startNode.disable());

    this.conditionalStartingNodes.forEach(n => nodesDisabled = nodesDisabled.concat(n.disable()) );

    if (this.nextNode != null)
      nodesDisabled = nodesDisabled.concat(this.nextNode.disable());

    return nodesDisabled;
  }

  public clone(): DiagramNode {
    throw new Error("Method not implemented.");
  }

  public getGreenLight(): boolean {
    var currentNode: DiagramNode = this.startNode;

    while (currentNode.getGreenLight() && currentNode.nextNode != null) {
      currentNode = currentNode.nextNode;
    }

    if (currentNode instanceof SequenceFlowNode) { // always should be
      // last node before end event
      if (currentNode.previousNode != null && currentNode.previousNode.getGreenLight() && currentNode.nextNode == null) {
        return true;

      // single sequence flow
      } else if (currentNode.previousNode == null && currentNode.getGreenLight() && currentNode.nextNode == null) {
        return true;
      }
    }
    
    return false;
  }

  public isSubmitted(): boolean {
    return false;
  }

  public getVariables(): Map<string, string> {
    var variables: Map<string, string> = new Map<string, string>();

    this.startNode.getVariables().forEach((v, k) => variables.set(k, v));

    this.conditionalStartingNodes.forEach(n => {
      n.getVariables().forEach((v, k) => variables.set(k, v));
    });

    if (this.nextNode != null && this.getGreenLight())
      this.nextNode.getVariables().forEach((v, k) => variables.set(k, v));

    return variables;
  }

  /**
   * Auxiliary method that searches an entire given branch for the occurrence of a 'activityId'.
   * 
   * @param path the starting node of the path to follow
   * @param activityId the id to look for
   * @returns true if 'activityId' was found; false otherwise
   */
  private pathHasActivityId(path: DiagramNode, activityId: string): boolean {
    var activityIdFound: boolean = false;
    
    var node: DiagramNode = path;
    while (node != null ) {
      activityIdFound = activityIdFound || node.hasActivityId(activityId);

      // if the node is found stop the iteration
      if (node.getGreenLight() || node.isSubmitted())
        node = node.nextNode;
      else
        node = null;
    }

    return activityIdFound;
  }

  public hasActivityId(activityId: string): boolean {
    var activityIdFound: boolean = false;

    activityIdFound = activityIdFound || this.pathHasActivityId(this.startNode, activityId);

    this.conditionalStartingNodes.forEach(br => {
      activityIdFound = activityIdFound || this.pathHasActivityId(br, activityId);
    });

    return activityIdFound;
  }

  /**
   * Auxiliary method that get's the completion time of the last node of the path.
   * 
   * @param node the starting node of the path
   * @returns the Date corresponding to the completion time of the last node of the path
   */
  private getPathLatestCompletionTime(node: DiagramNode): Date {
    let completionDate: Date = null;

    var currentNode: DiagramNode = node;
    // select the last selected node of the branch
    while (currentNode.getGreenLight() && currentNode.nextNode != null) {
      currentNode = currentNode.nextNode;
    }
    // save the latest completion date
    if (completionDate == null || completionDate < currentNode.getPreviousCompletionTime() ) 
      completionDate = currentNode.getPreviousCompletionTime();

    return currentNode.getPreviousCompletionTime();
  }

  public getPreviousCompletionTime(): Date {
    let completionDate: Date = this.getPathLatestCompletionTime(this.startNode);

    this.conditionalStartingNodes.forEach(br => {
      var previousCompletionTime: Date = br.getPreviousCompletionTime();
      
      // save the completion date if it's posterior
      if (completionDate < previousCompletionTime ) 
        completionDate = previousCompletionTime;
      
    });
    
    return completionDate;
  }
}