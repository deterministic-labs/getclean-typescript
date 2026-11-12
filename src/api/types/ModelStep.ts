// Generated from the getclean API contract; do not edit.

/**
 * One step a model, or a versioned recognizer, took in making the answer.
 */
export interface ModelStep {
    /** Which step ran: `highlights`, the judged highlights; `json_schema`, the schema fill; `summary`, the summary; `recognition`, text read from a page with no text layer; `language_detection`, the languages chosen for that reading; `reranking`, the search's ranking; `discovery`, the search's choice of sources; `source_profile`, a publisher identified during the call. An open set. */
    step: string;
    /** The step's version, so a result can be placed and compared. */
    version: string;
}
