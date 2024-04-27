import { ConceptGraph } from "../../core/ConceptGraph";
import { Operation } from "../Operation";

export class NoOp implements Operation {
    async execute(args: ConceptGraph): Promise<ConceptGraph> {
        return args
    }

}