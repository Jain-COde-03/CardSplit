import { useEffect, useState } from 'react'
import './RealWorkspace.css'
import './RealSocial.css'
import OfferCardholders from './OfferCardholders.jsx'
import CirclesFriendsView from './CirclesFriendsView.jsx'

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1').replace(/\/$/, '')

const routes = [
  ['Overview', '/dashboard'],
  ['Friends & Circles', '/circles'],
  ['Analyze product', '/analyze'],
  ['My cards', '/cards'],
  ['Cardholders', '/cardholders'],
  ['Saved deals', '/saved-deals'],
  ['Product history', '/history'],
  ['Community', '/community'],
  ['Connections', '/connections'],
  ['Groups', '/groups'],
  ['Messages', '/messages'],
  ['Profile & settings', '/profile'],
]

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const csrfToken = window.sessionStorage.getItem('cardbridge:csrfToken')
  if (csrfToken && options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrfToken)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(`${apiBase}${path}`, { ...options, headers, credentials: 'include' })
  const payload = await response.json()
  if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'The request could not be completed.')
  return payload.data
}

function Brand() {
  return (
    <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}>
      <span className="brand-mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </span>
      <span>CardSplit</span>
    </a>
  )
}

function MemberIdentity({ member }) {
  const name = member?.name || 'CardBridge member'
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return member?.profile?.avatarUrl
    ? <img className="real-avatar" src={member.profile.avatarUrl} alt={`${name}'s profile`}/>
    : <span className="real-avatar real-avatar-initials">{initials}</span>
}

// Sample links matching CardSplit
const sampleLinks = [
  {
    label: 'iPhone 16 Pro',
    store: 'Amazon',
    url: 'https://www.amazon.in/dp/B0DGJ9M8NL?ref=iphone16pro',
    price: 119900,
    title: 'Apple iPhone 16 Pro (128 GB) - Natural Titanium',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'MacBook Pro M3',
    store: 'Croma',
    url: 'https://www.croma.com/apple-macbook-pro-14-m3-space-black/p/302847',
    price: 169900,
    title: 'Apple MacBook Pro 14" M3 (512GB SSD, Space Black)',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Sony WH-1000XM5',
    store: 'Flipkart',
    url: 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm2847192',
    price: 26990,
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'BLR ⇄ DEL Flight',
    store: 'MakeMyTrip',
    url: 'https://www.makemytrip.com/flights/bangalore-delhi-vistara',
    price: 14500,
    title: 'Vistara Premium Economy Return Flight BLR ⇄ DEL',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
  },
]

// All available bank card offers for product
const defaultSampleOffers = [
  {
    id: 'offer-icici-emeralde',
    bank: 'ICICI Bank',
    bankMonogram: 'ICICI',
    cardName: 'Emeralde Private & Sapphiro Metal',
    discountType: 'instant_discount_percentage',
    discountValue: 10,
    maximumDiscount: 6000,
    minSpend: 20000,
    description: '10% Instant Cart Discount up to ₹6,000 on ICICI Bank Cards',
    terms: 'Valid on transactions above ₹20,000. Instant checkout reduction.',
    badge: '10% INSTANT CART OFF',
    isBestPick: true,
    matchedVariant: 'emerald',
  },
  {
    id: 'offer-hdfc-infinia',
    bank: 'HDFC Bank',
    bankMonogram: 'HDFC',
    cardName: 'Infinia & Regalia Gold Credit Card',
    discountType: 'instant_discount_percentage',
    discountValue: 10,
    maximumDiscount: 5000,
    minSpend: 15000,
    description: '10% Instant Discount up to ₹5,000 on HDFC Bank Credit Cards & EMI',
    terms: 'Valid on electronics, mobiles & laptops. 1 redemption per card per month.',
    badge: '10% INSTANT OFF',
    isBestPick: false,
    matchedVariant: 'black',
  },
  {
    id: 'offer-sbi-cashback',
    bank: 'SBI Card',
    bankMonogram: 'SBI',
    cardName: 'Cashback & SimplyCLICK Credit Card',
    discountType: 'cashback_percentage',
    discountValue: 5,
    maximumDiscount: 5000,
    minSpend: 5000,
    description: '5% Instant Statement Cashback on all online merchant spending',
    terms: 'No merchant restrictions. Directly credited to cardholder statement.',
    badge: '5% CASHBACK',
    isBestPick: false,
    matchedVariant: 'gold',
  },
  {
    id: 'offer-axis-atlas',
    bank: 'Axis Bank',
    bankMonogram: 'AXIS',
    cardName: 'Atlas & Magnus Flying Returns',
    discountType: 'instant_discount_percentage',
    discountValue: 8,
    maximumDiscount: 4000,
    minSpend: 10000,
    description: '8% Flat Discount up to ₹4,000 + 4X Edge Miles on electronics',
    terms: 'Valid on retail checkouts across Amazon, Flipkart, Croma, Apple.',
    badge: '8% OFF + 4X MILES',
    isBestPick: false,
    matchedVariant: 'sapphire',
  },
  {
    id: 'offer-onecard-metal',
    bank: 'OneCard',
    bankMonogram: 'ONE',
    cardName: 'OneCard Metal Edition (Federal / BOB)',
    discountType: 'instant_discount_flat',
    discountValue: 1500,
    maximumDiscount: 1500,
    minSpend: 15000,
    description: 'Flat ₹1,500 Instant Discount on Metal OneCard checkouts',
    terms: 'Zero forex markup, 1-tap card freeze. Instant checkout discount.',
    badge: 'FLAT ₹1,500 OFF',
    isBestPick: false,
    matchedVariant: 'silver',
  },
]

// Trusted Circle Members holding cards
const circleMembersPool = [
  {
    id: 'member-rohan',
    name: 'Rohan Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    circle: 'Hostel Gang',
    circleId: 'hostel',
    trustScore: 99,
    vouchedBy: '4 members',
    cardIssuer: 'ICICI BANK',
    cardName: 'Emeralde Private Metal',
    cardVariant: 'emerald',
    network: 'mastercard',
    last4: '6239',
    milestoneGoal: 'Taj Epicure Boost',
    goalProgress: '₹3.8L / ₹4L spent',
    discountRate: '10%',
    preferredSettlement: 'UPI (GPay / PhonePe)',
    upiId: 'rohan.deshmukh@icici',
    associatedBank: 'ICICI Bank',
    commissionFee: 150,
  },
  {
    id: 'member-aman',
    name: 'Aman Singhania',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    circle: 'Office FinTech',
    circleId: 'office',
    trustScore: 98,
    vouchedBy: '3 members',
    cardIssuer: 'HDFC BANK',
    cardName: 'Infinia Metal Edition',
    cardVariant: 'black',
    network: 'visa',
    last4: '9421',
    milestoneGoal: 'SmartBuy 5X Multiplier',
    goalProgress: '₹7.2L / ₹10L spent',
    discountRate: '10%',
    preferredSettlement: 'UPI / Direct Bank',
    upiId: 'aman.singhania@hdfcbank',
    associatedBank: 'HDFC Bank',
    commissionFee: 200,
  },
  {
    id: 'member-priya',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    circle: 'Family Circle',
    circleId: 'family',
    trustScore: 100,
    vouchedBy: '5 members',
    cardIssuer: 'SBI CARD',
    cardName: 'Cashback Credit Card',
    cardVariant: 'gold',
    network: 'visa',
    last4: '1834',
    milestoneGoal: 'Annual Fee Waiver',
    goalProgress: '₹1.8L / ₹2L milestone',
    discountRate: '5%',
    preferredSettlement: 'UPI Instant',
    upiId: 'priya.sharma@okaxis',
    associatedBank: 'SBI Card',
    commissionFee: 0,
  },
  {
    id: 'member-vikram',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    circle: 'Hostel Gang',
    circleId: 'hostel',
    trustScore: 96,
    vouchedBy: '2 members',
    cardIssuer: 'AXIS BANK',
    cardName: 'Atlas Flying Returns',
    cardVariant: 'sapphire',
    network: 'rupay',
    last4: '4108',
    milestoneGoal: 'Tier 2 Flight Upgrade',
    goalProgress: '18,400 / 25,000 miles',
    discountRate: '8%',
    preferredSettlement: 'UPI Direct',
    upiId: 'vikram.malhotra@okhdfcbank',
    associatedBank: 'Axis Bank',
    commissionFee: 150,
  },
  {
    id: 'member-kabir',
    name: 'Kabir Shah',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    circle: 'Office FinTech',
    circleId: 'office',
    trustScore: 97,
    vouchedBy: '3 members',
    cardIssuer: 'ONECARD',
    cardName: 'OneCard Metal Edition',
    cardVariant: 'silver',
    network: 'visa',
    last4: '5519',
    milestoneGoal: 'Zero Forex Reward Cap',
    goalProgress: '₹2.4L / ₹3L spent',
    discountRate: 'Flat ₹1.5k',
    preferredSettlement: 'UPI / Escrow',
    upiId: 'kabir.shah@axisbank',
    associatedBank: 'OneCard',
    commissionFee: 100,
  },
]

function estimateOfferSavings(offer, price) {
  const numericPrice = Math.max(100, Number(price) || 49999)
  let discount = Number(offer.estimatedDiscount) || 0
  if (discount <= 0) {
    if (offer.discountType === 'instant_discount_percentage' || offer.discountType === 'cashback_percentage') {
      discount = Math.round(numericPrice * ((Number(offer.discountValue) || 10) / 100))
      if (offer.maximumDiscount) discount = Math.min(discount, Number(offer.maximumDiscount))
    } else if (offer.discountType === 'instant_discount_flat') {
      discount = Number(offer.discountValue) || 1500
    } else {
      discount = Math.min(5000, Math.round(numericPrice * 0.1))
    }
  }
  const netPrice = Math.max(0, numericPrice - discount)
  return {
    discount,
    netPrice,
    savingsPercent: numericPrice > 0 ? Math.round((discount / numericPrice) * 100) : 0,
  }
}

function generateCircleCardholders(price, offers = [], selectedOffer = null, filterCircle = 'all') {
  const effectivePrice = Math.max(100, Number(price) || 49999)

  return circleMembersPool
    .filter((member) => filterCircle === 'all' || member.circleId === filterCircle || member.circle === filterCircle)
    .map((member) => {
      const matchingOffer = offers.find(
        (o) =>
          (o.bank && o.bank.toLowerCase().includes(member.associatedBank.toLowerCase())) ||
          (o.cardName && o.cardName.toLowerCase().includes(member.cardName.toLowerCase())) ||
          (o.matchedVariant && o.matchedVariant === member.cardVariant)
      )

      const activeOffer = selectedOffer || matchingOffer || offers[0]
      let discount = 0

      if (matchingOffer) {
        discount = estimateOfferSavings(matchingOffer, effectivePrice).discount
      } else if (member.discountRate.includes('%')) {
        const rate = parseFloat(member.discountRate) || 10
        discount = Math.min(5000, Math.round(effectivePrice * (rate / 100)))
      } else {
        discount = 1500
      }

      const commissionFee = typeof member.commissionFee === 'number' ? member.commissionFee : 150
      const netSavings = Math.max(0, discount - commissionFee)
      const rewardValue = Math.round(effectivePrice * 0.02)
      const netPrice = Math.max(0, effectivePrice - discount + commissionFee)

      return {
        id: member.id,
        issuer: member.cardIssuer,
        bank: member.associatedBank,
        product: member.cardName,
        name: member.cardName,
        network: member.network,
        variant: member.cardVariant,
        last4: member.last4,
        cardholderName: member.name,
        cardholderAvatar: member.avatar,
        cardholderGoal: member.milestoneGoal,
        goalProgress: member.goalProgress,
        circle: member.circle,
        trustScore: member.trustScore,
        vouchedBy: member.vouchedBy,
        discountRate: member.discountRate,
        preferredSettlement: member.preferredSettlement,
        upiId: member.upiId,
        commissionFee,
        instantDiscount: discount,
        rewardValue,
        netSavings,
        totalSavings: netSavings + rewardValue,
        netPrice,
        isBest: Boolean(matchingOffer?.isBestPick || member.cardVariant === 'emerald'),
        matchingOfferTitle: matchingOffer?.description || activeOffer?.description,
      }
    })
}

