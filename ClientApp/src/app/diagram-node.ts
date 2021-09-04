import { BasicNode } from "./basic-node";
import { GatewayNode } from "./gateway-node";

export abstract class DiagramNode {
  // identifies if a node is validly selected
  protected greenLight: boolean;
  // next node connected
  public nextNode: DiagramNode;
  // identifies the parent of the current node (if it exists)
  public parentGatewayNode: GatewayNode;

  constructor(nextNode: DiagramNode, greenLight: boolean) {
    this.nextNode = nextNode;
    this.greenLight = greenLight;
  }

  public setParentGatewayNode(gatewayNode: GatewayNode): void {
    this.parentGatewayNode = gatewayNode;
  }

  public abstract canEnable(): Array<BasicNode>;
  public abstract canDisable(): Array<BasicNode>; // TODO
  public abstract enable(): void; // TODO
  public abstract disable(): Array<BasicNode>;
  public abstract clone(): DiagramNode;
  public abstract getGreenLight(): boolean;

}
