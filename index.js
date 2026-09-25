const { default: makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const readline = require('readline')

const OWNER_NUMBER = '6283183928905'
const OWNER = OWNER_NUMBER + '@s.whatsapp.net'
const OWNER_LID = '147330984579120@lid'
function isOwner(id){
  if(!id) return false
  if(id === OWNER_LID) return true
  let n=id.replace(/[^0-9]/g,'')
  if(n.includes(OWNER_NUMBER)) return true
  if(n.endsWith('83183928905')) return true
  if(id === OWNER) return true
  if(ownersDB && ownersDB[id] === true) return true
  if(ownersDB){
    for(let oid in ownersDB){
      if(ownersDB[oid] !== true) continue
      let on = oid.replace(/[^0-9]/g,'')
      if(on && n && (n.includes(on) || on.includes(n))) return true
    }
  }
  return false
}

const SKINS = {
  'dadu':      { rarity:'Common',    prefix:'🎲', dust:20 },
  'putih':     { rarity:'Common',    prefix:'⚪', dust:20 },
  'biru':      { rarity:'Common',    prefix:'🔵', dust:20 },
  'hijau':     { rarity:'Common',    prefix:'🟢', dust:20 },
  'kuning':    { rarity:'Common',    prefix:'🟡', dust:20 },
  'oranye':    { rarity:'Common',    prefix:'🟠', dust:20 },
  'ungu':      { rarity:'Common',    prefix:'🟣', dust:20 },
  'permata':   { rarity:'Rare',      prefix:'💎', dust:80 },
  'berlian':   { rarity:'Rare',      prefix:'🔷', dust:80 },
  'target':    { rarity:'Rare',      prefix:'🎯', dust:80 },
  'semanggi':  { rarity:'Rare',      prefix:'🍀', dust:80 },
  'bulan':     { rarity:'Rare',      prefix:'🌙', dust:80 },
  'bintang':   { rarity:'Rare',      prefix:'⭐', dust:80 },
  'api':       { rarity:'Epic',      prefix:'🔥', dust:200 },
  'tengkorak': { rarity:'Epic',      prefix:'💀', dust:200 },
  'mahkota':   { rarity:'Epic',      prefix:'👑', dust:200 },
  'elang':     { rarity:'Epic',      prefix:'🦅', dust:200 },
  'ombak':     { rarity:'Epic',      prefix:'🌊', dust:200 },
  'naga':      { rarity:'Epic',      prefix:'🐉', dust:200 },
  'petir':     { rarity:'Legendary', prefix:'⚡', dust:500 },
  'galaksi':   { rarity:'Legendary', prefix:'🌌', dust:500 },
  'komet':     { rarity:'Legendary', prefix:'☄️', dust:500 },
  'trofi':     { rarity:'Legendary', prefix:'🏆', dust:500 },
  'pusaran':   { rarity:'Legendary', prefix:'💫', dust:500 },
  'unicorn':   { rarity:'Legendary', prefix:'🦄', dust:500 },
}
const RARITY_ROLL = [
  { rarity:'Common',    chance:60 },
  { rarity:'Rare',      chance:30 },
  { rarity:'Epic',      chance:9  },
  { rarity:'Legendary', chance:1  },
]
const RARITY_ICON = { Common:'⚪', Rare:'🔷', Epic:'🔥', Legendary:'⚡' }
const RARITY_BOOST = { Common:0, Rare:0.02, Epic:0.04, Legendary:0.06 }

const ITEMS = {
  'kunci':   { name:'Kunci',       emoji:'🔑', harga:300, desc:'Buat maling (1x pakai)',        maxStack:2  },
  'gembok':  { name:'Gembok',      emoji:'🛡️', harga:500, desc:'Proteksi 12 jam dari maling',    maxStack:5  },
  'gembok_besi': { name:'Gembok Besi', emoji:'🔒', harga:900, desc:'Proteksi 24 jam dari maling', maxStack:5  },
  'bom':     { name:'Bom Asap',    emoji:'💣', harga:700, desc:'Auto-escape kalau ketangkep',    maxStack:3  },
  'topeng':  { name:'Topeng',      emoji:'🎭', harga:400, desc:'+10% chance maling (1x pakai)',  maxStack:3  },
}
const MAX_INVENTORY = 10

const CONFIG = {
  gachaCost: 500,
  gacha10Diskon: 0.10,
  minBetBandar: 500,
  minBetBiasa: 100,
  dailyNormal: 500,
  dailyVip: 1000,
  maxPlayerBandar: 5,
  maxPlayerBiasa: 6,
  autoBatalBiasa: 2*60*1000,
  autoBatalBandar: 3*60*1000,
  cooldownMeja: 15000,
  hadiahBandarMenang: 1.8,
  komisiBandar: 0.01,
  komisiBiasa: 0.01,
  bankBunga: 0.01,
  malingChance: 0.25,
  malingDenda: 0.3,
  malingMax: 0.3,
  malingCooldown: 60*60*1000,
  malingMaxPerDay: 2,
  malingShieldTembus: 0.10,
  hargaKunci: 300,
  hargaGembok: 500,
  hargaGembokBesi: 900,
  hargaBom: 700,
  hargaTopeng: 400,
  shieldGembokJam: 12,
  shieldGembokBesiJam: 24,
  boostRare: 0.02,
  boostEpic: 0.04,
  boostLegendary: 0.06,
  jualSkinRate: 1.0,

  togelMinBet: 1000,
  togelMaxPerAngka: 1000000,
  togelHadiah2D: 50,
  togelHadiah3D: 300,
  togelHadiah4D: 2000,
  togelDiskon2D: 0.28,
  togelDiskon3D: 0.40,
  togelDiskon4D: 0.65,
  togelPasaran: {
    'KMB': { nama:'KAMBOJA',   emoji:'🇰🇭', tutupJam:11, tutupMenit:0, hasilJam:11, hasilMenit:30 },
    'SDY': { nama:'SYDNEY',    emoji:'🇦🇺', tutupJam:13, tutupMenit:0, hasilJam:13, hasilMenit:30 },
    'SG':  { nama:'SINGAPORE', emoji:'🦁', tutupJam:17, tutupMenit:0, hasilJam:17, hasilMenit:30 },
    'JPN': { nama:'JEPANG',    emoji:'🗾', tutupJam:19, tutupMenit:0, hasilJam:19, hasilMenit:30 },
    'HK':  { nama:'HONGKONG',  emoji:'🇭🇰', tutupJam:22, tutupMenit:0, hasilJam:23, hasilMenit:0 }
  },
  togelNotifReminder60: true,
  togelNotifReminder10: true,
  togelNotifReminder1: true,
  togelNotifCutoff: true,
  togelNotifBeforeDraw: true,
  togelNotifResult: true,
  togelMode: 'auto',
  togelManualResult: {}
}
function loadConfig(){
  if(db.config){
    for(let k in db.config){
      if(CONFIG[k] !== undefined) CONFIG[k] = db.config[k]
    }
  }
}
function saveConfig(){ db.config = {...CONFIG}; saveDB() }

const MISI_HARIAN = {
  main3:   { desc:'Main 3x',        target:3, reward:200, key:'main' },
  menang2: { desc:'Menang 2x',      target:2, reward:300, key:'menang' },
  bandar1: { desc:'Main bandar 1x', target:1, reward:150, key:'bandar' },
  gacha1:  { desc:'Gacha 1x',       target:1, reward:100, key:'gacha' },
}
const STREAK_REWARD = [100,100,200,200,300,300,1000]

function rollRarity(){
  let r = Math.random() * 100, acc = 0
  for(let t of RARITY_ROLL){ acc += t.chance; if(r < acc) return t.rarity }
  return 'Common'
}
function rollSkin(rarity){
  let pool = Object.entries(SKINS).filter(([k,v]) => v.rarity === rarity)
  return pool[Math.floor(Math.random() * pool.length)][0]
}
function rollBotCards(){
  let c = [randomCard(), randomCard(), randomCard()]
  c.sort((a,b)=>b-a)
  return [c[0], c[1]]
}
function rollPlayerCards(userId){
  let boost = getSkinBoost(userId)
  let c1 = [randomCard(), randomCard()]
  if(boost > 0 && Math.random() < boost){
    let c2 = [randomCard(), randomCard()]
    if(hitung(c2) > hitung(c1)) c1 = c2
  }
  return c1
}
function getSkinBoost(id){
  let active = activeSkinDB[id]
  if(!active || !SKINS[active]) return 0
  let r = SKINS[active].rarity
  if(r === 'Legendary') return CONFIG.boostLegendary
  if(r === 'Epic') return CONFIG.boostEpic
  if(r === 'Rare') return CONFIG.boostRare
  return 0
}

const FILE_DB = './saldo.json'
let db = { saldo:{}, utang:{}, riwayat:{}, groups:{}, vip:{}, daily:{}, stats:{}, weekly:{}, skins:{}, activeSkin:{}, misi:{}, streak:{}, lastLogin:{}, banned:{}, config:{}, bank:{}, bankTime:{}, inventory:{}, shield:{}, malingDaily:{}, bomReady:{}, topengReady:{}, owners:{}, togel:{}, togelHasil:{} }
if(fs.existsSync(FILE_DB)){ try{ db=JSON.parse(fs.readFileSync(FILE_DB)) }catch(e){} }
function saveDB(){ fs.writeFileSync(FILE_DB, JSON.stringify(db, null, 2)) }

let saldo=db.saldo, utang=db.utang, riwayat=db.riwayat, groupDB=db.groups, vipDB=db.vip, dailyDB=db.daily, statsDB=db.stats, weeklyDB=db.weekly
if(!weeklyDB) weeklyDB=db.weekly={}
if(!weeklyDB.weekId) weeklyDB.weekId=getWeekId()
if(!weeklyDB.players) weeklyDB.players={}
if(!statsDB) statsDB=db.stats={}
if(!groupDB) groupDB=db.groups={}
if(!vipDB) vipDB=db.vip={}
if(!dailyDB) dailyDB=db.daily={}
if(!db.skins) db.skins={}
if(!db.activeSkin) db.activeSkin={}
if(!db.misi) db.misi={}
if(!db.streak) db.streak={}
if(!db.lastLogin) db.lastLogin={}
if(!db.banned) db.banned={}
if(!db.config) db.config={}
if(!db.bank) db.bank={}
if(!db.bankTime) db.bankTime={}
if(!db.inventory) db.inventory={}
if(!db.shield) db.shield={}
if(!db.malingDaily) db.malingDaily={}
if(!db.bomReady) db.bomReady={}
if(!db.topengReady) db.topengReady={}
if(!db.owners) db.owners={}
if(!db.togel) db.togel={}
if(!db.togelHasil) db.togelHasil={}

let skinsDB=db.skins
let activeSkinDB=db.activeSkin
let misiDB=db.misi
let streakDB=db.streak
let lastLoginDB=db.lastLogin
let bannedDB=db.banned
let bankDB=db.bank
let bankTimeDB=db.bankTime
let inventoryDB=db.inventory
let shieldDB=db.shield
let malingDailyDB=db.malingDaily
let bomReadyDB=db.bomReady
let topengReadyDB=db.topengReady
let ownersDB=db.owners
let togelDB=db.togel
let togelHasilDB=db.togelHasil
let tables={}, cooldown={}, globalSock=null
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms))
loadConfig()

