import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { Operation } from "../Operation";

export class PrintConceptsOp implements Operation {
    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph>{
        return args
    }

}