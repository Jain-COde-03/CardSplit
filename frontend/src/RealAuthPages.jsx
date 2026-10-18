import React, { useState, useEffect, useRef } from 'react'
import './CardsplitAuth.css'

const rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1').trim()
const formattedBase = /^https?:\/\//i.test(rawBase) ? rawBase : `https://${rawBase}`
const apiBase = (formattedBase.includes('/api/v1') ? formattedBase : `${formattedBase.replace(/\/$/, '')}/api/v1`).replace(/\/$/, '')
const demoPassword = 'BridgeDemo2026!'

// Featured quick personas with rich attributes
const FEATURED_PERSONAS = [
  {
    id: 'mira',
    name: 'Mira Kapoor',
    email: 'mira@cardbridge.test',
    role: 'Shopper · ₹24.8k Saved',
    city: 'Bengaluru',
    emoji: '🛍️',
  },
  {
    id: 'aarav',
    name: 'Aarav Sharma',
    email: 'aarav@cardbridge.test',
    role: 'HDFC Infinia Metal',
    city: 'Mumbai',
    emoji: '💳',
  },
  {
    id: 'dev',
    name: 'Dev Malhotra',
    email: 'dev@cardbridge.test',
    role: 'ICICI Emeralde Private',
    city: 'Pune',
    emoji: '✨',
  },
  {
    id: 'kabir',
    name: 'Kabir Shah',
    email: 'member02@cardbridge.test',
    role: 'SBI Cashback Card',
    city: 'Mumbai',
    emoji: '⚡',
  },
]

// Complete directory of 25 demo accounts
const ALL_DEMO_ACCOUNTS = [
  ['Mira Kapoor', 'mira@cardbridge.test', 'Bengaluru · Shopper'],
  ['Aarav Sharma', 'aarav@cardbridge.test', 'Mumbai · HDFC Infinia'],
  ['Dev Malhotra', 'dev@cardbridge.test', 'Pune · ICICI Emeralde'],
  ['Ananya Rao', 'member01@cardbridge.test', 'Bengaluru · HDFC Millennia'],
  ['Kabir Shah', 'member02@cardbridge.test', 'Mumbai · SBI Cashback'],
  ['Isha Nair', 'member03@cardbridge.test', 'Kochi · Amazon Pay ICICI'],
  ['Rohan Mehta', 'member04@cardbridge.test', 'Delhi · Axis ACE'],
  ['Zoya Khan', 'member05@cardbridge.test', 'Hyderabad · HDFC Regalia'],
  ['Arjun Iyer', 'member06@cardbridge.test', 'Chennai · SBI Cashback'],
  ['Meera Joshi', 'member07@cardbridge.test', 'Pune · Kotak League'],
  ['Vivaan Das', 'member08@cardbridge.test', 'Kolkata · Axis ACE'],
  ['Tara Menon', 'member09@cardbridge.test', 'Bengaluru · ICICI Coral'],
  ['Aditya Verma', 'member10@cardbridge.test', 'Noida · HDFC Millennia'],
  ['Sana Ali', 'member11@cardbridge.test', 'Jaipur · SBI SimplyCLICK'],
  ['Ishaan Bose', 'member12@cardbridge.test', 'Mumbai · Axis Atlas'],
  ['Diya Kapoor', 'member13@cardbridge.test', 'Hyderabad · Amazon Pay ICICI'],
  ['Reyansh Gupta', 'member14@cardbridge.test', 'Lucknow · Kotak Mojo'],
  ['Kiara Reddy', 'member15@cardbridge.test', 'Chennai · HDFC Millennia'],
  ['Ayaan Sethi', 'member16@cardbridge.test', 'Chandigarh · SBI Cashback'],
  ['Myra Kulkarni', 'member17@cardbridge.test', 'Pune · Axis ACE'],
  ['Neil D’Souza', 'member18@cardbridge.test', 'Goa · ICICI Coral'],
  ['Pari Bansal', 'member19@cardbridge.test', 'Ahmedabad · HDFC Regalia'],
  ['Devika Pillai', 'member20@cardbridge.test', 'Kochi · SBI SimplyCLICK'],
  ['Kian Thomas', 'member21@cardbridge.test', 'Bengaluru · Kotak League'],
  ['Aditi Chawla', 'member22@cardbridge.test', 'Gurugram · Axis ACE'],
]

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

async function postJson(path, body) {
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(`Cannot reach backend server at ${apiBase}. If using Render free tier, please wait ~30 seconds for the service to wake up, then retry.`)
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error(`Server returned unexpected response (${response.status} ${response.statusText}).`)
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || 'The request could not be completed.')
  }
  return payload.data
}

