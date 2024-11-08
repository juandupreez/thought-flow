import { ConceptGraph } from "../core/ConceptGraph"
import { Concept } from "../model/Concept"
import { Relation } from "../model/Relation"
import { ConceptMatchService } from "./ConceptMatchService"
import { glog } from "../util/Logger"
import { isConceptUnknown } from "../util/common"
import { ConceptGraphModel } from "../model/ConceptGraphModel"

export class RuleService {

  private readonly conceptMatchService: ConceptMatchService = new ConceptMatchService()

  async applyRuleToFirstMatch(rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
    return (await this.applyRule(rule, args))[0] ?? new ConceptGraph()
  }

  async applyRuleToAllMatches(rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph> {
    const allResults: ConceptGraph[] = await this.applyRule(rule, args)
    const mergedResult: ConceptGraph = new ConceptGraph()

    for (const singleResult of allResults) {
      mergedResult.mergeFrom(singleResult)
    }

    return mergedResult
  }

  async applyRule(rule: ConceptGraph, args: ConceptGraph): Promise<ConceptGraph[]> {
    glog().debug('\n|---------START APPLYING RULE-------|')
    glog().debug('Arguments', args.toStringifiedModel())
    const rootRuleConceptId: string = this.getRootRuleConceptId(rule)
    glog().debug('Root Rule Concept Id: ', rootRuleConceptId)
    const hypothesisConceptId: string = rule.getConceptDefinitionByRelationType(rootRuleConceptId, 'has_hypothesis').getConceptIds()[0] ?? 'no_concept_id'
    const hypothesis: ConceptGraph = rule.getConceptDefinition(hypothesisConceptId)
    glog().debug(`Hypothesis ${hypothesisConceptId} `, hypothesis.toStringifiedModel())
    const mappingConceptId: string = rule.getConceptDefinitionByRelationType(rootRuleConceptId, 'has_mapping').getConceptIds()[0] ?? 'no_concept_id'
    const mapping: ConceptGraph = rule.getConceptDefinition(mappingConceptId)
    glog().debug(`Mapping ${mappingConceptId} `, mapping.toStringifiedModel())
    const conclusionConceptId: string = rule.getConceptDefinitionByRelationType(rootRuleConceptId, 'has_conclusion').getConceptIds()[0] ?? 'no_concept_id'
    const conclusion: ConceptGraph = rule.getConceptDefinition(conclusionConceptId)
    glog().debug(`Conclusion ${conclusionConceptId} `, conclusion.toStringifiedModel())
    
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
      mapping.forEachEdge((ruleRelationId: string, ruleRelation,
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

  getRootRuleConceptId(rule: ConceptGraph): string {
    const ruleStructure: ConceptGraph = ConceptGraph.fromModel({
      '?unkown_rule_name': {
        '-instance_of->': 'rule'
      }
    })
    const potentialRules: ConceptGraph[] = this.conceptMatchService.getMatches(ruleStructure, rule)
    if (potentialRules.length == 0) {
      return 'no_rule_in_concept_graph'
    }
    else if (potentialRules.length == 1) {
      return Object.keys(potentialRules[0].toModel())[0]
    } else {
      return Object.keys(potentialRules[0].toModel())[0]
    }
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