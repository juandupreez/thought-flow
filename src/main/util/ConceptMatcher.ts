import { Concept } from "../model/Concept"
import { ConceptGraph } from "../concepts/ConceptGraph"
import { glog } from "./Logger"
import { isConceptUnknown } from "./common"

interface RecursiveContext {
    alreadyProcessedQueryConceptIds: string[],
    alreadyProcessedQueryRelationIds: string[]
}

interface MatchingOptions {
    shouldIncludeQueryInResult: boolean
}

export class ConceptMatcher {
    private readonly data: ConceptGraph

    constructor (data: ConceptGraph) {
        this.data = data
    }

    static getMatches (query: ConceptGraph, data: ConceptGraph, opts: MatchingOptions = { shouldIncludeQueryInResult: false }): ConceptGraph[] {
        return new ConceptMatcher(data).getMatches(query, opts)
    }

    getMatches (query: ConceptGraph, opts: MatchingOptions = { shouldIncludeQueryInResult: false }): ConceptGraph[] {
        const matches: ConceptGraph[] = []
        const randomlyChosenConceptId: string | undefined = query.nodes()[0]
        if (randomlyChosenConceptId === undefined) {
            return []
        } else if (query.nodes().length === 1 && query.edges().length === 0) {
            const wholeDataGraph: ConceptGraph = this.data.copy() as ConceptGraph
            wholeDataGraph.forEachNode((nodeId: string, attributes: Concept) => {
                attributes.refId = nodeId
            })
            return [wholeDataGraph]
        } else {
            matches.push(...this._recursivelyGetPossibleMatches(query, randomlyChosenConceptId, opts))
        }
        return matches
    }

