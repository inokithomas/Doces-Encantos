    // UTILIDADES DE PREÇO
    function parsePrice(text){
      if(text == null) return 0;
      // remove tudo exceto dígitos, , e . e -
      let s = String(text).replace(/[R$\s]/g,'').trim();
      s = s.replace(/[^0-9,.-]/g,'');
      // se contém vírgula e ponto, assumimos ponto como milhares e vírgula decimal
      if(s.indexOf(',') > -1 && s.indexOf('.') > -1){ s = s.replace(/\./g,'').replace(',','.'); }
      // se contém apenas vírgula, troca por ponto
      else if(s.indexOf(',') > -1){ s = s.replace(',','.'); }
      let n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }
    function formatBRL(num){
      return num.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    }

    // ESTADO DO CARRINHO (persistido)
    const STORAGE_KEY = 'doces_cart_v1';
    let cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if(!cart.items) cart = { items: {}, delivery: 5.00 };

    // SELETORES
    const cartFab = document.getElementById('cartFab');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartCount = document.getElementById('cartCount');
    const cartBody = document.getElementById('cartBody');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    const deliveryEl = document.getElementById('delivery');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkout');
    const clearCartBtn = document.getElementById('clearCart');

    // ADICIONAR EVENTOS AOS BOTÕES + CARRINHO
    function initMenuButtons(){
      document.querySelectorAll('.menu-item').forEach(itemEl => {
        const btn = itemEl.querySelector('button.add');
        if(!btn) return;
        btn.addEventListener('click', () => {
          const name = itemEl.dataset.name || itemEl.querySelector('.name')?.innerText || 'Item';
          let price = parsePrice(itemEl.dataset.price || itemEl.querySelector('.price')?.innerText || '0');
          // Se preço for zero (sob consulta) peça ao usuário via prompt (opcional)
          if(price === 0){
            const value = prompt('Esse item tem preço "Sob consulta". Digite o preço em R$ (ex: 12,50) ou deixe em branco para 0:');
            price = parsePrice(value || '0');
          }
          addToCart({name, price});
          openCart();
        });
      });
    }

    function saveCart(){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    function addToCart({name, price}){
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'_');
      if(cart.items[id]){
        cart.items[id].qty += 1;
      } else {
        cart.items[id] = { id, name, price: Number(price), qty: 1 };
      }
      saveCart();
      renderCart();
    }

    function updateQty(id, qty){
      if(!cart.items[id]) return;
      cart.items[id].qty = qty;
      if(cart.items[id].qty <= 0) delete cart.items[id];
      saveCart();
      renderCart();
    }

    function clearCart(){ cart = {items:{}, delivery: cart.delivery || 5.00}; saveCart(); renderCart(); }

    function calcSubtotal(){
      return Object.values(cart.items).reduce((s,it)=> s + (it.price * it.qty), 0);
    }

    function renderCart(){
      // count
      const totalQty = Object.values(cart.items).reduce((s,it)=> s + it.qty, 0);
      cartCount.innerText = totalQty;
      // body
      cartBody.innerHTML = '';
      if(totalQty === 0){
        cartBody.innerHTML = '<div class="muted" style="padding:18px">Seu carrinho está vazio. Adicione itens no cardápio.</div>';
      } else {
        Object.values(cart.items).forEach(it => {
          const row = document.createElement('div'); row.className = 'cart-item';
          row.innerHTML = `
            <div class="meta">
              <div style="font-weight:700">${it.name}</div>
              <div class="muted" style="font-size:13px">${formatBRL(it.price)} cada</div>
            </div>
            <div style="text-align:right">
              <div class="qty-controls">
                <button data-action="dec" data-id="${it.id}">−</button>
                <div style="min-width:26px;text-align:center">${it.qty}</div>
                <button data-action="inc" data-id="${it.id}">+</button>
              </div>
              <div style="margin-top:6px;font-weight:700">${formatBRL(it.price * it.qty)}</div>
            </div>
          `;
          cartBody.appendChild(row);
        });
      }
      // totals
      const subtotal = calcSubtotal();
      subtotalEl.innerText = formatBRL(subtotal);
      deliveryEl.innerText = formatBRL(cart.delivery || 0);
      totalEl.innerText = formatBRL(subtotal + (cart.delivery || 0));

      // attach qty buttons
      cartBody.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id; const action = btn.dataset.action;
          if(action === 'inc') updateQty(id, (cart.items[id].qty || 0) + 1);
          else if(action === 'dec') updateQty(id, (cart.items[id].qty || 0) - 1);
        });
      });
    }

    function openCart(){ cartSidebar.classList.add('open'); cartSidebar.setAttribute('aria-hidden','false'); }
    function closeCartFn(){ cartSidebar.classList.remove('open'); cartSidebar.setAttribute('aria-hidden','true'); }

    // INIT
    initMenuButtons(); renderCart();

    // EVENTOS UI
    cartFab.addEventListener('click', () => openCart());
    closeCart.addEventListener('click', () => closeCartFn());
    clearCartBtn.addEventListener('click', () => { if(confirm('Limpar todo o carrinho?')) clearCart(); });

    checkoutBtn.addEventListener('click', () => {
      const subtotal = calcSubtotal();
      if(subtotal <= 0){ alert('Adicione itens antes de finalizar.'); return; }
      // exemplo simples: abrir prompt com resumo e zerar
      const confirmMsg = `Resumo:\n\n${Object.values(cart.items).map(i=>`${i.qty}x ${i.name} — ${formatBRL(i.price*i.qty)}`).join('\n')}\n\nSubtotal: ${formatBRL(subtotal)}\nEntrega: ${formatBRL(cart.delivery || 0)}\nTotal: ${formatBRL(subtotal + (cart.delivery || 0))}\n\nContinuar (sim/não)?`;
      const ok = confirm(confirmMsg);
      if(ok){
        // aqui você normalmente chamaria um endpoint no servidor para criar o pedido
        alert('Pedido enviado (simulado). Limpar carrinho.');
        clearCart(); closeCartFn();
      }
    });

    // close cart on ESC
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeCartFn(); });

    // permitir arrastar/fechar clicando fora (opcional)
    document.addEventListener('click', (e)=>{
      if(cartSidebar.classList.contains('open') && !cartSidebar.contains(e.target) && !cartFab.contains(e.target)){
        // closeCartFn(); // desativado para evitar fechar acidentalmente
      }
    });