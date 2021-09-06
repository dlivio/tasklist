import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class ExclusiveNode extends GatewayNode {

  public canEnable(): BasicNode[] {
    var canEnable: Array<BasicNode> = new Array<BasicNode>();
    this.branches.forEach(br => canEnable = canEnable.concat(br.canEnable()));

    return canEnable;
  }

  public canDisable(): BasicNode[] {
    var canDisable: Array<BasicNode> = new Array<BasicNode>();
    this.branches.forEach(br => canDisable = canDisable.concat(br.canDisable()) );

    if (this.nextNode != null)
      canDisable = canDisable.concat(this.nextNode.canDisable());

    return canDisable;
  }

  public canBeValidated(): boolean {
    var selectedBranchCount: number = 0;
    // check if the nodes selected can be submited by verifying that, if a node is selected before a 
    // gateway, at least on node is selected inside the gateway
    this.branches.forEach(br => { 
      if (br.getGreenLight() && br.canBeValidated()) selectedBranchCount++;
    });

    if (selectedBranchCount < 1) return false;

    if (this.nextNode != null) return this.nextNode.canBeValidated();

    return true;
  }

  public enable(): void {
    throw new Error("Method not implemented.");
  }

  public clone(): DiagramNode {
    var clonedBranches: Array<DiagramNode> = new Array<DiagramNode>(this.branches.length);
    this.branches.forEach(br => clonedBranches.push(br.clone()));

    if (this.nextNode == null)
      return new ExclusiveNode(null, this.greenLight, clonedBranches);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new ExclusiveNode(nextNodeClone, this.greenLight, clonedBranches);
  }

  public getGreenLight(): boolean {
    return this.completedBranches() == 1;
  }

}
