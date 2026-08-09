/*
  CENTRAL BEER
  Login do dono: E-mail + Senha
*/

const SUPABASE_URL = "https://eihnkocisefxjryavwxv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QA-SP3Iv0X-v51kxqLJJdg_x1Ak5w0s";

const ADMIN_EMAIL = "bryanyttcontato@gmail.com";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

function money(value) {
  if (value == null) return "";
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}


/* =========================
   CONTEÚDO PÚBLICO
========================= */

async function loadPublic() {

  const { data: promocoes, error: promoError } =
    await sb
      .from("promocoes")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  const { data: eventos, error: eventoError } =
    await sb
      .from("eventos")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (promoError) {
    console.error(promoError);
  }

  if (eventoError) {
    console.error(eventoError);
  }

  showPromocoes(promocoes || []);
  showEventos(eventos || []);
}


/* =========================
   PROMOÇÕES
========================= */

function showPromocoes(items) {

  const element = $("promocoesList");

  if (!element) return;

  if (!items.length) {

    element.innerHTML = `
      <div class="empty">
        Sem promoções cadastradas
        <br>
        <span class="muted">
          Adicione pelo painel do dono.
        </span>
      </div>
    `;

    return;
  }

  element.innerHTML = items.map(item => `

    <article class="card">

      <h3>
        🔥 ${escapeHtml(item.nome)}
      </h3>

      ${
        item.preco != null
          ? `<div class="price">
              ${money(item.preco)}
             </div>`
          : ""
      }

      <p>
        ${escapeHtml(item.descricao || "")}
      </p>

    </article>

  `).join("");
}


/* =========================
   EVENTOS
========================= */

function showEventos(items) {

  const element = $("eventosList");

  if (!element) return;

  if (!items.length) {

    element.innerHTML = `
      <div class="empty">
        Nenhum evento cadastrado
        <br>
        <span class="muted">
          Adicione pelo painel do dono.
        </span>
      </div>
    `;

    return;
  }

  element.innerHTML = items.map(item => `

    <article class="card">

      <h3>
        🎉 ${escapeHtml(item.nome)}
      </h3>

      <div class="date">
        📅 ${escapeHtml(item.data_hora || "")}
      </div>

      <p>
        ${escapeHtml(item.descricao || "")}
      </p>

    </article>

  `).join("");
}


/* =========================
   MODAL
========================= */

