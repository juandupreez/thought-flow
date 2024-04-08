import { Concept } from "../model/Concept"

export function parseConceptIdAndIsUnknown (conceptIdStr: string): { conceptId: string, isUnknown: boolean | undefined } {
    return {
        conceptId: conceptIdStr.split('?').join('').trim(),
        isUnknown: conceptIdStr.startsWith('?') ? true : undefined
    }
}

export function isConceptUnknown (concept: Concept): boolean {
    return concept.isUnknown ?? false
}