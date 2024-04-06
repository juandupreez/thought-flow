export interface ConceptGraphModel {
    [conceptId: string]: {
        [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel
    }
}