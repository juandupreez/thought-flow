import { Concept } from "../model/Concept"
import { ConceptGraph } from "../core/ConceptGraph"
import { glog } from "../util/Logger"
import { isConceptUnknown } from "../util/common"
import { ConceptGraphModel, RelationKeyWithArrows } from "../model/ConceptGraphModel"

interface RecursiveContext {
    alreadyProcessedQueryConceptIds: string[],
    alreadyProcessedQueryRelationIds: string[]
}

interface MatchingOptions {
    shouldIncludeQueryInResult: boolean
}

export class ConceptMatchService {

    getMatches (query: ConceptGraph, dataToQuery: ConceptGraph, opts: MatchingOptions = { shouldIncludeQueryInResult: false }): ConceptGraph[] {
        glog().trace('\n|---------START MATCHING-------|')
        glog().trace('Query: ', JSON.stringify(query.toModel(), null, 2))
        glog().trace('Data: ', JSON.stringify(dataToQuery.toModel(), null, 2))

        const matches: ConceptGraph[] = []
        const randomlyChosenConceptId: string | undefined = query.nodes()[0]
        if (randomlyChosenConceptId === undefined) {
            return []
        } else if (query.edges().length === 0) {
            matches.push(...this._matchNodesOnly(query, dataToQuery, opts))
        } else {
            // matches.push(...this._recursivelyGetPossibleMatches(query.toModel(), dataToQuery, opts))
            matches.push(...this._recursivelyGetPossibleMatchesByRelations(query, dataToQuery, randomlyChosenConceptId, opts))
        }
        glog().trace('Matches ', JSON.stringify(matches.map((singleMatch) => { return singleMatch.toModel() }), null, 2))
        glog().trace('|---------END MATCHING-------|\n')
        return matches
    }

    private _matchNodesOnly (query: ConceptGraph, data: ConceptGraph, opts: MatchingOptions): ConceptGraph[] {
        const matches: ConceptGraph[] = []

        // Known Concepts
        const knownQueryConceptIds: string[] = query.filterNodes((queryConceptId, queryConcept) => {
            return queryConcept.isUnknown !== true
        })

        const exactDataMatchConceptIds: string[] = data.filterNodes((dataConceptId, dataConcept) => {
            return knownQueryConceptIds.includes(dataConceptId)
        })

        if (knownQueryConceptIds.length !== exactDataMatchConceptIds.length) {
            return [] // some of the known query concepts don't match, so we can assume the whole thing does not match
        }


        // Unknown Concepts
        const unknownQueryConceptIds: string[] = query.filterNodes((queryConceptId, queryConcept) => {
            return queryConcept.isUnknown === true
        })

        const dataConceptsNotMatchedByKnownConceptIds: string[] = data.filterNodes((dataConceptId, dataConcept) => {
            return !exactDataMatchConceptIds.includes(dataConceptId)
        })

        if (dataConceptsNotMatchedByKnownConceptIds.length < unknownQueryConceptIds.length) {
            return [] // not enough data concepts left to fill all the query unknowns
        }

        const unknownConceptMatchPermutations: ConceptGraph[] = this._recursivelyGetAllPermutations(
            unknownQueryConceptIds, dataConceptsNotMatchedByKnownConceptIds,
            query, data
        )
        if (unknownConceptMatchPermutations.length > 0) {
            for (const unknownConceptMatchPermutation of unknownConceptMatchPermutations) {
                for (const exactDataMatchConceptId of exactDataMatchConceptIds) {
                    unknownConceptMatchPermutation.addConceptByIdIfNotExists(exactDataMatchConceptId, data.getNodeAttributes(exactDataMatchConceptId))
                }
            }
        } else {
            const singleMatchWithOnlyExactMatches: ConceptGraph = new ConceptGraph()
            for (const exactDataMatchConceptId of exactDataMatchConceptIds) {
                singleMatchWithOnlyExactMatches.addConceptByIdIfNotExists(exactDataMatchConceptId, data.getNodeAttributes(exactDataMatchConceptId))   
            }
            return [singleMatchWithOnlyExactMatches]
        }



        // query.forEachNode((queryConceptId, queryConcept) => {
        //     const isQueryConceptUnknown: boolean = isConceptUnknown(queryConcept)

        //     const matchedDataConceptIds: string[] = data.filterNodes((dataConceptId, dataConcept) => {
        //         if (isQueryConceptUnknown) {
        //             return true
        //         } else if (dataConceptId === queryConceptId) {
        //             return true
        //         } else {
        //             return false
        //         }
        //     })

        // })
        return unknownConceptMatchPermutations
    }

