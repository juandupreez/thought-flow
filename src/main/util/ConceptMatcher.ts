import { Concept } from "../concepts/Concept"
import { ConceptGraph } from "../concepts/ConceptGraph"
import { glog } from "./Logger"

interface RecursiveContext {
    alreadyProcessedQueryConceptIds: string[],
    alreadyProcessedQueryRelationIds: string[]
}

export class ConceptMatcher {
    private readonly data: ConceptGraph

    constructor (data: ConceptGraph) {
        this.data = data
    }

    getMatches (query: ConceptGraph): ConceptGraph[] {
        const matches: ConceptGraph[] = []
        const unknownConceptId: string | undefined = query.findNode((nodeId: string, attributes: Concept) => {
            return attributes.description === 'unknown'
        })
        if (unknownConceptId === undefined) {
            return []
        } else if (query.nodes().length === 1 && query.edges().length === 0) {
            const wholeDataGraph: ConceptGraph = this.data.copy() as ConceptGraph
            wholeDataGraph.forEachNode((nodeId: string, attributes: Concept) => {
                attributes.refId = nodeId
            })
            return [wholeDataGraph]
        } else {
            matches.push(...this._recursivelyGetPossibleMatches(query, unknownConceptId))
        }
        return matches
    }

    private _recursivelyGetPossibleMatches (query: ConceptGraph, queryConceptId: string, ctx: RecursiveContext = {
        alreadyProcessedQueryConceptIds: [],
        alreadyProcessedQueryRelationIds: []
    }): ConceptGraph[] {
        glog().debug('>>>')
        const debugContextLine: string = `[${query.getNodeAttributes(queryConceptId).description}]`
        glog().debug(debugContextLine + 'starting to process query concept ' + queryConceptId + ' : ' + JSON.stringify(query.getNodeAttributes(queryConceptId), null, 2))
        if (ctx.alreadyProcessedQueryConceptIds.includes(queryConceptId)) {
            glog().debug(debugContextLine + '\tNOT processing concept because it was already processed')
            return []
        }
        // ctx.alreadyProcessedQueryConceptIds.push(queryConceptId)

        const possibleMatches: ConceptGraph[] = []
        let isLeaf: boolean = true
        glog().debug(debugContextLine + '\tprocessing all related edges')
        query.forEachEdge(queryConceptId, (
            queryEdgeId: string, queryEdgeAttributes,
            querySourceId: string, queryTargetId: string,
            querySourceAttributes: Concept, queryTragetAttributes: Concept
        ) => {
            if (!ctx.alreadyProcessedQueryRelationIds.includes(queryEdgeId)) {
                glog().debug(debugContextLine + `\t\tprocessing edge: [${querySourceAttributes.description}] - ${queryEdgeAttributes.type} -> [${queryTragetAttributes.description}]`)
                isLeaf = false
                // ctx.alreadyProcessedQueryRelationIds.push(queryEdgeId)

                const queryNeighbourId: string = querySourceId === queryConceptId ? queryTargetId : querySourceId
                const queryNeighbourAttributes: Concept = querySourceId === queryConceptId ? queryTragetAttributes : querySourceAttributes
                const queryNeighbourSourceOrTarget: 'source' | 'target' = querySourceId === queryConceptId ? 'target' : 'source'

                glog().debug(debugContextLine + '\t\tneighbour identified as: ' + queryNeighbourAttributes.description)

                glog().debug(debugContextLine + '\t\tquerying all db edges')
                this.data.forEachEdge((
                    dataEdgeId: string, dataEdgeAttributes,
                    dataSourceId: string, dataTargetId: string,
                    dataSourceAttributes: Concept, dataTragetAttributes: Concept
                ) => {
                    const doesEdgeMatch: boolean = queryEdgeAttributes.type === dataEdgeAttributes.type

                    let doesNeighbourIdMatch: boolean = false
                    if (queryNeighbourSourceOrTarget === 'target') {
                        doesNeighbourIdMatch = queryNeighbourAttributes.refId === dataTargetId
                    } else {
                        doesNeighbourIdMatch = queryNeighbourAttributes.refId === dataSourceId
                    }
                    if (doesEdgeMatch && doesNeighbourIdMatch) {
                        glog().debug(debugContextLine + '\t\t\tfound matching DB edge: ')
                        glog().debug(debugContextLine + `\t\t\t[${dataSourceAttributes.description}] - ${dataEdgeAttributes.type} -> [${dataTragetAttributes.description}]`)

                        const possibleMatch: ConceptGraph = new ConceptGraph()
                        possibleMatch.addNode(dataSourceId, { ...dataSourceAttributes, refId: dataSourceId })
                        possibleMatch.addNode(dataTargetId, { ...dataTragetAttributes, refId: dataTargetId })
                        possibleMatch.addEdgeWithKey(dataEdgeId, dataSourceId, dataTargetId, { type: dataEdgeAttributes.type })


                        glog().debug(debugContextLine + '\t\t\tgetting downtream possible matches')
                        const downstreamPossibleMatches: ConceptGraph[] = this._recursivelyGetPossibleMatches(query, queryNeighbourId, {
                            alreadyProcessedQueryConceptIds: [...ctx.alreadyProcessedQueryConceptIds, queryConceptId],
                            alreadyProcessedQueryRelationIds: [...ctx.alreadyProcessedQueryRelationIds, queryEdgeId]
                        })
                        glog().debug(debugContextLine + '\t\t\tafter recursion: found downstream matches: ' + downstreamPossibleMatches.length)

                        for (const downstreamPossibleMatch of downstreamPossibleMatches) {
                            const mergedPossibleMatch: ConceptGraph = ConceptGraph.copyFrom(possibleMatch)
                            mergedPossibleMatch.mergeFrom(downstreamPossibleMatch)
                            glog().debug(debugContextLine + '\t\t\t\tadding possible match')
                            possibleMatches.push(mergedPossibleMatch)
                        }
                    }

                })
            } else {
                glog().debug(debugContextLine + `\t\tNOT processing edge: [${querySourceAttributes.description}] - ${queryEdgeAttributes.type} -> [${queryTragetAttributes.description}]`)
            }
        })

        if (isLeaf) {
            glog().debug(debugContextLine + '\tThis is a leaf node. Returning empty graph')
            return [new ConceptGraph]
        } else {
            glog().debug(debugContextLine + '\tThis is NOT a leaf node. Returning found possible matches: ' + possibleMatches.length)
            glog().debug(debugContextLine + '<<<')
            return possibleMatches
        }
    }
}