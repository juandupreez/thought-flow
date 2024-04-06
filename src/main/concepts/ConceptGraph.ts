import Graph from "graphology"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { IdGenerator } from "../util/IdGenerator"
import { ConceptGraphModel } from "../model/ConceptGraphModel"
import { parseConceptKeyAndRefId } from "../util/common"

export class ConceptGraph extends Graph<Concept, Relation> {

    private readonly idGen: IdGenerator = new IdGenerator()

    constructor () {
        super({
            multi: true
        })
    }

    addConcept (concept: Concept) {
        const key: string = this.idGen.getNextUniqueId()
        this.addNode(key, concept)
    }

    addConceptByKey (key: string, concept: Concept) {
        this.addNode(key, concept)
    }

    addConceptByKeyIfNotExists (key: string, concept: Concept) {
        const existingNodeId: string | undefined = this.findNode(((possibleExistingNodeId) => { return possibleExistingNodeId === key }))
        if (existingNodeId === undefined) {
            this.addConceptByKey(key, concept)
        }
    }

    addRelationByTypeIfNotExists (relationType: string, sourceConceptKey: string, targetConceptKey: string) {
        const relationKey: string = `${sourceConceptKey}-${relationType}->${targetConceptKey}`
        const existingEdgeId: string | undefined = this.findEdge(((possibleExistingEdgeId) => { return possibleExistingEdgeId === relationKey }))
        if (existingEdgeId === undefined) {
            this.addEdgeWithKey(relationKey, sourceConceptKey, targetConceptKey, {
                type: relationType
            })
        }
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

    static fromModel (conceptModel: ConceptGraphModel): ConceptGraph {
        const conceptGraph: ConceptGraph = new ConceptGraph()

        this._fillNodesRecursively(conceptModel, conceptGraph)

        this._fillEdgesRecursively(conceptModel, conceptGraph)

        return conceptGraph
    }

    private static _fillNodesRecursively (conceptModel: ConceptGraphModel, conceptGraph: ConceptGraph) {
        for (const conceptKeyAndRefIdStr in conceptModel) {
            const { conceptKey, refId } = parseConceptKeyAndRefId(conceptKeyAndRefIdStr)
            if (Object.prototype.hasOwnProperty.call(conceptModel, conceptKeyAndRefIdStr)) {
                conceptGraph.addConceptByKeyIfNotExists(conceptKey, {
                    description: conceptKey,
                    refId: refId
                })
                const conceptRelations: { [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel }
                    = conceptModel[conceptKeyAndRefIdStr]

                for (const relationKey in conceptRelations) {
                    if (Object.prototype.hasOwnProperty.call(conceptRelations, relationKey)) {
                        const relatedConcept: string | ConceptGraphModel = conceptRelations[relationKey as `-${string}->` | `<-${string}-`]
                        if (typeof relatedConcept === 'string') {
                            const { conceptKey, refId } = parseConceptKeyAndRefId(relatedConcept)
                            conceptGraph.addConceptByKeyIfNotExists(conceptKey, {
                                description: conceptKey,
                                refId: refId
                            })
                        } else {
                            this._fillNodesRecursively(relatedConcept, conceptGraph)
                        }

                    }
                }
            }
        }
    }

    private static _fillEdgesRecursively (conceptModel: ConceptGraphModel, conceptGraph: ConceptGraph) {
        for (const conceptKeyAndRefIdStr in conceptModel) {
            const { conceptKey, refId } = parseConceptKeyAndRefId(conceptKeyAndRefIdStr)
            if (Object.prototype.hasOwnProperty.call(conceptModel, conceptKeyAndRefIdStr)) {
                const conceptRelations: { [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel }
                    = conceptModel[conceptKeyAndRefIdStr]

                for (const relationKey in conceptRelations) {
                    const relationKeyWithoutArrows: string = relationKey
                        .split('-').join('')
                        .split('<').join('')
                        .split('>').join('')
                    const direction: 'sourceToTarget' | 'targetToSource' = relationKey.startsWith('<-') ? 'targetToSource' : 'sourceToTarget'
                    if (Object.prototype.hasOwnProperty.call(conceptRelations, relationKey)) {
                        const relatedConcept: string | ConceptGraphModel = conceptRelations[relationKey as `-${string}->` | `<-${string}-`]
                        if (typeof relatedConcept === 'string') {
                            const relatedConceptParsed: { conceptKey: string, refId: string | undefined } = parseConceptKeyAndRefId(relatedConcept)
                            if (direction === 'sourceToTarget') {
                                conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, conceptKey, relatedConceptParsed.conceptKey)
                            } else {
                                conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, relatedConceptParsed.conceptKey, conceptKey)
                            }
                        } else {
                            for (const relatedConceptKey in relatedConcept) {
                                if (Object.prototype.hasOwnProperty.call(relatedConcept, relatedConceptKey)) {
                                    const relatedConceptParsed: { conceptKey: string, refId: string | undefined } = parseConceptKeyAndRefId(relatedConceptKey)

                                    if (direction === 'sourceToTarget') {
                                        conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, conceptKey, relatedConceptParsed.conceptKey)
                                    } else {
                                        conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, relatedConceptParsed.conceptKey, conceptKey)
                                    }
                                }
                            }
                            this._fillEdgesRecursively(relatedConcept, conceptGraph)
                        }

                    }
                }
            }
        }
    }

    /**
     * Gets defining concepts and relations
     * 
     * @description
     * For:
     * 
     * {
            "sun": {
                "-is->": {
                    "object": {
                        "-in->": {
                            "sky": {
                                "<-is-": "sun"
                            }
                        }
                    }
                }
            }
        }

        getConceptDefinitionByRelationType('is') should return

        {
            "object": {
                "-in->": "sky"
            }
        }
     */
    getConceptDefinitionByRelationType (relationType: string): ConceptGraph {
        const matchedConceptGraph: ConceptGraph = new ConceptGraph()
        const conceptIds: string[] = []
        // add all concepts which are targets of relation type: x-relationType->targetConcept
        this.forEachEdge((edgeId: string, relation: Relation, sourceConceptKey, targetConceptKey, sourceConcept, targetConcept) => {
            if (relation.type === relationType) {
                matchedConceptGraph.addConceptByKeyIfNotExists(targetConceptKey, targetConcept)
                conceptIds.push(targetConceptKey)
            }
        })
        this.forEachEdge((edgeId: string, relation: Relation, sourceConceptKey, targetConceptKey, sourceConcept, targetConcept) => {
            if (conceptIds.includes(sourceConceptKey) && conceptIds.includes(targetConceptKey)) {
                matchedConceptGraph.addConceptByKeyIfNotExists(sourceConceptKey, sourceConcept)
                matchedConceptGraph.addConceptByKeyIfNotExists(targetConceptKey, targetConcept)
                matchedConceptGraph.addEdgeWithKey(edgeId, sourceConceptKey, targetConceptKey, relation)
            }
        })


        return matchedConceptGraph
    }

    // toString (): string {
    //     const conceptGraphModel: ConceptGraphModel = this._
    // }
}