'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { memoryYears, type MemoryYear } from '@/data/memories'

const DESKTOP_CANVAS = { width: 2000, height: 900 }
const MOBILE_CANVAS = { width: 1080, height: 980 }

type Point = { x: number; y: number }
type YearLayout = {
  life: Point
}

const YEAR_LAYOUT_DESKTOP: Record<number, YearLayout> = {
  2017: { life: { x: 0.03, y: 0.5 } },
  2018: { life: { x: 0.13, y: 0.47 } },
  2019: { life: { x: 0.24, y: 0.49 } },
  2020: { life: { x: 0.34, y: 0.51 } },
  2021: { life: { x: 0.45, y: 0.5 } },
  2022: { life: { x: 0.55, y: 0.48 } },
  2023: { life: { x: 0.66, y: 0.5 } },
  2024: { life: { x: 0.76, y: 0.52 } },
  2025: { life: { x: 0.87, y: 0.5 } },
  2026: { life: { x: 0.97, y: 0.49 } },
}

const YEAR_LAYOUT_MOBILE: Record<number, YearLayout> = {
  2017: { life: { x: 0.03, y: 0.5 } },
  2018: { life: { x: 0.13, y: 0.47 } },
  2019: { life: { x: 0.24, y: 0.49 } },
  2020: { life: { x: 0.34, y: 0.52 } },
  2021: { life: { x: 0.45, y: 0.5 } },
  2022: { life: { x: 0.56, y: 0.47 } },
  2023: { life: { x: 0.67, y: 0.5 } },
  2024: { life: { x: 0.77, y: 0.53 } },
  2025: { life: { x: 0.88, y: 0.5 } },
  2026: { life: { x: 0.97, y: 0.49 } },
}

const LEAF_GEOMETRY = {
  branchDx: 0.10,
  branchDy: 0.195,
  attachTs: [0.20, 0.50, 0.70, 0.90],
  twigAngleOffsets: [-0.68, 0.18, -0.42, 0.26],
  twigLengths: [0.038, 0.033, 0.029, 0.025],
  twigLateralOffsets: [0, 0, 0, 0]
}

const DEFAULT_BRANCH_MONTHS = [2, 4, 8, 11]

function getMonthFromDate(date: string): number {
  const parts = date.split('-')
  return Number(parts[1] ?? '1')
}

function monthShort(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleString('en-US', { month: 'short' })
}

function buildThreadPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cx = (prev.x + curr.x) / 2
    d += ` Q ${cx} ${prev.y} ${curr.x} ${curr.y}`
  }
  return d
}

