// Remplacements typographiques globaux (UTF-8 sûr). Usage : node scripts/apply-typography.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'src', 'components');
const rules = [
  [/font-\['Cinzel',serif\]/g, 'font-display'],
  [/font-\['Playfair_Display',serif\]/g, 'font-accent'],
  [/font-\['Plus_Jakarta_Sans',sans-serif\]/g, 'font-sans'],
  [/font-\['Syne',sans-serif\]/g, 'font-brand'],
  // Titres de section : tailles fixes -> taille fluide clamp()
  [/text-3xl sm:text-4xl lg:text-5xl/g, 'h-section'],
  [/text-2xl sm:text-4xl md:text-5xl/g, 'h-section'],
  [/text-3xl sm:text-5xl/g, 'h-section'],
  [/text-3xl sm:text-4xl/g, 'h-section'],
  // Corps de texte trop petit sur téléphone
  [/text-xs text-\[#F5F2EB\]\/70 leading-relaxed/g, 'text-sm text-[#F5F2EB]/75 leading-relaxed'],
  [/italic text-xs sm:text-base/g, 'italic text-[15px] sm:text-base'],
  [/italic text-sm sm:text-base/g, 'italic text-[15px] sm:text-base']
];

const report = [];
for (const f of readdirSync(dir).filter((n) => n.endsWith('.tsx'))) {
  const p = join(dir, f);
  let src = readFileSync(p, 'utf8');
  let n = 0;
  for (const [re, rep] of rules) {
    src = src.replace(re, () => {
      n++;
      return rep;
    });
  }
  if (n) writeFileSync(p, src, 'utf8');
  report.push({ fichier: f, remplacements: n });
}
console.table(report);
