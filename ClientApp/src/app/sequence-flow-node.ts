import { BasicNode } from "./basic-node";
import { DiagramNode } from "./diagram-node";
import { GatewayNode } from "./gateway-node";

export class SequenceFlowNode extends DiagramNode {
    // the id that identifies the node connected to the end (gateway or task)
    public nextNodeId: string;
    // property that indicated whether the current node was already submitted in the system
    public submitted: boolean;

    constructor(nextNode: DiagramNode, greenLight: boolean, sequenceFlowId: string, nextNodeId: string) {
        super(nextNode, sequenceFlowId, greenLight);
        this.nextNodeId = nextNodeId;
        this.submitted = false;
    }

    public canEnable(): DiagramNode[] {
        if (this.submitted) {
            if (this.nextNode == null) return []; 

            return this.nextNode.canEnable();
        }

        if (this.greenLight == false)
            return [this];
        if (this.nextNode != null)
            return this.nextNode.canEnable();

        return new Array<DiagramNode>();
    }

    public canDisable(): DiagramNode[] {
        if (this.submitted) {
            if (this.nextNode == null) return []; 

            return this.nextNode.canDisable();
        }

        var canDisable: Array<DiagramNode> = new Array<DiagramNode>();
        if (this.greenLight == true)
            canDisable.push(this);
        if (this.nextNode != null)
            canDisable = canDisable.concat(this.nextNode.canDisable());

        return canDisable;
    }

    public canBeValidated(): boolean {
        if (this.submitted) {
            if (this.nextNode == null) return true; 

            return this.nextNode.canBeValidated();
        }

        if (this.greenLight == true && this.nextNode != null)
            return this.nextNode.canBeValidated();

        return true;
    }

    public enable(): void {
        this.greenLight = true;
    }

    public disable(): DiagramNode[] {
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

    public clone(): DiagramNode {
        if (this.nextNode == null)
            return new BasicNode(null, this.greenLight, this.id);

        var nextNodeClone: DiagramNode = this.nextNode.clone();
        return new BasicNode(nextNodeClone, this.greenLight, this.id);
    }

    public getGreenLight(): boolean {
        return this.greenLight;
    }

    public isSubmitted(): boolean {
        return this.submitted;
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
