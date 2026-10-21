/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/repo.test.js
 * ROL: Comprovacions de tot el repositori (sense navegador):
 *   1. Cada fitxer local que citen els HTML existeix; l'ordre dels scripts.
 *   2. Cap petició a internet: cap adreça externa a src/href, cap fetch,
 *      XMLHttpRequest, Worker ni import; cap script ni style dins l'HTML.
 *   3. Cap Math.random a js/ ni data/ (tot el reproduïble va amb llavor).
 *   4. Cada JS té la capçalera estàndard amb el seu camí i l'embolcall doble.
 *   5. Textos curts: cap text de js/ui/textos.js passa de 40 paraules.
 *   6. Llicència, atribució, _headers amb connect-src 'none', regles comunes.
 *   7. localStorage sempre dins try/catch i amb la clau derivada:v1:…
 *   8. Cap exemple de projectil; cap etiqueta per saltar la CI als workflows.
 * ÚS: node tests/repo.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { suite, ok, eq, finish } = require('./harness');

const ARREL = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ARREL, f), 'utf8');
const exists = f => fs.existsSync(path.join(ARREL, f));
function llista(dir, ext) {
    const out = [];
    if (!exists(dir)) return out;
    for (const e of fs.readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (!['.git', 'node_modules', '_uploads', 'src'].includes(e.name)) out.push(...llista(rel, ext));
        } else if (e.name.endsWith(ext)) out.push(rel);
    }
    return out;
}
const htmls = fs.readdirSync(ARREL).filter(f => f.endsWith('.html'));
const jss = [...llista('js', '.js'), ...llista('data', '.js')];
const sense = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1'); // sense comentaris

