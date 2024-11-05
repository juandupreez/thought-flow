import { ConceptGraph } from "../core/ConceptGraph";
import { ConceptGraphDao } from "../dao/ConceptGraphDao";

export interface Operation {
    execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph>

}