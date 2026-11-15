import { useEffect, useState } from 'react'
import { api } from './api.js'

const ESSENTIALS = new Set(['produce', 'dairy_eggs', 'meat_fish', 'bakery', 'frozen', 'cupboard', 'household_cleaning', 'laundry', 'toiletries_personal_care', 'baby_care', 'feminine_care', 'health_medicine', 'pet'])
const ACCENTS = new Set(['drinks', 'alcohol', 'snacks_treats', 'ready_meals'])
const EARTH_PALETTE = ['#bd7861', '#d2a15f', '#9c7488', '#967e72']
const ACCENT_PALETTE = ['#e47761', '#eab753', '#718fa0', '#ce7180']
const LANDSCAPE_PROFILES = {
  city: {
    name: 'Corner-Shop City',
    mood: 'treat-rush',
    celestial: 'sun',
    headings: ['The snack district has the corner office.', 'A skyline built one little treat at a time.', 'Ready meals are running this town.'],
    captions: ['Your treat budget has a city pass and no plans to go home early.', 'Convenience is in its downtown era; the kettle has filed for overtime.', 'Small bites, big-city energy. The snack council has called a meeting.'],
    colors: { sky: '#615079', mid: '#b36372', horizon: '#ef9867', far: '#62516d', near: '#814b61', ground: '#65445a', deep: '#302c46', sun: '#ffd17e', glow: '#ff9c83' },
    foregroundPath: 'M 0 343 H 900 V 440 H 0 Z',
  },
  night_market: {
    name: 'Neon Night Market',
    mood: 'after-hours',
    celestial: 'moon',
    headings: ['The night market is open; your budget knows the vendors.', 'A little after-hours sparkle, coming right up.', 'The moon has competition from the drinks shelf.'],
    captions: ['Alcohol spending brought its own neon sign and forgot to turn it off.', 'The late-night refreshment district is glowing a little brighter this week.', 'A moonlit market, a lively basket, and absolutely no last call for puns.'],
    colors: { sky: '#171f4a', mid: '#393568', horizon: '#7d4771', far: '#302c5e', near: '#44305f', ground: '#473352', deep: '#171d3a', sun: '#f6edcc', glow: '#ef8cb0' },
    foregroundPath: 'M 0 343 H 900 V 440 H 0 Z',
  },
  jungle: {
    name: 'Canopy Jungle',
    mood: 'fresh-and-feral',
    celestial: 'sun',
    headings: ['The produce aisle went full canopy.', 'Leaf it to the greens to steal the show.', 'Your salad era has a whole ecosystem.'],
    captions: ['Produce is doing the heavy lifting. Somewhere, a leaf just got promoted.', 'Fresh finds are growing wild; the fruit bowl is feeling famous.', 'The greens have formed a tiny committee and elected a very ripe leader.'],
    colors: { sky: '#286b61', mid: '#63a078', horizon: '#c4b96e', far: '#246653', near: '#315b48', ground: '#36543f', deep: '#203c37', sun: '#fff0a7', glow: '#d8d978' },
    foregroundPath: 'M 0 347 C 129 326 207 359 323 341 S 552 324 675 350 S 830 330 900 344 V 440 H 0 Z',
  },
  forest: {
    name: 'Pine-Needle Forest',
    mood: 'rooted-and-ready',
    celestial: 'sun',
    headings: ['A quiet little essentials empire.', 'The budget packed a flask and a sensible list.', 'Sturdy roots. Suspiciously good planning.'],
    captions: ['Calm categories, sturdy roots. A spreadsheet would call this “well behaved.”', 'Household essentials are holding the line without making a fuss.', 'Your spending brought reusable bags and remembered where they are.'],
    colors: { sky: '#496f61', mid: '#8d9c70', horizon: '#d5a56d', far: '#476c52', near: '#385845', ground: '#354d3d', deep: '#233a32', sun: '#ffe5a0', glow: '#e8b56e' },
    foregroundPath: 'M 0 346 C 154 329 254 352 369 340 S 590 357 731 338 S 839 343 900 332 V 440 H 0 Z',
  },
  tundra: {
    name: 'Price-Check Tundra',
    mood: 'price-pinched',
    celestial: 'moon',
    headings: ['Checkout has entered its frost era.', 'The receipt called. It wants a warmer coat.', 'A chilly forecast with a very expensive wind.'],
    captions: ['Prices are inching upward; your receipt has requested an extra layer.', 'The checkout line is colder than the weather app today.', 'A little price pressure, a lot of dramatic glacier energy.'],
    frozenHeadings: ['The freezer aisle has claimed the horizon.', 'Your frozen-food era looks positively glacial.', 'Cold storage, cooler landscape.'],
    frozenCaptions: ['Frozen favourites are the headliners; the forecast is one-degree-chiller.', 'The freezer aisle has expanded into a full expedition.', 'Your peas are thriving. The penguins have started a fan club.'],
    colors: { sky: '#263d72', mid: '#546a9a', horizon: '#8797b5', far: '#b7c8d7', near: '#8fa8bc', ground: '#9fb6c5', deep: '#617f99', sun: '#f6edcc', glow: '#d3d9ec' },
    foregroundPath: 'M 0 351 C 142 347 245 350 367 344 S 620 351 746 345 S 839 348 900 343 V 440 H 0 Z',
  },
  coast: {
    name: 'Tidepool Coast',
    mood: 'mixed-bag',
    celestial: 'moon',
    headings: ['Your spending refuses to be typecast.', 'A little of this, a little of that, lovely tide.', 'The budget is taking the scenic route.'],
    captions: ['A little bit of everything, with a gentle chance of biscuits. Bring snacks, just in case.', 'No single category stole the spotlight; the tide brought a bit of everything.', 'Your spending has range. Even the seagulls are curious.'],
    colors: { sky: '#316d88', mid: '#6698a0', horizon: '#d7b27c', far: '#46899a', near: '#347583', ground: '#c9ae82', deep: '#365e69', sun: '#fff0bd', glow: '#9dd2d3' },
    foregroundPath: 'M 0 350 C 120 341 236 361 362 348 S 585 337 723 354 S 846 338 900 348 V 440 H 0 Z',
  },
  wetlands: {
    name: 'Moonlit Wetlands',
    mood: 'hydration-station',
    celestial: 'moon',
    headings: ['The refreshment district is glowing.', 'Your drinks have formed a water feature.', 'Tonight’s forecast: a 100% chance of one more sip.'],
    captions: ['The drinks shelf is doing laps around a very scenic marsh.', 'Hydration has become a whole landscape. Even the frogs approve.', 'The beverage budget is making waves, quite literally.'],
    colors: { sky: '#253e59', mid: '#315d68', horizon: '#668875', far: '#426b61', near: '#315b50', ground: '#345648', deep: '#1d3a3b', sun: '#f6e8bd', glow: '#87b5a2' },
    foregroundPath: 'M 0 344 C 141 337 264 352 371 345 S 585 351 711 342 S 837 347 900 338 V 440 H 0 Z',
  },
  desert: {
    name: 'Pantry Dunes',
    mood: 'well-stocked',
    celestial: 'sun',
    headings: ['The pantry has entered its dune era.', 'Shelf-stable, sun-soaked, and thriving.', 'Your cupboards are giving oasis energy.'],
    captions: ['Cupboard staples are piling up like dunes. Somewhere, a chickpea feels seen.', 'A well-stocked pantry: the mirage is just another tin of beans.', 'The cupboard is prepared for anything except one more lentil pun.'],
    colors: { sky: '#b85f50', mid: '#e08c5b', horizon: '#f3bd72', far: '#d48b5e', near: '#b56d50', ground: '#c88753', deep: '#79503f', sun: '#fff0b0', glow: '#f5a85e' },
    foregroundPath: 'M 0 348 C 155 323 226 363 350 343 S 559 320 697 351 S 837 327 900 345 V 440 H 0 Z',
  },
  alpine: {
    name: 'Alpine Pantry',
    mood: 'hearty',
    celestial: 'sun',
    headings: ['A hearty shop has climbed new heights.', 'Dairy and dinner: the summit team.', 'This basket is built for the long hike.'],
    captions: ['Hearty staples are reaching peak performance. Pack snacks for the ascent.', 'The mountain was made of milk, cheese, and excellent meal plans.', 'Your receipt has summited the dairy range without breaking a sweat.'],
    colors: { sky: '#5686a3', mid: '#8eb4bb', horizon: '#e8c18a', far: '#718fa2', near: '#577486', ground: '#738a87', deep: '#405967', sun: '#fff0c1', glow: '#d4e4bc' },
    foregroundPath: 'M 0 352 C 125 340 234 353 347 344 S 552 355 671 340 S 818 352 900 338 V 440 H 0 Z',
  },
  meadow: {
    name: 'Bakery Meadow',
    mood: 'fresh-from-the-oven',
    celestial: 'sun',
    headings: ['The bakery has gone country.', 'A loafly little patch of spending.', 'Fresh bakes are in full bloom.'],
    captions: ['Bakery spending is rising. The wildflowers smell faintly of sourdough.', 'A fresh loaf has become the local celebrity. Crumbs are invited.', 'The meadow is proof that good things take thyme to rise.'],
    colors: { sky: '#7784a6', mid: '#c397a1', horizon: '#edb777', far: '#9a9b88', near: '#788566', ground: '#7b8b59', deep: '#465841', sun: '#fff0b8', glow: '#f2c578' },
    foregroundPath: 'M 0 347 C 147 332 237 362 373 345 S 591 329 715 350 S 843 333 900 345 V 440 H 0 Z',
  },
}
const CITY_BUILDINGS = [
  { x: 28, y: 242, width: 58, height: 70 },
  { x: 101, y: 220, width: 48, height: 92 },
  { x: 164, y: 253, width: 64, height: 59 },
  { x: 252, y: 232, width: 51, height: 80 },
  { x: 319, y: 258, width: 70, height: 54 },
  { x: 706, y: 245, width: 56, height: 67 },
  { x: 777, y: 217, width: 60, height: 95 },
  { x: 850, y: 250, width: 40, height: 62 },
]
const NIGHT_BUILDINGS = [
  { x: 20, y: 232, width: 62, height: 90 },
  { x: 94, y: 197, width: 60, height: 125 },
  { x: 166, y: 247, width: 66, height: 75 },
  { x: 250, y: 215, width: 72, height: 107 },
  { x: 330, y: 257, width: 55, height: 65 },
  { x: 708, y: 229, width: 70, height: 93 },
  { x: 790, y: 190, width: 54, height: 132 },
  { x: 855, y: 240, width: 44, height: 82 },
]
const TERRAIN_SHAPES = {
  city: { base: 330, relief: 42 },
  night_market: { base: 330, relief: 34 },
  jungle: { base: 323, relief: 55 },
  forest: { base: 318, relief: 94 },
  tundra: { base: 330, relief: 28 },
  coast: { base: 330, relief: 34 },
  wetlands: { base: 330, relief: 24 },
  desert: { base: 326, relief: 70 },
  alpine: { base: 316, relief: 128 },
  meadow: { base: 325, relief: 67 },
}
const NIGHT_STARS = [
  { x: 77, y: 58 }, { x: 152, y: 118 }, { x: 254, y: 52 }, { x: 367, y: 105 },
  { x: 489, y: 61 }, { x: 752, y: 49 }, { x: 833, y: 126 }, { x: 875, y: 68 },
]

