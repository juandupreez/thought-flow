import { ConceptGraph } from "../concepts/ConceptGraph"
import { Op } from "../ops/Op"

export interface KnowledgeBase {
    getGeneralUnknownConceptGraph (): ConceptGraph | PromiseLike<ConceptGraph>
    findBestMatch (question: ConceptGraph): Promise<ConceptGraph>
    fetchNextOp (op: Op):  Promise<Op>     
}