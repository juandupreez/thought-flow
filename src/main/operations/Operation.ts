import { ConceptGraph } from "../core/ConceptGraph";

export interface Operation {
    execute(args: ConceptGraph): Promise<ConceptGraph>;

}