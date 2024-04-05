import Graph from "graphology"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { IdGenerator } from "../util/IdGenerator"
import { ConceptGraphModel } from "../model/ConceptGraphModel"

export class ConceptGraph extends Graph<Concept, Relation> {

    private readonly idGen: IdGenerator = new IdGenerator()

    addConcept (concept: Concept) {
        const key: string = this.idGen.getNextUniqueId()
        this.addNode(key, concept)
    }

    static copyFrom (graphToCopy: ConceptGraph): ConceptGraph {
        const copiedGraph: ConceptGraph = new ConceptGraph()
        return copiedGraph.mergeFrom(graphToCopy)
    }

    mergeFrom (graphToMerge: ConceptGraph): ConceptGraph {
        graphToMerge.forEachNode((nodeId: string, nodeAttributes: Concept) => {
            const existingNodeId: string | undefined = this.findNode(((possibleExistingNodeId) => { return possibleExistingNodeId === nodeId }))
            if (existingNodeId === undefined) {
                this.addNode(nodeId, nodeAttributes)
            } else {
                this.mergeNodeAttributes(nodeId, nodeAttributes)
            }
        })
        graphToMerge.forEachEdge((edgeId: string, edgeAttributes: Relation, sourceId: string, targetId: string) => {
            const existingEdgeId: string | undefined = this.findEdge(((possibleExistingEdgeId) => { return possibleExistingEdgeId === edgeId }))
            if (existingEdgeId === undefined) {
                this.addEdgeWithKey(edgeId, sourceId, targetId, edgeAttributes)
            } else {
                this.mergeEdgeAttributes(edgeId, edgeAttributes)
            }
        })
        return this
    }

    // toString (): string {
    //     const conceptGraphModel: ConceptGraphModel = this._
    // }
}