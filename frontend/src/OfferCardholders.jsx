import { useEffect, useRef, useState } from 'react'
import './OfferCardholders.css'

const rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1').trim()
const formattedBase = /^https?:\/\//i.test(rawBase) ? rawBase : `https://${rawBase}`
const apiBase = (formattedBase.includes('/api/v1') ? formattedBase : `${formattedBase.replace(/\/$/, '')}/api/v1`).replace(/\/$/, '')

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

function MemberAvatar({ member }) {
  const initials = member.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return member.avatarUrl
    ? <img className="offer-cardholder-avatar" src={member.avatarUrl} alt={`${member.name}'s profile`} loading="lazy"/>
    : <span className="offer-cardholder-avatar" aria-hidden="true">{initials}</span>
}

function ConnectionRequestModal({ member, csrfToken, onClose, onSent }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cards = [...new Set(member.cards.map((card) => `${card.issuer} · ${card.cardProduct}`))]

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch(`${apiBase}/connections`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ targetUserId: member.memberId, message: form.get('message') }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not send the connection request.')
      onSent(payload.data.connection)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="deal-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="deal-modal connection-modal" role="dialog" aria-modal="true" aria-labelledby="connection-modal-title">
      <header><div><span className="page-eyebrow">CARDHOLDER NETWORK</span><h2 id="connection-modal-title">Connect with {member.name}</h2><p>Send a connection request and introduce yourself.</p></div><button type="button" aria-label="Close" onClick={onClose}>×</button></header>
      <div className="deal-modal-member"><b>{member.name}{member.city ? ` · ${member.city}` : ''}</b><span>{member.ratingCount ? `★ ${member.ratingAverage} from ${member.ratingCount} completed ${member.ratingCount === 1 ? 'deal' : 'deals'}` : 'New cardholder'} · {member.responseMinutes == null ? 'Reply time not listed' : `Typically replies in ~${member.responseMinutes} minutes`}</span></div>
      <form onSubmit={submit}>
        <h3>LISTED CARD PRODUCTS</h3>
        <div className="connection-card-list">{cards.map((card) => <span key={card}>{card}</span>)}</div>
        <label className="connection-message-label" htmlFor="connection-message">INTRODUCTION <span>OPTIONAL</span></label>
        <textarea id="connection-message" name="message" maxLength={500} rows={4} placeholder="Hi! I’d like to connect and learn more about your cardholder experience."/>
        <p className="connection-form-note">This sends a connection request, not a purchase request. You can discuss a specific product deal separately.</p>
        {error && <p className="offer-cardholder-error" role="alert">{error}</p>}
        <div className="deal-modal-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send connection request ↗'}</button></div>
      </form>
    </section>
  </div>
}

const bankFilters = [
  ['All Banks', ''], ['HDFC', 'HDFC Bank'], ['ICICI', 'ICICI Bank'], ['Axis', 'Axis Bank'],
  ['SBI', 'SBI Card'], ['Amex', 'American Express'], ['OneCard', 'OneCard'], ['Kotak', 'Kotak Mahindra Bank'],
]

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function formatChatTime(dateStr) {
  if (!dateStr) return 'Just now'
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'Just now'
  }
}

