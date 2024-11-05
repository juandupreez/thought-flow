import { ConceptGraph } from "../core/ConceptGraph";
import { ConceptGraphModel } from "../model/ConceptGraphModel";

export interface SimpleRelation {
    fromConceptId: string
    toConceptId: string
    relationType: string
}

export interface ConceptGraphDao {
    findAndMergeMatches(args: ConceptGraph): Promise<ConceptGraph>;
    getRuleByName(arg0: string): Promise<ConceptGraph>
    createConceptGraphModel(cgModel: ConceptGraphModel): Promise<void>
    createConceptIfNotExists(conceptId: string): Promise<void>
    createConcept(conceptId: string): Promise<void>
    createRelationIfNotExists(simpleRelation: SimpleRelation): Promise<void>
    createRelation(simpleRelation: SimpleRelation): Promise<void>
    getConceptByKey(key: string): Promise<ConceptGraph>
    deleteAllData(): Promise<void>
}