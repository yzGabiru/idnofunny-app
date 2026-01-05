# IDNOFunny App - Documentação Técnica e Contexto (GEMINI.md)

**Última Atualização:** 05 de Janeiro de 2026
**Status:** Funcional / Protótipo Avançado

Este arquivo serve como **memória de longo prazo** para o desenvolvimento do projeto. Ao iniciar uma nova sessão ou fazer alterações, consulte este documento para evitar regressões.

---

## 🛠 Stack Tecnológica (Versões Críticas)

A combinação de versões neste projeto é delicada. **Não atualize pacotes sem consultar esta lista.**

*   **Framework:** React 19 (`^19.2.0`)
*   **UI Framework:** Ionic 8 (`@ionic/react ^8.7.16`)
*   **Build Tool:** Vite 7
*   **HTTP Client:** Axios
*   **Image Editor:** Fabric.js (`fabric ^5.3.0`) - *Substituiu react-image-editor*
*   **⚠️ Roteamento:** `react-router-dom` **v5.3.4**
    *   **NÃO ATUALIZAR PARA v6.**
    *   **Motivo:** O pacote `@ionic/react-router` atual possui dependências estritas (peer dependencies) com a v5. Forçar a v6 causa falha catastrófica na renderização (Tela Preta/Black Screen).
    *   **Consequência:** Deve-se usar o hook `useHistory()` e `<Redirect>`, e **não** `useNavigate()`.

---

## 🏗 Arquitetura e Padrões

### 1. Configuração de API e Ambiente
*   **Base URL:** Nunca usar `localhost` hardcoded nos componentes.
*   **Padrão:** Utilizar `import.meta.env.VITE_API_BASE_URL`.
*   **Arquivo:** `.env` na raiz (ex: `VITE_API_BASE_URL=http://localhost:8000`).
*   **Fallback:** O arquivo `src/services/api.js` possui um fallback de segurança, mas a variável de ambiente é mandatória para deploy.

### 2. Autenticação (OAuth2)
*   **Token:** Armazenado em `localStorage.getItem('token')`.
*   **Envio de Login:** O backend (FastAPI/OAuth2) exige `application/x-www-form-urlencoded`.
    *   ❌ **Errado:** Enviar JSON ou `FormData` (causa erro 422).
    *   ✅ **Correto:** Usar `URLSearchParams`.
    ```javascript
    const params = new URLSearchParams();
    params.append('username', user);
    params.append('password', pass);
    await api.post('/token', params);
    ```
*   **Gestão de Sessão:** Atualmente depende de `window.location.reload()` após Login/Logout para limpar estados. (Débito técnico a ser resolvido com Context API).

### 3. Moderação Automática
*   **Backend:** Retorna erro `400 Bad Request` para palavrões e `429 Too Many Requests` para spam.
*   **Frontend:** Intercepta esses erros em `MemeDetail.jsx`.
    *   Mostra alerta amigável (`IonAlert`).
    *   **Easter Egg:** Substitui o texto ofensivo por uma flor aleatória (🌸, 🌺, 🌻) antes de limpar o input.

### 4. Tratamento de Datas
*   O backend envia datas em UTC (ex: `2026-01-04T15:00:00`).
*   O frontend (`src/utils/time.js`) força o sufixo `Z` se necessário para garantir que o navegador converta para o horário local do usuário corretamente.

---

## 🎨 Componentes Críticos: Editor de Imagem (Fabric.js)

O editor de memes (`src/components/ImageEditor/FabricImageEditor.jsx`) possui requisitos específicos para funcionar corretamente dentro do ecossistema React + Ionic:

1.  **Posicionamento no DOM:**
    *   O componente deve ser renderizado **fora** do `IonContent` mas dentro do `IonPage`.
    *   Isso evita conflitos de scroll e `z-index` do Ionic, permitindo que o editor funcione como um overlay fixo em tela cheia.

2.  **Ciclo de Vida & Strict Mode:**
    *   **Problema:** O React Strict Mode inicializa efeitos duas vezes. Se o canvas do Fabric não for descartado corretamente, cria-se uma instância "fantasma" que bloqueia cliques.
    *   **Solução:** Usar `useRef` para rastrear a instância do canvas e chamar `.dispose()` explicitamente na função de cleanup do `useEffect`.

3.  **Responsividade & Interatividade:**
    *   **ResizeObserver:** É obrigatório monitorar o container pai para redimensionar o canvas se a janela mudar.
    *   **`canvas.calcOffset()`:** **CRÍTICO.** Deve ser chamado sempre que o canvas é redimensionado ou inicializado. Sem isso, o Fabric.js perde a referência de onde o ponteiro do mouse está em relação aos objetos (cliques "erram" o alvo).

---

## 📂 Estrutura de Pastas Relevante

```
/src
  ├── components/   # Componentes reutilizáveis (MemeSlide, etc.)
  ├── pages/        # Telas da aplicação (Roteadas em App.jsx)
  ├── services/     # Configuração do Axios (api.js)
  ├── styles/       # CSS Modules e globais
  ├── theme/        # Variáveis do Ionic
  └── utils/        # Funções auxiliares (time.js)
```

---

## 📝 Check-list para Novas Alterações

1.  **Vai mexer nas rotas?**
    *   Lembre-se: Estamos no React Router **v5**.
    *   Use: `history.push('/path')`.
    *   Não use: `navigate('/path')` ou `<Routes>`.

2.  **Vai mexer em formulários?**
    *   Verifique se o backend espera JSON ou Form Data. O endpoint `/token` é a exceção que exige `URLSearchParams`.

3.  **Vai adicionar imagens?**
    *   Sempre prefixe a URL da imagem com `import.meta.env.VITE_API_BASE_URL` para garantir que carregue tanto localmente quanto em produção.

4.  **Estilização:**
    *   Prefira utilitários do Ionic quando possível.
    *   Para customizações pesadas (como o Feed estilo TikTok), use os arquivos CSS dedicados em `src/styles/`.

---

## 🐛 Problemas Conhecidos / Débitos Técnicos

1.  **Reload Forçado:** Login e Logout usam reload da página inteira. Ideal seria refatorar para um `AuthContext`.
2.  **Scroll do Feed:** O feed usa uma mistura de CSS Snap e JS manual para navegação desktop. Funciona, mas requer cuidado ao alterar.