function openModal(content) {

  document.querySelector(".central-modal")?.remove();

  const modal = document.createElement("div");

  modal.className = "central-modal";

  modal.innerHTML = `
    <div class="modal-box">
      ${content}
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close")?.addEventListener("click", () => {
    modal.remove();
  });

  return modal;
}


/* =========================
   VERIFICAR DONO
========================= */

async function getOwner() {

  const {
    data: {
      session
    }
  } = await sb.auth.getSession();

  if (!session) {
    return null;
  }

  const email =
    (session.user.email || "").toLowerCase();

  if (
    email !== ADMIN_EMAIL.toLowerCase()
  ) {

    await sb.auth.signOut();

    return null;
  }

  return session;
}


/* =========================
   LOGIN
========================= */

async function openLogin() {

  const modal = openModal(`

    <button class="close">
      ×
    </button>

    <div class="login">

      <h2 class="admin-title">
        ⚙️ Painel do dono
      </h2>

      <p class="muted">
        Entre com sua conta de administrador.
      </p>

      <input
        id="adminEmail"
        class="field"
        type="email"
        value="${ADMIN_EMAIL}"
        readonly
      >

      <input
        id="adminPassword"
        class="field"
        type="password"
        placeholder="Senha"
        autocomplete="current-password"
      >

      <button
        id="adminLogin"
        class="gold-btn"
      >
        Entrar
      </button>

      <p
        id="adminMessage"
        class="muted"
      ></p>

    </div>

  `);

  $("adminLogin").onclick =
    async function () {

      const button =
        $("adminLogin");

      const message =
        $("adminMessage");

      const password =
        $("adminPassword").value;

      if (!password) {

        message.textContent =
          "Digite sua senha.";

        return;
      }

      button.disabled = true;

      button.textContent =
        "Entrando...";

      const result =
        await sb.auth.signInWithPassword({

          email: ADMIN_EMAIL,

          password: password

        });

      if (result.error) {

        console.error(result.error);

        message.textContent =
          "Senha incorreta ou conta não encontrada.";

        button.disabled = false;

        button.textContent =
          "Entrar";

        return;
      }

      const owner =
        await getOwner();

      if (!owner) {

        message.textContent =
          "Esta conta não possui acesso ao painel.";

        await sb.auth.signOut();

        button.disabled = false;

        button.textContent =
          "Entrar";

        return;
      }

      modal.remove();

      openAdmin();
    };


  $("adminPassword").addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        $("adminLogin").click();

      }

    }
  );
}


/* =========================
   BOTÃO DO PAINEL
========================= */

const adminButton =
  $("adminBtn");

if (adminButton) {

  adminButton.onclick =
    async () => {

      const owner =
        await getOwner();

      if (owner) {

        openAdmin();

      } else {

        openLogin();

      }

    };

}


/* =========================
   PAINEL ADMINISTRATIVO
========================= */

async function openAdmin() {

  const owner =
    await getOwner();

  if (!owner) {

    alert(
      "Acesso negado."
    );

    return;
  }

  const modal =
    openModal(`

    <button class="close">
      ×
    </button>

    <h2 class="admin-title">
      ⚙️ Painel do dono
    </h2>

    <div class="notice">

      Logado como:

      <b>
        ${ADMIN_EMAIL}
      </b>

    </div>


    <!-- PROMOÇÕES -->

    <div class="form-section">

      <h3>
        🔥 Adicionar promoção
      </h3>

      <input
        id="pNome"
        class="field"
        placeholder="Nome da promoção"
      >

      <input
        id="pPreco"
        class="field"
        type="number"
        step="0.01"
        placeholder="Preço"
      >

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


    <!-- EVENTOS -->

    <div class="form-section">

      <h3>
        🎉 Adicionar evento
      </h3>

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
        placeholder="Descrição"
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


    <!-- DÍVIDAS -->

    <div class="form-section">

      <h3>
        💰 Controle de dívidas
      </h3>

      <p class="muted">
        Somente o dono pode visualizar.
      </p>

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
        placeholder="Valor"
      >

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


    <!-- SAIR -->

    <div class="form-section">

      <button
        id="logout"
        class="dark-btn"
      >
        Sair
      </button>

    </div>

  `);


  /* SAIR */

  $("logout").onclick =
    async () => {

      await sb.auth.signOut();

      modal.remove();

    };


  /* ADICIONAR PROMOÇÃO */

  $("addPromo").onclick =
    async () => {

      const nome =
        $("pNome").value.trim();

      const preco =
        parseFloat(
          $("pPreco").value
        );

      const descricao =
        $("pDesc").value.trim();

      if (!nome) {

        alert(
          "Digite o nome da promoção."
        );

        return;
      }

      const result =
        await sb
          .from("promocoes")
          .insert({

            nome: nome,

            preco:
              Number.isFinite(preco)
                ? preco
                : null,

            descricao:
              descricao

          });

      if (result.error) {

        alert(
          result.error.message
        );

        return;
      }

      $("pNome").value = "";

      $("pPreco").value = "";

      $("pDesc").value = "";

      await refreshAdmin();

      await loadPublic();

    };


  /* ADICIONAR EVENTO */

  $("addEvent").onclick =
    async () => {

      const nome =
        $("eNome").value.trim();

      const data_hora =
        $("eData").value.trim();

      const descricao =
        $("eDesc").value.trim();

      if (!nome) {

        alert(
          "Digite o nome do evento."
        );

        return;
      }

      const result =
        await sb
          .from("eventos")
          .insert({

            nome:
              nome,

            data_hora:
              data_hora,

            descricao:
              descricao

          });

      if (result.error) {

        alert(
          result.error.message
        );

        return;
      }

      $("eNome").value = "";

      $("eData").value = "";

      $("eDesc").value = "";

      await refreshAdmin();

      await loadPublic();

    };


  /* ADICIONAR DÍVIDA */

  $("addDebt").onclick =
    async () => {

      const nome =
        $("dNome").value.trim();

      const valor =
        parseFloat(
          $("dValor").value
        );

      if (
        !nome ||
        !Number.isFinite(valor)
      ) {

        alert(
          "Preencha nome e valor."
        );

        return;
      }

      const result =
        await sb
          .from("dividas")
          .insert({

            nome:
              nome,

            valor:
              valor,

            pago:
              false

          });

      if (result.error) {

        alert(
          result.error.message
        );

        return;
      }

      $("dNome").value = "";

      $("dValor").value = "";

      await refreshAdmin();

    };


  await refreshAdmin();

}


/* =========================
   ATUALIZAR PAINEL
========================= */

async function refreshAdmin() {

  const owner =
    await getOwner();

  if (!owner) return;


  const promo =
    await sb
      .from("promocoes")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  const eventos =
    await sb
      .from("eventos")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  const dividas =
    await sb
      .from("dividas")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  /* PROMOÇÕES */

  const promoList =
    $("pList");

  if (promoList) {

    promoList.innerHTML =
      (promo.data || [])
        .map(item => `

          <div class="admin-item">

            <span>

              <b>
                ${escapeHtml(item.nome)}
              </b>

              ${
                item.preco != null
                  ? money(item.preco)
                  : ""
              }

            </span>

            <button
              class="danger"
              onclick="deleteRow(
                'promocoes',
                '${item.id}'
              )"
            >
              Excluir
            </button>

          </div>

        `)
        .join("") ||

      "<span class='muted'>Nenhuma promoção.</span>";

  }


  /* EVENTOS */

  const eventList =
    $("eList");

  if (eventList) {

    eventList.innerHTML =
      (eventos.data || [])
        .map(item => `

          <div class="admin-item">

            <span>

              <b>
                ${escapeHtml(item.nome)}
              </b>

              —
              ${escapeHtml(
                item.data_hora || ""
              )}

            </span>

            <button
              class="danger"
              onclick="deleteRow(
                'eventos',
                '${item.id}'
              )"
            >
              Excluir
            </button>

          </div>

        `)
        .join("") ||

      "<span class='muted'>Nenhum evento.</span>";

  }


  /* DÍVIDAS */

  const debtList =
    $("dList");

  if (debtList) {

    debtList.innerHTML =
      (dividas.data || [])
        .map(item => `

          <div class="admin-item debt">

            <span
              class="${
                item.pago
                  ? "paid"
                  : ""
              }"
            >

              <b>
                ${escapeHtml(item.nome)}
              </b>

              —
              ${money(item.valor)}

              ${
                item.pago
                  ? "(pago)"
                  : ""
              }

            </span>

            <span>

              <button
                class="dark-btn"
                onclick="toggleDebt(
                  '${item.id}',
                  ${!item.pago}
                )"
              >
                ${
                  item.pago
                    ? "Desmarcar"
                    : "Marcar pago"
                }
              </button>

              <button
                class="danger"
                onclick="deleteRow(
                  'dividas',
                  '${item.id}'
                )"
              >
                Excluir
              </button>

            </span>

          </div>

        `)
        .join("") ||

      "<span class='muted'>Nenhuma dívida cadastrada.</span>";

  }

}


/* =========================
   EXCLUIR
========================= */

window.deleteRow =
  async function (
    table,
    id
  ) {

    const owner =
      await getOwner();

    if (!owner) {

      alert(
        "Acesso negado."
      );

      return;
    }

    if (
      !confirm(
        "Excluir este item?"
      )
    ) {
      return;
    }

    const result =
      await sb
        .from(table)
        .delete()
        .eq(
          "id",
          id
        );

    if (result.error) {

      alert(
        result.error.message
      );

      return;
    }

    await refreshAdmin();

    await loadPublic();

  };


/* =========================
   MARCAR DÍVIDA
========================= */

window.toggleDebt =
  async function (
    id,
    pago
  ) {

    const owner =
      await getOwner();

    if (!owner) {

      alert(
        "Acesso negado."
      );

      return;
    }

    const result =
      await sb
        .from("dividas")
        .update({
          pago: pago
        })
        .eq(
          "id",
          id
        );

    if (result.error) {

      alert(
        result.error.message
      );

      return;
    }

    await refreshAdmin();

  };


/* =========================
   INICIALIZAÇÃO
========================= */

loadPublic();

console.log(
  "Central Beer carregado."
);

console.log(
  "Login: e-mail + senha."
);
