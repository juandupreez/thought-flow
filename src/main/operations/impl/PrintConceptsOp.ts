import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { glog } from "../../util/Logger";
import { Operation } from "../Operation";

export class PrintConceptsOp implements Operation {
    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph>{
        const potentialError: ConceptGraph = args.checkConceptIdDefinitions('print_concepts_op_error', [
            'print_concepts_op_arg-slot_to_print'
        ])
        if (!potentialError.isEmpty()) {
            return potentialError
        }

        const slotToPrintConceptId: string = args.getConceptDefinition('print_concepts_op_arg-slot_to_print').getConceptIds()[0]
        const slotValue: ConceptGraph = workingMemory.getConceptDefinition(slotToPrintConceptId)
        glog().info(`\tprinting from slot: ${slotToPrintConceptId}`)
        glog().info(`\tOFFICIAL PRINT: ${slotValue.toString()}`)
        return new ConceptGraph()
        
    }

}