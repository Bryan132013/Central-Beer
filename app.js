/*
  Central Beer - versão com Supabase
  Painel do dono + login por e-mail e senha
*/

const SUPABASE_URL = "https://eihnkocisefxjryavwxv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QA-SP3Iv0X-v51kxqLJJdg_x1Ak5w0s";
const ADMIN_EMAIL = "bryanyttcontato@gmail.com";

const SITE_URL = "https://bryan132013.github.io/Central-Beer/";

const configured =
  !SUPABASE_URL.includes("COLE_SUA") &&
  !SUPABASE_ANON_KEY.includes("COLE_SUA");

const sb = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = (id) => document.getElementById(id);

const money = (v) =>
  v ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "";

function showList(target, items, type) {
  const el = $(target);

  if (!items.length) {
    el.innerHTML = `
      <div class="empty">
        ${
          type === "promo"
            ? "Sem promoções cadastradas"
            : "Nenhum evento cadastrado"
        }
        <br>
        <span class="muted">Adicione pelo painel do dono.</span>
      </div>`;
    return;
  }

  el.innerHTML = items
    .map((x) =>
      type === "promo"
        ? `
      <article class="card">
        <h3>🔥 ${escapeHtml(x.nome)}</h3>
        ${
          x.preco != null
            ? `<div class="price">${money(x.preco)}</div>`
            : ""
        }
        <p>${escapeHtml(x.descricao || "")}</p>
      </article>`
        : `
      <article class="card">
        <h3>🎉 ${escapeHtml(x.nome)}</h3>
        <div class="date">📅 ${escapeHtml(x.data_hora || "")}</div>
        <p>${escapeHtml(x.descricao || "")}</p>
      </article>`
    )
    .join("");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

async function loadPublic() {
  if (!sb) {
    showList("promocoesList", [], "promo");
    showList("eventosList", [], "event");
    return;
  }

  const [p, e] = await Promise.all([
    sb
      .from("promocoes")
      .select("*")
      .order("created_at", { ascending: false }),

    sb
      .from("eventos")
      .select("*")
      .order("created_at", { ascending: false })
  ]);

  if (p.error || e.error) {
    console.error(p.error || e.error);
    return;
  }

  showList("promocoesList", p.data || [], "promo");
  showList("eventosList", e.data || [], "event");
}

function modal(html) {
  const old = document.querySelector(".modal");

  if (old) old.remove();

  const m = document.createElement("div");

  m.className = "modal";

  m.innerHTML = `
    <div class="modal-box">
      ${html}
    </div>
  `;

  document.body.appendChild(m);

  return m;
}

function bindClose() {
  document
    .querySelector(".close")
    ?.addEventListener("click", () => {
      document.querySelector(".modal")?.remove();
    });
}

/*
  Verifica se existe uma sessão do dono.
*/
async function getOwnerSession() {
  if (!sb) return null;

  const {
    data: { session },
    error
  } = await sb.auth.getSession();

  if (error) {
    console.error(error);
    return null;
  }

  if (!session) return null;

  const email = (session.user.email || "").toLowerCase();

  if (email !== ADMIN_EMAIL.toLowerCase()) {
    await sb.auth.signOut();
    return null;
  }

  return session;
}

/*
  Botão do painel do dono.
*/
$("adminBtn").onclick = async () => {

  if (!sb) {
    modal(`
      <button class="close">×</button>

      <h2 class="admin-title">
        ⚙️ Painel do dono
      </h2>

      <div class="notice">
        O site ainda não está conectado ao Supabase.
      </div>
    `);

    bindClose();
    return;
  }

  /*
    Primeiro verifica se o dono já está conectado.
  */
  const session = await getOwnerSession();

  if (session) {
    openAdmin();
    return;
  }

  /*
    Login com e-mail e senha.
  */
  const m = modal(`
    <button class="close">×</button>

    <div class="login">

      <h2 class="admin-title">
        ⚙️ Acesso do dono
      </h2>

      <p class="muted">
        Entre com o e-mail e a senha do proprietário.
      </p>

      <input
        id="loginEmail"
        class="field"
        type="email"
        value="${ADMIN_EMAIL}"
        readonly
      >

      <input
        id="loginPassword"
        class="field"
        type="password"
        placeholder="Digite sua senha"
        autocomplete="current-password"
      >

      <button id="loginButton" class="gold-btn">
        Entrar
      </button>

      <p id="loginMsg" class="muted"></p>

    </div>
  `);

  bindClose();

  $("loginButton").onclick = async () => {

    const button = $("loginButton");
    const message = $("loginMsg");
    const password = $("loginPassword").value;

    if (!password) {
      message.textContent = "Digite sua senha.";
      return;
    }

    button.disabled = true;
    button.textContent = "Entrando...";
    message.textContent = "";

    const r = await sb.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: password
    });

    if (r.error) {

      message.textContent =
        "Senha ou login incorreto.";

      button.disabled = false;
      button.textContent = "Entrar";

      console.error(r.error);

      return;
    }

    /*
      Confirma que a conta logada
      realmente é a conta do dono.
    */
    const session = await getOwnerSession();

    if (!session) {

      message.textContent =
        "Acesso negado. Esta conta não é a conta do dono.";

      await sb.auth.signOut();

      button.disabled = false;
      button.textContent = "Entrar";

      return;
    }

    m.remove();

    openAdmin();
  };

  /*
    Permite apertar Enter no campo de senha.
  */
  $("loginPassword").addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
      $("loginButton").click();
    }

  });
};

