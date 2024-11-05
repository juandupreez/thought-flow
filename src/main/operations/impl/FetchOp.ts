import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { Operation } from "../Operation";

export class FetchOp implements Operation {
    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<void>{
        const fetchedCg: ConceptGraph = await conceptGraphDao.findAndMergeMatches(args)
        workingMemory.mergeFrom(fetchedCg)
    }

}