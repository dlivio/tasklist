import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class BasicNode extends DiagramNode {
  // the activityId that identifies the task/node
  public activityId: string;

  constructor(nextNode: DiagramNode, greenLight: boolean, activityId: string)  {
    super(nextNode, greenLight);
    this.activityId = activityId;
  }

  public canEnable(): BasicNode[] {
    if (this.greenLight == false)
      return [this];
    if (this.nextNode != null)
      return this.nextNode.canEnable();

    return new Array<BasicNode>();
  }

  public canDisable(): BasicNode[] {
    var canDisable: Array<BasicNode> = new Array<BasicNode>();
    if (this.greenLight == true) 
      canDisable.push(this);
      if (this.nextNode != null)
        canDisable = canDisable.concat(this.nextNode.canDisable());

    return canDisable;
  }

  public canBeValidated(): boolean {
    if (this.greenLight == true && this.nextNode != null) 
      return this.nextNode.canBeValidated();

    return true;
  }

  public enable(): void {
    this.greenLight = true;
  }

  public disable(): Array<BasicNode> {
    var nodesDisabled: Array<BasicNode> = new Array<BasicNode>();
    
    if (this.greenLight == true) {
      nodesDisabled = [this];
      this.greenLight = false;
    }

    if (this.nextNode != null) {
      nodesDisabled = nodesDisabled.concat(this.nextNode.disable());
    }
    else {
      var currentParentGatewayNode: GatewayNode = this.parentGatewayNode;
      // disable the next nodes if the disabling of the current node has changed the green light
      // of the parent gateway node
      while (currentParentGatewayNode != null && !currentParentGatewayNode.getGreenLight()) {
        if (currentParentGatewayNode.nextNode != null)
          nodesDisabled = nodesDisabled.concat(currentParentGatewayNode.nextNode.disable()); 

        currentParentGatewayNode = currentParentGatewayNode.parentGatewayNode;
      }

    }

    return nodesDisabled;
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