// === BAGIAN 1 SELESAI — LANJUT KE BAGIAN 2 ===
// ============ HELPER FUNCTIONS ============
function isBanned(id){ return bannedDB[id] === true }
function getSaldo(id){ if(!saldo[id]){ saldo[id]=1000; saveDB() } return saldo[id] }
function addRiwayat(id,t){ if(!riwayat[id]) riwayat[id]=[]; riwayat[id].unshift(`• ${t}`); if(riwayat[id].length>5) riwayat[id].pop(); saveDB() }
function isVip(id){ if(!vipDB[id]) return false; if(Date.now() > vipDB[id].expiry){ delete vipDB[id]; saveDB(); return false } return true }
function getRank(s,id){
  if(utang[id]?.telat) return '💀 TUKANG NGUTANG KABUR 💀'
  let base=''
  if(s>=200000) base='👑 DEWA KASINO SEJAGAT 👑'
  else if(s>=150000) base='🔱 SULTAN LEGENDA 🔱'
  else if(s>=100000) base='💎 JURAGAN KAYA RAYA 💎'
  else if(s>=50000) base='🔥 SULTAN NAGA 🔥'
  else if(s>=25000) base='⚔️ JAWARA MEJA ⚔️'
  else if(s>=10000) base='🎯 PEMAIN PRO 🎯'
  else if(s>=5000) base='🌟 PEMULA HOKI 🌟'
  else base='💀 BANDAR BOKER - MISKIN 💀'
  if(isVip(id)) base+=' [VIP ✨]'
  return base
}
function getStats(id){ if(!statsDB[id]) statsDB[id]={main:0, menang:0, kalah:0, seri:0}; return statsDB[id] }
function updateStats(id, result){ let s=getStats(id); s.main++; if(result==='menang') s.menang++; else if(result==='kalah') s.kalah++; else if(result==='seri') s.seri++; addWeeklyWin(id, result); trackMisi(id,'main'); if(result==='menang') trackMisi(id,'menang'); saveDB() }
function getWinRate(id){ let s=getStats(id); if(s.main===0) return 0; return Math.round((s.menang / s.main)*100) }
function getWeekId(){ let now=new Date(); let day=now.getDay(); let diff=now.getDate() - day + (day==0? -6 : 1); let monday=new Date(now.setDate(diff)); return `${monday.getFullYear()}-${monday.getMonth()+1}-${monday.getDate()}` }
function checkWeeklyReset(){ let current=getWeekId(); if(weeklyDB.weekId!== current){ weeklyDB.lastWeek = { weekId: weeklyDB.weekId, players: {...weeklyDB.players} }; weeklyDB.weekId=current; weeklyDB.players={}; saveDB(); return true } return false }
function addWeeklyWin(id, result){ checkWeeklyReset(); if(!weeklyDB.players[id]) weeklyDB.players[id]={menang:0, main:0}; weeklyDB.players[id].main++; if(result==='menang') weeklyDB.players[id].menang++; saveDB() }
function randomCard(){ return Math.floor(Math.random()*6)+1 }
function hitung(c){ return c.reduce((a,b)=>a+b,0) }
function getSkinPrefix(id){ let active = activeSkinDB[id]; if(!active || !SKINS[active]) return '🎲'; return SKINS[active].prefix }
function getSkinName(id){ let active = activeSkinDB[id]; if(!active || !SKINS[active]) return 'Dadu Default'; return active.charAt(0).toUpperCase() + active.slice(1) }
function getTodayKey(){ let d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}` }
function getMisi(id){
  let today = getTodayKey()
  if(!misiDB[id] || misiDB[id].date !== today){ misiDB[id] = { date:today, main:0, menang:0, bandar:0, gacha:0, claimed:{} }; saveDB() }
  return misiDB[id]
}
function trackMisi(id, key){ let m = getMisi(id); if(m[key] !== undefined) m[key]++; saveDB() }
function cekUtang(id){
  if(!utang[id]) return null
  let u=utang[id]
  if(Date.now() > u.jatuhTempo &&!u.telat){ u.telat=true; saveDB(); return {type:'telat'} }
  if(getSaldo(id)>=100 && u.sisa>0){
    let pot=isVip(id)?Math.min(Math.floor(getSaldo(id)*0.2), u.sisa):Math.min(Math.floor(getSaldo(id)*0.5), u.sisa)
    if(pot>0){ saldo[id]-=pot; u.sisa-=pot; if(u.sisa<=0) delete utang[id]; saveDB(); return {type:'potong', pot, sisa: utang[id]?.sisa||0, lunas:!utang[id]} }
  }
  return null
}
function cekBungaBank(id){
  if(!bankDB[id] || bankDB[id] <= 0) return 0
  let last = bankTimeDB[id] || Date.now()
  let elapsed = Date.now() - last
  if(elapsed < 24*60*60*1000) return 0
  let hari = Math.floor(elapsed / (24*60*60*1000))
  let bunga = Math.floor(bankDB[id] * CONFIG.bankBunga * hari)
  if(bunga > 0){ bankDB[id] += bunga; bankTimeDB[id] = Date.now(); saveDB(); return bunga }
  return 0
}
function getInv(id){ if(!inventoryDB[id]) inventoryDB[id] = {}; return inventoryDB[id] }
function addItem(id, itemKey, jumlah=1){
  if(!ITEMS[itemKey]) return false
  let inv = getInv(id), current = inv[itemKey] || 0, max = ITEMS[itemKey].maxStack
  let total = Object.values(inv).reduce((a,b)=>a+b,0)
  if(total + jumlah > MAX_INVENTORY) return false
  if(current + jumlah > max) return false
  inv[itemKey] = current + jumlah; saveDB(); return true
}
function removeItem(id, itemKey, jumlah=1){
  let inv = getInv(id)
  if(!inv[itemKey] || inv[itemKey] < jumlah) return false
  inv[itemKey] -= jumlah; if(inv[itemKey] <= 0) delete inv[itemKey]; saveDB(); return true
}
function hasItem(id, itemKey, jumlah=1){ let inv = getInv(id); return (inv[itemKey] || 0) >= jumlah }
function getTotalItem(id){ let inv = getInv(id); return Object.values(inv).reduce((a,b)=>a+b,0) }
function getShield(id){
  if(!shieldDB[id]) return null
  if(Date.now() > shieldDB[id].expiry){ delete shieldDB[id]; saveDB(); return null }
  return shieldDB[id]
}
function addShield(id, jam){
  let now = Date.now(), current = getShield(id), base = current ? current.expiry : now
  shieldDB[id] = { expiry: base + jam*60*60*1000, type: jam>=24?'besi':'gembok' }
  saveDB()
}
function getMalingDaily(id){
  let today = getTodayKey()
  if(!malingDailyDB[id] || malingDailyDB[id].date !== today){ malingDailyDB[id] = { date: today, count: 0 }; saveDB() }
  return malingDailyDB[id]
}

// ============ TOGEL HELPERS ============
function getTogelPeriode(kode){
  let p = CONFIG.togelPasaran[kode]
  if(!p) return null
  let now = new Date()
  let tutup = new Date(now)
  tutup.setHours(p.tutupJam, p.tutupMenit, 0, 0)
  if(now >= tutup) now.setDate(now.getDate() + 1)
  let yyyy = now.getFullYear()
  let mm = String(now.getMonth()+1).padStart(2,'0')
  let dd = String(now.getDate()).padStart(2,'0')
  return `${kode}-${yyyy}${mm}${dd}`
}
function getTogelWaktuTutup(kode){
  let p = CONFIG.togelPasaran[kode]
  if(!p) return null
  let now = new Date(), tutup = new Date(now)
  tutup.setHours(p.tutupJam, p.tutupMenit, 0, 0)
  if(now >= tutup) tutup.setDate(tutup.getDate() + 1)
  return tutup
}
function getTogelWaktuHasil(kode){
  let p = CONFIG.togelPasaran[kode]
  if(!p) return null
  let now = new Date(), hasil = new Date(now)
  hasil.setHours(p.hasilJam, p.hasilMenit, 0, 0)
  if(now >= hasil) hasil.setDate(hasil.getDate() + 1)
  return hasil
}
function generateTogelResult(kode){
  if(CONFIG.togelMode === 'manual' && CONFIG.togelManualResult && CONFIG.togelManualResult[kode]){
    let manual = CONFIG.togelManualResult[kode]
    if(/^\d{4}$/.test(manual)) return manual
  }
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}
function cekMenangTogel(tebakan, hasil){
  if(tebakan.length === 4) return tebakan === hasil
  if(tebakan.length === 3) return tebakan === hasil.slice(-3)
  if(tebakan.length === 2) return tebakan === hasil.slice(-2)
  return false
}
function getHadiahTogel(tebakan, taruhan){
  if(tebakan.length === 4) return taruhan * CONFIG.togelHadiah4D
  if(tebakan.length === 3) return taruhan * CONFIG.togelHadiah3D
  if(tebakan.length === 2) return taruhan * CONFIG.togelHadiah2D
  return 0
}
function getDiskonTogel(tebakan, taruhan){
  if(tebakan.length === 4) return Math.floor(taruhan * CONFIG.togelDiskon4D)
  if(tebakan.length === 3) return Math.floor(taruhan * CONFIG.togelDiskon3D)
  if(tebakan.length === 2) return Math.floor(taruhan * CONFIG.togelDiskon2D)
  return 0
}
function getKategoriTogel(angka){
  if(angka.length === 4) return '4D'
  if(angka.length === 3) return '3D'
  if(angka.length === 2) return '2D'
  return null
}
function formatSisaWaktuTogel(target){
  let diff = Math.floor((target - Date.now()) / 1000)
  if(diff < 0) return 'sekarang'
  let hari = Math.floor(diff / 86400)
  let jam = Math.floor((diff % 86400) / 3600)
  let menit = Math.floor((diff % 3600) / 60)
  if(hari > 0) return `${hari}h ${jam}j ${menit}m`
  if(jam > 0) return `${jam}j ${menit}m`
  return `${menit}m`
}
function getTogelTotalPasaran(kode, periode){
  let bets = togelDB[periode] || {}
  let total = 0
  for(let uid in bets){ if(bets[uid].pasaran === kode) total += bets[uid].totalTaruhan || 0 }
  return total
}
// ======================================

// === BAGIAN 2 SELESAI — LANJUT KE BAGIAN 3 ===
// ============ SCHEDULER ============

// Auto nagih utang tiap 1 jam
setInterval(async ()=>{
  if(!globalSock) return
  for(let userId in utang){
    let u=utang[userId]
    if(!u.telat && Date.now() > u.jatuhTempo){
      u.telat=true; saveDB()
      if(u.lastGroup){
        try{
          await globalSock.sendMessage(u.lastGroup,{
            text:`╔════════════════════════╗\n║ 💀 *SATPAM NAGIH* 💀 ║\n║ @${userId.split('@')[0]} KABUR 2 HARI!\n║ Sisa utang: ${u.sisa}\n║ Rank: ${getRank(getSaldo(userId),userId)}\n╚════════════════════════╝`,
            mentions:[userId]
          })
        }catch(e){}
      }
    }
  }
}, 60*60*1000)

// Auto draw & notif togel
setInterval(async ()=>{
  if(!globalSock) return
  let now = new Date()
  let grupList = Object.keys(groupDB)
  if(grupList.length === 0) return
  
  for(let kode in CONFIG.togelPasaran){
    let p = CONFIG.togelPasaran[kode]
    let periode = getTogelPeriode(kode)
    let tutup = getTogelWaktuTutup(kode)
    let hasil = getTogelWaktuHasil(kode)
    
    // === Notif reminder H-60, H-10, H-1 ===
    let sisaTutup = Math.floor((tutup - now) / 60000)
    let reminderMap = { 60:'togelNotifReminder60', 10:'togelNotifReminder10', 1:'togelNotifReminder1' }
    if(reminderMap[sisaTutup] && CONFIG[reminderMap[sisaTutup]]){
      let key = `togel_notif_rem${sisaTutup}_${kode}_${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}`
      if(!global[key]){
        global[key] = true
        let label = sisaTutup === 60 ? '1 JAM' : sisaTutup === 10 ? '10 MENIT' : '1 MENIT'
        let bets = togelDB[periode] ? Object.keys(togelDB[periode]).filter(u=>togelDB[periode][u].pasaran===kode).length : 0
        let total = getTogelTotalPasaran(kode, periode)
        let txt = `⏰ *REMINDER TOGEL*\n${p.emoji} *${p.nama}* [${kode}]\n━━━━━━━━━━━━━━━━━━━\n⏳ Tutup dalam *${label}* lagi!\n📅 Periode: ${periode}\n🕐 Tutup: ${String(p.tutupJam).padStart(2,'0')}:${String(p.tutupMenit).padStart(2,'0')}\n🎯 Hasil: ${String(p.hasilJam).padStart(2,'0')}:${String(p.hasilMenit).padStart(2,'0')}\n━━━━━━━━━━━━━━━━━━━\n👥 Bet saat ini: ${bets} user\n💰 Total uang: ${total.toLocaleString('id-ID')} Perak\n━━━━━━━━━━━━━━━━━━━\n📝 /togel-${kode.toLowerCase()} [angka] [taruhan]`
        for(let g of grupList){ try{ await globalSock.sendMessage(g, { text: txt }) }catch(e){}; await sleep(1500) }
      }
    }
    
    // === Notif cutoff ===
    if(sisaTutup === 0 && CONFIG.togelNotifCutoff){
      let key = `togel_notif_cutoff_${kode}_${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}`
      if(!global[key]){
        global[key] = true
        let bets = togelDB[periode] ? Object.keys(togelDB[periode]).filter(u=>togelDB[periode][u].pasaran===kode).length : 0
        let total = getTogelTotalPasaran(kode, periode)
        let txt = `🔒 *BET DITUTUP*\n${p.emoji} *${p.nama}* [${kode}]\n━━━━━━━━━━━━━━━━━━━\n📅 Periode: ${periode}\n👥 Total bet: ${bets} user\n💰 Total uang: ${total.toLocaleString('id-ID')} Perak\n━━━━━━━━━━━━━━━━━━━\n⏰ Hasil keluar: *${String(p.hasilJam).padStart(2,'0')}:${String(p.hasilMenit).padStart(2,'0')}*\nTunggu ya, gak bisa pasang lagi! 🎲`
        for(let g of grupList){ try{ await globalSock.sendMessage(g, { text: txt }) }catch(e){}; await sleep(1500) }
      }
    }
    
    // === Notif before draw (H-1 menit) ===
    let sisaHasil = Math.floor((hasil - now) / 60000)
    if(sisaHasil === 1 && CONFIG.togelNotifBeforeDraw){
      let key = `togel_notif_predraw_${kode}_${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}`
      if(!global[key]){
        global[key] = true
        let txt = `🎰 *BENTAR LAGI HASIL KELUAR!*\n${p.emoji} *${p.nama}* [${kode}]\n━━━━━━━━━━━━━━━━━━━\n⏳ Hasil keluar dalam *1 MENIT*!\n📅 Periode: ${periode}\nBersiap... 🎲🎲🎲`
        for(let g of grupList){ try{ await globalSock.sendMessage(g, { text: txt }) }catch(e){}; await sleep(1500) }
      }
    }
    
    // === Auto draw ===
    if(now.getHours() === p.hasilJam && now.getMinutes() === p.hasilMenit){
      let cek = new Date(now)
      let tutupHariIni = new Date(now)
      tutupHariIni.setHours(p.tutupJam, p.tutupMenit, 0, 0)
      if(now < tutupHariIni) cek.setDate(cek.getDate() - 1)
      let yyyy = cek.getFullYear()
      let mm = String(cek.getMonth()+1).padStart(2,'0')
      let dd = String(cek.getDate()).padStart(2,'0')
      let periodeDraw = `${kode}-${yyyy}${mm}${dd}`
      
      if(!togelHasilDB[periodeDraw]){
        let allBets = togelDB[periodeDraw] || {}
        let pasaranBets = {}
        let totalUser = 0, totalTaruhan = 0
        
        for(let uid in allBets){
          if(allBets[uid].pasaran === kode){
            pasaranBets[uid] = allBets[uid]
            totalUser++
            totalTaruhan += allBets[uid].totalTaruhan || 0
          }
        }
        
        let hasilAngka = generateTogelResult(kode)
        let winners = []
        
        for(let userId in pasaranBets){
          let userData = pasaranBets[userId]
          let totalMenang = 0, detailMenang = []
          for(let bet of userData.bets){
            if(cekMenangTogel(bet.angka, hasilAngka)){
              let hadiah = getHadiahTogel(bet.angka, bet.taruhan)
              totalMenang += hadiah
              detailMenang.push({ angka: bet.angka, taruhan: bet.taruhan, hadiah, kategori: bet.kategori })
            }
          }
          if(totalMenang > 0){
            saldo[userId] = getSaldo(userId) + totalMenang
            addRiwayat(userId, `TOGEL ${kode} MENANG ${hasilAngka} +${totalMenang}`)
            winners.push({ userId, total: totalMenang, detail: detailMenang })
          }
        }
        
        togelHasilDB[periodeDraw] = { periode: periodeDraw, kode, nama: p.nama, emoji: p.emoji, hasil: hasilAngka, totalUser, totalTaruhan, totalPemenang: winners.length, waktu: Date.now() }
        
        for(let uid in pasaranBets){ delete togelDB[periodeDraw][uid] }
        if(Object.keys(togelDB[periodeDraw]).length === 0) delete togelDB[periodeDraw]
        
        // Kalau mode manual, hapus manual result setelah dipake
        if(CONFIG.togelMode === 'manual' && CONFIG.togelManualResult && CONFIG.togelManualResult[kode]){
          delete CONFIG.togelManualResult[kode]
          saveConfig()
          console.log(`✅ Manual result ${kode} udah kepake & dihapus`)
        }
        
        saveDB()
        
        if(CONFIG.togelNotifResult){
          let txt = `╔═══════════════════════════════════╗\n`
          txt += `║ ${p.emoji} *${p.nama} POOLS* ${p.emoji}\n`
          txt += `║   🎰 *HASIL KELUAR* 🎰\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ 📅 Periode: ${periodeDraw}\n`
          txt += `║ 🕐 Waktu: ${now.toLocaleString('id-ID')}\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║\n`
          txt += `║       ╔══════════╗\n`
          txt += `║       ║  *${hasilAngka}*  ║\n`
          txt += `║       ╚══════════╝\n`
          txt += `║\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ 📊 Total: ${totalUser} user | ${totalTaruhan.toLocaleString('id-ID')} Perak\n`
          txt += `║ 🏆 Pemenang: ${winners.length} user\n`
          if(winners.length > 0){
            txt += `╠═══════════════════════════════════╣\n║ 💰 *DAFTAR PEMENANG:*\n`
            winners.slice(0, 10).forEach((w,i)=>{
              txt += `║ ${i+1}. @${w.userId.split('@')[0]}\n`
              w.detail.forEach(d=>{ txt += `║    ${d.angka} (${d.kategori}) × ${d.taruhan.toLocaleString('id-ID')} → +${d.hadiah.toLocaleString('id-ID')}\n` })
            })
            if(winners.length > 10) txt += `║ ... +${winners.length - 10} pemenang lain\n`
          } else {
            txt += `║ 😢 Gak ada pemenang\n`
          }
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ 🎲 Pasaran berikutnya: ${getTogelPeriode(kode)}\n`
          txt += `║ 📝 /togel-${kode.toLowerCase()} [angka] [taruhan]\n`
          txt += `╚═══════════════════════════════════╝`
          for(let g of grupList){ try{ await globalSock.sendMessage(g, { text: txt, mentions: winners.map(w=>w.userId) }); await sleep(2000) }catch(e){} }
        }
        
        // Cleanup history (simpen 100 terakhir)
        let histKeys = Object.keys(togelHasilDB).sort().reverse()
        if(histKeys.length > 100){ histKeys.slice(100).forEach(k=>delete togelHasilDB[k]); saveDB() }
      }
    }
  }
}, 60*1000)

// === BAGIAN 3 SELESAI — LANJUT KE BAGIAN 4 ===
// ============ READLINE + START BOT ============
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (t) => new Promise(r=>rl.question(t,r))

// Anti-duplicate start
let botRunning = false
let reconnectAttempt = 0
const MAX_RECONNECT = 5

