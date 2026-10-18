import React, { useState, useEffect, useRef } from 'react'
import './CardsplitLanding.css'

const CATALOG_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Apple iPhone 16 Pro (128 GB) Titanium',
    category: 'Smartphones',
    retailPrice: 119900,
    bestCard: 'HDFC Infinia Metal',
    discountRate: 'Flat ₹5,000 Instant',
    discountAmount: 5000,
    netPrice: 114900,
    merchant: 'Amazon.in',
    cardholderPerk: '+₹1,14,900 milestone spend towards ₹10k fee waiver',
    imageEmoji: '📱',
  },
  {
    id: 'prod-2',
    title: 'Apple MacBook Air M3 (16GB / 512GB)',
    category: 'Laptops',
    retailPrice: 134900,
    bestCard: 'ICICI Emeralde Private',
    discountRate: '10% Instant off up to ₹6,000',
    discountAmount: 6000,
    netPrice: 128900,
    merchant: 'Apple India',
    cardholderPerk: '+₹1,28,900 milestone spend + Taj Epicure status boost',
    imageEmoji: '💻',
  },
  {
    id: 'prod-3',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'Audio',
    retailPrice: 29990,
    bestCard: 'SBI Cashback Card',
    discountRate: '5% Statement Credit',
    discountAmount: 1500,
    netPrice: 28490,
    merchant: 'Flipkart',
    cardholderPerk: '+₹28,490 spend towards ₹2L zero annual fee waiver',
    imageEmoji: '🎧',
  },
  {
    id: 'prod-4',
    title: 'Dyson Airwrap Multi-Styler Complete',
    category: 'Personal Care',
    retailPrice: 49900,
    bestCard: 'Axis Atlas Credit Card',
    discountRate: '₹4,000 Instant Voucher',
    discountAmount: 4000,
    netPrice: 45900,
    merchant: 'Croma',
    cardholderPerk: '+₹45,900 spend + 5x Tier Miles towards Gold upgrade',
    imageEmoji: '💨',
  },
]