    private _recursivelyGetPossibleMatches (query: ConceptGraph, queryConceptId: string, opts: MatchingOptions = { shouldIncludeQueryInResult: false }, ctx: RecursiveContext = {
        alreadyProcessedQueryConceptIds: [],
        alreadyProcessedQueryRelationIds: []
    }): ConceptGraph[] {
        glog().trace('>>>')
        const debugContextLine: string = `[${query.getNodeAttributes(queryConceptId).description}]`
        glog().trace(debugContextLine + 'starting to process query concept ' + queryConceptId + ' : ' + JSON.stringify(query.getNodeAttributes(queryConceptId), null, 2))
        if (ctx.alreadyProcessedQueryConceptIds.includes(queryConceptId)) {
            glog().trace(debugContextLine + '\tNOT processing concept because it was already processed')
            return []
        }
        // ctx.alreadyProcessedQueryConceptIds.push(queryConceptId)

        const possibleMatches: ConceptGraph[] = []
        let isLeaf: boolean = true
        glog().trace(debugContextLine + '\tprocessing all related edges')
        query.forEachEdge(queryConceptId, (
            queryEdgeId: string, queryEdgeAttributes,
            querySourceId: string, queryTargetId: string,
            querySourceAttributes: Concept, queryTragetAttributes: Concept
        ) => {
            if (!ctx.alreadyProcessedQueryRelationIds.includes(queryEdgeId)) {
                glog().trace(debugContextLine + `\t\tprocessing edge: [${querySourceAttributes.description}] - ${queryEdgeAttributes.type} -> [${queryTragetAttributes.description}]`)
                isLeaf = false
                // ctx.alreadyProcessedQueryRelationIds.push(queryEdgeId)

                const queryNeighbourId: string = querySourceId === queryConceptId ? queryTargetId : querySourceId
                const queryNeighbourAttributes: Concept = querySourceId === queryConceptId ? queryTragetAttributes : querySourceAttributes
                const queryNeighbourSourceOrTarget: 'source' | 'target' = querySourceId === queryConceptId ? 'target' : 'source'

                glog().trace(debugContextLine + '\t\tneighbour identified as: ' + queryNeighbourAttributes.description)

                glog().trace(debugContextLine + '\t\tquerying all db edges')
                this.data.forEachEdge((
                    dataEdgeId: string, dataEdgeAttributes,
                    dataSourceId: string, dataTargetId: string,
                    dataSourceAttributes: Concept, dataTragetAttributes: Concept
                ) => {
                    const doesEdgeMatch: boolean = queryEdgeAttributes.type === dataEdgeAttributes.type

                    let doesNeighbourIdMatch: boolean = false
                    if (queryNeighbourSourceOrTarget === 'target') {
                        doesNeighbourIdMatch = queryNeighbourAttributes.refId === dataTargetId || isConceptUnknown(queryNeighbourAttributes)
                    } else {
                        doesNeighbourIdMatch = queryNeighbourAttributes.refId === dataSourceId || isConceptUnknown(queryNeighbourAttributes)
                    }
                    if (doesEdgeMatch && doesNeighbourIdMatch) {
                        glog().trace(debugContextLine + '\t\t\tfound matching DB edge: ')
                        glog().trace(debugContextLine + `\t\t\t[${dataSourceAttributes.description}] - ${dataEdgeAttributes.type} -> [${dataTragetAttributes.description}]`)

                        const possibleMatch: ConceptGraph = new ConceptGraph()
                        possibleMatch.addNode(dataSourceId, { ...dataSourceAttributes, refId: dataSourceId })
                        possibleMatch.addNode(dataTargetId, { ...dataTragetAttributes, refId: dataTargetId })
                        possibleMatch.addEdgeWithKey(dataEdgeId, dataSourceId, dataTargetId, { type: dataEdgeAttributes.type })

                        if (opts.shouldIncludeQueryInResult) {
                            const queryConcept: Concept = querySourceAttributes
                            possibleMatch.addConceptByKeyIfNotExists(queryConceptId, queryConcept)
                            possibleMatch.addConceptByKeyIfNotExists(queryNeighbourId, queryNeighbourAttributes)
                            if (queryNeighbourSourceOrTarget === 'target') {
                                possibleMatch.addRelationByTypeIfNotExists(queryEdgeAttributes.type, queryConceptId, queryNeighbourId)
                                possibleMatch.addRelationByTypeIfNotExists('matches', queryConceptId, dataSourceId)
                                possibleMatch.addRelationByTypeIfNotExists('matches', queryNeighbourId, dataTargetId)
                            } else {
                                possibleMatch.addRelationByTypeIfNotExists(queryEdgeAttributes.type, queryNeighbourId, queryConceptId)
                                possibleMatch.addRelationByTypeIfNotExists('matches', queryConceptId, dataTargetId)
                                possibleMatch.addRelationByTypeIfNotExists('matches', queryNeighbourId, dataSourceId)
                            }
                        }


                        glog().trace(debugContextLine + '\t\t\tgetting downtream possible matches')
                        const downstreamPossibleMatches: ConceptGraph[] = this._recursivelyGetPossibleMatches(query, queryNeighbourId, opts, {
                            alreadyProcessedQueryConceptIds: [...ctx.alreadyProcessedQueryConceptIds, queryConceptId],
                            alreadyProcessedQueryRelationIds: [...ctx.alreadyProcessedQueryRelationIds, queryEdgeId]
                        })
                        glog().trace(debugContextLine + '\t\t\tafter recursion: found downstream matches: ' + downstreamPossibleMatches.length)

                        for (const downstreamPossibleMatch of downstreamPossibleMatches) {
                            const mergedPossibleMatch: ConceptGraph = ConceptGraph.copyFrom(possibleMatch)
                            mergedPossibleMatch.mergeFrom(downstreamPossibleMatch)
                            glog().trace(debugContextLine + '\t\t\t\tadding possible match')
                            possibleMatches.push(mergedPossibleMatch)
                        }
                    }

                })
            } else {
                glog().trace(debugContextLine + `\t\tNOT processing edge: [${querySourceAttributes.description}] - ${queryEdgeAttributes.type} -> [${queryTragetAttributes.description}]`)
            }
        })

        if (isLeaf) {
            glog().trace(debugContextLine + '\tThis is a leaf node. Returning empty graph')
            return [new ConceptGraph]
        } else {
            glog().trace(debugContextLine + '\tThis is NOT a leaf node. Returning found possible matches: ' + possibleMatches.length)
            glog().trace(debugContextLine + '<<<')
            return possibleMatches
        }
    }
}