import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { glog } from "../../util/Logger";
import { Operation } from "../Operation";

export class PrintConceptsOp implements Operation {
    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<void>{
        workingMemory.getConceptIds().forEach((conceptId: string) => {
            glog().info(`OFFICIAL PRINT: ${conceptId}`)
        })
        
    }

}