import { useEffect, useState } from 'react'
import { RealAuthPage } from './RealAuthPages.jsx'
import OfferCardholders from './OfferCardholders.jsx'
import RealWorkspace from './RealWorkspace.jsx'
import CardsplitLanding from './CardsplitLanding.jsx'
import './App.css'
import './RealLanding.css'
import './DemoMode.css'
import './WorkspaceNavigation.css'

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1').replace(/\/$/, '')
const navLinks = [['Overview', '/dashboard'], ['Friends & Circles', '/circles'], ['Analyze product', '/analyze'], ['My cards', '/cards'], ['Cardholders', '/cardholders'], ['Saved deals', '/saved-deals'], ['Product history', '/history'], ['Community', '/community'], ['Connections', '/connections'], ['Groups', '/groups'], ['Messages', '/messages'], ['Profile & settings', '/profile']]

function go(path) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0) }
function Link({ to, children, className = '', onClick }) { return <a className={className} href={to} onClick={e => { if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); go(to); onClick?.() } }}>{children}</a> }
function Mark() { return <Link to="/" className="brand"><span className="brand-mark">C</span> cardbridge</Link> }
function CreditCard() { const [tilt, setTilt] = useState({ x: 0, y: 0 }); return <div className="card-stage" onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); setTilt({x:((e.clientY-r.top)/r.height-.5)*-9,y:((e.clientX-r.left)/r.width-.5)*12}) }} onMouseLeave={()=>setTilt({x:0,y:0})}><div className="metal-card" style={{transform:`rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`}}><div className="card-top"><span>CARDBRIDGE</span><span className="contactless">)))</span></div><div className="chip"><i/><i/><i/><i/></div><div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 4829</div><div className="card-bottom"><span>MEMBER SINCE<br/><b>20 24</b></span><strong>CB</strong></div></div><span className="card-shadow"/></div> }
function URLForm({ compact = false }) { const [url,setUrl]=useState(''); const [state,setState]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); async function submit(e){e.preventDefault();setError('');setState('');let parsed;try{parsed=new URL(url.trim());if(!['http:','https:'].includes(parsed.protocol))throw new Error()}catch{setError('Enter a complete product link beginning with https://');return}setBusy(true);setState('Analyzing product…');try{const response=await fetch(`${apiBase}/products/analyze`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:parsed.href}),signal:AbortSignal.timeout(45000)});const result=await response.json();if(!response.ok||!result.success)throw new Error(result?.error?.message||'We could not analyze this link. Try again.');sessionStorage.setItem('cardbridge:lastAnalysis',JSON.stringify(result.data));setState('Analysis complete.');go(`/compare/${result.data.product?._id||result.data.product?.id||result.data.analysisId}`)}catch(err){setState('');setError(err.name==='TimeoutError'?'This is taking longer than expected. Please try again.':err.message==='Failed to fetch'?'Could not reach CardBridge. Check that the API is running and try again.':err.message)}finally{setBusy(false)}}return <form className={`url-form ${compact?'compact':''}`} onSubmit={submit}><label className="sr-only" htmlFor={compact?'quick-url':'product-url'}>Product URL</label><span className="url-icon">↗</span><input id={compact?'quick-url':'product-url'} type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste a product link from a supported retailer…" required/><button className="button button-light" disabled={busy}>{busy?'Analyzing…':compact?'Analyze':'Analyze product'} <span>↗</span></button>{(error||state)&&<p className={`form-feedback ${error?'error':''}`} role="status">{error||state}</p>}</form>}
function Header(){const [open,setOpen]=useState(false);return <header className="site-header"><Mark/><nav className={open?'nav-open':''}><a href="#how">How it works</a><a href="#offers">Explore offers</a><Link to="/community">Community</Link><Link to="/login">Log in</Link><Link className="button button-small" to="/signup">Get started <span>↗</span></Link></nav><button className="menu-toggle" aria-label="Toggle navigation" onClick={()=>setOpen(!open)}>{open?'×':'☰'}</button></header>}
function Landing() {
  return <main className="landing">
    <Header/>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><i/> A BETTER WAY TO BUY</div>
        <h1>The offer you want.<br/>The card you need.<br/><em>Shop together.</em></h1>
        <p>Found a card-only discount but don’t have that card? Match with an opted-in cardholder and see the full deal before you request the purchase.</p>
        <URLForm/>
        <a className="text-link" href="#how">See how CardSplit works <span>↓</span></a>
        <div className="hero-note"><span>✳</span> Currently supporting Amazon, Flipkart &amp; Meesho</div>
      </div>
      <div className="hero-visual">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/><CreditCard/>
        <div className="float-note"><span className="mini-dot"/> BUYER + CARDHOLDER, CONNECTED</div>
        <div className="vertical-note">A BETTER WAY TO CHECK OUT</div>
      </div>
      <div className="hero-index">01 / 04</div>
    </section>
    <div className="trust-strip"><span>SHOP WITH THE RIGHT CARD</span><b>AMAZON</b><b>flipkart</b><b>meesho</b><span>MORE RETAILERS COMING SOON</span></div>
    <section className="section how-section" id="how">
      <div className="section-kicker">FROM PRODUCT LINK TO CARDHOLDER <span>01 — 03</span></div>
      <div className="section-heading"><h2>Get the offer.<br/>Share the <em>purchase.</em></h2><p>CardBridge helps a shopper who found an offer connect with a member who has the eligible card.</p></div>
      <div className="steps">
        <article><span>01</span><div className="step-icon">↗</div><h3>Paste the product link</h3><p>We check the product price and the card offer listed by the supported retailer.</p></article>
        <article><span>02</span><div className="step-icon">⌕</div><h3>Choose a cardholder</h3><p>Review opted-in members with a matching card, their reported card details, and ratings from completed deals.</p></article>
        <article><span>03</span><div className="step-icon">≈</div><h3>Request the deal</h3><p>Review the delivery details and price split. The cardholder confirms they can place the order before accepting.</p></article>
      </div>
    </section>
    <section className="section offer-section" id="offers">
      <div className="section-kicker">CLEAR FEES. NO SURPRISES. <span>02 — 03</span></div>
      <div className="offer-intro"><div><h2>Know the split<br/><em>before you ask.</em></h2><p>The card discount is shared transparently: 10% of the discount goes to the cardholder and 10% to CardSplit. The remaining 80% is the buyer’s estimated savings.</p></div><span className="live-tag">ILLUSTRATIVE EXAMPLE</span></div>
      <div className="offer-live-note"><div><span>₹10,000 PRODUCT · ₹1,000 CARD DISCOUNT</span><b>Buyer funds ₹9,200 · cardholder receives ₹9,100 after delivery · platform fee is ₹100.</b></div><p>Cardholder payout is the discounted purchase price plus their 10% commission. Listed card limits are member-reported; the cardholder must confirm enough available credit when accepting. Fees and purchase steps are estimates in this demo—no real escrow, payment, order, or delivery is performed.</p></div>
    </section>
    <section className="community-band">
      <div className="community-orb">C<span>↗</span></div>
      <div><div className="section-kicker">BUY, SHARE, BUILD TRUST <span>03 — 03</span></div><h2>One account.<br/>Both <em>sides.</em></h2><p>Anyone can request a deal and list their own eligible cards. Rate a cardholder after a completed demo deal, connect with friends, and build groups around the cards you use.</p><Link to="/community" className="button button-outline">Explore community <span>↗</span></Link></div>
      <div className="community-stamp">BUILT FOR<br/>BETTER<br/>BUYING <b>✳</b></div>
    </section>
    <section className="final-cta"><span className="eyebrow">START WITH THE PRODUCT</span><h2>Find someone with<br/>the card you <em>need.</em></h2><p>Paste a product link to explore matching offers and opted-in cardholders.</p><Link to="/analyze" className="button button-light">Find a cardholder <span>↗</span></Link></section>
    <Footer/>
  </main>
}
function Footer(){return <footer className="footer"><Mark/><span>© {new Date().getFullYear()} CardBridge. Make every purchase count.</span><div><a href="#how">How it works</a><Link to="/community">Community</Link><Link to="/profile">Privacy settings</Link></div></footer>}
function AppShell({children, title='Your CardBridge'}) {
  const [user, setUser] = useState(null)
  const [sessionError, setSessionError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  useEffect(() => {
    if (!mobileNavOpen) return
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileNavOpen])
  useEffect(() => {
    let active = true
    fetch(`${apiBase}/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json()
        if (response.status === 401) return
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not check your account session.')
        if (active) {
          window.sessionStorage.setItem('cardbridge:csrfToken', payload.data.csrfToken)
          setUser(payload.data.user)
        }
      })
      .catch((error) => {
        if (active) setSessionError(error.message)
      })
    return () => { active = false }
  }, [])
  async function logout() {
    try {
      const csrfToken = window.sessionStorage.getItem('cardbridge:csrfToken')
      const response = await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken || '' },
      })
      if (!response.ok) throw new Error('Could not log out. Try again.')
      window.sessionStorage.removeItem('cardbridge:csrfToken')
      setUser(null)
      go('/login')
    } catch (error) {
      window.alert(error.message)
    }
  }
  return <div className="app-shell">
    <aside id="workspace-navigation" className={`sidebar ${mobileNavOpen ? 'mobile-nav-open' : ''}`}>
      <Mark/><div className="side-label">WORKSPACE</div>
      {navLinks.map(([label,path],i)=><Link key={path} to={path} onClick={() => setMobileNavOpen(false)} className={`${window.location.pathname===path?'active':''} ${i===1?'emphasized':''}`}><span>{['⌂','↗','▱','♡','◷','◎','⇄','▦','✉','◯'][i]}</span>{label}</Link>)}
      <div className="sidebar-bottom"><div className="avatar">{user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CB'}</div><div><b>{user?.name || 'Welcome'}</b><small>{user ? 'Account' : 'Signed out'}</small></div></div>
    </aside>
    {mobileNavOpen && <button className="mobile-nav-backdrop" type="button" aria-label="Close workspace navigation" onClick={() => setMobileNavOpen(false)}/>}
    <div className="app-main">
      <header className="app-top"><div className="mobile-mark"><Mark/></div><button className="workspace-menu-toggle" type="button" aria-label={mobileNavOpen ? 'Close workspace navigation' : 'Open workspace navigation'} aria-expanded={mobileNavOpen} aria-controls="workspace-navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}>{mobileNavOpen ? '×' : '☰'}</button><div className="breadcrumb">CARD BRIDGE <span>/</span> {title.toUpperCase()}</div><div className="top-actions"><span className="api-indicator"><i/> Product analysis</span>{user ? <button className="account-logout" onClick={logout}>Log out ↗</button> : <Link to="/login">Log in ↗</Link>}</div></header>
      {sessionError && <p className="session-check-error" role="alert">{sessionError}</p>}
      {children}
    </div>
  </div>
}
function AnalyzePage() {
  return <AppShell title="Analyze product"><div className="page-content">
    <div className="page-eyebrow">FIND A CARDHOLDER FOR YOUR OFFER</div>
    <h1>Paste a product link.<br/>Find the card that <em>fits.</em></h1>
    <p className="page-lede">We’ll check the listed price and card offers, then help you find opted-in members with a matching card.</p>
    <div className="analysis-box"><div className="analysis-icon">↗</div><div><h2>Start with a product link</h2><p>We currently support Amazon, Flipkart, and Meesho product pages.</p></div><URLForm/></div>
    <div className="privacy-note">◈ &nbsp; Never share your card number, CVV, PIN, or OTP. Deal steps are simulated in this demo.</div>
    <div className="supported"><span>SUPPORTED STORES</span><b>amazon</b><b>flipkart</b><b>meesho</b></div>
    <div className="honesty-card"><span>ⓘ</span><p>Offers and card matches are based on retailer-page details and member-reported listings. CardBridge cannot verify offer eligibility, ownership, or available credit.</p></div>
  </div></AppShell>
}
function discountLabel(offer){const value=Number(offer.discountValue);if(!Number.isFinite(value)||value<=0)return 'Discount details not specified';if(offer.discountType==='instant_discount_flat')return `₹${value.toLocaleString('en-IN')} instant discount`;if(offer.discountType==='cashback_percentage')return `${value}% cashback, received later`;if(offer.discountType==='cashback_flat')return `₹${value.toLocaleString('en-IN')} cashback, received later`;if(offer.discountType==='instant_discount_percentage')return `${value}% instant discount`;if(offer.discountType==='emi_discount')return 'EMI offer · verify terms';return `${value} points / offer value`}

function SaveOfferButton({ analysisId, offerIndex }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!analysisId) {
      setStatus('Sign in before analyzing to save this offer.')
      return
    }
    setBusy(true)
    setStatus('')
    try {
      let csrfToken = window.sessionStorage.getItem('cardbridge:csrfToken')
      if (!csrfToken) {
        const sessionResponse = await fetch(`${apiBase}/auth/me`, { credentials: 'include' })
        const session = await sessionResponse.json()
        if (!sessionResponse.ok || !session.success) {
          throw new Error(session.error?.message || 'Log in before saving an offer.')
        }
        csrfToken = session.data.csrfToken
        window.sessionStorage.setItem('cardbridge:csrfToken', csrfToken)
      }
      const response = await fetch(`${apiBase}/saved-deals`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
        body: JSON.stringify({ analysisId, offerIndex }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        const message = payload.error?.code === 'ANALYSIS_NOT_FOUND'
          ? 'Analyze this product again while signed in to save this offer.'
          : payload.error?.message || 'Could not save this offer.'
        throw new Error(message)
      }
      setStatus('Saved')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusy(false)
    }
  }
  return <div className="save-offer-control"><button type="button" className="save-offer-button" disabled={busy || status === 'Saved'} onClick={save}>{busy ? 'Saving…' : status === 'Saved' ? 'Saved' : 'Save offer'}</button>{status && status !== 'Saved' && <small role="status">{status}</small>}</div>
}

function ComparePage() {
  const [offerSelection, setSelectedOfferIndex] = useState(undefined)
  let data
  try {
    data = JSON.parse(sessionStorage.getItem('cardbridge:lastAnalysis') || 'null')
  } catch {
    data = null
  }
  const product = data?.product
  const offers = data?.discoveredOffers || []
  const selectedOfferIndex = offerSelection === undefined ? (data?.bestPickIndex ?? null) : offerSelection

  return <AppShell title="Analysis results"><div className="page-content">
    {data?.demoData && <p className="real-demo-banner">SAMPLE COMPARISON · Fictional product and illustrative offers for presentation.</p>}
    <Link to="/analyze" className="back-link">← Analyze another product</Link>
    {product ? <>
      <div className="result-head"><div><div className="page-eyebrow">PRODUCT ANALYSIS · {data.retailer || product.retailer}</div><h1>{product.name}</h1><p className="page-lede">Current price from the product listing</p></div><strong className="result-price">{product.currency || '₹'} {Number(product.currentPrice || 0).toLocaleString('en-IN')}</strong></div>
      <div className="results-meta"><span>◷ Checked {product.lastPriceCheckedAt ? new Date(product.lastPriceCheckedAt).toLocaleString() : 'just now'}</span><span>{data.scrapedOfferCount ?? offers.length} offers from the product page</span></div>
      <h2 className="results-title">Find your best card offer <small>{['demo_catalog', 'showcase_fallback'].includes(data.offerSource) ? 'DEMO BENEFIT CATALOG' : data.offerSource === 'card_benefit_catalog' ? 'CARD BENEFIT CATALOG' : 'RETAILER-PAGE DATA'}</small></h2>
      {['demo_catalog', 'showcase_fallback'].includes(data.offerSource) && <p className="best-pick-notice">For this showcase, illustrative card benefits let you demonstrate the full purchase flow; they are not live bank offers.</p>}
      {data.offerSource === 'card_benefit_catalog' && <p className="best-pick-notice">No page offers were found. Showing general retailer benefits from the card catalog.</p>}
      {offers.length ? offers.map((offer, index) => <div className={`result-offer ${offer.bestPick ? 'result-best-pick' : ''}`} key={index}>
        <div className="bank-monogram">{(offer.bank && offer.bank !== 'Other Bank' ? offer.bank : 'CB').slice(0, 2).toUpperCase()}</div>
        <div className="result-offer-main">{offer.bestPick && <span className="best-pick-badge">✦ BEST PICK · {offer.simulationOnly ? 'DEMO' : 'ESTIMATED DISCOUNT'}</span>}<h3>{offer.bank && offer.bank !== 'Other Bank' ? offer.bank : 'Bank details unavailable'} <span>{offer.cardName || 'Card eligibility unknown'}</span></h3><p>{offer.title || offer.offerDescription || offer.description || 'Offer terms were not included in the product page response.'}</p><small>{offer.minimumPurchase > 0 ? `Minimum purchase ₹${Number(offer.minimumPurchase).toLocaleString('en-IN')} · ` : ''}{offer.simulationOnly ? 'Illustrative offer for the project demo' : 'Confirm eligibility and terms with the issuer'}</small>{offer.sourceUrl && <a className="benefit-source" href={/^https?:\/\//.test(offer.sourceUrl) ? offer.sourceUrl : undefined} target="_blank" rel="noreferrer">Benefit source ↗</a>}<button type="button" className={`offer-select-match ${selectedOfferIndex === index ? 'active' : ''}`} onClick={() => setSelectedOfferIndex(index)}>{selectedOfferIndex === index ? 'Selected · showing matching cardholders below' : 'Find cardholders for this offer ↓'}</button></div>
        <div><small>{offer.discountType === 'cashback_percentage' ? 'DELAYED REWARD' : 'OFFER VALUE'}</small><b>{discountLabel(offer)}</b>{offer.estimatedDiscount > 0 && <small>Estimated discount ₹{offer.estimatedDiscount.toLocaleString('en-IN')} before commissions</small>}<SaveOfferButton analysisId={data.analysisId} offerIndex={index}/></div><span className="offer-arrow">↗</span>
      </div>) : <div className="empty-result"><div>○</div><h3>No card offers were found on the retrieved page</h3><p>Amazon may show bank offers dynamically or only for selected accounts. This result reflects the page content the backend could retrieve, not every offer available to you.</p></div>}
      {offers.length > 0 && <OfferCardholders selectedOffer={selectedOfferIndex === null ? null : offers[selectedOfferIndex]} offerIndex={selectedOfferIndex} analysisId={data.analysisId} product={product} onClearSelectedOffer={() => setSelectedOfferIndex(null)}/>}
      <div className="offer-caveat">Offer availability, eligibility, and terms can vary by account, payment method, and time. Review the offer on Amazon before purchasing. Cashback is not an immediate discount.</div>
      <a className="source-link" href={product.canonicalProductUrl || product.sourceUrl || '#'} target="_blank" rel="noreferrer">View product on {data.retailer || product.retailer} ↗</a>
    </> : <div className="empty-result"><div>◷</div><h3>Analysis details aren’t available</h3><p>Open a product link with the analysis in this browser session to see results.</p><Link to="/analyze" className="button button-dark">Analyze a product</Link></div>}
  </div></AppShell>
}
function NotFound(){return <div className="not-found"><Mark/><div><span className="eyebrow">404 — PAGE NOT FOUND</span><h1>This page took<br/><em>a different turn.</em></h1><Link to="/" className="button button-light">Back to CardBridge ↗</Link></div></div>}
export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  useEffect(() => {
    fetch(`${apiBase}/auth/me`, { credentials: 'include' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.success && payload?.data?.user) {
          setUser(payload.data.user)
        }
      })
      .catch(() => {})
  }, [path])

  if (path === '/') return <CardsplitLanding onNavigate={go} user={user} />
  if (path === '/login') return <RealAuthPage mode="login" />
  if (path === '/signup') return <RealAuthPage mode="signup" />
  if (path === '/forgot-password') return <RealAuthPage mode="forgot" />
  if (path === '/reset-password') return <RealAuthPage mode="reset" />
  if (path === '/verify-email') return <RealAuthPage mode="verify" />
  if (path === '/analyze' || path.startsWith('/compare/') || navLinks.some((x) => x[1] === path)) return <RealWorkspace path={path} />
  return <NotFound />
}
