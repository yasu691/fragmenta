/**
 * Frontmatter ユーティリティ
 * マークダウンファイルに YAML Frontmatter を追加・パースする
 */

/**
 * コンテンツにタグ付き Frontmatter を追加
 * @param content 元のマークダウンコンテンツ
 * @param tag タグ名（省略可）
 * @returns Frontmatter 付きコンテンツ
 */
export function addFrontmatter(content: string, tag?: string): string {
  if (!tag) {
    // タグがない場合はそのまま返す
    return content;
  }

  const frontmatter = `---
tags: [${tag}]
---

`;

  return frontmatter + content;
}

/**
 * コンテンツから Frontmatter のタグを抽出
 * @param content マークダウンコンテンツ
 * @returns タグ名（存在しない場合は undefined）
 */
export function parseFrontmatter(content: string): string | undefined {
  // Frontmatter のパターン: --- で囲まれた YAML 部分
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return undefined;
  }

  const yamlContent = match[1];

  // tags: [タグ名] の形式をパース
  const tagsRegex = /tags:\s*\[([^\]]+)\]/;
  const tagsMatch = yamlContent.match(tagsRegex);

  if (!tagsMatch) {
    return undefined;
  }

  // タグ名を取得（配列の最初の要素のみ）
  const tagName = tagsMatch[1].trim();
  return tagName;
}