export function RealAuthPage({ mode = 'login' }) {
  const signup = mode === 'signup'
  const forgot = mode === 'forgot'
  const reset = mode === 'reset'
  const verify = mode === 'verify'

  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Form inputs
  const [loginEmail, setLoginEmail] = useState(FEATURED_PERSONAS[0].email)
  const [loginPassword, setLoginPassword] = useState(demoPassword)
  const [selectedPersonaName, setSelectedPersonaName] = useState(FEATURED_PERSONAS[0].name)
  const [isPhoneMode, setIsPhoneMode] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(true)

  // Generative Pixel/Terrain Canvas Ref
  const canvasRef = useRef(null)

  // Generative Interactive Pixel Canvas (Identical to CardSplit LoginPage)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = 0
    let height = 0

    const updateSize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    const mouse = {
      x: width * 0.5,
      y: height * 0.5,
      targetX: width * 0.5,
      targetY: height * 0.5,
      isHovered: false,
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.targetX = e.clientX - rect.left
      mouse.targetY = e.clientY - rect.top
      mouse.isHovered = true
    }

    const handleMouseLeave = () => {
      mouse.isHovered = false
      mouse.targetX = width * 0.5
      mouse.targetY = height * 0.5
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    let time = 0

    const render = () => {
      time += 0.015

      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      ctx.fillStyle = '#0E0E10'
      ctx.fillRect(0, 0, width, height)

      const blockSize = 14
      const cols = Math.ceil(width / blockSize)
      const rows = Math.ceil(height / blockSize)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * blockSize
          const y = j * blockSize

          const dx = x - mouse.x
          const dy = y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          const wave1 = Math.sin(i * 0.08 + time * 0.8) * Math.cos(j * 0.08 + time * 0.6)
          const wave2 = Math.sin((i + j) * 0.05 - time * 0.5)
          const wave3 = Math.cos(Math.sqrt((i - cols / 2) ** 2 + (j - rows / 2) ** 2) * 0.08 - time)

          const mouseElevation = mouse.isHovered
            ? Math.max(0, 1 - dist / 200) * 1.8
            : Math.max(0, 1 - dist / 260) * 0.8

          const elevation = (wave1 + wave2 * 0.5 + wave3 * 0.4 + mouseElevation + 2.2) / 4.9

          if (elevation > 0.78) {
            ctx.fillStyle = '#F2F2F5'
          } else if (elevation > 0.62) {
            ctx.fillStyle = '#C9C9D2'
          } else if (elevation > 0.48) {
            ctx.fillStyle = '#63636E'
          } else if (elevation > 0.35) {
            ctx.fillStyle = '#3E3E45'
          } else if (elevation > 0.22) {
            ctx.fillStyle = '#232327'
          } else {
            ctx.fillStyle = '#141416'
          }

          ctx.fillRect(x, y, blockSize - 1, blockSize - 1)
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', updateSize)
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  // Quick Persona Select handler
  function selectPersona(persona) {
    setLoginEmail(persona.email)
    setLoginPassword(demoPassword)
    setSelectedPersonaName(persona.name)
    setError('')
    setNotice('')
  }

  // 1-Tap Quick Login execution
  async function executeQuickLogin(emailToUse) {
    setBusy(true)
    setError('')
    setNotice(`Signing in as ${selectedPersonaName || emailToUse}...`)

    try {
      const data = await postJson('/auth/login', {
        email: emailToUse || loginEmail,
        password: demoPassword,
      })
      window.sessionStorage.setItem('cardbridge:csrfToken', data.csrfToken)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  // Standard Form Submit handler
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    setError('')
    const form = new FormData(event.currentTarget)

    try {
      if (signup) {
        await postJson('/auth/register', {
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
        })
        setNotice('Check your inbox for a verification link. You can sign in after verifying your email.')
      } else if (forgot) {
        await postJson('/auth/password-reset/request', { email: form.get('email') })
        setNotice('If that email belongs to a verified account, a password reset link is on its way.')
      } else if (reset) {
        const token = new URLSearchParams(window.location.search).get('token') || ''
        await postJson('/auth/password-reset', { token, password: form.get('password') })
        setNotice('Your password has been changed. Please log in again.')
      } else {
        const emailToSubmit = isPhoneMode ? `${phoneNumber.replace(/\D/g, '')}@cardbridge.test` : (form.get('email') || loginEmail)
        const passwordToSubmit = form.get('password') || loginPassword

        const data = await postJson('/auth/login', {
          email: emailToSubmit,
          password: passwordToSubmit,
        })
        window.sessionStorage.setItem('cardbridge:csrfToken', data.csrfToken)
        navigate('/dashboard')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function handleSocialLogin(provider) {
    // For demo convenience, log in as Mira Kapoor or Aarav Sharma
    executeQuickLogin('mira@cardbridge.test')
  }

  const title = signup
    ? 'Create your account'
    : forgot
      ? 'Reset your password'
      : reset
        ? 'Choose a new password'
        : 'Log into your account'

  const subtitle = signup
    ? 'Create a real account to list cards and opt in to cardholder discovery.'
    : forgot
      ? 'We’ll email you a secure recovery link.'
      : reset
        ? 'Use at least 12 characters for your new password.'
        : 'Select any profile below for 1-tap sign in, or enter your credentials.'

  return (
    <div className="cs-auth-page">
      {/* Top Left Navigation: Back to Home */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="cs-auth-back-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
        </svg>
        <span>Back to Home</span>
      </button>

      {/* LEFT HALF: 100% Fully Covered Interactive Generative Canvas */}
      <div className="cs-auth-canvas-side">
        <canvas ref={canvasRef} className="cs-auth-canvas" />
        <div className="cs-canvas-overlay">
          <span className="cs-canvas-caption-eyebrow">CARDSPLIT · SECURE ACCESS</span>
          <h2 className="cs-canvas-caption-title">Your cards.<br/>Your advantages.</h2>
          <p className="cs-canvas-caption-desc">
            Experience private circles, verified bank discounts, and zero-fee UPI ledger settlements.
          </p>
        </div>
      </div>

      {/* RIGHT HALF: Obsidian Dark Form with User Switcher */}
      <div className="cs-auth-form-side">
        <div className="cs-auth-bg-grid" />
        <div className="cs-auth-radial-glow" />

        <div className="cs-auth-form-wrap">
          {/* Brand Symbol */}
          <div className="cs-auth-brand-symbol">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>

          <h1 className="cs-auth-title">{title}</h1>
          <p className="cs-auth-subtitle">{subtitle}</p>

          {/* USER SWITCHER CARD (Available on Login Mode) */}
          {!signup && !forgot && !reset && !verify && (
            <div className="cs-user-switcher-card">
              <div className="cs-switcher-header">
                <span className="cs-switcher-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>SELECT A PROFILE TO LOGIN</span>
                </span>
                <span className="cs-switcher-pill-count">25 Profiles</span>
              </div>

              {/* 4 Quick Persona Capsules */}
              <div className="cs-persona-grid">
                {FEATURED_PERSONAS.map((persona) => {
                  const isSelected = loginEmail === persona.email
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      className={`cs-persona-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectPersona(persona)}
                    >
                      <span className="cs-persona-emoji">{persona.emoji}</span>
                      <div className="cs-persona-info">
                        <span className="cs-persona-name">{persona.name}</span>
                        <span className="cs-persona-role">{persona.role}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Full Dropdown of all 25 profiles */}
              <div className="cs-persona-dropdown-wrap">
                <select
                  className="cs-persona-dropdown"
                  value={loginEmail}
                  onChange={(e) => {
                    const matched = ALL_DEMO_ACCOUNTS.find((acc) => acc[1] === e.target.value)
                    setLoginEmail(e.target.value)
                    setLoginPassword(demoPassword)
                    if (matched) setSelectedPersonaName(matched[0])
                  }}
                >
                  <option value="" disabled>Or choose from all 25 demo members...</option>
                  {ALL_DEMO_ACCOUNTS.map(([name, email, note]) => (
                    <option key={email} value={email}>
                      {name} ({email}) — {note}
                    </option>
                  ))}
                </select>
                <span className="cs-dropdown-arrow">▼</span>
              </div>

              {/* 1-Tap Quick Login Button for Selected User */}
              <button
                type="button"
                className="cs-quick-login-btn"
                disabled={busy}
                onClick={() => executeQuickLogin(loginEmail)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>1-Tap Sign In as {selectedPersonaName.split(' ')[0]} ➔</span>
              </button>
            </div>
          )}

          {/* SOCIAL AUTH BUTTONS (CardSplit exact layout) */}
          {!signup && !forgot && !reset && !verify && (
            <>
              <div className="cs-social-auth-grid">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  className="cs-social-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Microsoft */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Microsoft')}
                  className="cs-social-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                    <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                    <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                    <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                  </svg>
                  <span>Continue with Microsoft</span>
                </button>

                {/* Phone Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPhoneMode(!isPhoneMode)}
                  className="cs-social-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                    <path d="M12 18h.01"/>
                  </svg>
                  <span>{isPhoneMode ? 'Use Email instead' : 'Continue with Phone Number'}</span>
                </button>
              </div>

              {/* OR Divider */}
              <div className="cs-auth-divider">
                <div className="cs-auth-divider-line" />
                <span className="cs-auth-divider-text">OR CREDENTIALS</span>
                <div className="cs-auth-divider-line" />
              </div>
            </>
          )}

          {/* MAIN CREDENTIALS FORM */}
          {verify ? (
            <EmailVerification notice={notice} error={error} setNotice={setNotice} setError={setError} />
          ) : (
            <form onSubmit={submit} className="cs-auth-form">
              {signup && (
                <div>
                  <label style={{ fontSize: '11px', color: '#9A9AA6', marginBottom: '6px', display: 'block', textTransform: 'uppercase', font: '10px var(--mono)' }}>Full name</label>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    maxLength="100"
                    placeholder="Your legal name"
                    className="cs-auth-input-field"
                  />
                </div>
              )}

              {!reset && !isPhoneMode && (
                <div>
                  <label style={{ fontSize: '11px', color: '#9A9AA6', marginBottom: '6px', display: 'block', textTransform: 'uppercase', font: '10px var(--mono)' }}>Email address</label>
                  <input
                    name="email"
                    required
                    type="email"
                    autoComplete="email"
                    maxLength="254"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="cs-auth-input-field"
                  />
                </div>
              )}

              {!reset && isPhoneMode && (
                <div>
                  <label style={{ fontSize: '11px', color: '#9A9AA6', marginBottom: '6px', display: 'block', textTransform: 'uppercase', font: '10px var(--mono)' }}>Phone number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="cs-auth-input-field"
                  />
                </div>
              )}

              {!forgot && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#9A9AA6', textTransform: 'uppercase', font: '10px var(--mono)' }}>
                      {reset ? 'New password' : 'Password'}
                    </label>
                    {!signup && !reset && (
                      <a
                        href="/forgot-password"
                        onClick={(e) => { e.preventDefault(); navigate('/forgot-password') }}
                        style={{ fontSize: '11px', color: '#9A9AA6', textDecoration: 'none' }}
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <input
                    name="password"
                    required
                    type="password"
                    autoComplete={signup || reset ? 'new-password' : 'current-password'}
                    minLength={signup || reset ? 12 : 1}
                    maxLength="128"
                    placeholder={signup || reset ? 'At least 12 characters' : 'Enter password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="cs-auth-input-field"
                  />
                </div>
              )}

              {/* Terms checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#9A9AA6', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#10B981' }}
                />
                <span>I accept the terms of service and privacy policy</span>
              </label>

              {/* Submit button */}
              <button
                type="submit"
                disabled={busy}
                className="cs-auth-submit-btn"
              >
                <span>{busy ? 'Processing…' : signup ? 'Create Account ➔' : forgot ? 'Send Reset Link ➔' : reset ? 'Save New Password ➔' : 'Sign In ➔'}</span>
              </button>

              {error && <div className="cs-auth-error-alert">{error}</div>}
              {notice && <div className="cs-auth-notice-alert">{notice}</div>}
            </form>
          )}

          {/* Bottom Switch Links */}
          <div className="cs-auth-footer-links">
            {signup ? (
              <span>Already have an account? <button type="button" onClick={() => navigate('/login')}>Log in</button></span>
            ) : reset || forgot ? (
              <button type="button" onClick={() => navigate('/login')}>← Back to login</button>
            ) : (
              <span>New to CardSplit? <button type="button" onClick={() => navigate('/signup')}>Create an account</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailVerification({ notice, error, setNotice, setError }) {
  const [busy, setBusy] = useState(false)

  async function verifyEmail() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const token = new URLSearchParams(window.location.search).get('token') || ''
      await postJson('/auth/verify-email', { token })
      setNotice('Email verified. You can now log in.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <p style={{ color: '#9A9AA6', fontSize: '13px', marginBottom: '20px' }}>
        Verify the email address you used when creating your account.
      </p>
      <button
        type="button"
        className="cs-auth-submit-btn"
        onClick={verifyEmail}
        disabled={busy}
      >
        {busy ? 'Verifying…' : 'Verify Email ➔'}
      </button>
      {error && <div className="cs-auth-error-alert">{error}</div>}
      {notice && <div className="cs-auth-notice-alert">{notice}</div>}
    </div>
  )
}
