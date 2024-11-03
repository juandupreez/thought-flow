import Graph from "graphology"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { IdGenerator } from "../util/IdGenerator"
import { ConceptGraphModel } from "../model/ConceptGraphModel"
import { isConceptUnknown, parseConceptIdAndIsUnknown } from "../util/common"

export class ConceptGraph extends Graph<Concept, Relation> {
    getConcepts(): Concept[] {
        const concepts: Concept[] = []
        this.forEachNode((conceptId: string, concept: Concept) => {
            concepts.push(concept)
        })
        return concepts
    }
    getConceptIds(): string[] {
        const conceptIds: string[] = []
        this.forEachNode((conceptId: string, concept: Concept) => {
            conceptIds.push(conceptId)
        })
        return conceptIds
    }

    private readonly idGen: IdGenerator = new IdGenerator()

    constructor() {
        super({
            multi: true
        })
    }

    addConcept(concept: Concept) {
        const conceptId: string = this.idGen.getNextUniqueId()
        this.addNode(conceptId, concept)
    }

    addConceptById(conceptId: string, concept: Concept) {
        this.addNode(conceptId, concept)
    }

    addConceptByIdIfNotExists(conceptId: string, concept: Concept) {
        const existingConceptId: string | undefined = this.findNode(((possibleExistingConceptId) => { return possibleExistingConceptId === conceptId }))
        if (existingConceptId === undefined) {
            this.addConceptById(conceptId, concept)
        }
    }

    addRelationByTypeIfNotExists(relationType: string, sourceConceptId: string, targetConceptId: string) {
        const relationKey: string = `${sourceConceptId}-${relationType}->${targetConceptId}`
        const existingRelationId: string | undefined = this.findEdge(((possibleExistingRelationId) => { return possibleExistingRelationId === relationKey }))
        if (existingRelationId === undefined) {
            this.addEdgeWithKey(relationKey, sourceConceptId, targetConceptId, {
                type: relationType
            })
        }
    }

    static copyFrom(graphToCopy: ConceptGraph): ConceptGraph {
        const copiedGraph: ConceptGraph = new ConceptGraph()
        return copiedGraph.mergeFrom(graphToCopy)
    }