function categoryLabel(category) {
  return String(category).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function categoryColor(category, index) {
  if (ACCENTS.has(category)) return ACCENT_PALETTE[['snacks_treats', 'alcohol', 'drinks', 'ready_meals'].indexOf(category)]
  if (ESSENTIALS.has(category)) {
    const paletteIndex = ['produce', 'dairy_eggs', 'bakery', 'meat_fish'].indexOf(category)
    return EARTH_PALETTE[paletteIndex < 0 ? index % EARTH_PALETTE.length : paletteIndex]
  }
  return EARTH_PALETTE[index % EARTH_PALETTE.length]
}

function landscapeProfile(categories, priceChanges, memberName) {
  const totalSpend = categories.reduce((total, category) => total + category.spend, 0)
  const shareFor = (predicate) => totalSpend
    ? categories.reduce((total, category) => total + (predicate(category.category) ? category.spend : 0), 0) / totalSpend
    : 0
  const snackShare = shareFor((category) => ['snacks_treats', 'ready_meals'].includes(category))
  const alcoholShare = shareFor((category) => category === 'alcohol')
  const drinkShare = shareFor((category) => category === 'drinks')
  const produceShare = shareFor((category) => category === 'produce')
  const pantryShare = shareFor((category) => category === 'cupboard')
  const bakeryShare = shareFor((category) => category === 'bakery')
  const frozenShare = shareFor((category) => category === 'frozen')
  const heartyShare = shareFor((category) => ['dairy_eggs', 'meat_fish'].includes(category))
  const homeCareShare = shareFor((category) => ['household_cleaning', 'laundry', 'toiletries_personal_care', 'baby_care', 'feminine_care'].includes(category))
  const essentialsShare = shareFor((category) => ESSENTIALS.has(category))
  const largestPriceRise = Math.max(0, ...priceChanges.map((item) =>
    item.unit_price_change_pct ?? item.price_change_pct ?? 0
  ))
  let biome = 'coast'
  if (largestPriceRise >= 12 || frozenShare >= 0.3) biome = 'tundra'
  else if (alcoholShare >= 0.2) biome = 'night_market'
  else if (drinkShare >= 0.28) biome = 'wetlands'
  else if (snackShare >= 0.25) biome = 'city'
  else if (produceShare >= 0.25) biome = 'jungle'
  else if (pantryShare >= 0.35) biome = 'desert'
  else if (bakeryShare >= 0.25) biome = 'meadow'
  else if (heartyShare >= 0.45) biome = 'alpine'
  else if (homeCareShare >= 0.4 || essentialsShare >= 0.6) biome = 'forest'
  const profile = LANDSCAPE_PROFILES[biome]
  const headings = biome === 'tundra' && largestPriceRise < 12 ? profile.frozenHeadings : profile.headings
  const captions = biome === 'tundra' && largestPriceRise < 12 ? profile.frozenCaptions : profile.captions
  const nameSeed = Array.from(memberName ?? '').reduce((total, character) => total + character.charCodeAt(0), 0)
  const spendSeed = categories.reduce((total, category, index) => total + Math.round(category.spend * 100) * (index + 1), 0)
  const variant = Math.abs(spendSeed + Math.round(largestPriceRise * 10) + nameSeed) % captions.length
  return {
    ...profile,
    biome,
    largestPriceRise,
    mood: biome === 'tundra' && largestPriceRise < 12 ? 'freezer-favorite' : profile.mood,
    heading: headings[variant],
    caption: captions[variant],
  }
}

function smoothPath(points) {
  if (points.length < 2) return ''

  return points.slice(0, -1).reduce((path, point, index) => {
    const next = points[index + 1]
    const previous = points[Math.max(0, index - 1)]
    const afterNext = points[Math.min(points.length - 1, index + 2)]
    const control1 = {
      x: point.x + (next.x - previous.x) / 6,
      y: point.y + (next.y - previous.y) / 6,
    }
    const control2 = {
      x: next.x - (afterNext.x - point.x) / 6,
      y: next.y - (afterNext.y - point.y) / 6,
    }
    const start = index === 0 ? `M ${point.x} ${point.y}` : path
    return `${start} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${next.x} ${next.y}`
  }, '')
}

// Keep the supporting charts lightweight; the tapestry is drawn from the same API data.
function Bars({ rows, label, value }) {
  const max = Math.max(...rows.map((r) => r[value]), 1)
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r[label]} className="bar-row">
          <span className="bar-label">{String(r[label]).replace(/_/g, ' ')}</span>
          <span className="bar" style={{ width: `${(r[value] / max) * 100}%` }} />
          <span className="bar-value">£{r[value].toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

function BiomeScenery({ profile, movement }) {
  const { biome, colors, celestial } = profile
  const buildings = biome === 'city' ? CITY_BUILDINGS : NIGHT_BUILDINGS

  return (
    <>
      {celestial === 'sun' ? (
        <g>
          <circle cx="620" cy="170" r={82 + movement * 15} fill={colors.glow} opacity=".28" filter="url(#landscape-soft)" />
          <circle cx="620" cy="170" r="48" fill="url(#sunset-sun)" />
          <path d="M 570 172 H 670 M 572 184 H 668" stroke={colors.near} strokeWidth="3" opacity=".35" />
        </g>
      ) : (
        <g>
          {NIGHT_STARS.map((star) => (
            <path key={`${star.x}-${star.y}`} d={`M ${star.x} ${star.y - 4} L ${star.x + 1.5} ${star.y - 1.5} L ${star.x + 4} ${star.y} L ${star.x + 1.5} ${star.y + 1.5} L ${star.x} ${star.y + 4} L ${star.x - 1.5} ${star.y + 1.5} L ${star.x - 4} ${star.y} L ${star.x - 1.5} ${star.y - 1.5} Z`} fill="#fff3cd" opacity=".82" />
          ))}
          <circle cx="684" cy="112" r="49" fill={colors.glow} opacity=".22" filter="url(#landscape-soft)" />
          <path d="M 678 72 A 40 40 0 1 0 678 152 A 29 40 0 0 1 678 72 Z" fill="#f3edcf" />
        </g>
      )}
      {biome === 'city' && (
        <g>
          {buildings.map((building, buildingIndex) => (
            <g key={building.x}>
              <rect x={building.x} y={building.y} width={building.width} height={building.height} rx="3" fill={buildingIndex % 2 ? '#51415f' : '#634765'} />
              {Array.from({ length: 9 }, (_, index) => (
                <rect
                  key={index}
                  x={building.x + 8 + (index % 3) * 12}
                  y={building.y + 9 + Math.floor(index / 3) * 14}
                  width="4"
                  height="6"
                  rx="1"
                  fill={index % 3 ? '#ffd486' : '#f5a78a'}
                  opacity=".82"
                />
              ))}
            </g>
          ))}
          <path d="M 38 310 H 389 M 42 318 H 390" stroke="#f5b875" strokeWidth="2" opacity=".65" />
        </g>
      )}
      {biome === 'night_market' && (
        <g>
          {buildings.map((building, buildingIndex) => (
            <g key={building.x}>
              <rect x={building.x} y={building.y} width={building.width} height={building.height} rx="3" fill={buildingIndex % 2 ? '#20294e' : '#2b2853'} />
              {Array.from({ length: 9 }, (_, index) => (
                <rect key={index} x={building.x + 8 + (index % 3) * 13} y={building.y + 10 + Math.floor(index / 3) * 15} width="5" height="7" rx="1" fill={index % 2 ? '#64e0ce' : '#f283b6'} opacity=".9" />
              ))}
            </g>
          ))}
          <path d="M 28 303 H 390 M 30 314 H 395" stroke="#f382b9" strokeWidth="3" opacity=".8" />
          <path d="M 68 297 L 93 281 L 118 297 M 166 297 L 191 281 L 216 297 M 266 297 L 291 281 L 316 297" fill="#ed9364" stroke="#ffe2a2" strokeWidth="2" />
        </g>
      )}
      {biome === 'wetlands' && (
        <g>
          <path d="M 0 278 C 130 248 225 304 355 274 S 603 248 724 284 S 834 294 900 264 L 900 361 L 0 361 Z" fill="#244f58" opacity=".83" />
          <path d="M 0 291 C 130 261 225 317 355 287 S 603 261 724 297 S 834 307 900 277 M 0 323 C 130 293 225 349 355 319 S 603 293 724 329 S 834 339 900 309" fill="none" stroke="#8ab6a0" strokeWidth="2" opacity=".65" />
          {[75, 186, 728, 842].map((x) => (
            <g key={x} stroke="#324f41" strokeWidth="5" strokeLinecap="round">
              <path d={`M ${x} 310 V 250 M ${x} 270 L ${x - 19} 247 M ${x} 278 L ${x + 18} 252`} />
              <ellipse cx={x - 21} cy="244" rx="17" ry="7" fill="#6d8d62" transform={`rotate(24 ${x - 21} 244)`} />
              <ellipse cx={x + 20} cy="249" rx="17" ry="7" fill="#6d8d62" transform={`rotate(-25 ${x + 20} 249)`} />
            </g>
          ))}
        </g>
      )}
      {biome === 'jungle' && (
        <g>
          <path d="M 0 0 H 145 C 124 59 164 82 130 143 C 98 197 130 225 96 283 H 0 Z M 900 0 H 755 C 776 59 736 82 770 143 C 802 197 770 225 804 283 H 900 Z" fill="#1e584e" opacity=".94" />
          {[32, 111, 790, 868].map((x, index) => (
            <g key={x} fill="none" stroke="#204a42" strokeLinecap="round">
              <path d={`M ${x} 356 C ${x + (index % 2 ? -7 : 8)} 292 ${x - 7} 232 ${x + 3} 163`} strokeWidth="15" />
              <path d={`M ${x + 2} 282 C ${x - 22} 260 ${x - 19} 237 ${x - 31} 222 M ${x + 3} 254 C ${x + 22} 237 ${x + 25} 218 ${x + 34} 205`} strokeWidth="4" />
              <ellipse cx={x - 27} cy="220" rx="22" ry="9" fill="#91ba65" transform={`rotate(28 ${x - 27} 220)`} />
              <ellipse cx={x + 31} cy="201" rx="23" ry="9" fill="#60a36a" transform={`rotate(-31 ${x + 31} 201)`} />
              <ellipse cx={x - 9} cy="173" rx="23" ry="10" fill="#acc76c" transform={`rotate(-21 ${x - 9} 173)`} />
            </g>
          ))}
        </g>
      )}
      {biome === 'forest' && (
        <g fill="#294a3b">
          {[18, 106, 192, 704, 794, 866].map((x, index) => (
            <g key={x} transform={`translate(${x} ${index % 2 ? 18 : 0})`}>
              <path d="M 0 333 L 31 270 L 62 333 Z M 5 305 L 31 244 L 57 305 Z M 12 278 L 31 221 L 50 278 Z" />
              <rect x="27" y="324" width="8" height="19" fill="#654d3e" />
            </g>
          ))}
        </g>
      )}
      {biome === 'tundra' && (
        <g>
          <path d="M 0 302 L 101 188 L 172 255 L 286 136 L 414 285 L 542 164 L 665 279 L 790 152 L 900 273 L 900 345 L 0 345 Z" fill="#9fb7cd" />
          <path d="M 62 231 L 101 188 L 132 218 L 106 207 L 95 219 L 84 210 Z M 244 180 L 286 136 L 324 181 L 293 163 L 280 175 L 269 164 Z M 505 200 L 542 164 L 578 198 L 548 185 L 537 196 L 525 185 Z M 750 193 L 790 152 L 831 197 L 798 178 L 785 190 L 774 179 Z" fill="#edf1ee" />
        </g>
      )}
      {biome === 'coast' && (
        <g>
          <path d="M 0 248 C 118 226 227 277 355 250 S 597 225 718 258 S 835 269 900 243 L 900 365 L 0 365 Z" fill="#286d81" />
          <path d="M 0 267 C 118 245 227 296 355 269 S 597 244 718 277 S 835 288 900 262 M 0 301 C 118 279 227 330 355 303 S 597 278 718 311 S 835 322 900 296" fill="none" stroke="#bce0d4" strokeWidth="3" opacity=".72" />
          <path d="M 0 324 C 152 307 265 344 403 325 S 665 314 900 329 V 440 H 0 Z" fill="#c6a575" opacity=".85" />
        </g>
      )}
      {biome === 'desert' && (
        <g>
          <path d="M 0 290 C 122 222 243 251 350 291 S 556 344 681 276 S 829 245 900 282 L 900 363 L 0 363 Z" fill="#d89a59" />
          <path d="M 0 320 C 162 275 263 309 394 340 S 663 361 900 312" fill="none" stroke="#f2c477" strokeWidth="4" opacity=".7" />
          {[95, 770].map((x) => (
            <g key={x} stroke="#46604a" strokeWidth="9" strokeLinecap="round">
              <path d={`M ${x} 324 V 257 M ${x} 288 C ${x - 23} 290 ${x - 23} 276 ${x - 23} 267 M ${x} 301 C ${x + 24} 302 ${x + 24} 289 ${x + 24} 280`} />
            </g>
          ))}
        </g>
      )}
      {biome === 'alpine' && (
        <g>
          <path d="M 0 302 L 97 202 L 174 278 L 319 119 L 478 297 L 605 172 L 751 298 L 836 211 L 900 270 L 900 348 L 0 348 Z" fill="#63889b" />
          <path d="M 67 233 L 97 202 L 129 234 L 102 221 L 94 231 L 84 222 Z M 269 175 L 319 119 L 372 178 L 325 153 L 313 168 L 301 154 Z M 569 208 L 605 172 L 642 209 L 612 193 L 600 205 L 590 194 Z" fill="#eff3e7" />
          <path d="M 325 156 C 334 207 315 240 328 289" fill="none" stroke="#c7e4dc" strokeWidth="5" opacity=".82" />
        </g>
      )}
      {biome === 'meadow' && (
        <g>
          <path d="M 0 287 C 126 245 234 295 363 269 S 614 245 738 278 S 850 291 900 265 L 900 357 L 0 357 Z" fill="#84975e" />
          <path d="M 741 273 V 186 M 718 204 H 764 M 741 186 L 719 204 L 741 222 L 763 204 Z" fill="none" stroke="#5b5948" strokeWidth="5" />
          {[60, 170, 265, 660, 812, 865].map((x, index) => (
            <g key={x} transform={`translate(${x} ${300 + (index % 2) * 22})`}>
              <path d="M 0 34 V 0" stroke="#d7df93" strokeWidth="2" />
              <circle cy="-4" r="6" fill={index % 2 ? '#f5c2b0' : '#f4df8d'} />
              <circle cx="-7" cy="-4" r="4" fill="#f4df8d" />
              <circle cx="7" cy="-4" r="4" fill="#f4df8d" />
              <circle cy="-11" r="4" fill="#f4df8d" />
              <circle cy="3" r="4" fill="#f4df8d" />
            </g>
          ))}
        </g>
      )}
    </>
  )
}

function Tapestry({ rows, priceChanges, memberName }) {
  const categories = [...rows].sort((a, b) => b.spend - a.spend)
  const essentials = categories.filter((category) => !ACCENTS.has(category.category))
  const accents = categories.filter((category) => ACCENTS.has(category.category))
  const profile = landscapeProfile(categories, priceChanges, memberName)
  const { colors, biome } = profile
  const movement = Math.min(1, profile.largestPriceRise / 30)
  const inflationWave = 12 + movement * 38
  const spendMax = Math.max(...categories.map((category) => category.spend), 1)
  const { base: terrainBase, relief: terrainRelief } = TERRAIN_SHAPES[biome]
  const accentBaseY = profile.celestial === 'moon' ? 153 : 178
  const terrainPoints = essentials.map((category, index) => ({
    category,
    x: essentials.length === 1 ? 450 : 108 + index * (684 / (essentials.length - 1)),
    y: terrainBase - (category.spend / spendMax) * terrainRelief,
  }))
  const terrainCurvePoints = [{ x: 0, y: terrainBase }, ...terrainPoints, { x: 900, y: terrainBase }]
  const terrainLine = smoothPath(terrainCurvePoints)
  const terrainArea = terrainLine
    ? `${terrainLine} L 900 440 L 0 440 Z`
    : `M 0 ${terrainBase} L 900 ${terrainBase} L 900 440 L 0 440 Z`
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.category ?? null)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const activeCategory = hoveredCategory ?? selectedCategory
  const activeRow = categories.find((category) => category.category === activeCategory)
  const activeTrends = priceChanges.filter((change) => change.category === activeCategory)

  return (
    <>
      <section className="tapestry-card" style={{ '--landscape-ground': colors.ground }}>
        <div className="tapestry-copy">
          <div className="tapestry-kicker"><span className="live-dot" /> {memberName ? `${memberName.toUpperCase()}'S ${profile.name.toUpperCase()}` : `${profile.name.toUpperCase()} · ${profile.mood.toUpperCase()}`}</div>
          <h2>{profile.heading}</h2>
          <p className="landscape-caption">{profile.caption}</p>
          <p className="landscape-hint">Hover, tap or focus a marker to explore its category.</p>
          <div className="landscape-key" aria-label="Landscape visual key">
            <span><i className="key-ground" /> Essentials</span>
            <span><i className="key-accent" /> Treats &amp; drinks</span>
            <span><i className="key-wave" /> Price trend</span>
            <span className="height-key">Higher ground = more essentials spend</span>
          </div>
          <div className="tapestry-legend" role="group" aria-label="Spending categories">
            {categories.map((category, index) => {
              const color = categoryColor(category.category, index)
              return (
                <button
                  type="button"
                  className="legend-item category-legend-item"
                  key={category.category}
                  style={{ '--category-color': color }}
                  aria-pressed={selectedCategory === category.category}
                  onMouseEnter={() => setHoveredCategory(category.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => setHoveredCategory(category.category)}
                  onBlur={() => setHoveredCategory(null)}
                  onClick={() => setSelectedCategory((current) => current === category.category ? null : category.category)}
                >
                  <i />
                  {categoryLabel(category.category)}
                </button>
              )
            })}
          </div>
        </div>
        <div className="tapestry-art">
          <svg viewBox="0 0 900 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="landscape-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.sky} />
              <stop offset=".38" stopColor={colors.mid} />
              <stop offset=".7" stopColor={colors.horizon} />
              <stop offset=".9" stopColor={colors.horizon} />
              <stop offset="1" stopColor={colors.near} />
            </linearGradient>
            <linearGradient id="inflation-wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={colors.far} />
              <stop offset=".58" stopColor={colors.horizon} />
              <stop offset="1" stopColor={colors.near} />
            </linearGradient>
            <radialGradient id="sunset-sun" cx=".35" cy=".28" r=".8">
              <stop offset="0" stopColor="#fffbe0" />
              <stop offset=".7" stopColor={colors.sun} />
              <stop offset="1" stopColor={colors.horizon} />
            </radialGradient>
            <clipPath id="landscape-ground">
              <path d={terrainArea} />
            </clipPath>
            <filter id="landscape-soft"><feGaussianBlur stdDeviation="18" /></filter>
          </defs>
          <rect width="900" height="440" fill="url(#landscape-sky)" />
          <BiomeScenery profile={profile} movement={movement} />
          <path d={terrainArea} fill={colors.ground} />
          <path d={terrainLine || `M 0 ${terrainBase} L 900 ${terrainBase}`} fill="none" stroke={colors.horizon} strokeWidth="2" opacity=".86" />
          <path d={profile.foregroundPath} fill={colors.deep} opacity=".9" />

          {biome === 'forest' && (
            <g clipPath="url(#landscape-ground)" opacity=".42">
              {terrainPoints.map(({ category, x, y }, index) => (
                <path key={category.category} d={`M ${x} ${y + 3} C ${x - 8} 342 ${x + 7} 390 ${x} 440`} fill="none" stroke={categoryColor(category.category, index)} strokeWidth={4 + category.spend / spendMax * 7} />
              ))}
            </g>
          )}
          {biome === 'city' && <path d="M 0 383 H 900 M 0 405 H 900 M 120 365 V 440 M 360 365 V 440 M 610 365 V 440" stroke="#f6c577" strokeWidth="3" strokeDasharray="12 16" opacity=".6" />}
          {biome === 'night_market' && <path d="M 0 379 H 900 M 0 409 H 900" stroke="#ee7ab6" strokeWidth="3" strokeDasharray="18 10" opacity=".7" />}
          {biome === 'tundra' && <path d="M 92 370 L 145 393 L 183 378 L 245 408 M 553 366 L 592 388 L 640 374 L 688 402" fill="none" stroke="#e4f0ed" strokeWidth="3" opacity=".8" />}
          {biome === 'desert' && <path d="M 0 365 C 160 338 266 371 397 388 S 656 404 900 359 M 0 398 C 161 371 267 404 398 421 S 657 437 900 392" fill="none" stroke="#f2c477" strokeWidth="3" opacity=".7" />}
          {biome === 'coast' && <path d="M 0 383 C 126 365 253 401 380 383 S 636 365 900 389 M 0 412 C 126 394 253 430 380 412 S 636 394 900 418" fill="none" stroke="#bce0d4" strokeWidth="3" opacity=".7" />}
          {biome === 'wetlands' && [95, 250, 652, 823].map((x) => (
            <g key={x} stroke="#8cae72" strokeWidth="3" strokeLinecap="round">
              <path d={`M ${x} 405 V 357 M ${x + 9} 408 V 367 M ${x - 8} 407 V 375`} />
              <ellipse cx={x + 25} cy="400" rx="14" ry="5" fill="#84a987" />
            </g>
          ))}
          {biome === 'jungle' && <path d="M 0 369 C 56 333 89 381 137 350 S 221 376 263 350 M 635 362 C 687 331 716 383 766 352 S 851 381 900 346" fill="none" stroke="#81ab5e" strokeWidth="8" strokeLinecap="round" opacity=".75" />}
          {biome === 'alpine' && <path d="M 433 343 C 447 371 426 394 442 440 M 450 346 C 462 374 444 399 459 440" fill="none" stroke="#d5eee5" strokeWidth="4" opacity=".86" />}
          {biome === 'meadow' && [86, 190, 310, 579, 756, 845].map((x, index) => (
            <g key={x} transform={`translate(${x} ${385 + index % 2 * 18})`}>
              <path d="M 0 14 V -8" stroke="#cadb89" strokeWidth="2" />
              <circle cy="-11" r="5" fill={index % 2 ? '#f5b5aa' : '#f2d879'} />
            </g>
          ))}

          {(biome === 'city' || biome === 'night_market') ? (
            <path d={`M 0 263 H 155 V ${251 - inflationWave} H 279 V 264 H 425 V ${250 - inflationWave} H 585 V 266 H 730 V ${252 - inflationWave} H 900`}
              fill="none" stroke="url(#inflation-wave)" strokeWidth={3 + movement * 5} opacity=".75" />
          ) : biome === 'tundra' ? (
            <path d={`M 0 267 L 151 ${257 - inflationWave} L 253 ${269 + inflationWave} L 399 ${248 - inflationWave} L 566 ${266 + inflationWave} L 741 ${250 - inflationWave} L 900 263`}
              fill="none" stroke="url(#inflation-wave)" strokeWidth={3 + movement * 5} opacity=".8" />
          ) : biome === 'desert' ? (
            <path d={`M 0 255 C 160 ${239 - inflationWave}, 270 ${269 + inflationWave}, 428 252 S 686 ${238 - inflationWave}, 900 259`}
              fill="none" stroke="url(#inflation-wave)" strokeWidth={3 + movement * 5} opacity=".78" />
          ) : (
            <path d={`M 0 258 C 130 ${258 - inflationWave}, 224 ${265 + inflationWave}, 360 253 S 612 ${249 - inflationWave}, 740 261 S 838 ${271 + inflationWave}, 900 249`}
              fill="none" stroke="url(#inflation-wave)" strokeWidth={3 + movement * 5} opacity=".75" />
          )}

          {priceChanges.slice(0, 7).map((change, index) => {
            const x = 94 + index * 112
            const y = 238 + Math.sin(index * 1.7) * inflationWave * 0.45
            return <circle key={change.product} cx={x} cy={y} r={3 + movement * 3} fill={movement > 0.35 ? '#dd8358' : '#6d9ea1'} opacity=".8" />
          })}

          {accents.map((category, index) => {
            const x = accents.length === 1 ? 450 : 180 + index * (540 / (accents.length - 1))
            const spendRatio = category.spend / spendMax
            const isAlcohol = category.category === 'alcohol'
            const y = isAlcohol ? terrainBase - 4 : accentBaseY - spendRatio * 48
            const radius = 8 + spendRatio * 11
            const color = categoryColor(category.category, index)
            const starX = x + (index % 2 === 0 ? radius + 17 : -radius - 17)
            const starY = y - radius - 7
            return (
              <g key={category.category}>
                {isAlcohol ? (
                  <g>
                    <path d={`M ${x - 54} ${terrainBase - 2} C ${x - 33} ${terrainBase - 27} ${x - 18} ${terrainBase - 10} ${x} ${terrainBase - 23} S ${x + 30} ${terrainBase - 30} ${x + 52} ${terrainBase - 3}`} fill="none" stroke="#647c46" strokeWidth="4" />
                    <path d={`M ${x - 36} ${terrainBase - 16} C ${x - 52} ${terrainBase - 35} ${x - 57} ${terrainBase - 19} ${x - 36} ${terrainBase - 16} M ${x + 36} ${terrainBase - 18} C ${x + 54} ${terrainBase - 36} ${x + 59} ${terrainBase - 18} ${x + 36} ${terrainBase - 18}`} fill="#9bb96b" />
                    {[-1, 0, 1].map((grape) => (
                      <circle key={grape} cx={x + 31 + grape * 7} cy={terrainBase - 14 + Math.abs(grape) * 7} r="5" fill="#70445f" stroke="#d7bb8e" strokeWidth="1" />
                    ))}
                  </g>
                ) : (
                  <>
                    <path d={`M ${x} ${y + radius} Q ${x - 20} ${y + 61} ${x + (index % 2 ? 34 : -28)} ${y + 95}`} fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 7" opacity=".7" />
                    {['city', 'night_market'].includes(biome) ? (
                      <g fill={color} opacity=".82">
                        <rect x={x - 24} y={y - radius - 24} width="10" height="22" rx="2" />
                        <rect x={x - 8} y={y - radius - 32} width="12" height="30" rx="2" />
                        <rect x={x + 10} y={y - radius - 18} width="13" height="16" rx="2" />
                      </g>
                    ) : ['jungle', 'forest', 'meadow'].includes(biome) ? (
                      <g fill={color} opacity=".82">
                        <path d={`M ${x - 4} ${y + 2} C ${x - 33} ${y - 23} ${x - 31} ${y - 40} ${x - 7} ${y - 31} C ${x + 2} ${y - 28} ${x + 1} ${y - 13} ${x - 4} ${y + 2} Z`} />
                        <path d={`M ${x + 3} ${y} C ${x + 30} ${y - 30} ${x + 37} ${y - 13} ${x + 21} ${y - 4} C ${x + 13} ${y + 1} ${x + 7} ${y + 1} ${x + 3} ${y} Z`} />
                      </g>
                    ) : ['tundra', 'alpine'].includes(biome) ? (
                      <path d={`M ${x} ${y - 31} V ${y - 13} M ${x - 16} ${y - 22} H ${x + 16} M ${x - 11} ${y - 33} L ${x + 11} ${y - 11} M ${x + 11} ${y - 33} L ${x - 11} ${y - 11}`} stroke={color} strokeWidth="4" strokeLinecap="round" />
                    ) : ['coast', 'wetlands'].includes(biome) ? (
                      <g fill="none" stroke={color} strokeWidth="3" opacity=".86">
                        <path d={`M ${x - 31} ${y - 12} Q ${x - 16} ${y - 22} ${x} ${y - 12} T ${x + 31} ${y - 12}`} />
                        <path d={`M ${x - 22} ${y - 3} Q ${x - 11} ${y - 11} ${x} ${y - 3} T ${x + 22} ${y - 3}`} />
                      </g>
                    ) : (
                      <g fill="none" stroke={color} strokeWidth="4" strokeLinecap="round">
                        <path d={`M ${x} ${y - 31} V ${y - 7} M ${x} ${y - 22} C ${x - 15} ${y - 24} ${x - 16} ${y - 31} ${x - 16} ${y - 37} M ${x} ${y - 17} C ${x + 15} ${y - 18} ${x + 16} ${y - 25} ${x + 16} ${y - 31}`} />
                      </g>
                    )}
                    <circle cx={x} cy={y} r={radius + 5} fill="#ffd58d" opacity=".3" />
                    <circle cx={x} cy={y} r={radius} fill={color} stroke="#fff7e7" strokeWidth="3" />
                    {biome === 'city' || biome === 'night_market' ? (
                      <path d={`M ${starX} ${starY - 6} L ${starX + 2} ${starY - 2} L ${starX + 6} ${starY} L ${starX + 2} ${starY + 2} L ${starX} ${starY + 6} L ${starX - 2} ${starY + 2} L ${starX - 6} ${starY} L ${starX - 2} ${starY - 2} Z`} fill="#fff1b8" />
                    ) : null}
                  </>
                )}
              </g>
            )
          })}
          </svg>
          <div className="landscape-hotspots" role="group" aria-label="Select a category marker on the spending landscape">
            {categories.map((category, index) => {
              const isAccent = ACCENTS.has(category.category)
              const isAlcohol = category.category === 'alcohol'
              const accentIndex = accents.findIndex((item) => item.category === category.category)
              const terrainPoint = terrainPoints.find((point) => point.category.category === category.category)
              const accentX = accents.length === 1 ? 450 : 180 + accentIndex * (540 / (accents.length - 1))
              const accentY = isAlcohol ? terrainBase - 4 : accentBaseY - (category.spend / spendMax) * 48
              const left = (isAccent ? accentX : terrainPoint?.x ?? 450) / 900 * 100
              const top = (isAccent ? accentY : terrainPoint?.y ?? terrainBase) / 440 * 100
              const color = categoryColor(category.category, index)
              return (
                <button
                  type="button"
                  key={category.category}
                  className={`landscape-hotspot${activeCategory === category.category ? ' selected' : ''}${isAlcohol ? ' alcohol' : isAccent ? ' accent' : ' essential'}`}
                  style={{ left: `${left}%`, top: `${top}%`, '--category-color': color }}
                  aria-label={`${categoryLabel(category.category)}, £${category.spend.toFixed(2)} spent`}
                  aria-pressed={selectedCategory === category.category}
                  onMouseEnter={() => setHoveredCategory(category.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => setHoveredCategory(category.category)}
                  onBlur={() => setHoveredCategory(null)}
                  onClick={() => setSelectedCategory((current) => current === category.category ? null : category.category)}
                >
                  {isAlcohol
                    ? <span className="hotspot-marker alcohol-marker" aria-hidden="true" />
                    : <span className="hotspot-marker" aria-hidden="true">{index + 1}</span>}
                  <span className="hotspot-label">{categoryLabel(category.category)}</span>
                </button>
              )
            })}
          </div>
          <span className="art-note">{profile.name.toUpperCase()} <span>·</span> {profile.mood.toUpperCase()}</span>
        </div>
      </section>
      {activeRow && (
        <section className="category-detail" aria-live="polite">
          <div className="category-summary">
            <span className="category-detail-swatch" style={{ '--category-color': categoryColor(activeRow.category, categories.indexOf(activeRow)), backgroundColor: categoryColor(activeRow.category, categories.indexOf(activeRow)) }} />
            <div>
              <p className="eyebrow">LANDSCAPE MARKER {categories.indexOf(activeRow) + 1}</p>
              <h3>{categoryLabel(activeRow.category)}</h3>
            </div>
            <div className="category-total">
              <strong>£{activeRow.spend.toFixed(2)}</strong>
              <span>tracked spend</span>
            </div>
          </div>
          <div className="category-trends">
            <p className="eyebrow">PRICE TRENDS IN THIS CATEGORY</p>
            {activeTrends.length > 0 ? (
              <ul>
                {activeTrends.slice(0, 3).map((trend) => {
                  const change = trend.unit_price_change_pct ?? trend.price_change_pct
                  return (
                    <li key={trend.product}>
                      <span><b>{trend.product}</b><small>{trend.first_date} → {trend.last_date}</small></span>
                      <span className={change > 0 ? 'neg' : change < 0 ? 'pos' : ''}>
                        {change > 0 ? '+' : ''}{change ?? '—'}{change == null ? '' : '%'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="no-category-trend">No repeat-item price trend in this category yet. Scan another receipt to reveal how its prices move.</p>
            )}
          </div>
        </section>
      )}
    </>
  )
}

export default function Insights({ household }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [scope, setScope] = useState('overall')
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  useEffect(() => {
    setData(null)
    setError('')
    setSelectedMemberId(null)
    api.insights(household.id).then(setData).catch((e) => setError(e.message))
  }, [household.id])
  if (error) return <p className="error card">{error}</p>
  if (!data) return <p className="muted card">Gathering your household's latest picture…</p>

  const shrunk = data.price_changes.filter((c) => c.shrinkflation)
  const housemates = data.housemates ?? []
  const selectedMember = housemates.find((member) => member.member_id === selectedMemberId) ?? housemates[0]
  return (
    <div>
      <div className="insight-scope" role="group" aria-label="Choose landscape insights">
        <button
          type="button"
          className={scope === 'overall' ? 'scope-option active' : 'scope-option'}
          aria-pressed={scope === 'overall'}
          onClick={() => setScope('overall')}
        >Overall</button>
        <button
          type="button"
          className={scope === 'housemates' ? 'scope-option active' : 'scope-option'}
          aria-pressed={scope === 'housemates'}
          onClick={() => setScope('housemates')}
        >Housemates</button>
      </div>
      {scope === 'overall' ? (
        <>
          <Tapestry rows={data.spend_by_category} priceChanges={data.price_changes} />
          <div className="insight-intro">
            <div>
              <p className="eyebrow">THE STORY IN YOUR RECEIPTS</p>
              <h2>Small details, bigger picture.</h2>
            </div>
            <p>Patterns to help your household spend with a little more intention.</p>
          </div>
          {shrunk.map((c) => (
            <section key={c.product} className="card alert shrink-alert">
              <span className="alert-icon">↗</span>
              <div>
                <h2>Shrinkflation spotted</h2>
                <p><b>{c.product}</b> still costs £{c.last_price.toFixed(2)}, but you now get less:
                  the price per {c.unit_basis} is up <b>{c.unit_price_change_pct}%</b> since {c.first_date}.</p>
              </div>
            </section>
          ))}
          <section className="card chart-card">
            <div className="section-title"><div><p className="eyebrow">WHERE IT GOES</p><h2>Spend by category</h2></div><span className="section-mark">01</span></div>
            <Bars rows={data.spend_by_category} label="category" value="spend" />
          </section>
          <section className="card chart-card">
            <div className="section-title"><div><p className="eyebrow">THE RHYTHM</p><h2>Spend by week</h2></div><span className="section-mark">02</span></div>
            <Bars rows={data.spend_by_week} label="week" value="spend" />
          </section>
          <section className="card chart-card">
            <div className="section-title"><div><p className="eyebrow">THE LITTLE SHIFTS</p><h2>Price changes</h2></div><span className="section-mark">03</span></div>
            <table>
              <thead><tr><th>Product</th><th>Then</th><th>Now</th><th>Per-unit change</th></tr></thead>
              <tbody>
                {data.price_changes.slice(0, 10).map((c) => (
                  <tr key={c.product}>
                    <td>{c.product}</td>
                    <td>£{c.first_price.toFixed(2)}</td>
                    <td>£{c.last_price.toFixed(2)}</td>
                    <td className={(c.unit_price_change_pct ?? c.price_change_pct) > 0 ? 'neg' : 'pos'}>
                      {(c.unit_price_change_pct ?? c.price_change_pct) > 0 ? '+' : ''}{c.unit_price_change_pct ?? c.price_change_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <>
          <div className="housemate-landscapes">
            <div className="housemate-picker" role="group" aria-label="Choose a housemate landscape">
              {housemates.map((member) => (
                <button
                  type="button"
                  key={member.member_id}
                  className={`housemate-option${selectedMember?.member_id === member.member_id ? ' active' : ''}`}
                  aria-pressed={selectedMember?.member_id === member.member_id}
                  onClick={() => setSelectedMemberId(member.member_id)}
                >
                  <span className="housemate-avatar" aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}</span>
                  {member.name}
                </button>
              ))}
            </div>
            <p className="housemate-sharing-note">Individual amounts use each person's share of confirmed receipt items.</p>
          </div>
          {selectedMember ? (
            selectedMember.spend_by_category.length > 0 ? (
              <>
                <Tapestry
                  key={selectedMember.member_id}
                  rows={selectedMember.spend_by_category}
                  priceChanges={selectedMember.price_changes}
                  memberName={selectedMember.name}
                />
                <div className="insight-intro">
                  <div>
                    <p className="eyebrow">THE STORY IN {selectedMember.name.toUpperCase()}'S RECEIPTS</p>
                    <h2>Small details, bigger picture.</h2>
                  </div>
                  <p>Patterns from the receipt items assigned to {selectedMember.name}.</p>
                </div>
                {selectedMember.price_changes.filter((change) => change.shrinkflation).map((change) => (
                  <section key={change.product} className="card alert shrink-alert">
                    <span className="alert-icon">↗</span>
                    <div>
                      <h2>Shrinkflation spotted</h2>
                      <p><b>{change.product}</b> still costs £{change.last_price.toFixed(2)}, but you now get less:
                        the price per {change.unit_basis} is up <b>{change.unit_price_change_pct}%</b> since {change.first_date}.</p>
                    </div>
                  </section>
                ))}
                <section className="card chart-card">
                  <div className="section-title"><div><p className="eyebrow">WHERE IT GOES</p><h2>Spend by category</h2></div><span className="section-mark">01</span></div>
                  <Bars rows={selectedMember.spend_by_category} label="category" value="spend" />
                </section>
                <section className="card chart-card">
                  <div className="section-title"><div><p className="eyebrow">THE RHYTHM</p><h2>Spend by week</h2></div><span className="section-mark">02</span></div>
                  {selectedMember.spend_by_week.length > 0
                    ? <Bars rows={selectedMember.spend_by_week} label="week" value="spend" />
                    : <p className="muted">No dated receipt items assigned yet.</p>}
                </section>
                <section className="card chart-card">
                  <div className="section-title"><div><p className="eyebrow">THE LITTLE SHIFTS</p><h2>Price changes</h2></div><span className="section-mark">03</span></div>
                  {selectedMember.price_changes.length > 0 ? (
                    <table>
                      <thead><tr><th>Product</th><th>Then</th><th>Now</th><th>Per-unit change</th></tr></thead>
                      <tbody>
                        {selectedMember.price_changes.slice(0, 10).map((change) => (
                          <tr key={change.product}>
                            <td>{change.product}</td>
                            <td>£{change.first_price.toFixed(2)}</td>
                            <td>£{change.last_price.toFixed(2)}</td>
                            <td className={(change.unit_price_change_pct ?? change.price_change_pct) > 0 ? 'neg' : 'pos'}>
                              {(change.unit_price_change_pct ?? change.price_change_pct) > 0 ? '+' : ''}{change.unit_price_change_pct ?? change.price_change_pct}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="muted">Repeat items will appear here as more receipts are confirmed.</p>}
                </section>
              </>
            ) : (
              <section className="individual-empty card">
                <span className="housemate-avatar large" aria-hidden="true">{selectedMember.name.trim().charAt(0).toUpperCase()}</span>
                <div>
                  <p className="eyebrow">HOUSEMATE LANDSCAPE</p>
                  <h2>{selectedMember.name}'s landscape is taking shape.</h2>
                  <p>There are no confirmed receipt items assigned to {selectedMember.name} yet. Confirm a receipt split that includes them to grow this view.</p>
                </div>
              </section>
            )
          ) : (
            <section className="individual-empty card">
              <div>
                <p className="eyebrow">HOUSEMATE LANDSCAPES</p>
                <h2>No housemates to show yet.</h2>
                <p>Add housemates to this household to see their individual landscapes here.</p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
