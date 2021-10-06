import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { SequenceFlowNode } from "./sequence-flow-node";

export abstract class GatewayNode extends DiagramNode {
  // array with the first node of each branch of the gateway
  public branches: Array<SequenceFlowNode>;
  //
  public pathVariables: Array<string>;

  constructor(nextNode: DiagramNode, greenLight: boolean, branches: Array<SequenceFlowNode>, gatewayId: string, pathVariables: Array<string>) {
    super(nextNode, gatewayId, greenLight);

    this.branches = new Array<SequenceFlowNode>();
    branches.forEach(br => this.addBranch(br));
    
    this.pathVariables = pathVariables;
  }

  public addBranch(branch: SequenceFlowNode): void {
    this.branches.push(branch);

    var currentNode: DiagramNode = branch;
    while (currentNode != null) {
      currentNode.setParentGatewayNode(this);
      currentNode = currentNode.nextNode;
    }
  }

  public canDisable(): DiagramNode[] {
    var canDisable: Array<DiagramNode> = new Array<DiagramNode>();
    this.branches.forEach(br => canDisable = canDisable.concat(br.canDisable()) );

    if (this.nextNode != null)
      canDisable = canDisable.concat(this.nextNode.canDisable());

    return canDisable;
  }

  public enable(): void {
    throw new Error("Method not implemented.");
  }

  public disable(): Array<DiagramNode> {
    var nodesDisabled: Array<DiagramNode> = new Array<DiagramNode>();
    this.branches.forEach(br => nodesDisabled = nodesDisabled.concat(br.disable()) );

    if (this.nextNode != null)
      nodesDisabled = nodesDisabled.concat(this.nextNode.disable());

    return nodesDisabled;
  }

  public completedBranches(): number {
    var completedBranches: number = 0;
    this.branches.forEach(function (br) {
      var currentNode: DiagramNode = br;

      while (currentNode.getGreenLight() && currentNode.nextNode != null) {
        currentNode = currentNode.nextNode;
      }

      if (currentNode.getGreenLight() && currentNode.nextNode == null)
        completedBranches++;
    });

    return completedBranches;
  }

  public isSubmitted(): boolean {
    return false;
  }

  public hasActivityId(activityId: string): boolean {
    var activityIdFound: boolean = false;
    this.branches.forEach(br => activityIdFound = activityIdFound || br.hasActivityId(activityId) );

    return activityIdFound;
  }
}
