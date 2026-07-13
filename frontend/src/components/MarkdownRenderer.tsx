import React, { useMemo } from 'react';
import { cn, stripProcessLeakage } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'brief' | 'article';
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const renderInline = (value: string) => escapeHtml(value)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/__(.+?)__/g, '<strong>$1</strong>')
  .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<span class="inline-term">$1</span>');

const splitTableRow = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '')
  .split('|').map(cell => cell.trim());

const isTableDivider = (line: string) => {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
};

const isPipeRow = (line: string) => line.includes('|') && splitTableRow(line).length > 1;

const startsLooseTable = (lines: string[], index: number) => {
  if (!isPipeRow(lines[index] || '') || !isPipeRow(lines[index + 1] || '')) return false;
  return splitTableRow(lines[index]).length === splitTableRow(lines[index + 1]).length;
};

const isBlockStart = (lines: string[], index: number) => {
  const line = lines[index] || '';
  return /^#{1,6}\s+/.test(line) || /^\s*[-*+]\s+/.test(line)
    || /^\s*\d+[.)]\s+/.test(line) || /^>\s?/.test(line)
    || /^\s*(---+|___+|\*\*\*+)\s*$/.test(line) || /^```/.test(line)
    || startsLooseTable(lines, index);
};

export function renderStructuredContent(content: string): string {
  const lines = stripProcessLeakage(content).replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (/^```/.test(line)) {
      index += 1;
      const code: string[] = [];
      while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      const body = code.map(item => item.trim()).filter(Boolean).map(item => `<p>${renderInline(item)}</p>`).join('');
      if (body) blocks.push(`<aside class="structured-callout">${body}</aside>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 4);
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*(---+|___+|\*\*\*+)\s*$/.test(line)) {
      blocks.push('<hr />'); index += 1; continue;
    }

    if (startsLooseTable(lines, index)) {
      const headers = splitTableRow(line);
      index += isTableDivider(lines[index + 1] || '') ? 2 : 1;
      const rows: string[][] = [];
      while (index < lines.length && isPipeRow(lines[index]) && lines[index].trim()) {
        const row = splitTableRow(lines[index++]);
        if (!isTableDivider(row.join('|'))) rows.push(row);
      }
      const head = headers.map(cell => `<th scope="col">${renderInline(cell)}</th>`).join('');
      const body = rows.map(row => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('');
      blocks.push(`<div class="structured-table" role="region" aria-label="Data table" tabindex="0"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const items: Array<{ content: string; value?: number }> = [];
      const pattern = ordered ? /^\s*(\d+)[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (!match) break;
        items.push(ordered
          ? { value: Number(match[1]), content: match[2] }
          : { content: match[1] });
        index += 1;

        // Blank lines between numbered entries are valid loose-list spacing.
        // Keep the run intact so the browser does not restart every item at 1.
        let next = index;
        while (next < lines.length && !lines[next].trim()) next += 1;
        if (next > index && next < lines.length && pattern.test(lines[next])) index = next;
      }
      const tag = ordered ? 'ol' : 'ul';
      const start = ordered && items[0]?.value && items[0].value !== 1 ? ` start="${items[0].value}"` : '';
      const rendered = items.map(item => {
        const value = ordered && item.value ? ` value="${item.value}"` : '';
        return `<li${value}>${renderInline(item.content)}</li>`;
      }).join('');
      blocks.push(`<${tag}${start}>${rendered}</${tag}>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''));
      blocks.push(`<blockquote>${renderInline(quote.join(' '))}</blockquote>`);
      continue;
    }

    const paragraph: string[] = [line.trim()]; index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraph.push(lines[index++].trim());
    }
    blocks.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }
  return blocks.join('');
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className, variant = 'brief' }) => {
  const htmlContent = useMemo(() => renderStructuredContent(content || ''), [content]);
  return <div className={cn('structured-content', `structured-content--${variant}`, className)} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};