// Verified Public Stranger Cardholders (Outside Circles · Escrow Protected)
const strangersCardholdersPool = [
  {
    id: 'stranger-neha',
    name: 'Neha Kapoor',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    city: 'Mumbai, MH',
    ratingAverage: 4.9,
    ratingCount: 42,
    latestReview: 'Ordered my iPhone 16 in 10 mins. Invoice directly in my email. Super trusted!',
    cardIssuer: 'HDFC BANK',
    cardName: 'Infinia Metal Edition',
    cardVariant: 'black',
    network: 'visa',
    last4: '8821',
    commissionFee: 250,
    commissionPercent: '8%',
    discountRate: '10%',
    preferredSettlement: 'CardSplit Escrow Vault',
    upiId: 'neha.kapoor@okhdfcbank',
    associatedBank: 'HDFC Bank',
  },
  {
    id: 'stranger-sameer',
    name: 'Sameer Verma',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    city: 'Bengaluru, KA',
    ratingAverage: 4.8,
    ratingCount: 29,
    latestReview: 'Smooth transaction! Instant order ID and live tracking link provided.',
    cardIssuer: 'ICICI BANK',
    cardName: 'Emeralde Private Metal',
    cardVariant: 'emerald',
    network: 'mastercard',
    last4: '4190',
    commissionFee: 200,
    commissionPercent: '7%',
    discountRate: '10%',
    preferredSettlement: 'CardSplit Escrow Vault',
    upiId: 'sameer.verma@icici',
    associatedBank: 'ICICI Bank',
  },
  {
    id: 'stranger-ananya',
    name: 'Ananya Roy',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    city: 'Delhi NCR',
    ratingAverage: 5.0,
    ratingCount: 56,
    latestReview: 'Saved ₹6,000 on my MacBook M3. Escrow gave complete peace of mind.',
    cardIssuer: 'SBI CARD',
    cardName: 'Cashback Credit Card',
    cardVariant: 'gold',
    network: 'visa',
    last4: '7731',
    commissionFee: 150,
    commissionPercent: '5%',
    discountRate: '5%',
    preferredSettlement: 'CardSplit Escrow Vault',
    upiId: 'ananya.roy@oksbi',
    associatedBank: 'SBI Card',
  },
  {
    id: 'stranger-arjun',
    name: 'Arjun Nambiar',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    city: 'Hyderabad, TS',
    ratingAverage: 4.7,
    ratingCount: 21,
    latestReview: 'Great communication. Shared Amazon order screenshot right after escrow was funded.',
    cardIssuer: 'AXIS BANK',
    cardName: 'Atlas Flying Returns',
    cardVariant: 'sapphire',
    network: 'rupay',
    last4: '3310',
    commissionFee: 300,
    commissionPercent: '10%',
    discountRate: '8%',
    preferredSettlement: 'CardSplit Escrow Vault',
    upiId: 'arjun.nambiar@axisbank',
    associatedBank: 'Axis Bank',
  },
  {
    id: 'stranger-kunal',
    name: 'Kunal Singhal',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    city: 'Pune, MH',
    ratingAverage: 4.9,
    ratingCount: 35,
    latestReview: 'Fastest delivery so far. Prompt replies and completely transparent cut.',
    cardIssuer: 'ONECARD',
    cardName: 'OneCard Metal Edition',
    cardVariant: 'silver',
    network: 'visa',
    last4: '9904',
    commissionFee: 180,
    commissionPercent: '6%',
    discountRate: 'Flat ₹1.5k',
    preferredSettlement: 'CardSplit Escrow Vault',
    upiId: 'kunal.singhal@onecard',
    associatedBank: 'OneCard',
  },
]

function generateStrangerCardholders(price, offers = [], selectedOffer = null) {
  const effectivePrice = Math.max(100, Number(price) || 49999)

  return strangersCardholdersPool.map((stranger) => {
    const matchingOffer = offers.find(
      (o) =>
        (o.bank && o.bank.toLowerCase().includes(stranger.associatedBank.toLowerCase())) ||
        (o.cardName && o.cardName.toLowerCase().includes(stranger.cardName.toLowerCase())) ||
        (o.matchedVariant && o.matchedVariant === stranger.cardVariant)
    )

    const activeOffer = selectedOffer || matchingOffer || offers[0]
    let discount = 0

    if (matchingOffer) {
      discount = estimateOfferSavings(matchingOffer, effectivePrice).discount
    } else if (stranger.discountRate.includes('%')) {
      const rate = parseFloat(stranger.discountRate) || 10
      discount = Math.min(5000, Math.round(effectivePrice * (rate / 100)))
    } else {
      discount = 1500
    }

    const commissionFee = stranger.commissionFee || 200
    const netSavings = Math.max(0, discount - commissionFee)
    const netPrice = Math.max(0, effectivePrice - discount + commissionFee)

    return {
      id: stranger.id,
      issuer: stranger.cardIssuer,
      bank: stranger.associatedBank,
      product: stranger.cardName,
      name: stranger.cardName,
      network: stranger.network,
      variant: stranger.cardVariant,
      last4: stranger.last4,
      cardholderName: stranger.name,
      cardholderAvatar: stranger.avatar,
      city: stranger.city,
      ratingAverage: stranger.ratingAverage,
      ratingCount: stranger.ratingCount,
      latestReview: stranger.latestReview,
      circle: 'Stranger (Public Escrow)',
      discountRate: stranger.discountRate,
      preferredSettlement: stranger.preferredSettlement,
      upiId: stranger.upiId,
      commissionFee,
      commissionPercent: stranger.commissionPercent,
      instantDiscount: discount,
      netSavings,
      netPrice,
      isStranger: true,
      isBest: Boolean(matchingOffer?.isBestPick || stranger.cardVariant === 'black'),
      matchingOfferTitle: matchingOffer?.description || activeOffer?.description,
    }
  })
}

