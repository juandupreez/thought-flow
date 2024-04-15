import { Concept } from "../model/Concept"
import { ConceptGraph } from "../core/ConceptGraph"
import { glog } from "../util/Logger"
import { isConceptUnknown } from "../util/common"
import { ConceptGraphModel, RelationKeyWithArrows } from "../model/ConceptGraphModel"
import { Relation } from "../model/Relation"

interface RecursiveContext {
    alreadyProcessedQueryConceptIds: string[]
    alreadyProcessedQueryRelationIds: string[]
    knownQueryConceptIds: string[]
    unknownQueryConceptIds: string[]
    exactDataMatchConceptIds: string[]
    dataConceptsNotMatchedByKnownConceptIds: string[]
}

interface MatchingOptions {
    shouldIncludeQueryInResult: boolean
}

export class ConceptMatchService {
    getAndMergeMatches (query: ConceptGraph, data: ConceptGraph): ConceptGraph {
        const allMatches: ConceptGraph[] = this.getMatches(query, data)
        const mergedCg: ConceptGraph = new ConceptGraph()

        for (const singleMatch of allMatches) {
            mergedCg.mergeFrom(singleMatch)
        }
        return mergedCg
    }

    getFirstMatch (query: ConceptGraph, data: ConceptGraph): ConceptGraph {
        return this.getMatches(query, data)[0] ?? new ConceptGraph()
    }

    getMatches (query: ConceptGraph, data: ConceptGraph, opts: MatchingOptions = { shouldIncludeQueryInResult: false }): ConceptGraph[] {
        glog().trace('\n|---------START MATCHING-------|')
        glog().trace('Query: ', JSON.stringify(query.toModel(), null, 2))
        glog().trace('Data: ', JSON.stringify(data.toModel(), null, 2))

        const matches: ConceptGraph[] = []
        const randomlyChosenConceptId: string | undefined = query.nodes()[0]
        if (randomlyChosenConceptId === undefined) {
            return []
        } else {

            // setup and validate context
            const ctx: RecursiveContext = {
                alreadyProcessedQueryConceptIds: [],
                alreadyProcessedQueryRelationIds: [],
                knownQueryConceptIds: query.filterNodes((queryConceptId, queryConcept) => {
                    return queryConcept.isUnknown !== true
                }),
                exactDataMatchConceptIds: [],
                unknownQueryConceptIds: query.filterNodes((queryConceptId, queryConcept) => {
                    return queryConcept.isUnknown === true
                }),
                dataConceptsNotMatchedByKnownConceptIds: []
            }
            ctx.exactDataMatchConceptIds = data.filterNodes((dataConceptId, dataConcept) => {
                return ctx.knownQueryConceptIds.includes(dataConceptId)
            })

            ctx.dataConceptsNotMatchedByKnownConceptIds = data.filterNodes((dataConceptId, dataConcept) => {
                return !ctx.exactDataMatchConceptIds.includes(dataConceptId)
            })

            if (ctx.knownQueryConceptIds.length !== ctx.exactDataMatchConceptIds.length) {
                return [] // some of the known query concepts don't match, so we can assume the whole thing does not match
            }

            if (ctx.dataConceptsNotMatchedByKnownConceptIds.length < ctx.unknownQueryConceptIds.length) {
                return [] // not enough data concepts left to fill all the query unknowns
            }


            matches.push(...this._getMatchesBySelectMethod(query, data, ctx, opts))
        }
        glog().trace('Matches ', JSON.stringify(matches.map((singleMatch) => { return singleMatch.toModel() }), null, 2))
        glog().trace('|---------END MATCHING-------|\n')
        return matches
    }

