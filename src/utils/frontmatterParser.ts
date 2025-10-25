/**
 * Frontmatter ユーティリティ
 * マークダウンファイルに YAML Frontmatter を追加・パースする
 */

/**
 * コンテンツにタグ付き Frontmatter を追加
 * @param content 元のマークダウンコンテンツ
 * @param tags タグオブジェクト { primary?: string, secondary?: string }
 * @returns Frontmatter 付きコンテンツ
 */
export function addFrontmatter(
  content: string,
  tags?: { primary?: string; secondary?: string }
): string {
  if (!tags || (!tags.primary && !tags.secondary)) {
    // タグがない場合はそのまま返す
    return content;
  }

  // タグ配列を構築（存在するタグのみ）
  const tagArray: string[] = [];
  if (tags.primary) tagArray.push(tags.primary);
  if (tags.secondary) tagArray.push(tags.secondary);

  const frontmatter = `---
tags: [${tagArray.join(', ')}]
---

`;

  return frontmatter + content;
}

/**
 * コンテンツから Frontmatter のタグを抽出
 * @param content マークダウンコンテンツ
 * @returns タグオブジェクト { primary?: string, secondary?: string } または undefined
 */
export function parseFrontmatter(
  content: string
): { primary?: string; secondary?: string } | undefined {
  // Frontmatter のパターン: --- で囲まれた YAML 部分
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return undefined;
  }

  const yamlContent = match[1];

  // tags: [タグ名1, タグ名2] の形式をパース
  const tagsRegex = /tags:\s*\[([^\]]+)\]/;
  const tagsMatch = yamlContent.match(tagsRegex);

  if (!tagsMatch) {
    return undefined;
  }

  // タグ名を取得（カンマ区切りの配列）
  const tagString = tagsMatch[1];
  const tagArray = tagString.split(',').map(tag => tag.trim());

  // 配列から primary と secondary を抽出
  return {
    primary: tagArray[0] || undefined,
    secondary: tagArray[1] || undefined,
  };
}
