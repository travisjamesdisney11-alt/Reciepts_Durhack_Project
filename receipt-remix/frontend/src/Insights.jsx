import { useEffect, useState } from 'react'
import { api } from './api.js'
import NearbyPrices from './NearbyPrices.jsx'
import LocalPriceFinder from './LocalPriceFinder.jsx'

const CATEGORY_COLOR_SLOTS = {
  produce: 0,
  dairy_eggs: 1,
  meat_fish: 2,
  bakery: 3,
  frozen: 4,
  cupboard: 5,
  household_cleaning: 0,
  laundry: 1,
  toiletries_personal_care: 2,
  baby_care: 3,
  feminine_care: 4,
  health_medicine: 5,
  pet: 0,
  drinks: 3,
  alcohol: 4,
  snacks_treats: 1,
  ready_meals: 2,
}
const BIOME_CATEGORY_PALETTES = {
  city: ['#f5b5c8', '#f3c08e', '#e58db6', '#9e9bd7', '#f7d38a', '#d58eb0'],
  night_market: ['#ff5cae', '#53e1c0', '#ffd166', '#9e83ff', '#ff805b', '#89e9f4'],
  jungle: ['#b2df52', '#ff9954', '#4ed1a9', '#f6d54d', '#9074f2', '#ff6f8e'],
  forest: ['#87cf68', '#e9b54e', '#51bc91', '#f1d267', '#d17b68', '#b69adf'],
  tundra: ['#73d8e6', '#ffd06b', '#f184a2', '#6baff0', '#a893f2', '#fff0bd'],
  coast: ['#36d3c8', '#ffbc62', '#ff7186', '#4d9fe8', '#b17de3', '#f0d95b'],
  wetlands: ['#69d59c', '#48d5d4', '#ffd06d', '#d77da9', '#a0d96e', '#7da9ed'],
  desert: ['#ff9148', '#f5c34a', '#ec6f61', '#9ec04e', '#c179d0', '#ffdc85'],
  alpine: ['#53c7d2', '#e8bf66', '#ff8177', '#76a4ed', '#ae8edf', '#d6e987'],
  meadow: ['#ef86b3', '#ffce67', '#8bd276', '#72c7df', '#a58bdd', '#f3a074'],
  fairground: ['#ff83b7', '#ffd567', '#9fe5dd', '#a887e8', '#ff9a72', '#f5a7d6'],
}
const CATEGORY_BIOMES = {
  bakery: 'meadow',
  drinks: 'night_market',
  alcohol: 'night_market',
  produce: 'desert',
  dairy_eggs: 'tundra',
  frozen: 'tundra',
  ready_meals: 'city',
  snacks_treats: 'fairground',
  meat_fish: 'alpine',
  cupboard: 'desert',
  household_cleaning: 'forest',
  laundry: 'forest',
  toiletries_personal_care: 'forest',
  baby_care: 'forest',
  feminine_care: 'forest',
  health_medicine: 'forest',
  pet: 'forest',
}
const LANDSCAPE_PROFILES = {
  city: {
    name: 'Cosy Supper City',
    mood: 'soft-evening',
    celestial: 'sun',
    headings: ['The supper district is winding down softly.', 'Ready meals, city lights, and no rush home.', 'A little evening comfort, delivered by the skyline.'],
    captions: ['Ready meals brought the city to golden hour and saved you a cosy seat.', 'A soft pink skyline, something warm for dinner, and absolutely no rush.', 'The evening district is glowing gently; even the streetlights sound cosy.'],
    colors: { sky: '#443450', mid: '#9e617f', horizon: '#f0a99f', far: '#b87891', near: '#94627f', ground: '#654a64', deep: '#352b45', sun: '#ffe0a6', glow: '#f5acc3' },
  },
  night_market: {
    name: 'Midnight Drinks District',
    mood: 'neon-and-chaotic',
    celestial: 'moon',
    headings: ['The drinks district has definitely missed its curfew.', 'A skyline with one more round in it.', 'The night is young; the receipts are louder.'],
    captions: ['Drinks took over downtown, switched on every sign, and lost the volume knob.', 'The skyline is buzzing. The drinks aisle has become a nightlife district.', 'A moonlit city, a lively drinks run, and absolutely no quiet streets tonight.'],
    colors: { sky: '#101b46', mid: '#302b79', horizon: '#ae397e', far: '#442b8b', near: '#51276d', ground: '#30215f', deep: '#171739', sun: '#fff0a8', glow: '#ff5ead' },
  },
  jungle: {
    name: 'Canopy Jungle',
    mood: 'fresh-and-feral',
    celestial: 'sun',
    headings: ['The produce aisle went full canopy.', 'Leaf it to the greens to steal the show.', 'Your salad era has a whole ecosystem.'],
    captions: ['Produce is doing the heavy lifting. Somewhere, a leaf just got promoted.', 'Fresh finds are growing wild; the fruit bowl is feeling famous.', 'The greens have formed a tiny committee and elected a very ripe leader.'],
    colors: { sky: '#155c58', mid: '#329b72', horizon: '#d2cf53', far: '#147854', near: '#286345', ground: '#244e3e', deep: '#14362e', sun: '#fff067', glow: '#b1ec6c' },
  },
  forest: {
    name: 'Pine-Needle Forest',
    mood: 'rooted-and-ready',
    celestial: 'sun',
    headings: ['A quiet little essentials empire.', 'The budget packed a flask and a sensible list.', 'Sturdy roots. Suspiciously good planning.'],
    captions: ['Calm categories, sturdy roots. A spreadsheet would call this “well behaved.”', 'Household essentials are holding the line without making a fuss.', 'Your spending brought reusable bags and remembered where they are.'],
    colors: { sky: '#244d3b', mid: '#5f8c46', horizon: '#d8a842', far: '#38633e', near: '#315544', ground: '#2c503b', deep: '#163628', sun: '#ffe684', glow: '#f7bd4f' },
  },
  tundra: {
    name: 'Dairy Taiga',
    mood: 'cold-and-cosy',
    celestial: 'moon',
    headings: ['The dairy aisle has built itself an igloo.', 'Fresh milk, frosted pines, and a quiet horizon.', 'Your dairy spend has gone full taiga.'],
    captions: ['Dairy is leading the expedition; the milk has packed a tiny scarf.', 'The receipt is crisp, the pines are frosted, and the butter is thriving.', 'A peaceful taiga of dairy, snow-soft hills, and one very cosy igloo.'],
    frozenHeadings: ['The freezer aisle has claimed the horizon.', 'Your frozen-food era looks positively glacial.', 'Cold storage, cooler landscape.'],
    frozenCaptions: ['Frozen favourites are the headliners; the forecast is one-degree-chiller.', 'The freezer aisle has expanded into a full expedition.', 'Your peas are thriving. The penguins have started a fan club.'],
    colors: { sky: '#183d78', mid: '#3b6fb3', horizon: '#65c9d0', far: '#91dce3', near: '#72bad6', ground: '#79bdce', deep: '#4d8da9', sun: '#ffe8ad', glow: '#9ce4f0' },
  },
  coast: {
    name: 'Tidepool Coast',
    mood: 'mixed-bag',
    celestial: 'moon',
    headings: ['Your spending refuses to be typecast.', 'A little of this, a little of that, lovely tide.', 'The budget is taking the scenic route.'],
    captions: ['A little bit of everything, with a gentle chance of biscuits. Bring snacks, just in case.', 'No single category stole the spotlight; the tide brought a bit of everything.', 'Your spending has range. Even the seagulls are curious.'],
    colors: { sky: '#0c638c', mid: '#35abb0', horizon: '#ffd072', far: '#258cac', near: '#167e9e', ground: '#d29a55', deep: '#315b77', sun: '#ffe09a', glow: '#6de0d0' },
  },
  wetlands: {
    name: 'Moonlit Wetlands',
    mood: 'hydration-station',
    celestial: 'moon',
    headings: ['The refreshment district is glowing.', 'Your drinks have formed a water feature.', 'Tonight’s forecast: a 100% chance of one more sip.'],
    captions: ['The drinks shelf is doing laps around a very scenic marsh.', 'Hydration has become a whole landscape. Even the frogs approve.', 'The beverage budget is making waves, quite literally.'],
    colors: { sky: '#173951', mid: '#1c7371', horizon: '#8bc769', far: '#247f6a', near: '#176354', ground: '#28684d', deep: '#17453e', sun: '#ffe5a0', glow: '#74e6bd' },
  },
  desert: {
    name: 'Produce Pyramid Valley',
    mood: 'sun-grown',
    celestial: 'sun',
    headings: ['The produce has built a pyramid in the sun.', 'Fresh greens, warm dunes, and a very ripe oasis.', 'The fruit bowl has become a desert landmark.'],
    captions: ['Produce is growing between the dunes; a cactus has requested a salad.', 'The pyramids are glowing, the plants are thriving, and the mango is important.', 'Your greens went desert expedition. Hydration breaks are strongly advised.'],
    colors: { sky: '#b63846', mid: '#ed6844', horizon: '#ffd166', far: '#d95d46', near: '#b9473d', ground: '#d77a38', deep: '#76402d', sun: '#fff0a2', glow: '#ff9950' },
  },
  alpine: {
    name: 'Alpine Pantry',
    mood: 'hearty',
    celestial: 'sun',
    headings: ['A hearty shop has climbed new heights.', 'Dairy and dinner: the summit team.', 'This basket is built for the long hike.'],
    captions: ['Hearty staples are reaching peak performance. Pack snacks for the ascent.', 'The mountain was made of milk, cheese, and excellent meal plans.', 'Your receipt has summited the dairy range without breaking a sweat.'],
    colors: { sky: '#176ca1', mid: '#57abb4', horizon: '#ffd18b', far: '#4f94a9', near: '#39758b', ground: '#557f70', deep: '#264d61', sun: '#fff1bd', glow: '#92dfe2' },
  },
  meadow: {
    name: 'Bakery Cottage Meadow',
    mood: 'peaceful-and-risen',
    celestial: 'sun',
    headings: ['The bakery village has opened its cottage shutters.', 'A peaceful loaf-shaped corner of the countryside.', 'Fresh bakes are in full bloom.'],
    captions: ['Bakery spending is rising; the cottage windows smell faintly of sourdough.', 'A fresh loaf became the village celebrity. Crumbs are invited to tea.', 'The meadow is proof that good things take thyme to rise.'],
    colors: { sky: '#5868a7', mid: '#a35b96', horizon: '#ffa95d', far: '#7a9561', near: '#60804d', ground: '#728b45', deep: '#3c573b', sun: '#fff08c', glow: '#ffa56e' },
  },
  fairground: {
    name: 'Candyland Fairground',
    mood: 'sweet-and-spinning',
    celestial: 'sun',
    headings: ['The snack aisle has opened a tiny circus.', 'Step right up to the candy-coloured skyline.', 'Your treats have booked the big top.'],
    captions: ['Snacks and sweets took over the fairground; the popcorn is in charge.', 'A little candy-coloured chaos, with complimentary carousel music.', 'The sweets have opened a circus and the gummy bears are headlining.'],
    colors: { sky: '#54376f', mid: '#a95b96', horizon: '#f58aa1', far: '#c7699c', near: '#a45183', ground: '#794776', deep: '#39284f', sun: '#ffe080', glow: '#ff9fcf' },
  },
}
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
  fairground: { base: 326, relief: 72 },
}
const NIGHT_STARS = [
  { x: 77, y: 58 }, { x: 152, y: 118 }, { x: 254, y: 52 }, { x: 367, y: 105 },
  { x: 489, y: 61 }, { x: 752, y: 49 }, { x: 833, y: 126 }, { x: 875, y: 68 },
]
const BIOME_LANDMARKS = {
  city: ['building', 'building', 'cottage'],
  night_market: ['building', 'building', 'cottage'],
  jungle: ['tree', 'tree', 'cottage'],
  forest: ['tree', 'tree', 'cottage'],
  tundra: ['mountain', 'mountain', 'igloo'],
  coast: ['lighthouse', 'cottage', 'tree'],
  wetlands: ['tree', 'cottage', 'lighthouse'],
  desert: ['pyramid', 'pyramid', 'cottage'],
  alpine: ['mountain', 'mountain', 'cottage'],
  meadow: ['cottage', 'tree', 'cottage'],
  fairground: ['tent', 'ferris_wheel'],
}

