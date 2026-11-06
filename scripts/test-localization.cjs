/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTs(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = { exports: {} };
  vm.runInNewContext(code, context, { filename: file });
  return context.exports;
}

const { t } = loadTs('src/i18n/index.ts');
const { services, articles, faqs } = loadTs('src/data/content.ts');
const languages = ['हिन्दी', 'తెలుగు'];
const content = [
  ...services.flatMap(({ title, description, detail, topics, prompts }) => [title, description, detail, ...topics, ...prompts]),
  ...articles.flatMap(({ title, tag, time, text }) => [title, tag, time, ...text]),
  ...faqs.flat(),
];
for (const language of languages) {
  for (const phrase of content) assert.notEqual(t(phrase, language), phrase, `${language} is missing content translation: ${phrase}`);
}

const root = path.join(__dirname, '..', 'src');
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(file)) files.push(file);
  }
}
walk(root);
const uiKeys = new Set();
for (const file of files) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, kind);
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments.length) {
      const first = node.arguments[0];
      if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) uiKeys.add(first.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
for (const language of languages) {
  for (const phrase of uiKeys) {
    if (phrase === 'Gemini Live') continue; // Provider/model name stays branded.
    assert.notEqual(t(phrase, language), phrase, `${language} is missing UI translation: ${phrase}`);
  }
}
console.log(`Localization verified: ${uiKeys.size} UI labels and ${content.length} content strings in Hindi and Telugu.`);
