import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { glog } from "../../util/Logger";
import { Operation } from "../Operation";

export class FetchOp implements Operation {
    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph> {
        const potentialError: ConceptGraph = args.checkConceptIdDefinitions('fetch_op_error', [
            'fetch_op_arg-query',
            'fetch_op_arg-result_slot'
        ])
        if (!potentialError.isEmpty()) {
            return potentialError
        }

        const query: ConceptGraph = args.getConceptDefinition('fetch_op_arg-query')
        const workingMemorySlotConceptId: string = args.getConceptDefinition('fetch_op_arg-result_slot').getConceptIds()[0]
        
        const fetchedCg: ConceptGraph = await conceptGraphDao.findAndMergeMatches(query)
        if (fetchedCg.isEmpty()) {
            glog().debug(query.toString())
            return ConceptGraph.fromModel({
                'fetch_op_error': {
                    '-instance_of->': 'error',
                    '-has_message->': `query returned empty result`
                }
            })
        }
        glog().info('\tresult found. saving to slot:  ' + workingMemorySlotConceptId)


        workingMemory.forceDeleteConceptAndRelations(workingMemorySlotConceptId)
        fetchedCg.wrapAsDefinitionOf(workingMemorySlotConceptId)
        workingMemory.mergeFrom(fetchedCg)
        return new ConceptGraph()
    }

}