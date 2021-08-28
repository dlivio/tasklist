abstract class GatewayNode extends DiagramNode {
  // array with the first node of each branch of the gateway
  public branches: Array<DiagramNode>;

  constructor(nextNode: DiagramNode, greenLight: boolean, branches: Array<DiagramNode>) {
    super(nextNode, greenLight);
    this.branches = branches;
  }

  public addBranch(branch: DiagramNode): void {
    this.branches.push(branch);

    var currentNode: DiagramNode = branch;
    while (currentNode != null) {
      currentNode.setParentGatewayNode(this);
      currentNode = currentNode.nextNode;
    }
  }

  public disable(): void {
    this.branches.forEach(br => br.disable());
  }

  public completedBranches(): number {
    var completedBranches: number = 0;
    this.branches.forEach(function (br) {
      var currentNode: DiagramNode = br;

      while (currentNode.getGreenLight() && currentNode.nextNode != null) {
        currentNode = currentNode.nextNode;
      }

      if (currentNode.getGreenLight() && currentNode.nextNode == null)
        completedBranches++;
    });

    return completedBranches;
  }

}
