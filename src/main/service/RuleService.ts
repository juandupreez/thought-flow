import { ConceptGraph } from "../concepts/ConceptGraph"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { ConceptMatchService } from "./ConceptMatchService"
import { glog } from "../util/Logger"
import { isConceptUnknown } from "../util/common"

export class RuleService {

  async appyRule (rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
    const hypothesis: ConceptGraph = rule.getConceptDefinitionByRelationType('has_hypothesis')
    glog().debug('Hypothesis')
    glog().debug('\t', hypothesis.nodes())
    glog().debug('\t', hypothesis.edges())
    const conclusion: ConceptGraph = rule.getConceptDefinitionByRelationType('has_conclusion')
    glog().debug('Conclusion')
    glog().debug('\t', conclusion.nodes())
    glog().debug('\t', conclusion.edges())
    const possibleMatchesWithHypothesis: ConceptGraph[] = ConceptMatchService.getMatches(hypothesis, args, { shouldIncludeQueryInResult: true })
    if (possibleMatchesWithHypothesis.length === 0) {
      return new ConceptGraph()
    }
    glog().debug('Number of Matches', possibleMatchesWithHypothesis.length)

    const firstMatchWithHypothesis: ConceptGraph = possibleMatchesWithHypothesis[0]
    glog().debug('First Match with Hypothesis')
    glog().debug('\t', firstMatchWithHypothesis.nodes())
    glog().debug('\t', firstMatchWithHypothesis.edges())

    const result: ConceptGraph = new ConceptGraph()

    conclusion.forEachEdge((conclusionEdgeId: string, conclusionRelation,
      conclusionSourceConceptKey, conclusionTargetConceptKey,
      conclusionSourceConcept, conclusionTargetConcept
    ) => {

      if (isConceptUnknown(conclusionSourceConcept) && !isConceptUnknown(conclusionTargetConcept)) {
        result.addConceptByKeyIfNotExists(conclusionTargetConceptKey, conclusionTargetConcept)

        const hypothesisConceptId: string | undefined = firstMatchWithHypothesis.findNode((nodeId: string) => {
          return nodeId === conclusionSourceConceptKey
        })

        if (hypothesisConceptId === undefined) {
          result.addConceptByKeyIfNotExists(conclusionSourceConceptKey, conclusionSourceConcept)
          result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptKey, conclusionTargetConceptKey)
        } else {
          let matchedConceptId: string | undefined
          firstMatchWithHypothesis.forEachEdge(hypothesisConceptId, (
            matchedEdgeId: string, matchedRelation,
            matchedSourceConceptKey, matchedTargetConceptKey,
            matchedSourceConcept, matchedTargetConcept) => {
              if (matchedRelation.type === 'matches') {
                matchedConceptId = matchedTargetConceptKey
              }
          })
          if (matchedConceptId === undefined ) {
            result.addConceptByKeyIfNotExists(conclusionSourceConceptKey, conclusionSourceConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptKey, conclusionTargetConceptKey)
          } else {
            const matchedConcept: Concept = firstMatchWithHypothesis.getNodeAttributes(matchedConceptId)
            result.addConceptByKeyIfNotExists(matchedConceptId, matchedConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, matchedConceptId, conclusionTargetConceptKey)
          
          }
        }

      } else if (!isConceptUnknown(conclusionSourceConcept) && isConceptUnknown(conclusionTargetConcept)) {
        result.addConceptByKeyIfNotExists(conclusionSourceConceptKey, conclusionSourceConcept)

        const hypothesisConceptId: string | undefined = firstMatchWithHypothesis.findNode((nodeId: string) => {
          return nodeId === conclusionTargetConceptKey
        })

        if (hypothesisConceptId === undefined) {
          result.addConceptByKeyIfNotExists(conclusionTargetConceptKey, conclusionTargetConcept)
          result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptKey, conclusionTargetConceptKey)
        } else {
          let matchedConceptId: string | undefined
          firstMatchWithHypothesis.forEachEdge(hypothesisConceptId, (
            matchedEdgeId: string, matchedRelation,
            matchedSourceConceptKey, matchedTargetConceptKey,
            matchedSourceConcept, matchedTargetConcept) => {
              if (matchedRelation.type === 'matches') {
                matchedConceptId = matchedTargetConceptKey
              }
          })
          if (matchedConceptId === undefined ) {
            result.addConceptByKeyIfNotExists(conclusionTargetConceptKey, conclusionTargetConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptKey, conclusionTargetConceptKey)
          } else {
            const matchedConcept: Concept = firstMatchWithHypothesis.getNodeAttributes(matchedConceptId)
            result.addConceptByKeyIfNotExists(matchedConceptId, matchedConcept)
            result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptKey, matchedConceptId)
          
          }
        }

      } else if (isConceptUnknown(conclusionSourceConcept) && isConceptUnknown(conclusionTargetConcept)) {

        firstMatchWithHypothesis.forEachEdge((edgeId, relation, sourceId, targetId, sourceConcept, targetConcept) => {
          if (conclusionRelation.type === relation.type) {
            result.addConceptByKeyIfNotExists(sourceId, sourceConcept)
            result.addConceptByKeyIfNotExists(targetId, targetConcept)
            result.addRelationByTypeIfNotExists(relation.type, sourceId, targetId)
          }
        })
      } else {
        result.addConceptByKeyIfNotExists(conclusionSourceConceptKey, conclusionSourceConcept)
        result.addConceptByKeyIfNotExists(conclusionTargetConceptKey, conclusionTargetConcept)
        result.addRelationByTypeIfNotExists(conclusionRelation.type, conclusionSourceConceptKey, conclusionTargetConceptKey)
      }
    })

    glog().debug('Result')
    glog().debug('\t', result.nodes())
    glog().debug('\t', result.edges())

    return result
  }

}