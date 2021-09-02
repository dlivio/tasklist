import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class ExclusiveNode extends GatewayNode {

  public canEnable(): DiagramNode[] {
    var canEnable: Array<DiagramNode> = new Array<DiagramNode>();
    this.branches.forEach(br => canEnable.concat(br.canEnable()));

    return canEnable;
  }

  public canDisable(): DiagramNode[] {
    throw new Error("Method not implemented.");
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