function DealRequestModal({ member, card, selectedOffer, initialProduct, analysisId, offerIndex, csrfToken, onClose, onSent }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  
  const product = initialProduct || {}
  const offer = selectedOffer || {}
  const numericPrice = Number(product.currentPrice) || 0
  const belowMinimum = numericPrice < Number(offer.minimumPurchase || 0)
  
  let discount = 0
  if (!belowMinimum) {
    if (offer.discountType === 'instant_discount_flat') discount = Number(offer.discountValue || 0)
    if (offer.discountType === 'instant_discount_percentage') discount = numericPrice * Number(offer.discountValue || 0) / 100
    if (offer.maximumDiscount != null) discount = Math.min(discount, Number(offer.maximumDiscount))
  }
  discount = Math.min(Math.round(discount * 100) / 100, numericPrice)
  const feePercent = member.dealFeePercent != null ? Number(member.dealFeePercent) : 10
  const platformFeePercent = 10
  const commission = Math.round(discount * feePercent) / 100
  const platformCommission = Math.round(discount * platformFeePercent) / 100
  const cardholderPayout = numericPrice - discount + commission
  const net = numericPrice - discount + commission + platformCommission
  const savings = Math.max(0, numericPrice - net)
  const canCalculate = Boolean(analysisId && card?.cardId && offerIndex != null) && numericPrice > 0 && !belowMinimum
    && ['instant_discount_flat', 'instant_discount_percentage'].includes(offer.discountType)
    && Number(offer.discountValue) > 0

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch(`${apiBase}/deal-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          analysisId: analysisId || undefined,
          offerIndex: offerIndex != null ? offerIndex : 0,
          cardholderId: member.memberId,
          cardId: card?.cardId || undefined,
          deliveryAddress: {
            recipientName: form.get('recipientName'),
            phone: form.get('phone'),
            addressLine: form.get('addressLine'),
            pincode: form.get('pincode'),
            city: form.get('city'),
            state: form.get('state'),
          },
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not send this request.')
      onSent(payload.data.dealRequest)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="deal-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className="deal-modal" role="dialog" aria-modal="true" aria-labelledby="deal-modal-title">
        <header>
          <div>
            <span className="page-eyebrow">DEAL ROOM · DELIVERY DETAILS</span>
            <h2 id="deal-modal-title">Order with {member.name}'s Card</h2>
            <p>Ship directly to your address and save with credit card discount.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <div className="deal-modal-member">
          <b>{member.name} · {card?.cardProduct || 'Credit Card'}</b>
          <span>{card?.issuer || 'Bank'} · Cardholder commission: {feePercent}% · Platform escrow fee: 10%</span>
        </div>
        <form onSubmit={submit}>
          <h3>PRODUCT &amp; OFFER</h3>
          <div className="deal-product-summary">
            <b>{product.name}</b>
            <span>{(product.retailer || 'Amazon.in').toUpperCase()} · listed price {money(numericPrice)}</span>
            <p>{offer.title}</p>
          </div>
          <h3>DELIVERY ADDRESS</h3>
          <p className="deal-form-note">Your order will be shipped directly to this delivery address by {member.name}. Never share card credentials, OTP, or CVV.</p>
          <div className="deal-form-grid">
            <label>Recipient full name<input name="recipientName" autoComplete="name" required maxLength="100"/></label>
            <label>Phone number for delivery<input name="phone" type="tel" autoComplete="tel" required minLength="7" maxLength="20"/></label>
            <label className="deal-field-wide">Flat / house / building<input name="addressLine" autoComplete="street-address" required maxLength="240"/></label>
            <label>Pincode<input name="pincode" autoComplete="postal-code" required minLength="4" maxLength="10"/></label>
            <label>City<input name="city" autoComplete="address-level2" required maxLength="100"/></label>
            <label className="deal-field-wide">State<input name="state" autoComplete="address-level1" required maxLength="100"/></label>
          </div>
          <div className="deal-calculation">
            <div><span>Product listed price (X)</span><b>{money(numericPrice)}</b></div>
            <div><span>Credit card instant discount (Y){belowMinimum ? ' · minimum not met' : ''}</span><b>−{money(discount)}</b></div>
            <div><span>Cardholder commission ({feePercent}% of discount)</span><b>+{money(commission)}</b></div>
            <div><span>Platform escrow fee (10% of discount)</span><b>+{money(platformCommission)}</b></div>
            <div><span>Cardholder payout upon delivery: (X − Y) + {feePercent}% of Y</span><b>{canCalculate ? money(cardholderPayout) : '—'}</b></div>
            <div className="deal-calculation-total"><span>Escrow amount after acceptance</span><b>{canCalculate ? money(net) : '—'}</b></div>
            <div><span>Estimated net savings</span><b>{canCalculate ? money(savings) : '—'}</b></div>
            <small>Formula: Escrow Deposit = (X − Y) + ({feePercent}% of Y) + (10% of Y). Cardholder receives (X − Y) + ({feePercent}% of Y) upon verified delivery, reimbursing checkout price plus paying their profit.</small>
          </div>
          <div className="deal-simulation-steps">
            <b>Simulated purchase flow</b>
            <ol>
              <li>Submit your delivery address and wait for the cardholder’s reply.</li>
              <li>The cardholder accepts or declines. You can simulate their reply for the judges.</li>
              <li>After acceptance, fund escrow. The cardholder is notified to order to your address and submit order details.</li>
              <li>When the package arrives, you confirm delivery to release funds to the cardholder.</li>
            </ol>
          </div>
          <label className="deal-simulation-consent">
            <input type="checkbox" required/>
            <span>I understand this is a simulation: no payment is collected and no retailer order is placed.</span>
          </label>
          {error && <p className="offer-cardholder-error" role="alert">{error}</p>}
          <div className="deal-modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy || !canCalculate}>
              {busy ? 'Initiating Deal…' : 'Send request & wait for reply ↗'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function DealRoom({ deal, currentUserId, csrfToken, onClose, onUpdated, onStart }) {
  const isDraft = deal.status === 'draft'
  const roomRef = useRef(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    roomRef.current?.querySelector('button')?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current()
      if (event.key !== 'Tab') return
      const items = [...roomRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')]
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      previousFocus?.focus()
    }
  }, [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const buyerId = typeof deal.buyerId === 'object' ? deal.buyerId?._id : deal.buyerId
  const isBuyer = String(buyerId) === String(currentUserId)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingReview, setRatingReview] = useState('')

  const cardholderName = deal.cardholderId?.name || 'Cardholder'
  const cardholderRating = deal.cardholderId?.ratingAverage ? `${deal.cardholderId.ratingAverage}` : 'Unrated'
  const cardholderAvatar = deal.cardholderId?.profile?.avatarUrl
  const cardholderInitials = cardholderName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const retailerName = deal.product?.retailer ? (deal.product.retailer === 'amazon' ? 'Amazon.in' : deal.product.retailer === 'flipkart' ? 'Flipkart' : deal.product.retailer) : 'Amazon.in'

  async function update(action) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/deal-requests/${deal._id}/${action}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(action === 'agree' ? { confirmAvailableCredit: true } : {}),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not update this deal.')
      onUpdated(payload.data.dealRequest)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function sendChatMessage(e) {
    if (e) e.preventDefault()
    const text = chatInput.trim()
    if (!text || chatBusy || isDraft) return
    setChatBusy(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/deal-requests/${deal._id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ body: text }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not send message.')
      setChatInput('')
      onUpdated(payload.data.dealRequest)
    } catch (msgError) {
      setError(msgError.message)
    } finally {
      setChatBusy(false)
    }
  }

  async function submitRating(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/deal-requests/${deal._id}/rating`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ score: ratingScore, review: ratingReview }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not save your rating.')
      onUpdated(payload.data.dealRequest)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const isAgreed = ['agreed', 'escrow_funded', 'order_placed', 'delivered', 'completed'].includes(deal.status)
  const isEscrowFunded = Boolean(deal.escrow?.fundedAt) && deal.status !== 'declined'
  const isOrderPlaced = ['order_placed', 'delivered', 'completed'].includes(deal.status)
  const isDelivered = ['delivered', 'completed'].includes(deal.status)

  const netPayable = deal.calculation?.netPayable ?? 0
  const savings = deal.calculation?.estimatedSavings ?? 0
  const feePercent = deal.calculation?.platformCommissionPercent || 10

  const messages = deal.messages || []

  return (
    <div className="live-deal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section ref={roomRef} className="live-deal-window" role="dialog" aria-modal="true" aria-labelledby="live-deal-title">
        <header className="live-deal-header">
          <div className="live-deal-title-group">
            <div className="live-deal-shield">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <h2 id="live-deal-title">{isDraft ? 'Your deal room' : `Live Deal Room #${String(deal._id).slice(-5).toUpperCase()}`}</h2>
              <p>Simulation · No money moved or retailer order placed</p>
            </div>
          </div>
          <button className="live-deal-close-x" onClick={onClose} aria-label="Close deal room">✕</button>
        </header>

        <nav className="live-deal-stepper" aria-label="Deal Progress">
          <div className={`live-stepper-item ${isAgreed ? 'completed' : 'current'}`}><span>1. Accepted</span></div>
          <div className={`live-stepper-item ${isEscrowFunded ? 'completed' : 'current'}`}><span>2. Escrow funded</span></div>
          <div className={`live-stepper-item ${isOrderPlaced ? 'completed' : ''}`}><span>3. Order placed</span></div>
          <div className={`live-stepper-item ${deal.order?.verified ? 'completed' : ''}`}><span>4. Order verified</span></div>
          <div className={`live-stepper-item ${isDelivered ? 'completed' : ''}`}><span>5. Delivered &amp; paid</span></div>
        </nav>

        <div className="live-deal-body">
          <div className="live-deal-cardholder-card">
            <div className="live-cardholder-info">
              {cardholderAvatar ? (
                <img className="live-cardholder-avatar" src={cardholderAvatar} alt={cardholderName} />
              ) : (
                <div className="live-cardholder-avatar">{cardholderInitials}</div>
              )}
              <div className="live-cardholder-text">
                <h3>
                  {cardholderName}
                  <span className="star-rating">★ {cardholderRating}</span>
                </h3>
                <p>{deal.offer?.cardName || 'Eligible credit card'}{deal.product?.retailer ? ` · ${retailerName}` : ''}</p>
              </div>
            </div>
            <div className="live-net-cost-box">
              <span className="net-cost-label">Total Net Cost (after split)</span>
              <span className="net-cost-amount">{deal.calculation ? money(netPayable) : 'Choose a product'}</span>
              <span className="net-savings-text">
                {deal.calculation ? `You save ${money(savings)} · ${feePercent}% platform fee included` : 'See your total before requesting'}
              </span>
            </div>
          </div>

          {isDraft && <div className="live-order-confirmed-card live-deal-setup">
            <div className="live-order-id-group"><span className="live-room-eyebrow">START YOUR PURCHASE</span><h4>{deal.product?.name || 'A better offer starts with your product'}</h4><p>{deal.product ? 'Review the offer and add your delivery address to request this cardholder’s help.' : 'Analyze a product link to find the matching offer and calculate your savings.'}</p></div>
            <div className="live-order-bottom"><span className="live-shipping-to">{deal.calculation ? `${deal.calculation.commissionPercent}% cardholder commission · 10% platform fee, both on the discount` : 'Your delivery details are collected before submitting a request.'}</span><button className="live-action-btn-green" onClick={onStart}>{deal.product ? 'Add delivery details ↗' : 'Analyze a product ↗'}</button></div>
          </div>}

          {deal.status === 'order_placed' && (
            <div className="live-order-confirmed-card">
              <div className="live-order-top">
                <div className="live-order-id-group">
                  <h4>📦 {deal.order?.verified ? 'Demo order verified' : 'Order awaiting demo verification'} · {retailerName}</h4>
                  <p>Order ID: <b>{deal.order?.reference || 'Not submitted'}</b></p>
                </div>
                <div className="live-order-tracking">
                  <span className="label">Carrier &amp; Tracking</span>
                  <span className="val">{deal.order?.trackingNumber || 'Not submitted'} ({deal.order?.carrier || 'Not submitted'})</span>
                </div>
              </div>
              <div className="live-order-bottom">
                <div className="live-shipping-to">
                  Shipping to: <b>{deal.deliveryAddress?.addressLine || ''}, {deal.deliveryAddress?.city || ''}</b>
                </div>
                <button
                  className="live-action-btn-green"
                  disabled={busy}
                  onClick={() => update(deal.order?.verified ? 'confirm-delivery' : 'verify-order')}
                >
                  {busy ? 'Updating…' : deal.order?.verified ? 'Simulate delivery & release payout ↗' : 'Simulate platform order verification ↗'}
                </button>
              </div>
            </div>
          )}

          {deal.status === 'escrow_funded' && (
            <div className="live-order-confirmed-card">
              <div className="live-order-top">
                <div className="live-order-id-group">
                  <h4>🔒 Escrow Funded: {money(netPayable)}</h4>
                  <p>Simulated funding recorded. Awaiting cardholder order placement.</p>
                </div>
                <div className="live-order-tracking">
                  <span className="label">Delivery Address</span>
                  <span className="val">{deal.deliveryAddress?.city}, {deal.deliveryAddress?.pincode}</span>
                </div>
              </div>
              <div className="live-order-bottom">
                <div className="live-shipping-to">
                  Shipping directly to: <b>{deal.deliveryAddress?.recipientName}</b> ({deal.deliveryAddress?.addressLine})
                </div>
                <button
                  className="live-action-btn-green"
                  disabled={busy}
                  onClick={() => update('place-order')}
                >
                  {busy ? 'Placing Order…' : 'Simulate Cardholder Placing Order 📦 ↗'}
                </button>
              </div>
            </div>
          )}

          {deal.status === 'agreed' && (
            <div className="live-order-confirmed-card">
              <div className="live-order-top">
                <div className="live-order-id-group">
                  <h4>✓ Deal Agreed with {cardholderName}</h4>
                  <p>The cardholder accepted. Fund escrow to notify them to place your order.</p>
                </div>
                <div className="live-order-tracking">
                  <span className="label">Escrow Deposit</span>
                  <span className="val">{money(netPayable)}</span>
                </div>
              </div>
              <div className="live-order-bottom">
                <div className="live-shipping-to">
                  Payment and payout are simulated in this preview.
                </div>
                <button
                  className="live-action-btn-green"
                  disabled={busy || !isBuyer}
                  onClick={() => update('fund-escrow')}
                >
                  {!isBuyer ? 'Waiting for buyer to fund escrow' : busy ? 'Depositing…' : `Simulate funding: ${money(netPayable)} 🔒 ↗`}
                </button>
              </div>
            </div>
          )}

          {deal.status === 'requested' && (
            <div className="live-order-confirmed-card">
              <div className="live-order-top">
                <div className="live-order-id-group">
                  <h4>⏳ Deal Requested · Awaiting Acceptance</h4>
                  <p>Cardholder will confirm available credit on {deal.offer?.cardName || 'credit card'}.</p>
                </div>
                <div className="live-order-tracking">
                  <span className="label">Instant Discount</span>
                  <span className="val">−{money(deal.calculation?.eligibleDiscount)}</span>
                </div>
              </div>
              <div className="live-order-bottom">
                <div className="live-shipping-to">
                  Recipient: <b>{deal.deliveryAddress?.recipientName}</b> · {deal.deliveryAddress?.city}
                </div>
                <button
                  className="live-action-btn-green"
                  disabled={busy}
                  onClick={() => update(isBuyer ? 'simulate-accept' : 'agree')}
                >
                  {busy ? 'Simulating…' : isBuyer ? 'Simulate reply: accept ↗' : 'Confirm available credit & accept ↗'}
                </button>
                <button className="live-action-btn-green" disabled={busy} onClick={() => update(isBuyer ? 'simulate-decline' : 'decline')}>{isBuyer ? 'Simulate reply: decline' : 'Decline request'}</button>
              </div>
            </div>
          )}

          {deal.status === 'completed' && (
            <div className="live-order-confirmed-card">
              <div className="live-order-top">
                <div className="live-order-id-group">
                  <h4>✓ Delivery &amp; payout simulated</h4>
                  <p>Cardholder payout of <b>{money(deal.calculation?.cardholderPayout)}</b> recorded. No money transferred.</p>
                </div>
                <div className="live-order-tracking">
                  <span className="label">Reported Carrier</span>
                  <span className="val">{deal.order?.carrier || 'Amazon Logistics'}</span>
                </div>
              </div>
              <div className="live-order-bottom">
                <div className="live-shipping-to">
                  Order ID: <b>{deal.order?.reference}</b> · Net Savings: <b>{money(savings)}</b>
                </div>
              </div>
            </div>
          )}

          {deal.status === 'declined' && (
            <div className="live-order-confirmed-card">
              <div className="live-order-id-group">
                <h4>✕ Deal Request Declined</h4>
                <p>The cardholder declined. {deal.escrow?.refundedAt ? `Simulated refund: ${money(deal.escrow.refundedAmount)}.` : 'No escrow payment was collected. Choose another cardholder.'}</p>
              </div>
            </div>
          )}

          {deal.status === 'completed' && isBuyer && (
            deal.rating?.score ? (
              <div className="live-system-pill">
                <b>Your Cardholder Rating: {'★'.repeat(deal.rating.score)}{'☆'.repeat(5 - deal.rating.score)}</b>
                {deal.rating.review && <p>"{deal.rating.review}"</p>}
              </div>
            ) : (
              <form className="deal-rating-form" onSubmit={submitRating}>
                <b>Rate your experience with {cardholderName}</b>
                <label>
                  Rating
                  <select value={ratingScore} onChange={(e) => setRatingScore(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} out of 5 stars</option>)}
                  </select>
                </label>
                <label>
                  Review
                  <textarea value={ratingReview} onChange={(e) => setRatingReview(e.target.value)} placeholder="How was your experience?" rows={2} maxLength={500} />
                </label>
                <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Submit Rating ★'}</button>
              </form>
            )
          )}

          {!isDraft && deal.deliveryAddress && <details className="deal-room-address">
            <summary>Delivery address · shared with this cardholder</summary>
            <p>{deal.deliveryAddress.recipientName} · {deal.deliveryAddress.phone}<br/>{deal.deliveryAddress.addressLine}<br/>{deal.deliveryAddress.city}, {deal.deliveryAddress.state} · {deal.deliveryAddress.pincode}</p>
          </details>}
          <div className="live-chat-panel">
            <div className="live-chat-heading"><span>CONVERSATION</span><small>{isDraft ? 'Opens after your request' : 'Only you and your cardholder'}</small></div>
            <div className="live-chat-thread" role="log" aria-label="Deal messages" aria-live="polite">
              {!messages.length && <div className="live-chat-empty"><span aria-hidden="true">↗</span><b>{isDraft ? `Connect with ${cardholderName}` : 'Start the conversation'}</b><p>{isDraft ? 'Once you submit your request, you can discuss the purchase and follow order updates here.' : 'Ask about the offer or share an update about this purchase.'}</p></div>}
              {messages.map((msg, index) => {
                if (msg.senderName === 'System') {
                  return (
                    <div className="live-system-pill" key={msg._id || index}>
                      {msg.body}
                    </div>
                  )
                }
                const isOutgoing = String(msg.senderId) === String(currentUserId)
                return (
                  <div className={`live-chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`} key={msg._id || index}>
                    <div className="bubble">{msg.body}</div>
                    <span className="live-chat-bubble-meta">
                      {isOutgoing ? 'You' : (msg.senderName || cardholderName)} · {formatChatTime(msg.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>

            <form className="live-chat-input-bar" onSubmit={sendChatMessage}>
              <input
                type="text"
                placeholder={isDraft ? 'Submit a deal request to start chatting' : `Send message to ${cardholderName}…`}
                maxLength={2000}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatBusy || isDraft}
              />
              <button
                type="submit"
                className={chatInput.trim() ? 'active' : ''}
                disabled={chatBusy || isDraft || !chatInput.trim()}
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </div>

          {error && <p className="offer-cardholder-error" role="alert">{error}</p>}
        </div>

        <footer className="live-deal-footer">
          <button className="btn-close-deal-window" type="button" onClick={onClose}>
            ✕ Close Deal Window
          </button>
          <span className="live-deal-footer-note">
            Reopen your deal from the cardholder directory
          </span>
        </footer>
      </section>
    </div>
  )
}

function CardholderDirectory({ csrfToken, currentUserId, selectedOffer, offerIndex, analysisId, product, onClearSelectedOffer }) {
  const [members, setMembers] = useState([])
  const [eligibility, setEligibility] = useState(null)
  const [loadedFilterKey, setLoadedFilterKey] = useState(null)
  const [issuer, setIssuer] = useState('')
  const [search, setSearch] = useState('')
  const [expandedMemberId, setExpandedMemberId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dealRequestError, setDealRequestError] = useState('')
  const [, setConnectionStatuses] = useState({})
  const [dealRequests, setDealRequests] = useState([])
  const [activeConnectMember, setActiveConnectMember] = useState(null)
  const [activeDealTarget, setActiveDealTarget] = useState(null)
  const [activeDealRoom, setActiveDealRoom] = useState(null)
  const selectedIssuer = selectedOffer?.bank && selectedOffer.bank !== 'Other Bank' ? selectedOffer.bank : ''
  const selectedCardProduct = selectedOffer?.cardName && selectedOffer.cardName !== 'Card eligibility unknown' ? selectedOffer.cardName : ''
  const hasOfferMatch = !selectedOffer || Boolean(selectedIssuer && analysisId && offerIndex !== null)
  const filterKey = JSON.stringify([analysisId, offerIndex, selectedIssuer, selectedCardProduct, issuer, search.trim()])

  useEffect(() => {
    const controller = new AbortController()
    async function loadDealRequests() {
      try {
        const response = await fetch(`${apiBase}/deal-requests`, {
          credentials: 'include',
          signal: controller.signal,
        })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Could not load your deal requests.')
        }
        setDealRequests(payload.data.dealRequests)
        setActiveDealRoom((current) => {
          if (!current || current.status === 'draft') return current
          return payload.data.dealRequests.find((item) => item._id === current._id) || current
        })
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setDealRequestError(requestError.message)
      }
    }
    loadDealRequests()
    const timer = window.setInterval(loadDealRequests, 5000)
    return () => { window.clearInterval(timer); controller.abort() }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    if (!hasOfferMatch) {
      return () => controller.abort()
    }
    const timer = window.setTimeout(async () => {
      setMembers([])
      setEligibility(null)
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ limit: '50' })
        if (selectedOffer) {
          params.set('analysisId', analysisId)
          params.set('offerIndex', String(offerIndex))
        }
        if (selectedIssuer || issuer) params.set('issuer', selectedIssuer || issuer)
        if (selectedCardProduct) params.set('cardProduct', selectedCardProduct)
        if (search.trim()) params.set('search', search.trim())
        const response = await fetch(`${apiBase}/members/cardholders?${params}`, {
          credentials: 'include', signal: controller.signal,
        })
        const payload = await response.json()
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not load cardholders.')
        setMembers(payload.data.members)
        setEligibility(payload.data.eligibility || null)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setLoadedFilterKey(filterKey)
        if (!controller.signal.aborted) setLoading(false)
      }
    }, selectedOffer ? 0 : 180)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [issuer, search, selectedIssuer, selectedCardProduct, selectedOffer, analysisId, offerIndex, hasOfferMatch, filterKey])

  function requestDeal(member, card) { setError(''); setActiveDealTarget({ member, card }) }

  function handleConnect(member) {
    const existing = dealRequests.find(
      (req) =>
        String(req.cardholderId?._id || req.cardholderId) === String(member.memberId) &&
        (!analysisId || String(req.analysisId) === String(analysisId)) && !['declined', 'completed'].includes(req.status)
    )
    if (existing) {
      setActiveDealRoom(existing)
      return
    }
    const matchedCard = member.cards.find((candidate) => eligibility?.cardProducts?.some((name) => name.toLowerCase() === candidate.cardProduct.toLowerCase()))
    const card = matchedCard || member.cards[0]
    const canRequest = Boolean(selectedOffer && analysisId && offerIndex != null && matchedCard)
    if (canRequest) { requestDeal(member, matchedCard); return }
    const price = Number(product?.currentPrice) || 0
    let discount = selectedOffer?.discountType === 'instant_discount_flat' ? Number(selectedOffer.discountValue) : selectedOffer?.discountType === 'instant_discount_percentage' ? price * Number(selectedOffer.discountValue) / 100 : 0
    if (selectedOffer?.maximumDiscount != null) discount = Math.min(discount, Number(selectedOffer.maximumDiscount))
    discount = Math.min(price, Math.round(discount * 100) / 100)
    const commissionPercent = member.dealFeePercent ?? 10
    const commissionAmount = Math.round(discount * commissionPercent) / 100
    const platformCommissionAmount = Math.round(discount * 10) / 100
    const netPayable = Math.round((price - discount + commissionAmount + platformCommissionAmount) * 100) / 100
    setActiveDealRoom({
      _id: `draft-${member.memberId}`, status: 'draft', buyerId: currentUserId,
      cardholderId: { _id: member.memberId, name: member.name, ratingAverage: member.ratingAverage, profile: { avatarUrl: member.avatarUrl } },
      product: canRequest ? product : null, offer: { cardName: card?.cardProduct }, messages: [],
      calculation: canRequest ? { netPayable, estimatedSavings: price - netPayable, commissionPercent, platformCommissionPercent: 10 } : null,
      draftTarget: canRequest ? { member, card: matchedCard } : null,
    })
  }

  const groupedMembers = [...members.reduce((grouped, card) => {
    const current = grouped.get(card.memberId) || { ...card, cards: [] }
    current.cards.push(card)
    grouped.set(card.memberId, current)
    return grouped
  }, new Map()).values()]
  const productPrice = Number(product?.currentPrice)
  const emptyMessage = !selectedIssuer
    ? 'This offer does not identify a bank, so CardBridge cannot make an automatic card match.'
    : !analysisId || offerIndex === null
      ? 'Reanalyze this product while signed in before matching cardholders to the offer.'
      : eligibility?.reason === 'CARD_NOT_IDENTIFIED'
        ? 'The offer does not explicitly identify an exact card product listed by members, so no cardholders are shown.'
      : eligibility?.reason === 'PRODUCT_PRICE_UNAVAILABLE'
        ? 'The saved analysis has no usable product price, so spending eligibility cannot be checked.'
        : eligibility?.reason === 'MINIMUM_PURCHASE_UNKNOWN'
          ? 'The offer minimum purchase could not be confirmed, so CardBridge cannot mark cardholders as eligible.'
          : eligibility?.reason === 'MINIMUM_PURCHASE_NOT_MET'
            ? `This product is listed below the offer minimum of ${money(eligibility.minimumPurchase)}.`
            : eligibility?.reason === 'ELIGIBLE_CRITERIA'
              ? `No opted-in cardholders list this exact card with a reported total credit limit of at least ${money(eligibility.requiredReportedCreditLimit)}.`
              : 'No opted-in cardholders match this offer yet.'

  return <div className="cardholder-directory">
    <header className="cardholder-directory-heading"><span>COMMUNITY CARDHOLDER NETWORK</span><h1>Registered Cardholders Ready to Discuss a Deal</h1><p>Connect with members who opted in. Any deal-room steps shown are a status-only demo, not escrow protection or a real order.</p></header>
    <div className="cardholder-filters" aria-label="Filter cardholders">
        {selectedOffer ? <div className="cardholder-selected-offer"><span>SELECTED OFFER</span><b>{[selectedIssuer, selectedCardProduct].filter(Boolean).join(' · ') || (selectedIssuer ? `${selectedIssuer} · exact card checked against offer text` : 'Exact card unavailable')}</b>{hasOfferMatch && <small>Offer minimum {eligibility?.minimumPurchase == null ? 'checked from saved offer' : money(eligibility.minimumPurchase)} · product {Number.isFinite(productPrice) && productPrice > 0 ? money(productPrice) : 'price unavailable'} · requires reported spending capacity covering the product price. Available spending amounts are self-reported; the cardholder reconfirms before acceptance.</small>}<button type="button" onClick={onClearSelectedOffer}>Show all cardholders</button></div> : <div className="cardholder-filter-banks">{bankFilters.map(([label, value]) => <button key={label} type="button" className={issuer === value ? 'active' : ''} onClick={() => setIssuer(value)}>{label}</button>)}</div>}
      <label className="cardholder-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by card or city…" aria-label="Search by card or city"/></label>
    </div>
    <p className="cardholder-directory-disclaimer">Card limits and fee details are member-reported; a total limit does not reveal available credit. Ownership is marked verified only after CardBridge verification. Never share a card number, CVV, PIN, or OTP.</p>
    {dealRequests.length > 0 && <section className="deal-request-list"><h2>YOUR DEAL REQUESTS · ADDRESS SHARED ONLY WITH THE OTHER MEMBER</h2>{dealRequests.map((request) => <article key={request._id}><div><b>{request.product.name}</b><span>{request.buyerId?.name || 'You'} → {request.cardholderId?.name || 'Cardholder'} · {request.status.replaceAll('_', ' ')}</span><span>{request.offer.bank} {request.offer.cardName} · buyer funds {money(request.calculation.netPayable)} · cardholder payout {money(request.calculation.cardholderPayout)}</span></div><strong>{money(request.calculation.netPayable)}</strong><button type="button" onClick={() => setActiveDealRoom(request)}>Open deal room ↗</button></article>)}</section>}
    {dealRequestError && <p className="offer-cardholder-error" role="alert">{dealRequestError}</p>}
    {error && hasOfferMatch && <p className="offer-cardholder-error" role="alert">{error}</p>}
    {hasOfferMatch && (loading || loadedFilterKey !== filterKey) ? <p className="offer-cardholder-empty">Finding cardholders…</p> : hasOfferMatch && groupedMembers.length ? <div className="cardholder-directory-grid">{groupedMembers.map((member) => {
      const verified = member.cards.some((card) => card.ownershipVerificationStatus === 'verified')
      const dealSent = dealRequests.some((request) => String(request.cardholderId?._id || request.cardholderId) === member.memberId
        && String(request.buyerId?._id || request.buyerId) === String(currentUserId)
        && (!analysisId || String(request.analysisId) === String(analysisId)) && !['declined', 'completed'].includes(request.status))
      const expanded = expandedMemberId === member.memberId
      const primaryCard = member.cards[0]
      return <article className={`cardholder-profile-card ${expanded ? 'expanded' : ''}`} key={member.memberId}>
        <button className="cardholder-profile-summary" type="button" aria-expanded={expanded} onClick={() => setExpandedMemberId(expanded ? null : member.memberId)}>
          <div className="cardholder-profile-top"><MemberAvatar member={member}/><div className="cardholder-profile-name"><b>{member.name}</b><span>{member.city || 'Location not shared'}</span></div><span className={`cardholder-verification ${verified ? 'verified' : ''}`}>{verified ? '✓ VERIFIED' : 'LISTED'}</span></div>
          <div className="cardholder-quick-details"><div><span>LISTED CARD</span><b>{primaryCard?.cardProduct || 'Card details unavailable'}</b><small>{primaryCard?.issuer || ''}</small></div><div><span>REPORTED LIMIT</span><b>{primaryCard?.creditLimit != null ? `₹${Number(primaryCard.availableCredit ?? primaryCard.creditLimit).toLocaleString('en-IN')}` : 'Not shared'}</b></div></div>
          <div className="cardholder-summary-footer"><span>{member.ratingCount ? <>★ {member.ratingAverage} <small>({member.ratingCount} {member.ratingCount === 1 ? 'review' : 'reviews'})</small></> : 'New cardholder'}</span><span>{expanded ? 'Hide details ↑' : 'View profile & reviews ↓'}</span></div>
        </button>
        {expanded && <div className="cardholder-expanded-details">
          {member.isShowcase && <span className="showcase-cardholder-label">SHOWCASE PROFILE · SIMULATED DEALS</span>}
          {member.bio && <p className="cardholder-bio">{member.bio}</p>}
          {member.latestReview && <blockquote className="cardholder-review">“{member.latestReview}”<small>Review from a completed deal</small></blockquote>}
          <section className="cardholder-listed-cards"><h2>CARDS &amp; MEMBER-REPORTED DETAILS</h2>{member.cards.map((card) => <div className="cardholder-listed-card" key={`${card.issuer}:${card.cardProduct}`}><div className="cardholder-listed-card-top"><b>{card.cardProduct}</b><span>{card.creditLimit != null ? `${card.availableCredit != null ? 'Available to spend' : 'Reported limit'}: ₹${Number(card.availableCredit ?? card.creditLimit).toLocaleString('en-IN')}` : 'Limit not shared'}</span></div><small>{card.issuer}{card.cardVariant ? ` · ${card.cardVariant}` : ''} · {card.ownershipVerificationStatus === 'verified' ? 'verified listing' : 'unverified listing'}{selectedOffer ? ' · available balance unverified' : ''}</small>{card.benefit && <p>↯ {card.benefit}</p>}{card.milestone && <p>✳ {card.milestone}</p>}</div>)}</section>
          <div className="cardholder-deal-meta"><span>◷ {member.responseMinutes == null ? 'Reply time not listed' : `Replies in ~${member.responseMinutes}m`}</span><b>{member.dealFeePercent != null ? `${member.dealFeePercent}% cardholder commission` : '10% cardholder commission'} · 10% platform fee</b></div>
        </div>}
        <div className="cardholder-profile-actions">
          <button className="cardholder-connect-button" type="button" onClick={() => handleConnect(member)}>Connect ↗</button>
          <button className="cardholder-request-button" type="button" onClick={() => handleConnect(member)}>{dealSent ? 'Open Deal Room' : !selectedOffer ? 'Analyze a product first ↗' : <>Request Card Deal <span>↗</span></>}</button>
        </div>
      </article>
    })}</div> : <p className="offer-cardholder-empty">{!hasOfferMatch ? emptyMessage : error || (selectedOffer ? emptyMessage : 'No opted-in cardholders match these filters yet.')}</p>}
    {activeConnectMember && <ConnectionRequestModal member={activeConnectMember} csrfToken={csrfToken} onClose={() => setActiveConnectMember(null)} onSent={() => { setConnectionStatuses((previous) => ({ ...previous, [activeConnectMember.memberId]: 'pending' })); setActiveConnectMember(null) }}/>}
    {activeDealTarget && <DealRequestModal member={activeDealTarget.member} card={activeDealTarget.card} selectedOffer={selectedOffer} initialProduct={product} analysisId={analysisId} offerIndex={offerIndex} csrfToken={csrfToken} onClose={() => setActiveDealTarget(null)} onSent={(request) => { const member = activeDealTarget.member; const saved = { ...request, cardholderId: { _id: member.memberId, name: member.name, ratingAverage: member.ratingAverage, profile: { avatarUrl: member.avatarUrl } } }; setDealRequests((previous) => [saved, ...previous]); setActiveDealTarget(null); setActiveDealRoom(saved) }}/ >}
    {activeDealRoom && <DealRoom key={activeDealRoom._id} deal={activeDealRoom} onStart={() => { const target = activeDealRoom.draftTarget; setActiveDealRoom(null); if (target) requestDeal(target.member, target.card); else navigate('/analyze') }} currentUserId={currentUserId} csrfToken={csrfToken} onClose={() => setActiveDealRoom(null)} onUpdated={(updated) => { setActiveDealRoom(updated); setDealRequests((previous) => previous.map((request) => request._id === updated._id ? updated : request)) }}/ >}
  </div>
}

export default function OfferCardholders({ selectedOffer = null, offerIndex = null, analysisId = null, product = null, onClearSelectedOffer }) {
  const [csrfToken, setCsrfToken] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [authState, setAuthState] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()
    async function loadSession() {
      try {
        const response = await fetch(`${apiBase}/auth/me`, { credentials: 'include', signal: controller.signal })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          setAuthState('signed-out')
          return
        }
        setCsrfToken(payload.data.csrfToken)
        setCurrentUserId(payload.data.user?._id || payload.data.user?.id || '')
        window.sessionStorage.setItem('cardbridge:csrfToken', payload.data.csrfToken)
        setAuthState('signed-in')
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setAuthState('error')
      }
    }
    loadSession()
    return () => controller.abort()
  }, [])

  if (authState === 'loading') {
    return <section className="offer-cardholders-section"><p className="offer-cardholder-empty">Loading the cardholder directory…</p></section>
  }

  if (authState === 'signed-out') {
    return <section className="offer-cardholders-section">
      <div className="offer-cardholders-intro"><span className="page-eyebrow">MEMBER DISCOVERY</span><h2>Find members with a listed card</h2><p>Sign in to see opted-in cardholder listings and contact members about a purchase.</p></div>
      <button className="offer-connect-button" type="button" onClick={() => navigate('/login')}>Log in to find members ↗</button>
    </section>
  }

  if (authState === 'error') {
    return <section className="offer-cardholders-section"><p className="offer-cardholder-error" role="alert">Could not check your sign-in. Refresh the page and try again.</p></section>
  }

  return <CardholderDirectory csrfToken={csrfToken} currentUserId={currentUserId} selectedOffer={selectedOffer} offerIndex={offerIndex} analysisId={analysisId} product={product} onClearSelectedOffer={onClearSelectedOffer}/>
}
