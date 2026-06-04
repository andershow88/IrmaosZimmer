import fs from "fs"; import path from "path";
const ROUTES = "clientes|veiculos|ordens-servico|orcamentos|servicos|estoque|agenda|checklists|pagamentos|fornecedores|relatorios|assistente|configuracoes|financeiro";
const dirs = ["src/app/(app)","src/app/entrar","src/components","src/server"];
const files = [];
function walk(d){ if(!fs.existsSync(d)) return; for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(/\.(ts|tsx)$/.test(e.name)) files.push(p);} }
for(const d of dirs) walk(d);
for(const extra of ["src/lib/auth.ts","src/lib/permissions-server.ts"]) if(fs.existsSync(extra)) files.push(extra);
const rxRoute = new RegExp("([\"'`])\\/(" + ROUTES + ")(?=[\"'`/?#])","g");
let n=0;
for(const f of [...new Set(files)]){ let s=fs.readFileSync(f,"utf8"); const o=s;
  s=s.replace(rxRoute,(m,q,r)=> q+"/painel/"+r);
  s=s.replace(/href=(["'])\/\1/g,(m,q)=>"href="+q+"/painel"+q);
  s=s.replace(/href:\s*(["'])\/\1/g,(m,q)=>"href: "+q+"/painel"+q);
  s=s.replace(/redirect\((["'])\/\1\)/g,(m,q)=>"redirect("+q+"/painel"+q+")");
  s=s.replace(/revalidatePath\((["'])\/\1\)/g,(m,q)=>"revalidatePath("+q+"/painel"+q+")");
  s=s.replace(/\.(push|replace)\((["'])\/\2\)/g,(m,fn,q)=>"."+fn+"("+q+"/painel"+q+")");
  if(s!==o){ fs.writeFileSync(f,s); n++; console.log("patched", f);} }
console.log("total patched:", n);