    private _recursivelyGetAllPermutations (unknownQueryConceptIds: string[], dataConceptIds: string[], query: ConceptGraph, data: ConceptGraph): ConceptGraph[] {
        if (unknownQueryConceptIds.length === 0 || dataConceptIds.length === 0) {
            return []
        } else if (unknownQueryConceptIds.length === 1 && dataConceptIds.length === 1) {
            const singlePermutation: ConceptGraph = new ConceptGraph()
            singlePermutation.addConceptByIdIfNotExists(dataConceptIds[0], data.getNodeAttributes(dataConceptIds[0]))
            return [singlePermutation]
        } else if (unknownQueryConceptIds.length === 1) {
            const curLevelPermutations: ConceptGraph[] = []
            for (const dataConceptId of dataConceptIds) {
                const singlePermutation: ConceptGraph = new ConceptGraph()
                singlePermutation.addConceptByIdIfNotExists(dataConceptId, data.getNodeAttributes(dataConceptId))
                curLevelPermutations.push(singlePermutation)
            }
            return curLevelPermutations
        } else {
            const curLevelPermutations: ConceptGraph[] = []

            for (const queryConceptId of unknownQueryConceptIds) {
                const nextQueryConceptIds: string[] = unknownQueryConceptIds
                nextQueryConceptIds.shift()
                for (const dataConceptId of dataConceptIds) {
                    const otherDataConceptIds: string[] = dataConceptIds.filter((singleDataConceptId) => { return singleDataConceptId !== dataConceptId })
                    const downstreamPermutations: ConceptGraph[] = this._recursivelyGetAllPermutations(nextQueryConceptIds, otherDataConceptIds, query, data)
                    for (const downstreamPermutation of downstreamPermutations) {
                        downstreamPermutation.addConceptByIdIfNotExists(dataConceptId, data.getNodeAttributes(dataConceptId))
                        curLevelPermutations.push(downstreamPermutation)
                    }

                }
            }
            return curLevelPermutations
        }
    }

    private _recursivelyGetPossibleMatches (curQueryModel: ConceptGraphModel, data: ConceptGraph, opts: MatchingOptions): ConceptGraph[] {
        glog().trace('>>>>>>>>>>>>>>>>>')
        glog().trace('Current Query Model: ', JSON.stringify(curQueryModel, null, 2))

        const matches: ConceptGraph[] = []

        for (const queryConceptKey in curQueryModel) {
            if (Object.prototype.hasOwnProperty.call(curQueryModel, queryConceptKey)) {
                glog().trace('\tcur concept key: ', queryConceptKey)
                const match: ConceptGraph = new ConceptGraph()
                const isQueryConceptUnknown: boolean = queryConceptKey.startsWith('?')
                const curConcept: { [relationKey: RelationKeyWithArrows]: string | ConceptGraphModel } = curQueryModel[queryConceptKey]
                const matchedDataConceptIds: string[] = data.filterNodes((dataConceptId, dataConcept) => {
                    if (isQueryConceptUnknown) {
                        return true
                    } else if (dataConceptId === queryConceptKey) {
                        return true
                    } else {
                        return false
                    }
                })
                for (const matchedDataConceptId of matchedDataConceptIds) {
                    glog().trace('\tcur concept key: ', queryConceptKey)
                    const matchedConcept: Concept = data.getNodeAttributes(matchedDataConceptId)
                    match.addConceptByIdIfNotExists(matchedDataConceptId, matchedConcept)
                    matches.push(match)
                }
            }
        }
        glog().trace('Returning Matches ', JSON.stringify(matches.map((singleMatch) => { return singleMatch.toModel() }), null, 2))
        glog().trace('<<<<<<<<<<<<<<<<')
        return matches
    }