const LANDING_CIRCLES = [
  {
    id: 'c1',
    name: 'Indiranagar Flat #402 Gang',
    type: 'Flatmates',
    totalSaved: 164700,
    description: 'Flatmates & close friends. Zero escrow required; all orders settled via monthly UPI ledger.',
    members: [
      { name: 'Aman Singhania', role: 'Product Engineer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', tier: 'Friend' },
      { name: 'Priya Nair', role: 'Growth Lead', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', tier: 'Friend' },
      { name: 'Rohan Deshmukh', role: 'Backend Architect', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', tier: 'Friend' },
    ],
    ledger: [
      { from: 'Rohan D.', to: 'Aman S.', amount: 56900, saved: 5000, title: 'iPhone 16 Pro via HDFC Infinia', status: 'Settled' },
      { from: 'Priya N.', to: 'Aman S.', amount: 18450, saved: 2000, title: 'Tata CliQ Luxury via HDFC Infinia', status: 'Settled' },
    ]
  },
  {
    id: 'c2',
    name: 'Fintech Product & Eng Wing',
    type: 'Workplace',
    totalSaved: 218500,
    description: 'Colleagues sharing high-tier Infinia & Atlas cards for flight bookings and gadget upgrades.',
    members: [
      { name: 'Aman Singhania', role: 'Product Engineer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', tier: 'Colleague' },
      { name: 'Vikramjit Roy', role: 'Founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', tier: 'Colleague' },
      { name: 'Rohan Deshmukh', role: 'Backend Architect', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', tier: 'Friend' },
    ],
    ledger: [
      { from: 'Aman S.', to: 'Vikramjit R.', amount: 74500, saved: 4000, title: 'MakeMyTrip UK Flight via Axis Atlas', status: 'Pending' },
    ]
  },
  {
    id: 'c3',
    name: 'IIT Kharagpur Batch 2022',
    type: 'Hostel',
    totalSaved: 94800,
    description: 'College batchmates sharing festive sale discounts across Flipkart & Amazon.',
    members: [
      { name: 'Priya Nair', role: 'Growth Lead', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', tier: 'Friend' },
      { name: 'Vikramjit Roy', role: 'Founder', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', tier: 'Vouched Peer' },
    ],
    ledger: [
      { from: 'Priya N.', to: 'Vikramjit R.', amount: 28490, saved: 1500, title: 'Sony Headphones via SBI Cashback', status: 'Settled' },
    ]
  }
]

export default function CardsplitLanding({ onNavigate, user }) {
  // 3D Card Interactive Tilt State
  const [tilt, setTilt] = useState({
    rotateX: 20,
    rotateY: -6,
    rotateZ: 1.5,
    translateY: 0,
    translateZ: 0,
    glareX: 50,
    glareY: 50,
  })
  const [isHoveringCard, setIsHoveringCard] = useState(false)

  // Interactive Calculator State
  const [selectedProduct, setSelectedProduct] = useState(CATALOG_PRODUCTS[0])

  // Active Circle State
  const [activeCircleIndex, setActiveCircleIndex] = useState(0)
  const activeCircle = LANDING_CIRCLES[activeCircleIndex]

  // Canvas Ref for Constellation Effect
  const canvasRef = useRef(null)

  // Handle 3D Card Mouse Move (tilt & bounce towards pointer)
  function handleCardMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const normX = (x - centerX) / centerX
    const normY = (y - centerY) / centerY

    const tiltIntensity = 14
    const newRotateX = 20 - normY * tiltIntensity
    const newRotateY = -6 + normX * tiltIntensity
    const newRotateZ = 1.5 + normX * 2
    const newTranslateY = -12 - normY * 10
    const newTranslateZ = 45

    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100

    setIsHoveringCard(true)
    setTilt({
      rotateX: newRotateX,
      rotateY: newRotateY,
      rotateZ: newRotateZ,
      translateY: newTranslateY,
      translateZ: newTranslateZ,
      glareX,
      glareY,
    })
  }

  function handleCardMouseLeave() {
    setIsHoveringCard(false)
    setTilt({
      rotateX: 20,
      rotateY: -6,
      rotateZ: 1.5,
      translateY: 0,
      translateZ: 0,
      glareX: 50,
      glareY: 50,
    })
  }

  // Constellation Background Animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener('resize', handleResize)

    const particleCount = 48
    const particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 0.8,
        baseAlpha: Math.random() * 0.25 + 0.1,
        alpha: 0.2,
      })
    }

    const mouse = { x: -1000, y: -1000, active: false }
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const handleMouseLeave = () => {
      mouse.active = false
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    let tick = 0
    const render = () => {
      tick += 0.01
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140 && dist > 0) {
            const force = (140 - dist) / 140
            p.x += (dx / dist) * force * 0.8
            p.y += (dy / dist) * force * 0.8
          }
        }

        p.alpha = p.baseAlpha + Math.sin(tick + i) * 0.08

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(242, 242, 245, ${Math.max(0.05, p.alpha)})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.09
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(201, 201, 210, ${lineAlpha})`
            ctx.lineWidth = 0.75
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div className="cardsplit-landing">
      {/* FLOATING TOP-RIGHT AUTH NAVIGATION */}
      <div className="cs-floating-nav">
        {user ? (
          <button
            type="button"
            className="cs-btn-dashboard"
            onClick={() => onNavigate('/dashboard')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            <span>Launch Dashboard</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="cs-btn-login"
              onClick={() => onNavigate('/login')}
            >
              Log In
            </button>
            <button
              type="button"
              className="cs-btn-signup"
              onClick={() => onNavigate('/signup')}
            >
              <span>Sign Up</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* 1. HERO SECTION WITH 3D METAL CARD MODEL */}
      <section className="cs-hero">
        <canvas ref={canvasRef} className="cs-particle-canvas" />
        <div className="cs-hero-grid" />
        <div className="cs-hero-light-sweep">
          <div className="cs-sweep-bar" />
        </div>
        <div className="cs-hero-radial-glow" />

        <div className="cs-hero-content">
          <div className="cs-hero-header">
            {/* Side-by-side logo & CardSplit typography */}
            <div className="cs-brand-lockup">
              <div className="cs-brand-symbol">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <h1 className="cs-brand-title">CardSplit</h1>
            </div>

            <p className="cs-hero-tagline">
              Unlock bank credit card discounts with people you already trust.
              <br />
              Zero stranger risk.
            </p>

            <div className="cs-hero-actions">
              <button
                type="button"
                className="cs-cta-primary"
                onClick={() => onNavigate(user ? '/dashboard' : '/login')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" x2="3" y1="12" y2="12"/>
                </svg>
                <span>{user ? 'Open Workspace' : 'Login'}</span>
              </button>
              <button
                type="button"
                className="cs-cta-secondary"
                onClick={() => onNavigate('/circles')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Explore Circles</span>
              </button>
            </div>
          </div>

          {/* 3D FLOATING & TILTING METAL CREDIT CARD */}
          <div className="cs-card-container">
            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className={`cs-metal-card-3d ${isHoveringCard ? 'hovering' : ''}`}
              style={{
                transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) rotateZ(${tilt.rotateZ}deg) translateY(${tilt.translateY}px) translateZ(${tilt.translateZ}px)`,
              }}
            >
              <div className="cs-card-dots" />
              <div className="cs-card-bevel" />
              {isHoveringCard && (
                <div
                  className="cs-card-glare"
                  style={{
                    background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 35%, transparent 65%)`,
                  }}
                />
              )}

              {/* Card Top Row: Bank Info & Mastercard Badge */}
              <div className="cs-card-top-row">
                <div>
                  <span className="cs-card-bank-eyebrow">· ICICI BANK ·</span>
                  <h3 className="cs-card-model-name">Emeralde Private Metal</h3>
                </div>
                <div className="cs-card-network-badge">
                  <div className="cs-mc-circles">
                    <div className="cs-mc-circle-red" />
                    <div className="cs-mc-circle-orange" />
                  </div>
                  <span className="cs-mc-text">Mastercard</span>
                </div>
              </div>

              {/* Card Middle Row: Golden Brushed EMV Chip & Glowing Perk Badge */}
              <div className="cs-card-mid-row">
                <div className="cs-emv-chip">
                  <div className="cs-emv-inner">
                    <div className="cs-emv-core" />
                  </div>
                </div>

                <div className="cs-neon-perk-badge">
                  16,000 INSTANT CART OFF
                </div>
              </div>

              {/* Card Bottom Row: Numbers & Cardholder / Milestone Goal */}
              <div className="cs-card-bottom-row">
                <div className="cs-card-numbers">
                  <span>••••</span>
                  <span>••••</span>
                  <span>••••</span>
                  <b>6239</b>
                </div>

                <div className="cs-card-meta">
                  <div>
                    <span className="cs-meta-label">CARDHOLDER</span>
                    <span className="cs-cardholder-val">Rohan Deshmukh</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="cs-meta-label">MILESTONE GOAL</span>
                    <span className="cs-milestone-val">Taj Epicure Boost</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PILLARS SECTION */}
      <section className="cs-section">
        <div className="cs-section-header">
          <h2 className="cs-section-title">Why Both Sides Win</h2>
          <p className="cs-section-subtitle">
            A safe, transparent protocol enabling friends to unlock high-tier card perks without sharing credentials.
          </p>
        </div>

        <div className="cs-pillars-grid">
          <div className="cs-pillar-card">
            <div className="cs-pillar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m7.5 4.27 9 5.15"/>
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
            </div>
            <h3>Direct-to-Home Delivery</h3>
            <p>
              The cardholder places the order directly to your address on Amazon, Flipkart, or Apple. The package arrives at your door with the official retail invoice and full warranty under your own name.
            </p>
          </div>

          <div className="cs-pillar-card">
            <div className="cs-pillar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <h3>Zero OTP or CVV Sharing</h3>
            <p>
              Card details and banking secrets are never exposed. Cardholders execute payments securely on their personal devices, with all amounts reconciled through your trusted private circle ledger.
            </p>
          </div>

          <div className="cs-pillar-card">
            <div className="cs-pillar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </div>
            <h3>Milestone Win-Win</h3>
            <p>
              Cardholders hit the high spend targets required for annual fee waivers and bonus air miles. Shoppers pocket thousands in instant bank card discounts on every big purchase.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SAVINGS & MILESTONE CALCULATOR CONSOLE */}
      <section className="cs-section">
        <div className="cs-section-header">
          <h2 className="cs-section-title">Savings & Milestone Calculator</h2>
          <p className="cs-section-subtitle">
            Compare direct shopper discounts against cardholder spend progress.
          </p>
        </div>

        {/* 1-Click Product Presets */}
        <div className="cs-calc-presets">
          {CATALOG_PRODUCTS.map((prod) => (
            <button
              key={prod.id}
              type="button"
              className={`cs-preset-btn ${selectedProduct.id === prod.id ? 'active' : ''}`}
              onClick={() => setSelectedProduct(prod)}
            >
              <span>{prod.imageEmoji}</span>
              <span>{prod.title.split('(')[0]}</span>
            </button>
          ))}
        </div>

        <div className="cs-calc-console">
          <div className="cs-calc-left">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ font: '11px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase' }}>STORE & PRODUCT</span>
                <span style={{ font: '12px var(--mono)', color: '#10B981', fontWeight: 600 }}>{selectedProduct.merchant}</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#F2F2F5', margin: '0 0 6px' }}>
                {selectedProduct.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#9A9AA6', margin: '0 0 24px' }}>
                Eligible best card: <strong style={{ color: '#F2F2F5' }}>{selectedProduct.bestCard}</strong>
              </p>

              <div className="cs-calc-row">
                <span style={{ color: '#9A9AA6' }}>Retail MRP</span>
                <b>₹{selectedProduct.retailPrice.toLocaleString('en-IN')}</b>
              </div>
              <div className="cs-calc-row">
                <span style={{ color: '#10B981' }}>Instant Bank Discount ({selectedProduct.discountRate})</span>
                <b style={{ color: '#10B981' }}>-₹{selectedProduct.discountAmount.toLocaleString('en-IN')}</b>
              </div>
            </div>

            <div className="cs-calc-highlight">
              <span style={{ font: '10px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                NET PRICE YOU PAY CARDHOLDER
              </span>
              <b>₹{selectedProduct.netPrice.toLocaleString('en-IN')}</b>
            </div>
          </div>

          <div className="cs-calc-right">
            <div>
              <span style={{ font: '11px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
                CARDHOLDER WIN-WIN METRICS
              </span>

              <div className="cs-calc-row">
                <span style={{ color: '#9A9AA6' }}>Milestone Spend Boost</span>
                <b style={{ color: '#2DD4BF' }}>+₹{selectedProduct.netPrice.toLocaleString('en-IN')}</b>
              </div>
              <div className="cs-calc-row">
                <span style={{ color: '#9A9AA6' }}>Reward Points / Air Miles</span>
                <b>~{Math.round(selectedProduct.netPrice * 0.033).toLocaleString('en-IN')} pts</b>
              </div>
              <div style={{ marginTop: '20px', padding: '16px', background: '#18181B', border: '1px solid #2E2E33', borderRadius: '14px' }}>
                <span style={{ font: '10px var(--mono)', color: '#63636E', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  CARDHOLDER PERK UNLOCKED
                </span>
                <p style={{ fontSize: '13px', color: '#F2F2F5', fontWeight: 600, margin: 0 }}>
                  {selectedProduct.cardholderPerk}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="cs-cta-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}
              onClick={() => onNavigate(user ? '/dashboard' : '/login')}
            >
              <span>Lock Deal with Circle Cardholder ➔</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. PRIVATE CIRCLES & SHARED LEDGER */}
      <section className="cs-section">
        <div className="cs-section-header">
          <h2 className="cs-section-title">Private Circles & Shared Ledger</h2>
          <p className="cs-section-subtitle">
            Share cards inside trusted social circles with direct zero-fee UPI settlement.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="cs-circle-tabs">
          {LANDING_CIRCLES.map((circle, idx) => (
            <button
              key={circle.id}
              type="button"
              className={`cs-circle-tab-btn ${activeCircleIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveCircleIndex(idx)}
            >
              <span style={{ font: '9px var(--mono)', background: '#0E0E10', padding: '2px 6px', borderRadius: '4px', color: '#9A9AA6' }}>
                {circle.type}
              </span>
              <span>{circle.name}</span>
            </button>
          ))}
        </div>

        <div className="cs-circle-showcase-grid">
          {/* Left: Circle info & members */}
          <div className="cs-circle-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#F2F2F5', margin: '0 0 4px' }}>
                  {activeCircle.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#9A9AA6' }}>{activeCircle.type} Circle</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ font: '9px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase', display: 'block' }}>CIRCLE SAVINGS</span>
                <b style={{ font: '18px var(--mono)', color: '#10B981' }}>₹{activeCircle.totalSaved.toLocaleString('en-IN')}</b>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#9A9AA6', lineHeight: 1.6, margin: '0 0 20px' }}>
              {activeCircle.description}
            </p>

            <span style={{ font: '10px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              MEMBERS ({activeCircle.members.length})
            </span>
            {activeCircle.members.map((m, idx) => (
              <div key={idx} className="cs-member-row">
                <img src={m.avatar} alt={m.name} className="cs-member-avatar" />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: '13px', color: '#F2F2F5', display: 'block' }}>{m.name}</b>
                  <small style={{ fontSize: '11px', color: '#9A9AA6' }}>{m.role}</small>
                </div>
                <span style={{ font: '10px var(--mono)', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  {m.tier}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Splitwise-style Ledger */}
          <div className="cs-circle-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ font: '11px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase' }}>SHARED CIRCLE LEDGER</span>
              <span style={{ font: '11px var(--mono)', color: '#10B981' }}>● 1-Tap UPI Settle</span>
            </div>

            {activeCircle.ledger.map((item, idx) => (
              <div key={idx} className="cs-ledger-item">
                <div>
                  <b style={{ fontSize: '13px', color: '#F2F2F5', display: 'block', marginBottom: '2px' }}>
                    {item.title}
                  </b>
                  <span style={{ fontSize: '11px', color: '#9A9AA6' }}>
                    {item.from} owes {item.to}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ font: '14px var(--mono)', color: '#F2F2F5', display: 'block' }}>
                    ₹{item.amount.toLocaleString('en-IN')}
                  </b>
                  <span style={{ font: '10px var(--mono)', color: '#10B981' }}>
                    saved ₹{item.saved.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="cs-cta-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '20px', fontSize: '13px', padding: '12px' }}
              onClick={() => onNavigate('/circles')}
            >
              Open Live Friends & Circles Hub ↗
            </button>
          </div>
        </div>
      </section>

      {/* 5. SHUNYA-STYLE GLOWING OUTLINED CARDSPLIT FOOTER */}
      <footer className="cs-shunya-footer">
        <div className="cs-footer-rays">
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
            <ellipse cx="720" cy="380" rx="360" ry="140" stroke="#3E3E45" strokeWidth="1" strokeDasharray="4 4" />
            <ellipse cx="720" cy="380" rx="540" ry="220" stroke="#3E3E45" strokeWidth="1" />
            <ellipse cx="720" cy="380" rx="720" ry="300" stroke="#232327" strokeWidth="1.5" />
            <ellipse cx="720" cy="380" rx="900" ry="380" stroke="#232327" strokeWidth="1.5" strokeDasharray="8 8" />
            <line x1="720" y1="50" x2="100" y2="600" stroke="#232327" strokeWidth="1" />
            <line x1="720" y1="50" x2="350" y2="600" stroke="#3E3E45" strokeWidth="0.8" />
            <line x1="720" y1="50" x2="720" y2="600" stroke="#3E3E45" strokeWidth="0.8" />
            <line x1="720" y1="50" x2="1090" y2="600" stroke="#3E3E45" strokeWidth="0.8" />
            <line x1="720" y1="50" x2="1340" y2="600" stroke="#232327" strokeWidth="1" />
          </svg>
        </div>
        <div className="cs-footer-ambient-glow" />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="cs-shunya-title">
            CARDSPLIT
          </h2>
          <p className="cs-shunya-sub">
            UNLOCK CARD OFFERS · ACCELERATE MILESTONES · SETTLE VIA UPI
          </p>
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', color: '#63636E' }}>
            <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('/login') }} style={{ color: '#9A9AA6', textDecoration: 'none' }}>Log In</a>
            <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('/signup') }} style={{ color: '#9A9AA6', textDecoration: 'none' }}>Create Account</a>
            <a href="/circles" onClick={(e) => { e.preventDefault(); onNavigate('/circles') }} style={{ color: '#9A9AA6', textDecoration: 'none' }}>Friends & Circles</a>
            <a href="/dashboard" onClick={(e) => { e.preventDefault(); onNavigate('/dashboard') }} style={{ color: '#9A9AA6', textDecoration: 'none' }}>Workspace Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

