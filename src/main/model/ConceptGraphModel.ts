export type RelationKeyWithArrows = `-${string}->` | `<-${string}-`

export interface ConceptGraphModel {
    [conceptId: string]: {
        [relationKey: RelationKeyWithArrows]: string | ConceptGraphModel
    }
}