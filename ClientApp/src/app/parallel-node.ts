import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class ParallelNode extends GatewayNode {

  public canEnable(): BasicNode[] {
    var canEnable: Array<BasicNode> = new Array<BasicNode>();
    this.branches.forEach(br => canEnable = canEnable.concat(br.canEnable()));

    return canEnable;
  }

  public canDisable(): BasicNode[] {
    throw new Error("Method not implemented.");
  }

  public enable(): void {
    throw new Error("Method not implemented.");
  }

  public clone(): DiagramNode {
    var clonedBranches: Array<DiagramNode> = new Array<DiagramNode>(this.branches.length);
    this.branches.forEach(br => clonedBranches.push(br.clone()));

    if (this.nextNode == null)
      return new ParallelNode(null, this.greenLight, clonedBranches);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new ParallelNode(nextNodeClone, this.greenLight, clonedBranches);
  }

  public getGreenLight(): boolean {
    return this.completedBranches() == 1;
  }

}
