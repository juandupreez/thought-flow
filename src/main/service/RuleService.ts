import { ConceptGraph } from "../core/ConceptGraph"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { ConceptMatchService } from "./ConceptMatchService"
import { glog } from "../util/Logger"
import { isConceptUnknown } from "../util/common"
import { ConceptGraphModel } from "../model/ConceptGraphModel"

export class RuleService {

  private readonly conceptMatchService: ConceptMatchService = new ConceptMatchService()

  async applyRuleToFirstMatch (rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
    return (await this.applyRule(rule, args))[0] ?? new ConceptGraph()
  }

  async applyRuleToAllMatches (rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
    const allResults: ConceptGraph[] = await this.applyRule(rule, args)
    const mergedResult: ConceptGraph = new ConceptGraph()

    for (const singleResult of allResults) {
      mergedResult.mergeFrom(singleResult)
    }

    return mergedResult
  }

  async applyRule (rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph[]> {
    glog().debug('\n|---------START APPLYING RULE-------|')
    glog().debug('Arguments', args.toStringifiedModel())
    const hypothesis: ConceptGraph = rule.getConceptDefinitionByRelationType('has_hypothesis')
    glog().debug('Hypothesis', hypothesis.toStringifiedModel())
    const mappings: ConceptGraph = rule.getConceptDefinitionByRelationType('has_mapping')
    glog().debug('Mappings', hypothesis.toStringifiedModel())
    const conclusion: ConceptGraph = rule.getConceptDefinitionByRelationType('has_conclusion')
    glog().debug('Conclusion', conclusion.toStringifiedModel())
    const possibleMatchesWithHypothesis: ConceptGraph[] = this.conceptMatchService.getMatches(hypothesis, args, { shouldIncludeQueryInResult: true })
    if (possibleMatchesWithHypothesis.length === 0) {
      glog().debug('No matches found')
      glog().debug('\n|---------END APPLYING RULE-------|')
      return [new ConceptGraph()]
    }
    glog().debug('Hypothesis Matches in Data', JSON.stringify(possibleMatchesWithHypothesis.map((singleResult) => {
      return singleResult.toModel()
    }), null, 2))

    const results: ConceptGraph[] = []
    for (const possibleMatchWithHypothesis of possibleMatchesWithHypothesis) {

      const result: ConceptGraph = ConceptGraph.copyFrom(conclusion)
      mappings.forEachEdge((ruleRelationId: string, ruleRelation,
        hypothesisConceptId, conclusionConceptId,
        hypothesisConcept, conclusionConcept
      ) => {
        if (ruleRelation.type === 'becomes') {
          // find thing that matched hypothesis id

          const matchesQueryModel: ConceptGraphModel = {}
          matchesQueryModel[`${hypothesisConceptId}`] = { '-matches->': '?matched_object' }
          const newConcepts: ConceptGraph[] = this.conceptMatchService.getMatches(
            ConceptGraph.fromModel(matchesQueryModel),
            possibleMatchWithHypothesis
          )

          if (newConcepts.length > 0) {
            const newConceptGraph: ConceptGraph = newConcepts[0]
            newConceptGraph.forceDeleteConceptAndRelations(hypothesisConceptId)

            const newConceptId: string = newConceptGraph.nodes()[0] ?? hypothesisConceptId
            const newConcept: Concept = newConceptId !== hypothesisConceptId ? newConceptGraph.getNodeAttributes(newConceptId) : hypothesisConcept

            result.replaceConcept(conclusionConceptId, newConceptId, newConcept)

          }
        }

      })
      results.push(result)
    }
    glog().debug('Results', JSON.stringify(results.map((singleResult) => {
      return singleResult.toModel()
    }), null, 2))
    glog().debug('\n|---------END APPLYING RULE-------|')
    return results
  }

  // async applyHypothesisAndConclusionToAllData (hypothesis: ConceptGraph, conclusion: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
  //   glog().debug('\n|---------START APPLYING RULE-------|')
  //   glog().debug('Arguments', args.toStringifiedModel())
  //   glog().debug('Hypothesis', hypothesis.toStringifiedModel())
  //   glog().debug('Conclusion', conclusion.toStringifiedModel())
  //   const possibleMatchesWithHypothesis: ConceptGraph[] = this.conceptMatchService.getMatches(hypothesis, args, { shouldIncludeQueryInResult: true })
  //   if (possibleMatchesWithHypothesis.length === 0) {
  //     glog().debug('No matches found')
  //     glog().debug('\n|---------END APPLYING RULE-------|')
  //     return [new ConceptGraph()]
  //   }
  //   glog().debug('Hypothesis Matches in Data', JSON.stringify(possibleMatchesWithHypothesis.map((singleResult) => {
  //     return singleResult.toModel()
  //   }), null, 2))

  //   const results: ConceptGraph[] = []
  //   for (const possibleMatchWithHypothesis of possibleMatchesWithHypothesis) {

  //     const result: ConceptGraph = ConceptGraph.copyFrom(conclusion)
  //     rule.forEachEdge((ruleRelationId: string, ruleRelation,
  //       hypothesisConceptId, conclusionConceptId,
  //       hypothesisConcept, conclusionConcept
  //     ) => {
  //       if (ruleRelation.type === 'becomes') {
  //         // find thing that matched hypothesis id

  //         const matchesQueryModel: ConceptGraphModel = {}
  //         matchesQueryModel[`${hypothesisConceptId}`] = { '-matches->': '?matched_object' }
  //         const newConcepts: ConceptGraph[] = this.conceptMatchService.getMatches(
  //           ConceptGraph.fromModel(matchesQueryModel),
  //           possibleMatchWithHypothesis
  //         )

  //         if (newConcepts.length > 0) {
  //           const newConceptGraph: ConceptGraph = newConcepts[0]
  //           newConceptGraph.forceDeleteConceptAndRelations(hypothesisConceptId)

  //           const newConceptId: string = newConceptGraph.nodes()[0] ?? hypothesisConceptId
  //           const newConcept: Concept = newConceptId !== hypothesisConceptId ? newConceptGraph.getNodeAttributes(newConceptId) : hypothesisConcept

  //           result.replaceConcept(conclusionConceptId, newConceptId, newConcept)

  //         }
  //       }

  //     })
  //     results.push(result)
  //   }
  //   glog().debug('Results', JSON.stringify(results.map((singleResult) => {
  //     return singleResult.toModel()
  //   }), null, 2))
  //   glog().debug('\n|---------END APPLYING RULE-------|')
  //   return results
  // }

}