    private _getMatchesBySelectMethod (query: ConceptGraph, data: ConceptGraph, ctx: RecursiveContext, opts: MatchingOptions): ConceptGraph[] {
        const possibleMatches: ConceptGraph[] = []

        glog().trace(`Unknowns (${ctx.unknownQueryConceptIds.length}): ` + ctx.unknownQueryConceptIds)
        glog().trace(`Possible Data Matches (${ctx.dataConceptsNotMatchedByKnownConceptIds.length}): ` + ctx.dataConceptsNotMatchedByKnownConceptIds)
        const possibleCombinations: { [unknownConceptId: string]: string }[] = this._recursivelyGetUnknownCombinations(
            ctx.unknownQueryConceptIds, ctx.dataConceptsNotMatchedByKnownConceptIds, query, data
        )


        glog().trace(`possible combinations: ${JSON.stringify(possibleCombinations, null, 2)}`)

        if (ctx.unknownQueryConceptIds.length === 0) { // only exact matches. no unkowns in query
            possibleCombinations.push({})
        }

        for (const possibleCombination of possibleCombinations) {
            if (Object.keys(possibleCombination).length === ctx.unknownQueryConceptIds.length) { // should match all concepts
                const possibleMatch: ConceptGraph = new ConceptGraph()
                query.forEachNode((conceptId, concept) => {
                    const matchedDataConceptId: string = concept.isUnknown === true ? possibleCombination[conceptId] : conceptId
                    const matchedDataConcept: Concept = data.getNodeAttributes(matchedDataConceptId)
                    possibleMatch.addConceptByIdIfNotExists(matchedDataConceptId, matchedDataConcept)
                    if (opts.shouldIncludeQueryInResult) {
                        possibleMatch.addConceptByIdIfNotExists(conceptId, concept)
                        possibleMatch.addRelationByTypeIfNotExists('matches', conceptId, matchedDataConceptId)
                    }
                })
                query.forEachEdge((queryRelationId, queryRelation, querySourceId, queryTargetId, querySource, queryTarget) => {
                    const sourceMatchedDataConceptId: string = querySource.isUnknown === true ? possibleCombination[querySourceId] : querySourceId
                    const targetMatchedDataConceptId: string = queryTarget.isUnknown === true ? possibleCombination[queryTargetId] : queryTargetId

                    data.forEachEdge(((dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                        const doesDataEdgeMatchQuery: boolean = sourceMatchedDataConceptId === dataSourceId
                            && queryRelation.type === dataRelation.type
                            && targetMatchedDataConceptId === dataTargetId
                        if (doesDataEdgeMatchQuery) {
                            possibleMatch.addEdgeWithKey(dataRelationId, dataSourceId, dataTargetId, dataRelation)
                        }
                    }))


                })
                possibleMatches.push(possibleMatch)
            }
        }

        return possibleMatches
    }

    private _recursivelyGetUnknownCombinations (unknownQueryConceptIds: string[], possibleDataConcepts: string[], query: ConceptGraph, data: ConceptGraph): { [unknownConceptId: string]: string }[] {
        if (unknownQueryConceptIds.length === 0 || possibleDataConcepts.length === 0) {
            return []
        } else if (unknownQueryConceptIds.length === 1) {
            const curLevelCombinations: { [unknownConceptId: string]: string }[] = []
            const curUnkownConceptId: string = unknownQueryConceptIds[0]
            for (const possibleDataConcept of possibleDataConcepts) {
                const doDataConceptRelationsMatchQueryUnknown: boolean = this._doConeptRelationsMatch(curUnkownConceptId, query, possibleDataConcept, data)
                if (doDataConceptRelationsMatchQueryUnknown) {
                    const curLevelCombination: { [unknownConceptId: string]: string } = {}
                    curLevelCombination[curUnkownConceptId] = possibleDataConcept
                    curLevelCombinations.push(curLevelCombination)
                }
            }
            return curLevelCombinations
        } else {
            const curLevelCombinations: { [unknownConceptId: string]: string }[] = []

            const curUnkownConceptId: string | undefined = unknownQueryConceptIds[0]
            if (curUnkownConceptId !== undefined) {
                for (const possibleDataConcept of possibleDataConcepts) {

                    const doDataConceptRelationsMatchQueryUnknown: boolean = this._doConeptRelationsMatch(curUnkownConceptId, query, possibleDataConcept, data)
                    if (doDataConceptRelationsMatchQueryUnknown) {
                        const dataConceptIdsNotPickedYet: string[] = possibleDataConcepts.filter((singleDataConceptId) => {
                            return singleDataConceptId !== possibleDataConcept
                        })
                        const downstreamCombinations: { [unknownConceptId: string]: string }[] = this._recursivelyGetUnknownCombinations(
                            [...unknownQueryConceptIds.slice(1)], dataConceptIdsNotPickedYet, query, data
                        )
                        for (const downstreamCombination of downstreamCombinations) {
                            const doDataConceptRelationsMatchQueryUnknownConsidieringDownstream: boolean =
                                this._doConeptRelationsMatch(curUnkownConceptId, query, possibleDataConcept, data, downstreamCombination)
                            if (doDataConceptRelationsMatchQueryUnknownConsidieringDownstream) {
                                const curLevelCombination: { [unknownConceptId: string]: string } = { ...downstreamCombination }
                                curLevelCombination[curUnkownConceptId] = possibleDataConcept
                                curLevelCombinations.push(curLevelCombination)
                            }
                        }
                    }
                }
            }
            return curLevelCombinations
        }
    }

