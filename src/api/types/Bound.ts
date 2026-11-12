// Generated from the getclean API contract; do not edit.

/**
 * The range a field takes. Each member is present where it applies; an integer field has integer values.
 */
export interface Bound {
    /** The least value allowed. */
    min?: number | undefined;
    /** The greatest value allowed. */
    max?: number | undefined;
    /** The value used when the field is left out. Named `default_value`, since `default` is a reserved word in Java and C#. */
    default_value?: number | undefined;
    /** The first value of a gap inside the range, where no value is allowed. `max_characters` allows 0 and then 1,000 upward, so its gap runs from 1 to 999. */
    excluded_min?: number | undefined;
    /** The last value of a gap inside the range, 999 for `max_characters`. */
    excluded_max?: number | undefined;
}
