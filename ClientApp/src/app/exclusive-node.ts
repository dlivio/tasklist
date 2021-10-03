import { notDeepStrictEqual } from "assert";
import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";
import { InclusiveNode } from "./inclusive-node";
import { ParallelNode } from "./parallel-node";

export class ExclusiveNode extends GatewayNode {

  public canEnable(): BasicNode[] {
    var selectedNode: DiagramNode = null;
    // do a first iteration to see if there is already as selected path and prevent the others from 
    // entering the canEnable array
    this.branches.forEach(br => {
      if (selectedNode == null && br.getGreenLight() == true) selectedNode = br;
    });

    var canEnable: Array<BasicNode> = new Array<BasicNode>();

    if (selectedNode != null) 
      canEnable = canEnable.concat(selectedNode.canEnable());
    else 
      this.branches.forEach(br => canEnable = canEnable.concat(br.canEnable()) );

    if (this.getGreenLight() && this.nextNode != null)
      canEnable = canEnable.concat(this.nextNode.canEnable());

    return canEnable;
  }

  public canBeValidated(): boolean {

    var isValid: boolean = true;

    var selectedBranchCount: number = 0;
    // check if the nodes selected can be submited by verifying that, if a node is selected before a 
    // gateway, at least on node is selected inside the gateway
    this.branches.forEach(br => { 
      if (br.getGreenLight() ) {
        selectedBranchCount++;
        isValid = isValid && br.canBeValidated(); 
      }
    });

    if (selectedBranchCount != 1 || !isValid) return false;

    if (this.nextNode != null && this.getGreenLight()) return this.nextNode.canBeValidated();

    return true;
  }

  public clone(): DiagramNode {
    var clonedBranches: Array<DiagramNode> = new Array<DiagramNode>(this.branches.length);
    this.branches.forEach(br => clonedBranches.push(br.clone()));

    if (this.nextNode == null)
      return new ExclusiveNode(null, this.greenLight, clonedBranches, this.gatewayId, this.pathVariables);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new ExclusiveNode(nextNodeClone, this.greenLight, clonedBranches, this.gatewayId, this.pathVariables);
  }

  public getGreenLight(): boolean {
    return this.completedBranches() == 1;
  }

  public getVariables(): Map<string, string> {
    var variables: Map<string, string> = new Map<string, string>();

    var variableIndex: number = 0;
    
    console.log("inside get variables of exclusive gateway: " + this.gatewayId);
    console.log(this.pathVariables);

    this.branches.forEach(br => { 
      if (br.getGreenLight() && !br.isSubmitted()) {
        if (br instanceof BasicNode) {
          variables.set(br.activityId, this.pathVariables[variableIndex]);

        } else if (br instanceof GatewayNode) {
          variables.set(br.gatewayId, this.pathVariables[variableIndex]);
          if (br.nextNode != null)
            br.nextNode.getVariables().forEach((v, k) => variables.set(k, v));
        
        } else { // case where the gateway has a path leading only to the end gateway
          //variables.set(br.gatewayId, this.pathVariables[variableIndex]);
        
        }

      } else {
        if (br instanceof BasicNode) {
          variables.set(br.activityId, "");

        } else if (br instanceof GatewayNode) {
          variables.set(br.gatewayId, "");
        }
      }
      variableIndex++;
    });

    if (this.nextNode != null && this.getGreenLight())
      this.nextNode.getVariables().forEach((v, k) => variables.set(k, v));
    
    return variables;
  }

  public static inferGatewayInstance(nextNode: DiagramNode, branches: Array<DiagramNode>): boolean {
    // if the next node is already submitted, the gateway has to be a SubmittedNode
    if (nextNode != null && nextNode.isSubmitted() ) {
      return false;
    }

    var noSubmittedPath: boolean = true;

    // one path has to be completely submitted to be a SubmittedNode
    branches.forEach(node => { 
      var currentNode: DiagramNode = node;

      while (currentNode.isSubmitted() && currentNode.nextNode != null) {
        currentNode = currentNode.nextNode;
      }

      if (currentNode.isSubmitted() ) {
        noSubmittedPath = false;
      }
    });

    return noSubmittedPath;
  }

}
