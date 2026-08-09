import React, { useState, useEffect } from "react";
import { ShoppingBag, X, Plus, Minus, Feather, ChevronRight, Check, Loader2 } from "lucide-react";

/* ---------------------------------------------------------
   QUETZAL — Chaussures de Ville
   Catalogue chargé en direct depuis Google Sheets
--------------------------------------------------------- */

const STOCK_API_URL =
  "https://script.google.com/macros/s/AKfycbwppp-AYKpPL5WRuU1hUtg-ymOFLnCWhGE-y0mGUdNouxJbHpv9RbIKwRbMUhf1ynEM/exec";

const C = {
  bg: "#FAF8F4",
  panel: "#FFFFFF",
  panelSoft: "#F1ECE3",
  line: "rgba(30,25,20,0.10)",
  ink: "#26201A",
  inkDim: "rgba(38,32,26,0.56)",
  green: "#7A2E35",
  greenSoft: "#F2E4E3",
  gold: "#AD8054",
  red: "#7A2E35",
};

const SIZES = [39, 40, 41, 42, 43, 44, 45];

export default function QuetzalShop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [sizeChoice, setSizeChoice] = useState({});
  const [oosNotice, setOosNotice] = useState(null); // { productId, size }
  const [cart, setCart] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function tryFetch(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "réponse sans succès");
      return data;
    }

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        let data;
        try {
          data = await tryFetch(STOCK_API_URL);
        } catch (directErr) {
          // Repli via un proxy CORS si l'appel direct est bloqué par le navigateur
          const proxied = "https://api.allorigins.win/raw?url=" + encodeURIComponent(STOCK_API_URL);
          data = await tryFetch(proxied);
        }
        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            "Erreur technique (debug) : " + (err && err.message ? err.message : String(err))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  function pickSize(productId, size) {
    const product = products.find((p) => p.id === productId);
    if (!product || (product.stock[size] || 0) <= 0) {
      setOosNotice({ productId, size });
      window.clearTimeout(pickSize._t);
      pickSize._t = window.setTimeout(() => setOosNotice(null), 2500);
      return;
    }
    setOosNotice(null);
    setSizeChoice((prev) => ({ ...prev, [productId]: size }));
  }

  function addToCart(product) {
    const size = sizeChoice[product.id] || 42;
    if ((product.stock[size] || 0) <= 0) {
      setOosNotice({ productId: product.id, size });
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, stock: { ...p.stock, [size]: p.stock[size] - 1 } }
          : p
      )
    );
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size);
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, size, qty: 1 }];
    });
    setDrawerOpen(true);
  }

  function changeQty(key, delta) {
    const item = cart.find((i) => `${i.id}-${i.size}` === key);
    if (!item) return;

    if (delta > 0) {
      const product = products.find((p) => p.id === item.id);
      if (!product || (product.stock[item.size] || 0) <= 0) {
        setOosNotice({ productId: item.id, size: item.size });
        return;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, stock: { ...p.stock, [item.size]: p.stock[item.size] - 1 } }
            : p
        )
      );
    } else if (delta < 0) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, stock: { ...p.stock, [item.size]: p.stock[item.size] + 1 } }
            : p
        )
      );
    }

    setCart((prev) =>
      prev
        .map((i) =>
          `${i.id}-${i.size}` === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  async function checkout() {
    if (cart.length === 0 || checkingOut) return;
    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const items = cart.map((i) => ({ id: i.id, size: i.size, qty: i.qty }));
      const res = await fetch(STOCK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();

      if (!data.success) {
        const failed = (data.results || []).filter((r) => !r.success);
        if (failed.length > 0) {
          const names = failed
            .map((f) => {
              const p = products.find((pp) => pp.id === f.id);
              return `${p ? p.name : f.id} (taille ${f.size})`;
            })
            .join(", ");
          setCheckoutError(
            `Stock insuffisant entre-temps pour : ${names}. Ajuste ton panier et réessaie.`
          );
        } else {
          setCheckoutError("Impossible de finaliser la commande pour le moment.");
        }
        return;
      }

      const orderNo = "QTZ-" + Math.floor(10000 + Math.random() * 89999);
      setConfirmed({ orderNo, total: subtotal });
      setCart([]);
    } catch (err) {
      setCheckoutError("Impossible de contacter le serveur de stock. Réessaie.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div
      style={{ background: C.bg, color: C.ink, fontFamily: "'Jost', sans-serif" }}
      className="min-h-screen w-full relative"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .stitch-rule {
          height: 1px;
          background: ${C.line};
        }
      `}</style>

      {/* NAV */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur"
        style={{ background: "rgba(250,248,244,0.86)", borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <Feather size={18} color={C.ink} strokeWidth={1.5} />
          <span className="font-display text-2xl" style={{ fontWeight: 600, letterSpacing: "0.01em" }}>Quetzal</span>
        </div>
        <nav className="hidden md:flex gap-8 font-mono text-xs uppercase" style={{ color: C.inkDim }}>
          <a href="#boutique">Ville</a>
          <a href="#histoire">Histoire</a>
        </nav>
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex items-center gap-2 px-3 py-2 rounded-full"
          style={{ border: `1px solid ${C.line}` }}
        >
          <ShoppingBag size={16} />
          <span className="font-mono text-xs">{cartCount}</span>
        </button>
      </header>

      {/* HERO */}
      <section className="relative w-full">
        <div className="px-6 md:px-10 pt-20 pb-16 text-center">
          <p className="font-mono text-xs uppercase mb-6" style={{ color: C.gold, letterSpacing: "0.2em" }}>
            Collection Ville — Cuirs sellier
          </p>
          <h1
            className="font-display leading-[1.05] mb-6 mx-auto"
            style={{
              fontSize: "clamp(2.75rem, 7.5vw, 5.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: C.ink,
            }}
          >
            L'élégance ne se met
            <br />
            pas en cage.
          </h1>
          <p
            className="text-base md:text-lg max-w-md mx-auto mb-9 font-display"
            style={{ color: C.inkDim, fontWeight: 400 }}
          >
            Cuirs vernis et grainés, doublures rouge sellier, semelles cousues à la
            main. De nouveaux modèles rejoignent la collection au fil des saisons.
          </p>
          <a
            href="#boutique"
            className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase"
            style={{ background: C.ink, color: C.bg, letterSpacing: "0.1em", borderRadius: "2px" }}
          >
            Voir la collection <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* BOUTIQUE */}
      <section id="boutique" className="px-6 md:px-10 py-16">
        <div className="stitch-rule mb-10" />
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <h2 className="font-display text-2xl" style={{ fontWeight: 700, color: C.ink }}>
            Chaussures de ville
          </h2>
          {!loading && !loadError && (
            <span className="font-mono text-xs uppercase" style={{ color: C.inkDim, letterSpacing: "0.08em" }}>
              {products.length} modèles · nouveautés régulières
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-10 justify-center" style={{ color: C.inkDim }}>
            <Loader2 size={16} className="animate-spin" />
            <span className="font-mono text-xs uppercase" style={{ letterSpacing: "0.08em" }}>
              Chargement de la collection…
            </span>
          </div>
        )}

        {!loading && loadError && (
          <div className="py-10 text-center font-mono text-xs" style={{ color: C.green }}>
            {loadError}
          </div>
        )}

        {!loading && !loadError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col">
                <div
                  className="overflow-hidden mb-4"
                  style={{ background: C.panelSoft, borderRadius: "3px", aspectRatio: "1 / 1" }}
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    style={{ display: "block" }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex items-start justify-between gap-2 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <h3 className="font-display text-lg" style={{ fontWeight: 700, color: C.ink }}>{p.name}</h3>
                  <span className="font-mono text-xs" style={{ color: C.inkDim, whiteSpace: "nowrap" }}>
                    ${p.price}
                  </span>
                </div>

                <p className="text-sm mt-3 mb-5 font-display" style={{ color: C.inkDim, fontWeight: 400 }}>{p.desc}</p>

                <div className="mt-auto">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {SIZES.map((s) => {
                      const available = (p.stock[s] || 0) > 0;
                      const selected = (sizeChoice[p.id] || 42) === s;
                      return (
                        <button
                          key={s}
                          onClick={() => pickSize(p.id, s)}
                          className="w-7 h-7 font-mono text-[11px]"
                          style={{
                            border: `1px solid ${!available ? C.line : selected ? C.ink : C.line}`,
                            color: !available ? "rgba(38,32,26,0.28)" : selected ? C.ink : C.inkDim,
                            background: !available ? C.panelSoft : selected ? C.panel : "transparent",
                            borderRadius: "2px",
                            textDecoration: !available ? "line-through" : "none",
                            cursor: !available ? "not-allowed" : "pointer",
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ minHeight: "18px" }} className="mb-2">
                    {oosNotice && oosNotice.productId === p.id && (
                      <p className="font-mono text-[10px]" style={{ color: C.green }}>
                        Cette pointure n'est plus disponible
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full py-2.5 font-mono text-xs uppercase"
                    style={{ background: C.ink, color: C.bg, letterSpacing: "0.08em", borderRadius: "2px" }}
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HISTOIRE */}
      <section id="histoire" className="px-6 md:px-10 py-20" style={{ background: "#F3F3F1" }}>
        <div className="stitch-rule mb-14" />
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase mb-4" style={{ color: C.gold, letterSpacing: "0.2em" }}>
            Pourquoi Quetzal
          </p>
          <h2
            className="font-display mb-5"
            style={{ fontSize: "clamp(2rem, 4.2vw, 3rem)", fontWeight: 700, color: C.ink }}
          >
            Un oiseau qu'on ne peut pas garder captif.
          </h2>
          <p className="text-base leading-relaxed font-display" style={{ color: C.inkDim, fontWeight: 400 }}>
            Dans la forêt de nuages d'Amérique centrale, le quetzal resplendissant
            refuse la cage&nbsp;: il s'y laisse mourir plutôt que d'y rester. Chaque
            paire de la collection Ville porte cette idée&nbsp;: le formel ne doit
            jamais devenir rigide. Cuirs sélectionnés, finitions à la main,
            doublures rouge sellier en clin d'œil au plumage de l'oiseau.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2">
          <Feather size={16} color={C.ink} strokeWidth={1.5} />
          <span className="font-display text-sm" style={{ fontWeight: 600 }}>Quetzal</span>
        </div>
        <p className="font-mono text-[11px]" style={{ color: C.inkDim }}>
          © {new Date().getFullYear()} Quetzal — Fabriqué avec soin.
        </p>
      </footer>

      {/* CART DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(38,32,26,0.45)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="relative w-full max-w-md h-full flex flex-col p-6"
            style={{ background: C.panel, borderLeft: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl" style={{ fontWeight: 700 }}>Panier</h3>
              <button onClick={() => setDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {confirmed ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: C.green }}
                >
                  <Check size={26} color={C.bg} />
                </div>
                <p className="font-display text-2xl" style={{ fontWeight: 700 }}>Commande confirmée</p>
                <p className="font-mono text-xs" style={{ color: C.inkDim }}>
                  Référence {confirmed.orderNo} · ${confirmed.total}
                </p>
                <button
                  onClick={() => {
                    setConfirmed(null);
                    setDrawerOpen(false);
                  }}
                  className="mt-4 px-5 py-2.5 font-mono text-xs uppercase"
                  style={{ background: C.ink, color: C.bg, borderRadius: "2px" }}
                >
                  Continuer mes achats
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="font-mono text-xs" style={{ color: C.inkDim }}>Votre panier est vide.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                  {cart.map((item) => {
                    const key = `${item.id}-${item.size}`;
                    return (
                      <div key={key} className="flex gap-3 items-center pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <div
                          className="overflow-hidden"
                          style={{ background: C.panelSoft, borderRadius: "10px", width: 56, height: 56, flexShrink: 0 }}
                        >
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <p className="font-display text-sm" style={{ fontWeight: 700 }}>{item.name}</p>
                          <p className="font-mono text-[11px]" style={{ color: C.inkDim }}>
                            Taille {item.size} · ${item.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => changeQty(key, -1)} style={{ color: C.inkDim }}>
                            <Minus size={14} />
                          </button>
                          <span className="font-mono text-xs w-4 text-center">{item.qty}</span>
                          <button onClick={() => changeQty(key, 1)} style={{ color: C.inkDim }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4">
                  <div className="flex justify-between mb-4 font-mono text-sm">
                    <span style={{ color: C.inkDim }}>Sous-total</span>
                    <span style={{ color: C.green }}>${subtotal}</span>
                  </div>
                  {checkoutError && (
                    <p className="font-mono text-[11px] mb-3" style={{ color: C.green }}>
                      {checkoutError}
                    </p>
                  )}
                  <button
                    onClick={checkout}
                    disabled={checkingOut}
                    className="w-full py-3 font-mono text-xs uppercase flex items-center justify-center gap-2"
                    style={{
                      background: C.green,
                      color: C.bg,
                      letterSpacing: "0.08em",
                      borderRadius: "2px",
                      opacity: checkingOut ? 0.7 : 1,
                      cursor: checkingOut ? "wait" : "pointer",
                    }}
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Vérification du stock…
                      </>
                    ) : (
                      "Passer commande"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
