import { ConceptGraph } from "../concepts/ConceptGraph"
import { KnowledgeBase } from "../kb/KnowledgeBase"
import { Op } from "./Op"
import { OpType } from "./OpType"

export class HaltOp implements Op {
    type: OpType = OpType.HALT
    async execute (memory: KnowledgeBase, args: ConceptGraph[]): Promise<ConceptGraph> {
        return args[0]
    }
}