    private _doConeptRelationsMatch (queryConceptId: string, query: ConceptGraph, dataConceptId: string, data: ConceptGraph, unknownMatchMap: { [unknownConceptId: string]: string } = {}): boolean {
        let doMatch: boolean = true
        query.forEachOutEdge(queryConceptId, (queryRelationId, queryRelation, querySourceId, queryTargetId, querySource, queryTarget) => {

            // if (queryTarget.isUnknown !== true || unknownMatchMap[queryTargetId] !== undefined) {
            //     const neighbourQueryConceptId: string = unknownMatchMap[queryTargetId] ?? queryTargetId
            //     const outRelationId: string | undefined = data.findOutEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
            //         return dataRelation.type === queryRelation.type && dataTargetId === neighbourQueryConceptId
            //     })
            //     if (outRelationId === undefined) {
            //         doMatch = false
            //     }
            // } else {
            //     const outRelationId: string | undefined = data.findOutEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
            //         return dataRelation.type === queryRelation.type && dataTargetId === queryTargetId
            //     })
            //     if (outRelationId === undefined) {
            //         doMatch = false
            //     }
            // }
            if (queryTarget.isUnknown !== true) {
                const outRelationId: string | undefined = data.findOutEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                    return dataRelation.type === queryRelation.type && dataTargetId === queryTargetId
                })
                if (outRelationId === undefined) {
                    doMatch = false
                }
            } else {

                if (unknownMatchMap[queryTargetId] !== undefined) {
                    const outRelationId: string | undefined = data.findOutEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                        return dataRelation.type === queryRelation.type && dataTargetId === unknownMatchMap[queryTargetId]
                    })
                    if (outRelationId === undefined) {
                        doMatch = false
                    }
                } else {
                    const outRelationId: string | undefined = data.findOutEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                        return dataRelation.type === queryRelation.type
                    })
                    if (outRelationId === undefined) {
                        doMatch = false
                    }
                }
            }
        })
        query.forEachInEdge(queryConceptId, (queryRelationId, queryRelation, querySourceId, queryTargetId, querySource, queryTarget) => {
            // if (queryTarget.isUnknown !== true || unknownMatchMap[querySourceId] !== undefined) {
            //     const neighbourQueryConceptId: string = unknownMatchMap[querySourceId] ?? querySourceId

            //     const outRelationId: string | undefined = data.findInEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
            //         return dataRelation.type === queryRelation.type && dataSourceId === neighbourQueryConceptId
            //     })
            //     if (outRelationId === undefined) {
            //         doMatch = false
            //     }
            // } else {
            //     const outRelationId: string | undefined = data.findInEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
            //         return dataRelation.type === queryRelation.type && dataSourceId === querySourceId
            //     })
            //     if (outRelationId === undefined) {
            //         doMatch = false
            //     }
            // }

            if (querySource.isUnknown !== true) {
                const outRelationId: string | undefined = data.findInEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                    return dataRelation.type === queryRelation.type && dataSourceId === querySourceId
                })
                if (outRelationId === undefined) {
                    doMatch = false
                }
            } else {

                if (unknownMatchMap[querySourceId] !== undefined) {
                    const outRelationId: string | undefined = data.findInEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                        return dataRelation.type === queryRelation.type && dataSourceId === unknownMatchMap[querySourceId]
                    })
                    if (outRelationId === undefined) {
                        doMatch = false
                    }
                } else {
                    const outRelationId: string | undefined = data.findInEdge(dataConceptId, (dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                        return dataRelation.type === queryRelation.type
                    })
                    if (outRelationId === undefined) {
                        doMatch = false
                    }
                }
            }
        })
        return doMatch

    }

    private _recursivelyGetPossibleMatches (query: ConceptGraph, data: ConceptGraph, queryConceptId: string, opts: MatchingOptions = { shouldIncludeQueryInResult: false }, ctx: RecursiveContext = {
        alreadyProcessedQueryConceptIds: [],
        alreadyProcessedQueryRelationIds: [],
        dataConceptsNotMatchedByKnownConceptIds: [],
        exactDataMatchConceptIds: [],
        knownQueryConceptIds: [],
        unknownQueryConceptIds: []
    }): ConceptGraph[] {
        const debugContextLine: string = `[${query.getNodeAttributes(queryConceptId).description}] `
        glog().trace(debugContextLine + '>>>>>>>>>>>>>>>>>')
        // glog().trace(debugContextLine + 'starting to process query concept ' + queryConceptId + ' : ' + JSON.stringify(query.getNodeAttributes(queryConceptId), null, 2))

        const possibleMatches: ConceptGraph[] = []

        const relationIdsNotProcessedYet: string[] = query.getRelationIdsForConcept(queryConceptId).filter((singleRelationId) => {
            return !ctx.alreadyProcessedQueryRelationIds.includes(singleRelationId)
        })
        const isLeafNode: boolean = relationIdsNotProcessedYet.length === 0

        if (isLeafNode) {
            glog().trace(debugContextLine + 'Leaf Node Detected')
            if (query.isUnknownConcept(queryConceptId)) {
                glog().trace(debugContextLine + 'Leaf Concept is Unknown')
                const allDataConceptIdsThatCouldPossiblyMatchQueryConceptId: string[] = data.filterNodes((dataConceptId, dataConcept) => {
                    return (ctx.dataConceptsNotMatchedByKnownConceptIds).includes(dataConceptId)
                        && !ctx.alreadyProcessedQueryConceptIds.includes(dataConceptId)
                })
                glog().trace(debugContextLine + 'Generating possible matches for all of: ' + JSON.stringify(allDataConceptIdsThatCouldPossiblyMatchQueryConceptId))
                for (const dataConceptId of allDataConceptIdsThatCouldPossiblyMatchQueryConceptId) {
                    glog().trace(debugContextLine + 'Making Possible Leaf Match: ' + dataConceptId)
                    const possibleMatch: ConceptGraph = new ConceptGraph()
                    possibleMatch.addConceptById(dataConceptId, data.getNodeAttributes(dataConceptId))
                    possibleMatches.push(possibleMatch)
                }
            } else {
                glog().trace(debugContextLine + 'Leaf Concept is Known')
                glog().trace(debugContextLine + 'Making Exact Leaf Match: ' + queryConceptId)
                const possibleMatch: ConceptGraph = new ConceptGraph()
                possibleMatch.addConceptById(queryConceptId, data.getNodeAttributes(queryConceptId))
                possibleMatches.push(possibleMatch)
            }
        } else {
            glog().trace(debugContextLine + 'Non Terminal Node Detected')
            glog().trace(debugContextLine + 'Processing all query edges and neighbours: ' + query.getRelationIdsForConcept(queryConceptId).length)

            const possibleMatchesPerRelation: ConceptGraph[][] = []
            query.forEachRelationAndNeighbour(queryConceptId, (
                queryRelationId: string, queryEdgeAttributes: Relation,
                queryNeighbourConceptId: string, queryNeighbourConcept: Concept
            ) => {
                glog().trace(debugContextLine + 'Processing query edge ' + `${queryConceptId}-${queryEdgeAttributes.type}-${queryNeighbourConceptId}: ${queryRelationId}`)

                ctx.alreadyProcessedQueryRelationIds.push(queryRelationId)

                const possibleMatchesForCurrentQueryRelation: ConceptGraph[] = []
                const possibleDownstreamMatches: ConceptGraph[] = []
                possibleDownstreamMatches.push(...this._recursivelyGetPossibleMatches(
                    query, data, queryNeighbourConceptId, opts, ctx
                ))

                const matchedDataRelationIds: string[] = []

                if (!query.isUnknownConcept(queryConceptId) && !query.isUnknownConcept(queryNeighbourConceptId)) {
                    glog().trace(debugContextLine + 'Query curConcept/neighbourConcept is: EXACT/EXACT')
                    matchedDataRelationIds.push(...data.filterRelationIds({
                        conceptId: queryConceptId,
                        neighbourConceptId: queryNeighbourConceptId,
                        type: queryEdgeAttributes.type
                    }))
                } else if (query.isUnknownConcept(queryConceptId) && !query.isUnknownConcept(queryNeighbourConceptId)) {
                    glog().trace(debugContextLine + 'Query curConcept/neighbourConcept is: UNKNOWN/EXACT')
                    const filteredRelationIds: string[] = data.filterRelationIds({
                        // conceptId: queryConceptId,
                        neighbourConceptId: queryNeighbourConceptId,
                        type: queryEdgeAttributes.type
                    })
                    matchedDataRelationIds.push(...filteredRelationIds)

                } else if (!query.isUnknownConcept(queryConceptId) && query.isUnknownConcept(queryNeighbourConceptId)) {
                    glog().trace(debugContextLine + 'Query curConcept/neighbourConcept is: EXACT/UNKNOWN')
                    matchedDataRelationIds.push(...data.filterRelationIds({
                        conceptId: queryConceptId,
                        // neighbourConceptId: queryNeighbourConceptId,
                        type: queryEdgeAttributes.type
                    }))

                } else if (query.isUnknownConcept(queryConceptId) && query.isUnknownConcept(queryNeighbourConceptId)) {
                    glog().trace(debugContextLine + 'Query curConcept/neighbourConcept is: UNKNOWN/UNKNOWN')
                    const filteredRelationIds: string[] = data.filterRelationIds({
                        // conceptId: queryConceptId,
                        // neighbourConceptId: queryNeighbourConceptId,
                        type: queryEdgeAttributes.type
                    })
                    matchedDataRelationIds.push(...filteredRelationIds)

                }
                glog().trace(debugContextLine + 'Number of Downstream Matches: ' + possibleDownstreamMatches.length)
                glog().trace(debugContextLine + 'Number of Current Relation Options found in Data: ' + matchedDataRelationIds.length)

                if (possibleMatchesForCurrentQueryRelation.length === 0) {
                    data.forEachEdge((dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                        if (matchedDataRelationIds.includes(dataRelationId)) {
                            for (const possibleDownstreamMatch of possibleDownstreamMatches) {
                                if (possibleDownstreamMatch.doesConceptIdExist(dataSourceId) || possibleDownstreamMatch.doesConceptIdExist(dataTargetId)) {
                                    const newCurrentPossibleMatch: ConceptGraph = ConceptGraph.copyFrom(possibleDownstreamMatch)
                                    newCurrentPossibleMatch.addConceptByIdIfNotExists(dataSourceId, dataSource)
                                    newCurrentPossibleMatch.addConceptByIdIfNotExists(dataTargetId, dataTarget)
                                    newCurrentPossibleMatch.addEdgeWithKey(dataRelationId, dataSourceId, dataTargetId, dataRelation)
                                    possibleMatchesForCurrentQueryRelation.push(newCurrentPossibleMatch)
                                }
                            }
                        }
                    })
                } else {
                    data.forEachEdge((dataRelationId, dataRelation, dataSourceId, dataTargetId, dataSource, dataTarget) => {
                        if (matchedDataRelationIds.includes(dataRelationId)) {
                            for (const existingCurrentPossibleMatch of possibleMatchesForCurrentQueryRelation) {
                                for (const possibleDownstreamMatch of possibleDownstreamMatches) {
                                    existingCurrentPossibleMatch.addConceptByIdIfNotExists(dataSourceId, dataSource)
                                    existingCurrentPossibleMatch.addConceptByIdIfNotExists(dataTargetId, dataTarget)
                                    existingCurrentPossibleMatch.addEdgeWithKey(dataRelationId, dataSourceId, dataTargetId, dataRelation)
                                    existingCurrentPossibleMatch.mergeFrom(possibleDownstreamMatch)
                                }
                            }
                        }
                    })
                }
                possibleMatchesPerRelation.push(possibleMatchesForCurrentQueryRelation)
            })
            for (let i = 0; i < possibleMatchesPerRelation.length; i++) {
                const possibleMatchesForSingleRelationA = possibleMatchesPerRelation[i]
                for (let j = i; j < possibleMatchesPerRelation.length; j++) {
                    const possibleMatchesForSingleRelationB = possibleMatchesPerRelation[i]
                    for (const singlePossibleMatchForSingleRelationA of possibleMatchesForSingleRelationA) {
                        for (const singlePossibleMatchForSingleRelationB of possibleMatchesForSingleRelationB) {
                            const finalPossibleMatch: ConceptGraph = ConceptGraph.copyFrom(singlePossibleMatchForSingleRelationA)
                            finalPossibleMatch.mergeFrom(singlePossibleMatchForSingleRelationB)
                            possibleMatches.push(finalPossibleMatch)
                        }
                    }
                }
            }
            // possibleMatches.push(...currentPossibleMatches)
        }

        glog().trace(debugContextLine + 'Number of matches for this node: ' + possibleMatches.length)
        glog().trace(debugContextLine + '<<<<<<<<<<<<<<<<')
        return possibleMatches
    }

    private _recursivelyGetPossibleMatchesByRelations (query: ConceptGraph, dataToQuery: ConceptGraph, queryConceptId: string, opts: MatchingOptions = { shouldIncludeQueryInResult: false }, ctx: RecursiveContext = {
        alreadyProcessedQueryConceptIds: [],
        alreadyProcessedQueryRelationIds: [],
        dataConceptsNotMatchedByKnownConceptIds: [],
        exactDataMatchConceptIds: [],
        knownQueryConceptIds: [],
        unknownQueryConceptIds: []
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
                            ...ctx,
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
                glog().trace(debugContextLine + `\t\tNOT processing edge: [${querySourceAttributes.description}] - ${queryEdgeAttributes.type} -> [${queryTragetAttributes.description}] because it was already processed`)
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