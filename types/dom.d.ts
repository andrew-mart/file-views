/**
 * @typedef {{ className?: string, text?: string, title?: string, attrs?: Readonly<Record<string, string>> }} Props
 */
/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Props} [props]
 * @param {readonly (Node | string)[]} [children]
 * @returns {HTMLElementTagNameMap[K]}
 */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props, children?: readonly (Node | string)[]): HTMLElementTagNameMap[K];
export type Props = {
    className?: string;
    text?: string;
    title?: string;
    attrs?: Readonly<Record<string, string>>;
};
