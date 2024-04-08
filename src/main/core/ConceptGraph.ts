import Graph from "graphology"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { IdGenerator } from "../util/IdGenerator"
import { ConceptGraphModel } from "../model/ConceptGraphModel"
import { parseConceptIdAndIsUnknown } from "../util/common"

export class ConceptGraph extends Graph<Concept, Relation> {

    private readonly idGen: IdGenerator = new IdGenerator()

    constructor () {
        super({
            multi: true
        })
    }

    addConcept (concept: Concept) {
        const conceptId: string = this.idGen.getNextUniqueId()
        this.addNode(conceptId, concept)
    }

    addConceptById (conceptId: string, concept: Concept) {
        this.addNode(conceptId, concept)
    }

    addConceptByIdIfNotExists (conceptId: string, concept: Concept) {
        const existingConceptId: string | undefined = this.findNode(((possibleExistingConceptId) => { return possibleExistingConceptId === conceptId }))
        if (existingConceptId === undefined) {
            this.addConceptById(conceptId, concept)
        }
    }

    addRelationByTypeIfNotExists (relationType: string, sourceConceptId: string, targetConceptId: string) {
        const relationKey: string = `${sourceConceptId}-${relationType}->${targetConceptId}`
        const existingRelationId: string | undefined = this.findEdge(((possibleExistingRelationId) => { return possibleExistingRelationId === relationKey }))
        if (existingRelationId === undefined) {
            this.addEdgeWithKey(relationKey, sourceConceptId, targetConceptId, {
                type: relationType
            })
        }
    }

    static copyFrom (graphToCopy: ConceptGraph): ConceptGraph {
        const copiedGraph: ConceptGraph = new ConceptGraph()
        return copiedGraph.mergeFrom(graphToCopy)
    }

