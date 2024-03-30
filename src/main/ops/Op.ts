import { ConceptGraph } from "../concepts/ConceptGraph"
import { KnowledgeBase } from "../kb/KnowledgeBase"
import { OpType } from "./OpType"

export interface Op {
    type: OpType
    execute (memory: KnowledgeBase, args: ConceptGraph[]): Promise<ConceptGraph>
}