/*
  Abre o painel administrativo.
*/
async function openAdmin() {

  const session = await getOwnerSession();

  if (!session) {
    alert("Você não está conectado como dono.");
    return;
  }

  const m = modal(`

    <button class="close">×</button>

    <h2 class="admin-title">
      ⚙️ Painel do dono
    </h2>

    <div class="notice">
      Logado como
      <b>${ADMIN_EMAIL}</b>.

      <br>

      Somente este e-mail pode administrar
      e ver o controle de dívidas.
    </div>

    <div class="form-section">

      <h3>🔥 Adicionar promoção</h3>

      <input
        id="pNome"
        class="field"
        placeholder="Nome da promoção"
      >

      <div class="row">

        <input
          id="pPreco"
          class="field"
          type="number"
          step="0.01"
          placeholder="Preço (ex.: 9,90)"
        >

      </div>

      <textarea
        id="pDesc"
        class="field textarea"
        placeholder="Descrição"
      ></textarea>

      <button
        id="addPromo"
        class="gold-btn"
      >
        Adicionar promoção
      </button>

      <div
        id="pList"
        class="admin-list"
      ></div>

    </div>

    <div class="form-section">

      <h3>🎉 Adicionar evento</h3>

      <input
        id="eNome"
        class="field"
        placeholder="Nome do evento"
      >

      <input
        id="eData"
        class="field"
        placeholder="Data e horário"
      >

      <textarea
        id="eDesc"
        class="field textarea"
        placeholder="Descrição do evento"
      ></textarea>

      <button
        id="addEvent"
        class="gold-btn"
      >
        Adicionar evento
      </button>

      <div
        id="eList"
        class="admin-list"
      ></div>

    </div>

    <div class="form-section">

      <h3>💰 Controle de dívidas</h3>

      <p class="muted">
        Privado: esta área só aparece para
        o e-mail do dono.
      </p>

      <div class="row">

        <input
          id="dNome"
          class="field"
          placeholder="Nome da pessoa"
        >

        <input
          id="dValor"
          class="field"
          type="number"
          step="0.01"
          placeholder="Valor (ex.: 35,00)"
        >

      </div>

      <button
        id="addDebt"
        class="gold-btn"
      >
        Adicionar dívida
      </button>

      <div
        id="dList"
        class="admin-list"
      ></div>

    </div>

    <div class="form-section">

      <button
        id="logout"
        class="dark-btn"
      >
        Sair
      </button>

    </div>

  `);

  bindClose();

  /*
    Sair da conta.
  */
  $("logout").onclick = async () => {

    await sb.auth.signOut();

    m.remove();
  };

  /*
    Adicionar promoção.
  */
  $("addPromo").onclick = async () => {

    const nome = $("pNome").value.trim();

    const preco = parseFloat($("pPreco").value);

    const descricao = $("pDesc").value.trim();

    if (!nome) {
      alert("Digite o nome da promoção.");
      return;
    }

    const r = await sb
      .from("promocoes")
      .insert({
        nome,
        preco:
          Number.isFinite(preco)
            ? preco
            : null,
        descricao
      });

    if (r.error) {
      alert(r.error.message);
      return;
    }

    $("pNome").value = "";
    $("pPreco").value = "";
    $("pDesc").value = "";

    await refreshAdmin();
    await loadPublic();
  };

  /*
    Adicionar evento.
  */
  $("addEvent").onclick = async () => {

    const nome = $("eNome").value.trim();

    const data_hora = $("eData").value.trim();

    const descricao = $("eDesc").value.trim();

    if (!nome) {
      alert("Digite o nome do evento.");
      return;
    }

    const r = await sb
      .from("eventos")
      .insert({
        nome,
        data_hora,
        descricao
      });

    if (r.error) {
      alert(r.error.message);
      return;
    }

    $("eNome").value = "";
    $("eData").value = "";
    $("eDesc").value = "";

    await refreshAdmin();
    await loadPublic();
  };

  /*
    Adicionar dívida.
  */
  $("addDebt").onclick = async () => {

    const nome = $("dNome").value.trim();

    const valor = parseFloat($("dValor").value);

    if (
      !nome ||
      !Number.isFinite(valor)
    ) {
      alert("Preencha nome e valor.");
      return;
    }

    const r = await sb
      .from("dividas")
      .insert({
        nome,
        valor,
        pago: false
      });

    if (r.error) {
      alert(r.error.message);
      return;
    }

    $("dNome").value = "";
    $("dValor").value = "";

    await refreshAdmin();
  };

  await refreshAdmin();
}

