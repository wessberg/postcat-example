import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { Studio } from './studio/Studio.jsx'

const cats = [
  { name: 'Marmalade Morning', type: 'A5 risograph', color: '#ef6b4d', bg: '#f8d7b7', pose: 'sun' },
  { name: 'Blue Hour', type: 'A6 letterpress', color: '#304b72', bg: '#bac8db', pose: 'moon' },
  { name: 'The Window Seat', type: 'A5 offset print', color: '#1d675d', bg: '#c9ded2', pose: 'window' },
]

function CatMark() {
  return <span className="mark" aria-hidden="true"><i /> <i /></span>
}

function CatArt({ pose, color, bg }) {
  const palette = { '--ink': color, '--paper': bg }
  return <div className="cat-art" style={palette}>
    {pose === 'window' && <div className="window-lines" />}
    {pose === 'moon' && <div className="moon">◐</div>}
    <div className="cat-head"><span className="ear left" /><span className="ear right" /><span className="eye left" /><span className="eye right" /><span className="nose" /></div>
    <div className="cat-body"><span className="tail" /></div>
    <span className="stamp">POSTCAT<br />✦ 22</span>
  </div>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingCat, setEditingCat] = useState(null)
  const visibleCats = cats.filter(cat => filter === 'all' || (filter === 'warm' ? cat.pose === 'sun' : cat.pose !== 'sun'))

  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 761px)')
    const closeMenu = () => { if (breakpoint.matches) setMenuOpen(false) }
    breakpoint.addEventListener('change', closeMenu)
    return () => breakpoint.removeEventListener('change', closeMenu)
  }, [])

  function selectFilter(nextFilter) {
    setFilter(nextFilter)
  }

  return <>
    <header className="site-header">
      <a className="logo" href="#top"><CatMark />POSTCAT</a>
      <nav id="primary-nav" className={menuOpen ? 'nav open' : 'nav'} onClick={() => setMenuOpen(false)}>
        <a href="#collection">The collection</a><a href="#about">Our little studio</a><a href="#journal">Journal</a>
      </nav>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen} aria-controls="primary-nav"><span /> <span /></button>
      <a className="header-shop" href="#collection">Shop the cards <span>↗</span></a>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Independent cat stationery · Est. 2021</p>
          <h1>Small cards<br /><em>for big</em><br />feelings.</h1>
          <p className="hero-lede">Postcat is a tiny design studio making very good postcards about very good cats.</p>
          <a className="button dark" href="#collection">Meet the collection <span>↘</span></a>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-card"><CatArt pose="sun" color="#cc4f39" bg="#f6c798" /><span className="card-caption">Wish you<br />were here</span></div>
          <div className="scribble">sent with<br />love <b>♡</b></div>
        </div>
        <span className="vertical-note">VOLUME 04 / THE SUNROOM SERIES</span>
      </section>

      <section className="ticker"><div>CAT PEOPLE UNITE</div><span>✦</span><div>MADE TO BE MAILED</div><span>✦</span><div>CAT PEOPLE UNITE</div><span>✦</span></section>

      <section className="collection" id="collection">
        <div className="section-heading"><div><p className="eyebrow">A very small collection</p><h2>Pick a cat.<br /><em>Send a feeling.</em></h2></div><p className="heading-note">Three paper goods, lovingly designed<br />for the moments that deserve a stamp.</p></div>
        <div className="filter-row">{[['all', 'All cards'], ['warm', 'Warm tones'], ['cool', 'Cool tones']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => selectFilter(value)}>{label}</button>)}<span>{String(visibleCats.length).padStart(2, '0')} / 03 cards</span></div>
        <div className="card-grid">{visibleCats.map((cat, index) => <article className={'product-card card-' + index} key={cat.name}><div className="product-image"><CatArt {...cat} /></div><div className="product-meta"><div><h3>{cat.name}</h3><p>{cat.type} · blank inside</p></div><strong>€4.50</strong></div><button className="card-link" onClick={() => setEditingCat(cat)}>Personalize this card <span>↗</span></button></article>)}</div>
      </section>

      <section className="manifesto" id="about"><div className="manifesto-cat"><div className="big-cat"><span className="big-ear left" /><span className="big-ear right" /><span className="big-eye left" /><span className="big-eye right" /></div><div className="whiskers" /></div><div className="manifesto-copy"><p className="eyebrow">Nothing more, nothing less</p><h2>We only do<br /><em>cats on paper.</em></h2><p>There are plenty of things to make in this world. We chose one: tiny, joyful paper portraits of the creatures who run our homes.</p><a className="text-link" href="#journal">Read our story <span>↗</span></a></div></section>

      <section className="journal" id="journal"><div className="journal-top"><div><p className="eyebrow">From the journal</p><h2>Notes from<br /><em>the windowsill.</em></h2></div><a className="text-link" href="#journal">All notes <span>↗</span></a></div><div className="journal-grid"><article><div className="journal-image green"><span>✺</span></div><p className="eyebrow">Field notes · 06.14</p><h3>On the art of catching a cat in a sunbeam</h3></article><article><div className="journal-image blue"><span>☾</span></div><p className="eyebrow">Studio visit · 05.28</p><h3>A slow afternoon with Agnes and her favourite chair</h3></article></div></section>

      <section className="newsletter"><div><p className="eyebrow">A note in your inbox</p><h2>Postcards from<br /><em>Postcat.</em></h2></div><form onSubmit={(e) => { e.preventDefault(); setSubscribed(true) }}><label htmlFor="email">New cards, studio notes,<br />no more than once a month.</label><div className="email-line"><input id="email" type="email" placeholder="your@email.com" /><button type="submit">{subscribed ? 'You’re in ✦' : 'Subscribe ↗'}</button></div></form></section>
    </main>
    <footer><a className="logo" href="#top"><CatMark />POSTCAT</a><p>Made for cat people, by cat people.</p><span>© 2024 Postcat studio</span></footer>
    {editingCat && <Studio key={editingCat.pose} cat={editingCat} onClose={() => setEditingCat(null)} />}
  </>
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
