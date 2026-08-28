import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');
const cssDir = path.join(root, 'public', 'css');
const html = await readFile(htmlPath, 'utf8');
const styles = { base: [], components: [], responsive: [] };

const styleTagPattern = /\s*<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi;
const htmlWithoutStyleTags = html.replace(styleTagPattern, (tag, css) => {
	const id = tag.match(/\bid=["']([^"']+)["']/i)?.[1] || '';
	const group = /^(?:mobile-|responsive-|hero-)/i.test(id)
		? 'responsive'
		: /^(?:copy-)/i.test(id) || !id
			? 'components'
			: 'base';
	styles[group].push(css.trim());
	return '';
});

const inlineProperties = new Map();
let inlineIndex = 0;
const htmlWithoutInlineStyles = htmlWithoutStyleTags.replace(/<([a-z][\s\S]*?)>/gi, (tag, attributes) => {
	const match = attributes.match(/\sstyle\s*=\s*(["'])(.*?)\1/i);
	if (!match) return tag;

	const value = match[2].trim();
	let className = inlineProperties.get(value);
	if (!className) {
		className = `extracted-style-${++inlineIndex}`;
		inlineProperties.set(value, className);
	}

	const withoutStyle = attributes.replace(match[0], '');
	const classMatch = withoutStyle.match(/\sclass\s*=\s*(["'])(.*?)\1/i);
	const updatedAttributes = classMatch
		? withoutStyle.replace(classMatch[0], ` class=${classMatch[1]}${classMatch[2]} ${className}${classMatch[1]}`)
		: `${withoutStyle} class="${className}"`;
	return `<${updatedAttributes}>`;
});

await mkdir(cssDir, { recursive: true });
for (const [group, blocks] of Object.entries(styles)) {
	await writeFile(path.join(cssDir, `embedded-${group}.css`), `${blocks.filter(Boolean).join('\n\n')}\n`);
}

const inlineCss = [...inlineProperties.entries()]
	.map(([value, className]) => `.${className}{${value}}`)
	.join('\n');
await writeFile(path.join(cssDir, 'embedded-inline-properties.css'), `${inlineCss}\n`);

const links = [
	'  <link rel="stylesheet" href="/css/embedded-base.css">',
	'  <link rel="stylesheet" href="/css/embedded-components.css">',
	'  <link rel="stylesheet" href="/css/embedded-responsive.css">',
	'  <link rel="stylesheet" href="/css/embedded-inline-properties.css">',
].join('\n');
const cleanHtml = htmlWithoutInlineStyles.replace('</head>', `${links}\n</head>`);
await writeFile(htmlPath, cleanHtml);
console.log(`CSS extraído: ${styles.base.length + styles.components.length + styles.responsive.length} blocos, ${inlineProperties.size} classes inline.`);