    mergeFrom(graphToMerge: ConceptGraph): ConceptGraph {
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

    static fromModel(conceptModel: ConceptGraphModel): ConceptGraph {
        const conceptGraph: ConceptGraph = new ConceptGraph()

        this._fillNodesRecursively(conceptModel, conceptGraph)

        this._fillEdgesRecursively(conceptModel, conceptGraph)

        return conceptGraph
    }

    private static _fillNodesRecursively(conceptModel: ConceptGraphModel, conceptGraph: ConceptGraph) {
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

    private static _fillEdgesRecursively(conceptModel: ConceptGraphModel, conceptGraph: ConceptGraph) {
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
    getConceptDefinitionByRelationType(fromConceptId: string, relationType: string, shouldIncludeOriginalConcept: boolean = false): ConceptGraph {
        const matchedConceptGraph: ConceptGraph = new ConceptGraph()
        const conceptIds: string[] = []

        // add all concepts which are targets of relation type: x-relationType->targetConcept
        this.forEachEdge((edgeId: string, relation: Relation, sourceConceptId, targetConceptId, sourceConcept, targetConcept) => {
            if (sourceConceptId === fromConceptId && relation.type === relationType) {
                matchedConceptGraph.addConceptByIdIfNotExists(targetConceptId, targetConcept)
                conceptIds.push(targetConceptId)
                if (shouldIncludeOriginalConcept) {
                    matchedConceptGraph.addConceptByIdIfNotExists(sourceConceptId, sourceConcept)
                    matchedConceptGraph.addEdgeWithKey(edgeId, sourceConceptId, targetConceptId, relation)
                }
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

    isEmpty(): boolean {
        return (this.nodes().length === 0)
    }

    toStringifiedModel(leadingConceptId?: string): string {
        return JSON.stringify(this.toModel(leadingConceptId), null, 2)
    }
    toModel(leadingConceptId?: string): ConceptGraphModel {
        if (this.isEmpty()) {
            return {}
        } else {
            let rootModel: ConceptGraphModel = {}
            const alreadyProcessedConceptIds: string[] = []

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

    private _recursivelyBuildConceptGraphModel(curConceptId: string, alreadyProcessedConceptIds: string[] = [], alreadyProcessedRelationIds: string[] = []): ConceptGraphModel {
        if (alreadyProcessedConceptIds.includes(curConceptId)) {
            // const model: ConceptGraphModel = {}
            // model[conceptId] = {}
            return {}
        }
        // alreadyProcessedConceptIds.push(curConceptId)
        const conceptModel: ConceptGraphModel = {}


        const curConcept: Concept = this.getNodeAttributes(curConceptId)
        const curConceptKey: string = curConcept.isUnknown === true ? '?' + curConceptId : curConceptId
        conceptModel[curConceptKey] = {}

        const relationIds: string[] = this.edges(curConceptId)
        relationIds.reverse()

        for (const orderedRelationId of relationIds) {

            this.forEachEdge(curConceptId, (relationId, relation, sourceConceptId, targetConceptId, sourceConcept, targetConcept) => {
                if (orderedRelationId === relationId && !alreadyProcessedRelationIds.includes(relationId)) {
                    alreadyProcessedRelationIds.push(orderedRelationId)
                    const direction: 'conceptToNeighbour' | 'neighbourToConcept' = sourceConceptId === curConceptId ? 'conceptToNeighbour' : 'neighbourToConcept'
                    const relationKey: `<-${string}-` | `-${string}->` = direction === 'conceptToNeighbour' ? `-${relation.type}->` : `<-${relation.type}-`

                    const neighbourConceptId: string = direction === 'conceptToNeighbour' ? targetConceptId : sourceConceptId
                    const neighbourConcept: Concept = direction === 'conceptToNeighbour' ? targetConcept : sourceConcept
                    const neighbourConceptKey: string = neighbourConcept.isUnknown === true ? '?' + neighbourConceptId : neighbourConceptId

                    const doesRelationAlreadyExist: boolean = conceptModel[curConceptKey][relationKey] !== undefined

                    const downstreamModel: ConceptGraphModel = this._recursivelyBuildConceptGraphModel(neighbourConceptId, alreadyProcessedConceptIds, alreadyProcessedRelationIds)
                    const shouldAddDownstreamModel: boolean = downstreamModel[neighbourConceptKey] !== undefined
                    if (shouldAddDownstreamModel) {
                        const isDownstreamADeepModel: boolean = Object.keys(downstreamModel[neighbourConceptKey] ?? {}).length > 0

                        if (!doesRelationAlreadyExist) {
                            conceptModel[curConceptKey][relationKey] = isDownstreamADeepModel ? downstreamModel : neighbourConceptKey
                        } else if (typeof conceptModel[curConceptKey][relationKey] === 'string') {
                            const exisingConceptKey: string = conceptModel[curConceptKey][relationKey] as string
                            conceptModel[curConceptKey][relationKey] = {};
                            (conceptModel[curConceptKey][relationKey] as ConceptGraphModel)[exisingConceptKey] = {};
                            (conceptModel[curConceptKey][relationKey] as ConceptGraphModel)[neighbourConceptKey] = downstreamModel[neighbourConceptKey] ?? {}
                        } else {
                            (conceptModel[curConceptKey][relationKey] as ConceptGraphModel)[neighbourConceptKey] = downstreamModel[neighbourConceptKey] ?? {}
                        }
                    }
                }
            })
        }
        alreadyProcessedConceptIds.push(curConceptId)
        return conceptModel
    }

    replaceConcept(existingConceptId: string, newConceptId: string, newConcept: Concept) {

        this.addConceptByIdIfNotExists(newConceptId, newConcept)

        // Add new relations copying existing relations
        this.forEachOutEdge(existingConceptId, (existingRelationId, existingRelation, sourceConceptId, targetConceptId, sourceConcept, targetConcept) => {
            this.addRelationByTypeIfNotExists(existingRelation.type, newConceptId, targetConceptId)
        })
        this.forEachInEdge(existingConceptId, (existingRelationId, existingRelation, sourceConceptId, targetConceptId, sourceConcept, targetConcept) => {
            this.addRelationByTypeIfNotExists(existingRelation.type, sourceConceptId, newConceptId)
        })

        this.forceDeleteConceptAndRelations(existingConceptId)

    }

    forceDeleteConceptAndRelations(conceptId: string) {
        if (this.doesConceptIdExist(conceptId)) {
            const relationIdsToDelete: string[] = this.getRelationIdsForConcept(conceptId)
            for (const relationIdToDelete of relationIdsToDelete) {
                this.dropEdge(relationIdToDelete)
            }

            this.dropNode(conceptId)

        }

    }

    getRelationIdsForConcept(conceptId: string): string[] {
        return this.filterEdges(conceptId, () => { return true })
    }

    isUnknownConcept(conceptId: string): boolean {
        const doesExist: boolean = this.nodes().includes(conceptId)
        if (doesExist) {
            return isConceptUnknown(this.getNodeAttributes(conceptId))
        } else {
            return false
        }
    }

    forEachRelationAndNeighbour(queryConceptId: string, cb: (relationId: string, relation: Relation, neighbourConceptId: string, neighbourConcept: Concept) => void) {
        this.forEachEdge((edgeId: string, edgeAttributes: Relation, sourceId: string, targetId: string, source: Concept, target: Concept) => {
            if (queryConceptId === sourceId) {
                cb(edgeId, edgeAttributes, targetId, target)
            } else if (queryConceptId === targetId) {
                cb(edgeId, edgeAttributes, sourceId, source)
            }
        })
    }

    findRelation(relationQuery: { conceptId?: string; neighbourConceptId?: string; type?: string }): string | undefined {
        return this.findEdge((relationId, relation, sourceConceptId, targetConceptId) => {
            return (
                (
                    (relationQuery.conceptId ?? sourceConceptId) === sourceConceptId
                    &&
                    (relationQuery.neighbourConceptId ?? targetConceptId) === targetConceptId
                )
                ||
                (
                    (relationQuery.conceptId ?? targetConceptId) === targetConceptId
                    &&
                    (relationQuery.neighbourConceptId ?? sourceConceptId) === sourceConceptId)
            )
                && (this.type ?? relation.type) === relation.type
        })
    }

    filterRelationIds(relationQuery: { conceptId?: string; neighbourConceptId?: string; type?: string }): string[] {
        return this.filterEdges((relationId, relation, sourceConceptId, targetConceptId) => {
            return (
                (
                    (relationQuery.conceptId ?? sourceConceptId) === sourceConceptId
                    &&
                    (relationQuery.neighbourConceptId ?? targetConceptId) === targetConceptId
                )
                ||
                (
                    (relationQuery.conceptId ?? targetConceptId) === targetConceptId
                    &&
                    (relationQuery.neighbourConceptId ?? sourceConceptId) === sourceConceptId)
            )
                && (relationQuery.type ?? relation.type) === relation.type
        })
    }

    doesConceptIdExist(conceptId: string): boolean {
        return this.nodes().includes(conceptId)
    }

    replaceRelationTypes(existingRelationType: string, newRelationType: string) {
        this.forEachEdge((relationId, relation) => {
            if (relation.type === existingRelationType) {
                this.replaceEdgeAttributes(relationId, {
                    ...relation,
                    type: newRelationType
                })
            }
        })
    }

    toString(): string {
        return this.toStringifiedModel()
    }
}