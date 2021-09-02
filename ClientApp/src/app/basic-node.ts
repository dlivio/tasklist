import { DiagramNode } from "./diagram-node";

export class BasicNode extends DiagramNode {
  // the activityId that identifies the task/node
  public activityId: string;

  constructor(nextNode: DiagramNode, greenLight: boolean, activityId: string)  {
    super(nextNode, greenLight);
    this.activityId = activityId;
  }

  public canEnable(): DiagramNode[] {
    if (this.greenLight == false)
      return [this];
    if (this.nextNode != null)
      return this.nextNode.canEnable();

    return new Array<DiagramNode>();
  }

  public canDisable(): DiagramNode[] {
    throw new Error("Method not implemented.");
  }

  public enable(): void {
    throw new Error("Method not implemented.");
  }

  public disable(): void {
    this.greenLight = false;

    if (this.nextNode != null) {
      this.nextNode.disable();
    }
    else {
      var currentParentGatewayNode: DiagramNode = this.parentGatewayNode;
      while (currentParentGatewayNode != null && !currentParentGatewayNode.getGreenLight()) {
        if (currentParentGatewayNode.nextNode != null)
          currentParentGatewayNode.nextNode.disable();

        currentParentGatewayNode = currentParentGatewayNode.parentGatewayNode;
      }

    }
  }

  public clone(): BasicNode {
    if (this.nextNode == null)
      return new BasicNode(null, this.greenLight, this.activityId);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new BasicNode(nextNodeClone, this.greenLight, this.activityId);
  }

  public getGreenLight(): boolean {
    return this.greenLight;
  }

}