function buildSmoothCurvePath(
  start: Point,
  end: Point,
  bendSign: number,
  strength = 0.12
): string {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const offset = len * strength * bendSign
  const c1: Point = {
    x: start.x + dx * 0.34 + nx * offset,
    y: start.y + dy * 0.34 + ny * offset,
  }
  const c2: Point = {
    x: start.x + dx * 0.72 + nx * offset * 0.55,
    y: start.y + dy * 0.72 + ny * offset * 0.55,
  }
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`
}

function toCanvasPoint(p: Point, width: number, height: number): Point {
  return { x: p.x * width, y: p.y * height }
}

function chipWidth(text: string, type: 'year' | 'month'): number {
  const base = type === 'year' ? 56 : 30
  return base + text.length * (type === 'year' ? 8 : 6)
}

function getDisplayMonths(events: MemoryYear['events']): number[] {
  const uniqueMonths = Array.from(new Set(events.map(event => getMonthFromDate(event.date)))).sort((a, b) => a - b)
  const picked = uniqueMonths.slice(0, 4)

  for (const m of DEFAULT_BRANCH_MONTHS) {
    if (picked.length >= 4) break
    if (!picked.includes(m)) picked.push(m)
  }

  return picked.slice(0, 4).sort((a, b) => a - b)
}

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<MemoryYear | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const years = useMemo(() => [...memoryYears].sort((a, b) => a.year - b.year), [])
  const buildNodes = useCallback(
    (layoutMap: Record<number, YearLayout>, width: number, height: number) =>
      years.map((year, yearIndex) => {
        const layout = layoutMap[year.year]
        const lifePoint = layout ? toCanvasPoint(layout.life, width, height) : { x: width / 2, y: height / 2 }
        const direction = yearIndex % 2 === 0 ? -1 : 1
        const tipPoint = {
          x: lifePoint.x + width * LEAF_GEOMETRY.branchDx,
          y: lifePoint.y + direction * height * LEAF_GEOMETRY.branchDy,
        }
        const months = getDisplayMonths(year.events)
        const dx = tipPoint.x - lifePoint.x
        const dy = tipPoint.y - lifePoint.y
        const branchAngle = Math.atan2(dy, dx)
        const nx = -Math.sin(branchAngle)
        const ny = Math.cos(branchAngle)
        const monthNodes = months.map((month, monthIndex) => {
          const attachT = LEAF_GEOMETRY.attachTs[monthIndex] ?? LEAF_GEOMETRY.attachTs[LEAF_GEOMETRY.attachTs.length - 1]
          const baseAttachX = lifePoint.x + dx * attachT
          const baseAttachY = lifePoint.y + dy * attachT
          const angle = branchAngle + (LEAF_GEOMETRY.twigAngleOffsets[monthIndex] ?? 0)
          const lengthFactor = LEAF_GEOMETRY.twigLengths[monthIndex] ?? LEAF_GEOMETRY.twigLengths[LEAF_GEOMETRY.twigLengths.length - 1]
          const length = width * lengthFactor
          const lateralFactor =
            LEAF_GEOMETRY.twigLateralOffsets[monthIndex] ??
            LEAF_GEOMETRY.twigLateralOffsets[LEAF_GEOMETRY.twigLateralOffsets.length - 1] ??
            0
          const lateral = width * lateralFactor
          const lateralX = nx * lateral
          const lateralY = ny * lateral
          const attachX = baseAttachX + lateralX
          const attachY = baseAttachY + lateralY
          const leafX = attachX + Math.cos(angle) * length
          const leafY = attachY + Math.sin(angle) * length
          return {
            month,
            index: monthIndex,
            attachX,
            attachY,
            x: leafX,
            y: leafY,
          }
        })

        return {
          year,
          x: lifePoint.x,
          lifeY: lifePoint.y,
          direction,
          tipX: tipPoint.x,
          tipY: tipPoint.y,
          months,
          monthNodes,
        }
      }),
    [years]
  )

  const desktopNodes = useMemo(
    () => buildNodes(YEAR_LAYOUT_DESKTOP, DESKTOP_CANVAS.width, DESKTOP_CANVAS.height),
    [buildNodes]
  )
  const mobileNodes = useMemo(
    () => buildNodes(YEAR_LAYOUT_MOBILE, MOBILE_CANVAS.width, MOBILE_CANVAS.height),
    [buildNodes]
  )

  const buildLifePath = (nodes: Array<{ x: number; lifeY: number }>, width: number, height: number) => {
    const midY = height * 0.5
    const points = [
      { x: 0, y: midY },
      ...nodes.map(node => ({ x: node.x, y: node.lifeY })),
      { x: width, y: midY + 8 },
    ]
    return buildThreadPath(points)
  }

  const lifeThreadPathDesktop = useMemo(
    () => buildLifePath(desktopNodes, DESKTOP_CANVAS.width, DESKTOP_CANVAS.height),
    [desktopNodes]
  )
  const lifeThreadPathMobile = useMemo(
    () => buildLifePath(mobileNodes, MOBILE_CANVAS.width, MOBILE_CANVAS.height),
    [mobileNodes]
  )
  const filteredEvents = useMemo(() => {
    if (!selectedYear) return []
    if (!selectedMonth) return selectedYear.events
    return selectedYear.events.filter(event => getMonthFromDate(event.date) === selectedMonth)
  }, [selectedMonth, selectedYear])

  const openYear = (year: MemoryYear) => {
    setSelectedYear(year)
    setSelectedMonth(null)
  }

  const openYearMonth = (year: MemoryYear, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const renderTimeline = (
    nodes: Array<{
      year: MemoryYear
      x: number
      lifeY: number
      direction: number
      tipX: number
      tipY: number
      monthNodes: Array<{ month: number; attachX: number; attachY: number; x: number; y: number }>
    }>,
    canvas: { width: number; height: number },
    lifePath: string,
    variant: 'mobile' | 'desktop'
  ) => {
    const glowId = `threadGlow-${variant}`
    const emberId = `emberGlow-${variant}`

    return (
      <div
        className={`hide-scrollbar relative z-10 w-full overflow-x-auto rounded-[2rem] border border-[#3f2d22] bg-[#130d0a] shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_20px_70px_rgba(0,0,0,0.45)] ${
          variant === 'mobile' ? 'h-[68vh]' : 'h-[78vh]'
        }`}
      >
        <div className={`relative h-full ${variant === 'mobile' ? 'min-w-[1080px]' : 'min-w-[2000px]'}`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,206,131,0.22),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,105,61,0.12),transparent_40%),linear-gradient(180deg,rgba(0,0,0,0.28),rgba(0,0,0,0.62))]" />
          <div className="pointer-events-none absolute inset-0 opacity-25 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_7px)]" />
          <svg viewBox={`0 0 ${canvas.width} ${canvas.height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={emberId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d={`M 0 116 Q ${canvas.width / 2} 42 ${canvas.width} 108`}
              stroke="#f15535"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              filter={`url(#${emberId})`}
              opacity="0.95"
            />
            <path
              d={`M 0 ${canvas.height - 116} Q ${canvas.width / 2} ${canvas.height - 38} ${canvas.width} ${canvas.height - 108}`}
              stroke="#f15535"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              filter={`url(#${emberId})`}
              opacity="0.95"
            />

            <path d={lifePath} stroke="#ffbfa0" strokeWidth="10" strokeLinecap="round" fill="none" filter={`url(#${glowId})`} opacity="0.32" />
            <path d={lifePath} stroke="#f3f7ff" strokeWidth="4.4" strokeLinecap="round" fill="none" filter={`url(#${glowId})`} />

            {nodes.map((node) => {
              const branchDx = node.tipX - node.x
              const branchDy = node.tipY - node.lifeY
              const branchLen = Math.hypot(branchDx, branchDy) || 1

              // Reconstruct cubic Bezier control points (matches buildSmoothCurvePath)
              const bendSign = node.direction < 0 ? -1 : 1
              const crvNx = -branchDy / branchLen
              const crvNy =  branchDx / branchLen
              const crvOff = branchLen * 0.12 * bendSign

              const p0x = node.x,    p0y = node.lifeY
              const p3x = node.tipX, p3y = node.tipY
              const p1x = p0x + branchDx * 0.34 + crvNx * crvOff
              const p1y = p0y + branchDy * 0.34 + crvNy * crvOff
              const p2x = p0x + branchDx * 0.72 + crvNx * crvOff * 0.55
              const p2y = p0y + branchDy * 0.72 + crvNy * crvOff * 0.55

              // Evaluate cubic Bezier at t = 0.3 for true on-curve attach point
              const twigT = 0.3
              const mt = 1 - twigT, mt2 = mt * mt, mt3 = mt2 * mt
              const t2 = twigT * twigT, t3 = t2 * twigT

              const twigAttachX = mt3*p0x + 3*mt2*twigT*p1x + 3*mt*t2*p2x + t3*p3x
              const twigAttachY = mt3*p0y + 3*mt2*twigT*p1y + 3*mt*t2*p2y + t3*p3y

              // Tangent at t = 0.3
              const tanX = 3*mt2*(p1x - p0x) + 6*mt*twigT*(p2x - p1x) + 3*t2*(p3x - p2x)
              const tanY = 3*mt2*(p1y - p0y) + 6*mt*twigT*(p2y - p1y) + 3*t2*(p3y - p2y)
              const tanLen = Math.hypot(tanX, tanY) || 1
              const tux = tanX / tanLen
              const tuy = tanY / tanLen

              // Outward normal (perpendicular to tangent, away from life thread)
              const n1x = -tuy, n1y = tux
              const n2x =  tuy, n2y = -tux
              const useOutN1 = n1y * node.direction > 0
              const nx = useOutN1 ? n1x : n2x
              const ny = useOutN1 ? n1y : n2y

              // Twig: leaf-vein style — angles outward + backward toward branch root
              const epsilon = 4                    // px, clears branch stroke width
              const twigLength = branchLen * 0.22  // reach of the vein

              // Vein direction: blend of outward normal + backward along branch
              // ~40° off the branch, angled back toward the life-thread
              const vdx = nx * 0.6 + (-tux) * 0.8
              const vdy = ny * 0.6 + (-tuy) * 0.8
              const vLen = Math.hypot(vdx, vdy) || 1
              const vux = vdx / vLen
              const vuy = vdy / vLen

              const bx = twigAttachX + vux * epsilon
              const by = twigAttachY + vuy * epsilon
              // End point along the vein direction
              const ex = twigAttachX + vux * twigLength
              const ey = twigAttachY + vuy * twigLength
              // Control point: slightly more outward-normal for a gentle curve
              const cpx = twigAttachX + vux * twigLength * 0.55 + nx * twigLength * 0.18
              const cpy = twigAttachY + vuy * twigLength * 0.55 + ny * twigLength * 0.18

              const mainPath = buildSmoothCurvePath(
                { x: node.x, y: node.lifeY },
                { x: node.tipX, y: node.tipY },
                node.direction < 0 ? -1 : 1,
                0.12
              )
              const twigPath = `M ${twigAttachX} ${twigAttachY} L ${bx} ${by} Q ${cpx} ${cpy}, ${ex} ${ey}`
              return (
                <g key={`line-${variant}-${node.year.year}`}>
                  <path d={mainPath} stroke="#ffcfad" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} opacity="0.42" />
                  <path d={mainPath} stroke="#f7e8de" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
                  <path d={twigPath} stroke="#ffc89f" strokeWidth="3.1" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} opacity="0.36" />
                  <path d={twigPath} stroke="#fff2e8" strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )
            })}

            {nodes.map((node) => {
              const yearLabel = String(node.year.year)
              const yearW = chipWidth(yearLabel, 'year')
              const yearH = 50
              const yearX = node.x - yearW / 2
              const yearY = node.lifeY + (node.direction < 0 ? -58 : 10)

              return (
                <g key={`year-chip-${variant}-${node.year.year}`} onClick={() => openYear(node.year)} style={{ cursor: 'pointer' }}>
                  <rect x={yearX} y={yearY} width={yearW} height={yearH} rx="18" fill="rgba(20, 14, 13, 0.82)" stroke="rgba(255, 201, 162, 0.9)" strokeWidth="2" filter={`url(#${emberId})`} />
                  <text x={node.x} y={yearY + 33} fill="#ffd8ba" textAnchor="middle" fontSize={variant === 'mobile' ? '38' : '34'} style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 700 }}>
                    {yearLabel}
                  </text>
                </g>
              )
            })}

          </svg>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden p-3 md:p-6">
      <header className="relative z-20 text-center pt-6 pb-4">
        <h1 className="text-3xl md:text-5xl text-valentine-accent font-serif">Our Memory Threads</h1>
        <p className="text-sm md:text-base text-gray-700 mt-2">
          Life thread in the center. Year branches alternate up and down.
        </p>
      </header>

      <div className="md:hidden">
        {renderTimeline(mobileNodes, MOBILE_CANVAS, lifeThreadPathMobile, 'mobile')}
      </div>
      <div className="hidden md:block">
        {renderTimeline(desktopNodes, DESKTOP_CANVAS, lifeThreadPathDesktop, 'desktop')}
      </div>

      <AnimatePresence>
        {selectedYear && (
          <>
            <motion.button
              type="button"
              aria-label="Close year panel"
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedYear(null)}
            />
            <motion.section
              className="fixed left-0 right-0 bottom-0 z-40 max-h-[84vh] overflow-y-auto rounded-t-3xl bg-white/95 border-t border-valentine-rose/30 shadow-2xl p-5 md:max-w-2xl md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:rounded-3xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-serif text-valentine-accent">{selectedYear.year}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedYear.title}</p>
                </div>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-valentine-pink text-valentine-accent"
                  onClick={() => setSelectedYear(null)}
                >
                  ✕
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-700">{selectedYear.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    selectedMonth === null
                      ? 'bg-valentine-accent text-white border-valentine-accent'
                      : 'bg-white text-valentine-accent border-valentine-rose/40'
                  }`}
                  onClick={() => setSelectedMonth(null)}
                >
                  All Months
                </button>
                {Array.from(new Set(selectedYear.events.map(event => getMonthFromDate(event.date))))
                  .sort((a, b) => a - b)
                  .map((month) => (
                    <button
                      key={`filter-${selectedYear.year}-${month}`}
                      type="button"
                      className={`text-xs px-3 py-1.5 rounded-full border ${
                        selectedMonth === month
                          ? 'bg-valentine-accent text-white border-valentine-accent'
                          : 'bg-white text-valentine-accent border-valentine-rose/40'
                      }`}
                      onClick={() => setSelectedMonth(month)}
                    >
                      {monthShort(month)}
                    </button>
                  ))}
              </div>

              <div className="mt-4 grid gap-3">
                {filteredEvents.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-valentine-rose/30 bg-white p-4">
                    <p className="text-xs tracking-wide uppercase text-gray-500">{event.date}</p>
                    <h3 className="text-base font-semibold text-valentine-accent mt-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full bg-valentine-pink text-valentine-accent">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
                {filteredEvents.length === 0 && (
                  <p className="text-sm text-gray-500">No memories found for this month yet.</p>
                )}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
