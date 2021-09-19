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
    var selectedBranchCount: number = 0;
    // check if the nodes selected can be submited by verifying that, if a node is selected before a 
    // gateway, at least on node is selected inside the gateway
    this.branches.forEach(br => { 
      if (br.getGreenLight() && br.canBeValidated()) selectedBranchCount++;
    });

    if (selectedBranchCount != 1) return false;

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
    
    this.branches.forEach(br => { 
      if (br.getGreenLight() && !br.isSubmitted()) 
        variables.set(this.gatewayId + variableIndex, this.pathVariables[variableIndex]);
      
      variableIndex++;
    });

    console.log("inside get variables exclusive");
    console.log(variables);

    if (variables.size > 1) throw new Error("Exclusive gateway has more than 1 path.");

    if (this.nextNode != null && this.getGreenLight())
      this.nextNode.getVariables().forEach((v, k) => variables.set(k, v));
    
    return variables;
  }

  public static inferGatewayInstance(nextNode: DiagramNode, branches: Array<DiagramNode>): boolean {
    console.log("inside infer gateway exclusive");
    console.log("next node");
    console.log(nextNode);

    // if the next node is already submitted, the gateway has to be a SubmittedNode
    if (nextNode != null && nextNode.isSubmitted() ) {
      console.log("next node was submitted");
      console.log(nextNode);
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
        console.log("found a submitted path");
        noSubmittedPath = false;
      }

      /*
      // verify if the path is fully submitted
      if (node.isSubmitted() ) {
        console.log("this node is submitted");
        console.log(node);
        var currentNode: DiagramNode = node.nextNode;

        while (currentNode != null) {
          if (currentNode.isSubmitted() ) { 
            console.log("this node was submitted");
            console.log(currentNode);

            noSubmittedPath = false;//return true;
          }
          currentNode = currentNode.nextNode;
        }

        //return false;
      }
      */

    });

    return noSubmittedPath;//return true;

    /*
    var startedPaths: number = 0;
    var submittedPaths: number = 0;

    branches.forEach(node => {
      
      // check if the node has any of the current activity id's 
      if (node instanceof BasicNode) {
        if (currentActivityIds.indexOf(node.activityId) != -1)
          return true;

      } else if (node instanceof ExclusiveNode) {
        if (ExclusiveNode.inferGatewayInstance(node.branches, currentActivityIds) ) 
          return true;

      } else if (node instanceof InclusiveNode) {
        if (InclusiveNode.inferGatewayInstance(node.branches, currentActivityIds) ) 
          return true;
        
      } else if (node instanceof ParallelNode) {
        if (ParallelNode.inferGatewayInstance(node.branches, currentActivityIds) ) 
          return true;
        
      }

      if (node.getGreenLight()) startedPaths++;

      if (node.isSubmitted()) submittedPaths++;

    });

    if (submittedPaths > 0 && startedPaths == submittedPaths) {
      return false;
    }

    
    return true;
    */
  }

}
