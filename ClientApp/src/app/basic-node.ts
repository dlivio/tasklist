import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class BasicNode extends DiagramNode {
  // the date and time defined in which the task was completed
  public completionTime: Date;

  constructor(nextNode: DiagramNode, greenLight: boolean, activityId: string) {
    super(nextNode, activityId, greenLight);
    this.completionTime = null;
  }

  public canEnable(): DiagramNode[] {
    if (this.greenLight == false)
      return [this];
    if (this.nextNode != null)
      return this.nextNode.canEnable();

    return new Array<DiagramNode>();
  }

  public canDisable(): DiagramNode[] {
    var canDisable: Array<DiagramNode> = new Array<DiagramNode>();
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

  public getNodesForSubmission(): BasicNode[] {
    var nodesToSubmit: Array<BasicNode> = new Array<BasicNode>();
    if (this.greenLight == true)
      nodesToSubmit.push(this);
      if (this.nextNode != null)
        nodesToSubmit = nodesToSubmit.concat(this.nextNode.getNodesForSubmission());

    return nodesToSubmit;
  }

  public enable(): void {
    this.greenLight = true;
    // automatically enable the next sequence flow
    this.nextNode.enable();
  }

  public disable(): Array<DiagramNode> {
    var nodesDisabled: Array<DiagramNode> = new Array<DiagramNode>();

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
      return new BasicNode(null, this.greenLight, this.id);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new BasicNode(nextNodeClone, this.greenLight, this.id);
  }

  public getGreenLight(): boolean {
    return this.greenLight;
  }

  public isSubmitted(): boolean {
    return false;
  }

  public getVariables(): Map<string, string> {
    if (this.greenLight == true && this.nextNode != null)
      return this.nextNode.getVariables();

    return new Map<string, string>();
  }

  public hasActivityId(activityId: string): boolean {
    return activityId == this.id;
  }

}
