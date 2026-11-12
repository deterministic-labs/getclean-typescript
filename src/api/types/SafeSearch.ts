// Generated from the getclean API contract; do not edit.

/** How strictly adult content is filtered, where a source has the setting: `off`, `moderate` or `strict`. A closed set. */
export const SafeSearch = {
    Off: "off",
    Moderate: "moderate",
    Strict: "strict",
} as const;
export type SafeSearch = (typeof SafeSearch)[keyof typeof SafeSearch];
