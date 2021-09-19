import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";

export class SubmittedNode extends DiagramNode{

    constructor(nextNode: DiagramNode) {
        super(nextNode, true);
    }

    public canEnable(): BasicNode[] {
        if (this.nextNode == null) return []; //throw new Error("Method not implemented.");

        return this.nextNode.canEnable();
    }
    
    public canDisable(): BasicNode[] {
        if (this.nextNode == null) return []; //throw new Error("Method not implemented.");

        return this.nextNode.canDisable();
    }

    public canBeValidated(): boolean {
        if (this.nextNode == null) return true; //throw new Error("Method not implemented.");

        return this.nextNode.canBeValidated();
    }

    public enable(): void {
        throw new Error("Method not implemented.");
    }

    public disable(): BasicNode[] {
        throw new Error("Method not implemented.");
    }

    public clone(): DiagramNode {
        throw new Error("Method not implemented.");
    }

    public getGreenLight(): boolean {
        return true;
    }

    public isSubmitted(): boolean {
        /*
        if (this.nextNode == null) return true;

        return this.nextNode.isSubmitted();
        */
        return true;
    }

    public getVariables(): Map<string, string> {
        if (this.nextNode != null)
          return this.nextNode.getVariables();
        
        return new Map<string, string>();
    }

    public hasActivityId(activityId: string): boolean {
        return false;
    }
  
  }
  