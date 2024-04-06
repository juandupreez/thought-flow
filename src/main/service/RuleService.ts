import { ConceptGraph } from "../core/ConceptGraph"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { ConceptMatchService } from "./ConceptMatchService"
import { glog } from "../util/Logger"
import { isConceptUnknown } from "../util/common"

export class RuleService {

  private readonly conceptMatchService: ConceptMatchService = new ConceptMatchService()

  async appyRule (rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
    const hypothesis: ConceptGraph = rule.getConceptDefinitionByRelationType('has_hypothesis')
    glog().debug('Hypothesis')
    glog().debug('\t', hypothesis.nodes())
    glog().debug('\t', hypothesis.edges())
    const conclusion: ConceptGraph = rule.getConceptDefinitionByRelationType('has_conclusion')
    glog().debug('Conclusion')
    glog().debug('\t', conclusion.nodes())
    glog().debug('\t', conclusion.edges())
    const possibleMatchesWithHypothesis: ConceptGraph[] = this.conceptMatchService.getMatches(hypothesis, args, { shouldIncludeQueryInResult: true })
    if (possibleMatchesWithHypothesis.length === 0) {
      return new ConceptGraph()
    }
    glog().debug('Number of Matches', possibleMatchesWithHypothesis.length)

    const firstMatchWithHypothesis: ConceptGraph = possibleMatchesWithHypothesis[0]
    glog().debug('First Match with Hypothesis')
    glog().debug('\t', firstMatchWithHypothesis.nodes())
    glog().debug('\t', firstMatchWithHypothesis.edges())

    const result: ConceptGraph = new ConceptGraph()

    conclusion.forEachEdge((conclusionRelationId: string, conclusionRelation,
      conclusionSourceConceptId, conclusionTargetConceptId,
      conclusionSourceConcept, conclusionTargetConcept
    ) => {

      if (isConceptUnknown(conclusionSourceConcept) && !isConceptUnknown(conclusionTargetConcept)) {
        result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)

        const hypothesisConceptId: string | undefined = firstMatchWithHypothesis.findNode((ConceptId: string) => {
          return ConceptId === conclusionSourceConceptId
        })

        if (hypothesisConceptId === undefined) {
          result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)
          result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
        } else {
          let matchedConceptId: string | undefined
          firstMatchWithHypothesis.forEachEdge(hypothesisConceptId, (
            matchedRelationId: string, matchedRelation,
            matchedSourceConceptId, matchedTargetConceptId,
            matchedSourceConcept, matchedTargetConcept) => {
              if (matchedRelation.type === 'matches') {
                matchedConceptId = matchedTargetConceptId
              }
          })
          if (matchedConceptId === undefined ) {
            result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
          } else {
            const matchedConcept: Concept = firstMatchWithHypothesis.getNodeAttributes(matchedConceptId)
            result.addConceptByIdIfNotExists(matchedConceptId, matchedConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, matchedConceptId, conclusionTargetConceptId)
          
          }
        }

      } else if (!isConceptUnknown(conclusionSourceConcept) && isConceptUnknown(conclusionTargetConcept)) {
        result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)

        const hypothesisConceptId: string | undefined = firstMatchWithHypothesis.findNode((ConceptId: string) => {
          return ConceptId === conclusionTargetConceptId
        })

        if (hypothesisConceptId === undefined) {
          result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)
          result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
        } else {
          let matchedConceptId: string | undefined
          firstMatchWithHypothesis.forEachEdge(hypothesisConceptId, (
            matchedRelationId: string, matchedRelation,
            matchedSourceConceptId, matchedTargetConceptId,
            matchedSourceConcept, matchedTargetConcept) => {
              if (matchedRelation.type === 'matches') {
                matchedConceptId = matchedTargetConceptId
              }
          })
          if (matchedConceptId === undefined ) {
            result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
          } else {
            const matchedConcept: Concept = firstMatchWithHypothesis.getNodeAttributes(matchedConceptId)
            result.addConceptByIdIfNotExists(matchedConceptId, matchedConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, matchedConceptId)
          
          }
        }

      } else if (isConceptUnknown(conclusionSourceConcept) && isConceptUnknown(conclusionTargetConcept)) {

        firstMatchWithHypothesis.forEachEdge((edgeId, relation, sourceId, targetId, sourceConcept, targetConcept) => {
          if (conclusionRelation.type === relation.type) {
            result.addConceptByIdIfNotExists(sourceId, sourceConcept)
            result.addConceptByIdIfNotExists(targetId, targetConcept)
            result.addRelationByTypeIfNotExists(relation.type, sourceId, targetId)
          }
        })
      } else {
        result.addConceptByIdIfNotExists(conclusionSourceConceptId, conclusionSourceConcept)
        result.addConceptByIdIfNotExists(conclusionTargetConceptId, conclusionTargetConcept)
        result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptId, conclusionTargetConceptId)
      }
    })

    glog().debug('Result')
    glog().debug('\t', result.nodes())
    glog().debug('\t', result.edges())

    return result
  }

}