function categoryLabel(category) {
  return String(category).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function biomeForCategory(category) {
  return CATEGORY_BIOMES[category] ?? 'coast'
}

function colorChannels(color) {
  return [1, 3, 5].map((start) => Number.parseInt(color.slice(start, start + 2), 16))
}

function colorHex(channels) {
  return `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

function averageThemeColor(categories, selectColor, fallback) {
  const totalWeight = categories.reduce((total, category) => total + Math.max(0, category.spend), 0)
  if (!totalWeight) return fallback
  const channels = [0, 0, 0]
  for (const category of categories) {
    const weight = Math.max(0, category.spend) / totalWeight
    const selected = colorChannels(selectColor(category))
    selected.forEach((channel, index) => { channels[index] += channel * weight })
  }
  return colorHex(channels)
}

function blendTheme(categories, biome, totalSpend) {
  const profile = LANDSCAPE_PROFILES[biome]
  const secondary = categories.slice(1).filter((category) => category.spend > 0)
  const secondarySpend = secondary.reduce((total, category) => total + category.spend, 0)
  const blendWeight = totalSpend ? Math.min(0.28, (secondarySpend / totalSpend) * 0.4) : 0
  if (!blendWeight) {
    return {
      colors: profile.colors,
      categoryPalette: BIOME_CATEGORY_PALETTES[biome],
      blendWeight,
    }
  }

  const colors = Object.fromEntries(Object.keys(profile.colors).map((key) => {
    const secondaryColor = averageThemeColor(
      secondary,
      (category) => LANDSCAPE_PROFILES[biomeForCategory(category.category)].colors[key],
      profile.colors[key],
    )
    const base = colorChannels(profile.colors[key])
    const other = colorChannels(secondaryColor)
    return [key, colorHex(base.map((channel, index) => channel * (1 - blendWeight) + other[index] * blendWeight))]
  }))
  const categoryPalette = BIOME_CATEGORY_PALETTES[biome].map((baseColor, index) => {
    const secondaryColor = averageThemeColor(
      secondary,
      (category) => BIOME_CATEGORY_PALETTES[biomeForCategory(category.category)][index],
      baseColor,
    )
    const base = colorChannels(baseColor)
    const other = colorChannels(secondaryColor)
    return colorHex(base.map((channel, channelIndex) =>
      channel * (1 - blendWeight) + other[channelIndex] * blendWeight
    ))
  })

  return { colors, categoryPalette, blendWeight }
}

function categoryColor(category, index, profile) {
  const palette = profile.categoryPalette ?? BIOME_CATEGORY_PALETTES[profile.biome]
  const slot = CATEGORY_COLOR_SLOTS[category] ?? index
  return palette[(slot + profile.paletteOffset) % palette.length]
}

function hashText(value) {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededValue(seed, salt) {
  const value = Math.sin(seed * 0.00001 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function landmarkType(category, biome, variation) {
  if (category === 'produce' && biome === 'desert') return 'pyramid'
  if (category === 'dairy_eggs' && biome === 'tundra') return 'igloo'
  if (category === 'snacks_treats' && biome === 'fairground') {
    return BIOME_LANDMARKS.fairground[Math.floor(variation * BIOME_LANDMARKS.fairground.length)]
  }
  if (category === 'alcohol') {
    if (['city', 'night_market'].includes(biome)) return 'building'
    return 'vineyard'
  }
  if (category === 'frozen' && biome === 'tundra') return 'igloo'
  if (category === 'drinks' && ['coast', 'wetlands'].includes(biome)) return 'lighthouse'
  if (category === 'produce' && ['forest', 'jungle'].includes(biome)) return 'tree'
  const options = BIOME_LANDMARKS[biome] ?? ['cottage']
  return options[Math.floor(variation * options.length)]
}

function landscapeProfile(categories, priceChanges, memberName, memberId) {
  const totalSpend = categories.reduce((total, category) => total + Math.max(0, category.spend), 0)
  const largestPriceRise = Math.max(0, ...priceChanges.map((item) =>
    item.unit_price_change_pct ?? item.price_change_pct ?? 0
  ))
  const biome = biomeForCategory(categories[0]?.category)
  const profile = LANDSCAPE_PROFILES[biome]
  const frozenFocus = categories[0]?.category === 'frozen'
  const headings = frozenFocus ? profile.frozenHeadings ?? profile.headings : profile.headings
  const captions = frozenFocus ? profile.frozenCaptions ?? profile.captions : profile.captions
  const spendSignature = [...categories]
    .sort((left, right) => left.category.localeCompare(right.category))
    .map((category) => `${category.category}:${category.spend.toFixed(2)}`)
    .join('|')
  const trendSignature = priceChanges
    .map((change) => `${change.category}:${change.product}:${change.unit_price_change_pct ?? change.price_change_pct ?? 0}`)
    .sort()
    .join('|')
  const identity = memberId ?? memberName ?? 'household'
  const sceneSeed = hashText(`${identity}|${spendSignature}|${trendSignature}`)
  const blended = blendTheme(categories, biome, totalSpend)
  const variant = sceneSeed % captions.length
  return {
    ...profile,
    ...blended,
    biome,
    sceneSeed,
    paletteOffset: sceneSeed % blended.categoryPalette.length,
    largestPriceRise,
    mood: frozenFocus ? 'freezer-favorite' : profile.mood,
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

function BiomeScenery({ profile, spendScale }) {
  const { biome, colors, celestial } = profile
  const radius = 30 + spendScale * 22
  const celestialX = 525 + seededValue(profile.sceneSeed, 3) * 250
  const celestialY = 96 + seededValue(profile.sceneSeed, 4) * 78
  const horizon = 224 + seededValue(profile.sceneSeed, 6) * 24
  const mountainBiomes = ['coast', 'wetlands', 'tundra', 'alpine'].includes(biome)
  const waterBiomes = ['coast', 'wetlands', 'tundra', 'alpine'].includes(biome)
  const mountainProfile = [
    [0, 84], [0.1, 46], [0.19, -24], [0.29, 30], [0.4, -74], [0.51, 16],
    [0.63, -118], [0.73, 22], [0.84, -53], [0.91, 18], [1, 76],
  ]
  const mountainPoints = (offset, scale) => mountainProfile.map(([position, peak], index) => ({
    x: position === 0 || position === 1
      ? position * 900
      : position * 900 + (seededValue(profile.sceneSeed, index + offset + 81) - 0.5) * 18,
    y: horizon + offset + peak * scale * (0.9 + seededValue(profile.sceneSeed, index + offset + 91) * 0.2),
  }))
  const mountainRange = (points) => `M ${points.map(({ x, y }) => `${x} ${y}`).join(' L ')} L 900 360 L 0 360 Z`
  const distantMountains = mountainPoints(-4, 0.72)
  const nearMountains = mountainPoints(24, 0.55)
  const skyline = Array.from({ length: 13 }, (_, index) => ({
    x: index * 73 + seededValue(profile.sceneSeed, index + 141) * 18,
    width: 30 + seededValue(profile.sceneSeed, index + 151) * 27,
    height: 45 + seededValue(profile.sceneSeed, index + 161) * 85,
  }))

  return (
    <>
      <ellipse
        cx={celestialX}
        cy={horizon - 22}
        rx="310"
        ry="102"
        fill={colors.glow}
        opacity=".13"
        filter="url(#landscape-soft)"
      />
      <g fill="none" stroke="#fff8e9" strokeLinecap="round" opacity=".2">
        <path d={`M ${70 + seededValue(profile.sceneSeed, 171) * 90} 122 Q 142 108 214 121 T 350 116`} strokeWidth="3" />
        <path d={`M ${570 + seededValue(profile.sceneSeed, 172) * 80} 151 Q 660 138 738 150 T 864 143`} strokeWidth="2" />
        <path d={`M ${300 + seededValue(profile.sceneSeed, 173) * 70} 184 Q 372 176 443 183`} strokeWidth="1.5" />
      </g>
      {celestial === 'sun' ? (
        <g>
          <circle cx={celestialX} cy={celestialY} r={radius + 28} fill={colors.glow} opacity=".3" filter="url(#landscape-soft)" />
          <circle cx={celestialX} cy={celestialY} r={radius} fill="url(#sunset-sun)" />
          <path d={`M ${celestialX - radius + 7} ${celestialY + 2} H ${celestialX + radius - 7}`} stroke={colors.near} strokeWidth="3" opacity=".4" />
        </g>
      ) : (
        <g>
          {NIGHT_STARS.map((star, index) => {
            const x = Math.max(12, Math.min(888, star.x + (seededValue(profile.sceneSeed, index + 10) - 0.5) * 80))
            const y = Math.max(18, star.y + (seededValue(profile.sceneSeed, index + 20) - 0.5) * 44)
            return (
              <path key={`${star.x}-${star.y}`} d={`M ${x} ${y - 4} L ${x + 1.5} ${y - 1.5} L ${x + 4} ${y} L ${x + 1.5} ${y + 1.5} L ${x} ${y + 4} L ${x - 1.5} ${y + 1.5} L ${x - 4} ${y} L ${x - 1.5} ${y - 1.5} Z`} fill="#fff3cd" opacity=".9" />
            )
          })}
          <circle cx={celestialX} cy={celestialY} r={radius + 20} fill={colors.glow} opacity=".26" filter="url(#landscape-soft)" />
          <path d={`M ${celestialX} ${celestialY - radius} A ${radius} ${radius} 0 1 0 ${celestialX} ${celestialY + radius} A ${radius * 0.72} ${radius} 0 0 1 ${celestialX} ${celestialY - radius} Z`} fill="#fff3cd" />
        </g>
      )}
      {Array.from({ length: 7 }, (_, index) => (
        <circle
          key={`glimmer-${index}`}
          cx={24 + seededValue(profile.sceneSeed, index + 31) * 852}
          cy={35 + seededValue(profile.sceneSeed, index + 43) * 190}
          r={1.5 + seededValue(profile.sceneSeed, index + 59) * 2.2}
          fill={colors.glow}
          opacity=".62"
        />
      ))}
      {mountainBiomes && (
        <g>
          <path d={mountainRange(distantMountains)} fill="url(#landscape-distant)" opacity=".78" />
          <path d={mountainRange(nearMountains)} fill="url(#landscape-midground)" opacity=".84" />
          {['tundra', 'alpine'].includes(biome) && (
            <g fill="#f3fbff" opacity=".88">
              {[2, 4, 6, 8].map((peakIndex) => {
                const peak = nearMountains[peakIndex]
                const width = peakIndex === 6 ? 21 : 15
                return (
                  <path
                    key={`snowcap-${peakIndex}`}
                    d={`M ${peak.x - width} ${peak.y + 20} L ${peak.x} ${peak.y} L ${peak.x + width} ${peak.y + 20} L ${peak.x + 7} ${peak.y + 13} L ${peak.x} ${peak.y + 20} L ${peak.x - 6} ${peak.y + 12} Z`}
                  />
                )
              })}
            </g>
          )}
        </g>
      )}
      {waterBiomes && (
        <g>
          <path d={`M 0 ${horizon + 72} Q 166 ${horizon + 58} 330 ${horizon + 75} T 660 ${horizon + 68} T 900 ${horizon + 78} L 900 366 L 0 366 Z`} fill="url(#landscape-water)" opacity=".74" />
          {[0, 1, 2, 3, 4].map((index) => {
            const x = 70 + seededValue(profile.sceneSeed, index + 181) * 720
            const y = horizon + 91 + index * 17
            const width = 32 + seededValue(profile.sceneSeed, index + 191) * 76
            return <path key={`waterline-${index}`} d={`M ${x} ${y} q ${width / 2} -4 ${width} 0`} stroke="#e8fff3" strokeWidth="2" opacity=".3" />
          })}
        </g>
      )}
      {['city', 'night_market'].includes(biome) && (
        <g>
          {skyline.map((building, index) => (
            <g key={`skyline-${index}`} opacity={index % 2 ? '.52' : '.68'}>
              <rect x={building.x} y={horizon + 32 - building.height} width={building.width} height={building.height + 70} rx="2" fill="url(#landscape-distant)" />
              {[0, 1, 2].map((row) => (
                <path
                  key={row}
                  d={`M ${building.x + 7} ${horizon + 15 - building.height + row * 17} h 5 m 7 0 h 5`}
                  stroke={colors.glow}
                  strokeWidth="2"
                  opacity=".75"
                />
              ))}
            </g>
          ))}
        </g>
      )}
      {['forest', 'jungle', 'meadow', 'tundra'].includes(biome) && (
        <g>
          <path d={`M 0 ${horizon + 82} Q 172 ${horizon + 18} 352 ${horizon + 77} T 700 ${horizon + 56} T 900 ${horizon + 76} L 900 365 L 0 365 Z`} fill="url(#landscape-distant)" opacity=".58" />
          {Array.from({ length: 12 }, (_, index) => {
            const x = index * 86 + seededValue(profile.sceneSeed, index + 201) * 34
            const y = horizon + 52 + seededValue(profile.sceneSeed, index + 211) * 28
            const size = 17 + seededValue(profile.sceneSeed, index + 221) * 19
            return biome === 'meadow' ? (
              <circle key={`distant-growth-${index}`} cx={x} cy={y} r={size * 0.18} fill={colors.glow} opacity=".62" />
            ) : (
              <path
                key={`distant-growth-${index}`}
                d={`M ${x} ${y - size} L ${x - size * 0.55} ${y + size * 0.4} H ${x + size * 0.55} Z`}
                fill={index % 2 ? colors.far : colors.near}
                opacity=".62"
              />
            )
          })}
        </g>
      )}
      {biome === 'desert' && (
        <g fill="none" strokeLinecap="round">
          <path d={`M 0 ${horizon + 76} Q 165 ${horizon + 5} 328 ${horizon + 76} T 650 ${horizon + 51} T 900 ${horizon + 76}`} stroke={colors.far} strokeWidth="42" opacity=".48" />
          <path d={`M 0 ${horizon + 98} Q 186 ${horizon + 43} 366 ${horizon + 98} T 704 ${horizon + 82} T 900 ${horizon + 98}`} stroke={colors.near} strokeWidth="36" opacity=".62" />
        </g>
      )}
      {biome === 'fairground' && (
        <g>
          <path d="M 28 177 Q 260 219 470 177 T 872 177" fill="none" stroke={colors.deep} strokeWidth="2" opacity=".65" />
          {Array.from({ length: 11 }, (_, index) => {
            const x = 58 + index * 78
            const y = 181 + Math.sin(index / 10 * Math.PI) * 13
            const buntingColor = [colors.glow, colors.sun, colors.far][index % 3]
            return (
              <path
                key={`fairground-flag-${index}`}
                d={`M ${x - 9} ${y} L ${x + 9} ${y + 2} L ${x} ${y + 17} Z`}
                fill={buntingColor}
                opacity=".84"
              />
            )
          })}
          <ellipse cx="450" cy="228" rx="360" ry="38" fill={colors.glow} opacity=".08" filter="url(#landscape-soft)" />
        </g>
      )}
      {biome === 'tundra' && (
        <g transform={`translate(0 ${(seededValue(profile.sceneSeed, 71) - 0.5) * 34})`} fill="none" stroke="#a4f0e2" strokeLinecap="round" opacity=".72">
          <path d="M 40 91 C 165 49 243 111 364 75 S 564 42 675 84" strokeWidth="6" />
          <path d="M 103 110 C 220 77 296 129 419 92 S 586 73 708 105" strokeWidth="2.5" />
        </g>
      )}
      {biome === 'night_market' && (
        <g transform={`translate(0 ${(seededValue(profile.sceneSeed, 73) - 0.5) * 22})`} stroke="#ffe5a7" strokeWidth="2" opacity=".78">
          <path d="M 0 72 Q 220 118 440 72 T 900 72" fill="none" />
          {[95, 245, 395, 545, 695, 845].map((x) => <circle key={x} cx={x} cy={76 + Math.abs(450 - x) * 0.1} r="4" fill="#ffc36d" />)}
        </g>
      )}
    </>
  )
}

function LandscapeLandmark({ landmark, selected }) {
  const { x, baseY, width, height, type, color, biome, colors } = landmark
  const outline = selected ? '#fff7e7' : 'none'
  const outlineWidth = selected ? 3 : 0
  const cottageWetlands = type === 'cottage' && biome === 'wetlands'
  const houseBottom = cottageWetlands ? -height * 0.12 : 0
  const houseTop = -height * 0.65

  return (
    <g transform={`translate(${x} ${baseY})`} stroke={outline} strokeWidth={outlineWidth} strokeLinejoin="round">
      {type === 'mountain' && (
        <>
          <path d={`M ${-width / 2} 0 L 0 ${-height} L ${width / 2} 0 Z`} fill={color} />
          {['tundra', 'alpine'].includes(biome) && (
            <path d={`M ${-width * 0.2} ${-height * 0.6} L 0 ${-height} L ${width * 0.18} ${-height * 0.62} L ${width * 0.04} ${-height * 0.68} L 0 ${-height * 0.56} L ${-width * 0.07} ${-height * 0.68} Z`} fill="#f3fbff" stroke="none" />
          )}
        </>
      )}
      {type === 'volcano' && (
        <>
          <path d={`M ${-width / 2} 0 L ${-width * 0.15} ${-height * 0.83} L ${-width * 0.04} ${-height * 0.7} L ${width * 0.04} ${-height * 0.7} L ${width * 0.17} ${-height * 0.84} L ${width / 2} 0 Z`} fill={color} />
          <path d={`M ${-width * 0.16} ${-height * 0.82} Q 0 ${-height * 0.65} ${width * 0.17} ${-height * 0.83} Q 0 ${-height * 0.91} ${-width * 0.16} ${-height * 0.82}`} fill={colors.sun} stroke="none" />
          <path d={`M 0 ${-height * 0.72} C ${-width * 0.08} ${-height * 0.42} ${width * 0.16} ${-height * 0.35} ${width * 0.14} 0`} fill="none" stroke={colors.glow} strokeWidth="3" />
        </>
      )}
      {type === 'igloo' && (
        <>
          <path d={`M ${-width / 2} 0 A ${width / 2} ${height} 0 0 1 ${width / 2} 0 Z`} fill={color} />
          <path d={`M ${-width * 0.23} 0 A ${width * 0.23} ${height * 0.48} 0 0 1 ${width * 0.23} 0 Z`} fill={colors.near} stroke="none" />
          <path d={`M ${-width * 0.35} ${-height * 0.33} Q 0 ${-height * 0.2} ${width * 0.35} ${-height * 0.33} M ${-width * 0.45} ${-height * 0.65} Q 0 ${-height * 0.5} ${width * 0.45} ${-height * 0.65}`} fill="none" stroke={colors.glow} strokeWidth="2" />
        </>
      )}
      {type === 'tree' && (
        <>
          <rect x={-width * 0.08} y={-height * 0.48} width={width * 0.16} height={height * 0.48} rx="3" fill={colors.deep} stroke="none" />
          {biome === 'forest' ? (
            <path d={`M 0 ${-height} L ${-width * 0.38} ${-height * 0.56} H ${-width * 0.2} L ${-width * 0.48} ${-height * 0.23} H ${width * 0.48} L ${width * 0.2} ${-height * 0.56} H ${width * 0.38} Z`} fill={color} />
          ) : (
            <>
              <circle cx="0" cy={-height * 0.69} r={width * 0.32} fill={color} />
              <circle cx={-width * 0.2} cy={-height * 0.54} r={width * 0.23} fill={color} />
              <circle cx={width * 0.2} cy={-height * 0.54} r={width * 0.23} fill={color} />
            </>
          )}
        </>
      )}
      {type === 'vineyard' && (
        <g fill="none" stroke={colors.near} strokeLinecap="round">
          {[0.25, 0.52, 0.79].map((fraction, index) => {
            const vineX = -width / 2 + width * fraction
            return (
              <g key={fraction}>
                <path d={`M ${vineX} 0 Q ${vineX - 5} ${-height * 0.55} ${vineX + (index % 2 ? -4 : 4)} ${-height}`} strokeWidth="3" />
                <path d={`M ${vineX - 6} ${-height * 0.55} q -9 -7 -12 0 q 7 8 12 0 M ${vineX + 5} ${-height * 0.76} q 9 -7 12 0 q -7 8 -12 0`} fill={colors.glow} stroke="none" />
                <circle cx={vineX + 4} cy={-height * 0.34} r="3" fill={color} stroke="none" />
                <circle cx={vineX + 9} cy={-height * 0.3} r="3" fill={color} stroke="none" />
              </g>
            )
          })}
          <path d={`M ${-width / 2} 0 Q 0 ${-height * 0.12} ${width / 2} 0`} strokeWidth="2" />
        </g>
      )}
      {type === 'lighthouse' && (
        <>
          <path d={`M ${-width * 0.22} 0 L ${-width * 0.13} ${-height * 0.8} H ${width * 0.13} L ${width * 0.22} 0 Z`} fill="#f4ead2" />
          <path d={`M ${-width * 0.15} ${-height * 0.53} H ${width * 0.16} M ${-width * 0.18} ${-height * 0.31} H ${width * 0.18}`} stroke={color} strokeWidth="5" />
          <path d={`M ${-width * 0.18} ${-height * 0.8} L 0 ${-height} L ${width * 0.18} ${-height * 0.8} Z`} fill={color} />
          <path d={`M 0 ${-height * 0.89} L ${-width * 0.55} ${-height * 0.98} M 0 ${-height * 0.89} L ${width * 0.55} ${-height * 0.98}`} stroke={colors.sun} strokeWidth="3" />
        </>
      )}
      {type === 'pyramid' && (
        <>
          <path d={`M ${-width / 2} 0 L 0 ${-height} L ${width / 2} 0 Z`} fill="url(#landscape-structure)" />
          <path d={`M 0 ${-height} L ${width * 0.14} 0 H ${width / 2} Z`} fill={colors.deep} opacity=".24" stroke="none" />
          <path d={`M ${-width * 0.24} ${-height * 0.3} H ${width * 0.24} M ${-width * 0.34} ${-height * 0.16} H ${width * 0.34}`} fill="none" stroke={colors.sun} strokeWidth="1.5" opacity=".7" />
        </>
      )}
      {type === 'tent' && (
        <>
          <path d={`M ${-width / 2} 0 L 0 ${-height} L ${width / 2} 0 Z`} fill="url(#landscape-structure)" />
          <path d={`M ${-width / 2} 0 L 0 ${-height} L 0 0 Z`} fill={color} opacity=".72" />
          <path d={`M 0 ${-height} L ${width * 0.14} 0 H ${width / 2} Z`} fill={colors.glow} opacity=".72" />
          <path d={`M ${-width / 2} 0 H ${width / 2}`} stroke={colors.deep} strokeWidth="2" />
          <path d={`M ${-width * 0.13} 0 Q 0 ${-height * 0.39} ${width * 0.13} 0 Z`} fill={colors.deep} opacity=".8" />
        </>
      )}
      {type === 'ferris_wheel' && (
        <>
          <path d={`M ${-width * 0.34} 0 L 0 ${-height * 0.57} L ${width * 0.34} 0 M 0 ${-height * 0.57} V 0`} fill="none" stroke={colors.deep} strokeWidth="3" />
          <circle cx="0" cy={-height * 0.6} r={Math.min(width * 0.36, height * 0.29)} fill="none" stroke={color} strokeWidth="3" />
          <circle cx="0" cy={-height * 0.6} r="3" fill={colors.sun} />
          {Array.from({ length: 7 }, (_, index) => {
            const angle = (index / 7) * Math.PI * 2 - Math.PI / 2
            const radius = Math.min(width * 0.36, height * 0.29)
            const gondolaX = Math.cos(angle) * radius
            const gondolaY = -height * 0.6 + Math.sin(angle) * radius
            return (
              <g key={`gondola-${index}`}>
                <path d={`M ${gondolaX} ${gondolaY} v 5`} stroke={colors.deep} strokeWidth="1.5" />
                <rect x={gondolaX - 3.5} y={gondolaY + 4} width="7" height="5" rx="1" fill={[color, colors.glow, colors.sun][index % 3]} />
              </g>
            )
          })}
        </>
      )}
      {(type === 'cottage' || type === 'building') && (
        <>
          {type === 'cottage' ? (
            <>
              <path d={`M ${-width * 0.46} ${houseBottom} V ${houseTop} L 0 ${-height * 0.98} L ${width * 0.46} ${houseTop} V ${houseBottom} Z`} fill="url(#landscape-structure)" stroke={colors.near} strokeWidth="1.2" />
              <path d={`M ${-width * 0.63} ${-height * 0.61} L 0 ${-height} L ${width * 0.63} ${-height * 0.61} L ${width * 0.48} ${-height * 0.54} H ${-width * 0.48} Z`} fill="url(#landscape-house-roof)" stroke={colors.deep} strokeWidth="1.4" />
              <path d={`M ${-width * 0.46} ${-height * 0.62} L 0 ${-height * 0.96} L ${width * 0.05} ${-height * 0.83} L ${-width * 0.31} ${-height * 0.59} Z`} fill={biome === 'tundra' ? '#f3fbff' : colors.glow} opacity={biome === 'tundra' ? '.82' : '.22'} />
              <path d={`M ${-width * 0.48} ${-height * 0.54} H ${width * 0.48}`} fill="none" stroke={color} strokeWidth="1.4" opacity=".55" />
              {cottageWetlands && <path d={`M ${-width * 0.34} ${houseBottom} V 0 M ${width * 0.34} ${houseBottom} V 0`} stroke={colors.deep} strokeWidth="3" />}
              <rect x={-width * 0.3} y={-height * 0.48} width={width * 0.15} height={height * 0.12} rx="1" fill={colors.sun} opacity=".7" />
              <rect x={width * 0.15} y={-height * 0.48} width={width * 0.15} height={height * 0.12} rx="1" fill={colors.sun} opacity=".7" />
              <rect x={-width * 0.07} y={-height * 0.32} width={width * 0.14} height={height * 0.32 + houseBottom} rx="2" fill={colors.deep} opacity=".8" />
              <rect x={width * 0.28} y={-height * 0.91} width={width * 0.09} height={height * 0.19} rx="1" fill="url(#landscape-house-roof)" opacity=".86" />
            </>
          ) : (
            <>
              <rect x={-width / 2} y={-height * 0.65} width={width} height={height * 0.65} rx="2" fill="url(#landscape-structure)" stroke={colors.near} strokeWidth="1.2" />
              <path d={`M ${-width * 0.55} ${-height * 0.64} H ${width * 0.55} L ${width * 0.4} ${-height * 0.76} H ${-width * 0.4} Z`} fill="url(#landscape-house-roof)" />
              {[-0.3, 0, 0.3].map((offset) => (
                <g key={offset}>
                  <rect x={width * offset - width * 0.06} y={-height * 0.52} width={width * 0.12} height={height * 0.12} rx="1" fill={colors.glow} opacity=".72" />
                  <rect x={width * offset - width * 0.06} y={-height * 0.31} width={width * 0.12} height={height * 0.12} rx="1" fill={colors.sun} opacity=".68" />
                </g>
              ))}
              <path d={`M ${-width * 0.5} ${-height * 0.07} H ${width * 0.5}`} fill="none" stroke={color} strokeWidth="1.4" opacity=".55" />
            </>
          )}
        </>
      )}
    </g>
  )
}

function ForegroundGrowth({ category, point, biome, color, colors, height }) {
  const { x, y } = point
  const scaleTransform = `translate(${x} ${y}) scale(2) translate(${-x} ${-y})`

  if (category === 'alcohol') {
    return (
      <g transform={scaleTransform} fill="none" strokeLinecap="round" opacity=".96">
        <path d={`M ${x - 24} ${y + 5} Q ${x - 12} ${y - 9} ${x} ${y + 3} T ${x + 24} ${y + 4}`} stroke={colors.glow} strokeWidth="3" />
        <path d={`M ${x - 13} ${y - 1} q -9 -8 -12 0 q 7 8 12 0 M ${x + 12} ${y} q 9 -8 12 0 q -7 8 -12 0`} fill={colors.sun} stroke="none" />
        <circle cx={x + 7} cy={y + 8} r="3" fill={color} stroke="none" />
        <circle cx={x + 12} cy={y + 10} r="3" fill={color} stroke="none" />
      </g>
    )
  }
  if (['city', 'night_market'].includes(biome)) {
    const poleTop = y - height
    const lampX = x + height * 0.24
    const lampColor = biome === 'night_market' ? colors.glow : colors.sun
    return (
      <g transform={scaleTransform}>
        <path d={`M ${x} ${y + 4} V ${poleTop + 8} Q ${x} ${poleTop} ${x + height * 0.16} ${poleTop} H ${lampX}`} fill="none" stroke={colors.deep} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${x - 5} ${y + 4} H ${x + 5}`} stroke={colors.deep} strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${lampX - 5} ${poleTop + 1} H ${lampX + 5} L ${lampX + 7} ${poleTop + 6} H ${lampX - 5} Z`} fill={lampColor} stroke={colors.deep} strokeWidth="1.3" strokeLinejoin="round" />
        <path d={`M ${lampX - 4} ${poleTop + 7} L ${lampX + 6} ${poleTop + 7} L ${lampX + 15} ${poleTop + 27} H ${lampX - 13} Z`} fill={lampColor} opacity=".16" />
        <path d={`M ${x + 1} ${poleTop + 12} V ${y - 5}`} stroke={colors.glow} strokeWidth="1" opacity=".7" />
      </g>
    )
  }
  if (biome === 'desert') {
    return (
      <g transform={scaleTransform}>
        <path d={`M ${x} ${y + 3} V ${y - height} M ${x} ${y - height * 0.45} C ${x - 11} ${y - height * 0.45} ${x - 10} ${y - height * 0.67} ${x - 10} ${y - height * 0.72} M ${x} ${y - height * 0.3} C ${x + 10} ${y - height * 0.3} ${x + 10} ${y - height * 0.52} ${x + 10} ${y - height * 0.56}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </g>
    )
  }
  if (['tundra', 'alpine'].includes(biome)) {
    return (
      <g transform={scaleTransform} fill={colors.glow} opacity=".95">
        <path d={`M ${x} ${y + 2} L ${x - 7} ${y - height * 0.46} L ${x} ${y - height} L ${x + 7} ${y - height * 0.46} Z`} />
        <path d={`M ${x + 12} ${y + 2} L ${x + 8} ${y - height * 0.3} L ${x + 12} ${y - height * 0.63} L ${x + 16} ${y - height * 0.3} Z`} opacity=".72" />
      </g>
    )
  }
  if (biome === 'fairground') {
    return (
      <g transform={scaleTransform} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${x} ${y + 4} Q ${x - 3} ${y - height * 0.38} ${x - 9} ${y - height * 0.68} M ${x} ${y + 4} Q ${x + 5} ${y - height * 0.36} ${x + 12} ${y - height * 0.58}`} fill="none" stroke={colors.near} strokeWidth="2.5" />
        <circle cx={x - 9} cy={y - height * 0.72} r={height * 0.19} fill={color} stroke={colors.deep} strokeWidth="1.5" />
        <circle cx={x + 12} cy={y - height * 0.62} r={height * 0.16} fill={colors.glow} stroke={colors.deep} strokeWidth="1.5" />
        <path d={`M ${x - 15} ${y - height * 0.72} q 6 -7 12 0 q -6 7 -12 0 M ${x + 7} ${y - height * 0.62} q 5 -6 10 0 q -5 6 -10 0`} fill="none" stroke={colors.sun} strokeWidth="1.6" />
      </g>
    )
  }
  if (['coast', 'wetlands'].includes(biome)) {
    return (
      <g transform={scaleTransform} fill="none" stroke={color} strokeLinecap="round">
        <path d={`M ${x} ${y + 3} Q ${x - 3} ${y - height * 0.5} ${x - 1} ${y - height}`} strokeWidth="2.5" />
        <path d={`M ${x + 6} ${y + 3} Q ${x + 8} ${y - height * 0.4} ${x + 10} ${y - height * 0.74}`} strokeWidth="2" />
        <path d={`M ${x - 14} ${y + 8} Q ${x - 7} ${y + 4} ${x} ${y + 8} T ${x + 14} ${y + 8}`} stroke={colors.glow} strokeWidth="2" />
      </g>
    )
  }
  if (biome === 'meadow') {
    return (
      <g transform={scaleTransform}>
        {[-9, 0, 9].map((offset, index) => (
          <g key={offset}>
            <path d={`M ${x + offset} ${y + 4} V ${y - height * (index === 1 ? 0.85 : 0.62)}`} stroke={colors.glow} strokeWidth="2" />
            <circle cx={x + offset} cy={y - height * (index === 1 ? 0.85 : 0.62)} r="3" fill={index % 2 ? colors.sun : color} />
          </g>
        ))}
      </g>
    )
  }
  return (
    <g transform={scaleTransform} fill={color} opacity=".95">
      <path d={`M ${x - 2} ${y + 5} C ${x - 22} ${y - height * 0.48} ${x - 20} ${y - height} ${x - 4} ${y - height * 0.78} C ${x + 2} ${y - height * 0.66} ${x + 1} ${y - height * 0.3} ${x - 2} ${y + 5} Z`} />
      <path d={`M ${x + 2} ${y + 5} C ${x + 20} ${y - height * 0.56} ${x + 27} ${y - height * 0.25} ${x + 14} ${y - height * 0.1} C ${x + 8} ${y + 1} ${x + 4} ${y + 4} ${x + 2} ${y + 5} Z`} />
    </g>
  )
}

function Tapestry({ rows, priceChanges, memberName, memberId }) {
  const categories = [...rows].sort((a, b) => b.spend - a.spend)
  const profile = landscapeProfile(categories, priceChanges, memberName, memberId)
  const { colors, biome } = profile
  const movement = Math.min(1, profile.largestPriceRise / 30)
  const spendScale = Math.min(1, Math.sqrt((categories[0]?.spend ?? 0) / 250))
  const seedFor = (salt) => seededValue(profile.sceneSeed, salt)
  const spendMax = Math.max(...categories.map((category) => category.spend), 1)
  const { base: terrainBase, relief: terrainRelief } = TERRAIN_SHAPES[biome]
  const foregroundCount = categories.length > 1 ? Math.max(1, Math.floor(categories.length / 2)) : categories.length
  const foregroundCategories = [...categories].reverse().slice(0, foregroundCount)
  const backgroundCategories = categories.length === 1
    ? categories
    : categories.slice(0, categories.length - foregroundCount)
  const terrainPoints = foregroundCategories.map((category, index) => ({
    category,
    x: (foregroundCategories.length === 1 ? 450 : 96 + index * (708 / (foregroundCategories.length - 1)))
      + (seedFor(index + 11) - 0.5) * 34,
    y: terrainBase - 12
      - Math.pow(category.spend / spendMax, 0.65) * terrainRelief * (0.62 + seedFor(index + 31) * 0.2)
      + (seedFor(index + 51) - 0.5) * 11,
  }))
  const terrainCurvePoints = [{ x: 0, y: terrainBase + 10 }, ...terrainPoints, { x: 900, y: terrainBase + 10 }]
  const terrainLine = smoothPath(terrainCurvePoints)
  const terrainArea = terrainLine
    ? `${terrainLine} L 900 440 L 0 440 Z`
    : `M 0 ${terrainBase} L 900 ${terrainBase} L 900 440 L 0 440 Z`
  const contourLine = smoothPath(terrainCurvePoints.map((point) => ({ ...point, y: point.y + 13 })))
  const backgroundLandmarks = backgroundCategories.map((category, index) => {
    const ratio = Math.sqrt(category.spend / spendMax)
    const personalScale = 0.9 + seedFor(index + 71) * 0.2
    const itemBiome = biomeForCategory(category.category)
    const type = landmarkType(category.category, itemBiome, seedFor(index + 111))
    const structureScale = type === 'cottage' ? 0.9 : type === 'building' ? 0.92 : 1
    const height = (42 + ratio * 92) * personalScale * structureScale
    const baseX = backgroundCategories.length === 1 ? 450 : 112 + index * (676 / (backgroundCategories.length - 1))
    return {
      category,
      x: Math.max(70, Math.min(830, baseX + (seedFor(index + 91) - 0.5) * 38)),
      baseY: terrainBase + 20,
      width: (38 + ratio * 48) * personalScale * structureScale,
      height,
      type,
      color: categoryColor(category.category, categories.indexOf(category), profile),
      biome: itemBiome,
      colors,
    }
  })
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
            <span><i className="key-ground" /> Foreground categories</span>
            <span><i className="key-landmark" /> Background landmarks</span>
            <span><i className="key-wave" /> Price trend contour</span>
            <span className="height-key">Smaller spends shape the ground; larger spends build the skyline.</span>
          </div>
          <div className="tapestry-legend" role="group" aria-label="Spending categories">
            {categories.map((category, index) => {
              const color = categoryColor(category.category, index, profile)
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
          <svg viewBox="0 0 900 440" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="landscape-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.sky} />
              <stop offset=".24" stopColor={colors.mid} />
              <stop offset=".48" stopColor={colors.far} />
              <stop offset=".7" stopColor={colors.horizon} />
              <stop offset=".86" stopColor={colors.near} />
              <stop offset="1" stopColor={colors.ground} />
            </linearGradient>
            <linearGradient id="landscape-distant" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.far} />
              <stop offset="1" stopColor={colors.near} />
            </linearGradient>
            <linearGradient id="landscape-midground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.near} />
              <stop offset="1" stopColor={colors.ground} />
            </linearGradient>
            <linearGradient id="landscape-structure" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={colors.far} />
              <stop offset=".58" stopColor={colors.near} />
              <stop offset="1" stopColor={colors.ground} />
            </linearGradient>
            <linearGradient id="landscape-house-roof" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={colors.deep} />
              <stop offset=".62" stopColor={colors.near} />
              <stop offset="1" stopColor={colors.deep} />
            </linearGradient>
            <linearGradient id="landscape-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.glow} />
              <stop offset=".24" stopColor={colors.horizon} />
              <stop offset=".63" stopColor={colors.mid} />
              <stop offset="1" stopColor={colors.deep} />
            </linearGradient>
            <linearGradient id="landscape-foreground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.horizon} />
              <stop offset=".28" stopColor={colors.ground} />
              <stop offset="1" stopColor={colors.deep} />
            </linearGradient>
            <radialGradient id="sunset-sun" cx=".35" cy=".28" r=".8">
              <stop offset="0" stopColor="#fffbe0" />
              <stop offset=".7" stopColor={colors.sun} />
              <stop offset="1" stopColor={colors.horizon} />
            </radialGradient>
            <filter id="landscape-soft"><feGaussianBlur stdDeviation="18" /></filter>
          </defs>
          <rect width="900" height="440" fill="url(#landscape-sky)" />
          <BiomeScenery profile={profile} spendScale={spendScale} />
          {backgroundLandmarks.map((landmark) => (
            <LandscapeLandmark
              key={landmark.category.category}
              landmark={landmark}
              selected={activeCategory === landmark.category.category}
            />
          ))}
          <path d={terrainArea} fill="url(#landscape-foreground)" />
          <path d={terrainLine || `M 0 ${terrainBase} L 900 ${terrainBase}`} fill="none" stroke={colors.horizon} strokeWidth="2" opacity=".9" />
          {priceChanges.length > 0 && (
            <>
              <path d={contourLine} fill="none" stroke={colors.deep} strokeWidth={7 + movement * 2} strokeDasharray="2 7" strokeLinecap="round" opacity=".68" />
              <path d={contourLine} fill="none" stroke={movement > 0.35 ? colors.sun : colors.glow} strokeWidth={3.5 + movement * 2.5} strokeDasharray="2 7" strokeLinecap="round" />
            </>
          )}
          {biome === 'city' && <path d="M 0 388 H 900 M 140 370 V 440 M 390 370 V 440 M 650 370 V 440" stroke={colors.sun} strokeWidth="3" strokeDasharray="9 12" opacity=".68" />}
          {biome === 'night_market' && <path d="M 0 389 H 900 M 0 414 H 900" stroke={colors.glow} strokeWidth="3" strokeDasharray="12 9" opacity=".72" />}
          {biome === 'tundra' && <path d="M 92 376 L 145 394 L 183 382 L 245 410 M 553 375 L 592 391 L 640 379 L 688 404" fill="none" stroke={colors.glow} strokeWidth="3" opacity=".65" />}
          {biome === 'desert' && <path d="M 0 380 C 160 354 266 382 397 398 S 656 412 900 374 M 0 410 C 161 384 267 412 398 426 S 657 438 900 404" fill="none" stroke={colors.sun} strokeWidth="3" opacity=".55" />}
          {['coast', 'wetlands'].includes(biome) && <path d="M 0 388 C 126 371 253 405 380 388 S 636 371 900 394 M 0 414 C 126 397 253 431 380 414 S 636 397 900 420" fill="none" stroke={colors.glow} strokeWidth="3" opacity=".55" />}
          {terrainPoints.map((point, index) => (
            <ForegroundGrowth
              key={point.category.category}
              category={point.category.category}
              point={point}
              biome={biomeForCategory(point.category.category)}
              color={categoryColor(point.category.category, categories.indexOf(point.category), profile)}
              colors={colors}
              height={11 + Math.sqrt(point.category.spend / spendMax) * 12 + seedFor(index + 131) * 3}
            />
          ))}
          </svg>
          <div className="landscape-hotspots" role="group" aria-label="Select a category marker on the spending landscape">
            {categories.map((category, index) => {
              const landmark = backgroundLandmarks.find((item) => item.category.category === category.category)
              const terrainPoint = terrainPoints.find((point) => point.category.category === category.category)
              const x = landmark?.x ?? terrainPoint?.x ?? 450
              const y = landmark ? landmark.baseY - landmark.height / 2 : terrainPoint?.y ?? terrainBase
              const color = categoryColor(category.category, index, profile)
              const landmarkHitbox = landmark
                ? { width: `${landmark.width / 900 * 100}%`, height: `${landmark.height / 440 * 100}%` }
                : {}
              return (
                <button
                  type="button"
                  key={category.category}
                  className={`landscape-hotspot ${landmark ? 'landmark' : 'foreground'}${activeCategory === category.category ? ' selected' : ''}`}
                  style={{ left: `${x / 900 * 100}%`, top: `${y / 440 * 100}%`, '--category-color': color, ...landmarkHitbox }}
                  data-biome={biome}
                  aria-label={`${categoryLabel(category.category)}, £${category.spend.toFixed(2)} spent`}
                  aria-pressed={selectedCategory === category.category}
                  onMouseEnter={() => setHoveredCategory(category.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => setHoveredCategory(category.category)}
                  onBlur={() => setHoveredCategory(null)}
                  onClick={() => setSelectedCategory((current) => current === category.category ? null : category.category)}
                >
                  {!landmark && <span className="hotspot-marker" aria-hidden="true" />}
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
            <span className="category-detail-swatch" style={{ '--category-color': categoryColor(activeRow.category, categories.indexOf(activeRow), profile), backgroundColor: categoryColor(activeRow.category, categories.indexOf(activeRow), profile) }} />
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
          <LocalPriceFinder householdId={household.id} />
          <NearbyPrices householdId={household.id} />
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
                  memberId={selectedMember.member_id}
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
