import { ConceptGraph } from "../../core/ConceptGraph";
import { Operation } from "../Operation";

export class HaltOp implements Operation {
    async execute(args: ConceptGraph): Promise<ConceptGraph> {
        return new ConceptGraph()
    }

}