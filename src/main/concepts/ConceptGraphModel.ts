export interface ConceptGraphModel {
    [conceptKey: string]: {
        [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel
    }
}