    private _recursivelyGetPossibleMatchesByRelations (query: ConceptGraph, dataToQuery: ConceptGraph, queryConceptId: string, opts: MatchingOptions = { shouldIncludeQueryInResult: false }, ctx: RecursiveContext = {
        alreadyProcessedQueryConceptIds: [],
        alreadyProcessedQueryRelationIds: []
    }): ConceptGraph[] {
        glog().trace('>>>')
        const debugContextLine: string = `[${query.getNodeAttributes(queryConceptId).description}]`
        glog().trace(debugContextLine + ' starting to process query concept ' + queryConceptId + ' : ' + JSON.stringify(query.getNodeAttributes(queryConceptId), null, 2))
        if (ctx.alreadyProcessedQueryConceptIds.includes(queryConceptId)) {
            glog().trace(debugContextLine + '\tNOT processing concept because it was already processed')
            return []
        }
        // ctx.alreadyProcessedQueryConceptIds.push(queryConceptId)

        const possibleMatches: ConceptGraph[] = []
        let isLeaf: boolean = true
        glog().trace(debugContextLine + '\tprocessing all related edges')
        query.forEachEdge(queryConceptId, (
            queryRelationId: string, queryEdgeAttributes,
            querySourceId: string, queryTargetId: string,
            querySourceAttributes: Concept, queryTragetAttributes: Concept
        ) => {
            if (!ctx.alreadyProcessedQueryRelationIds.includes(queryRelationId)) {
                glog().trace(debugContextLine + `\t\tprocessing edge: [${querySourceAttributes.description}] - ${queryEdgeAttributes.type} -> [${queryTragetAttributes.description}]`)
                isLeaf = false
                // ctx.alreadyProcessedQueryRelationIds.push(queryRelationId)

                const queryNeighbourId: string = querySourceId === queryConceptId ? queryTargetId : querySourceId
                const queryNeighbourAttributes: Concept = querySourceId === queryConceptId ? queryTragetAttributes : querySourceAttributes
                const queryNeighbourSourceOrTarget: 'source' | 'target' = querySourceId === queryConceptId ? 'target' : 'source'

                glog().trace(debugContextLine + '\t\tneighbour identified as: ' + queryNeighbourAttributes.description)

                glog().trace(debugContextLine + '\t\tquerying all db edges')
                dataToQuery.forEachEdge((
                    dataRelationId: string, dataEdgeAttributes,
                    dataSourceId: string, dataTargetId: string,
                    dataSourceAttributes: Concept, dataTragetAttributes: Concept
                ) => {
                    const doesEdgeMatch: boolean = queryEdgeAttributes.type === dataEdgeAttributes.type

                    let doesNeighbourIdMatch: boolean = false
                    if (queryNeighbourSourceOrTarget === 'target') {
                        doesNeighbourIdMatch = queryNeighbourId === dataTargetId || isConceptUnknown(queryNeighbourAttributes)
                    } else {
                        doesNeighbourIdMatch = queryNeighbourId === dataSourceId || isConceptUnknown(queryNeighbourAttributes)
                    }
                    if (doesEdgeMatch && doesNeighbourIdMatch) {
                        glog().trace(debugContextLine + '\t\t\tfound matching DB edge: ')
                        glog().trace(debugContextLine + `\t\t\t[${dataSourceAttributes.description}] - ${dataEdgeAttributes.type} -> [${dataTragetAttributes.description}]`)

                        const possibleMatch: ConceptGraph = new ConceptGraph()
                        possibleMatch.addConceptByIdIfNotExists(dataSourceId, { ...dataSourceAttributes })
                        possibleMatch.addConceptByIdIfNotExists(dataTargetId, { ...dataTragetAttributes })
                        possibleMatch.addEdgeWithKey(dataRelationId, dataSourceId, dataTargetId, { type: dataEdgeAttributes.type })

                        if (opts.shouldIncludeQueryInResult) {
                            const queryConcept: Concept = querySourceAttributes
                            possibleMatch.addConceptByIdIfNotExists(queryConceptId, queryConcept)
                            possibleMatch.addConceptByIdIfNotExists(queryNeighbourId, queryNeighbourAttributes)
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
                        const downstreamPossibleMatches: ConceptGraph[] = this._recursivelyGetPossibleMatchesByRelations(query, dataToQuery, queryNeighbourId, opts, {
                            alreadyProcessedQueryConceptIds: [...ctx.alreadyProcessedQueryConceptIds, queryConceptId],
                            alreadyProcessedQueryRelationIds: [...ctx.alreadyProcessedQueryRelationIds, queryRelationId]
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
            glog().trace(debugContextLine + '<<<')
            return [new ConceptGraph]
        } else {
            glog().trace(debugContextLine + '\tThis is NOT a leaf node. Returning found possible matches: ' + possibleMatches.length)
            glog().trace(debugContextLine + '<<<')
            return possibleMatches
        }
    }
}