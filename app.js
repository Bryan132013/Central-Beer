/*
  Central Beer - versão com Supabase
  1) Crie um projeto em https://supabase.com/
  2) Execute supabase.sql no SQL Editor.
  3) Cole URL e anon key abaixo.
*/
const SUPABASE_URL = "COLE_SUA_SUPABASE_URL_AQUI";
const SUPABASE_ANON_KEY = "COLE_SUA_SUPABASE_ANON_KEY_AQUI";
const ADMIN_EMAIL = "bryanyttcontato@gmail.com";

const configured = !SUPABASE_URL.includes("COLE_SUA") && !SUPABASE_ANON_KEY.includes("COLE_SUA");
const sb = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);
const money = (v) => v ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "";

function showList(target, items, type){
  const el=$(target);
  if(!items.length){
    el.innerHTML=`<div class="empty">${type==="promo"?"Sem promoções cadastradas":"Nenhum evento cadastrado"}<br><span class="muted">Adicione pelo painel do dono.</span></div>`;
    return;
  }
  el.innerHTML=items.map(x=> type==="promo" ? `
    <article class="card">
      <h3>🔥 ${escapeHtml(x.nome)}</h3>
      ${x.preco!=null?`<div class="price">${money(x.preco)}</div>`:""}
      <p>${escapeHtml(x.descricao||"")}</p>
    </article>` : `
    <article class="card">
      <h3>🎉 ${escapeHtml(x.nome)}</h3>
      <div class="date">📅 ${escapeHtml(x.data_hora||"")}</div>
      <p>${escapeHtml(x.descricao||"")}</p>
    </article>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

async function loadPublic(){
  if(!sb){
    showList("promocoesList",[],"promo"); showList("eventosList",[],"event");
    return;
  }
  const [p,e]=await Promise.all([
    sb.from("promocoes").select("*").order("created_at",{ascending:false}),
    sb.from("eventos").select("*").order("created_at",{ascending:false})
  ]);
  if(p.error||e.error){console.error(p.error||e.error);return;}
  showList("promocoesList",p.data||[],"promo");
  showList("eventosList",e.data||[],"event");
}

function modal(html){
  const old=document.querySelector(".modal"); if(old) old.remove();
  const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="modal-box">${html}</div>`;
  document.body.appendChild(m); return m;
}

$("adminBtn").onclick=async()=>{
  if(!sb){modal(`<button class="close">×</button><h2 class="admin-title">⚙️ Painel do dono</h2><div class="notice">O site está pronto, mas ainda falta conectar o Supabase. Abra o arquivo <b>app.js</b> e coloque a URL e a anon key do seu projeto.</div>`);bindClose();return;}
  const {data:{session}}=await sb.auth.getSession();
  if(!session){
    const m=modal(`<button class="close">×</button><div class="login"><h2 class="admin-title">⚙️ Acesso do dono</h2><p class="muted">Entre com o e-mail do proprietário para acessar promoções, eventos e dívidas.</p><input id="loginEmail" class="field" type="email" value="${ADMIN_EMAIL}" readonly><button id="sendLogin" class="gold-btn">Enviar link de acesso</button><p id="loginMsg" class="muted"></p></div>`);
    bindClose();
    $("sendLogin").onclick=async()=>{
      const r=await sb.auth.signInWithOtp({email:ADMIN_EMAIL,options:{emailRedirectTo:location.href}});
      $("loginMsg").textContent=r.error?"Erro: "+r.error.message:"Link enviado! Verifique o e-mail do dono.";
    };
    return;
  }
  if(session.user.email.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){
    await sb.auth.signOut(); alert("Este acesso não é autorizado."); return;
  }
  openAdmin();
};

function bindClose(){document.querySelector(".close")?.addEventListener("click",()=>document.querySelector(".modal")?.remove())}

async function openAdmin(){
  const m=modal(`
    <button class="close">×</button>
    <h2 class="admin-title">⚙️ Painel do dono</h2>
    <div class="notice">Logado como <b>${ADMIN_EMAIL}</b>. Somente este e-mail pode administrar e ver o controle de dívidas.</div>

    <div class="form-section">
      <h3>🔥 Adicionar promoção</h3>
      <input id="pNome" class="field" placeholder="Nome da promoção">
      <div class="row"><input id="pPreco" class="field" type="number" step="0.01" placeholder="Preço (ex.: 9,90)"></div>
      <textarea id="pDesc" class="field textarea" placeholder="Descrição"></textarea>
      <button id="addPromo" class="gold-btn">Adicionar promoção</button>
      <div id="pList" class="admin-list"></div>
    </div>

    <div class="form-section">
      <h3>🎉 Adicionar evento</h3>
      <input id="eNome" class="field" placeholder="Nome do evento">
      <input id="eData" class="field" placeholder="Data e horário">
      <textarea id="eDesc" class="field textarea" placeholder="Descrição do evento"></textarea>
      <button id="addEvent" class="gold-btn">Adicionar evento</button>
      <div id="eList" class="admin-list"></div>
    </div>

    <div class="form-section">
      <h3>💰 Controle de dívidas</h3>
      <p class="muted">Privado: esta área só aparece para o e-mail do dono.</p>
      <div class="row"><input id="dNome" class="field" placeholder="Nome da pessoa"><input id="dValor" class="field" type="number" step="0.01" placeholder="Valor (ex.: 35,00)"></div>
      <button id="addDebt" class="gold-btn">Adicionar dívida</button>
      <div id="dList" class="admin-list"></div>
    </div>

    <div class="form-section"><button id="logout" class="dark-btn">Sair</button></div>
  `);
  bindClose();
  $("logout").onclick=async()=>{await sb.auth.signOut();m.remove();};
  $("addPromo").onclick=async()=>{
    const nome=$("pNome").value.trim(), preco=parseFloat($("pPreco").value), descricao=$("pDesc").value.trim();
    if(!nome)return alert("Digite o nome da promoção.");
    const r=await sb.from("promocoes").insert({nome,preco:Number.isFinite(preco)?preco:null,descricao});
    if(r.error)return alert(r.error.message); $("pNome").value=$("pPreco").value=$("pDesc").value=""; await refreshAdmin(); await loadPublic();
  };
  $("addEvent").onclick=async()=>{
    const nome=$("eNome").value.trim(), data_hora=$("eData").value.trim(), descricao=$("eDesc").value.trim();
    if(!nome)return alert("Digite o nome do evento.");
    const r=await sb.from("eventos").insert({nome,data_hora,descricao});
    if(r.error)return alert(r.error.message); $("eNome").value=$("eData").value=$("eDesc").value=""; await refreshAdmin(); await loadPublic();
  };
  $("addDebt").onclick=async()=>{
    const nome=$("dNome").value.trim(), valor=parseFloat($("dValor").value);
    if(!nome||!Number.isFinite(valor))return alert("Preencha nome e valor.");
    const r=await sb.from("dividas").insert({nome,valor,pago:false});
    if(r.error)return alert(r.error.message); $("dNome").value=$("dValor").value=""; await refreshAdmin();
  };
  await refreshAdmin();
}

async function refreshAdmin(){
  const [p,e,d]=await Promise.all([
    sb.from("promocoes").select("*").order("created_at",{ascending:false}),
    sb.from("eventos").select("*").order("created_at",{ascending:false}),
    sb.from("dividas").select("*").order("created_at",{ascending:false})
  ]);
  $("pList").innerHTML=(p.data||[]).map(x=>`<div class="admin-item"><span><b>${escapeHtml(x.nome)}</b> ${x.preco!=null?money(x.preco):""}</span><button class="danger" onclick="deleteRow('promocoes','${x.id}')">Excluir</button></div>`).join("")||"<span class='muted'>Nenhuma promoção.</span>";
  $("eList").innerHTML=(e.data||[]).map(x=>`<div class="admin-item"><span><b>${escapeHtml(x.nome)}</b> — ${escapeHtml(x.data_hora||"")}</span><button class="danger" onclick="deleteRow('eventos','${x.id}')">Excluir</button></div>`).join("")||"<span class='muted'>Nenhum evento.</span>";
  $("dList").innerHTML=(d.data||[]).map(x=>`<div class="admin-item debt"><span class="${x.pago?"paid":""}"><b>${escapeHtml(x.nome)}</b> — ${money(x.valor)} ${x.pago?"(pago)":""}</span><span><button class="dark-btn" onclick="toggleDebt('${x.id}',${!x.pago})">${x.pago?"Desmarcar":"Marcar pago"}</button> <button class="danger" onclick="deleteRow('dividas','${x.id}')">Excluir</button></span></div>`).join("")||"<span class='muted'>Nenhuma dívida cadastrada.</span>";
}
window.deleteRow=async(table,id)=>{if(confirm("Excluir este item?")){const r=await sb.from(table).delete().eq("id",id);if(r.error)alert(r.error.message);else{await refreshAdmin();await loadPublic();}}};
window.toggleDebt=async(id,pago)=>{const r=await sb.from("dividas").update({pago}).eq("id",id);if(r.error)alert(r.error.message);else await refreshAdmin();};

loadPublic();
