import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { Operation } from "../Operation";

export class FetchOp implements Operation {
    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph> {


        const query: ConceptGraph = args.getConceptDefinition('query')
        const workingMemorySlotConceptId: string | undefined = args.getConceptDefinition('working_memory_slot').getConceptIds()[0]
        if (workingMemorySlotConceptId === undefined) {
            return ConceptGraph.fromModel({
                'fetch_op_error': {
                    '-instance_of->': 'error',
                    '-has_message->': `missing required argument "working_memory_slot". Should be something like {"working_memory_slot": {"-defined_by->": "slot_000"}}`
                }
            })
        }
        const fetchedCg: ConceptGraph = await conceptGraphDao.findAndMergeMatches(query)
        workingMemory.forceDeleteConceptAndRelations(workingMemorySlotConceptId)
        fetchedCg.wrapAsDefinitionOf(workingMemorySlotConceptId)
        workingMemory.mergeFrom(fetchedCg)
        return new ConceptGraph()
    }

}