suite('1. Fitxers citats i ordre dels scripts');
{
    const falten = [];
    for (const h of htmls) {
        for (const m of read(h).matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
            const rel = m[1].split('?')[0];
            if (/^(https?:|mailto:|\/\/)/.test(rel)) continue;
            if (!exists(rel)) falten.push(`${h} → ${rel}`);
        }
    }
    ok(`tots els fitxers que citen els ${htmls.length} HTML existeixen`, !falten.length, falten.join(', '));
    const scripts = [...read('index.html').matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    eq(
        'index.html: dades → motors → textos → escena → gràfica → velocímetre → app',
        scripts.join(' '),
        'data/escenaris.js js/motor/atzar.js js/motor/perfil.js js/motor/tvm.js js/motor/terreny.js js/motor/entrada.js js/motor/laboratori.js js/motor/exercicis.js js/ui/textos.js js/ui/escena.js js/ui/grafica.js js/ui/velocimetre.js js/ui/app.js'
    );
    ok('tots els scripts de js/ i data/ són a index.html (cap de penjat)', jss.every(f => scripts.includes(f.split(path.sep).join('/'))), jss.filter(f => !scripts.includes(f.split(path.sep).join('/'))).join(', '));
}

suite('2. Cap petició a internet (i funciona amb doble clic)');
{
    const externes = [];
    for (const h of htmls)
        for (const m of read(h).matchAll(/<(?:script|link|img|iframe|source)\b[^>]*\b(?:src|href)="((?:https?:)?\/\/[^"]+)"/g))
            externes.push(`${h} → ${m[1]}`);
    ok('cap script, estil ni imatge de fora', !externes.length, externes.join(', '));
    const moduls = htmls.filter(h => /type="module"/.test(read(h)));
    ok('cap <script type="module"> (Chrome no els obre amb file://)', !moduls.length, moduls.join(', '));
    const prohibits = [];
    for (const f of jss) {
        const s = sense(read(f));
        for (const [nom, re] of [
            ['fetch(', /\bfetch\s*\(/],
            ['XMLHttpRequest', /XMLHttpRequest/],
            ['Worker', /new\s+Worker\b/],
            ['import', /^\s*import\s/m],
            ['adreça http', /['"`]https?:\/\//],
            ['eval', /\beval\s*\(|new\s+Function\s*\(/],
            ['setAttribute style', /setAttribute\(\s*['"]style['"]/],
        ])
            if (re.test(s)) prohibits.push(`${f}: ${nom}`);
    }
    ok('cap fetch, XMLHttpRequest, Worker, import, adreça http, eval ni style per atribut a js/ ni data/', !prohibits.length, prohibits.join(', '));
    const inline = htmls.filter(h => /<script>(?!\s*<\/script>)|<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(read(h)) || /\sstyle="/.test(read(h)) || /<style\b/.test(read(h)));
    ok('cap script ni estil dins dels HTML (la CSP de _headers no els deixaria)', !inline.length, inline.join(', '));
    const manejadors = htmls.filter(h => /\son[a-z]+="/.test(read(h)));
    ok('cap manejador d’esdeveniments en línia (onclick…)', !manejadors.length, manejadors.join(', '));
}

suite('3. Atzar amb llavor');
{
    const amb = jss.filter(f => /Math\.random/.test(sense(read(f))));
    ok('cap Math.random a js/ ni data/', !amb.length, amb.join(', '));
}

suite('4. Capçaleres i embolcall dels fitxers');
{
    const mal = jss.filter(f => !read(f).includes(`FITXER: ${f.split(path.sep).join('/')}`));
    ok(`els ${jss.length} JS tenen la capçalera amb el seu camí`, !mal.length, mal.join(', '));
    const motors = jss.filter(f => f.split(path.sep).join('/').startsWith('js/motor/') && !f.endsWith('atzar.js'));
    const sensePar = motors.filter(f => !/module\.exports/.test(read(f)) || !/arrel\.DERIVADA/.test(read(f)));
    ok(`els ${motors.length} motors exposen window.DERIVADA.<nom> i module.exports (embolcall doble)`, !sensePar.length, sensePar.join(', '));
    const uis = jss.filter(f => f.split(path.sep).join('/').startsWith('js/ui/'));
    const senseNom = uis.filter(f => !/(arrel\.DERIVADA|\bD)\.\w+\s*=\s*[{\w]/.test(read(f)));
    ok(`els ${uis.length} fitxers de js/ui/ exposen un únic espai de noms DERIVADA.<nom>`, !senseNom.length, senseNom.join(', '));
}

suite('5. Textos curts (≤ 40 paraules)');
{
    const T = require('../js/ui/textos.js');
    const llargs = [];
    let n = 0;
    const recorre = (o, cami) => {
        for (const [k, v] of Object.entries(o)) {
            const c = cami ? `${cami}.${k}` : k;
            let txt = v;
            if (typeof v === 'function') txt = v('X', 'X', 'X', 'X', 'X');
            if (Array.isArray(txt)) {
                txt.forEach((e, i) => typeof e === 'string' && (n++, e.split(/\s+/).filter(Boolean).length > 40 && llargs.push(`${c}[${i}]`)));
                txt = txt.join(' ');
            }
            if (typeof txt === 'string') {
                n++;
                const m = txt.split(/\s+/).filter(Boolean).length;
                if (m > 40) llargs.push(`${c} (${m})`);
            } else if (txt && typeof txt === 'object') recorre(txt, c);
        }
    };
    recorre(T, '');
    ok(`cap dels ${n} textos de js/ui/textos.js passa de 40 paraules`, !llargs.length, llargs.join(', '));
    const E = require('../js/motor/exercicis.js');
    ok('cada etapa guiada té text a textos.js', E.ETAPES.every(e => T.ETAPES[e.id] && T.ETAPES[e.id].instruccio));
    const Ent = require('../js/motor/entrada.js');
    void Ent;
    for (const clau of ['distancia', 'invertit', 'observador', 'multiplicat', 'altre', 'noNumero'])
        ok(`hi ha missatge d’error de la TVM «${clau}»`, typeof T.TVM_ERROR[clau] === 'string');
    for (const clau of ['M3', 'M5', 'altre', 'noNumero'])
        ok(`hi ha missatge d’error del límit «${clau}»`, typeof T.ESTIMA_ERROR[clau] === 'string');
    ok('els missatges d’error no donen cap xifra (mai la resposta)', [...Object.values(T.TVM_ERROR), ...Object.values(T.ESTIMA_ERROR), ...Object.values(T.P1_ERROR)].every(s => !/\d/.test(s)));
}

suite('6. Llicència, atribució i capçaleres de Cloudflare');
{
    ok('LICENSE i LLICENCIA.md', exists('LICENSE') && exists('LLICENCIA.md'));
    const bloc =
        "<!-- atribucio-centre:inici -->\n\n---\n\nMaterial desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.\nContingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).\n\n<!-- atribucio-centre:final -->";
    ok('el README acaba amb el bloc d’atribució', read('README.md').trimEnd().endsWith(bloc));
    ok("_headers: la CSP diu connect-src 'none'", /connect-src 'none'/.test(read('_headers')));
    ok('CLAUDE.md porta el bloc de regles comunes', /<!-- regles-comunes:inici -->[\s\S]+<!-- regles-comunes:fi -->/.test(read('CLAUDE.md')));
    ok('hi ha .gitignore, .prettierrc.json, .prettierignore, favicon.svg i _uploads/.gitkeep', ['.gitignore', '.prettierrc.json', '.prettierignore', 'favicon.svg', '_uploads/.gitkeep'].every(exists));
    ok('docs/SPEC.md, docs/STATE.md i docs/SESSION-REPORT.md', ['docs/SPEC.md', 'docs/STATE.md', 'docs/SESSION-REPORT.md'].every(exists));
}

suite('7. localStorage: sempre dins try/catch, claus derivada:v1:…');
{
    const brut = [];
    for (const f of jss) {
        const linies = read(f).split('\n');
        linies.forEach((l, i) => {
            if (/\blocalStorage\b/.test(sense(l)) && !/^\s*(\/\/|\*)/.test(l)) {
                const abans = linies.slice(Math.max(0, i - 4), i + 1).join('\n');
                if (!/\btry\s*\{/.test(abans)) brut.push(`${f}:${i + 1}`);
            }
        });
    }
    ok('cada accés a localStorage és dins un try { … } catch', !brut.length, brut.join(', '));
    const claus = [...read('js/ui/app.js').matchAll(/['"](derivada:[^'"]+)['"]/g)].map(m => m[1]);
    ok('les claus de localStorage són derivada:v1:<què>', claus.length > 0 && claus.every(c => /^derivada:v1:\w+$/.test(c)), claus.join(', '));
}

suite('8. Cap projectil; cap etiqueta per saltar la CI');
{
    const fonts = [...jss, ...htmls, 'css/derivada.css'];
    const pro = fonts.filter(f => /projectil|parab[oò]l|projectile/i.test(read(f)));
    ok('cap exemple de projectil (ni parabòlic) al codi, dades ni HTML', !pro.length, pro.join(', '));
    const wf = [];
    if (exists('.github/workflows')) for (const f of fs.readdirSync(path.join(ARREL, '.github/workflows'))) wf.push(`.github/workflows/${f}`);
    const mal = wf.filter(f => /\[skip ci\]|\[ci skip\]|\[cf-pages-skip\]|\[skip cf\]/i.test(read(f)));
    ok(`cap etiqueta per saltar la CI als ${wf.length} workflows (si n’hi ha)`, !mal.length, mal.join(', '));
}

finish('REPOSITORI');
