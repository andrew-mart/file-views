/**
 * The sign that splits every row of the first ones the same number of times — the most of them if several do; the one
 * met most often if none does; a comma in a text with none of them.
 * @param {string} text
 * @returns {string}
 */
export function csvDelimiterOf(text: string): string;
/**
 * The text's lines, each split into its cells — told by their column — and the signs between them.
 * @param {string} text
 * @param {string} delimiter
 * @returns {CsvPiece[][]}
 */
export function csvLines(text: string, delimiter: string): CsvPiece[][];
/**
 * — a cell's text in a line, or a splitting sign:
 *   no column
 */
export type CsvPiece = {
    text: string;
    column: number | undefined;
};
