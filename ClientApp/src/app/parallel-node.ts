import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class ParallelNode extends GatewayNode {

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
    console.log(this.branches.length);
    console.log(this.getGreenLight());

    if (selectedBranchCount != this.branches.length) return false;

    if (this.nextNode != null && this.getGreenLight()) return this.nextNode.canBeValidated();

    return true;
  }

  public clone(): DiagramNode {
    var clonedBranches: Array<DiagramNode> = new Array<DiagramNode>(this.branches.length);
    this.branches.forEach(br => clonedBranches.push(br.clone()));

    if (this.nextNode == null)
      return new ParallelNode(null, this.greenLight, clonedBranches, this.gatewayId, this.pathVariables);

    var nextNodeClone: DiagramNode = this.nextNode.clone();
    return new ParallelNode(nextNodeClone, this.greenLight, clonedBranches, this.gatewayId, this.pathVariables);
  }

  public getGreenLight(): boolean {
    return this.completedBranches() == this.branches.length;
  }

  public getVariables(): Map<string, string> {
    var variables: Map<string, string> = new Map<string, string>();

    var variableIndex: number = 0;
    
    this.branches.forEach(br => { 
      if (br.getGreenLight() && !br.isSubmitted()) 
        variables.set(this.gatewayId + variableIndex, this.pathVariables[variableIndex]);
      
      variableIndex++;
    });

    console.log("inside get variables parallel");
    console.log(variables);

    if (this.nextNode != null && this.getGreenLight()) 
      this.nextNode.getVariables().forEach((v, k) => variables.set(k, v));

    return variables;
  }

  public static inferGatewayInstance(nextNode: DiagramNode, branches: Array<DiagramNode>): boolean {
    console.log("inside infer gateway parallel");
    console.log("next node");
    console.log(nextNode);

    // if the next node is already submitted, the gateway has to be a SubmittedNode
    if (nextNode != null && nextNode.isSubmitted() ) {
      console.log("next node was submitted");
      console.log(nextNode);
      return false;
    }

    var hasUnfinishedBranch: boolean = false;
    
    // one path has to be completely submitted to be a SubmittedNode
    branches.forEach(node => { 
      var currentNode: DiagramNode = node;

      while (currentNode.isSubmitted() && currentNode.nextNode != null) {
        currentNode = currentNode.nextNode;
      }

      if (!currentNode.isSubmitted() ) {
        console.log("found a unsubmitted path");
        hasUnfinishedBranch = true;
      }

      /*
      // verify if the path is fully submitted
      if (node.isSubmitted() ) {
        console.log("this node is submitted");
        console.log(node);
        var currentNode: DiagramNode = node.nextNode;

        while (currentNode != null) {
          if (!currentNode.isSubmitted() ) { 
            console.log("this node wasnt submitted");
            console.log(currentNode);

            hasUnfinishedBranch = true;//return true;
          }
          currentNode = currentNode.nextNode;
        }

      } 
      /*
      else {
        return false;
      }
      */

    });

    return hasUnfinishedBranch;//return false;
  }

}