async function startBot(){
  if(botRunning){ console.log('⚠️ Bot udah jalan, skip duplicate start'); return }
  botRunning = true

  try{
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const { version } = await fetchLatestBaileysVersion()
    const sock = makeWASocket({
      version,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({ level: 'silent' })
    })
    globalSock = sock

    if(!sock.authState.creds.registered){
      console.log('\n=== PAIRING DIBUTUHKAN ===')
      let no = await question('Masukin nomor bot 62xxxx: ')
      no = no.replace(/[^0-9]/g,'')
      try{
        let code = await sock.requestPairingCode(no)
        console.log('\nKODE PAIRING LU: '+code+'\nBuka WA > Perangkat Tertaut > Tautkan dengan nomor telepon')
      }catch(e){ console.log('Gagal, coba node index.js lagi') }
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (u)=>{
      if(u.connection === 'open'){
        console.log('✅ V7.2 READY '+OWNER_NUMBER)
        reconnectAttempt = 0
        try{ rl.close() }catch(e){}
      }
      if(u.connection === 'close'){
        let code = u.lastDisconnect?.error?.output?.statusCode
        console.log('⚠️ Connection closed, code:', code)
        botRunning = false
        if(code === 401){
          console.log('🚫 Logged out (401). Hapus folder auth & pairing ulang.')
          return
        }
        if(code === 440){
          console.log('🚫 Conflict (440) - ada instance lain yang pake nomor ini.')
          return
        }
        if(reconnectAttempt < MAX_RECONNECT){
          reconnectAttempt++
          let delay = Math.min(5000 * reconnectAttempt, 30000)
          console.log(`🔄 Reconnect attempt ${reconnectAttempt}/${MAX_RECONNECT} dalam ${delay/1000}s...`)
          setTimeout(()=>{ startBot() }, delay)
        }else{
          console.log('❌ Max reconnect tercapai. Cek koneksi / restart manual.')
        }
      }
    })

    sock.ev.on('messages.upsert', async ({messages, type})=>{
      if(type !== 'notify') return
      const msg = messages[0]
      if(!msg.message) return
      const from = msg.key.remoteJid
      let sender = msg.key.participant || from
      if(msg.key.fromMe) sender = OWNER_LID
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
      const args = text.trim().split(' ')
      const cmd = args[0].toLowerCase()
      const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []

      if(from.endsWith('@g.us')){
        if(!groupDB[from]){ groupDB[from]=true; saveDB() }
        if(utang[sender]){ utang[sender].lastGroup=from; saveDB() }
      }

      // Cek banned
      if(isBanned(sender) && !isOwner(sender)){
        if(cmd.startsWith('/')){
          return sock.sendMessage(from,{text:`🚫 @${sender.split('@')[0]} kamu di-ban dari bot ini.\nHubungi owner kalau mau unban.`, mentions:[sender]})
        }
        return
      }

      // Cek utang
      let notifUtang = cekUtang(sender)
      if(notifUtang){
        if(notifUtang.type==='telat'){
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 💀 *UTANG TELAT* 💀 ║\n║ @${sender.split('@')[0]} TELAT 2 HARI!\n║ Rank: ${getRank(getSaldo(sender),sender)}\n║ /bayar-utang ${utang[sender].sisa}\n╚════════════════════════╝`, mentions:[sender]})
        } else if(notifUtang.type==='potong'){
          if(notifUtang.lunas){
            await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *LUNAS!* ✅ ║\n║ @${sender.split('@')[0]} LUNAS!\n║ Kepotong: ${notifUtang.pot}\n╚════════════════════════╝`, mentions:[sender]})
          } else {
            await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🏦 *AUTO BAYAR* 🏦 ║\n║ @${sender.split('@')[0]} -${notifUtang.pot}\n║ Sisa utang: ${notifUtang.sisa}\n╚════════════════════════╝`, mentions:[sender]})
          }
        }
      }

      // === BAGIAN 4 SELESAI — LANJUT KE BAGIAN 5 ===
            // ============ BASIC COMMANDS ============
      
      if(cmd === '/cekid'){
        await sock.sendMessage(from,{text:`🔍 *CEK ID*\n\nSender: ${sender}\nFrom: ${from}\n\nCopy yang @lid`, mentions:[sender]})
      }
      
      if(cmd === '/saldo'){
        let s = getSaldo(sender)
        let vInfo = isVip(sender) ? `\n║ ✨ VIP: ${new Date(vipDB[sender].expiry).toLocaleDateString('id-ID')}` : ''
        let uInfo = utang[sender] ? `\n║ 🏦 Utang: ${utang[sender].sisa}${utang[sender].telat?' TELAT!':''}` : ''
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 💰 *DOMPET CASINO 12* 💰\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 💵 Saldo: *${s.toLocaleString()}* Perak\n║ 🏦 Bank: *${(bankDB[sender]||0).toLocaleString()}* Perak${vInfo}${uInfo}\n║ 🏆 ${getRank(s,sender)}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/utang'){
        if(!utang[sender]) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *UTANG* ✅ ║\n║ @${sender.split('@')[0]} Bersih!\n╚════════════════════════╝`, mentions:[sender]})
        let u = utang[sender]
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🏦 *STATUS UTANG* 🏦 ║\n║ 👤 @${sender.split('@')[0]}\n║ 💸 Sisa: ${u.sisa}\n║ ⏰ Tempo: ${new Date(u.jatuhTempo).toLocaleDateString('id-ID')}\n║ ${u.telat?'💀 TELAT':'✅ Belum telat'}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/daily'){
        if(utang[sender]?.telat) return sock.sendMessage(from,{text:`❌ Telat bayar dulu @${sender.split('@')[0]}`, mentions:[sender]})
        let last = dailyDB[sender]||0
        let now = Date.now()
        if(now-last < 24*60*60*1000){
          let sisa = Math.ceil((24*60*60*1000-(now-last))/3600000)
          return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ⏰ *DAILY COOLDOWN* ⏰ ║\n║ @${sender.split('@')[0]} Udah ambil!\n║ Tunggu ${sisa} jam lagi\n╚════════════════════════╝`, mentions:[sender]})
        }
        let bonus = isVip(sender) ? CONFIG.dailyVip : CONFIG.dailyNormal
        saldo[sender] = getSaldo(sender) + bonus
        dailyDB[sender] = now
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🎁 *DAILY* 🎁 ║\n║ +${bonus} ${isVip(sender)?'VIP ✨':''}\n║ Saldo: ${saldo[sender]}\n║ ${getRank(saldo[sender],sender)}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/top'){
        let sorted = Object.entries(saldo).sort((a,b)=>b[1]-a[1])
        if(sorted.length === 0) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🏆 *TOP* 🏆 ║\n║ Belum ada pemain\n╚════════════════════════╝`})
        let top10 = sorted.slice(0,10)
        let txt = `╔════════════════════════╗\n║ 🏆 *HALL OF SULTAN TOP 10* 🏆\n╠════════════════════════╣\n`
        top10.forEach((v,i)=>{
          let medal = i==0?'🥇 JUARA 1':i==1?'🥈 JUARA 2':i==2?'🥉 JUARA 3':` ${i+1}. RANK ${i+1}`
          txt += `║ ${medal}\n║ 👤 @${v[0].split('@')[0]}\n║ 💰 ${v[1].toLocaleString()} ${isVip(v[0])?'✨VIP':''}\n║ ${getRank(v[1],v[0])}\n║ ────────────────────\n`
        })
        txt += `║ Total: ${sorted.length} pemain\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:sorted.map(v=>v[0])})
      }
      
      if(cmd === '/topminggu' || cmd === '/topmingguan'){
        checkWeeklyReset()
        let players = weeklyDB.players
        let sorted = Object.entries(players).sort((a,b)=>b[1].menang - a[1].menang)
        if(sorted.length === 0){
          return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🏆 *TOP MINGGU* 🏆 ║\n║ Belum ada game minggu ini\n╚════════════════════════╝`})
        }
        let top10 = sorted.slice(0,10)
        let txt = `╔════════════════════════╗\n║ 🏆 *TOP MINGGU* 🏆 ║\n║ 📅 Minggu: ${weeklyDB.weekId}\n╠════════════════════════╣\n`
        top10.forEach((v,i)=>{
          let medal = i==0?'🥇 JUARA 1':i==1?'🥈 JUARA 2':i==2?'🥉 JUARA 3':` ${i+1}. RANK ${i+1}`
          txt += `║ ${medal}\n║ 👤 @${v[0].split('@')[0]}\n║ Menang: ${v[1].menang}x | Main: ${v[1].main}x\n║ ────────────────────\n`
        })
        txt += `║ Total: ${sorted.length} pemain\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:sorted.map(v=>v[0])})
      }
      
      if(cmd === '/reset-minggu' || cmd === '/resetminggu'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`})
        weeklyDB.players = {}
        weeklyDB.weekId = getWeekId()
        saveDB()
        await sock.sendMessage(from,{text:`♻️ Top minggu di-reset!`})
      }
      
      if(cmd === '/riwayat'){
        let r = riwayat[sender]||[]
        if(r.length === 0) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 📜 *RIWAYAT* 📜 ║\n║ Belum main\n╚════════════════════════╝`, mentions:[sender]})
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 📜 *RIWAYAT* 📜 ║\n║ @${sender.split('@')[0]}\n║ ${r.join('\n║ ')}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/stats'){
        let s = getStats(sender)
        let wr = getWinRate(sender)
        let boost = getSkinBoost(sender)
        let boostTxt = boost > 0 ? `\n║ 🎨 Skin boost: +${(boost*100).toFixed(0)}%` : '✏️ Kosong'
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 📊 *STATS LU* 📊 ║\n║ 👤 @${sender.split('@')[0]}\n║ 🎮 Total: ${s.main} game\n║ 🏆 Menang: ${s.menang}\n║ 😭 Kalah: ${s.kalah}\n║ 🤝 Seri: ${s.seri}\n║ 📈 WinRate: ${wr}%${boostTxt}\n║ 🏆 ${getRank(getSaldo(sender),sender)}\n╚════════════════════════╝`, mentions:[sender]})
      }

      // ============ MENU ============
      
      if(cmd === '/menu' || cmd === '/help'){
        await sock.sendMessage(from,{text:`╔═════ 🎰 *MENU CASINO 12* 🎰 ═════╗\n💰 *DUIT:*\n├ /saldo - cek saldo & rank\n├ /utang - cek utang\n├ /daily - ambil ${isVip(sender)?CONFIG.dailyVip:CONFIG.dailyNormal} (24 jam)\n├ /misi - misi harian\n├ /streak - streak login\n├ /top - top 10 sultan terkaya\n├ /topminggu - top 10 jagoan minggu ini\n├ /riwayat - 5 game terakhir\n├ /stats - liat stats winrate\n├ /transfer @org 1000 - bagi duit (min 100)\n├ /pinjam - pinjem 1000 (bayar 1200)\n└ /bayar-utang [jml] - bayar utang\n🏦 *BANK & SOSIAL:*\n├ /bank - menu bank\n├ /setor [jml|all] - setor bank\n├ /tarik [jml|all] - tarik bank\n├ /profil [@org] - liat profil\n├ /rank-grup - top grup ini\n└ /shield - cek shield\n🦹 *MALING & TOKO:*\n├ /toko - toko item\n├ /beli [item] [jml] - beli item\n├ /inv - inventory lu\n├ /pakai [item] - pakai item\n├ /maling @org - curi duit (butuh 🔑)\n└ Max ${CONFIG.malingMaxPerDay}x/hari\n🎨 *SKIN:*\n├ /gacha - tarik skin (${CONFIG.gachaCost})\n├ /gacha 10x - 10 skin (diskon ${CONFIG.gacha10Diskon*100}%)\n├ /skinku - liat koleksi\n├ /pilih-skin <nama> - pasang skin\n├ /jual-skin <nama> - jual skin\n├ /upgrade-skin - 3 Common → 1 Rare\n├ /dust - info dust\n└ /listskin - daftar semua skin\n🎰 *TOGEL:*\n├ /togel - menu togel\n├ /togel-kmb|sdy|sg|jpn|hk [angka] [taruhan]\n├ /togelku - bet lu\n├ /hasil-togel - hasil terakhir\n└ /jadwal-togel - jadwal lengkap\n💎 *TOPUP & VIP:*\n├ /topup - cara topup, chat owner\n├ /vip - cek VIP lu\n└ /bukti - lapor bukti bayar\n🎲 *MAIN:*\n├ /buka-meja [taruhan] - meja biasa 2-6 orang\n├ /buka-bandar [taruhan] - lawan BOT (min ${CONFIG.minBetBandar})\n├ /allin - pasang semua saldo\n├ /join - ikut meja\n├ /batal-meja - batalin & duit balik\n└ /gas - kocok dadu (auto batal 3 menit)\n🛠️ *BANTUAN:*\n├ /rules - cara main\n├ /panduan - panduan command\n└ /bug [pesan] - lapor bug\n💡 Owner? Ketik /ownerkey\n╚═══════════════════════════════════╝`})
      }

      // === BAGIAN 5 SELESAI — LANJUT KE BAGIAN 6 ===
            // ============ TOGEL (PLAYER) ============
      
      if(cmd === '/togel' || cmd === '/togel-menu'){
        let txt = `╔═══════════════════════════════════╗\n`
        txt += `║   🎰 *TOGEL CASINO 12* 🎰\n║   (5 Pasaran Virtual)\n`
        txt += `╠═══════════════════════════════════╣\n`
        for(let kode in CONFIG.togelPasaran){
          let p = CONFIG.togelPasaran[kode]
          let periode = getTogelPeriode(kode)
          let bets = togelDB[periode] ? Object.keys(togelDB[periode]).filter(u=>togelDB[periode][u].pasaran===kode).length : 0
          let total = getTogelTotalPasaran(kode, periode)
          txt += `║ ${p.emoji} *${p.nama}* [${kode}]\n`
          txt += `║ ⏰ ${String(p.tutupJam).padStart(2,'0')}:${String(p.tutupMenit).padStart(2,'0')} → ${String(p.hasilJam).padStart(2,'0')}:${String(p.hasilMenit).padStart(2,'0')}\n`
          txt += `║ 👥 ${bets} user | 💰 ${total.toLocaleString('id-ID')}\n`
          txt += `║ 📝 /togel-${kode.toLowerCase()} [angka] [taruhan]\n`
          txt += `║ ────────────────────\n`
        }
        txt += `║ 💰 Hadiah: 2D ${CONFIG.togelHadiah2D}x | 3D ${CONFIG.togelHadiah3D}x | 4D ${CONFIG.togelHadiah4D}x\n`
        txt += `║ 💵 Min: ${CONFIG.togelMinBet.toLocaleString('id-ID')} | Max/angka: ${CONFIG.togelMaxPerAngka.toLocaleString('id-ID')}\n`
        txt += `╠═══════════════════════════════════╣\n`
        txt += `║ 📋 /togelku - bet lu\n║ 📋 /hasil-togel - hasil terakhir\n║ 📋 /jadwal-togel - jadwal lengkap\n`
        txt += `╚═══════════════════════════════════╝`
        return sock.sendMessage(from, { text: txt })
      }
      
      if(cmd === '/jadwal-togel' || cmd === '/jadwal'){
        let now = new Date()
        let txt = `╔═══════════════════════════════════╗\n║   📅 *JADWAL TOGEL HARI INI* 📅\n╠═══════════════════════════════════╣\n`
        let sorted = Object.entries(CONFIG.togelPasaran).sort((a,b)=> (a[1].tutupJam*60+a[1].tutupMenit) - (b[1].tutupJam*60+b[1].tutupMenit))
        sorted.forEach(([kode, p])=>{
          let tutup = getTogelWaktuTutup(kode)
          let hasil = getTogelWaktuHasil(kode)
          let tutupStr = `${String(p.tutupJam).padStart(2,'0')}:${String(p.tutupMenit).padStart(2,'0')}`
          let hasilStr = `${String(p.hasilJam).padStart(2,'0')}:${String(p.hasilMenit).padStart(2,'0')}`
          let status
          let sisaTutupMs = tutup - now, sisaHasilMs = hasil - now
          if(sisaTutupMs > 0) status = `🟢 BUKA (tutup ${formatSisaWaktuTogel(tutup)})`
          else if(sisaHasilMs > 0) status = `🟡 PENDING (hasil ${formatSisaWaktuTogel(hasil)})`
          else status = `🔴 SELESAI`
          txt += `║ ${p.emoji} *${p.nama}*\n║ 📅 Tutup: ${tutupStr} | Hasil: ${hasilStr}\n║ ${status}\n║ ────────────────────\n`
        })
        txt += `╚═══════════════════════════════════╝`
        return sock.sendMessage(from, { text: txt })
      }
      
      // Pasang togel
      let togelCmds = {
        '/togel-kmb':'KMB','/togel-kamboja':'KMB',
        '/togel-sdy':'SDY','/togel-sydney':'SDY',
        '/togel-sg':'SG','/togel-singapore':'SG',
        '/togel-jpn':'JPN','/togel-jepang':'JPN',
        '/togel-hk':'HK','/togel-hongkong':'HK'
      }
      if(togelCmds[cmd]){
        let kode = togelCmds[cmd]
        let p = CONFIG.togelPasaran[kode]
        let angka = args[1]
        let taruhan = parseInt(args[2])
        
        if(!angka || !taruhan){
          let periode = getTogelPeriode(kode)
          let tutup = getTogelWaktuTutup(kode)
          let txt = `╔═══════════════════════════════════╗\n║ ${p.emoji} *${p.nama} POOLS* ${p.emoji}\n╠═══════════════════════════════════╣\n║ 📋 /${cmd.substring(1)} [angka] [taruhan]\n║\n║ 💡 Contoh:\n║ /${cmd.substring(1)} 47 1000 (2D)\n║ /${cmd.substring(1)} 347 1000 (3D)\n║ /${cmd.substring(1)} 2347 1000 (4D)\n╠═══════════════════════════════════╣\n║ 📅 Periode: ${periode}\n║ ⏰ Tutup: ${formatSisaWaktuTogel(tutup)} lagi\n║ 🎯 Hasil: ${String(p.hasilJam).padStart(2,'0')}:${String(p.hasilMenit).padStart(2,'0')}\n║ 💵 Min: ${CONFIG.togelMinBet.toLocaleString('id-ID')} | Max: ${CONFIG.togelMaxPerAngka.toLocaleString('id-ID')}\n╚═══════════════════════════════════╝`
          return sock.sendMessage(from, { text: txt, mentions:[sender] })
        }
        
        if(!/^\d{2,4}$/.test(angka)) return sock.sendMessage(from, { text: `❌ Angka 2-4 digit. Contoh: 47, 347, 2347` })
        if(isNaN(taruhan) || taruhan < CONFIG.togelMinBet) return sock.sendMessage(from, { text: `❌ Min bet ${CONFIG.togelMinBet.toLocaleString('id-ID')}` })
        if(CONFIG.togelMaxPerAngka && taruhan > CONFIG.togelMaxPerAngka) return sock.sendMessage(from, { text: `❌ Max per angka ${CONFIG.togelMaxPerAngka.toLocaleString('id-ID')}` })
        
        if(getSaldo(sender) < taruhan){
          return sock.sendMessage(from, { text: `❌ Saldo gak cukup\nButuh: ${taruhan.toLocaleString('id-ID')}\nSaldo: ${getSaldo(sender).toLocaleString('id-ID')}` })
        }
        
        let periode = getTogelPeriode(kode)
        if(!togelDB[periode]) togelDB[periode] = {}
        if(!togelDB[periode][sender]) togelDB[periode][sender] = { pasaran: kode, bets: [], totalBayar: 0, totalTaruhan: 0 }
        
        let diskon = getDiskonTogel(angka, taruhan)
        let bayar = taruhan - diskon
        let kategori = getKategoriTogel(angka)
        
        saldo[sender] -= bayar
        togelDB[periode][sender].bets.push({ angka, taruhan, diskon, bayar, kategori, time: Date.now() })
        togelDB[periode][sender].totalBayar += bayar
        togelDB[periode][sender].totalTaruhan += taruhan
        saveDB()
        
        let tutup = getTogelWaktuTutup(kode)
        let hadiah = getHadiahTogel(angka, taruhan)
        
        await sock.sendMessage(from, {
          text: `╔═══════════════════════════════════╗\n║ ${p.emoji} *BET DIPASANG* ${p.emoji}\n╠═══════════════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 🎯 Angka: *${angka}* (${kategori})\n║ 💵 Taruhan: ${taruhan.toLocaleString('id-ID')}\n║ 🎁 Diskon: -${diskon.toLocaleString('id-ID')}\n║ 💸 Bayar: *${bayar.toLocaleString('id-ID')}*\n║ 💰 Potensi: *${hadiah.toLocaleString('id-ID')}*\n╠═══════════════════════════════════╣\n║ 📅 ${periode}\n║ ⏰ Tutup: ${formatSisaWaktuTogel(tutup)} lagi\n║ 🎯 Hasil: ${String(p.hasilJam).padStart(2,'0')}:${String(p.hasilMenit).padStart(2,'0')}\n╠═══════════════════════════════════╣\n║ 💵 Saldo: ${saldo[sender].toLocaleString('id-ID')}\n║ 📊 Total bet lu: ${togelDB[periode][sender].totalTaruhan.toLocaleString('id-ID')}\n╚═══════════════════════════════════╝`,
          mentions: [sender]
        })
      }
      
      if(cmd === '/togelku' || cmd === '/betku' || cmd === '/bet-togel'){
        let txt = `╔═══════════════════════════════════╗\n║   🎰 *BET TOGEL LU* 🎰\n╠═══════════════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n`
        let adaBet = false
        for(let kode in CONFIG.togelPasaran){
          let p = CONFIG.togelPasaran[kode]
          let periode = getTogelPeriode(kode)
          let userData = togelDB[periode]?.[sender]
          if(!userData || userData.bets.length === 0) continue
          adaBet = true
          let tutup = getTogelWaktuTutup(kode)
          txt += `╠═══════════════════════════════════╣\n║ ${p.emoji} *${p.nama}* [${periode}]\n║ ⏰ Tutup: ${formatSisaWaktuTogel(tutup)} lagi\n`
          let potensi = 0
          userData.bets.forEach((b,i)=>{
            let hadiah = getHadiahTogel(b.angka, b.taruhan)
            potensi += hadiah
            txt += `║ ${i+1}. ${b.angka} (${b.kategori}) × ${b.taruhan.toLocaleString('id-ID')}\n║    → potensi +${hadiah.toLocaleString('id-ID')}\n`
          })
          txt += `║ ────────────────────\n║ 💵 Total taruhan: ${userData.totalTaruhan.toLocaleString('id-ID')}\n║ 💰 Total potensi: ${potensi.toLocaleString('id-ID')}\n`
        }
        if(!adaBet) txt += `║\n║ Belum ada bet\n║ Pasang: /togel\n`
        txt += `╚═══════════════════════════════════╝`
        return sock.sendMessage(from, { text: txt, mentions: [sender] })
      }
      
      if(cmd === '/hasil-togel' || cmd === '/togel-hasil'){
        let txt = `╔═══════════════════════════════════╗\n║   📜 *HASIL TOGEL TERAKHIR* 📜\n╠═══════════════════════════════════╣\n`
        for(let kode in CONFIG.togelPasaran){
          let p = CONFIG.togelPasaran[kode]
          let keys = Object.keys(togelHasilDB).filter(k=>k.startsWith(kode+'-')).sort().reverse()
          let last = keys[0]
          txt += `║ ${p.emoji} *${p.nama}*\n`
          if(last){
            let h = togelHasilDB[last]
            txt += `║ 📅 ${h.periode}\n║ 🎯 Hasil: *${h.hasil}*\n║ 🕐 ${new Date(h.waktu).toLocaleString('id-ID')}\n`
          } else txt += `║ Belum ada hasil\n`
          txt += `║ ────────────────────\n`
        }
        txt += `╚═══════════════════════════════════╝`
        return sock.sendMessage(from, { text: txt })
      }

      // === BAGIAN 6 SELESAI — LANJUT KE BAGIAN 7 ===
            // ============ TOGEL OWNER CONTROL ============
      
      if(cmd === '/togel-notif' || cmd === '/togelnotif'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let sub = args[1] ? args[1].toLowerCase() : null
        let target = args[2] ? args[2].toLowerCase() : null
        
        if(!sub){
          let txt = `╔═══════════════════════════════════╗\n`
          txt += `║   🔔 *TOGEL NOTIF CONTROL* 🔔\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ 📋 *Setting sekarang:*\n`
          txt += `║ ${CONFIG.togelNotifReminder60?'✅':'❌'} Reminder H-60 menit\n`
          txt += `║ ${CONFIG.togelNotifReminder10?'✅':'❌'} Reminder H-10 menit\n`
          txt += `║ ${CONFIG.togelNotifReminder1?'✅':'❌'} Reminder H-1 menit\n`
          txt += `║ ${CONFIG.togelNotifCutoff?'✅':'❌'} Notif Cutoff\n`
          txt += `║ ${CONFIG.togelNotifBeforeDraw?'✅':'❌'} Notif Before Draw\n`
          txt += `║ ${CONFIG.togelNotifResult?'✅':'❌'} Notif Hasil\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ 📝 Command:\n`
          txt += `║ • /togel-notif on\n`
          txt += `║ • /togel-notif off\n`
          txt += `║ • /togel-notif hasil on/off\n`
          txt += `║ • /togel-notif cutoff on/off\n`
          txt += `║ • /togel-notif reminder on/off\n`
          txt += `║ • /togel-notif predraw on/off\n`
          txt += `╚═══════════════════════════════════╝`
          return sock.sendMessage(from, { text: txt })
        }
        
        if(sub === 'on' || sub === 'off'){
          let val = sub === 'on'
          CONFIG.togelNotifReminder60 = val
          CONFIG.togelNotifReminder10 = val
          CONFIG.togelNotifReminder1 = val
          CONFIG.togelNotifCutoff = val
          CONFIG.togelNotifBeforeDraw = val
          CONFIG.togelNotifResult = val
          saveConfig()
          return sock.sendMessage(from, { text: `✅ Semua notif togel: *${val ? 'ON' : 'OFF'}*` })
        }
        
        if(!target || (target !== 'on' && target !== 'off')){
          return sock.sendMessage(from, { text: `⚠️ Format: /togel-notif [kategori] on/off\nKategori: hasil, cutoff, reminder, predraw` })
        }
        
        let val = target === 'on'
        
        if(sub === 'hasil'){
          CONFIG.togelNotifResult = val
          saveConfig()
          return sock.sendMessage(from,{text:`✅ Notif *HASIL*: ${val ? 'ON' : 'OFF'}`})
        }
        if(sub === 'cutoff'){
          CONFIG.togelNotifCutoff = val
          saveConfig()
          return sock.sendMessage(from,{text:`✅ Notif *CUTOFF*: ${val ? 'ON' : 'OFF'}`})
        }
        if(sub === 'reminder'){
          CONFIG.togelNotifReminder60 = val
          CONFIG.togelNotifReminder10 = val
          CONFIG.togelNotifReminder1 = val
          saveConfig()
          return sock.sendMessage(from,{text:`✅ Notif *REMINDER* (H-60, H-10, H-1): ${val ? 'ON' : 'OFF'}`})
        }
        if(sub === 'predraw'){
          CONFIG.togelNotifBeforeDraw = val
          saveConfig()
          return sock.sendMessage(from,{text:`✅ Notif *BEFORE DRAW*: ${val ? 'ON' : 'OFF'}`})
        }
        
        return sock.sendMessage(from, { text: `❌ Kategori "${sub}" gak ada.\nPilih: hasil, cutoff, reminder, predraw` })
      }
      
      if(cmd === '/togel-mode' || cmd === '/togelmode'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let sub = args[1] ? args[1].toLowerCase() : null
        
        if(!sub){
          let modeIcon = CONFIG.togelMode === 'auto' ? '🤖' : '👑'
          let txt = `╔═══════════════════════════════════╗\n`
          txt += `║   🎰 *TOGEL MODE* 🎰\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ Mode sekarang: ${modeIcon} *${CONFIG.togelMode.toUpperCase()}*\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ 📋 *Penjelasan:*\n`
          txt += `║ • *AUTO* = bot yang nentuin hasil random\n`
          txt += `║ • *MANUAL* = owner bisa set hasil manual\n`
          txt += `╠═══════════════════════════════════╣\n`
          txt += `║ 📝 *Command:*\n`
          txt += `║ • /togel-mode auto\n`
          txt += `║ • /togel-mode manual\n`
          txt += `║ • /togel-set-hasil [kode] [angka]\n`
          txt += `║ • /togel-set-hasil [kode] random\n`
          txt += `║ • /togel-set-hasil list\n`
          txt += `╠═══════════════════════════════════╣\n`
          if(CONFIG.togelMode === 'manual'){
            txt += `║ ⚠️ Mode MANUAL aktif!\n`
            txt += `║ Set hasil sebelum draw, atau biarin random\n`
          }
          txt += `╚═══════════════════════════════════╝`
          return sock.sendMessage(from, { text: txt })
        }
        
        if(sub === 'auto'){
          CONFIG.togelMode = 'auto'
          saveConfig()
          return sock.sendMessage(from, { text: `✅ Mode togel: *AUTO*\nBot yang nentuin hasil random.` })
        }
        if(sub === 'manual'){
          CONFIG.togelMode = 'manual'
          saveConfig()
          return sock.sendMessage(from, { text: `✅ Mode togel: *MANUAL*\nOwner bisa set hasil via /togel-set-hasil\nKalau gak diset, bot auto-random.` })
        }
        
        return sock.sendMessage(from, { text: `❌ Mode "${sub}" gak ada. Pilih: auto atau manual` })
      }
      
      if(cmd === '/togel-set-hasil' || cmd === '/togelsethasil'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let kode = args[1] ? args[1].toUpperCase() : null
        let angka = args[2]
        
        if(kode === 'LIST'){
          let txt = `╔═══════════════════════════════════╗\n`
          txt += `║   🎰 *HASIL MANUAL* 🎰\n`
          txt += `╠═══════════════════════════════════╣\n`
          let ada = false
          for(let k in CONFIG.togelPasaran){
            let p = CONFIG.togelPasaran[k]
            let manual = CONFIG.togelManualResult?.[k]
            if(manual){
              ada = true
              txt += `║ ${p.emoji} ${k}: *${manual}*\n`
            } else {
              txt += `║ ${p.emoji} ${k}: (auto)\n`
            }
          }
          txt += `╠═══════════════════════════════════╣\n`
          if(!ada) txt += `║ Belum ada yang di-set manual\n`
          txt += `║ Mode: ${CONFIG.togelMode.toUpperCase()}\n`
          txt += `╚═══════════════════════════════════╝`
          return sock.sendMessage(from, { text: txt })
        }
        
        if(!kode || !CONFIG.togelPasaran[kode]){
          return sock.sendMessage(from, { text: `⚠️ Format: /togel-set-hasil [KMB/SDY/SG/JPN/HK] [angka]\nContoh:\n/togel-set-hasil SG 4789\n/togel-set-hasil SG random\n/togel-set-hasil list` })
        }
        
        if(CONFIG.togelMode !== 'manual'){
          return sock.sendMessage(from, { text: `❌ Mode togel sekarang *${CONFIG.togelMode.toUpperCase()}*.\nGanti dulu: /togel-mode manual` })
        }
        
        let p = CONFIG.togelPasaran[kode]
        
        if(angka === 'random' || angka === 'hapus'){
          if(CONFIG.togelManualResult) delete CONFIG.togelManualResult[kode]
          saveConfig()
          return sock.sendMessage(from, { text: `✅ Hasil ${p.emoji} ${p.nama} balik ke *AUTO RANDOM*` })
        }
        
        if(!angka){
          return sock.sendMessage(from, { text: `⚠️ Kasih angkanya.\nContoh: /togel-set-hasil ${kode} 4789` })
        }
        
        if(!/^\d{4}$/.test(angka)){
          return sock.sendMessage(from, { text: `❌ Angka harus 4 digit (0000-9999)\nContoh: 4789` })
        }
        
        if(!CONFIG.togelManualResult) CONFIG.togelManualResult = {}
        CONFIG.togelManualResult[kode] = angka
        saveConfig()
        
        let periode = getTogelPeriode(kode)
        let hasilWaktu = getTogelWaktuHasil(kode)
        
        await sock.sendMessage(from, {
          text: `╔═══════════════════════════════════╗\n` +
                `║   ✅ *HASIL MANUAL DI-SET* ✅\n` +
                `╠═══════════════════════════════════╣\n` +
                `║ ${p.emoji} Pasaran: *${p.nama}*\n` +
                `║ 🎯 Hasil: *${angka}*\n` +
                `║ 📅 Periode: ${periode}\n` +
                `║ ⏰ Draw: ${hasilWaktu.toLocaleString('id-ID',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}\n` +
                `╠═══════════════════════════════════╣\n` +
                `║ ⚠️ Hasil ini bakal kepake pas draw\n` +
                `║ Setelah draw, otomatis balik ke AUTO\n` +
                `╚═══════════════════════════════════╝`
        })
      }

      // === BAGIAN 7 SELESAI — LANJUT KE BAGIAN 8 ===
            // ============ TOKO ============
      
      if(cmd === '/toko' || cmd === '/shop-item'){
        let txt = `╔════════════════════════╗\n`
        txt += `║   🏪 *TOKO CASINO 12* 🏪\n`
        txt += `╠════════════════════════╣\n`
        for(let [k,v] of Object.entries(ITEMS)){
          let hargaKey = 'harga' + k.charAt(0).toUpperCase() + k.slice(1).replace(/_([a-z])/g, (m,c)=>c.toUpperCase())
          let harga = CONFIG[hargaKey] || v.harga
          txt += `║ ${v.emoji} *${v.name}* - ${harga} Perak\n`
          txt += `║   ${v.desc}\n`
          txt += `║   Max: ${v.maxStack} | Key: ${k}\n`
          txt += `║ ────────────────────\n`
        }
        txt += `║ 📋 Cara beli:\n║ /beli [key] [jumlah]\n║ Contoh: /beli kunci 1\n║ /inv - liat inventory\n║ 📦 Max inventory: ${MAX_INVENTORY} slot\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt})
      }
      
      if(cmd === '/beli'){
        let key = (args[1]||'').toLowerCase()
        let jumlah = parseInt(args[2])||1
        if(!ITEMS[key]) return sock.sendMessage(from,{text:`❌ Item "${key}" gak ada di toko\nLiat /toko`})
        if(jumlah < 1) return sock.sendMessage(from,{text:`❌ Jumlah minimal 1`})
        let hargaKey = 'harga' + key.charAt(0).toUpperCase() + key.slice(1).replace(/_([a-z])/g, (m,c)=>c.toUpperCase())
        let harga = CONFIG[hargaKey] || ITEMS[key].harga
        let totalHarga = harga * jumlah
        if(getSaldo(sender) < totalHarga) return sock.sendMessage(from,{text:`❌ Saldo gak cukup, butuh ${totalHarga} Perak`})
        if(!addItem(sender, key, jumlah)){
          let max = ITEMS[key].maxStack
          let current = getInv(sender)[key]||0
          let totalInv = getTotalItem(sender)
          if(totalInv + jumlah > MAX_INVENTORY) return sock.sendMessage(from,{text:`❌ Inventory penuh! (${totalInv}/${MAX_INVENTORY})`})
          if(current + jumlah > max) return sock.sendMessage(from,{text:`❌ Max stack ${ITEMS[key].name} = ${max}\nLu punya: ${current}`})
          return sock.sendMessage(from,{text:`❌ Gagal tambah item`})
        }
        saldo[sender] -= totalHarga
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *BELI SUKSES* ✅ ║\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ ${ITEMS[key].emoji} ${ITEMS[key].name} x${jumlah}\n║ 💸 -${totalHarga} Perak\n║ 💵 Saldo: ${saldo[sender]}\n║ 📦 Inventory: ${getTotalItem(sender)}/${MAX_INVENTORY}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/inv' || cmd === '/inventory'){
        let inv = getInv(sender)
        let total = getTotalItem(sender)
        let txt = `╔════════════════════════╗\n║   📦 *INVENTORY* 📦\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 📦 Slot: ${total}/${MAX_INVENTORY}\n╠════════════════════════╣\n`
        if(total === 0){
          txt += `║ Inventory kosong\n║ /toko buat belanja\n`
        }else{
          for(let [k,v] of Object.entries(inv)){ if(v > 0 && ITEMS[k]) txt += `║ ${ITEMS[k].emoji} ${ITEMS[k].name} x${v}\n` }
        }
        let sh = getShield(sender)
        if(sh){
          let sisa = Math.ceil((sh.expiry - Date.now()) / (60*60*1000))
          txt += `╠════════════════════════╣\n║ 🛡️ Shield aktif: ${sisa} jam lagi\n`
        }
        txt += `╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }
      
      if(cmd === '/pakai' || cmd === '/use'){
        let key = (args[1]||'').toLowerCase()
        if(!key) return sock.sendMessage(from,{text:`⚠️ Cara: /pakai [item]\nItem: gembok, gembok_besi, bom, topeng`})
        if(!ITEMS[key]) return sock.sendMessage(from,{text:`❌ Item "${key}" gak ada`})
        if(!hasItem(sender, key)) return sock.sendMessage(from,{text:`❌ Lu gak punya ${ITEMS[key].name}`})
        if(key === 'gembok'){
          removeItem(sender, 'gembok', 1)
          addShield(sender, CONFIG.shieldGembokJam)
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🛡️ *SHIELD AKTIF* 🛡️ ║\n║ @${sender.split('@')[0]}\n║ Proteksi ${CONFIG.shieldGembokJam} jam\n╚════════════════════════╝`, mentions:[sender]})
        } else if(key === 'gembok_besi'){
          removeItem(sender, 'gembok_besi', 1)
          addShield(sender, CONFIG.shieldGembokBesiJam)
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🔒 *SHIELD BESI AKTIF* 🔒 ║\n║ @${sender.split('@')[0]}\n║ Proteksi ${CONFIG.shieldGembokBesiJam} jam\n╚════════════════════════╝`, mentions:[sender]})
        } else if(key === 'bom'){
          bomReadyDB[sender] = true
          saveDB()
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 💣 *BOM SIAP* 💣 ║\n║ @${sender.split('@')[0]}\n║ Bom otomatis kepake\n╚════════════════════════╝`, mentions:[sender]})
        } else if(key === 'topeng'){
          removeItem(sender, 'topeng', 1)
          topengReadyDB[sender] = true
          saveDB()
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🎭 *TOPENG SIAP* 🎭 ║\n║ @${sender.split('@')[0]}\n║ +10% chance maling\n╚════════════════════════╝`, mentions:[sender]})
        } else if(key === 'kunci'){
          return sock.sendMessage(from,{text:`⚠️ Kunci dipake otomatis pas /maling`})
        }
      }
      
      if(cmd === '/shield' || cmd === '/cek-shield'){
        let sh = getShield(sender)
        if(!sh) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🛡️ *SHIELD* 🛡️ ║\n║ @${sender.split('@')[0]}\n║ Gak ada shield aktif\n║ Beli di /toko\n╚════════════════════════╝`, mentions:[sender]})
        let sisa = Math.ceil((sh.expiry - Date.now()) / (60*60*1000))
        let tipe = sh.type === 'besi' ? '🔒 Gembok Besi' : '🛡️ Gembok'
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🛡️ *SHIELD AKTIF* 🛡️ ║\n║ @${sender.split('@')[0]}\n║ Tipe: ${tipe}\n║ Sisa: ${sisa} jam\n╚════════════════════════╝`, mentions:[sender]})
      }

      // ============ MALING ============
      
      if(cmd === '/maling' || cmd === '/curi'){
        if(!from.endsWith('@g.us')) return sock.sendMessage(from,{text:`❌ Cuma bisa di grup`})
        let target = mentionedJids[0]
        if(!target) return sock.sendMessage(from,{text:`⚠️ Cara: /maling @temen`})
        if(target === sender) return sock.sendMessage(from,{text:`❌ Gak bisa maling diri sendiri`})
        if(!hasItem(sender, 'kunci')) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ❌ *GAK PUNYA KUNCI* ║\n║ @${sender.split('@')[0]}\n║ Butuh 🔑 Kunci\n║ Beli di /toko\n╚════════════════════════╝`, mentions:[sender]})
        let daily = getMalingDaily(sender)
        if(daily.count >= CONFIG.malingMaxPerDay) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ⏰ *LIMIT HARIAN* ⏰ ║\n║ @${sender.split('@')[0]}\n║ Max ${CONFIG.malingMaxPerDay}x/hari\n║ Coba besok lagi\n╚════════════════════════╝`, mentions:[sender]})
        let cooldownKey = 'maling_'+sender
        if(cooldown[cooldownKey] && Date.now() - cooldown[cooldownKey] < CONFIG.malingCooldown){
          let sisa = Math.ceil((CONFIG.malingCooldown - (Date.now() - cooldown[cooldownKey]))/60000)
          return sock.sendMessage(from,{text:`⏳ Cooldown maling: ${sisa} menit lagi`})
        }
        let saldoTarget = getSaldo(target)
        if(saldoTarget < 500) return sock.sendMessage(from,{text:`❌ Target miskin, gak worth it (min 500)`})
        let targetShield = getShield(target)
        let kenaShield = false
        if(targetShield){ if(Math.random() > CONFIG.malingShieldTembus) kenaShield = true }
        removeItem(sender, 'kunci', 1)
        cooldown[cooldownKey] = Date.now()
        daily.count++
        saveDB()
        if(kenaShield){
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🛡️ *KEHALANG SHIELD* 🛡️ ║\n╠════════════════════════╣\n║ @${sender.split('@')[0]} coba maling\n║ @${target.split('@')[0]}\n║ ❌ Kehalang shield target!\n║ 🔑 Kunci kepake\n║ 💵 Saldo lu: ${saldo[sender]}\n╚════════════════════════╝`, mentions:[sender,target]})
          try{ await sock.sendMessage(target,{text:`🛡️ Ada yang coba maling lu tapi kehalang shield!`}) }catch(e){}
          return
        }
        let chance = CONFIG.malingChance
        let pakeTopeng = false
        if(topengReadyDB[sender]){ chance += 0.10; pakeTopeng = true; topengReadyDB[sender] = false; saveDB() }
        let sukses = Math.random() < chance
        if(sukses){
          let maxCuri = Math.floor(saldoTarget * CONFIG.malingMax)
          let hasil = Math.max(100, Math.floor(Math.random() * maxCuri) + 100)
          if(hasil > saldoTarget) hasil = saldoTarget
          saldo[target] -= hasil
          saldo[sender] = getSaldo(sender) + hasil
          addRiwayat(sender, `MALING @${target.split('@')[0]} +${hasil}`)
          addRiwayat(target, `DIMALING @${sender.split('@')[0]} -${hasil}`)
          saveDB()
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🦹 *MALING SUKSES!* 🦹 ║\n╠════════════════════════╣\n║ @${sender.split('@')[0]} → @${target.split('@')[0]}\n║ 💰 Curi: ${hasil}${pakeTopeng?' 🎭':''}\n║ 💵 Saldo lu: ${saldo[sender]}\n║ 😭 Korban: ${saldo[target]}\n╚════════════════════════╝`, mentions:[sender,target]})
          try{ await sock.sendMessage(target,{text:`🚨 *KETAHUAN DIMALING!* 🚨\n@${sender.split('@')[0]} nyolong ${hasil} Perak!\nSisa saldo lu: ${saldo[target]}`}) }catch(e){}
        }else{
          if(bomReadyDB[sender]){
            bomReadyDB[sender] = false; saveDB()
            await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 💣 *BOM KEPAKE!* 💣 ║\n║ @${sender.split('@')[0]} ketangkep\n║ 💣 Bom asap auto-escape\n║ ✅ Gak kena denda\n╚════════════════════════╝`, mentions:[sender]})
          }else{
            let denda = Math.floor(saldoTarget * CONFIG.malingDenda)
            if(denda > getSaldo(sender)) denda = getSaldo(sender)
            saldo[sender] -= denda
            saldo[target] = getSaldo(target) + denda
            addRiwayat(sender, `MALING GAGAL -${denda}`)
            addRiwayat(target, `NANGKAP MALING +${denda}`)
            saveDB()
            await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🚨 *MALING KETANGKAP!* 🚨\n╠════════════════════════╣\n║ @${sender.split('@')[0]} ketangkep!\n║ 💸 Denda: ${denda} (buat @${target.split('@')[0]})\n║ 💵 Saldo lu: ${saldo[sender]}\n╚════════════════════════╝`, mentions:[sender,target]})
            try{ await sock.sendMessage(target,{text:`🚨 *MALING KETANGKAP!* 🚨\n@${sender.split('@')[0]} coba maling lu, tapi ketangkep!\n💰 Denda: ${denda}\nSisa saldo lu: ${saldo[target]}`}) }catch(e){}
          }
        }
      }

      // ============ PROFIL ============
      
      if(cmd === '/profil'){
        let target = mentionedJids[0] || sender
        let s = getSaldo(target)
        let st = getStats(target)
        let wr = getWinRate(target)
        let skinAktif = getSkinName(target)
        let skinPrefix = getSkinPrefix(target)
        let totalSkin = (skinsDB[target]||[]).length
        let bank = bankDB[target] || 0
        let vip = isVip(target)
        let sh = getShield(target)
        let boost = getSkinBoost(target)
        let txt = `╔════════════════════════╗\n║   👤 *PROFIL* 👤\n╠════════════════════════╣\n║ 🏷️ @${target.split('@')[0]}\n║ 💰 Saldo: ${s.toLocaleString()}\n║ 🏦 Bank: ${bank.toLocaleString()}\n║ ${getRank(s,target)}\n║ ${vip?'✨ VIP Aktif':'⬜ Bukan VIP'}\n`
        if(sh){ let sisa = Math.ceil((sh.expiry - Date.now())/(60*60*1000)); txt += `║ 🛡️ Shield: ${sisa} jam\n` }
        txt += `╠════════════════════════╣\n║ 🎮 Total: ${st.main} game\n║ 🏆 Menang: ${st.menang}\n║ 😭 Kalah: ${st.kalah}\n║ 🤝 Seri: ${st.seri}\n║ 📈 WinRate: ${wr}%\n╠════════════════════════╣\n║ 🎨 Skin: [${skinPrefix}] ${skinAktif}\n`
        if(boost > 0) txt += `║ ⚡ Boost: +${(boost*100).toFixed(0)}% win\n`
        txt += `║ 📦 Koleksi: ${totalSkin} skin\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[target]})
      }
      
      if(cmd === '/rank-grup' || cmd === '/rankgrup'){
        if(!from.endsWith('@g.us')) return sock.sendMessage(from,{text:`❌ Cuma bisa di grup`})
        let txt = `╔════════════════════════╗\n║   🏆 *RANK GRUP INI* 🏆\n╠════════════════════════╣\n`
        let filtered = Object.entries(saldo).sort((a,b)=>b[1]-a[1]).slice(0,10)
        if(filtered.length === 0) return sock.sendMessage(from,{text:`Belum ada pemain`})
        filtered.forEach((v,i)=>{ let medal=i==0?'🥇':i==1?'🥈':i==2?'🥉':`${i+1}.`; txt+=`║ ${medal} @${v[0].split('@')[0]}\n║    💰 ${v[1].toLocaleString()}\n` })
        txt += `║ ────────────────────\n║ Total: ${Object.keys(saldo).length} pemain\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:filtered.map(v=>v[0])})
      }

      // === BAGIAN 8 SELESAI — LANJUT KE BAGIAN 9 ===
            // ============ BANK ============
      
      if(cmd === '/bank'){
        let saldoKu = getSaldo(sender)
        let bankKu = bankDB[sender] || 0
        let bunga = cekBungaBank(sender)
        let txt = `╔════════════════════════╗\n║   🏦 *BANK CASINO 12* 🏦\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 💵 Saldo: ${saldoKu.toLocaleString()}\n║ 🏦 Bank: ${bankKu.toLocaleString()}\n║ 📈 Bunga: ${CONFIG.bankBunga*100}%/hari\n`
        if(bunga > 0) txt += `║ 🎁 Bunga masuk: +${bunga}\n`
        txt += `╠════════════════════════╣\n║ 📋 Command:\n║ • /bank setor [jumlah]\n║ • /bank tarik [jumlah]\n║ • /bank setor all\n║ • /bank tarik all\n╠════════════════════════╣\n║ 💡 Duit di bank AMAN dari /maling\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }
      
      if(cmd === '/setor' || (cmd === '/bank' && args[1] === 'setor')){
        let jumlahArg = cmd === '/setor' ? args[1] : args[2]
        let saldoKu = getSaldo(sender)
        let jumlah = jumlahArg === 'all' ? saldoKu : parseInt(jumlahArg)
        if(!jumlah || jumlah < 100) return sock.sendMessage(from,{text:`⚠️ Minimal setor 100`})
        if(saldoKu < jumlah) return sock.sendMessage(from,{text:`❌ Saldo gak cukup`})
        saldo[sender] -= jumlah
        bankDB[sender] = (bankDB[sender]||0) + jumlah
        bankTimeDB[sender] = Date.now()
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *SETOR BANK* ✅ ║\n║ @${sender.split('@')[0]}\n║ 💰 +${jumlah} → Bank\n║ 💵 Saldo: ${saldo[sender]}\n║ 🏦 Bank: ${bankDB[sender]}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/tarik' || (cmd === '/bank' && args[1] === 'tarik')){
        let jumlahArg = cmd === '/tarik' ? args[1] : args[2]
        let bankKu = bankDB[sender] || 0
        let jumlah = jumlahArg === 'all' ? bankKu : parseInt(jumlahArg)
        if(!jumlah || jumlah < 100) return sock.sendMessage(from,{text:`⚠️ Minimal tarik 100`})
        if(bankKu < jumlah) return sock.sendMessage(from,{text:`❌ Bank gak cukup`})
        bankDB[sender] -= jumlah
        saldo[sender] = getSaldo(sender) + jumlah
        bankTimeDB[sender] = Date.now()
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *TARIK BANK* ✅ ║\n║ @${sender.split('@')[0]}\n║ 💰 +${jumlah} → Saldo\n║ 💵 Saldo: ${saldo[sender]}\n║ 🏦 Bank: ${bankDB[sender]}\n╚════════════════════════╝`, mentions:[sender]})
      }

      // ============ MISI HARIAN ============
      
      if(cmd === '/misi'){
        let m = getMisi(sender)
        let txt = `╔════════════════════════╗\n║   📋 *MISI HARIAN* 📋\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 📅 ${m.date}\n╠════════════════════════╣\n`
        let totalReward = 0
        let bisaKlaim = []
        for(let [k,v] of Object.entries(MISI_HARIAN)){
          let prog = m[v.key] || 0
          let done = prog >= v.target
          let claimed = m.claimed[k]
          let mark = claimed ? '✅' : (done ? '🎁' : '⬜')
          txt += `║ ${mark} ${v.desc} (${Math.min(prog,v.target)}/${v.target})\n║   → +${v.reward} Perak\n`
          if(done && !claimed){ bisaKlaim.push(k); totalReward += v.reward }
        }
        txt += `╠════════════════════════╣\n`
        if(bisaKlaim.length > 0) txt += `║ 🎁 Bisa klaim: ${bisaKlaim.length} misi\n║ 💰 Total: +${totalReward} Perak\n║ Ketik: /klaim-misi\n`
        else txt += `║ ✅ Belum ada yang bisa diklaim\n`
        txt += `╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }
      
      if(cmd === '/klaim-misi' || cmd === '/claim-misi'){
        let m = getMisi(sender)
        let klaim = []
        let total = 0
        for(let [k,v] of Object.entries(MISI_HARIAN)){
          let prog = m[v.key] || 0
          if(prog >= v.target && !m.claimed[k]){ m.claimed[k] = true; klaim.push(v.desc); total += v.reward }
        }
        if(klaim.length === 0) return sock.sendMessage(from,{text:`❌ Belum ada misi yang bisa diklaim @${sender.split('@')[0]}`, mentions:[sender]})
        saldo[sender] = getSaldo(sender) + total
        addRiwayat(sender, `KLAIM MISI +${total}`)
        saveDB()
        let txt = `╔════════════════════════╗\n║   🎉 *MISI SELESAI* 🎉\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n`
        klaim.forEach(k=>{ txt += `║ ✅ ${k}\n` })
        txt += `╠════════════════════════╣\n║ 💰 Total: +${total} Perak\n║ 💵 Saldo: ${saldo[sender]}\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }

      // ============ STREAK ============
      
      if(cmd === '/streak'){
        let today = getTodayKey()
        let yesterday = (()=>{ let d=new Date(); d.setDate(d.getDate()-1); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}` })()
        let streakInfo = streakDB[sender] || { count:0, lastDate:'', lastClaim:'' }
        let canClaim = (streakInfo.lastClaim !== today)
        if(streakInfo.lastDate !== today){
          streakInfo.count = streakInfo.lastDate === yesterday ? (streakInfo.count || 0) + 1 : 1
          streakInfo.lastDate = today
          streakDB[sender] = streakInfo
          saveDB()
        }
        let hari = ((streakInfo.count - 1) % 7) + 1
        let reward = STREAK_REWARD[hari - 1]
        let bonusHari7 = (hari === 7)
        let txt = `╔════════════════════════╗\n║   🔥 *STREAK LOGIN* 🔥\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 🔥 Streak: ${streakInfo.count||0} hari\n║ 🎁 Hari ke-${hari}: +${reward} Perak${bonusHari7?' + 🎲 skin Common':''}\n╠════════════════════════╣\n║ 📅 Reward 7 hari:\n`
        STREAK_REWARD.forEach((r,i)=>{
          let mark = (i+1 === hari) ? '👉' : (i+1 < hari ? '✅' : '⬜')
          txt += `║ ${mark} Hari ${i+1}: +${r}${i===6?' + 🎲':''}\n`
        })
        txt += `╠════════════════════════╣\n`
        txt += canClaim ? `║ 🎁 Ketik: /klaim-streak\n` : `║ ✅ Udah klaim hari ini\n`
        txt += `╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }
      
      if(cmd === '/klaim-streak' || cmd === '/claim-streak'){
        let today = getTodayKey()
        let yesterday = (()=>{ let d=new Date(); d.setDate(d.getDate()-1); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}` })()
        let streakInfo = streakDB[sender] || { count:0, lastDate:'', lastClaim:'' }
        if(streakInfo.lastClaim === today) return sock.sendMessage(from,{text:`❌ Udah klaim hari ini @${sender.split('@')[0]}`, mentions:[sender]})
        if(streakInfo.lastDate !== today){
          streakInfo.count = streakInfo.lastDate === yesterday ? (streakInfo.count || 0) + 1 : 1
          streakInfo.lastDate = today
        }
        streakInfo.lastClaim = today
        streakDB[sender] = streakInfo
        let hari = ((streakInfo.count - 1) % 7) + 1
        let reward = STREAK_REWARD[hari - 1]
        let bonusSkin = (hari === 7)
        saldo[sender] = getSaldo(sender) + reward
        let skinDapet = null
        if(bonusSkin){
          let commonPool = Object.entries(SKINS).filter(([k,v]) => v.rarity === 'Common')
          let pick = commonPool[Math.floor(Math.random() * commonPool.length)]
          skinDapet = pick[0]
          if(!skinsDB[sender]) skinsDB[sender] = []
          if(!skinsDB[sender].includes(skinDapet)) skinsDB[sender].push(skinDapet)
          else saldo[sender] += Math.floor(SKINS[skinDapet].dust * 0.5)
        }
        addRiwayat(sender, `STREAK hari ${hari} +${reward}`)
        saveDB()
        let txt = `╔════════════════════════╗\n║   🎉 *STREAK CLAIMED* 🎉\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 🔥 Streak: ${streakInfo.count} hari\n║ 💰 +${reward} Perak\n`
        if(bonusSkin) txt += `║ 🎲 Bonus skin: ${skinDapet ? `[${SKINS[skinDapet].prefix}] ${skinDapet}` : '(duplikat → dust)'}\n`
        txt += `║ 💵 Saldo: ${saldo[sender]}\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }

      // ============ TRANSFER, PINJAM, BAYAR ============
      
      if(cmd === '/transfer' || cmd === '/tf' || cmd === '/give'){
        let target = mentionedJids[0]
        let jumlah = parseInt(args[2]) || parseInt(args[1])
        if(!target) return sock.sendMessage(from,{text:`⚠️ Cara: /transfer @temen 1000`})
        if(!Number.isInteger(jumlah) || jumlah < 100) return sock.sendMessage(from,{text:`⚠️ Minimal transfer 100`})
        if(target === sender) return sock.sendMessage(from,{text:`❌ Gak bisa transfer ke diri sendiri`})
        if(getSaldo(sender) < jumlah) return sock.sendMessage(from,{text:`❌ Saldo gak cukup`})
        saldo[sender] -= jumlah
        saldo[target] = getSaldo(target) + jumlah
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *TRANSFER* ✅ ║\n║ @${sender.split('@')[0]} -> @${target.split('@')[0]}\n║ 💸 ${jumlah}\n╚════════════════════════╝`, mentions:[sender,target]})
      }
      
      if(cmd === '/pinjam'){
        if(utang[sender]) return sock.sendMessage(from,{text:`❌ Masih utang ${utang[sender].sisa}`})
        saldo[sender] = getSaldo(sender) + 1000
        utang[sender] = { sisa:1200, jatuhTempo:Date.now()+2*24*60*60*1000, telat:false, lastGroup:from }
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🏦 *PINJAMAN CAIR* 🏦 ║\n║ +1000 | Utang 1200\n║ Tempo 2 hari | Auto potong ${isVip(sender)?'20% VIP':'50%'}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/bayar' || cmd === '/bayar-utang'){
        if(!utang[sender]) return sock.sendMessage(from,{text:`✅ Gak ada utang`})
        let bayar = parseInt(args[1]) || utang[sender].sisa
        if(bayar < 1) return sock.sendMessage(from,{text:`❌ Jumlah bayar harus > 0`})
        if(bayar > utang[sender].sisa) bayar = utang[sender].sisa
        if(getSaldo(sender) < bayar) return sock.sendMessage(from,{text:`❌ Saldo gak cukup`})
        saldo[sender] -= bayar
        utang[sender].sisa -= bayar
        if(utang[sender].sisa <= 0) delete utang[sender]
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *BAYAR* ✅ ║\n║ Bayar ${bayar} Sisa ${utang[sender]?.sisa||0} ${!utang[sender]?'LUNAS':''}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/topup' || cmd === '/shop'){
        await sock.sendMessage(from,{text:`╔═════════ 💎 *TOPUP PERAK* 💎 ═════════╗\n║ Mau topup? Chat owner langsung ya\n╠═══════════════════════════════════════╣\n║ 💰 PAKET:\n║ 10K = 20.000 Perak\n║ 25K = 50.000 Perak\n║ 60K = 120.000 + VIP 7 Hari\n║ 175K = 350.000 + VIP 30 Hari ✨\n╠═══════════════════════════════════════╣\n║ 👑 Owner: @${OWNER.split('@')[0]}\n║ 🔗 wa.me/${OWNER_NUMBER}\n╚═══════════════════════════════════════╝`, mentions:[OWNER]})
      }
      
      if(cmd === '/vip' || cmd === '/cekvip'){
        if(!isVip(sender)) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✨ *VIP* ✨ ║\n║ @${sender.split('@')[0]} Belum VIP\n║ /topup buat jadi VIP\n╚════════════════════════╝`, mentions:[sender]})
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✨ *VIP AKTIF* ✨ ║\n║ @${sender.split('@')[0]}\n║ Sampai: ${new Date(vipDB[sender].expiry).toLocaleString('id-ID')}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/bukti'){
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 📸 *BUKTI TOPUP* 📸 ║\n║ @${sender.split('@')[0]} Bukti terkirim ke owner\n╚════════════════════════╝`, mentions:[sender]})
        try{ await sock.sendMessage(OWNER,{text:`📸 *BUKTI TOPUP*\n👤 @${sender.split('@')[0]}\n📍 Grup: ${from}`, mentions:[sender]}) }catch(e){}
      }
      
      if(cmd === '/bug'){
        let lap = args.slice(1).join(' ')
        if(!lap) return sock.sendMessage(from,{text:`⚠️ /bug [pesan]`})
        try{ await sock.sendMessage(OWNER,{text:`🚨 BUG\n@${sender.split('@')[0]} di ${from}\n${lap}`, mentions:[sender]}) }catch(e){}
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *BUG TERKIRIM* ✅ ║\n║ "${lap}"\n╚════════════════════════╝`, mentions:[sender]})
      }

      // === BAGIAN 9 SELESAI — LANJUT KE BAGIAN 10 ===
            // ============ GACHA & SKIN ============
      
      if(cmd === '/gacha'){
        let mode10 = (args[1] === '10x' || args[1] === '10')
        if(mode10){
          let total = Math.floor(CONFIG.gachaCost * 10 * (1 - CONFIG.gacha10Diskon))
          if(getSaldo(sender) < total) return sock.sendMessage(from,{text:`❌ Saldo gak cukup, butuh ${total}`, mentions:[sender]})
          saldo[sender] -= total
          saveDB()
          await sock.sendMessage(from,{text:`🎲 *Membuka 10 gacha...*`})
          await sleep(1000)
          let hasil = [], dupCount = 0, dustTotal = 0
          let rarityCount = { Common:0, Rare:0, Epic:0, Legendary:0 }
          if(!skinsDB[sender]) skinsDB[sender] = []
          for(let i=0; i<10; i++){
            let rarity = rollRarity()
            let skinKey = rollSkin(rarity)
            rarityCount[rarity]++
            let skin = SKINS[skinKey]
            let isDup = skinsDB[sender].includes(skinKey)
            if(isDup){ let dust = Math.floor(skin.dust * 0.5); dustTotal += dust; dupCount++; hasil.push({skinKey, rarity, isDup:true, dust}) }
            else { skinsDB[sender].push(skinKey); hasil.push({skinKey, rarity, isDup:false}) }
          }
          saldo[sender] += dustTotal
          addRiwayat(sender, `GACHA 10x (${dupCount} dup)`)
          trackMisi(sender, 'gacha')
          saveDB()
          let txt = `╔════════════════════════╗\n║   🎉 *GACHA 10x* 🎉\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 💰 Biaya: -${total}\n╠════════════════════════╣\n`
          hasil.forEach((h,i)=>{ let sk = SKINS[h.skinKey]; let mark = h.isDup ? `♻️ +${h.dust}` : `✅ BARU`; txt += `║ ${i+1}. ${RARITY_ICON[h.rarity]} [${sk.prefix}] ${h.skinKey} ${mark}\n` })
          txt += `╠════════════════════════╣\n║ 📊 Rekap:\n║ ⚪ Common: ${rarityCount.Common}\n║ 🔷 Rare: ${rarityCount.Rare}\n║ 🔥 Epic: ${rarityCount.Epic}\n║ ⚡ Legendary: ${rarityCount.Legendary}\n`
          if(dupCount > 0) txt += `║ ♻️ Dup: ${dupCount} (+${dustTotal} dust)\n`
          txt += `║ 💵 Saldo: ${saldo[sender]}\n║ 📦 Koleksi: ${skinsDB[sender].length} skin\n╚════════════════════════╝`
          return sock.sendMessage(from,{text:txt, mentions:[sender]})
        }
        if(getSaldo(sender) < CONFIG.gachaCost) return sock.sendMessage(from,{text:`❌ Saldo gak cukup, butuh ${CONFIG.gachaCost}`, mentions:[sender]})
        saldo[sender] -= CONFIG.gachaCost
        saveDB()
        await sock.sendMessage(from,{text:`🎲 *Membuka gacha...*`})
        await sleep(800)
        await sock.sendMessage(from,{text:`✨ ...`})
        await sleep(800)
        let rarity = rollRarity()
        let skinKey = rollSkin(rarity)
        let skin = SKINS[skinKey]
        if(!skinsDB[sender]) skinsDB[sender] = []
        let isDup = skinsDB[sender].includes(skinKey)
        let dustGain = 0
        if(isDup){ dustGain = Math.floor(skin.dust * 0.5); saldo[sender] += dustGain; addRiwayat(sender, `GACHA DUP ${skinKey} +${dustGain}`) }
        else { skinsDB[sender].push(skinKey); addRiwayat(sender, `GACHA ${rarity} ${skinKey}`) }
        trackMisi(sender, 'gacha')
        saveDB()
        let txt = `╔════════════════════════╗\n║   🎉 *GACHA RESULT* 🎉\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ ${RARITY_ICON[rarity]} Rarity: *${rarity}*\n║ 🎨 Skin: [${skin.prefix}] *${skinKey.toUpperCase()}*\n║ 💰 Biaya: -${CONFIG.gachaCost}\n`
        if(isDup) txt += `║ ♻️ *DUPLIKAT!* → +${dustGain} dust\n`
        else txt += `║ ✅ *SKIN BARU!*\n`
        txt += `║ 📦 Koleksi: ${skinsDB[sender].length} skin\n║ 💵 Saldo: ${saldo[sender]}\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }
      
      if(cmd === '/jual-skin' || cmd === '/jualskin'){
        let skinKey = (args[1] || '').toLowerCase()
        if(!skinKey) return sock.sendMessage(from,{text:`⚠️ Cara: /jual-skin [nama]`, mentions:[sender]})
        if(!SKINS[skinKey]) return sock.sendMessage(from,{text:`❌ Skin "${skinKey}" gak ada`})
        if(skinKey === 'dadu') return sock.sendMessage(from,{text:`❌ Skin dadu gak bisa dijual`})
        if(!skinsDB[sender] || !skinsDB[sender].includes(skinKey)) return sock.sendMessage(from,{text:`❌ Lu gak punya skin "${skinKey}"`})
        if(activeSkinDB[sender] === skinKey) return sock.sendMessage(from,{text:`❌ Skin lagi dipasang`})
        let skin = SKINS[skinKey]
        let hargaJual = Math.floor(skin.dust * CONFIG.jualSkinRate)
        let idx = skinsDB[sender].indexOf(skinKey)
        skinsDB[sender].splice(idx, 1)
        saldo[sender] = getSaldo(sender) + hargaJual
        addRiwayat(sender, `JUAL SKIN ${skinKey} +${hargaJual}`)
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 💸 *JUAL SKIN* 💸 ║\n║ 👤 @${sender.split('@')[0]}\n║ [${skin.prefix}] ${skinKey}\n║ 💰 +${hargaJual} Perak\n║ 💵 Saldo: ${saldo[sender]}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/upgrade-skin' || cmd === '/upgradeskin'){
        let owned = skinsDB[sender] || []
        if(owned.length < 3) return sock.sendMessage(from,{text:`❌ Butuh minimal 3 skin`})
        let commons = owned.filter(k => SKINS[k] && SKINS[k].rarity === 'Common' && k !== 'dadu')
        if(commons.length < 3) return sock.sendMessage(from,{text:`❌ Butuh 3 skin Common (selain dadu)\nCommon lu: ${commons.length}`})
        let pick = [], pool = [...commons]
        for(let i=0; i<3; i++){ let idx = Math.floor(Math.random() * pool.length); pick.push(pool[idx]); pool.splice(idx, 1) }
        pick.forEach(k => { let idx = skinsDB[sender].indexOf(k); if(idx >= 0) skinsDB[sender].splice(idx, 1) })
        let rarePool = Object.entries(SKINS).filter(([k,v]) => v.rarity === 'Rare')
        let dapet = rarePool[Math.floor(Math.random() * rarePool.length)][0]
        let isDup = skinsDB[sender].includes(dapet)
        let dustGain = 0, statusBaru = false
        if(isDup){ dustGain = Math.floor(SKINS[dapet].dust * 0.5); saldo[sender] += dustGain }
        else { skinsDB[sender].push(dapet); statusBaru = true }
        addRiwayat(sender, `UPGRADE SKIN → ${dapet}`)
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ⚡ *UPGRADE SKIN* ⚡ ║\n║ 👤 @${sender.split('@')[0]}\n║ 🗑️ [${SKINS[pick[0]].prefix}] ${pick[0]}\n║ 🗑️ [${SKINS[pick[1]].prefix}] ${pick[1]}\n║ 🗑️ [${SKINS[pick[2]].prefix}] ${pick[2]}\n║ ────────────\n║ 🎁 ${RARITY_ICON['Rare']} [${SKINS[dapet].prefix}] *${dapet}*\n║ ${statusBaru?'✅ SKIN BARU!':`♻️ DUPLIKAT → +${dustGain} dust`}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/dust'){
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║   ✨ *DUST INFO* ✨\n╠════════════════════════╣\n║ ⚪ Common: 20\n║ 🔷 Rare: 80\n║ 🔥 Epic: 200\n║ ⚡ Legendary: 500\n║\n║ 💡 Dust dari duplikat & upgrade\n║ ✅ Langsung masuk saldo\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/skinku' || cmd === '/koleksi'){
        let owned = skinsDB[sender] || []
        let active = activeSkinDB[sender] || null
        if(owned.length === 0) return sock.sendMessage(from,{text:`╔════════════════════════╗\n║   🎨 *SKINKU* 🎨\n║ @${sender.split('@')[0]}\n║ Belum punya skin\n║ /gacha buat tarik\n╚════════════════════════╝`, mentions:[sender]})
        let byRarity = { Common:[], Rare:[], Epic:[], Legendary:[] }
        for(let k of owned){ if(SKINS[k]) byRarity[SKINS[k].rarity].push(k) }
        let boost = getSkinBoost(sender)
        let txt = `╔════════════════════════╗\n║   🎨 *KOLEKSI SKIN* 🎨\n╠════════════════════════╣\n║ 👤 @${sender.split('@')[0]}\n║ 📦 Total: ${owned.length} skin\n║ ✅ Aktif: [${getSkinPrefix(sender)}] ${getSkinName(sender)}\n`
        if(boost > 0) txt += `║ ⚡ Boost: +${(boost*100).toFixed(0)}%\n`
        txt += `╠════════════════════════╣\n`
        for(let r of ['Legendary','Epic','Rare','Common']){
          if(byRarity[r].length === 0) continue
          txt += `║ ${RARITY_ICON[r]} *${r}* (${byRarity[r].length})\n`
          for(let k of byRarity[r]){ let mark = (active === k) ? ' ✅' : ''; txt += `║   [${SKINS[k].prefix}] ${k}${mark}\n` }
          txt += `║ ────────────\n`
        }
        txt += `╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:[sender]})
      }
      
      if(cmd === '/pilih-skin' || cmd === '/pakai-skin'){
        let pilih = (args[1] || '').toLowerCase()
        let owned = skinsDB[sender] || []
        if(!pilih) return sock.sendMessage(from,{text:`⚠️ Cara: /pilih-skin naga`})
        if(!SKINS[pilih]) return sock.sendMessage(from,{text:`❌ Skin "${pilih}" gak ada`})
        if(!owned.includes(pilih)) return sock.sendMessage(from,{text:`❌ Belum punya skin "${pilih}"`})
        activeSkinDB[sender] = pilih
        let boost = getSkinBoost(sender)
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║   ✅ *SKIN DIPASANG* ✅\n║ @${sender.split('@')[0]}\n║ [${SKINS[pilih].prefix}] *${pilih.toUpperCase()}*\n║ ${boost>0?`⚡ +${(boost*100).toFixed(0)}% win`:'⚡ 0%'}\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/listskin' || cmd === '/skinlist'){
        let txt = `╔════════════════════════╗\n║   📜 *DAFTAR SKIN* 📜\n╠════════════════════════╣\n`
        let lastR = ''
        for(let [k,v] of Object.entries(SKINS)){
          if(v.rarity !== lastR){ lastR = v.rarity; let boost = RARITY_BOOST[v.rarity]; txt += `║ ${RARITY_ICON[v.rarity]} *${v.rarity}* ${boost>0?`(+${(boost*100).toFixed(0)}%)`:''}\n` }
          txt += `║   [${v.prefix}] ${k} (dust ${v.dust})\n`
        }
        txt += `╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt})
      }

      // ============ RULES & PANDUAN ============
      
      if(cmd === '/rules' || cmd === '/aturan'){
        await sock.sendMessage(from,{text:`📜 *CARA MAIN CASINO 12* 📜\n\n━━━━━━━━━━━━━━━━━━━━\n🎲 *DADU*\nTiap pemain kocok 2 dadu, skor tertinggi menang\n\n🎰 *MEJA BIASA:* /buka-meja [taruhan]\n👑 *MEJA BANDAR:* /buka-bandar [taruhan]\n\n🏦 *BANK:* /setor /tarik (aman dari maling)\n\n🦹 *MALING:* butuh 🔑 kunci\n\n🎰 *TOGEL 5 PASARAN:*\n• KMB 11:00 → 11:30\n• SDY 13:00 → 13:30\n• SG 17:00 → 17:30\n• JPN 19:00 → 19:30\n• HK 22:00 → 23:00\n\n💰 Hadiah togel: 2D ${CONFIG.togelHadiah2D}x | 3D ${CONFIG.togelHadiah3D}x | 4D ${CONFIG.togelHadiah4D}x\n💵 Min bet: ${CONFIG.togelMinBet.toLocaleString('id-ID')}\n\n⚠️ Perak cuma virtual`})
      }
      
      if(cmd === '/panduan' || cmd === '/guide' || cmd === '/cara'){
        await sock.sendMessage(from,{text:`📖 *PANDUAN CEPAT* 📖\n\n💰 /saldo /daily /misi /streak /top\n🏦 /bank /setor /tarik\n🦹 /toko /beli /maling\n🎨 /gacha /skinku /pilih-skin\n🎰 /togel /togel-sg /togelku /hasil-togel\n💎 /topup /vip\n🎲 /buka-meja /buka-bandar /gas\n\nKetik /menu buat lengkap`})
      }

      // ============ MEJA (GAME DADU) ============
      
      if(cmd === '/buka-meja' || cmd === '/allin'){
        if(cooldown[sender] && Date.now()-cooldown[sender] < CONFIG.cooldownMeja) return sock.sendMessage(from,{text:`⏳ Cooldown 15 detik`, mentions:[sender]})
        let bet = cmd === '/allin' ? getSaldo(sender) : parseInt(args[1])||500
        if(bet < CONFIG.minBetBiasa) bet = CONFIG.minBetBiasa
        if(getSaldo(sender) < bet) return sock.sendMessage(from,{text:`❌ Saldo gak cukup @${sender.split('@')[0]}`, mentions:[sender]})
        if(tables[from]) return sock.sendMessage(from,{text:`❌ Meja udah ada, /batal-meja dulu`})
        saldo[sender] -= bet; saveDB(); cooldown[sender]=Date.now()
        tables[from] = { type:'biasa', bet, ownerId:sender, players:[sender], pot:bet }
        tables[from].timeout = setTimeout(async()=>{ if(tables[from]){ for(let pid of tables[from].players) saldo[pid]=getSaldo(pid)+tables[from].bet; saveDB(); try{ await sock.sendMessage(from,{text:`⏰ Meja auto batal 2 menit`}) }catch(e){} delete tables[from] } }, CONFIG.autoBatalBiasa)
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🎰 MEJA BIASA TERBUKA 🎰 ║\n║ Taruhan: ${bet}\n║ Owner: @${sender.split('@')[0]}\n║ Pot: ${bet}\n║ /join | /gas | /batal-meja\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/buka-bandar'){
        if(cooldown[sender] && Date.now()-cooldown[sender] < CONFIG.cooldownMeja) return sock.sendMessage(from,{text:`⏳ Cooldown 15 detik`, mentions:[sender]})
        let bet = parseInt(args[1])||CONFIG.minBetBandar
        if(bet < CONFIG.minBetBandar) bet = CONFIG.minBetBandar
        if(getSaldo(sender) < bet) return sock.sendMessage(from,{text:`❌ Saldo gak cukup (min ${CONFIG.minBetBandar})`, mentions:[sender]})
        if(tables[from]) return sock.sendMessage(from,{text:`❌ Meja udah ada`})
        saldo[sender] -= bet; saveDB(); cooldown[sender]=Date.now()
        tables[from] = { type:'bandar', bet, ownerId:sender, players:[{id:sender, bet}], pot:bet }
        tables[from].timeout = setTimeout(async()=>{ if(tables[from]){ for(let p of tables[from].players) saldo[p.id]=getSaldo(p.id)+p.bet; saveDB(); try{ await sock.sendMessage(from,{text:`⏰ Meja bandar auto batal 3 menit`}) }catch(e){} delete tables[from] } }, CONFIG.autoBatalBandar)
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 👑 MEJA BANDAR TERBUKA 👑 ║\n║ 🎰 Bandar: BOT 🤖\n║ Taruhan: ${bet}\n║ Player: @${sender.split('@')[0]} [1/${CONFIG.maxPlayerBandar}]\n║ /join | /gas | /batal-meja\n╚════════════════════════╝`, mentions:[sender]})
      }
      
      if(cmd === '/batal-meja' || cmd === '/batal'){
        let t = tables[from]
        if(!t) return sock.sendMessage(from,{text:`❌ Gak ada meja`})
        if(t.ownerId !== sender && !isOwner(sender)) return sock.sendMessage(from,{text:`❌ Cuma owner meja`})
        if(t.locked) return sock.sendMessage(from,{text:`🔒 Meja lagi dikocok`})
        if(t.timeout) clearTimeout(t.timeout)
        if(t.type === 'biasa'){ for(let pid of t.players){ saldo[pid]=getSaldo(pid)+t.bet } }
        else{ for(let p of t.players){ saldo[p.id]=getSaldo(p.id)+p.bet } }
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ❌ MEJA DIBATALKAN ❌ ║\n║ Semua taruhan dikembalikan\n╚════════════════════════╝`, mentions:[sender]})
        delete tables[from]
      }
      
      if(cmd === '/join'){
        let t = tables[from]
        if(!t) return sock.sendMessage(from,{text:`❌ Belum ada meja`})
        if(t.locked) return sock.sendMessage(from,{text:`🔒 Meja udah dikunci`})
        if(t.type === 'biasa'){
          if(t.players.includes(sender)) return sock.sendMessage(from,{text:`❌ Lu udah di meja`})
          if(t.players.length >= CONFIG.maxPlayerBiasa) return sock.sendMessage(from,{text:`❌ Meja full`})
          if(getSaldo(sender) < t.bet) return sock.sendMessage(from,{text:`❌ Saldo gak cukup`})
          saldo[sender] -= t.bet; t.pot += t.bet; t.players.push(sender); saveDB()
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ JOIN MEJA BIASA ✅ ║\n║ @${sender.split('@')[0]} join ${t.bet}\n║ Pot: ${t.pot} [${t.players.length}/${CONFIG.maxPlayerBiasa}]\n╚════════════════════════╝`, mentions:t.players})
        }else{
          if(t.players.find(p=>p.id === sender)) return sock.sendMessage(from,{text:`❌ Lu udah di meja`})
          if(t.players.length >= CONFIG.maxPlayerBandar) return sock.sendMessage(from,{text:`❌ Meja bandar full`})
          if(getSaldo(sender) < t.bet) return sock.sendMessage(from,{text:`❌ Saldo gak cukup`})
          saldo[sender] -= t.bet; t.pot += t.bet; t.players.push({id:sender, bet:t.bet}); saveDB()
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ JOIN MEJA BANDAR ✅ ║\n║ @${sender.split('@')[0]} join ${t.bet} vs BOT 🤖\n║ Pot: ${t.pot} [${t.players.length}/${CONFIG.maxPlayerBandar}]\n╚════════════════════════╝`, mentions:t.players.map(p=>p.id)})
        }
      }
      
      if(cmd === '/gas'){
        let t = tables[from]
        if(!t) return sock.sendMessage(from,{text:`❌ Belum ada meja`})
        if(t.ownerId !== sender) return sock.sendMessage(from,{text:`❌ Cuma owner @${t.ownerId.split('@')[0]} yang bisa /gas`, mentions:[t.ownerId]})
        if(t.locked) return sock.sendMessage(from,{text:`🔒 Meja lagi dikocok`})
        if(t.type === 'biasa' && t.players.length < 2) return sock.sendMessage(from,{text:`❌ Butuh minimal 2 orang`})
        t.locked = true
        if(t.timeout) clearTimeout(t.timeout)
        try{
          await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🔒 MEJA DIKUNCI 🔒 ║\n║ Pot: ${t.pot}\n║ Tipe: ${t.type==='biasa'?'Biasa':'Bandar (BOT)'}\n╚════════════════════════╝`})
          await sleep(800)
          await sock.sendMessage(from,{text:`⏳ *3...*`}); await sleep(700)
          await sock.sendMessage(from,{text:`⏳ *2...*`}); await sleep(700)
          await sock.sendMessage(from,{text:`⏳ *1...* 🎲`}); await sleep(700)
        }catch(e){}
        if(t.type === 'biasa'){
          let results = []
          for(let pid of t.players){ let c=rollPlayerCards(pid); results.push({id:pid, cards:c, point:hitung(c), pref:getSkinPrefix(pid)}) }
          let maxPoint = Math.max(...results.map(r=>r.point))
          let winners = results.filter(r=>r.point === maxPoint)
          let hasil = `┏━ 🎰 HASIL MEJA BIASA 🎰 ━┓\n`
          results.forEach(r=>{ hasil += `┃ @${r.id.split('@')[0]} [${r.pref}${r.cards[0]}|${r.pref}${r.cards[1]}] = ${r.point}\n` })
          if(winners.length > 1){
            for(let pid of t.players){ saldo[pid]=getSaldo(pid)+t.bet }
            hasil += `┣━━━━━━━━━━━━━━━━┫\n┃ 💥 SERI SKOR TERTINGGI ${maxPoint}\n┃ Ronde batal & uang balik semua\n`
            winners.forEach(w=>{ addRiwayat(w.id,`SERI ${w.point}`); updateStats(w.id,'seri') })
            results.filter(r=>!winners.find(w=>w.id===r.id)).forEach(r=>{ addRiwayat(r.id,`SERI BATAL`); updateStats(r.id,'seri') })
          }else{
            let win = winners[0]
            let komisi = Math.floor(t.pot * CONFIG.komisiBiasa)
            let hadiah = t.pot - komisi
            saldo[win.id] = getSaldo(win.id) + hadiah
            hasil += `┣━━━━━━━━━━━━━━━━┫\n┃ 🏆 PEMENANG @${win.id.split('@')[0]} ${maxPoint}\n┃ 💰 Bawa pulang ${hadiah}\n`
            addRiwayat(win.id,`MENANG ${win.point} +${hadiah}`); updateStats(win.id,'menang')
            results.filter(r=>r.id !== win.id).forEach(r=>{ addRiwayat(r.id,`KALAH vs ${maxPoint}`); updateStats(r.id,'kalah') })
          }
          hasil += `┗━━━━━━━━━━━━━━━━┛`
          saveDB()
          delete tables[from]
          try{ await sock.sendMessage(from,{text:hasil, mentions:t.players}) }catch(e){}
        }else{
          let botCards = rollBotCards()
          let botPoint = hitung(botCards)
          let mentions = []
          let hasil = `┏━ 👑 HASIL BANDAR (BOT) 👑 ━┓\n┃ BOT [🤖${botCards[0]}|🤖${botCards[1]}] = ${botPoint}\n┣━━━━━━━━━━━━━━━━┫\n`
          for(let p of t.players){
            let pc = rollPlayerCards(p.id)
            let pp = hitung(pc)
            let pPref = getSkinPrefix(p.id)
            mentions.push(p.id)
            if(pp > botPoint){
              let kotor = Math.floor(p.bet * CONFIG.hadiahBandarMenang)
              let komisi = Math.floor(kotor * CONFIG.komisiBandar)
              let bersih = kotor - komisi
              saldo[p.id] = getSaldo(p.id) + bersih
              hasil += `┃ @${p.id.split('@')[0]} [${pPref}${pc[0]}|${pPref}${pc[1]}] = ${pp} 🏆 MENANG +${bersih}\n`
              addRiwayat(p.id,`MENANG BANDAR ${pp}>${botPoint} +${bersih}`); updateStats(p.id,'menang')
            } else if(botPoint > pp){
              hasil += `┃ @${p.id.split('@')[0]} [${pPref}${pc[0]}|${pPref}${pc[1]}] = ${pp} 😭 KALAH -${p.bet}\n`
              addRiwayat(p.id,`KALAH BANDAR ${pp}<${botPoint} -${p.bet}`); updateStats(p.id,'kalah')
            } else {
              saldo[p.id] = getSaldo(p.id) + p.bet
              hasil += `┃ @${p.id.split('@')[0]} [${pPref}${pc[0]}|${pPref}${pc[1]}] = ${pp} 🤝 SERI balik\n`
              addRiwayat(p.id,`SERI BANDAR ${pp}`); updateStats(p.id,'seri')
            }
            trackMisi(p.id,'bandar')
          }
          hasil += `┗━━━━━━━━━━━━━━━━┛`
          saveDB()
          delete tables[from]
          try{ await sock.sendMessage(from,{text:hasil, mentions:mentions}) }catch(e){}
        }
      }

      // ============ OWNER TOOLS ============
      
      if(cmd === '/ownerkey' || cmd === '/owner-key' || cmd === '/okey'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only @${sender.split('@')[0]}`, mentions:[sender]})
        let txt = `╔═══════════════════════════════════════╗\n`
        txt += `║   👑 *OWNER KEY LIST* 👑\n`
        txt += `╠═══════════════════════════════════════╣\n`
        txt += `║ 💰 *EKONOMI:*\n`
        txt += `║ /kasih-perak @org [jml]\n`
        txt += `║ /ambil-perak @org [jml]\n`
        txt += `║ /kasih-vip @org [hari]\n`
        txt += `║ /kasih-item @org [key] [jml]\n`
        txt += `║ /reset-user @org\n`
        txt += `╠═══════════════════════════════════════╣\n`
        txt += `║ 👑 *OWNER MANAGEMENT:*\n`
        txt += `║ /add-owner @org\n`
        txt += `║ /del-owner @org\n`
        txt += `║ /list-owner\n`
        txt += `╠═══════════════════════════════════════╣\n`
        txt += `║ 🎰 *TOGEL CONTROL:*\n`
        txt += `║ /togel-notif\n`
        txt += `║ /togel-mode\n`
        txt += `║ /togel-set-hasil\n`
        txt += `║ /listbet-kmb|sdy|sg|jpn|hk\n`
        txt += `╠═══════════════════════════════════════╣\n`
        txt += `║ 📊 *INFO:*\n`
        txt += `║ /stats-bot\n`
        txt += `║ /listuser\n`
        txt += `║ /cekid\n`
        txt += `╠═══════════════════════════════════════╣\n`
        txt += `║ 🛠️ *KONTROL:*\n`
        txt += `║ /broadcast [pesan]\n`
        txt += `║ /ban @org\n`
        txt += `║ /unban @org\n`
        txt += `║ /backup\n`
        txt += `║ /set-harga [key] [angka]\n`
        txt += `╠═══════════════════════════════════════╣\n`
        txt += `║ ♻️ *RESET:*\n`
        txt += `║ /reset-top\n`
        txt += `║ /reset-minggu\n`
        txt += `╚═══════════════════════════════════════╝`
        await sock.sendMessage(from,{text:txt})
      }
      
      if(cmd === '/add-owner' || cmd === '/addowner'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let target = mentionedJids[0] || (args[1] ? args[1].replace(/[^0-9]/g,'')+'@s.whatsapp.net' : null)
        if(!target) return sock.sendMessage(from,{text:`⚠️ Cara: /add-owner @user\nAtau: /add-owner 628xxxx`})
        let nT = target.replace(/[^0-9]/g,'')
        if(nT === OWNER_NUMBER || target === OWNER || target === OWNER_LID) return sock.sendMessage(from,{text:`⚠️ Udah owner utama`, mentions:[target]})
        if(ownersDB[target] === true) return sock.sendMessage(from,{text:`⚠️ Udah jadi owner`, mentions:[target]})
        ownersDB[target] = true
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║   👑 *OWNER BARU* 👑   ║\n╠════════════════════════╣\n║ ✅ @${target.split('@')[0]}\n║ Akses: /ownerkey\n╚════════════════════════╝`, mentions:[target]})
        try{ await sock.sendMessage(target,{text:`👑 Kamu diangkat jadi *OWNER*!`}) }catch(e){}
      }
      
      if(cmd === '/del-owner' || cmd === '/delowner' || cmd === '/remove-owner'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let target = mentionedJids[0] || (args[1] ? args[1].replace(/[^0-9]/g,'')+'@s.whatsapp.net' : null)
        if(!target) return sock.sendMessage(from,{text:`⚠️ Cara: /del-owner @user`})
        if(ownersDB[target] !== true) return sock.sendMessage(from,{text:`⚠️ Bukan owner tambahan`, mentions:[target]})
        if(target === sender) return sock.sendMessage(from,{text:`⚠️ Gak bisa hapus diri sendiri`})
        delete ownersDB[target]
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║   🗑️ *OWNER DIHAPUS* 🗑️   ║\n║ @${target.split('@')[0]}\n╚════════════════════════╝`, mentions:[target]})
      }
      
      if(cmd === '/list-owner' || cmd === '/listowner'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let txt = `╔════════════════════════╗\n║   👑 *LIST OWNER* 👑\n╠════════════════════════╣\n║ 🔒 *Owner Utama:*\n║ • ${OWNER_NUMBER}\n║ • ${OWNER_LID}\n║\n║ ➕ *Owner Tambahan:*\n`
        let list = Object.keys(ownersDB).filter(k=>ownersDB[k]===true)
        if(list.length === 0) txt += `║   (belum ada)\n`
        else list.forEach((o,i)=>{ txt += `║ ${i+1}. @${o.split('@')[0]}\n` })
        txt += `╠════════════════════════╣\n║ Total: ${list.length}\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:list})
      }
      
      if(cmd === '/stats-bot'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let totalUser = Object.keys(saldo).length
        let totalSaldo = Object.values(saldo).reduce((a,b)=>a+b,0)
        let totalBank = Object.values(bankDB).reduce((a,b)=>a+b,0)
        let totalGrup = Object.keys(groupDB).length
        let totalUtang = Object.keys(utang).length
        let totalUtangSisa = Object.values(utang).reduce((a,b)=>a+b.sisa,0)
        let totalVip = Object.keys(vipDB).length
        let totalBanned = Object.keys(bannedDB).filter(k=>bannedDB[k]).length
        let totalOwner = Object.keys(ownersDB).filter(k=>ownersDB[k]===true).length
        let totalTogelBet = 0
        for(let p in togelDB){ for(let u in togelDB[p]){ totalTogelBet += togelDB[p][u].totalTaruhan || 0 } }
        let txt = `╔════════════════════════╗\n║   📊 *STATS BOT* 📊\n╠════════════════════════╣\n║ 👥 Total user: ${totalUser}\n║ 💰 Total saldo: ${totalSaldo.toLocaleString()}\n║ 🏦 Total bank: ${totalBank.toLocaleString()}\n║ 🏘️ Total grup: ${totalGrup}\n║ 🏦 User berutang: ${totalUtang}\n║ 💸 Total utang: ${totalUtangSisa.toLocaleString()}\n║ ✨ User VIP: ${totalVip}\n║ 🚫 User banned: ${totalBanned}\n║ 👑 Owner tambahan: ${totalOwner}\n║ 🎰 Total bet togel aktif: ${totalTogelBet.toLocaleString()}\n╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt})
      }
      
      if(cmd === '/broadcast' || cmd === '/bc'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let pesan = args.slice(1).join(' ')
        if(!pesan) return sock.sendMessage(from,{text:`⚠️ Cara: /broadcast [pesan]`})
        let grupList = Object.keys(groupDB)
        if(grupList.length === 0) return sock.sendMessage(from,{text:`❌ Belum ada grup`})
        await sock.sendMessage(from,{text:`📢 Broadcast ke ${grupList.length} grup...`})
        let sukses = 0, gagal = 0
        for(let g of grupList){
          try{
            await sock.sendMessage(g,{text:`📢 *BROADCAST OWNER*\n\n${pesan}\n\n— ${new Date().toLocaleString('id-ID')}`})
            sukses++
            await sleep(1000)
          }catch(e){ gagal++ }
        }
        await sock.sendMessage(from,{text:`✅ Selesai!\nSukses: ${sukses}\nGagal: ${gagal}`})
      }
      
      if(cmd === '/ban'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let target = mentionedJids[0]
        if(!target) return sock.sendMessage(from,{text:`⚠️ Cara: /ban @user`})
        bannedDB[target] = true
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🚫 *USER DI-BAN* 🚫 ║\n║ @${target.split('@')[0]}\n╚════════════════════════╝`, mentions:[target]})
      }
      
      if(cmd === '/unban'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let target = mentionedJids[0]
        if(!target) return sock.sendMessage(from,{text:`⚠️ Cara: /unban @user`})
        if(!bannedDB[target]) return sock.sendMessage(from,{text:`⚠️ Gak di-ban`, mentions:[target]})
        delete bannedDB[target]
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✅ *USER UNBANNED* ✅ ║\n║ @${target.split('@')[0]}\n╚════════════════════════╝`, mentions:[target]})
      }
      
      if(cmd === '/backup'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        if(!fs.existsSync(FILE_DB)) return sock.sendMessage(from,{text:`❌ File gak ada`})
        try{
          let buffer = fs.readFileSync(FILE_DB)
          let ts = new Date().toISOString().replace(/[:.]/g,'-')
          await sock.sendMessage(OWNER,{
            document: buffer,
            mimetype: 'application/json',
            fileName: `saldo-backup-${ts}.json`,
            caption: `📦 *BACKUP DB*\n📅 ${new Date().toLocaleString('id-ID')}`
          })
          await sock.sendMessage(from,{text:`✅ Backup terkirim ke DM owner`})
        }catch(e){ await sock.sendMessage(from,{text:`❌ Gagal: ${e.message}`}) }
      }
      
      if(cmd === '/set-harga' || cmd === '/set-config'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let key = args[1]
        let val = parseFloat(args[2])
        let validKeys = ['togelMinBet','togelMaxPerAngka','togelHadiah2D','togelHadiah3D','togelHadiah4D','gachaCost','dailyNormal','dailyVip','minBetBiasa','minBetBandar','malingChance','malingMaxPerDay','bankBunga']
        if(!key || isNaN(val)) return sock.sendMessage(from,{text:`⚠️ Cara: /set-harga [key] [angka]\nKey: ${validKeys.join(', ')}`})
        if(!validKeys.includes(key)) return sock.sendMessage(from,{text:`❌ Key "${key}" gak valid`})
        let oldVal = CONFIG[key]
        CONFIG[key] = val
        saveConfig()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ⚙️ *CONFIG UPDATED* ⚙️\n║ ${key}: ${oldVal} → ${val}\n╚════════════════════════╝`})
      }
      
      if(cmd === '/kasih-item' || cmd === '/additem'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let target = mentionedJids[0]
        let key = (args[2]||'').toLowerCase()
        let jumlah = parseInt(args[3])||1
        if(!target || !key) return sock.sendMessage(from,{text:`⚠️ Cara: /kasih-item @org kunci 2`})
        if(!ITEMS[key]) return sock.sendMessage(from,{text:`❌ Item "${key}" gak ada`})
        if(!addItem(target, key, jumlah)) return sock.sendMessage(from,{text:`❌ Gagal tambah item`})
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 🎁 *ITEM DIKASIH* 🎁 ║\n║ @${target.split('@')[0]}\n║ ${ITEMS[key].emoji} ${ITEMS[key].name} x${jumlah}\n╚════════════════════════╝`, mentions:[target]})
      }
      
      if(cmd === '/reset-user'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let target = mentionedJids[0]
        if(!target) return sock.sendMessage(from,{text:`⚠️ Cara: /reset-user @user`})
        delete saldo[target]; delete utang[target]; delete riwayat[target]; delete vipDB[target]
        delete dailyDB[target]; delete statsDB[target]; delete skinsDB[target]; delete activeSkinDB[target]
        delete misiDB[target]; delete streakDB[target]; delete bankDB[target]; delete bankTimeDB[target]
        delete inventoryDB[target]; delete shieldDB[target]; delete malingDailyDB[target]
        delete bomReadyDB[target]; delete topengReadyDB[target]
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ♻️ *USER RESET* ♻️ ║\n║ @${target.split('@')[0]}\n╚════════════════════════╝`, mentions:[target]})
      }
      
      if(cmd === '/listuser'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let sorted = Object.entries(saldo).sort((a,b)=>b[1]-a[1])
        if(sorted.length === 0) return sock.sendMessage(from,{text:`❌ Belum ada user`})
        let txt = `╔════════════════════════╗\n║ 👥 *LIST USER* (${sorted.length})\n╠════════════════════════╣\n`
        let limit = Math.min(sorted.length, 30)
        for(let i=0; i<limit; i++){
          let v = sorted[i]
          txt += `║ ${i+1}. @${v[0].split('@')[0]}${bannedDB[v[0]]?' 🚫':''}${isVip(v[0])?' ✨':''}\n║    💰 ${v[1].toLocaleString()}\n`
        }
        if(sorted.length > limit) txt += `║ ... dan ${sorted.length - limit} user lain\n`
        txt += `╚════════════════════════╝`
        await sock.sendMessage(from,{text:txt, mentions:sorted.slice(0,limit).map(v=>v[0])})
      }
      
      if(cmd === '/kasih-perak' || cmd === '/addperak'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let target = mentionedJids[0]
        let jumlah = parseInt(args[2]) || parseInt(args[1])
        if(!target || !jumlah) return sock.sendMessage(from,{text:`⚠️ Cara: /kasih-perak @temen 20000`})
        saldo[target] = getSaldo(target) + jumlah
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ 💰 *TOPUP SUKSES* 💰 ║\n║ Owner kasih ${jumlah} ke @${target.split('@')[0]}\n╚════════════════════════╝`, mentions:[target]})
      }
      
      if(cmd === '/ambil-perak'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`})
        let target = mentionedJids[0]
        let jumlah = parseInt(args[2])||0
        if(!target || !jumlah) return sock.sendMessage(from,{text:`⚠️ /ambil-perak @temen 1000`})
        saldo[target] = Math.max(0, getSaldo(target)-jumlah)
        saveDB()
        await sock.sendMessage(from,{text:`✅ Ambil ${jumlah} dari @${target.split('@')[0]} Sisa ${saldo[target]}`, mentions:[target]})
      }
      
      if(cmd === '/kasih-vip'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`})
        let target = mentionedJids[0]
        let hari = parseInt(args[2])||7
        if(!target) return sock.sendMessage(from,{text:`⚠️ /kasih-vip @temen 7`})
        let exp = Date.now()+hari*24*60*60*1000
        if(vipDB[target]) exp = Math.max(vipDB[target].expiry, Date.now())+hari*24*60*60*1000
        vipDB[target] = { expiry:exp }
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ✨ *VIP DIKASIH* ✨ ║\n║ @${target.split('@')[0]} VIP ${hari} hari\n╚════════════════════════╝`, mentions:[target]})
      }
      
      if(cmd === '/reset-top'){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        let savedConfig = {...CONFIG}
        db = { saldo:{}, utang:{}, riwayat:{}, groups:groupDB, vip:{}, daily:{}, stats:{}, weekly:{weekId:getWeekId(), players:{}}, skins:{}, activeSkin:{}, misi:{}, streak:{}, lastLogin:{}, banned:{}, config:savedConfig, bank:{}, bankTime:{}, inventory:{}, shield:{}, malingDaily:{}, bomReady:{}, topengReady:{}, owners:ownersDB, togel:{}, togelHasil:{} }
        saldo=db.saldo; utang=db.utang; riwayat=db.riwayat; vipDB=db.vip; dailyDB=db.daily; statsDB=db.stats; weeklyDB=db.weekly; skinsDB=db.skins; activeSkinDB=db.activeSkin; misiDB=db.misi; streakDB=db.streak; lastLoginDB=db.lastLogin; bannedDB=db.banned; bankDB=db.bank; bankTimeDB=db.bankTime; inventoryDB=db.inventory; shieldDB=db.shield; malingDailyDB=db.malingDaily; bomReadyDB=db.bomReady; topengReadyDB=db.topengReady; ownersDB=db.owners; togelDB=db.togel; togelHasilDB=db.togelHasil
        saveDB()
        await sock.sendMessage(from,{text:`╔════════════════════════╗\n║ ♻️ *SEASON RESET* ♻️ ║\n║ Semua data direset\n║ Config & owner tetep aman\n╚════════════════════════╝`})
      }

      // ============ END OF HANDLER ============
            // ============ LISTBET (OWNER) ============
      
      let listbetCmds = {
        '/listbet-kmb':'KMB','/listbet-sdy':'SDY',
        '/listbet-sg':'SG','/listbet-jpn':'JPN','/listbet-hk':'HK'
      }
      if(listbetCmds[cmd]){
        if(!isOwner(sender)) return sock.sendMessage(from,{text:`❌ Owner only`, mentions:[sender]})
        
        let kode = listbetCmds[cmd]
        let p = CONFIG.togelPasaran[kode]
        let periode = getTogelPeriode(kode)
        let bets = togelDB[periode] || {}
        let pasaranBets = {}
        for(let uid in bets){ if(bets[uid].pasaran === kode) pasaranBets[uid] = bets[uid] }
        
        let totalUser = Object.keys(pasaranBets).length
        if(totalUser === 0){
          return sock.sendMessage(from,{text:`╔═══════════════════════════════════╗\n║ ${p.emoji} *${p.nama}* [${kode}]\n╠═══════════════════════════════════╣\n║ 📅 Periode: ${periode}\n║ Belum ada bet\n╚═══════════════════════════════════╝`})
        }
        
        // Hitung total & breakdown per kategori
        let grandTotal = 0
        let kategoriTotal = { '2D':0, '3D':0, '4D':0 }
        let kategoriCount = { '2D':0, '3D':0, '4D':0 }
        
        for(let uid in pasaranBets){
          for(let b of pasaranBets[uid].bets){
            grandTotal += b.taruhan
            kategoriTotal[b.kategori] += b.taruhan
            kategoriCount[b.kategori]++
          }
        }
        
        // Hitung EV per kategori
        let evData = {
          '2D': { chance: 1/100, hadiah: CONFIG.togelHadiah2D },
          '3D': { chance: 1/1000, hadiah: CONFIG.togelHadiah3D },
          '4D': { chance: 1/10000, hadiah: CONFIG.togelHadiah4D }
        }
        
        let totalExpectedProfit = 0
        
        let txt = `╔═══════════════════════════════════╗\n`
        txt += `║ ${p.emoji} *${p.nama}* [${kode}]\n`
        txt += `║   📋 *LISTBET OWNER*\n`
        txt += `╠═══════════════════════════════════╣\n`
        txt += `║ 📅 Periode: ${periode}\n`
        txt += `║ 👥 Total bet: ${totalUser} user\n`
        txt += `║ 💰 Total uang: ${grandTotal.toLocaleString('id-ID')} Perak\n`
        txt += `╠═══════════════════════════════════╣\n`
        txt += `║ 📊 *BREAKDOWN PER KATEGORI:*\n`
        txt += `║ ⚪ 2D: ${kategoriCount['2D']} bet | ${kategoriTotal['2D'].toLocaleString('id-ID')}\n`
        txt += `║ 🔷 3D: ${kategoriCount['3D']} bet | ${kategoriTotal['3D'].toLocaleString('id-ID')}\n`
        txt += `║ 🔥 4D: ${kategoriCount['4D']} bet | ${kategoriTotal['4D'].toLocaleString('id-ID')}\n`
        txt += `╠═══════════════════════════════════╣\n`
        txt += `║ 🎯 *EV BOT (Expected Profit):*\n`
        
        for(let kat of ['2D','3D','4D']){
          if(kategoriTotal[kat] === 0) continue
          let ev = (1 - evData[kat].chance * evData[kat].hadiah) * 100
          let expectedPayout = kategoriTotal[kat] * evData[kat].chance * evData[kat].hadiah
          let expectedProfit = kategoriTotal[kat] - expectedPayout
          totalExpectedProfit += expectedProfit
          txt += `║\n`
          txt += `║ *${kat}* (hadiah ${evData[kat].hadiah}x):\n`
          txt += `║ • Total masuk: ${kategoriTotal[kat].toLocaleString('id-ID')}\n`
          txt += `║ • Expected payout: ${Math.floor(expectedPayout).toLocaleString('id-ID')}\n`
          txt += `║ • Expected profit: ${Math.floor(expectedProfit).toLocaleString('id-ID')}\n`
          txt += `║ • EV: ${ev > 0 ? '+' : ''}${ev.toFixed(0)}%\n`
        }
        
        txt += `╠═══════════════════════════════════╣\n`
        txt += `║ 💰 *TOTAL EXPECTED PROFIT:*\n`
        txt += `║ ${totalExpectedProfit > 0 ? '+' : ''}${Math.floor(totalExpectedProfit).toLocaleString('id-ID')} Perak\n`
        txt += `╠═══════════════════════════════════╣\n`
        txt += `║ 📝 *DAFTAR BET:*\n`
        
        // Sort by total taruhan desc, limit 15
        let sortedBets = Object.entries(pasaranBets).sort((a,b)=>b[1].totalTaruhan - a[1].totalTaruhan)
        sortedBets.slice(0, 15).forEach(([uid, data], i)=>{
          txt += `║\n`
          txt += `║ ${i+1}. @${uid.split('@')[0]}\n`
          txt += `║    Total: ${data.totalTaruhan.toLocaleString('id-ID')} Perak\n`
          data.bets.forEach(b=>{
            let hadiah = getHadiahTogel(b.angka, b.taruhan)
            txt += `║    • ${b.angka} (${b.kategori}) × ${b.taruhan.toLocaleString('id-ID')} → potensi ${hadiah.toLocaleString('id-ID')}\n`
          })
        })
        
        if(sortedBets.length > 15){
          txt += `║\n║ ... +${sortedBets.length - 15} user lain\n`
        }
        
        txt += `╚═══════════════════════════════════╝`
        
        await sock.sendMessage(from,{text:txt, mentions:sortedBets.slice(0,15).map(b=>b[0])})
      }
    })

  }catch(e){
    console.log('❌ Error di startBot:', e.message)
    botRunning = false
  }
}

startBot()
console.log('BOT STARTING...')