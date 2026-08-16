import React, { useState, useEffect, useMemo } from "react";
import { ShoppingBag, X, Plus, Minus, ChevronRight, Check, Loader2, Search } from "lucide-react";
import quetzalLogo from "./assets/quetzal-logo-officiel.png";
import heroBg from "./assets/quetzal-hero-bg.jpg";

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

const HERO_BUBBLES = [
  { left: "4%", top: "12%", size: 9, delay: 0 },
  { left: "14%", top: "28%", size: 6, delay: 1.4 },
  { left: "22%", top: "8%", size: 11, delay: 0.6 },
  { left: "31%", top: "22%", size: 7, delay: 2.1 },
  { left: "40%", top: "16%", size: 8, delay: 0.9 },
  { left: "48%", top: "32%", size: 6, delay: 1.8 },
  { left: "8%", top: "48%", size: 7, delay: 2.6 },
  { left: "19%", top: "58%", size: 10, delay: 0.3 },
  { left: "34%", top: "50%", size: 6, delay: 1.1 },
  { left: "45%", top: "60%", size: 12, delay: 2.9 },
  { left: "6%", top: "76%", size: 8, delay: 1.6 },
  { left: "17%", top: "84%", size: 6, delay: 0.5 },
  { left: "28%", top: "78%", size: 9, delay: 2.3 },
  { left: "39%", top: "88%", size: 7, delay: 1.2 },
  { left: "51%", top: "78%", size: 10, delay: 0.1 },
];

const COUNTRIES = [
  { name: "RD Congo", code: "+243", flag: "🇨🇩" },
  { name: "Congo-Brazzaville", code: "+242", flag: "🇨🇬" },
  { name: "Angola", code: "+244", flag: "🇦🇴" },
  { name: "Rwanda", code: "+250", flag: "🇷🇼" },
  { name: "Burundi", code: "+257", flag: "🇧🇮" },
  { name: "Ouganda", code: "+256", flag: "🇺🇬" },
  { name: "Zambie", code: "+260", flag: "🇿🇲" },
  { name: "Tanzanie", code: "+255", flag: "🇹🇿" },
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "Cameroun", code: "+237", flag: "🇨🇲" },
  { name: "Gabon", code: "+241", flag: "🇬🇦" },
  { name: "Côte d'Ivoire", code: "+225", flag: "🇨🇮" },
  { name: "Sénégal", code: "+221", flag: "🇸🇳" },
  { name: "Mali", code: "+223", flag: "🇲🇱" },
  { name: "Bénin", code: "+229", flag: "🇧🇯" },
  { name: "Togo", code: "+228", flag: "🇹🇬" },
  { name: "Burkina Faso", code: "+226", flag: "🇧🇫" },
  { name: "Niger", code: "+227", flag: "🇳🇪" },
  { name: "Tchad", code: "+235", flag: "🇹🇩" },
  { name: "Ghana", code: "+233", flag: "🇬🇭" },
  { name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { name: "Afrique du Sud", code: "+27", flag: "🇿🇦" },
  { name: "Égypte", code: "+20", flag: "🇪🇬" },
  { name: "Maroc", code: "+212", flag: "🇲🇦" },
  { name: "Algérie", code: "+213", flag: "🇩🇿" },
  { name: "Tunisie", code: "+216", flag: "🇹🇳" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Belgique", code: "+32", flag: "🇧🇪" },
  { name: "Suisse", code: "+41", flag: "🇨🇭" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "États-Unis", code: "+1", flag: "🇺🇸" },
  { name: "Royaume-Uni", code: "+44", flag: "🇬🇧" },
  { name: "Allemagne", code: "+49", flag: "🇩🇪" },
  { name: "Portugal", code: "+351", flag: "🇵🇹" },
  { name: "Chine", code: "+86", flag: "🇨🇳" },
  { name: "Inde", code: "+91", flag: "🇮🇳" },
  { name: "Émirats Arabes Unis", code: "+971", flag: "🇦🇪" },
];

function sanitizePhoneInput(value) {
  // Garde un éventuel '+' en tête, puis uniquement des chiffres.
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/[^\d]/g, "");
  return (hasPlus ? "+" : "") + digits;
}

