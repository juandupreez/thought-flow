import { ConceptGraph } from "../concepts/ConceptGraph"
import { ConceptGraphDao } from "../dao/ConceptGraphDao"

export class Reader {
    private readonly conceptGraphDao: ConceptGraphDao

    constructor (conceptGraphDao: ConceptGraphDao) {
        this.conceptGraphDao = conceptGraphDao
    }

    async readSingleWord (wordText: string): Promise<ConceptGraph> {
        const wordConceptId: string = 'word_' + wordText
        const wordConcept: ConceptGraph = await this.conceptGraphDao.getConceptByKey(wordConceptId)
        // if !unkown
        const bestConceptDefinition: ConceptGraph = await this._getBestWordDefinition(wordConcept)
        return bestConceptDefinition
    }

    private async _getBestWordDefinition (wordConcept: ConceptGraph): Promise<ConceptGraph> {
        const definitionGroup: ConceptGraph = await this._getDefinitionGroup(wordConcept)
        return definitionGroup
    }
    private async _getDefinitionGroup (wordConcept: ConceptGraph): Promise<ConceptGraph> {
        const definitionGroup: ConceptGraph = await this.conceptGraphDao.getConceptByKey('', )
        return definitionGroup
    }

}