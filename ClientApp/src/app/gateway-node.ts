import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";

export abstract class GatewayNode extends DiagramNode {
  // array with the first node of each branch of the gateway
  public branches: Array<DiagramNode>;
  
  public gatewayId: string;
  public pathVariables: Array<string>;

  constructor(nextNode: DiagramNode, greenLight: boolean, branches: Array<DiagramNode>, gatewayId: string, pathVariables: Array<string>) {
    super(nextNode, greenLight);

    this.branches = new Array<DiagramNode>();
    branches.forEach(br => this.addBranch(br));
    
    this.gatewayId = gatewayId;
    this.pathVariables = pathVariables;
  }

  public addBranch(branch: DiagramNode): void {
    this.branches.push(branch);

    var currentNode: DiagramNode = branch;
    while (currentNode != null) {
      currentNode.setParentGatewayNode(this);
      currentNode = currentNode.nextNode;
    }
  }

  public canDisable(): BasicNode[] {
    var canDisable: Array<BasicNode> = new Array<BasicNode>();
    this.branches.forEach(br => canDisable = canDisable.concat(br.canDisable()) );

    if (this.nextNode != null)
      canDisable = canDisable.concat(this.nextNode.canDisable());

    return canDisable;
  }

  public enable(): void {
    throw new Error("Method not implemented.");
  }

  public disable(): Array<BasicNode> {
    var nodesDisabled: Array<BasicNode> = new Array<BasicNode>();
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
}