/*
  Atualiza o painel administrativo.
*/
async function refreshAdmin() {

  const session = await getOwnerSession();

  if (!session) return;

  const [p, e, d] = await Promise.all([

    sb
      .from("promocoes")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      ),

    sb
      .from("eventos")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      ),

    sb
      .from("dividas")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      )

  ]);

  /*
    Promoções.
  */
  $("pList").innerHTML =
    (p.data || [])
      .map(
        x => `
          <div class="admin-item">

            <span>

              <b>
                ${escapeHtml(x.nome)}
              </b>

              ${
                x.preco != null
                  ? money(x.preco)
                  : ""
              }

            </span>

            <button
              class="danger"
              onclick="deleteRow(
                'promocoes',
                '${x.id}'
              )"
            >
              Excluir
            </button>

          </div>
        `
      )
      .join("") ||
    "<span class='muted'>Nenhuma promoção.</span>";

  /*
    Eventos.
  */
  $("eList").innerHTML =
    (e.data || [])
      .map(
        x => `
          <div class="admin-item">

            <span>

              <b>
                ${escapeHtml(x.nome)}
              </b>

              —
              ${escapeHtml(
                x.data_hora || ""
              )}

            </span>

            <button
              class="danger"
              onclick="deleteRow(
                'eventos',
                '${x.id}'
              )"
            >
              Excluir
            </button>

          </div>
        `
      )
      .join("") ||
    "<span class='muted'>Nenhum evento.</span>";

  /*
    Dívidas.
  */
  $("dList").innerHTML =
    (d.data || [])
      .map(
        x => `
          <div class="admin-item debt">

            <span
              class="${x.pago ? "paid" : ""}"
            >

              <b>
                ${escapeHtml(x.nome)}
              </b>

              —
              ${money(x.valor)}

              ${
                x.pago
                  ? "(pago)"
                  : ""
              }

            </span>

            <span>

              <button
                class="dark-btn"
                onclick="toggleDebt(
                  '${x.id}',
                  ${!x.pago}
                )"
              >
                ${
                  x.pago
                    ? "Desmarcar"
                    : "Marcar pago"
                }
              </button>

              <button
                class="danger"
                onclick="deleteRow(
                  'dividas',
                  '${x.id}'
                )"
              >
                Excluir
              </button>

            </span>

          </div>
        `
      )
      .join("") ||
    "<span class='muted'>Nenhuma dívida cadastrada.</span>";
}

/*
  Excluir item.
*/
window.deleteRow = async (
  table,
  id
) => {

  const session = await getOwnerSession();

  if (!session) {

    alert("Acesso negado.");

    return;
  }

  if (!confirm("Excluir este item?")) {
    return;
  }

  const r = await sb
    .from(table)
    .delete()
    .eq("id", id);

  if (r.error) {

    alert(r.error.message);

    return;
  }

  await refreshAdmin();
  await loadPublic();
};

/*
  Marcar/desmarcar dívida como paga.
*/
window.toggleDebt = async (
  id,
  pago
) => {

  const session = await getOwnerSession();

  if (!session) {

    alert("Acesso negado.");

    return;
  }

  const r = await sb
    .from("dividas")
    .update({ pago })
    .eq("id", id);

  if (r.error) {

    alert(r.error.message);

    return;
  }

  await refreshAdmin();
};

/*
  Detecta mudanças de autenticação.
*/
sb?.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "Supabase Auth:",
      event,
      session?.user?.email || "sem sessão"
    );

  }
);

/*
  Carrega o conteúdo público.
*/
loadPublic();
