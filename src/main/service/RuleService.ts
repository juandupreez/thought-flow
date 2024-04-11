import { ConceptGraph } from "../core/ConceptGraph"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { ConceptMatchService } from "./ConceptMatchService"
import { glog } from "../util/Logger"
import { isConceptUnknown } from "../util/common"
import { ConceptGraphModel } from "../model/ConceptGraphModel"

export class RuleService {

  private readonly conceptMatchService: ConceptMatchService = new ConceptMatchService()

  async appyRule (rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
    const hypothesis: ConceptGraph = rule.getConceptDefinitionByRelationType('has_hypothesis')
    glog().debug('Hypothesis', hypothesis.toStringifiedModel())
    const conclusion: ConceptGraph = rule.getConceptDefinitionByRelationType('has_conclusion')
    glog().debug('Conclusion', conclusion.toStringifiedModel())
    glog().debug('Trying to find a match in', args.toStringifiedModel())
    const possibleMatchesWithHypothesis: ConceptGraph[] = this.conceptMatchService.getMatches(hypothesis, args, { shouldIncludeQueryInResult: true })
    if (possibleMatchesWithHypothesis.length === 0) {
      glog().debug('No matches found')
      return new ConceptGraph()
    }
    glog().debug('Number of Matches', possibleMatchesWithHypothesis.length)

    const firstMatchWithHypothesis: ConceptGraph = possibleMatchesWithHypothesis[0]
    glog().debug('First Match with Hypothesis', firstMatchWithHypothesis.toStringifiedModel())


    const result: ConceptGraph = ConceptGraph.copyFrom(conclusion)
    rule.forEachEdge((ruleRelationId: string, ruleRelation,
      hypothesisConceptId, conclusionConceptId,
      hypothesisConcept, conclusionConcept
    ) => {
      if (ruleRelation.type === 'becomes') {
        // find thing that matched hypothesis id

        const matchesQueryModel: ConceptGraphModel = {}
        matchesQueryModel[`${hypothesisConceptId}`] = { '-matches->': '?matched_object' }
        const newConcepts: ConceptGraph[] = this.conceptMatchService.getMatches(
          ConceptGraph.fromModel(matchesQueryModel),
          firstMatchWithHypothesis
        )

        if (newConcepts.length > 0) {
          const newConceptGraph: ConceptGraph = newConcepts[0]
          newConceptGraph.forceDeleteConceptAndRelations(hypothesisConceptId)

          const newConceptId: string = newConceptGraph.nodes()[0] ?? hypothesisConceptId
          const newConcept: Concept = newConceptId !== hypothesisConceptId? newConceptGraph.getNodeAttributes(newConceptId) : hypothesisConcept

          result.replaceConcept(conclusionConceptId, newConceptId, newConcept)

        }
      }

    })

    // const result: ConceptGraph = new ConceptGraph()
    // conclusion.forEachEdge((conclusionRelationId: string, conclusionRelation,
    //   conclusionSourceConceptId, conclusionTargetConceptId,
    //   conclusionSourceConcept, conclusionTargetConcept
    // ) => {

    //   if (isConceptUnknown(conclusionSourceConcept) && !isConceptUnknown(conclusionTargetConcept)) {
    //     result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)

    //     const hypothesisConceptId: string | undefined = firstMatchWithHypothesis.findNode((ConceptId: string) => {
    //       return ConceptId === conclusionSourceConceptId
    //     })

    //     if (hypothesisConceptId === undefined) {
    //       result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)
    //       result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
    //     } else {
    //       let matchedConceptId: string | undefined
    //       firstMatchWithHypothesis.forEachEdge(hypothesisConceptId, (
    //         matchedRelationId: string, matchedRelation,
    //         matchedSourceConceptId, matchedTargetConceptId,
    //         matchedSourceConcept, matchedTargetConcept) => {
    //         if (matchedRelation.type === 'matches') {
    //           matchedConceptId = matchedTargetConceptId
    //         }
    //       })
    //       if (matchedConceptId === undefined) {
    //         result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)
    //         result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
    //       } else {
    //         const matchedConcept: Concept = firstMatchWithHypothesis.getNodeAttributes(matchedConceptId)
    //         result.addConceptByIdIfNotExists(matchedConceptId, matchedConcept)
    //         result.addRelationByTypeIfNotExists(conclusionRelation.type, matchedConceptId, conclusionTargetConceptId)

    //       }
    //     }

    //   } else if (!isConceptUnknown(conclusionSourceConcept) && isConceptUnknown(conclusionTargetConcept)) {
    //     result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)

    //     const hypothesisConceptId: string | undefined = firstMatchWithHypothesis.findNode((ConceptId: string) => {
    //       return ConceptId === conclusionTargetConceptId
    //     })

    //     if (hypothesisConceptId === undefined) {
    //       result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)
    //       result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
    //     } else {
    //       let matchedConceptId: string | undefined
    //       firstMatchWithHypothesis.forEachEdge(hypothesisConceptId, (
    //         matchedRelationId: string, matchedRelation,
    //         matchedSourceConceptId, matchedTargetConceptId,
    //         matchedSourceConcept, matchedTargetConcept) => {
    //         if (matchedRelation.type === 'matches') {
    //           matchedConceptId = matchedTargetConceptId
    //         }
    //       })
    //       if (matchedConceptId === undefined) {
    //         result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)
    //         result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
    //       } else {
    //         const matchedConcept: Concept = firstMatchWithHypothesis.getNodeAttributes(matchedConceptId)
    //         result.addConceptByIdIfNotExists(matchedConceptId, matchedConcept)
    //         result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, matchedConceptId)

    //       }
    //     }

    //   } else if (isConceptUnknown(conclusionSourceConcept) && isConceptUnknown(conclusionTargetConcept)) {

    //     firstMatchWithHypothesis.forEachEdge((edgeId, relation, sourceId, targetId, sourceConcept, targetConcept) => {
    //       if (conclusionRelation.type === relation.type) {
    //         result.addConceptByIdIfNotExists(sourceId, sourceConcept)
    //         result.addConceptByIdIfNotExists(targetId, targetConcept)
    //         result.addRelationByTypeIfNotExists(relation.type, sourceId, targetId)
    //       }
    //     })
    //   } else {
    //     result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)
    //     result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)
    //     result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
    //   }
    // })

    glog().debug('Result', result.toStringifiedModel())

    return result
  }

}