import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { ExclusiveNode } from "./exclusive-node";
import { GatewayNode } from "./gateway-node";
import { ParallelNode } from "./parallel-node";

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

    if (this.nextNode != null && this.getGreenLight()) {
      if (variables.size > 0) 
        this.nextNode.getVariables().forEach((v, k) => variables.set(k, v));
      else 
        variables = this.nextNode.getVariables();
      
    }

    return variables;
  }

  public static inferGatewayInstance(nextNode: DiagramNode, branches: Array<DiagramNode>, currentActivityIds: Array<string>): boolean {
    console.log("inside infer gateway inclusive");
    console.log("next node");
    console.log(nextNode);
    
    // if the next node is already submitted, the gateway has to be a SubmittedNode
    if (nextNode != null && nextNode.isSubmitted() ) {
      console.log("next node was submitted");
      return false;
    }

    var numberOfOpenPaths: number = 0;
    var hasUnfinishedBranch: boolean = false;

    // one or more paths have to be completely submitted and none of the starting branch nodes can be in the 
    // currentActivityIds to be a SubmittedNode (return false case)
    branches.forEach(node => { 
      var currentNode: DiagramNode = node;

      // verify if the path is fully submitted
      if (currentNode.isSubmitted() ) {
        console.log("this node is submitted");
        console.log(node);

        while (currentNode.nextNode != null) {
          currentNode = currentNode.nextNode;

          if (!currentNode.isSubmitted() ) { 
            console.log("this node wasnt submitted");
            console.log(currentNode);

            hasUnfinishedBranch = true;//return true;
          }

        }
        

        //return false;
      } else {
        numberOfOpenPaths++;

        // verify if the node is in the currentActivityIds
        if (node instanceof BasicNode && currentActivityIds.indexOf(node.activityId) != -1) {
          hasUnfinishedBranch = true;//return true;

        } else if (node instanceof GatewayNode) {
          //if (ExclusiveNode.inferGatewayInstance(node.nextNode, node.branches) ) 
          //return true;
          currentActivityIds.forEach(id => {
            if(node.hasActivityId(id)) hasUnfinishedBranch = true;//return true;
          });

        }
      }

    });

    if (numberOfOpenPaths == branches.length)
      return true;
    
    //return true;
    return hasUnfinishedBranch;//return false;
  }

}