    mergeFrom (graphToMerge: ConceptGraph): ConceptGraph {
        graphToMerge.forEachNode((ConceptId: string, nodeAttributes: Concept) => {
            const existingConceptId: string | undefined = this.findNode(((possibleExistingConceptId) => { return possibleExistingConceptId === ConceptId }))
            if (existingConceptId === undefined) {
                this.addNode(ConceptId, nodeAttributes)
            } else {
                this.mergeNodeAttributes(ConceptId, nodeAttributes)
            }
        })
        graphToMerge.forEachEdge((edgeId: string, edgeAttributes: Relation, sourceId: string, targetId: string) => {
            const existingRelationId: string | undefined = this.findEdge(((possibleExistingRelationId) => { return possibleExistingRelationId === edgeId }))
            if (existingRelationId === undefined) {
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
        for (const conceptIdAndRefIdStr in conceptModel) {
            const { conceptId, isUnknown } = parseConceptIdAndIsUnknown(conceptIdAndRefIdStr)
            if (Object.prototype.hasOwnProperty.call(conceptModel, conceptIdAndRefIdStr)) {
                conceptGraph.addConceptByIdIfNotExists(conceptId, {
                    description: conceptId,
                    isUnknown: isUnknown
                })
                const conceptRelations: { [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel }
                    = conceptModel[conceptIdAndRefIdStr]

                for (const relationKey in conceptRelations) {
                    if (Object.prototype.hasOwnProperty.call(conceptRelations, relationKey)) {
                        const relatedConcept: string | ConceptGraphModel = conceptRelations[relationKey as `-${string}->` | `<-${string}-`]
                        if (typeof relatedConcept === 'string') {
                            const { conceptId, isUnknown } = parseConceptIdAndIsUnknown(relatedConcept)
                            conceptGraph.addConceptByIdIfNotExists(conceptId, {
                                description: conceptId,
                                isUnknown: isUnknown
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
        for (const conceptIdAndRefIdStr in conceptModel) {
            const { conceptId, isUnknown } = parseConceptIdAndIsUnknown(conceptIdAndRefIdStr)
            if (Object.prototype.hasOwnProperty.call(conceptModel, conceptIdAndRefIdStr)) {
                const conceptRelations: { [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel }
                    = conceptModel[conceptIdAndRefIdStr]

                for (const relationKey in conceptRelations) {
                    const relationKeyWithoutArrows: string = relationKey
                        .split('-').join('')
                        .split('<').join('')
                        .split('>').join('')
                    const direction: 'sourceToTarget' | 'targetToSource' = relationKey.startsWith('<-') ? 'targetToSource' : 'sourceToTarget'
                    if (Object.prototype.hasOwnProperty.call(conceptRelations, relationKey)) {
                        const relatedConcept: string | ConceptGraphModel = conceptRelations[relationKey as `-${string}->` | `<-${string}-`]
                        if (typeof relatedConcept === 'string') {
                            const relatedConceptParsed: { conceptId: string, isUnknown: boolean | undefined } = parseConceptIdAndIsUnknown(relatedConcept)
                            if (direction === 'sourceToTarget') {
                                conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, conceptId, relatedConceptParsed.conceptId)
                            } else {
                                conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, relatedConceptParsed.conceptId, conceptId)
                            }
                        } else {
                            for (const relatedConceptId in relatedConcept) {
                                if (Object.prototype.hasOwnProperty.call(relatedConcept, relatedConceptId)) {
                                    const relatedConceptParsed: { conceptId: string, isUnknown: boolean | undefined } = parseConceptIdAndIsUnknown(relatedConceptId)

                                    if (direction === 'sourceToTarget') {
                                        conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, conceptId, relatedConceptParsed.conceptId)
                                    } else {
                                        conceptGraph.addRelationByTypeIfNotExists(relationKeyWithoutArrows, relatedConceptParsed.conceptId, conceptId)
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
        this.forEachEdge((edgeId: string, relation: Relation, sourceConceptId, targetConceptId, sourceConcept, targetConcept) => {
            if (relation.type === relationType) {
                matchedConceptGraph.addConceptByIdIfNotExists(targetConceptId, targetConcept)
                conceptIds.push(targetConceptId)
            }
        })
        this.forEachEdge((edgeId: string, relation: Relation, sourceConceptId, targetConceptId, sourceConcept, targetConcept) => {
            if (conceptIds.includes(sourceConceptId) && conceptIds.includes(targetConceptId)) {
                matchedConceptGraph.addConceptByIdIfNotExists(sourceConceptId, sourceConcept)
                matchedConceptGraph.addConceptByIdIfNotExists(targetConceptId, targetConcept)
                matchedConceptGraph.addEdgeWithKey(edgeId, sourceConceptId, targetConceptId, relation)
            }
        })


        return matchedConceptGraph
    }

    isEmpty (): boolean {
        return (this.nodes().length === 0)
    }

    toStringifiedModel(leadingConceptId?: string): string {
        return JSON.stringify(this.toModel(leadingConceptId), null, 2)
    }

    toModel (leadingConceptId?: string): ConceptGraphModel {
        if (this.isEmpty()) {
            return {}
        } else {
            let rootModel: ConceptGraphModel = {}
            const alreadyProcessedConceptIds: string [] = []

            if (leadingConceptId !== undefined) {
                rootModel = this._recursivelyBuildConceptGraphModel(leadingConceptId, alreadyProcessedConceptIds)
            }

            this.forEachNode(((conceptId) => {
                const curConceptModel: ConceptGraphModel = this._recursivelyBuildConceptGraphModel(conceptId, alreadyProcessedConceptIds)
                rootModel = {
                    ...rootModel,
                    ...curConceptModel
                }
            }))
            return rootModel
        }
    }

    private _recursivelyBuildConceptGraphModel (curConceptId: string, alreadyProcessedConceptIds: string[] = []): ConceptGraphModel {
        if (alreadyProcessedConceptIds.includes(curConceptId)) {
            // const model: ConceptGraphModel = {}
            // model[conceptId] = {}
            return {}
        }
        alreadyProcessedConceptIds.push(curConceptId)
        const conceptModel: ConceptGraphModel = {}

        
        const curConcept: Concept = this.getNodeAttributes(curConceptId)
        const curConceptKey: string = curConcept.isUnknown === true ? '?' + curConceptId : curConceptId
        conceptModel[curConceptKey] = {}

        this.forEachEdge(curConceptId, (relationId, relation, sourceConceptId, targetConceptId, sourceConcept, targetConcept) => {
            const direction: 'conceptToNeighbour' | 'neighbourToConcept' = sourceConceptId === curConceptId ? 'conceptToNeighbour' : 'neighbourToConcept'
            const relationKey: `<-${string}-` | `-${string}->` = direction === 'conceptToNeighbour' ? `-${relation.type}->` : `<-${relation.type}-`

            const neighbourConceptId: string = direction === 'conceptToNeighbour' ? targetConceptId : sourceConceptId
            const neighbourConcept: Concept = direction === 'conceptToNeighbour' ? targetConcept : sourceConcept
            const neighbourConceptKey: string = neighbourConcept.isUnknown === true ? '?' + neighbourConceptId : neighbourConceptId

            const doesRelationAlreadyExist: boolean = conceptModel[curConceptKey][relationKey] !== undefined

            const downstreamModel: ConceptGraphModel = this._recursivelyBuildConceptGraphModel(neighbourConceptId, alreadyProcessedConceptIds)
            const shouldAddDownstreamModel: boolean = downstreamModel[neighbourConceptKey] !== undefined
            if (shouldAddDownstreamModel) {
                const isDownstreamADeepModel: boolean = Object.keys(downstreamModel[neighbourConceptKey] ?? {}).length > 0
    
                if (!doesRelationAlreadyExist) {
                    conceptModel[curConceptKey][relationKey] = isDownstreamADeepModel ? downstreamModel : neighbourConceptKey
                } else if (typeof conceptModel[curConceptKey][relationKey] === 'string') {
                    const exisingConceptKey: string = conceptModel[curConceptKey][relationKey] as string
                    conceptModel[curConceptKey][relationKey] = {};
                    (conceptModel[curConceptKey][relationKey] as ConceptGraphModel)[exisingConceptKey] = {};
                    (conceptModel[curConceptKey][relationKey] as ConceptGraphModel)[neighbourConceptKey] = downstreamModel[neighbourConceptKey]?? {}
                } else {
                    (conceptModel[curConceptKey][relationKey] as ConceptGraphModel)[neighbourConceptKey] = downstreamModel[neighbourConceptKey]?? {}
                }
            }
        })
        return conceptModel
    }

    // toString (): string {
    //     const conceptGraphModel: ConceptGraphModel = this._
    // }
}