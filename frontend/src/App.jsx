import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bitcoin, TrendingUp, Wallet, CalendarDays, Moon, Sun, History, Download, RefreshCw, Trash2, ArrowUpRight, CircleDollarSign } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { calculateInvestment, getHistory, saveHistory, deleteHistory } from './services/api'

const coins = [
  {id:'bitcoin', name:'Bitcoin', symbol:'BTC', color:'#f7931a'},
  {id:'ethereum', name:'Ethereum', symbol:'ETH', color:'#7c8cff'},
  {id:'solana', name:'Solana', symbol:'SOL', color:'#9c7cff'},
  {id:'ripple', name:'XRP', symbol:'XRP', color:'#64748b'},
  {id:'dogecoin', name:'Dogecoin', symbol:'DOGE', color:'#c5a253'}
]
const currencies = {USD:'$', INR:'₹', EUR:'€', GBP:'£'}
const money = (value, currency='USD') => `${currencies[currency] || '$'}${Number(value || 0).toLocaleString('en-US',{maximumFractionDigits:2, minimumFractionDigits:2})}`
const today = new Date().toISOString().slice(0,10)
const defaultDate = `${new Date().getFullYear()-2}-01-01`

export default function App() {
  const [coin, setCoin] = useState('bitcoin')
  const [purchaseDate, setPurchaseDate] = useState(defaultDate)
  const [amount, setAmount] = useState('1000')
  const [currency, setCurrency] = useState('USD')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(true)
  const selectedCoin = coins.find(c=>c.id===coin) || coins[0]
  const chartData = useMemo(()=> result ? [
    {name:'Then', value:Number(amount)}, {name:'Today', value:result.current_value}
  ] : [], [result, amount])

  async function loadHistory() {
    try { setHistory(await getHistory()) } catch { /* backend may not be running yet */ }
  }
  useEffect(()=>{ loadHistory() }, [])
  async function calculate() {
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await calculateInvestment({coin_id:coin, purchase_date:purchaseDate, amount:Number(amount), currency})
      setResult(data)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }
  async function save() {
    if (!result) return
    try { await saveHistory(result); await loadHistory() } catch(e) { setError(e.message) }
  }
  async function remove(id) {
    try { await deleteHistory(id); await loadHistory() } catch(e) { setError(e.message) }
  }
  function exportCsv() {
    if (!result) return
    const rows = [['Coin','Purchase date','Investment','Currency','Historical price','Current price','Coins','Current value','Profit/Loss','Return %','Source'],
      [selectedCoin.symbol, result.purchase_date, result.amount, result.currency, result.historical_price, result.current_price, result.quantity, result.current_value, result.profit_loss, result.return_pct, result.source]]
    const csv = rows.map(row=>row.map(v=>`"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}))
    const a = document.createElement('a'); a.href=url; a.download='crypto-calculation.csv'; a.click(); URL.revokeObjectURL(url)
  }
  return <div className={dark?'app dark':'app light'}>
    <nav className="nav wrap">
      <a className="brand" href="#"><span className="brand-icon"><Bitcoin size={23}/></span><span>Crypto<span className="brand-muted">Past</span></span></a>
      <div className="nav-right"><span className="live-pill"><i/> Historical calculator</span><button className="icon-button" onClick={()=>setDark(!dark)} aria-label="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>
    </nav>
    <main className="wrap">
      <section className="hero">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.55}}>
          <div className="eyebrow"><span className="eyebrow-line"/> YOUR WHAT-IF INVESTMENT TOOL</div>
          <h1>If you had bought<br/><span>crypto back then.</span></h1>
          <p className="hero-copy">A little time travel for your portfolio. Choose a coin, pick your date, and see what your investment might be worth today.</p>
        </motion.div>
        <motion.div className="hero-orb" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{duration:.8}}><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><div className="orb-coin"><Bitcoin size={68}/></div><span className="orb-label">WHAT IF?</span></motion.div>
      </section>
      <section className="workspace">
        <div className="panel form-panel">
          <div className="section-heading"><div><span className="step">01 / INPUT</span><h2>Build your scenario</h2></div><span className="small-icon"><Wallet size={19}/></span></div>
          <label>Choose cryptocurrency</label>
          <div className="coin-grid">{coins.map(c=><button key={c.id} onClick={()=>setCoin(c.id)} className={`coin-option ${coin===c.id?'selected':''}`}><span className="coin-dot" style={{'--coin':c.color}}>{c.symbol==='BTC'?'₿':c.symbol==='ETH'?'◆':c.symbol==='SOL'?'◎':c.symbol==='XRP'?'✕':'Ð'}</span><span><b>{c.name}</b><small>{c.symbol}</small></span>{coin===c.id&&<span className="selected-check">✓</span>}</button>)}</div>
          <div className="field-row"><div className="field"><label htmlFor="purchase-date">Purchase date</label><div className="input-wrap"><CalendarDays size={17}/><input id="purchase-date" type="date" max={today} value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)}/></div></div>
          <div className="field"><label htmlFor="currency">Currency</label><select id="currency" value={currency} onChange={e=>setCurrency(e.target.value)}>{Object.keys(currencies).map(c=><option key={c}>{c}</option>)}</select></div></div>
          <label htmlFor="amount">What would you have invested?</label>
          <div className="amount-wrap"><span>{currencies[currency]}</span><input id="amount" type="number" min="0.01" step="any" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="1,000"/><span className="amount-suffix">{currency}</span></div>
          <div className="quick-amounts">{[100,500,1000,5000].map(n=><button key={n} className={Number(amount)===n?'active':''} onClick={()=>setAmount(String(n))}>{currencies[currency]}{n.toLocaleString()}</button>)}</div>
          <button className="primary-button" onClick={calculate} disabled={loading}>{loading?<RefreshCw className="spin" size={18}/>:<TrendingUp size={18}/>} {loading?'Calculating...':'Calculate my returns'} <ArrowUpRight size={18}/></button>
          <p className="form-note"><CircleDollarSign size={14}/> Hypothetical results, not financial advice.</p>
        </div>
        <div className="results-column">
          <div className="panel result-panel">
            <div className="section-heading"><div><span className="step">02 / YOUR RESULTS</span><h2>The time-travel report</h2></div><span className="small-icon"><TrendingUp size={19}/></span></div>
            {!result ? <div className="empty-state"><div className="empty-icon"><TrendingUp size={28}/></div><h3>Your future-past starts here</h3><p>Choose your investment details and calculate to reveal your hypothetical returns.</p><div className="empty-steps"><span>01 Pick a coin</span><span>02 Set a date</span><span>03 See the result</span></div></div> :
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <div className="result-top"><div><span className="muted-label">ESTIMATED VALUE TODAY</span><div className="big-value">{money(result.current_value,currency)}</div><span className="source-label">{result.source}</span></div><div className={`return-badge ${result.profit_loss>=0?'positive':'negative'}`}>{result.profit_loss>=0?'+':''}{result.return_pct.toFixed(2)}%</div></div>
                <div className="metric-grid">
                  <Metric title="Initial investment" value={money(result.amount,currency)}/>
                  <Metric title="Historical coin price" value={money(result.historical_price,currency)}/>
                  <Metric title="Estimated coins" value={Number(result.quantity).toLocaleString('en-US',{maximumFractionDigits:8})+' '+selectedCoin.symbol}/>
                  <Metric title="Profit / loss" value={(result.profit_loss>=0?'+':'')+money(result.profit_loss,currency)} positive={result.profit_loss>=0}/>
                </div>
                <div className="chart-title"><div><b>Investment comparison</b><small>Initial amount vs estimated value</small></div><span className="chart-tag">2 POINTS</span></div>
                <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}><defs><linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b7cff" stopOpacity={.35}/><stop offset="100%" stopColor="#8b7cff" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid)"/><XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:12}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'var(--muted)',fontSize:11}} axisLine={false} tickLine={false} width={52} tickFormatter={v=>`${currencies[currency]}${Math.round(v)}`}/><Tooltip formatter={v=>money(v,currency)} contentStyle={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}}/><Area type="monotone" dataKey="value" stroke="#8b7cff" strokeWidth={3} fill="url(#fillValue)"/></AreaChart></ResponsiveContainer></div>
                <div className="result-actions"><button className="secondary-button" onClick={save}><History size={16}/> Save calculation</button><button className="secondary-button" onClick={exportCsv}><Download size={16}/> Export CSV</button></div>
              </motion.div>}
          </div>
          {error&&<div className="error-box">{error}</div>}
          <div className="data-note"><span className="data-note-dot"/> <div><b>Price data transparency</b><p>Demo mode uses illustrative prices only. Check the source label in your results; configure a CoinGecko API key for live data. Currency conversions in demo mode are approximate examples, not historical FX rates.</p></div></div>
        </div>
      </section>
      <section className="history-section panel"><div className="section-heading"><div><span className="step">03 / SAVED SCENARIOS</span><h2>Your calculation history</h2></div><span className="history-count">{history.length} saved</span></div>
        {!history.length?<p className="history-empty">Your saved calculations will appear here. Run a scenario and select “Save calculation”.</p>:<div className="history-list">{history.map(item=><div className="history-item" key={item.id}><div className="history-coin">{item.symbol}</div><div className="history-main"><b>{item.symbol} · {item.purchase_date}</b><small>{money(item.amount,item.currency)} invested · {item.source}</small></div><div className="history-value"><b>{money(item.current_value,item.currency)}</b><small className={item.profit_loss>=0?'gain':'loss'}>{item.profit_loss>=0?'+':''}{money(item.profit_loss,item.currency)} ({Number(item.return_pct).toFixed(2)}%)</small></div><button className="icon-button delete-button" onClick={()=>remove(item.id)} aria-label="Delete saved calculation"><Trash2 size={16}/></button></div>)}</div>}
      </section>
      <footer><div className="footer-brand"><Bitcoin size={18}/> CryptoPast</div><p>Hypothetical calculations for educational purposes only. Not financial advice. Results may exclude fees, taxes, slippage, and historical currency-rate differences.</p><span>MADE FOR CURIOSITY · NOT CERTAINTY</span></footer>
    </main>
  </div>
}
function Metric({title,value,positive}) { return <div className="metric"><span>{title}</span><b className={positive===undefined?'':positive?'gain':'loss'}>{value}</b></div> }
