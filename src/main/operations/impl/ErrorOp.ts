import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { Operation } from "../Operation";

export class ErrorOp implements Operation {
    errorCg: ConceptGraph;

    constructor(errorCg: ConceptGraph) {
        this.errorCg = errorCg
    }

    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph>{
        return args
    }

}