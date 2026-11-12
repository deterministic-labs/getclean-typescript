// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One change between the two sides, on one block.
 */
export interface BlockChange {
    /** The kind of change: `added`, a block only on the current side; `removed`, only on the baseline side; `changed`, a paired block whose text differs; `moved`, the same text at another position. A closed set. */
    kind: BlockChange.Kind;
    /** The block's kind, the after side's, or the before side's on a removal: `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed` or `media`; an open set. */
    block_kind: string;
    /** The baseline side of the block. Absent on `added`. */
    before?: GetClean.ChangeSide | undefined;
    /** The current side of the block. Absent on `removed`. */
    after?: GetClean.ChangeSide | undefined;
    /** The cell changes of a table block, rows paired before cells, an added row's cells with `before_text` absent and a removed row's with `after_text` absent; `[]` unless the block is a table. */
    cells: GetClean.CellChange[];
}

export namespace BlockChange {
    /** The kind of change: `added`, a block only on the current side; `removed`, only on the baseline side; `changed`, a paired block whose text differs; `moved`, the same text at another position. A closed set. */
    export const Kind = {
        Added: "added",
        Removed: "removed",
        Changed: "changed",
        Moved: "moved",
    } as const;
    export type Kind = (typeof Kind)[keyof typeof Kind];
}
