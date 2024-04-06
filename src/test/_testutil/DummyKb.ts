import { Concept } from "../../main/model/Concept"
import { ConceptGraph } from "../../main/concepts/ConceptGraph"
import { KnowledgeBase } from "../../main/kb/KnowledgeBase"
import { Op } from "../../main/ops/Op"
import Graph from "graphology"
import { OpGraph } from "../../main/ops/OpGraph"
import { genId } from "../../main/util/IdGenerator"
import { Relation } from "../../main/model/Relation"

export interface DummyKbDb {
    opGraph: OpGraph,
    conceptGraph: ConceptGraph
}

export class DummyKb implements KnowledgeBase {

    private db: DummyKbDb = {
        opGraph: new OpGraph(),
        conceptGraph: new ConceptGraph()
    }

    constructor (db?: DummyKbDb) {
        if (db !== undefined) {
            this.db = db
        }
    }

    async getGeneralUnknownConceptGraph (): Promise<ConceptGraph> {
        const theUnknownConceptGraph: ConceptGraph = new ConceptGraph()

        let id: string | undefined = this.db.conceptGraph.findNode((node: string, attributes: Concept) => {
            return attributes.description === 'unknown'
        })
        if (id === undefined) {
            console.warn('No "unknown" concept found. Creating it in KB')
            id = this.db.conceptGraph.addNode('kb_000' + genId(), { description: 'unkown' })
        }

        const unknownConceptNode: Concept = this.db.conceptGraph.getNodeAttributes(id)
        theUnknownConceptGraph.addNode(id, { ...unknownConceptNode, refId: id })


        return theUnknownConceptGraph
    }

    async findBestMatch (query: ConceptGraph): Promise<ConceptGraph> {
        const matchedConceptGraph: ConceptGraph = new ConceptGraph()

        const unkownConceptId: string | undefined = query.findNode((key: string, attributes: Concept) => { return attributes.description === 'unknown' })
        if (unkownConceptId === undefined) {
            return matchedConceptGraph
        }
        query.forEachEdge(unkownConceptId, (edgeId: string, attributes: Relation, sourceId: string, targetId: string,
            sourceAttributes: Concept, targetAttributes: Concept
        ) => {


            let neighbourId: string = sourceId === unkownConceptId ? targetId : sourceId
            let neighbourAttributes: Concept = sourceId === unkownConceptId ? targetAttributes : sourceAttributes

            this.db.conceptGraph.forEachEdge((
                kbRelationId: string, kbEdgeAttributes: Relation, kbSourceId: string, kbTargetId: string,
                kbSourceAttributes: Concept, kbTargetAttributes: Concept
            ) => {
                const doesEdgeMatch: boolean = [attributes.type].includes(kbEdgeAttributes.type)
                const doesNeighbourIdMatch: boolean = neighbourAttributes.refId !== undefined
                    && (neighbourAttributes.refId === kbSourceId || neighbourAttributes.refId === kbTargetId)
                if (doesEdgeMatch && doesNeighbourIdMatch) {

                }
            })

        })

        return matchedConceptGraph
    }

    fetchNextOp (op: Op): Promise<Op> {
        throw new Error("Method not implemented.")
    }

}