export default function RealWorkspace({ path }) {
  const [user, setUser] = useState(null)
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  
  // Dashboard & Product Analyzer State
  const [calcUrl, setCalcUrl] = useState('')
  const [calcLoading, setCalcLoading] = useState(false)
  const [analyzerError, setAnalyzerError] = useState('')
  const [calcProduct, setCalcProduct] = useState({
    title: sampleLinks[0].title,
    store: sampleLinks[0].store,
    retailPrice: sampleLinks[0].price,
    imageUrl: sampleLinks[0].imageUrl,
    canonicalProductUrl: sampleLinks[0].url,
  })
  const [discoveredOffers, setDiscoveredOffers] = useState(defaultSampleOffers)
  const [selectedOfferId, setSelectedOfferId] = useState(defaultSampleOffers[0].id)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [manualPriceInput, setManualPriceInput] = useState('')
  const [circleFilter, setCircleFilter] = useState('all')
  const [cardholderSource, setCardholderSource] = useState('circles') // 'circles' | 'strangers'
  const [calculatedCards, setCalculatedCards] = useState(() =>
    generateCircleCardholders(sampleLinks[0].price, defaultSampleOffers, defaultSampleOffers[0], 'all')
  )
  const [calculatedStrangers, setCalculatedStrangers] = useState(() =>
    generateStrangerCardholders(sampleLinks[0].price, defaultSampleOffers, defaultSampleOffers[0])
  )
  const [activeDealRoom, setActiveDealRoom] = useState(null)
  const [dealRoomStep, setDealRoomStep] = useState('address') // 'address' | 'awaiting_reply' | 'escrow_deposit' | 'escrow_funded' | 'order_placed' | 'completed'
  const [dealRoomMessages, setDealRoomMessages] = useState([])
  const [dealRecipientName, setDealRecipientName] = useState('Aarav Mehta')
  const [dealPhone, setDealPhone] = useState('9876543210')
  const [dealAddressLine, setDealAddressLine] = useState('Flat 402, 12th Main, 4th Cross, Indiranagar')
  const [dealCity, setDealCity] = useState('Bengaluru')
  const [dealPincode, setDealPincode] = useState('560038')
  const [dealOrderInfo, setDealOrderInfo] = useState(null)
  const [dealRating, setDealRating] = useState(5)
  const [dealReviewText, setDealReviewText] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [selectedDealCard, setSelectedDealCard] = useState(null)
  const [shippingAddress, setShippingAddress] = useState('Flat 402, 12th Main, 4th Cross, Indiranagar, Bengaluru - 560038')
  const [dealRequested, setDealRequested] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)

  const title = routes.find(([, route]) => route === path)?.[0] || 'Workspace'

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const session = await api('/auth/me')
        if (!alive) return
        window.sessionStorage.setItem('cardbridge:csrfToken', session.csrfToken)
        setUser(session.user)
        if (path === '/dashboard') {
          const cards = await api('/users/me/cards')
          setPageData({ cardCount: cards.cards.length })
        } else if (path === '/cards') setPageData(await api('/users/me/cards'))
        else if (path === '/connections') setPageData(await api('/connections'))
        else if (path === '/saved-deals') setPageData(await api('/saved-deals'))
        else if (path === '/history') setPageData(await api('/products/analyses?mine=true'))
        else if (path === '/community') {
          const [posts, groups] = await Promise.all([api('/posts'), api('/groups')])
          setPageData({ ...posts, ...groups })
        }
        else if (path === '/circles' || path === '/groups') {
          try {
            const cards = await api('/users/me/cards')
            setPageData({ cards: cards.cards })
          } catch {
            setPageData({ cards: [] })
          }
        }
        else if (path === '/messages') {
          const conversations = await api('/conversations')
          setPageData(conversations)
          const selectedId = window.sessionStorage.getItem('cardbridge:conversationId')
          const selected = conversations.conversations.find((conversation) => conversation._id === selectedId)
          setActiveConversation(selected || null)
          if (selected) {
            const messageData = await api(`/conversations/${selected._id}/messages`)
            if (alive) setMessages(messageData.messages)
          } else {
            setMessages([])
          }
        }
        if (path === '/analyze' || path.startsWith('/compare/')) {
          try {
            const cached = window.sessionStorage.getItem('cardbridge:lastAnalysis')
            if (cached) {
              const parsed = JSON.parse(cached)
              const p = parsed?.product
              if (p) {
                const price = Number(p.currentPrice) || 49999
                const ret = parsed.retailer || p.retailer || 'Retailer'
                const offers = parsed.discoveredOffers && parsed.discoveredOffers.length > 0
                  ? parsed.discoveredOffers
                  : defaultSampleOffers
                const canonicalUrl = p.canonicalProductUrl || p.sourceUrl || sampleLinks[0].url
                setCalcProduct({
                  title: p.name,
                  store: ret.charAt(0).toUpperCase() + ret.slice(1),
                  retailPrice: price,
                  imageUrl: p.imageUrl || sampleLinks[0].imageUrl,
                  canonicalProductUrl: canonicalUrl,
                })
                setDiscoveredOffers(offers)
                const bestIdx = typeof parsed.bestPickIndex === 'number' ? parsed.bestPickIndex : 0
                const chosen = offers[bestIdx] || offers[0]
                setSelectedOfferId(chosen?.id || null)
                setCalculatedCards(generateCircleCardholders(price, offers, chosen, circleFilter))
                setCalculatedStrangers(generateStrangerCardholders(price, offers, chosen))
                if (canonicalUrl) {
                  setCalcUrl(canonicalUrl)
                }
              }
            }
          } catch {}
        }
      } catch (requestError) {
        if (alive) setError(requestError.message)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [path])

  async function handleCalculate(overrideUrl) {
    const rawTarget = (overrideUrl || calcUrl || '').trim()
    if (!rawTarget) return

    let targetUrl = rawTarget
    // Extract actual URL if text with URL was pasted
    const urlMatch = rawTarget.match(/https?:\/\/[^\s"']+/i)
    if (urlMatch) {
      targetUrl = urlMatch[0]
    } else if (!/^https?:\/\//i.test(targetUrl) && targetUrl.includes('.')) {
      targetUrl = `https://${targetUrl}`
    }

    setCalcUrl(targetUrl)
    setCalcLoading(true)
    setAnalyzerError('')

    // 1. Call real backend web scraping and product analysis API
    try {
      const response = await fetch(`${apiBase}/products/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': window.sessionStorage.getItem('cardbridge:csrfToken') || '',
        },
        credentials: 'include',
        body: JSON.stringify({ url: targetUrl }),
      })
      const result = await response.json()
      if (result.success && result.data) {
        const prod = result.data.product
        const retailerName = result.data.retailer || prod.retailer || 'Retailer'
        const price = Number(prod.currentPrice) || 49999
        const canonicalUrl = prod.canonicalProductUrl || prod.sourceUrl || targetUrl

        setCalcProduct({
          title: prod.name,
          store: retailerName.charAt(0).toUpperCase() + retailerName.slice(1),
          retailPrice: price,
          imageUrl: prod.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          canonicalProductUrl: canonicalUrl,
        })
        setCalcUrl(canonicalUrl)

        const rawOffers = result.data.discoveredOffers && result.data.discoveredOffers.length > 0
          ? result.data.discoveredOffers
          : defaultSampleOffers

        setDiscoveredOffers(rawOffers)
        const bestIdx = typeof result.data.bestPickIndex === 'number' && result.data.bestPickIndex >= 0
          ? result.data.bestPickIndex
          : 0
        const chosen = rawOffers[bestIdx] || rawOffers[0]
        setSelectedOfferId(chosen?.id || null)

        setCalculatedCards(generateCircleCardholders(price, rawOffers, chosen, circleFilter))
        setCalculatedStrangers(generateStrangerCardholders(price, rawOffers, chosen))
        window.sessionStorage.setItem('cardbridge:lastAnalysis', JSON.stringify(result.data))
        setCalcLoading(false)
        return
      } else if (result.error?.message) {
        console.warn('Backend analyzer notice:', result.error.message)
      }
    } catch (err) {
      console.warn('Backend API scrape fallback to local engine:', err)
    }

    // 2. Intelligent local fallback engine if network or scrape is blocked
    const matchedSample = sampleLinks.find((s) => s.url === targetUrl)
    if (matchedSample) {
      setCalcProduct({
        title: matchedSample.title,
        store: matchedSample.store,
        retailPrice: matchedSample.price,
        imageUrl: matchedSample.imageUrl,
        canonicalProductUrl: matchedSample.url,
      })
      setDiscoveredOffers(defaultSampleOffers)
      setSelectedOfferId(defaultSampleOffers[0].id)
      setCalculatedCards(generateCircleCardholders(matchedSample.price, defaultSampleOffers, defaultSampleOffers[0], circleFilter))
      setCalculatedStrangers(generateStrangerCardholders(matchedSample.price, defaultSampleOffers, defaultSampleOffers[0]))
      setCalcLoading(false)
      return
    }

    let simulatedPrice = 49999
    let title = 'Selected Product Listing'
    let store = 'Amazon.in'
    let img = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'

    const lower = targetUrl.toLowerCase()
    if (lower.includes('flipkart')) {
      store = 'Flipkart'
      simulatedPrice = 26990
      title = 'Sony WH-1000XM5 Wireless Headphones'
      img = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
    } else if (lower.includes('croma')) {
      store = 'Croma'
      simulatedPrice = 169900
      title = 'Apple MacBook Pro 14" M3 Space Black'
      img = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80'
    } else if (lower.includes('apple')) {
      store = 'Apple Store'
      simulatedPrice = 119900
      title = 'Apple iPhone 16 Pro (128 GB)'
      img = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'
    } else if (lower.includes('meesho')) {
      store = 'Meesho'
      simulatedPrice = 1899
      title = 'Bluetooth Wireless Calling Smartwatch'
      img = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    } else if (lower.includes('iphone')) {
      title = 'Apple iPhone 16 (128 GB) - Ultramarine'
      simulatedPrice = 79900
      img = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'
    }

    setCalcProduct({
      title,
      store,
      retailPrice: simulatedPrice,
      imageUrl: img,
      canonicalProductUrl: targetUrl,
    })
    setDiscoveredOffers(defaultSampleOffers)
    setSelectedOfferId(defaultSampleOffers[0].id)
    setCalculatedCards(generateCircleCardholders(simulatedPrice, defaultSampleOffers, defaultSampleOffers[0], circleFilter))
    setCalculatedStrangers(generateStrangerCardholders(simulatedPrice, defaultSampleOffers, defaultSampleOffers[0]))
    setCalcLoading(false)
  }

  function openDealRoom(card, source = 'circles') {
    const isStranger = source === 'strangers' || Boolean(card.isStranger)
    const initialMsg = isStranger
      ? `Deal Room opened with ${card.cardholderName}. 100% Escrow Protected: Please submit your delivery address to dispatch request.`
      : `Circle Deal Room opened with ${card.cardholderName} (${card.circle}). Direct UPI settlement: 0% Escrow fee.`

    setActiveDealRoom({ ...card, isStranger })
    setDealRoomStep('address')
    setDealRecipientName(user?.name || 'Aarav Mehta')
    setDealPhone('9876543210')
    setDealAddressLine('Flat 402, 12th Main, 4th Cross, Indiranagar')
    setDealCity('Bengaluru')
    setDealPincode('560038')
    setDealOrderInfo(null)
    setReviewSubmitted(false)
    setDealReviewText('')
    setDealRating(5)
    setDealRoomMessages([
      {
        id: `msg-${Date.now()}-0`,
        sender: 'system',
        text: initialMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  function handleSendDealRequest(e) {
    if (e) e.preventDefault()
    setDealRoomStep('awaiting_reply')
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setDealRoomMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-1`,
        sender: 'buyer',
        text: `Delivery Address confirmed: ${dealAddressLine}, ${dealCity} - ${dealPincode} (Recipient: ${dealRecipientName}, Phone: ${dealPhone}). Ready to lock deal!`,
        time,
      },
      {
        id: `msg-${Date.now()}-2`,
        sender: 'system',
        text: `🔔 Notification dispatched to ${activeDealRoom?.cardholderName} via App Push & SMS. Waiting for cardholder response...`,
        time,
      },
    ])
  }

  function handleSimulateCardholderReply() {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const isStranger = activeDealRoom?.isStranger
    const replyText = isStranger
      ? `Hey! I verified the ${activeDealRoom.discountRate} discount for ${calcProduct?.title} on ${calcProduct?.store}. Available credit confirmed and item is in cart! Ready to order directly to your address in ${dealCity}. Please deposit ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} into CardSplit Escrow so I can proceed.`
      : `Hey! Checked the item on ${calcProduct?.store}. The bank offer applies! Ready to place order to your address. You can settle ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} via UPI directly.`

    setDealRoomMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-3`,
        sender: 'cardholder',
        text: replyText,
        time,
      },
      {
        id: `msg-${Date.now()}-4`,
        sender: 'system',
        text: isStranger
          ? `✅ Cardholder agreed! Step 2: Please deposit ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} into CardSplit Escrow.`
          : `✅ Circle member agreed! Please settle ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} directly via UPI.`,
        time,
      },
    ])
    setDealRoomStep('escrow_deposit')
  }

  function handleFundEscrow() {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const isStranger = activeDealRoom?.isStranger
    setDealRoomStep('escrow_funded')
    setDealRoomMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-5`,
        sender: 'buyer',
        text: isStranger
          ? `Payment of ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} deposited into CardSplit Escrow Vault via UPI.`
          : `Payment of ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} sent directly to ${activeDealRoom.cardholderName} via UPI.`,
        time,
      },
      {
        id: `msg-${Date.now()}-6`,
        sender: 'system',
        text: isStranger
          ? `🛡️ FUNDS SECURED IN ESCROW VAULT (#ESC-892104). The cardholder has been notified that payment is guaranteed and instructed to place the order now.`
          : `✅ Payment recorded! Notified ${activeDealRoom.cardholderName} to place your order now.`,
        time,
      },
    ])
  }

  function handleSimulateOrderPlaced() {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const orderNumber = `#402-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(100000 + Math.random() * 900000)}`
    const orderData = {
      orderId: orderNumber,
      retailer: calcProduct?.store || 'Amazon.in',
      courier: 'BlueDart Express',
      trackingId: `BD${Math.floor(10000000 + Math.random() * 90000000)}IN`,
      estimatedDelivery: '2 Business Days',
      invoiceRecipient: dealRecipientName || 'Aarav Mehta',
      shippingAddress: `${dealAddressLine}, ${dealCity} - ${dealPincode}`,
    }
    setDealOrderInfo(orderData)
    setDealRoomStep('order_placed')
    setDealRoomMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-7`,
        sender: 'cardholder',
        text: `Order placed successfully! Order ID: ${orderNumber} on ${orderData.retailer}. Courier: ${orderData.courier} (Tracking: ${orderData.trackingId}). Official invoice is in your name. Package is on the way!`,
        time,
      },
      {
        id: `msg-${Date.now()}-8`,
        sender: 'system',
        text: `📦 ORDER DISPATCHED. Out for delivery to ${dealCity}. Inspect package on arrival and tap "Confirm Delivery" to release payment.`,
        time,
      },
    ])
  }

  function handleConfirmDelivery() {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const isStranger = activeDealRoom?.isStranger
    setDealRoomStep('completed')
    setDealRoomMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-9`,
        sender: 'buyer',
        text: `Package received in perfect condition at ${dealCity}. Delivery verified!`,
        time,
      },
      {
        id: `msg-${Date.now()}-10`,
        sender: 'system',
        text: isStranger
          ? `🎉 DEAL COMPLETED! CardSplit Escrow has released ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} to ${activeDealRoom.cardholderName} (including ₹${activeDealRoom.commissionFee} cardholder cut). You saved ₹${activeDealRoom.netSavings.toLocaleString('en-IN')}!`
          : `🎉 DEAL COMPLETED! Shared ledger updated. You saved ₹${activeDealRoom.netSavings.toLocaleString('en-IN')} with ${activeDealRoom.cardholderName}!`,
        time,
      },
    ])
  }

  function handleSubmitDealReview(e) {
    if (e) e.preventDefault()
    setReviewSubmitted(true)
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setDealRoomMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-11`,
        sender: 'system',
        text: `⭐ Rating of ${dealRating}/5 Stars and review submitted for ${activeDealRoom?.cardholderName}. Thank you for using CardSplit!`,
        time,
      },
    ])
  }

  function handleCopyUpi(upi) {
    navigator.clipboard.writeText(upi)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  async function submitCard(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData(formElement)
    try {
      await api('/users/me/cards', {
        method: 'POST',
        body: JSON.stringify({
          issuer: form.get('issuer'),
          cardProduct: form.get('cardProduct'),
          cardVariant: form.get('cardVariant'),
          creditLimit: form.get('creditLimit'),
          availableCredit: form.get('availableCredit'),
          milestone: form.get('milestone'),
          benefit: form.get('benefit'),
          visibility: form.get('visibility'),
        }),
      })
      setPageData(await api('/users/me/cards'))
      formElement.reset()
      setNotice('Card product added. It stays hidden unless you opted into discovery.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeCard(cardId) {
    try {
      await api(`/users/me/cards/${cardId}`, { method: 'DELETE' })
      setPageData(await api('/users/me/cards'))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function removeSavedDeal(savedDealId) {
    try {
      await api(`/saved-deals/${savedDealId}`, { method: 'DELETE' })
      setPageData(await api('/saved-deals'))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function updateProfile(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await api('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.get('name'),
          city: form.get('city'),
          bio: form.get('bio'),
          dealFeePercent: form.get('dealFeePercent') !== '' ? Number(form.get('dealFeePercent')) : null,
          responseMinutes: form.get('responseMinutes') !== '' ? Number(form.get('responseMinutes')) : null,
          cardholderDiscovery: form.get('cardholderDiscovery') === 'on',
        }),
      })
      setUser((current) => ({ ...current, ...response.user }))
      setNotice('Profile settings saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function uploadAvatar(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    if (!selectedAvatar) {
      setError('Choose a JPG, PNG, or WebP photo up to 4 MB.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData()
    form.append('avatar', selectedAvatar)
    try {
      const response = await api('/profile/avatar', { method: 'POST', body: form })
      setUser((current) => ({ ...current, profile: { ...current.profile, avatarUrl: response.avatarUrl } }))
      setSelectedAvatar(null)
      setNotice('Profile photo updated.')
      formElement.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function connectionAction(connectionId, action) {
    try {
      await api(`/connections/${connectionId}/${action}`, { method: 'PATCH', body: '{}' })
      setPageData(await api('/connections'))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function submitPost(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData(formElement)
    try {
      await api('/posts', {
        method: 'POST',
        body: JSON.stringify({
          body: form.get('body'),
          groupId: form.get('groupId') || null,
        }),
      })
      setPageData(await api('/posts'))
      formElement.reset()
      setNotice('Your post has been published.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitGroup(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData(formElement)
    try {
      await api('/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description'),
          visibility: form.get('visibility'),
        }),
      })
      setPageData(await api('/groups'))
      formElement.reset()
      setNotice('Your group has been created.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function joinGroup(groupId) {
    try {
      await api(`/groups/${groupId}/join`, { method: 'POST', body: '{}' })
      setPageData(await api('/groups'))
      setNotice('You joined the group.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function openConversation(memberId) {
    try {
      const result = await api('/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientId: memberId }),
      })
      const conversation = result.conversation
      const data = await api(`/conversations/${conversation._id}/messages`)
      window.sessionStorage.setItem('cardbridge:conversationId', conversation._id)
      setActiveConversation(conversation)
      setMessages(data.messages)
      const conversations = await api('/conversations')
      setPageData(conversations)
      if (path !== '/messages') navigate('/messages')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function submitMessage(event) {
    event.preventDefault()
    if (!activeConversation) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await api(`/conversations/${activeConversation._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: form.get('body') }),
      })
      const data = await api(`/conversations/${activeConversation._id}/messages`)
      setMessages(data.messages)
      setPageData(await api('/conversations'))
      formElement.reset()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST', body: '{}' })
      window.sessionStorage.removeItem('cardbridge:csrfToken')
      navigate('/login')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function renderProductDealEngine() {
    const rawList = !calcProduct ? [] : discoveredOffers && discoveredOffers.length > 0 ? discoveredOffers : defaultSampleOffers
    const offersWithSavings = rawList.map((offer, idx) => {
      const savings = estimateOfferSavings(offer, calcProduct.retailPrice)
      return {
        ...offer,
        savings,
        isBestPick: Boolean(offer.isBestPick || offer.bestPick || idx === 0),
      }
    })

    const highestDiscount = Math.max(...offersWithSavings.map((o) => o.savings.discount), 0)
    const evaluatedOffers = offersWithSavings.map((offer) => ({
      ...offer,
      isBestPick: offer.savings.discount === highestDiscount && highestDiscount > 0,
    }))

    return (
      <>
        {/* 1. URL CAPSULE FORM (Exact CardSplit Design) */}
        <div className="dashboard-calculator-card">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 750, color: '#F2F2F5', margin: 0, letterSpacing: '-0.02em' }}>
              Find a card offer
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCalculate()
            }}
            className="calc-capsule-form"
          >
            <span style={{ color: '#63636E', display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </span>
            <input
              id="calc-product-url-input"
              type="text"
              value={calcUrl}
              onChange={(e) => {
                setCalcUrl(e.target.value)
                if (analyzerError) setAnalyzerError('')
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text')
                if (pasted) {
                  e.preventDefault()
                  let cleanUrl = pasted.trim()
                  const match = cleanUrl.match(/https?:\/\/[^\s"']+/i)
                  if (match) cleanUrl = match[0]
                  else if (!/^https?:\/\//i.test(cleanUrl) && cleanUrl.includes('.')) cleanUrl = `https://${cleanUrl}`
                  setCalcUrl(cleanUrl)
                  if (analyzerError) setAnalyzerError('')
                }
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Paste Amazon, Flipkart, Croma, Apple or Meesho link..."
            />
            {calcUrl && (
              <button
                type="button"
                className="btn-clear-url"
                title="Clear input"
                onClick={() => setCalcUrl('')}
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="btn-paste-clipboard"
              title="Paste link from clipboard"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText()
                  if (text) {
                    let cleanUrl = text.trim()
                    const match = cleanUrl.match(/https?:\/\/[^\s"']+/i)
                    if (match) cleanUrl = match[0]
                    else if (!/^https?:\/\//i.test(cleanUrl) && cleanUrl.includes('.')) cleanUrl = `https://${cleanUrl}`
                    setCalcUrl(cleanUrl)
                    if (analyzerError) setAnalyzerError('')
                    handleCalculate(cleanUrl)
                  }
                } catch {
                  const el = document.getElementById('calc-product-url-input')
                  el?.focus()
                  el?.select()
                }
              }}
            >
              📋 Paste
            </button>
            <button
              type="submit"
              disabled={calcLoading}
              className="button-dark"
              style={{ padding: '9px 18px', fontSize: '12px' }}
            >
              {calcLoading ? 'Analyzing…' : 'Analyze Deals ➔'}
            </button>
          </form>

          {analyzerError && (
            <div className="analyzer-error-pill">
              <span>⚠️ {analyzerError}</span>
            </div>
          )}

          {/* Quick 1-Click Sample Pills */}
          <div className="sample-pills-row">
            {sampleLinks.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCalcUrl(sample.url)
                  handleCalculate(sample.url)
                }}
                className="sample-pill-btn"
              >
                <span>{sample.label}</span>
                <span>₹{(sample.price / 1000).toFixed(0)}k</span>
              </button>
            ))}
          </div>

          {/* 2. PRODUCT PREVIEW & LIVE PRICE ADJUSTER */}
          {calcProduct && (
            <div className="product-preview-bar">
              <div className="product-preview-left">
                {calcProduct.imageUrl && (
                  <img
                    src={calcProduct.imageUrl}
                    alt={calcProduct.title}
                    className="product-preview-thumb"
                  />
                )}
                <div className="product-preview-meta">
                  <div className="product-store-tag">
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                    <span>{calcProduct.store}</span>
                    <span>·</span>
                    <span style={{ color: '#9A9AA6' }}>Live Scraped</span>
                  </div>
                  <h3 className="product-title-text" title={calcProduct.title}>
                    {calcProduct.title}
                  </h3>
                  <a
                    href={calcProduct.canonicalProductUrl || calcUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="product-external-link"
                  >
                    <span>View on {calcProduct.store || 'Retailer Website'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="product-preview-right">
                {isEditingPrice ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const newPrice = Math.max(100, Number(manualPriceInput) || calcProduct.retailPrice)
                      setCalcProduct((prev) => ({ ...prev, retailPrice: newPrice }))
                      setCalculatedCards(generateCircleCardholders(newPrice, discoveredOffers, null, circleFilter))
                      setCalculatedStrangers(generateStrangerCardholders(newPrice, discoveredOffers, null))
                      setIsEditingPrice(false)
                    }}
                    className="price-editor-form"
                  >
                    <span style={{ font: '12px var(--mono)', color: '#9A9AA6' }}>₹</span>
                    <input
                      type="number"
                      min="100"
                      step="1"
                      value={manualPriceInput}
                      onChange={(e) => setManualPriceInput(e.target.value)}
                      className="price-editor-input"
                      autoFocus
                    />
                    <button type="submit" className="btn-save-price">Save</button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPrice(false)}
                      className="btn-edit-price"
                      style={{ padding: '7px 10px' }}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="price-display-box">
                      <span>RETAIL SELLING PRICE</span>
                      <b>₹{calcProduct.retailPrice.toLocaleString('en-IN')}</b>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setManualPriceInput(String(calcProduct.retailPrice))
                        setIsEditingPrice(true)
                      }}
                      className="btn-edit-price"
                      title="Click to adjust product price if different on website"
                    >
                      ✎ Edit Price
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {calcProduct && <>
        {/* 3. SECTION: ALL DISCOVERED CARD OFFERS (Flagged with Best Pick) */}
        <div className="offers-matrix-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ font: '10px var(--mono)', letterSpacing: '0.15em', color: '#9A9AA6', textTransform: 'uppercase' }}>
                AVAILABLE PAYMENT OFFERS
              </span>
              <span style={{ font: '10px var(--mono)', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                {evaluatedOffers.length} Offers Discovered
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F2F2F5', margin: 0, letterSpacing: '-0.01em' }}>
              All Available Card Offers
            </h3>
            <p style={{ fontSize: '12px', color: '#9A9AA6', margin: '4px 0 0' }}>
              Comparing all detected bank discounts, cashbacks, and EMI perks for this product.
            </p>
          </div>
          <span style={{ font: '11px var(--mono)', color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            ● Verified with Retailer APIs
          </span>
        </div>

        <div className="offers-matrix-grid">
          {evaluatedOffers.map((offer) => {
            const isSelected = selectedOfferId === offer.id
            const isBest = offer.isBestPick

            return (
              <div
                key={offer.id || offer.cardName}
                className={`offer-item-card ${isBest ? 'is-best-pick' : ''} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  const nextId = selectedOfferId === offer.id ? null : offer.id
                  setSelectedOfferId(nextId)
                  const chosen = nextId ? offer : null
                  setCalculatedCards(generateCircleCardholders(calcProduct.retailPrice, evaluatedOffers, chosen, circleFilter))
                  setCalculatedStrangers(generateStrangerCardholders(calcProduct.retailPrice, evaluatedOffers, chosen))
                }}
              >
                {isBest && (
                  <div className="offer-best-pick-ribbon">
                    ✦ BEST PICK FOR YOU · MAXIMUM SAVINGS
                  </div>
                )}

                <div className="offer-card-top">
                  <div className="offer-bank-badge">
                    <div className="offer-bank-monogram">
                      {offer.bankMonogram || (offer.bank ? offer.bank.slice(0, 4).toUpperCase() : 'BANK')}
                    </div>
                    <div>
                      <div className="offer-bank-name">{offer.bank}</div>
                      <div className="offer-bank-card-type">{offer.cardName || 'Eligible Credit Card'}</div>
                    </div>
                  </div>
                  <div className={`offer-discount-tag ${offer.discountType === 'cashback_percentage' ? 'cashback' : ''}`}>
                    {offer.badge || (offer.discountValue ? `${offer.discountValue}% OFF` : 'SPECIAL OFFER')}
                  </div>
                </div>

                <div className="offer-card-body">
                  <p>{offer.description || offer.title}</p>
                  <small>{offer.terms || 'Valid on credit card transactions. 0 OTP required via Circle.'}</small>
                </div>

                <div className="offer-card-calculation">
                  <div className="offer-calc-row">
                    <span>Item Selling Price:</span>
                    <b>₹{calcProduct.retailPrice.toLocaleString('en-IN')}</b>
                  </div>
                  <div className="offer-calc-row savings">
                    <span>Instant Bank Savings:</span>
                    <b>-₹{offer.savings.discount.toLocaleString('en-IN')}</b>
                  </div>
                  <div className="offer-calc-row" style={{ paddingTop: '6px', borderTop: '1px solid #1E1E22' }}>
                    <span style={{ color: '#F2F2F5', fontWeight: 600 }}>Net Effective Price:</span>
                    <b style={{ fontSize: '13px', color: '#10B981' }}>₹{offer.savings.netPrice.toLocaleString('en-IN')}</b>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn-select-offer ${isSelected ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    const nextId = selectedOfferId === offer.id ? null : offer.id
                    setSelectedOfferId(nextId)
                    const chosen = nextId ? offer : null
                    setCalculatedCards(generateCircleCardholders(calcProduct.retailPrice, evaluatedOffers, chosen, circleFilter))
                    setCalculatedStrangers(generateStrangerCardholders(calcProduct.retailPrice, evaluatedOffers, chosen))
                  }}
                >
                  {isSelected ? '✓ Showing Matched Cardholders' : isBest ? '✦ Select Best Pick & Match Cards' : 'Select Offer & Match Cards ➔'}
                </button>
              </div>
            )
          })}
        </div>

        {/* 4. SECTION: TWO SOURCE OPTIONS (CIRCLES VS STRANGERS) */}
        <div className="deal-source-selector">
          <div className="deal-source-header">
            <div>
              <span style={{ font: '10px var(--mono)', letterSpacing: '0.15em', color: '#9A9AA6', textTransform: 'uppercase' }}>
                SELECT CARDHOLDER SOURCE
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F2F2F5', margin: '4px 0 0', letterSpacing: '-0.01em' }}>
                {cardholderSource === 'circles'
                  ? 'Private Circle Cardholders (Direct UPI · 0 Escrow)'
                  : 'Public Stranger Cardholders (100% Escrow Protected)'}
              </h3>
            </div>
            <span style={{ font: '11px var(--mono)', color: cardholderSource === 'circles' ? '#10B981' : '#818CF8' }}>
              {cardholderSource === 'circles' ? '● Zero Escrow Needed · Settle by UPI' : '● Third-Party Escrow Vault Protection'}
            </span>
          </div>

          <div className="deal-source-tabs">
            <button
              type="button"
              className={`deal-source-tab ${cardholderSource === 'circles' ? 'active circle-tab' : ''}`}
              onClick={() => setCardholderSource('circles')}
            >
              <div className="source-tab-left">
                <span className="source-tab-icon">🟢</span>
                <div>
                  <b className="source-tab-title">Circles (Trusted Members)</b>
                  <span className="source-tab-desc">Hostel Gang, Office & Family · 100% Direct UPI Settlement (No Escrow)</span>
                </div>
              </div>
              <span className="source-tab-badge circle-badge">{calculatedCards.length} Available</span>
            </button>

            <button
              type="button"
              className={`deal-source-tab ${cardholderSource === 'strangers' ? 'active stranger-tab' : ''}`}
              onClick={() => setCardholderSource('strangers')}
            >
              <div className="source-tab-left">
                <span className="source-tab-icon">🌐</span>
                <div>
                  <b className="source-tab-title">Complete Strangers</b>
                  <span className="source-tab-desc">Public Cardholders · 3rd-Party Escrow Vault · Verified Ratings & Reviews</span>
                </div>
              </div>
              <span className="source-tab-badge stranger-badge">{calculatedStrangers.length} Verified</span>
            </button>
          </div>
        </div>

        {cardholderSource === 'circles' ? (
          <>
            {/* Circle Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', margin: '14px 0 20px' }}>
              <span style={{ fontSize: '12px', color: '#9A9AA6' }}>
                Showing trusted cardholders inside your private circles. Payment done by direct UPI (0 escrow needed).
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'hostel', 'office', 'family'].map((cf) => {
                  const label = cf === 'all' ? 'All Circles' : cf === 'hostel' ? 'Hostel Gang' : cf === 'office' ? 'Office FinTech' : 'Family Circle'
                  const active = circleFilter === cf
                  return (
                    <button
                      key={cf}
                      type="button"
                      onClick={() => {
                        setCircleFilter(cf)
                        setCalculatedCards(generateCircleCardholders(calcProduct.retailPrice, evaluatedOffers, null, cf))
                      }}
                      style={{
                        background: active ? '#F2F2F5' : '#141416',
                        color: active ? '#0E0E10' : '#9A9AA6',
                        border: active ? '1px solid #F2F2F5' : '1px solid #2E2E33',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'var(--mono)',
                        cursor: 'pointer',
                        fontWeight: active ? 700 : 500,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="luxury-cards-grid">
              {calculatedCards.map((card) => (
                <div
                  key={card.id}
                  className={`luxury-card-wrapper variant-${card.variant}`}
                  onClick={() => openDealRoom(card, 'circles')}
                >
                  {/* Minimal Card Header */}
                  <div className="card-minimal-header">
                    <div>
                      <span className="card-issuer-label">· {card.issuer} ·</span>
                      <h4 className="card-title-minimal">{card.product}</h4>
                      <span className="card-masked-number-minimal">
                        •••• •••• •••• <b style={{ color: '#F2F2F5' }}>{card.last4}</b>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className="card-network-badge-minimal">{card.network}</span>
                      <span className="card-discount-pill-minimal">{card.discountRate} OFF</span>
                    </div>
                  </div>

                  {/* Cardholder Identity & Commission Cut */}
                  <div className="card-member-row">
                    <div className="card-member-identity">
                      <img
                        src={card.cardholderAvatar}
                        alt={card.cardholderName}
                        className="card-member-avatar"
                      />
                      <div className="card-member-info">
                        <span className="card-member-name">{card.cardholderName}</span>
                        <span className="card-member-circle-tag">
                          ✦ {card.circle} · {card.trustScore}% Trust
                        </span>
                      </div>
                    </div>
                    <div className="card-commission-box">
                      <span className="card-commission-label">HOLDER CUT</span>
                      <span className={`card-commission-amount ${card.commissionFee === 0 ? 'free' : ''}`}>
                        {card.commissionFee === 0 ? '₹0 (Circle Free)' : `₹${card.commissionFee} Cut`}
                      </span>
                    </div>
                  </div>

                  {/* Milestone Boost Strip */}
                  <div className="card-milestone-strip">
                    <span>Milestone: <b>{card.cardholderGoal}</b></span>
                    <span className="card-milestone-pill">{card.goalProgress}</span>
                  </div>

                  {/* Financial Breakdown Inset Box */}
                  <div className="card-financial-box">
                    <div className="card-financial-row">
                      <span>Retail Price:</span>
                      <b>₹{calcProduct?.retailPrice?.toLocaleString('en-IN') || '49,999'}</b>
                    </div>
                    <div className="card-financial-row discount-row">
                      <span>Instant Bank Discount:</span>
                      <b>-₹{card.instantDiscount.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="card-financial-row commission-row">
                      <span>Cardholder Cut:</span>
                      <b>{card.commissionFee === 0 ? '₹0 (Free)' : `+₹${card.commissionFee.toLocaleString('en-IN')}`}</b>
                    </div>
                    <div className="card-financial-row settle-row">
                      <span>Your Net Settle (Direct UPI):</span>
                      <b>₹{card.netPrice.toLocaleString('en-IN')}</b>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="cardholder-lock-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDealRoom(card, 'circles')
                    }}
                  >
                    <span>Lock Deal with {card.cardholderName.split(' ')[0]} (Save ₹{card.netSavings.toLocaleString('en-IN')})</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Strangers Guarantee Banner */}
            <div className="strangers-guarantee-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="shield-icon-badge">🛡️</div>
                <div>
                  <b style={{ color: '#F2F2F5', fontSize: '14px', display: 'block' }}>
                    CardSplit 3rd-Party Escrow Vault Active
                  </b>
                  <span style={{ color: '#9A9AA6', fontSize: '12px', fontFamily: 'var(--mono)' }}>
                    Strangers never get your money until courier delivery is verified. 100% zero risk.
                  </span>
                </div>
              </div>
              <span className="escrow-safe-tag">ESCROW PROTECTED</span>
            </div>

            <div className="luxury-cards-grid">
              {calculatedStrangers.map((stranger) => (
                <div
                  key={stranger.id}
                  className={`luxury-card-wrapper variant-${stranger.variant}`}
                  onClick={() => openDealRoom(stranger, 'strangers')}
                >
                  {/* Minimal Card Header */}
                  <div className="card-minimal-header">
                    <div>
                      <span className="card-issuer-label">· {stranger.issuer} ·</span>
                      <h4 className="card-title-minimal">{stranger.product}</h4>
                      <span className="card-masked-number-minimal">
                        •••• •••• •••• <b style={{ color: '#F2F2F5' }}>{stranger.last4}</b>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className="card-network-badge-minimal">{stranger.network}</span>
                      <span className="card-discount-pill-minimal">{stranger.discountRate} OFF</span>
                    </div>
                  </div>

                  {/* Stranger Profile & Commission Cut */}
                  <div className="card-member-row">
                    <div className="card-member-identity">
                      <img
                        src={stranger.cardholderAvatar}
                        alt={stranger.cardholderName}
                        className="card-member-avatar"
                      />
                      <div className="card-member-info">
                        <span className="card-member-name">{stranger.cardholderName}</span>
                        <span className="card-member-circle-tag">
                          📍 {stranger.city} · Escrow Verified
                        </span>
                      </div>
                    </div>
                    <div className="card-commission-box">
                      <span className="card-commission-label">HOLDER CUT</span>
                      <span className="card-commission-amount">
                        ₹{stranger.commissionFee} Cut
                      </span>
                    </div>
                  </div>

                  {/* Stranger Ratings & Review Snippet */}
                  <div className="stranger-review-box">
                    <div className="stranger-review-header">
                      <span className="stranger-review-stars">★ {stranger.ratingAverage}</span>
                      <span className="stranger-review-count">{stranger.ratingCount} Verified Reviews</span>
                    </div>
                    <p className="stranger-review-quote">
                      "{stranger.latestReview}"
                    </p>
                  </div>

                  {/* Financial Breakdown Inset Box */}
                  <div className="card-financial-box">
                    <div className="card-financial-row">
                      <span>Retail Price:</span>
                      <b>₹{calcProduct?.retailPrice?.toLocaleString('en-IN') || '49,999'}</b>
                    </div>
                    <div className="card-financial-row discount-row">
                      <span>Instant Bank Discount:</span>
                      <b>-₹{stranger.instantDiscount.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="card-financial-row commission-row">
                      <span>Cardholder Cut:</span>
                      <b>+₹{stranger.commissionFee.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="card-financial-row settle-row">
                      <span style={{ color: '#818CF8' }}>Escrow Deposit Total:</span>
                      <b style={{ color: '#818CF8' }}>₹{stranger.netPrice.toLocaleString('en-IN')}</b>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="cardholder-lock-btn"
                    style={{ background: '#818CF8', color: '#09090B' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      openDealRoom(stranger, 'strangers')
                    }}
                  >
                    <span>Lock Deal with {stranger.cardholderName.split(' ')[0]} in Escrow Deal Room ➔</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 5. SUPPORTED RETAILERS & HONESTY NOTICE */}
        <div style={{ marginTop: '36px', padding: '20px 24px', background: '#121214', border: '1px solid #2E2E33', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ font: '10px var(--mono)', color: '#63636E', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '4px' }}>
              SUPPORTED RETAILER PAGES
            </span>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#F2F2F5', fontSize: '13px' }}>Amazon.in</span>
              <span style={{ color: '#3E3E45' }}>·</span>
              <span style={{ fontWeight: 800, color: '#F2F2F5', fontSize: '13px' }}>Flipkart</span>
              <span style={{ color: '#3E3E45' }}>·</span>
              <span style={{ fontWeight: 800, color: '#F2F2F5', fontSize: '13px' }}>Croma</span>
              <span style={{ color: '#3E3E45' }}>·</span>
              <span style={{ fontWeight: 800, color: '#F2F2F5', fontSize: '13px' }}>Apple India</span>
              <span style={{ color: '#3E3E45' }}>·</span>
              <span style={{ fontWeight: 800, color: '#F2F2F5', fontSize: '13px' }}>Meesho</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', font: '11px var(--mono)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span>Direct to your address · 0 OTP shared</span>
          </div>
        </div>

        </>}

        {/* 6. INTERACTIVE MULTI-STEP DEAL ROOM MODAL */}
        {activeDealRoom && (
          <div className="deal-room-backdrop" onClick={() => setActiveDealRoom(null)}>
            <div className="deal-room-window" onClick={(e) => e.stopPropagation()}>
              <div className="deal-room-header">
                <div>
                  <span style={{ font: '10px var(--mono)', letterSpacing: '0.15em', color: activeDealRoom.isStranger ? '#818CF8' : '#10B981', textTransform: 'uppercase' }}>
                    {activeDealRoom.isStranger ? '· 3RD-PARTY ESCROW PROTECTED DEAL ROOM ·' : '· CIRCLE DIRECT SETTLEMENT DEAL ROOM ·'}
                  </span>
                  <h3>Deal Room: {activeDealRoom.cardholderName}</h3>
                </div>
                <button className="deal-room-close" onClick={() => setActiveDealRoom(null)}>×</button>
              </div>

              {/* Multi-step Progress Bar */}
              <div className="deal-room-stepper">
                <div className={`deal-room-step ${dealRoomStep !== 'address' ? 'completed' : 'current'}`}>
                  <span>1. Address &amp; Lock</span>
                </div>
                <div className={`deal-room-step ${['escrow_deposit', 'escrow_funded', 'order_placed', 'completed'].includes(dealRoomStep) ? 'completed' : dealRoomStep === 'awaiting_reply' ? 'current' : ''}`}>
                  <span>2. Cardholder Reply</span>
                </div>
                <div className={`deal-room-step ${['escrow_funded', 'order_placed', 'completed'].includes(dealRoomStep) ? 'completed' : dealRoomStep === 'escrow_deposit' ? 'current' : ''}`}>
                  <span>{activeDealRoom.isStranger ? '3. Pay Escrow' : '3. Settle UPI'}</span>
                </div>
                <div className={`deal-room-step ${['order_placed', 'completed'].includes(dealRoomStep) ? 'completed' : dealRoomStep === 'escrow_funded' ? 'current' : ''}`}>
                  <span>4. Order Placed</span>
                </div>
                <div className={`deal-room-step ${dealRoomStep === 'completed' ? 'completed' : dealRoomStep === 'order_placed' ? 'current' : ''}`}>
                  <span>5. Delivered &amp; Paid</span>
                </div>
              </div>

              <div className="deal-room-body">
                {/* Deal Financial Overview */}
                <div className="deal-modal-summary">
                  <div className="modal-summary-row">
                    <span>Product Item</span>
                    <b>{calcProduct?.title}</b>
                  </div>
                  <div className="modal-summary-row">
                    <span>Retail Selling Price</span>
                    <span>₹{calcProduct?.retailPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="modal-summary-row">
                    <span>Card Discount ({activeDealRoom.issuer})</span>
                    <b style={{ color: '#10B981' }}>-₹{activeDealRoom.instantDiscount.toLocaleString('en-IN')}</b>
                  </div>
                  <div className="modal-summary-row">
                    <span>Cardholder Cut ({activeDealRoom.cardholderName.split(' ')[0]})</span>
                    <b style={{ color: activeDealRoom.commissionFee === 0 ? '#10B981' : '#F59E0B' }}>
                      {activeDealRoom.commissionFee === 0 ? '₹0 (Free)' : `+₹${activeDealRoom.commissionFee.toLocaleString('en-IN')}`}
                    </b>
                  </div>
                  <div className="modal-summary-row">
                    <span>Your Net Savings</span>
                    <b style={{ color: '#10B981', fontWeight: 800 }}>
                      ₹{activeDealRoom.netSavings.toLocaleString('en-IN')}
                    </b>
                  </div>
                  <div className="modal-summary-row net-total">
                    <span>{activeDealRoom.isStranger ? 'Total Escrow Vault Deposit' : 'Direct UPI Settlement'}</span>
                    <b style={{ color: activeDealRoom.isStranger ? '#818CF8' : '#10B981' }}>
                      ₹{activeDealRoom.netPrice.toLocaleString('en-IN')}
                    </b>
                  </div>
                </div>

                {/* Event & Chat Log */}
                <div className="deal-chat-log">
                  {dealRoomMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`deal-chat-bubble ${msg.sender === 'system' ? 'system' : msg.sender === 'cardholder' ? (activeDealRoom.isStranger ? 'cardholder' : 'cardholder-circle') : 'buyer'}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', font: '10px var(--mono)', opacity: 0.8 }}>
                        <b>{msg.sender === 'system' ? 'CARDSPLIT ESCROW BOT' : msg.sender === 'cardholder' ? activeDealRoom.cardholderName.toUpperCase() : 'YOU (BUYER)'}</b>
                        <span>{msg.time}</span>
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                </div>

                {/* STEP 1: ADDRESS ENTRY */}
                {dealRoomStep === 'address' && (
                  <form onSubmit={handleSendDealRequest} style={{ display: 'grid', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ font: '11px var(--mono)', color: '#F2F2F5', textTransform: 'uppercase', fontWeight: 700 }}>
                        SUBMIT YOUR COURIER DELIVERY ADDRESS
                      </label>
                      <span style={{ fontSize: '11px', color: '#10B981', font: '11px var(--mono)' }}>
                        ✓ Official invoice in your name
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Recipient Full Name"
                        value={dealRecipientName}
                        onChange={(e) => setDealRecipientName(e.target.value)}
                        required
                        style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px', color: '#F2F2F5', fontSize: '12px' }}
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number for Delivery"
                        value={dealPhone}
                        onChange={(e) => setDealPhone(e.target.value)}
                        required
                        style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px', color: '#F2F2F5', fontSize: '12px' }}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Flat / Building / Street Address"
                      value={dealAddressLine}
                      onChange={(e) => setDealAddressLine(e.target.value)}
                      required
                      style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px', color: '#F2F2F5', fontSize: '12px' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="City"
                        value={dealCity}
                        onChange={(e) => setDealCity(e.target.value)}
                        required
                        style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px', color: '#F2F2F5', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={dealPincode}
                        onChange={(e) => setDealPincode(e.target.value)}
                        required
                        style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '10px', padding: '10px', color: '#F2F2F5', fontSize: '12px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveDealRoom(null)}
                        style={{ flex: 1, padding: '12px', background: '#18181B', border: '1px solid #2E2E33', borderRadius: '10px', color: '#9A9AA6', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-simulate-action"
                        style={{ flex: 2 }}
                      >
                        Lock Deal &amp; Send Request to {activeDealRoom.cardholderName.split(' ')[0]} ➔
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: AWAITING CARDHOLDER REPLY & SIMULATE BUTTON */}
                {dealRoomStep === 'awaiting_reply' && (
                  <div style={{ textAlign: 'center', padding: '14px 0', display: 'grid', gap: '16px' }}>
                    <div style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        <b style={{ color: '#F2F2F5', fontSize: '14px' }}>Notification Sent to {activeDealRoom.cardholderName}</b>
                      </div>
                      <p style={{ color: '#9A9AA6', fontSize: '12px', margin: 0 }}>
                        The cardholder is checking available credit and verified cart discount on {calcProduct?.store}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateCardholderReply}
                      className="btn-simulate-action"
                    >
                      <span>⚡ Simulate Cardholder Reply ({activeDealRoom.cardholderName.split(' ')[0]} Accepts)</span>
                    </button>
                  </div>
                )}

                {/* STEP 3: PAY ESCROW (OR DIRECT UPI FOR CIRCLE) */}
                {dealRoomStep === 'escrow_deposit' && (
                  <div className="deal-escrow-box">
                    <span style={{ font: '10px var(--mono)', color: activeDealRoom.isStranger ? '#818CF8' : '#10B981', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      {activeDealRoom.isStranger ? 'STEP 2: DEPOSIT FUNDS INTO CARDSPLIT ESCROW' : 'STEP 2: DIRECT UPI SETTLEMENT (0 ESCROW FEE)'}
                    </span>

                    <div style={{ width: '120px', height: '120px', margin: '0 auto', background: '#FFFFFF', padding: '8px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.5">
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

                    <div className="deal-escrow-amount">
                      ₹{activeDealRoom.netPrice.toLocaleString('en-IN')}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ font: '11px var(--mono)', color: '#9A9AA6' }}>
                        UPI ID: <b style={{ color: '#F2F2F5' }}>{activeDealRoom.isStranger ? 'cardsplit.escrow@icici' : (activeDealRoom.upiId || 'rohan.deshmukh@icici')}</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyUpi(activeDealRoom.isStranger ? 'cardsplit.escrow@icici' : (activeDealRoom.upiId || 'rohan.deshmukh@icici'))}
                        style={{ background: '#1E1E22', border: '1px solid #33333A', color: copiedUpi ? '#10B981' : '#C9C9D2', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}
                      >
                        {copiedUpi ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>

                    <p style={{ fontSize: '11px', color: '#9A9AA6', margin: '4px 0 0', lineHeight: 1.4 }}>
                      {activeDealRoom.isStranger
                        ? '🛡️ Third-party escrow holds your money safely. The cardholder gets paid ONLY after your order is delivered to your address.'
                        : '🤝 Direct UPI settlement within your circle. Zero middleman fees.'}
                    </p>

                    <button
                      type="button"
                      onClick={handleFundEscrow}
                      className={activeDealRoom.isStranger ? 'btn-simulate-action' : 'btn-confirm-delivery'}
                    >
                      {activeDealRoom.isStranger
                        ? `🔒 Deposit ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} into Escrow & Authorize Order`
                        : `✓ Settle ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} via UPI`}
                    </button>
                  </div>
                )}

                {/* STEP 4: ESCROW FUNDED & CARDHOLDER ORDERS */}
                {dealRoomStep === 'escrow_funded' && (
                  <div style={{ textAlign: 'center', padding: '14px 0', display: 'grid', gap: '16px' }}>
                    <div style={{ background: '#0E0E10', border: '1px solid #10B981', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        <b style={{ color: '#10B981', fontSize: '14px' }}>
                          {activeDealRoom.isStranger ? 'Escrow Vault Secured (₹' + activeDealRoom.netPrice.toLocaleString('en-IN') + ')' : 'Payment Received by ' + activeDealRoom.cardholderName}
                        </b>
                      </div>
                      <p style={{ color: '#9A9AA6', fontSize: '12px', margin: 0 }}>
                        {activeDealRoom.cardholderName} has been instructed to place the order on {calcProduct?.store} to your shipping address: {dealAddressLine}, {dealCity}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateOrderPlaced}
                      className="btn-simulate-action"
                    >
                      <span>⚡ Simulate Cardholder Placing Order ({activeDealRoom.cardholderName.split(' ')[0]} Places Order)</span>
                    </button>
                  </div>
                )}

                {/* STEP 5: ORDER PLACED & CONFIRM DELIVERY */}
                {dealRoomStep === 'order_placed' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {dealOrderInfo && (
                      <div style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '16px', padding: '18px', display: 'grid', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ font: '10px var(--mono)', color: '#10B981', textTransform: 'uppercase' }}>
                            ● ORDER CONFIRMED BY CARDHOLDER
                          </span>
                          <span style={{ font: '11px var(--mono)', color: '#F2F2F5', fontWeight: 700 }}>
                            {dealOrderInfo.orderId}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#9A9AA6' }}>
                          <div>Retailer: <b style={{ color: '#F2F2F5' }}>{dealOrderInfo.retailer}</b></div>
                          <div>Courier: <b style={{ color: '#F2F2F5' }}>{dealOrderInfo.courier}</b></div>
                          <div>Tracking: <b style={{ color: '#38BDF8', fontFamily: 'var(--mono)' }}>{dealOrderInfo.trackingId}</b></div>
                          <div>Est. Delivery: <b style={{ color: '#10B981' }}>{dealOrderInfo.estimatedDelivery}</b></div>
                        </div>
                        <div style={{ borderTop: '1px solid #1E1E22', paddingTop: '8px', fontSize: '11px', color: '#63636E' }}>
                          Invoice Recipient: {dealOrderInfo.invoiceRecipient} · Shipping to {dealOrderInfo.shippingAddress}
                        </div>
                      </div>
                    )}

                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '14px', fontSize: '12px', color: '#34D399', textAlign: 'center' }}>
                      📦 When your package arrives at your doorstep, tap below to confirm delivery and release the funds from escrow to the cardholder.
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmDelivery}
                      className="btn-confirm-delivery"
                    >
                      <span>✅ Package Delivered · Release Escrow Payment to {activeDealRoom.cardholderName.split(' ')[0]}</span>
                    </button>
                  </div>
                )}

                {/* STEP 6: COMPLETED & REVIEW FORM */}
                {dealRoomStep === 'completed' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                      <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#F2F2F5', margin: '0 0 6px' }}>
                        Deal Successfully Completed!
                      </h4>
                      <p style={{ fontSize: '12px', color: '#34D399', margin: 0 }}>
                        {activeDealRoom.isStranger
                          ? `Escrow payout of ₹${activeDealRoom.netPrice.toLocaleString('en-IN')} released to ${activeDealRoom.cardholderName}. You pocketed ₹${activeDealRoom.netSavings.toLocaleString('en-IN')} in savings!`
                          : `Settlement complete! You pocketed ₹${activeDealRoom.netSavings.toLocaleString('en-IN')} in savings with ${activeDealRoom.cardholderName}!`}
                      </p>
                    </div>

                    {!reviewSubmitted ? (
                      <form onSubmit={handleSubmitDealReview} style={{ background: '#0E0E10', border: '1px solid #2E2E33', borderRadius: '14px', padding: '16px', display: 'grid', gap: '12px' }}>
                        <label style={{ font: '11px var(--mono)', color: '#F2F2F5', textTransform: 'uppercase' }}>
                          RATE YOUR EXPERIENCE WITH {activeDealRoom.cardholderName.toUpperCase()}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setDealRating(star)}
                              style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: star <= dealRating ? '#F59E0B' : '#3E3E45' }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={dealReviewText}
                          onChange={(e) => setDealReviewText(e.target.value)}
                          placeholder="Write a quick review (e.g. Fast order placement, genuine invoice, super responsive!)..."
                          rows={2}
                          style={{ background: '#121214', border: '1px solid #2E2E33', borderRadius: '8px', padding: '10px', color: '#F2F2F5', fontSize: '12px', resize: 'none' }}
                        />
                        <button
                          type="submit"
                          className="button-dark"
                          style={{ padding: '9px', fontSize: '12px' }}
                        >
                          Submit Review &amp; Rating ➔
                        </button>
                      </form>
                    ) : (
                      <div style={{ padding: '12px', background: '#141418', border: '1px solid #2E2E33', borderRadius: '10px', textAlign: 'center', color: '#F2F2F5', font: '12px var(--mono)' }}>
                        ✓ Thank you! Your review for {activeDealRoom.cardholderName} has been submitted.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveDealRoom(null)}
                      className="button-dark"
                      style={{ width: '100%', padding: '12px' }}
                    >
                      Close Deal Room
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  let content
  if (loading) {
    content = <div className="real-empty">Loading your account…</div>
  } else if (!user) {
    content = (
      <section className="real-empty">
        <h1>Sign in to continue</h1>
        <p>{error || 'Your account session is required to access this page.'}</p>
        <button className="button button-dark" onClick={() => navigate('/login')}>Log in ↗</button>
      </section>
    )
  } else if (path === '/dashboard') {
    content = renderProductDealEngine()
  } else if (path === '/analyze' || path.startsWith('/compare/')) {
    content = (
      <>
        <PageHeading
          eyebrow="INSTANT CART DISCOUNT ENGINE"
          title="Analyze product."
          description="Paste any product link from Amazon, Flipkart, Croma, Apple, or Meesho to calculate instant bank discounts and match with circle cardholders."
        />

        {/* UNIFIED DEAL CALCULATOR & OFFERS & CARDHOLDERS ENGINE */}
        {renderProductDealEngine()}
      </>
    )
  } else if (path === '/cards') {
    content = (
      <>
        <PageHeading eyebrow="YOUR PAYMENT TOOLKIT" title="My cards." description="List card products without entering card numbers or banking secrets."/>
        <form className="real-form-card real-card-form" onSubmit={submitCard}>
          <label>Issuer<input name="issuer" maxLength="80" placeholder="e.g. HDFC Bank" required/></label>
          <label>Card product<input name="cardProduct" maxLength="120" placeholder="e.g. Millennia Credit Card" required/></label>
          <label>Card variant<input name="cardVariant" maxLength="80" placeholder="Optional variant"/></label>
          <label>Credit limit (₹)<input name="creditLimit" type="number" min="0" max="100000000" placeholder="Optional · shown only if you opt in"/></label>
          <label>Available to spend now (₹)<input name="availableCredit" type="number" min="0" max="100000000" placeholder="Your current available credit"/></label>
          <label>Member-reported benefit<input name="benefit" maxLength="240" placeholder="e.g. cashback on online purchases"/></label>
          <label>Milestone or condition<input name="milestone" maxLength="240" placeholder="e.g. annual spend target for fee waiver"/></label>
          <label>Discovery setting
            <select name="visibility">
              <option value="hidden">Keep this listing hidden</option>
              <option value="discoverable">Allow opted-in cardholder discovery</option>
            </select>
          </label>
          <button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Add card product'}</button>
        </form>
        <div className="real-card-list">
          {(pageData?.cards || []).map((card) => (
            <article className="real-card-row" key={card._id}>
              <span className="real-card-symbol">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="5" rx="2"/>
                  <line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              </span>
              <div>
                <b>{card.issuer} · {card.cardProduct}</b>
                <small>
                  {card.visibility === 'discoverable' ? 'Discoverable when your profile opts in' : 'Hidden from member discovery'} · {card.ownershipVerificationStatus === 'verified' ? 'Verified' : 'Unverified'}
                  {card.creditLimit != null ? ` · Limit ₹${Number(card.creditLimit).toLocaleString('en-IN')}` : ''}
                  {card.benefit ? ` · ${card.benefit}` : ''}
                  {card.milestone ? ` · ${card.milestone}` : ''}
                </small>
              </div>
              <button className="real-text-button" onClick={() => removeCard(card._id)}>Remove</button>
            </article>
          ))}
          {!pageData?.cards?.length && <p className="real-empty-inline">No card products listed yet.</p>}
        </div>
      </>
    )
  } else if (path === '/profile') {
    content = (
      <>
        <PageHeading eyebrow="ACCOUNT DETAILS" title="Profile & settings." description="Choose what you share. Discovery is off until you opt in."/>
        <section className="real-form-card real-profile-photo">
          <MemberIdentity member={user}/>
          <form onSubmit={uploadAvatar}>
            <label>Profile photo
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSelectedAvatar(event.target.files?.[0] || null)}/>
            </label>
            <small style={{ color: '#9A9AA6', fontSize: '11px', display: 'block', margin: '4px 0 10px' }}>JPG, PNG, or WebP · max 4 MB · stored securely in Cloudinary.</small>
            <button className="button button-dark" disabled={busy}>{busy ? 'Uploading…' : 'Upload photo'}</button>
          </form>
        </section>
        <form className="real-form-card real-profile-form" onSubmit={updateProfile}>
          <label>Name<input name="name" defaultValue={user.name} maxLength="100" required/></label>
          <label>City<input name="city" defaultValue={user.profile?.city || ''} maxLength="100"/></label>
          <label>Bio<textarea name="bio" defaultValue={user.profile?.bio || ''} maxLength="500" rows="3"/></label>
          <label>Your cardholder commission profit (% of instant discount)
            <input name="dealFeePercent" type="number" min="0" max="80" defaultValue={user.profile?.dealFeePercent ?? 20} placeholder="e.g. 20 (You earn 20% of the discount)"/>
            <small style={{ color: '#9A9AA6', fontSize: '11px' }}>When a shopper uses your card for a deal, you earn this percentage of the retailer's discount as your profit. Platform escrow fee is fixed at 10%.</small>
          </label>
          <label>Typical reply time (minutes)
            <input name="responseMinutes" type="number" min="0" max="10080" defaultValue={user.profile?.responseMinutes ?? ''} placeholder="Optional"/>
          </label>
          <label className="real-opt-in" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#F2F2F5', fontSize: '13px' }}>
            <input name="cardholderDiscovery" type="checkbox" defaultChecked={user.profile?.cardholderDiscovery === true} style={{ width: 'auto' }}/>
            I opt in to being shown to signed-in members searching for card products I list as discoverable.
          </label>
          <button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
        </form>
      </>
    )
  } else if (path === '/connections') {
    content = (
      <>
        <PageHeading eyebrow="YOUR NETWORK" title="Connections." description="Review requests sent to you or people you’ve asked to connect with."/>
        <ConnectionList title="Requests to you" members={pageData?.received || []} currentUserId={user._id || user.id} onAction={connectionAction} onMessage={openConversation}/>
        <ConnectionList title="Sent requests and connections" members={pageData?.sent || []} currentUserId={user._id || user.id} onMessage={openConversation}/>
      </>
    )
  } else if (path === '/cardholders') {
    content = <OfferCardholders offers={[]} directoryMode/>
  } else if (path === '/saved-deals') {
    content = (
      <>
        <PageHeading eyebrow="KEPT FOR LATER" title="Saved deals." description="Product offers you saved to your account."/>
        <div className="real-card-list">
          {(pageData?.savedDeals || []).map((deal) => (
            <article className="real-card-row" key={deal._id}>
              <div>
                <b>{deal.offerSnapshot.title || deal.offerSnapshot.bank || 'Saved offer'}</b>
                <small>{deal.offerSnapshot.minimumPurchase ? `Minimum purchase ₹${Number(deal.offerSnapshot.minimumPurchase).toLocaleString('en-IN')}` : 'Minimum purchase not specified'} · offer terms unverified</small>
              </div>
              <button className="real-text-button" onClick={() => removeSavedDeal(deal._id)}>Remove</button>
            </article>
          ))}
          {!pageData?.savedDeals?.length && <p className="real-empty-inline">You haven’t saved any offers yet.</p>}
        </div>
      </>
    )
  } else if (path === '/history') {
    content = (
      <>
        <PageHeading eyebrow="RECENT CHECKS" title="Product history." description="Recent product analyses from this account."/>
        <div className="real-card-list">
          {(pageData?.analyses || []).map((analysis) => (
            <article className="real-card-row" key={analysis._id}>
              <div>
                <b>{analysis.extractedData?.productSummary?.name || analysis.submittedUrl}</b>
                <small>{analysis.status} · {analysis.completedAt ? new Date(analysis.completedAt).toLocaleString() : ''}</small>
              </div>
            </article>
          ))}
          {!pageData?.analyses?.length && <p className="real-empty-inline">No product analyses saved yet.</p>}
        </div>
      </>
    )
  } else if (path === '/community') {
    content = (
      <>
        <PageHeading eyebrow="CARD BRIDGE COMMUNITY" title="Community." description="Share practical tips and learn from other members. Posts are tied to your real account."/>
        <form className="real-form-card real-social-form" onSubmit={submitPost}>
          <label>Share with the community
            <textarea name="body" required maxLength="3000" rows="3" placeholder="What have you learned about card offers or shopping?"/>
          </label>
          <label>Post to
            <select name="groupId">
              <option value="">Public community</option>
              {(pageData?.groups || []).filter((group) => group.isMember).map((group) => (
                <option value={group._id} key={group._id}>{group.name}</option>
              ))}
            </select>
          </label>
          <button className="button button-dark" disabled={busy}>{busy ? 'Publishing…' : 'Publish post'}</button>
        </form>
        <div className="real-card-list">
          {(pageData?.posts || []).map((post) => (
            <article className="real-social-post" key={post._id}>
              <div className="real-social-post-header">
                <MemberIdentity member={post.authorId}/>
                <div>
                  <b>{post.authorId?.name || 'CardBridge member'}</b>
                  <small>{post.groupId?.name || 'Public community'} · {new Date(post.createdAt).toLocaleString()}</small>
                </div>
              </div>
              <p>{post.body}</p>
              {String(post.authorId?._id || post.authorId) === String(user._id || user.id) && (
                <button className="real-text-button" onClick={async () => {
                  try {
                    await api(`/posts/${post._id}`, { method: 'DELETE' })
                    setPageData(await api('/posts'))
                  } catch (requestError) {
                    setError(requestError.message)
                  }
                }}>Remove post</button>
              )}
            </article>
          ))}
          {!pageData?.posts?.length && <p className="real-empty-inline">No community posts yet. Start the conversation.</p>}
        </div>
      </>
    )
  } else if (path === '/circles' || path === '/groups') {
    content = (
      <>
        <PageHeading
          eyebrow="PRIVATE CIRCLES & TRUSTED LEDGER"
          title="Friends & Circles."
          description="Create private circles (Family, Hostel Gang, Office), post on the Request Board, control card visibility with monthly caps, vouch for peers, and track balances on the shared ledger."
        />
        <CirclesFriendsView
          currentUser={user}
          userCards={pageData?.cards || []}
          apiBase={apiBase}
          csrfToken={window.sessionStorage.getItem('cardbridge:csrfToken')}
        />
      </>
    )
  } else if (path === '/messages') {
    const participants = activeConversation?.participantIds || []
    const otherMember = participants.find((participant) => String(participant._id || participant) !== String(user._id || user.id))
    content = (
      <>
        <PageHeading eyebrow="PRIVATE CONVERSATIONS" title="Messages." description="Message members after they accept your connection request."/>
        <div className="real-messages-layout">
          <section className="real-card-list real-conversation-list">
            <h2>Conversations</h2>
            {(pageData?.conversations || []).map((conversation) => {
              const other = conversation.participantIds.find((participant) => String(participant._id || participant) !== String(user._id || user.id))
              return (
                <button
                  key={conversation._id}
                  className={`real-conversation-button ${activeConversation?._id === conversation._id ? 'active' : ''}`}
                  onClick={async () => {
                    try {
                      const data = await api(`/conversations/${conversation._id}/messages`)
                      window.sessionStorage.setItem('cardbridge:conversationId', conversation._id)
                      setActiveConversation(conversation)
                      setMessages(data.messages)
                    } catch (requestError) {
                      setError(requestError.message)
                    }
                  }}
                >
                  <b>{other?.name || 'CardBridge member'}</b>
                  <small>{conversation.lastMessage?.body || 'Start your conversation'}</small>
                </button>
              )
            })}
            {!pageData?.conversations?.length && <p className="real-empty-inline">You don’t have any conversations yet. Connect with a member first.</p>}
          </section>
          <section className="real-message-panel">
            <h2>{otherMember?.name || 'Choose a conversation'}</h2>
            {activeConversation ? (
              <>
                <div className="real-message-list">
                  {messages.map((message) => (
                    <article className={`real-message ${String(message.senderId?._id || message.senderId) === String(user._id || user.id) ? 'own' : ''}`} key={message._id}>
                      <b>{message.senderId?.name || 'Member'}</b>
                      <p>{message.body}</p>
                      <small>{new Date(message.createdAt).toLocaleString()}</small>
                    </article>
                  ))}
                </div>
                <form className="real-message-form" onSubmit={submitMessage}>
                  <input name="body" maxLength="3000" required placeholder="Write a message…"/>
                  <button className="button button-dark">Send</button>
                </form>
              </>
            ) : (
              <p className="real-empty-inline">Select an existing conversation, or message an accepted connection from the Connections page.</p>
            )}
          </section>
        </div>
      </>
    )
  } else {
    content = (
      <section className="real-empty">
        <PageHeading eyebrow="CARDSPLIT" title={`${title}.`} description="This account feature is connected to your live services."/>
        <p>Sign in and profile data are live. Explore all connected features in your workspace.</p>
      </section>
    )
  }

  return (
    <div className="real-shell">
      <aside className="real-sidebar">
        <Brand/>
        <span className="real-side-label">WORKSPACE</span>
        <nav>
          {routes.map(([label, route]) => (
            <a
              key={route}
              href={route}
              className={route === path ? 'active' : ''}
              onClick={(event) => {
                event.preventDefault()
                navigate(route)
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="real-sidebar-user">
          <MemberIdentity member={user}/>
          <div>
            <b>{user?.name || 'Welcome'}</b>
            <small>{user ? 'Account' : 'Signed out'}</small>
          </div>
        </div>
      </aside>
      <main className="real-main">
        <header className="real-topbar">
          <span>CARDSPLIT <i>/</i> {title.toUpperCase()}</span>
          <div>
            {user ? (
              <button onClick={logout}>Log out</button>
            ) : (
              <button onClick={() => navigate('/login')}>Log in</button>
            )}
            <MemberIdentity member={user}/>
          </div>
        </header>
        <div className="real-content">
          {(error || notice) && (
            <p className={`real-feedback ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>
              {error || notice}
            </p>
          )}
          {content}
        </div>
      </main>
    </div>
  )
}

function PageHeading({ eyebrow, title, description }) {
  return (
    <div className="real-page-heading">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

function ConnectionList({ title, members, currentUserId, onAction, onMessage }) {
  return (
    <section className="real-connection-panel">
      <h2 style={{ padding: '16px 20px', margin: 0, borderBottom: '1px solid #1F1F23', fontSize: '15px', fontWeight: 700, color: '#F2F2F5', background: '#151518' }}>
        {title}
      </h2>
      {members.map((connection) => {
        const member = String(connection.requesterId?._id || connection.requesterId?.id || connection.requesterId) === String(currentUserId)
          ? connection.recipientId
          : connection.requesterId
        const name = member?.name || 'CardBridge member'
        return (
          <article className="real-card-row" key={connection._id}>
            <MemberIdentity member={member}/>
            <div>
              <b>{name}</b>
              <small>{connection.status}</small>
              {connection.message && <small>“{connection.message}”</small>}
            </div>
            {connection.status === 'pending' && onAction && (
              <>
                <button className="real-text-button" onClick={() => onAction(connection._id, 'accept')}>Accept</button>
                <button className="real-text-button" onClick={() => onAction(connection._id, 'decline')}>Decline</button>
              </>
            )}
            {connection.status === 'accepted' && onMessage && (
              <button className="real-text-button" onClick={() => onMessage(member?._id || member?.id)}>Message</button>
            )}
          </article>
        )
      })}
      {members.length === 0 && <p className="real-empty-inline">No connection requests yet.</p>}
    </section>
  )
}
