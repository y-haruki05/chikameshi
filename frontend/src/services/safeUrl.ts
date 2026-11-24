/** 外部データをリンクへ使う前に、スクリプト等の実行可能なURLを拒否する。 */
export function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch { return undefined; }
}