export default function QuetzalShop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [sizeChoice, setSizeChoice] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [oosNotice, setOosNotice] = useState(null); // { productId, size }
  const [cart, setCart] = useState([]);
  const [drawerStep, setDrawerStep] = useState("cart"); // "cart" | "checkout"
  const [checkoutForm, setCheckoutForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    whatsapp: COUNTRIES[0].code,
    adresse: "",
  });
  const [whatsappCountry, setWhatsappCountry] = useState(COUNTRIES[0].code);
  const [paymentMethod, setPaymentMethod] = useState(null); // "airtel" | "cash"
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
      let directMsg = null;
      let proxyMsg = null;
      try {
        let data;
        try {
          data = await tryFetch(STOCK_API_URL);
        } catch (directErr) {
          directMsg = directErr && directErr.message ? directErr.message : String(directErr);
          try {
            const proxied = "https://api.allorigins.win/raw?url=" + encodeURIComponent(STOCK_API_URL);
            data = await tryFetch(proxied);
          } catch (proxyErr) {
            proxyMsg = proxyErr && proxyErr.message ? proxyErr.message : String(proxyErr);
            throw new Error("direct: " + directMsg + " | proxy: " + proxyMsg);
          }
        }
        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) {
          setLoadError("Impossible de charger la collection pour le moment.");
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

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.desc || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

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

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerStep("cart");
    setCheckoutError(null);
  }

  async function checkout() {
    if (cart.length === 0 || checkingOut) return;

    if (
      !checkoutForm.prenom.trim() ||
      !checkoutForm.nom.trim() ||
      !checkoutForm.whatsapp.trim() ||
      !checkoutForm.adresse.trim()
    ) {
      setCheckoutError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    if (!paymentMethod) {
      setCheckoutError("Merci de choisir un mode de paiement.");
      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const items = cart.map((i) => ({ id: i.id, size: i.size, qty: i.qty }));
      const res = await fetch(STOCK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          items,
          customer: {
            nom: checkoutForm.nom.trim(),
            prenom: checkoutForm.prenom.trim(),
            email: checkoutForm.email.trim(),
            whatsapp: checkoutForm.whatsapp.trim(),
            adresse: checkoutForm.adresse.trim(),
            paiement: paymentMethod === "airtel" ? "Airtel Money" : "Cash à la livraison",
          },
        }),
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

      setConfirmed({ orderNo: data.orderNo, total: data.orderTotal });
      setCart([]);
      setCheckoutForm({ prenom: "", nom: "", email: "", whatsapp: COUNTRIES[0].code, adresse: "" });
      setWhatsappCountry(COUNTRIES[0].code);
      setPaymentMethod(null);
      setDrawerStep("cart");
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
        @keyframes quetzalBubbleFloat {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 0.35; }
          50% { transform: translateY(-14px); opacity: 0.5; }
          85% { opacity: 0.2; }
          100% { transform: translateY(-26px); opacity: 0; }
        }
        .quetzal-bubble {
          border-radius: 50%;
          background: ${C.gold};
          animation: quetzalBubbleFloat 5s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* NAV */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur"
        style={{ background: "rgba(250,248,244,0.86)", borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center">
          <img src={quetzalLogo} alt="Quetzal" style={{ height: "44px", width: "auto" }} />
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
      <section className="relative w-full overflow-hidden" style={{ aspectRatio: "2 / 1" }}>
        <img
          src={heroBg}
          alt="Quetzal"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* petites bulles décoratives animées */}
        {HERO_BUBBLES.map((b, i) => (
          <span
            key={i}
            className="quetzal-bubble"
            style={{
              position: "absolute",
              left: b.left,
              top: b.top,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}

        {/* texte de présentation, sur fond noir */}
        <div
          className="absolute inset-y-0 left-0 flex flex-col justify-center px-6 md:px-12"
          style={{ width: "56%" }}
        >
          <p
            className="font-mono uppercase mb-4"
            style={{ color: C.gold, letterSpacing: "0.2em", fontSize: "clamp(0.75rem, 1.3vw, 1rem)" }}
          >
            Collection Ville — Cuirs sellier
          </p>
          <h1
            className="font-display leading-[1.03] mb-5"
            style={{
              fontSize: "clamp(2.6rem, 7vw, 5.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#FFFFFF",
            }}
          >
            L'élégance ne se met
            <br />
            pas en cage.
          </h1>
          <p
            className="font-display mb-8"
            style={{
              color: "rgba(255,255,255,0.72)",
              fontWeight: 400,
              fontSize: "clamp(1rem, 2vw, 1.45rem)",
              maxWidth: "38ch",
            }}
          >
            Cuirs vernis et grainés, doublures rouge sellier, triple semelle.
            De nouveaux modèles rejoignent la collection au fil des saisons.
          </p>
          <a
            href="#boutique"
            className="inline-flex items-center gap-2 font-mono uppercase self-start"
            style={{
              background: C.bg,
              color: C.ink,
              letterSpacing: "0.1em",
              borderRadius: "2px",
              padding: "clamp(12px,1.6vw,18px) clamp(20px,2.8vw,32px)",
              fontSize: "clamp(0.8rem, 1.3vw, 1rem)",
            }}
          >
            Voir la collection <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* BOUTIQUE */}
      <section id="boutique" className="px-6 md:px-10 py-16">
        <div className="stitch-rule mb-10" />
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <h2 className="font-display text-2xl" style={{ fontWeight: 700, color: C.ink }}>
            Chaussures de ville
          </h2>
          {!loading && !loadError && (
            <span className="font-mono text-xs uppercase" style={{ color: C.inkDim, letterSpacing: "0.08em" }}>
              {filteredProducts.length} modèle{filteredProducts.length > 1 ? "s" : ""}
              {searchQuery ? " trouvé" + (filteredProducts.length > 1 ? "s" : "") : " · nouveautés régulières"}
            </span>
          )}
        </div>

        {!loading && !loadError && (
          <div className="relative mb-10 max-w-sm">
            <Search
              size={15}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.inkDim }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un modèle…"
              className="w-full pl-9 pr-3 py-2.5 font-mono text-xs"
              style={{ border: `1px solid ${C.line}`, borderRadius: "2px", background: C.panel, color: C.ink }}
            />
          </div>
        )}

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

        {!loading && !loadError && filteredProducts.length === 0 && (
          <div className="py-16 text-center font-mono text-xs" style={{ color: C.inkDim }}>
            Aucun modèle ne correspond à « {searchQuery} ».
          </div>
        )}

        {!loading && !loadError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {filteredProducts.map((p) => (
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
        <div className="flex items-center">
          <img src={quetzalLogo} alt="Quetzal" style={{ height: "32px", width: "auto" }} />
        </div>
        <p className="font-mono text-[11px]" style={{ color: C.inkDim }}>
          © {new Date().getFullYear()} Quetzal DRC
        </p>
      </footer>

      {/* CART DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(38,32,26,0.45)" }}
            onClick={closeDrawer}
          />
          <div
            className="relative w-full max-w-md h-full flex flex-col p-6"
            style={{ background: C.panel, borderLeft: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl" style={{ fontWeight: 700 }}>
                {drawerStep === "checkout" ? "Livraison & paiement" : "Panier"}
              </h3>
              <button onClick={closeDrawer}>
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
            ) : drawerStep === "cart" ? (
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
                  <button
                    onClick={() => setDrawerStep("checkout")}
                    className="w-full py-3 font-mono text-xs uppercase"
                    style={{ background: C.ink, color: C.bg, letterSpacing: "0.08em", borderRadius: "2px" }}
                  >
                    Passer commande
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                  <button
                    onClick={() => setDrawerStep("cart")}
                    className="font-mono text-[11px] uppercase self-start"
                    style={{ color: C.inkDim, letterSpacing: "0.06em" }}
                  >
                    ← Retour au panier
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Prénom *"
                      value={checkoutForm.prenom}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, prenom: e.target.value }))}
                      className="w-full px-3 py-2 font-mono text-xs"
                      style={{ border: `1px solid ${C.line}`, borderRadius: "2px", background: C.panel, color: C.ink }}
                    />
                    <input
                      type="text"
                      placeholder="Nom *"
                      value={checkoutForm.nom}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, nom: e.target.value }))}
                      className="w-full px-3 py-2 font-mono text-xs"
                      style={{ border: `1px solid ${C.line}`, borderRadius: "2px", background: C.panel, color: C.ink }}
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email (facultatif)"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 font-mono text-xs"
                    style={{ border: `1px solid ${C.line}`, borderRadius: "2px", background: C.panel, color: C.ink }}
                  />

                  <div>
                    <select
                      value={whatsappCountry}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        setWhatsappCountry(newCode);
                        setCheckoutForm((prev) => {
                          const oldCode = whatsappCountry;
                          const rest = prev.whatsapp.startsWith(oldCode)
                            ? prev.whatsapp.slice(oldCode.length)
                            : prev.whatsapp.replace(/^\+?\d*/, "");
                          return { ...prev, whatsapp: newCode + rest };
                        });
                      }}
                      className="w-full px-3 py-2 mb-2 font-mono text-xs"
                      style={{ border: `1px solid ${C.line}`, borderRadius: "2px", background: C.panel, color: C.ink }}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.name} value={c.code}>
                          {c.flag} {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="Numéro WhatsApp *"
                      value={checkoutForm.whatsapp}
                      onChange={(e) =>
                        setCheckoutForm((prev) => ({
                          ...prev,
                          whatsapp: sanitizePhoneInput(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 font-mono text-xs"
                      style={{ border: `1px solid ${C.line}`, borderRadius: "2px", background: C.panel, color: C.ink }}
                    />
                  </div>

                  <textarea
                    placeholder="Adresse de livraison *"
                    value={checkoutForm.adresse}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, adresse: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 font-mono text-xs resize-none"
                    style={{ border: `1px solid ${C.line}`, borderRadius: "2px", background: C.panel, color: C.ink }}
                  />

                  <div>
                    <p className="font-mono text-[11px] uppercase mb-2" style={{ color: C.inkDim, letterSpacing: "0.06em" }}>
                      Mode de paiement *
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: "airtel", label: "Airtel Money" },
                        { id: "cash", label: "Cash à la livraison" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setPaymentMethod(opt.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 font-mono text-xs text-left"
                          style={{
                            border: `1px solid ${paymentMethod === opt.id ? C.ink : C.line}`,
                            borderRadius: "2px",
                            background: paymentMethod === opt.id ? C.panelSoft : "transparent",
                            color: C.ink,
                          }}
                        >
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              border: `1px solid ${C.ink}`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {paymentMethod === opt.id && (
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.ink }} />
                            )}
                          </span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                      "Confirmer la commande"
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
