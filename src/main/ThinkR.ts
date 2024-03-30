import { NodePredicate } from "graphology-types"
import { ConceptGraph } from "./concepts/ConceptGraph"
import { KnowledgeBase } from "./kb/KnowledgeBase"
import { Op } from "./ops/Op"
import { OpType } from "./ops/OpType"
import { Concept } from "./concepts/Concept"

export class ThinkR {
    private readonly kb: KnowledgeBase

    constructor (kb: KnowledgeBase) {
        this.kb = kb
    }

    async runProgram (op: Op, args: ConceptGraph[]): Promise<ConceptGraph> {
        const maxLoop: number = 10
        let i: number = 0

        let result: ConceptGraph = await op.execute(this.kb, args)

        while (op.type !== OpType.HALT && i < maxLoop) {
            const nextOp: Op = await this.kb.fetchNextOp(op)
            result = await nextOp.execute(this.kb, args)
            i++
        }
        return result
    }

    async runCustomAnswerQuestionProgram (question: ConceptGraph): Promise<ConceptGraph> {
        const dbMatch: ConceptGraph = await this.kb.findBestMatch(question)
        if (dbMatch.nodes.length === 0) { // Could not find result
            return this.kb.getGeneralUnknownConceptGraph()
        } else {
            return dbMatch
        }
    }
}