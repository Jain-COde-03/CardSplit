import { useState, useEffect } from 'react'

const INITIAL_CIRCLES = [
  {
    id: 'circle-1',
    name: 'Hostel Gang',
    type: 'Hostel Gang',
    description: 'IITB Roommates & wing mates sharing prime credit card perks on electronics & travel.',
    inviteCode: 'HOS-942B',
    memberCount: 4,
    totalSaved: 34800,
    members: [
      { id: 'm1', name: 'Aman Singhania', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', trustTier: 'friend', card: 'HDFC Infinia (•••• 4092)', vouchedCount: 3 },
      { id: 'm2', name: 'Rohan Deshmukh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', trustTier: 'friend', card: 'ICICI Emeralde (•••• 6239)', vouchedCount: 4 },
      { id: 'm3', name: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80', trustTier: 'friend_of_friend', card: 'SBI Cashback (•••• 1834)', vouchedCount: 2 },
      { id: 'm4', name: 'Vikram Malhotra', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', trustTier: 'friend', card: 'Axis Atlas (•••• 4108)', vouchedCount: 3 },
    ],
  },
  {
    id: 'circle-2',
    name: 'Deshmukh Family',
    type: 'Family',
    description: 'Immediate family circle for joint groceries, appliance purchases, and flight bookings.',
    inviteCode: 'FAM-2210',
    memberCount: 3,
    totalSaved: 19500,
    members: [
      { id: 'm2', name: 'Rohan Deshmukh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', trustTier: 'friend', card: 'ICICI Emeralde (•••• 6239)', vouchedCount: 5 },
      { id: 'm5', name: 'Sunita Deshmukh', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', trustTier: 'friend', card: 'Axis Magnus (•••• 7712)', vouchedCount: 2 },
    ],
  },
  {
    id: 'circle-3',
    name: 'Indiranagar Techies',
    type: 'Office',
    description: 'Coworkers and startup founders sharing card milestones and lounge benefits.',
    inviteCode: 'OFF-883A',
    memberCount: 6,
    totalSaved: 52000,
    members: [
      { id: 'm1', name: 'Aman Singhania', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', trustTier: 'friend', card: 'HDFC Infinia (•••• 4092)', vouchedCount: 4 },
      { id: 'm4', name: 'Vikram Malhotra', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', trustTier: 'friend', card: 'Axis Atlas (•••• 4108)', vouchedCount: 3 },
    ],
  },
]

const INITIAL_REQUESTS = [
  {
    id: 'req-1',
    circleId: 'circle-1',
    shopperName: 'Priya Sharma',
    shopperAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    productTitle: 'Apple iPhone 16 (128 GB) - Teal',
    merchant: 'Amazon.in',
    requiredBank: 'HDFC Bank',
    orderAmount: 79900,
    instantDiscount: 5000,
    netPayable: 74900,
    status: 'open',
    trustTier: 'friend',
    createdAt: '10 mins ago',
  },
  {
    id: 'req-2',
    circleId: 'circle-1',
    shopperName: 'Vikram Malhotra',
    shopperAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    productTitle: 'Sony WH-1000XM5 Wireless Headphones',
    merchant: 'Flipkart',
    requiredBank: 'ICICI Bank',
    orderAmount: 26990,
    instantDiscount: 2500,
    netPayable: 24490,
    status: 'accepted',
    acceptedByName: 'Rohan Deshmukh',
    acceptedByCard: 'ICICI Emeralde',
    trustTier: 'friend',
    createdAt: '1 hour ago',
  },
  {
    id: 'req-3',
    circleId: 'circle-1',
    shopperName: 'Aman Singhania',
    shopperAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    productTitle: 'MacBook Pro 14" M3 (512GB, Space Black)',
    merchant: 'Croma',
    requiredBank: 'ICICI Bank',
    orderAmount: 169900,
    instantDiscount: 6000,
    netPayable: 163900,
    status: 'open',
    trustTier: 'friend',
    createdAt: '2 hours ago',
  },
]

const INITIAL_LEDGER = [
  {
    id: 'led-1',
    circleId: 'circle-1',
    fromUserName: 'Vikram Malhotra',
    toUserName: 'Rohan Deshmukh',
    amount: 24490,
    discountSaved: 2500,
    description: 'Sony WH-1000XM5 (ICICI 10% Instant Off)',
    status: 'pending',
    date: 'Today, 5:40 PM',
    upiId: 'rohan.deshmukh@okicici',
  },
  {
    id: 'led-2',
    circleId: 'circle-1',
    fromUserName: 'Priya Sharma',
    toUserName: 'Aman Singhania',
    amount: 54000,
    discountSaved: 6000,
    description: 'iPad Air M2 + Pencil (HDFC SmartBuy)',
    status: 'settled',
    date: 'Yesterday, 8:15 PM',
    upiId: 'aman@oksbi',
    upiRef: 'UPI-774921',
  },
]

export default function CirclesFriendsView({ currentUser, userCards, apiBase, csrfToken }) {
  const [circles, setCircles] = useState(INITIAL_CIRCLES)
  const [activeCircleId, setActiveCircleId] = useState('circle-1')
  const [activeTab, setActiveTab] = useState('requests') // 'requests' | 'cardholders' | 'ledger' | 'trust'
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [ledger, setLedger] = useState(INITIAL_LEDGER)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showPostRequestModal, setShowPostRequestModal] = useState(false)
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [activeSettleEntry, setActiveSettleEntry] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)

  // Form states
  const [newCircleName, setNewCircleName] = useState('')
  const [newCircleType, setNewCircleType] = useState('Family')
  const [newCircleDesc, setNewCircleDesc] = useState('')
  const [joinCodeInput, setJoinCodeInput] = useState('')
  
  // Request Form
  const [reqProductTitle, setReqProductTitle] = useState('Apple iPhone 16 (128 GB)')
  const [reqMerchant, setReqMerchant] = useState('Amazon.in')
  const [reqRequiredBank, setReqRequiredBank] = useState('HDFC Bank')
  const [reqOrderAmount, setReqOrderAmount] = useState(79900)
  const [reqInstantDiscount, setReqInstantDiscount] = useState(5000)
  const [reqTrustTier, setReqTrustTier] = useState('friend')

  // Card Controls
  const [cardMonthlyCap, setCardMonthlyCap] = useState(25000)
  const [approveEachRequest, setApproveEachRequest] = useState(true)
  const [selectedAllowedCircles, setSelectedAllowedCircles] = useState(['circle-1', 'circle-2'])

  const activeCircle = circles.find((c) => c.id === activeCircleId) || circles[0]
  const circleRequests = requests.filter((r) => r.circleId === activeCircle.id)
  const circleLedger = ledger.filter((l) => l.circleId === activeCircle.id)

  // Ledger Summary
  const userOwes = circleLedger
    .filter((e) => e.status === 'pending' && e.fromUserName.includes(currentUser?.name?.split(' ')[0] || 'You'))
    .reduce((sum, e) => sum + e.amount, 0)
  const userIsOwed = circleLedger
    .filter((e) => e.status === 'pending' && e.toUserName.includes(currentUser?.name?.split(' ')[0] || 'Rohan'))
    .reduce((sum, e) => sum + e.amount, 0)
  const totalCircleSavings = circleLedger.reduce((sum, e) => sum + e.discountSaved, 0) + activeCircle.totalSaved

  // 1. Create Circle Handler
  function handleCreateCircle(e) {
    e.preventDefault()
    if (!newCircleName.trim()) return

    const prefix = newCircleType.slice(0, 3).toUpperCase()
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase()
    const inviteCode = `${prefix}-${randomHex}`

    const newCircle = {
      id: `circle-${Date.now()}`,
      name: newCircleName.trim(),
      type: newCircleType,
      description: newCircleDesc.trim() || `${newCircleType} circle for sharing trusted card discounts.`,
      inviteCode,
      memberCount: 1,
      totalSaved: 0,
      members: [
        {
          id: currentUser?._id || 'cur-user',
          name: currentUser?.name || 'You',
          avatar: currentUser?.profile?.avatarUrl || '',
          trustTier: 'friend',
          card: 'Your Listed Cards',
          vouchedCount: 1,
        },
      ],
    }

    setCircles([newCircle, ...circles])
    setActiveCircleId(newCircle.id)
    setShowCreateModal(false)
    setNewCircleName('')
    setNewCircleDesc('')
  }

  // 2. Join Circle Handler
  function handleJoinCircle(e) {
    e.preventDefault()
    const code = joinCodeInput.trim().toUpperCase()
    if (!code) return

    const found = circles.find((c) => c.inviteCode === code)
    if (found) {
      setActiveCircleId(found.id)
      setShowJoinModal(false)
      setJoinCodeInput('')
    } else {
      // Simulate joining a new circle
      const joinedCircle = {
        id: `circle-joined-${Date.now()}`,
        name: `Circle (${code})`,
        type: 'General',
        description: 'Joined via invite link / QR code.',
        inviteCode: code,
        memberCount: 5,
        totalSaved: 12000,
        members: [
          { id: 'm1', name: 'Aman Singhania', trustTier: 'friend', vouchedCount: 3 },
          { id: 'cur', name: currentUser?.name || 'You', trustTier: 'friend', vouchedCount: 1 },
        ],
      }
      setCircles([joinedCircle, ...circles])
      setActiveCircleId(joinedCircle.id)
      setShowJoinModal(false)
      setJoinCodeInput('')
    }
  }

  // 3. Post Request Handler
  function handlePostRequest(e) {
    e.preventDefault()
    const newReq = {
      id: `req-${Date.now()}`,
      circleId: activeCircle.id,
      shopperName: `${currentUser?.name || 'You'}`,
      shopperAvatar: currentUser?.profile?.avatarUrl || '',
      productTitle: reqProductTitle.trim(),
      merchant: reqMerchant,
      requiredBank: reqRequiredBank,
      orderAmount: Number(reqOrderAmount),
      instantDiscount: Number(reqInstantDiscount),
      netPayable: Number(reqOrderAmount) - Number(reqInstantDiscount),
      status: 'open',
      trustTier: reqTrustTier,
      createdAt: 'Just now',
    }

    setRequests([newReq, ...requests])
    setShowPostRequestModal(false)
  }

  // 4. Accept Request: "I can do this"
  function handleAcceptRequest(reqId) {
    const updated = requests.map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'accepted',
          acceptedByName: currentUser?.name || 'Rohan Deshmukh',
          acceptedByCard: 'ICICI Emeralde Metal',
        }
      }
      return r
    })
    setRequests(updated)

    const acceptedReq = requests.find((r) => r.id === reqId)
    if (acceptedReq) {
      const newLedgerEntry = {
        id: `led-${Date.now()}`,
        circleId: activeCircle.id,
        fromUserName: acceptedReq.shopperName,
        toUserName: currentUser?.name || 'Rohan Deshmukh',
        amount: acceptedReq.netPayable,
        discountSaved: acceptedReq.instantDiscount,
        description: `${acceptedReq.productTitle} (${acceptedReq.requiredBank})`,
        status: 'pending',
        date: 'Just now',
        upiId: 'rohan.deshmukh@okicici',
      }
      setLedger([newLedgerEntry, ...ledger])
    }
  }

  // 5. One-tap Settle Handler
  function handleSettle(entryId) {
    setLedger(
      ledger.map((e) =>
        e.id === entryId
          ? {
              ...e,
              status: 'settled',
              settledAt: new Date().toISOString(),
              upiRef: `UPI-${Math.floor(100000 + Math.random() * 900000)}`,
            }
          : e
      )
    )
    setShowSettleModal(false)
  }

  // 6. Vouch Member
  function handleVouch(memberId) {
    const updatedCircles = circles.map((c) => {
      if (c.id === activeCircle.id && c.members) {
        return {
          ...c,
          members: c.members.map((m) =>
            m.id === memberId ? { ...m, vouchedCount: (m.vouchedCount || 0) + 1 } : m
          ),
        }
      }
      return c
    })
    setCircles(updatedCircles)
  }

  return (
    <div className="circle-hub-container">
      {/* 1. TOP CIRCLE SELECTOR & QUICK ACTIONS */}
      <div className="circle-selector-bar">
        {circles.map((circle) => {
          const isActive = circle.id === activeCircle.id
          return (
            <button
              key={circle.id}
              type="button"
              onClick={() => setActiveCircleId(circle.id)}
              className={`circle-tab-btn ${isActive ? 'active' : ''}`}
            >
              <span className="circle-type-tag">{circle.type}</span>
              <span>{circle.name}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="circle-tab-btn"
          style={{ borderStyle: 'dashed', color: '#F2F2F5' }}
        >
          <span>+ Create Circle</span>
        </button>

        <button
          type="button"
          onClick={() => setShowJoinModal(true)}
          className="circle-tab-btn"
          style={{ marginLeft: 'auto' }}
        >
          <span>Join via Code / QR</span>
        </button>
      </div>

      {/* 2. ACTIVE CIRCLE HERO BANNER */}
      <div className="circle-hero-card">
        <div className="circle-hero-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="circle-type-tag">{activeCircle.type} Circle</span>
              <span style={{ font: '11px var(--mono)', color: '#63636E' }}>Invite Code: {activeCircle.inviteCode}</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#F2F2F5', margin: 0, letterSpacing: '-0.03em' }}>
              {activeCircle.name}
            </h2>
            <p style={{ fontSize: '13px', color: '#9A9AA6', margin: '6px 0 0', maxWidth: '650px' }}>
              {activeCircle.description}
            </p>
          </div>

          <div className="circle-hero-actions">
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="button-outline-light"
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="5" height="5" x="3" y="3" rx="1"/>
                <rect width="5" height="5" x="16" y="3" rx="1"/>
                <rect width="5" height="5" x="3" y="16" rx="1"/>
                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
              </svg>
              <span>Invite via Link / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPostRequestModal(true)}
              className="button-dark"
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              <span>+ Post Request</span>
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #2E2E33' }}>
          <div>
            <span style={{ font: '10px var(--mono)', color: '#63636E', textTransform: 'uppercase' }}>MEMBERS</span>
            <b style={{ display: 'block', fontSize: '18px', color: '#F2F2F5', fontFamily: 'var(--mono)' }}>
              {activeCircle.members?.length || activeCircle.memberCount}
            </b>
          </div>
          <div>
            <span style={{ font: '10px var(--mono)', color: '#63636E', textTransform: 'uppercase' }}>TOTAL SAVINGS</span>
            <b style={{ display: 'block', fontSize: '18px', color: '#10B981', fontFamily: 'var(--mono)' }}>
              ₹{totalCircleSavings.toLocaleString('en-IN')}
            </b>
          </div>
          <div>
            <span style={{ font: '10px var(--mono)', color: '#63636E', textTransform: 'uppercase' }}>ACTIVE REQUESTS</span>
            <b style={{ display: 'block', fontSize: '18px', color: '#F2F2F5', fontFamily: 'var(--mono)' }}>
              {circleRequests.filter((r) => r.status === 'open').length} Open
            </b>
          </div>
          <div>
            <span style={{ font: '10px var(--mono)', color: '#63636E', textTransform: 'uppercase' }}>SETTLEMENT STATUS</span>
            <b style={{ display: 'block', fontSize: '18px', color: userIsOwed > 0 ? '#10B981' : '#F2F2F5', fontFamily: 'var(--mono)' }}>
              {userIsOwed > 0 ? `+₹${userIsOwed.toLocaleString('en-IN')} Owed` : 'All Clear'}
            </b>
          </div>
        </div>
      </div>

      {/* 3. FOUR CORE SUB-TABS */}
      <div className="circle-subnav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`circle-subnav-btn ${activeTab === 'requests' ? 'active' : ''}`}
        >
          <span>📋 Request Board ({circleRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`circle-subnav-btn ${activeTab === 'ledger' ? 'active' : ''}`}
        >
          <span>📊 Shared Ledger ({circleLedger.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cardholders')}
          className={`circle-subnav-btn ${activeTab === 'cardholders' ? 'active' : ''}`}
        >
          <span>💳 Circle Cards & Controls</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trust')}
          className={`circle-subnav-btn ${activeTab === 'trust' ? 'active' : ''}`}
        >
          <span>🤝 Trust Tiers & Vouching</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: REQUEST BOARD
          ========================================================================= */}
      {activeTab === 'requests' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#F2F2F5', margin: 0 }}>
                Live Circle Requests
              </h3>
              <p style={{ fontSize: '12px', color: '#9A9AA6', margin: '2px 0 0' }}>
                Circle shoppers looking for matching cards. Tap “I can do this” if you have the card!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPostRequestModal(true)}
              className="button-dark"
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              + Post New Request
            </button>
          </div>

          <div className="request-board-grid">
            {circleRequests.map((req) => (
              <div key={req.id} className="request-board-card">
                <div>
                  <div className="request-shopper-row">
                    <div className="request-shopper-info">
                      <img
                        src={req.shopperAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                        alt={req.shopperName}
                        className="request-shopper-avatar"
                      />
                      <div>
                        <b style={{ fontSize: '13px', color: '#F2F2F5', display: 'block' }}>{req.shopperName}</b>
                        <small style={{ fontSize: '10px', color: '#63636E', fontFamily: 'var(--mono)' }}>{req.createdAt}</small>
                      </div>
                    </div>

                    <span className={`trust-tier-badge ${req.trustTier || 'friend'}`}>
                      {req.trustTier === 'friend' ? '🟢 Friend' : req.trustTier === 'friend_of_friend' ? '🟡 Peer' : '⚪ Stranger'}
                    </span>
                  </div>

                  <h4 className="request-product-title">
                    {req.productTitle}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#9A9AA6', fontFamily: 'var(--mono)' }}>
                    Store: {req.merchant} · Required: <b style={{ color: '#F2F2F5' }}>{req.requiredBank}</b>
                  </span>

                  <div className="request-details-box">
                    <div className="request-details-row">
                      <span>Order Value:</span>
                      <b>₹{req.orderAmount.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="request-details-row discount-row">
                      <span>Instant Discount:</span>
                      <b>-₹{req.instantDiscount.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="request-details-row" style={{ paddingTop: '6px', borderTop: '1px solid #1F1F23' }}>
                      <span style={{ fontWeight: 600 }}>Net To Pay:</span>
                      <b style={{ color: '#F2F2F5', fontSize: '13px' }}>₹{req.netPayable.toLocaleString('en-IN')}</b>
                    </div>
                  </div>
                </div>

                {req.status === 'open' ? (
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(req.id)}
                    className="btn-i-can-do-this"
                  >
                    <span>I can do this (Use my card) ➔</span>
                  </button>
                ) : (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ font: '11px var(--mono)', color: '#34D399', fontWeight: 600 }}>
                      ✓ Accepted by {req.acceptedByName}
                    </span>
                    <small style={{ display: 'block', fontSize: '10px', color: '#63636E', marginTop: '2px' }}>
                      Card: {req.acceptedByCard}
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SHARED LEDGER (Splitwise-style)
          ========================================================================= */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'grid', gap: '18px' }}>
          {/* BALANCE METRICS */}
          <div className="ledger-summary-strip">
            <div className="ledger-balance-card">
              <span>YOU ARE OWED</span>
              <b style={{ color: '#10B981' }}>+₹{userIsOwed.toLocaleString('en-IN')}</b>
              <small style={{ fontSize: '11px', color: '#63636E' }}>From circle purchases you paid for</small>
            </div>
            <div className="ledger-balance-card">
              <span>YOU OWE</span>
              <b style={{ color: userOwes > 0 ? '#F87171' : '#F2F2F5' }}>
                ₹{userOwes.toLocaleString('en-IN')}
              </b>
              <small style={{ fontSize: '11px', color: '#63636E' }}>Pending settlement to cardholders</small>
            </div>
            <div className="ledger-balance-card">
              <span>SHARED CIRCLE SAVINGS</span>
              <b style={{ color: '#F2F2F5' }}>₹{totalCircleSavings.toLocaleString('en-IN')}</b>
              <small style={{ fontSize: '11px', color: '#63636E' }}>Total discount kept inside this circle</small>
            </div>
          </div>

          {/* LEDGER ENTRIES */}
          <div style={{ background: '#121214', border: '1px solid #2E2E33', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F1F23', background: '#151518', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F2F2F5', margin: 0 }}>
                Circle Ledger Entries
              </h3>
              <span style={{ font: '11px var(--mono)', color: '#9A9AA6' }}>
                Direct UPI 0-Fee Settlement
              </span>
            </div>

            {circleLedger.map((entry) => (
              <div key={entry.id} className="ledger-entry-row">
                <div className="ledger-entry-left">
                  <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#18181B', border: '1px solid #2E2E33', display: 'grid', placeItems: 'center', fontSize: '16px' }}>
                    💳
                  </span>
                  <div className="ledger-entry-info">
                    <b>{entry.description}</b>
                    <small>
                      {entry.fromUserName} owes <b>{entry.toUserName}</b> · {entry.date}
                    </small>
                  </div>
                </div>

                <div className="ledger-entry-right">
                  <div className="ledger-entry-amount">
                    <b>₹{entry.amount.toLocaleString('en-IN')}</b>
                    <small>Saved ₹{entry.discountSaved.toLocaleString('en-IN')}</small>
                  </div>

                  {entry.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSettleEntry(entry)
                        setShowSettleModal(true)
                      }}
                      className="btn-settle-upi"
                    >
                      Settle via UPI ➔
                    </button>
                  ) : (
                    <span style={{ font: '10px var(--mono)', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 10px', borderRadius: '6px' }}>
                      ✓ Settled ({entry.upiRef})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CIRCLE CARDS & VISIBILITY CONTROLS
          ========================================================================= */}
      {activeTab === 'cardholders' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#F2F2F5', margin: '0 0 4px' }}>
              Card Visibility & Sharing Controls
            </h3>
            <p style={{ fontSize: '12px', color: '#9A9AA6', margin: 0 }}>
              You control exactly who sees your card, the monthly budget per circle member, and whether approval is required.
            </p>
          </div>

          {/* CARD CONTROLS FORM */}
          <div style={{ background: '#121214', border: '1px solid #2E2E33', borderRadius: '18px', padding: '22px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F2F2F5', margin: '0 0 12px' }}>
              Your Card: ICICI Emeralde Private Metal (•••• 6239)
            </h4>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>
                  Circles With Access To This Card
                </label>
                <div className="circle-checkbox-group">
                  {circles.map((c) => (
                    <label key={c.id} className="circle-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedAllowedCircles.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAllowedCircles([...selectedAllowedCircles, c.id])
                          } else {
                            setSelectedAllowedCircles(selectedAllowedCircles.filter((id) => id !== c.id))
                          }
                        }}
                      />
                      <span>{c.name} ({c.type})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>
                    Monthly Spending Cap Per Person (₹)
                  </label>
                  <input
                    type="number"
                    value={cardMonthlyCap}
                    onChange={(e) => setCardMonthlyCap(Number(e.target.value))}
                    style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px 14px', color: '#F2F2F5', font: '13px var(--mono)' }}
                  />
                  <small style={{ color: '#63636E', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Prevents any single friend from using more than this amount each month.
                  </small>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="circle-checkbox-label" style={{ padding: '12px 14px' }}>
                    <input
                      type="checkbox"
                      checked={approveEachRequest}
                      onChange={(e) => setApproveEachRequest(e.target.checked)}
                    />
                    <div>
                      <b style={{ display: 'block', fontSize: '13px', color: '#F2F2F5' }}>Approve Each Request</b>
                      <small style={{ color: '#9A9AA6', fontSize: '11px' }}>Require your manual confirmation before deal is locked</small>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => alert('Card visibility controls updated successfully!')}
                  className="button-dark"
                  style={{ padding: '8px 18px', fontSize: '12px' }}
                >
                  Save Card Visibility Rules
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE CARDS IN THIS CIRCLE */}
          <div style={{ background: '#121214', border: '1px solid #2E2E33', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F1F23', background: '#151518' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F2F2F5', margin: 0 }}>
                Cards Available in {activeCircle.name}
              </h4>
            </div>

            {activeCircle.members?.map((m) => (
              <div key={m.id} style={{ padding: '14px 20px', borderBottom: '1px solid #1F1F23', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={m.avatar} alt={m.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #3E3E45' }}/>
                  <div>
                    <b style={{ fontSize: '13px', color: '#F2F2F5' }}>{m.card}</b>
                    <small style={{ display: 'block', fontSize: '11px', color: '#9A9AA6' }}>Held by {m.name}</small>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ font: '10px var(--mono)', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                    Active in Circle
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TRUST TIERS & VOUCHING
          ========================================================================= */}
      {activeTab === 'trust' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#F2F2F5', margin: '0 0 4px' }}>
              Trust Tiers & Community Vouching
            </h3>
            <p style={{ fontSize: '12px', color: '#9A9AA6', margin: 0 }}>
              Trust tiers automatically calibrate the protection level for every deal.
            </p>
          </div>

          {/* THREE TRUST TIERS EXPLAINER */}
          <div className="trust-tier-explainer">
            <div className="trust-tier-box" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <h4><span style={{ color: '#10B981' }}>●</span> Friend Tier (Direct)</h4>
              <p>People in your verified personal circles. <b>No escrow needed</b>; direct 0-fee settlement via UPI.</p>
            </div>
            <div className="trust-tier-box" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <h4><span style={{ color: '#F59E0B' }}>●</span> Friend-of-Friend</h4>
              <p>Connected through a mutual circle friend. <b>Light escrow</b> with delivery receipt confirmation.</p>
            </div>
            <div className="trust-tier-box" style={{ borderColor: 'rgba(148, 163, 184, 0.3)' }}>
              <h4><span style={{ color: '#94A3B8' }}>●</span> Stranger / Public</h4>
              <p>Full platform escrow with automated holding and multi-step verification.</p>
            </div>
          </div>

          {/* CIRCLE MEMBERS & VOUCHING */}
          <div style={{ background: '#121214', border: '1px solid #2E2E33', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F1F23', background: '#151518', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F2F2F5', margin: 0 }}>
                Circle Members & Vouch Counts
              </h4>
              <span style={{ font: '11px var(--mono)', color: '#9A9AA6' }}>
                Vouching raises member trust tier
              </span>
            </div>

            {activeCircle.members?.map((member) => (
              <div key={member.id} className="circle-member-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={member.avatar}
                    alt={member.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #3E3E45' }}
                  />
                  <div>
                    <b style={{ fontSize: '14px', color: '#F2F2F5', display: 'block' }}>{member.name}</b>
                    <small style={{ fontSize: '11px', color: '#9A9AA6', fontFamily: 'var(--mono)' }}>
                      Card: {member.card}
                    </small>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="vouched-indicator">
                    ✓ Vouched by {member.vouchedCount || 2} in circle
                  </span>

                  <button
                    type="button"
                    onClick={() => handleVouch(member.id)}
                    className="btn-vouch-member"
                  >
                    + Vouch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* 1. CREATE CIRCLE MODAL */}
      {showCreateModal && (
        <div className="deal-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="deal-modal-window" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="deal-modal-header">
              <h3>Create a Private Circle</h3>
              <button className="deal-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCircle} className="deal-modal-body">
              <div>
                <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>
                  Circle Name
                </label>
                <input
                  type="text"
                  required
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g. Hostel Gang, Flat 402, Family, Techies"
                  style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '11px 14px', color: '#F2F2F5' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>
                  Circle Type
                </label>
                <select
                  value={newCircleType}
                  onChange={(e) => setNewCircleType(e.target.value)}
                  style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '11px 14px', color: '#F2F2F5' }}
                >
                  <option value="Family">Family</option>
                  <option value="Hostel Gang">Hostel Gang</option>
                  <option value="Office">Office</option>
                  <option value="Flatmates">Flatmates</option>
                  <option value="Club">Club</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  value={newCircleDesc}
                  onChange={(e) => setNewCircleDesc(e.target.value)}
                  placeholder="What is this circle for? (e.g. sharing credit card perks inside our hostel wing)"
                  style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '11px 14px', color: '#F2F2F5' }}
                />
              </div>

              <button type="submit" className="button-dark" style={{ width: '100%' }}>
                Create Private Circle & Generate Invite Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. INVITE MODAL (LINK & QR CODE) */}
      {showInviteModal && (
        <div className="deal-modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="deal-modal-window" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="deal-modal-header">
              <div>
                <span style={{ font: '10px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase' }}>INVITE MEMBERS</span>
                <h3 style={{ margin: 0 }}>{activeCircle.name}</h3>
              </div>
              <button className="deal-modal-close" onClick={() => setShowInviteModal(false)}>×</button>
            </div>

            <div className="deal-modal-body" style={{ textAlign: 'center' }}>
              <div className="qr-code-frame">
                <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.5">
                  <rect width="5" height="5" x="3" y="3" rx="1"/>
                  <rect width="5" height="5" x="16" y="3" rx="1"/>
                  <rect width="5" height="5" x="3" y="16" rx="1"/>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                  <path d="M21 21v.01"/>
                  <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                  <path d="M3 12h.01"/>
                  <path d="M12 3h.01"/>
                  <path d="M12 16v.01"/>
                  <path d="M16 12h1"/>
                  <path d="M21 12v.01"/>
                  <path d="M12 21v-1"/>
                </svg>
              </div>

              <div>
                <span style={{ font: '11px var(--mono)', color: '#9A9AA6', display: 'block', marginBottom: '8px' }}>
                  CIRCLE INVITE CODE
                </span>
                <div className="invite-code-pill">
                  {activeCircle.inviteCode}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://cardsplit.app/join/${activeCircle.inviteCode}`)
                    setCopiedLink(true)
                    setTimeout(() => setCopiedLink(false), 2000)
                  }}
                  className="button-dark"
                  style={{ flex: 1 }}
                >
                  {copiedLink ? '✓ Copied Invite Link' : 'Copy Invite Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. JOIN CIRCLE MODAL */}
      {showJoinModal && (
        <div className="deal-modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="deal-modal-window" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="deal-modal-header">
              <h3>Join a Private Circle</h3>
              <button className="deal-modal-close" onClick={() => setShowJoinModal(false)}>×</button>
            </div>
            <form onSubmit={handleJoinCircle} className="deal-modal-body">
              <div>
                <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>
                  Enter Circle Invite Code (e.g. HOS-942B)
                </label>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="Enter 8-digit code..."
                  style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '12px 14px', color: '#F2F2F5', font: '16px var(--mono)', textAlign: 'center', textTransform: 'uppercase' }}
                />
              </div>
              <button type="submit" className="button-dark" style={{ width: '100%' }}>
                Join Circle Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. POST REQUEST MODAL */}
      {showPostRequestModal && (
        <div className="deal-modal-backdrop" onClick={() => setShowPostRequestModal(false)}>
          <div className="deal-modal-window" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="deal-modal-header">
              <div>
                <span style={{ font: '10px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase' }}>REQUEST BOARD</span>
                <h3 style={{ margin: 0 }}>Post a Circle Card Request</h3>
              </div>
              <button className="deal-modal-close" onClick={() => setShowPostRequestModal(false)}>×</button>
            </div>

            <form onSubmit={handlePostRequest} className="deal-modal-body">
              <div>
                <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>
                  What do you need? (e.g. Need HDFC 10% for iPhone 16)
                </label>
                <input
                  type="text"
                  required
                  value={reqProductTitle}
                  onChange={(e) => setReqProductTitle(e.target.value)}
                  style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px 14px', color: '#F2F2F5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>Merchant</label>
                  <select
                    value={reqMerchant}
                    onChange={(e) => setReqMerchant(e.target.value)}
                    style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px 14px', color: '#F2F2F5' }}
                  >
                    <option value="Amazon.in">Amazon.in</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Croma">Croma</option>
                    <option value="Apple India">Apple India</option>
                    <option value="MakeMyTrip">MakeMyTrip</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>Required Bank</label>
                  <select
                    value={reqRequiredBank}
                    onChange={(e) => setReqRequiredBank(e.target.value)}
                    style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px 14px', color: '#F2F2F5' }}
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="SBI Card">SBI Card</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Amex">Amex</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>Order Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={reqOrderAmount}
                    onChange={(e) => setReqOrderAmount(Number(e.target.value))}
                    style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px 14px', color: '#F2F2F5', font: '13px var(--mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>Instant Discount Expected (₹)</label>
                  <input
                    type="number"
                    required
                    value={reqInstantDiscount}
                    onChange={(e) => setReqInstantDiscount(Number(e.target.value))}
                    style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px 14px', color: '#F2F2F5', font: '13px var(--mono)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9A9AA6', display: 'block', marginBottom: '6px' }}>Trust Protection Tier</label>
                <select
                  value={reqTrustTier}
                  onChange={(e) => setReqTrustTier(e.target.value)}
                  style={{ width: '100%', background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px 14px', color: '#F2F2F5' }}
                >
                  <option value="friend">🟢 Friend (Direct 0-fee UPI Settle)</option>
                  <option value="friend_of_friend">🟡 Friend-of-Friend (Light Escrow)</option>
                  <option value="stranger">⚪ Stranger (Full Escrow)</option>
                </select>
              </div>

              <button type="submit" className="button-dark" style={{ width: '100%' }}>
                Broadcast Request to {activeCircle.name}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. ONE-TAP SETTLE MODAL */}
      {showSettleModal && activeSettleEntry && (
        <div className="deal-modal-backdrop" onClick={() => setShowSettleModal(false)}>
          <div className="deal-modal-window" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="deal-modal-header">
              <div>
                <span style={{ font: '10px var(--mono)', color: '#9A9AA6', textTransform: 'uppercase' }}>ONE-TAP SETTLE</span>
                <h3 style={{ margin: 0 }}>Settle via UPI</h3>
              </div>
              <button className="deal-modal-close" onClick={() => setShowSettleModal(false)}>×</button>
            </div>

            <div className="deal-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '14px', padding: '16px' }}>
                <span style={{ font: '11px var(--mono)', color: '#9A9AA6', display: 'block' }}>RECIPIENT CARDHOLDER</span>
                <b style={{ fontSize: '16px', color: '#F2F2F5' }}>{activeSettleEntry.toUserName}</b>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--mono)', margin: '10px 0 4px' }}>
                  ₹{activeSettleEntry.amount.toLocaleString('en-IN')}
                </div>
                <small style={{ color: '#63636E', fontSize: '11px' }}>
                  {activeSettleEntry.description}
                </small>
              </div>

              <div className="qr-code-frame" style={{ width: '130px', height: '130px' }}>
                <svg width="105" height="105" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.5">
                  <rect width="5" height="5" x="3" y="3" rx="1"/>
                  <rect width="5" height="5" x="16" y="3" rx="1"/>
                  <rect width="5" height="5" x="3" y="16" rx="1"/>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                </svg>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ font: '12px var(--mono)', color: '#F2F2F5' }}>{activeSettleEntry.upiId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeSettleEntry.upiId)
                    setCopiedUpi(true)
                    setTimeout(() => setCopiedUpi(false), 2000)
                  }}
                  style={{ background: 'transparent', border: 'none', color: copiedUpi ? '#10B981' : '#9A9AA6', cursor: 'pointer' }}
                >
                  {copiedUpi ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSettle(activeSettleEntry.id)}
                className="button-dark"
                style={{ width: '100%', background: '#10B981', color: '#0E0E10' }}
              >
                Mark as Settled (UPI Confirmed) ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

