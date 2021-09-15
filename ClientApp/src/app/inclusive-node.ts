import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class InclusiveNode extends GatewayNode {

  public canEnable(): BasicNode[] {
    var canEnable: Array<BasicNode> = new Array<BasicNode>();
    this.branches.forEach(br => canEnable = canEnable.concat(br.canEnable()));

    if (this.getGreenLight() && this.nextNode != null)
      canEnable = canEnable.concat(this.nextNode.canEnable());

    return canEnable;
  }

  public canBeValidated(): boolean {
    var selectedBranchCount: number = 0;
    // check if the nodes selected can be submited by verifying that, if a node is selected before a 
    // gateway, at least on node is selected inside the gateway
    this.branches.forEach(br => { 
      if (br.getGreenLight() && br.canBeValidated()) selectedBranchCount++;
    });

    console.log("can be validated");
    console.log(this);
    console.log(selectedBranchCount);
    console.log(this.getGreenLight());

    if (selectedBranchCount < 1) return false;

    if (this.nextNode != null && this.getGreenLight()) return this.nextNode.canBeValidated();

    return true;
  }

  public clone(): DiagramNode {
    var clonedBranches: Array<DiagramNode> = new Array<DiagramNode>(this.branches.length);
    this.branches.forEach(br => clonedBranches.push(br.clone()) );

    if (this.nextNode == null)
      return new InclusiveNode(null, this.greenLight, clonedBranches, this.gatewayId, this.pathVariables);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new InclusiveNode(nextNodeClone, this.greenLight, clonedBranches, this.gatewayId, this.pathVariables);
  }

  public getGreenLight(): boolean {
    return this.completedBranches() >= 1;
  }

  public getVariables(): Map<string, string> {
    var variables: Map<string, string> = new Map<string, string>();

    var variableIndex: number = 0;
    
    this.branches.forEach(br => { 
      if (br.getGreenLight() && !br.isSubmitted()) 
        variables.set(this.gatewayId + variableIndex, this.pathVariables[variableIndex]);
      
      variableIndex++;
    });

    console.log("inside get variables inclusive");
    console.log(variables);

    if (this.nextNode != null && this.getGreenLight()) 
      variables = new Map<string, string>({...variables, ...this.nextNode.getVariables()});

    return variables;
  }

}
