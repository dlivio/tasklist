import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class InclusiveNode extends GatewayNode {

  public canEnable(): BasicNode[] {
    var canEnable: Array<BasicNode> = new Array<BasicNode>();
    this.branches.forEach(br => canEnable = canEnable.concat(br.canEnable()) );

    return canEnable;
  }

  public canDisable(): BasicNode[] {
    var canDisable: Array<BasicNode> = new Array<BasicNode>();
    this.branches.forEach(br => canDisable = canDisable.concat(br.canDisable()) );

    return canDisable;
  }

  public enable(): void {
    throw new Error("Method not implemented.");
  }

  public clone(): DiagramNode {
    var clonedBranches: Array<DiagramNode> = new Array<DiagramNode>(this.branches.length);
    this.branches.forEach(br => clonedBranches.push(br.clone()));

    if (this.nextNode == null)
      return new InclusiveNode(null, this.greenLight, clonedBranches);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new InclusiveNode(nextNodeClone, this.greenLight, clonedBranches);
  }

  public getGreenLight(): boolean {
    return this.completedBranches() >= 1;
  }

}
