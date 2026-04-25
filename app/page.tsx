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

interface FloatingHeart {
  id: number
  x: number
  y: number
  speed: number
  size: number
}

interface Arrow {
  id: number
  x: number
  y: number
  angle: number
  speed: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<ModalStep>('landing')
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 })
  const [noButtonPos, setNoButtonPos] = useState<Position>({ x: 50, y: 50 })
  const [dodgeAttempts, setDodgeAttempts] = useState(0)
  const [showFloatingHearts, setShowFloatingHearts] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const [escPressCount, setEscPressCount] = useState(0)
  const [visibleAnimals, setVisibleAnimals] = useState<number[]>([])
  const [isShutterShaking, setIsShutterShaking] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showShutter, setShowShutter] = useState(true)
  const [valentinesDay, setValentinesDay] = useState<number>(0)
  const [isPeeking, setIsPeeking] = useState(false)
  const [catIndex, setCatIndex] = useState(0)
  const catPeekCounter = useRef(0)
  
  // Game state - using refs for game loop to avoid stale closures
  const [bowAngle, setBowAngle] = useState(-90)
  const [score, setScore] = useState(0)
  const [gameRenderTick, setGameRenderTick] = useState(0)
  const aimingLeft = useRef(false)
  const aimingRight = useRef(false)
  const heartsRef = useRef<FloatingHeart[]>([])
  const arrowsRef = useRef<Arrow[]>([])
  const particlesRef = useRef<Particle[]>([])
  const bowAngleRef = useRef(-90)
  
  const noButtonRef = useRef<HTMLButtonElement>(null)
  const lastDodgeTime = useRef(0)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const heartIdCounter = useRef(0)
  const arrowIdCounter = useRef(0)
  const particleIdCounter = useRef(0)
  const shutterRef = useRef<HTMLDivElement>(null)
  const spawnTimerRef = useRef(0)

  // Set Valentine's Day on client-side mount
  useEffect(() => {
    // February 14, 2026 at midnight IST (Indian Standard Time, UTC+5:30)
    setValentinesDay(new Date('2026-02-14T00:00:00+05:30').getTime())
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (!valentinesDay) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = valentinesDay - now

      if (distance <= 0) {
        setShowShutter(false)
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeRemaining({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [valentinesDay])

  // Auto-peek: curtains slightly open every 5 seconds, cat peeks, then close
  useEffect(() => {
    if (!showShutter) return

    const peekInterval = setInterval(() => {
      setCatIndex(catPeekCounter.current % 3)
      catPeekCounter.current++
      setIsPeeking(true)
      // Close back after 1.5 seconds
      setTimeout(() => {
        setIsPeeking(false)
      }, 1500)
    }, 5000)

    return () => clearInterval(peekInterval)
  }, [showShutter])

  // Cupid's Arrow Game - Single game loop using requestAnimationFrame
  useEffect(() => {
    if (!showShutter) return

    let animFrame: number
    let lastSpawn = Date.now()

    const gameLoop = () => {
      const now = Date.now()

      // Rotate bow
      if (aimingLeft.current) bowAngleRef.current = Math.max(-170, bowAngleRef.current - 3)
      if (aimingRight.current) bowAngleRef.current = Math.min(-10, bowAngleRef.current + 3)
      setBowAngle(bowAngleRef.current)

      // Spawn hearts every ~1.8s
      if (now - lastSpawn > 1800) {
        heartsRef.current.push({
          id: heartIdCounter.current++,
          x: Math.random() * 80 + 10,
          y: 110,
          speed: 0.25 + Math.random() * 0.3,
          size: 30 + Math.random() * 20,
        })
        lastSpawn = now
      }

      // Move hearts upward
      heartsRef.current = heartsRef.current
        .map(h => ({ ...h, y: h.y - h.speed }))
        .filter(h => h.y > -10)

      // Move arrows
      arrowsRef.current = arrowsRef.current
        .map(a => ({
          ...a,
          x: a.x + Math.cos(a.angle) * a.speed,
          y: a.y + Math.sin(a.angle) * a.speed,
        }))
        .filter(a => a.x > -5 && a.x < 105 && a.y > -5 && a.y < 105)

      // Collision detection
      const hitHeartIds = new Set<number>()
      const hitArrowIds = new Set<number>()
      let scoreInc = 0

      for (const arrow of arrowsRef.current) {
        for (const heart of heartsRef.current) {
          if (hitHeartIds.has(heart.id) || hitArrowIds.has(arrow.id)) continue
          const dx = arrow.x - heart.x
          const dy = arrow.y - heart.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 5) {
            hitHeartIds.add(heart.id)
            hitArrowIds.add(arrow.id)
            scoreInc++
            // Burst particles
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI * 2 * i) / 6
              particlesRef.current.push({
                id: particleIdCounter.current++,
                x: heart.x, y: heart.y,
                vx: Math.cos(a) * 1.5,
                vy: Math.sin(a) * 1.5,
                life: 25,
              })
            }
          }
        }
      }

      if (hitHeartIds.size > 0) {
        heartsRef.current = heartsRef.current.filter(h => !hitHeartIds.has(h.id))
        arrowsRef.current = arrowsRef.current.filter(a => !hitArrowIds.has(a.id))
        setScore(prev => prev + scoreInc)
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
        .filter(p => p.life > 0)

      // Trigger re-render
      setGameRenderTick(t => t + 1)

      animFrame = requestAnimationFrame(gameLoop)
    }

    animFrame = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrame)
  }, [showShutter])

  // Shoot arrow
  const shootArrow = () => {
    const angleRad = (bowAngleRef.current * Math.PI) / 180
    arrowsRef.current.push({
      id: arrowIdCounter.current++,
      x: 50,
      y: 88,
      angle: angleRad,
      speed: 2.5,
    })
  }

  // Keyboard controls
  useEffect(() => {
    if (!showShutter) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') aimingLeft.current = true
      if (e.key === 'ArrowRight' || e.key === 'd') aimingRight.current = true
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); shootArrow() }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') aimingLeft.current = false
      if (e.key === 'ArrowRight' || e.key === 'd') aimingRight.current = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [showShutter, bowAngle])

  // Animal positions around the Yes button (in a circle-ish pattern)
  const animalPositions = [
    { x: -80, y: -60, rotation: 25 },   // top-left
    { x: 80, y: -60, rotation: -25 },   // top-right
    { x: -100, y: 10, rotation: 15 },   // left
    { x: 100, y: 10, rotation: -15 },   // right
    { x: -70, y: 70, rotation: 10 },    // bottom-left
    { x: 70, y: 70, rotation: -10 },    // bottom-right
  ]

  // Emoji placeholders (can replace with images later)
  const animalEmojis = ['🐕', '🐱', '🐰', '🐦', '🐻', '🦊']

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

  const closeModal = () => {
    if (currentStep === 'modal6') {
      setCurrentStep('landing')
      setDodgeAttempts(0)
      setEscPressCount(0)
      setNoButtonPos({ x: 50, y: 50 })
      setVisibleAnimals([])
    } else {
      setCurrentStep('landing')
      setDodgeAttempts(0)
      setEscPressCount(0)
      setNoButtonPos({ x: 50, y: 50 })
      setVisibleAnimals([])
    }
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

  // No button dodge logic
  useEffect(() => {
    if (currentStep !== 'modal3' || !noButtonRef.current) return

    const checkDistance = () => {
      const now = Date.now()
      if (now - lastDodgeTime.current < 250) return // Cooldown

      const button = noButtonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const buttonCenterX = rect.left + rect.width / 2
      const buttonCenterY = rect.top + rect.height / 2

      const distance = Math.sqrt(
        Math.pow(mousePos.x - buttonCenterX, 2) + 
        Math.pow(mousePos.y - buttonCenterY, 2)
      )

      if (distance < 90) {
        const newPos = getRandomPosition()
        setNoButtonPos(newPos)
        setDodgeAttempts(prev => prev + 1)
        lastDodgeTime.current = now
      }
    }

    checkDistance()
  }, [mousePos, currentStep, getRandomPosition])

  const handleNoButtonClick = (e: React.MouseEvent) => {
    // Prevent actual clicks - just keep dodging
    e.preventDefault()
    e.stopPropagation()
    const newPos = getRandomPosition()
    setNoButtonPos(newPos)
    setDodgeAttempts(prev => prev + 1)
    
    // Show a new animal (max 6)
    if (visibleAnimals.length < 6) {
      setVisibleAnimals(prev => [...prev, prev.length])
    }
  }

  const handleNoButtonTouchOrHover = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Always move on touch/hover
    const newPos = getRandomPosition()
    setNoButtonPos(newPos)
    setDodgeAttempts(prev => prev + 1)
    
    // Show a new animal (max 6)
    if (visibleAnimals.length < 6) {
      setVisibleAnimals(prev => [...prev, prev.length])
    }
  }

  const handleNoButtonPointerDown = (e: React.PointerEvent) => {
    // Catch all pointer events (touch, mouse, pen)
    e.preventDefault()
    e.stopPropagation()
    
    const newPos = getRandomPosition()
    setNoButtonPos(newPos)
    setDodgeAttempts(prev => prev + 1)
    
    // Show a new animal (max 6)
    if (visibleAnimals.length < 6) {
      setVisibleAnimals(prev => [...prev, prev.length])
    }
  }

  const handleYesClick = () => {
    setShowFloatingHearts(true)
    setTimeout(() => {
      setShowFloatingHearts(false)
      setCurrentStep('modal4')
    }, 1500)
  }

  const renderModal = () => {
    const modalVariants = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    }

    const overlayVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
    }

    const getProgressDots = () => {
      const steps = ['modal1', 'modal2', 'modal3', 'modal4', 'modal5']
      const currentIndex = steps.indexOf(currentStep)
      if (currentIndex === -1) return null

      return (
        <div className="flex gap-1.5 justify-center mt-6" aria-label="Progress indicator">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index <= currentIndex ? 'bg-valentine-accent' : 'bg-valentine-rose/30'
              }`}
            />
          ))}
        </div>
      )
    }

    const modalContent = () => {
      switch (currentStep) {
        case 'modal1':
          return (
            <div className="text-center space-y-8">
              <p className="text-lg leading-relaxed text-gray-700">
                This isn't a question.<br />
                It's just a moment.<br />
                You can leave whenever you want.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep('modal2')}
                  className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                  aria-label="Continue with okay"
                >
                  okay
                </button>
                <button
                  onClick={() => setCurrentStep('modal2')}
                  className="px-8 py-3 bg-white text-valentine-accent border border-valentine-accent rounded-full hover:bg-valentine-pink transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                  aria-label="Continue with hmm"
                >
                  hmm
                </button>
              </div>
              {getProgressDots()}
            </div>
          )

        case 'modal2':
          return (
            <div className="text-center space-y-8">
              <p className="text-lg leading-relaxed text-gray-700">
                You have a very specific kind of pretty.<br />
                The kind that notices itself —<br />
                and still pretends it didn't.
              </p>
              <button
                onClick={() => setCurrentStep('modal3')}
                className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                aria-label="Continue to next"
              >
                next
              </button>
              {getProgressDots()}
            </div>
          )

        case 'modal3':
          return (
            <div className="text-center space-y-8 relative">
              <h2 className="text-3xl font-serif text-valentine-accent">
                Will you be my Valentine?
              </h2>
              <div className="relative min-h-[8rem] flex items-center justify-center">
                {dodgeAttempts === 0 ? (
                  // Initial state: buttons side by side
                  <div className="flex gap-4 flex-wrap justify-center">
                    <button
                      onClick={handleYesClick}
                      className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                      aria-label="Yes, I will be your Valentine"
                    >
                      Yes
                    </button>
                    <button
                      onPointerDown={handleNoButtonPointerDown}
                      onMouseEnter={(e) => {
                        setDodgeAttempts(1)
                      }}
                      onTouchStart={handleNoButtonTouchOrHover}
                      onClick={handleNoButtonClick}
                      className="px-8 py-3 bg-white text-valentine-accent border border-valentine-accent rounded-full select-none touch-none transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                      aria-label="No (but you can't click this)"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  // After first dodge: absolute positioning
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Animals appearing around Yes button */}
                    <AnimatePresence>
                      {visibleAnimals.map((animalIndex) => (
                        <motion.div
                          key={animalIndex}
                          className="absolute pointer-events-none z-0"
                          style={{
                            left: `calc(50% + ${animalPositions[animalIndex].x}px)`,
                            top: `calc(50% + ${animalPositions[animalIndex].y}px)`,
                            transform: `translate(-50%, -50%) rotate(${animalPositions[animalIndex].rotation}deg)`,
                          }}
                          initial={{ opacity: 0, scale: 0, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            damping: 15,
                            stiffness: 300,
                            delay: 0.1,
                          }}
                        >
                          {/* Replace with <img src={`/animals/animal${animalIndex + 1}.png`} /> when you have images */}
                          <span className="text-4xl filter drop-shadow-lg">
                            {animalEmojis[animalIndex]}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <button
                      onClick={handleYesClick}
                      className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2 z-10 relative"
                      aria-label="Yes, I will be your Valentine"
                    >
                      Yes
                    </button>
                    <button
                      ref={noButtonRef}
                      onPointerDown={handleNoButtonPointerDown}
                      onMouseEnter={() => {}}
                      onTouchStart={handleNoButtonTouchOrHover}
                      onClick={handleNoButtonClick}
                      className="px-8 py-3 bg-white text-valentine-accent border border-valentine-accent rounded-full select-none touch-none focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2 absolute pointer-events-auto"
                      style={{
                        left: `${noButtonPos.x}px`,
                        top: `${noButtonPos.y}px`,
                        transition: 'all 0.15s ease-out',
                      }}
                      aria-label="No (but you can't click this)"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
              {dodgeAttempts >= 3 && (
                <p className="text-sm text-valentine-deep italic">
                  okay okay, dramatic much.
                </p>
              )}
              <button
                onClick={() => setCurrentStep('modal6')}
                className="text-xs text-gray-400 hover:text-valentine-accent transition-colors underline"
                aria-label="Close gracefully"
              >
                close gracefully
              </button>
              {getProgressDots()}
            </div>
          )

        case 'modal4':
          return (
            <div className="text-center space-y-8">
              <p className="text-xl leading-relaxed text-gray-700">
                Good choice.<br />
                You have excellent instincts.
              </p>
              <p className="text-sm text-gray-500 italic">
                (I already knew that.)
              </p>
              <button
                onClick={() => setCurrentStep('modal5')}
                className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                aria-label="Continue to one more thing"
              >
                one more thing
              </button>
              {getProgressDots()}
            </div>
          )

        case 'modal5':
          return (
            <div className="text-center space-y-8">
              <p className="text-lg leading-relaxed text-gray-700">
                I don't rush people.<br />
                I just enjoy them.<br />
                And sometimes…<br />
                I build things when words feel lazy.
              </p>
              <p className="text-sm text-valentine-deep font-serif italic">
                — Nova
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep('modal6')}
                  className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                  aria-label="Done"
                >
                  done
                </button>
                <button
                  onClick={closeModal}
                  className="px-8 py-3 bg-white text-valentine-accent border border-valentine-accent rounded-full hover:bg-valentine-pink transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                  aria-label="Restart from beginning"
                >
                  restart
                </button>
              </div>
              {getProgressDots()}
            </div>
          )

        case 'modal6':
          return (
            <div className="text-center space-y-8">
              <p className="text-lg leading-relaxed text-gray-700">
                That's it, by the way.<br />
                No follow-ups. No expectations.<br />
                You can go be adorable now.
              </p>
              <button
                onClick={closeModal}
                className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
                aria-label="Close gracefully and return to start"
              >
                close gracefully
              </button>
            </div>
          )

        default:
          return null
      }
    }

    if (currentStep === 'landing') return null

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

      {/* Footer */}
      <motion.div
        className="absolute bottom-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <p className="text-sm text-gray-500">made by Nova</p>
      </motion.div>

      {/* Music Toggle UI (non-functional, just UI) */}
      <motion.button
        onClick={() => setMusicOn(!musicOn)}
        className="fixed top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-lg hover:shadow-xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-valentine-accent z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        aria-label={musicOn ? "Music on (UI only)" : "Music off (UI only)"}
        title="Music toggle (UI only)"
      >
        <span className="text-lg">{musicOn ? '🔈' : '🔇'}</span>
      </motion.button>

      {/* Floating Hearts Animation */}
      <AnimatePresence>
        {showFloatingHearts && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                initial={{
                  x: '50vw',
                  y: '50vh',
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 40}vw`,
                  y: `${20 + (Math.random() - 0.5) * 20}vh`,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
              >
                💖
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modal System */}
      <AnimatePresence mode="wait">
        {renderModal()}
      </AnimatePresence>

      {/* Valentine's Day Shutter */}
      <AnimatePresence>
        {showShutter && (
          <motion.div
            ref={shutterRef}
            className="fixed inset-0 z-[100] flex items-center justify-center select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
          >

            {/* Left curtain */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-valentine-deep via-valentine-accent to-valentine-rose shadow-2xl z-[21]"
              animate={isPeeking ? { x: '-8%' } : { x: '0%' }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              exit={{ x: '-100%', transition: { duration: 1 } }}
            >
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px)'
              }} />
            </motion.div>

            {/* Right curtain */}
            <motion.div
              className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-valentine-deep via-valentine-accent to-valentine-rose shadow-2xl z-[21]"
              animate={isPeeking ? { x: '8%' } : { x: '0%' }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              exit={{ x: '100%', transition: { duration: 1 } }}
            >
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px)'
              }} />
            </motion.div>

            {/* Cat peeking from behind curtains */}
            <AnimatePresence>
              {isPeeking && (
                <motion.div
                  className="absolute z-20 flex flex-col items-center"
                  style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                  initial={{ y: 40, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 30, opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                >
                  <img
                    src={`/cats/cat${catIndex + 1}.png`}
                    alt="Peeking cat"
                    className="w-24 h-24 md:w-36 md:h-36 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                    draggable={false}
                  />
                  <motion.span
                    className="text-white text-sm md:text-base mt-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    not yet! 😾
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Elements Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
              {/* Floating Hearts */}
              {heartsRef.current.map(heart => (
                <div
                  key={heart.id}
                  className="absolute"
                  style={{
                    left: `${heart.x}%`,
                    top: `${heart.y}%`,
                    fontSize: `${heart.size}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  💖
                </div>
              ))}

              {/* Arrows */}
              {arrowsRef.current.map(arrow => (
                <div
                  key={arrow.id}
                  className="absolute text-xl"
                  style={{
                    left: `${arrow.x}%`,
                    top: `${arrow.y}%`,
                    transform: `translate(-50%, -50%) rotate(${arrow.angle + Math.PI / 4}rad)`,
                  }}
                >
                  ➤
                </div>
              ))}

              {/* Burst Particles */}
              {particlesRef.current.map(particle => (
                <div
                  key={particle.id}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    opacity: particle.life / 25,
                    background: 'linear-gradient(135deg, #f48fb1, #fff)',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 6px #f48fb1',
                  }}
                />
              ))}

              {/* Bow - fixed at bottom center */}
              <div
                className="absolute text-5xl"
                style={{
                  left: '50%',
                  top: '88%',
                  transform: `translate(-50%, -50%) rotate(${bowAngle + 45}deg)`,
                  transition: 'transform 0.05s linear',
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))',
                }}
              >
                🏹
              </div>

              {/* Aim line (dotted) */}
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <line
                  x1="50%"
                  y1="88%"
                  x2={`${50 + Math.cos(bowAngle * Math.PI / 180) * 15}%`}
                  y2={`${88 + Math.sin(bowAngle * Math.PI / 180) * 15}%`}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              </svg>
            </div>

            {/* Score Display */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur px-5 py-2 rounded-full text-white font-bold text-lg z-40 pointer-events-none">
              💕 {score}
            </div>

            {/* Center content - Countdown */}
            <motion.div 
              className="relative z-25 text-center text-white px-8 pointer-events-none"
              style={{ zIndex: 25 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
            >
              <motion.div
                animate={isShutterShaking ? { rotate: [0, -5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-6xl md:text-8xl font-serif mb-6 drop-shadow-2xl">💝</h1>
                <h2 className="text-3xl md:text-5xl font-serif mb-4 drop-shadow-lg">
                  Coming Soon
                </h2>
                <p className="text-lg md:text-xl mb-8 opacity-90">
                  Something special awaits...
                </p>
                
                {/* Countdown Timer */}
                <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto mb-6">
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                    <div className="text-4xl md:text-5xl font-bold">{timeRemaining.days}</div>
                    <div className="text-xs md:text-sm uppercase opacity-80 mt-1">Days</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                    <div className="text-4xl md:text-5xl font-bold">{timeRemaining.hours}</div>
                    <div className="text-xs md:text-sm uppercase opacity-80 mt-1">Hours</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                    <div className="text-4xl md:text-5xl font-bold">{timeRemaining.minutes}</div>
                    <div className="text-xs md:text-sm uppercase opacity-80 mt-1">Minutes</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                    <div className="text-4xl md:text-5xl font-bold">{timeRemaining.seconds}</div>
                    <div className="text-xs md:text-sm uppercase opacity-80 mt-1">Seconds</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Game Controls - Bottom */}
            <div className="absolute bottom-4 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12">
              {/* Left - "Me" Direction Controls */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-white/70 text-xs font-medium mb-1">Me</span>
                <div className="flex gap-2">
                  <button
                    className="w-14 h-14 md:w-16 md:h-16 bg-white/25 backdrop-blur rounded-xl text-white text-2xl font-bold active:bg-white/40 transition-colors touch-manipulation"
                    onMouseDown={() => { aimingLeft.current = true }}
                    onMouseUp={() => { aimingLeft.current = false }}
                    onMouseLeave={() => { aimingLeft.current = false }}
                    onTouchStart={(e) => { e.preventDefault(); aimingLeft.current = true }}
                    onTouchEnd={() => { aimingLeft.current = false }}
                  >
                    ◀
                  </button>
                  <button
                    className="w-14 h-14 md:w-16 md:h-16 bg-white/25 backdrop-blur rounded-xl text-white text-2xl font-bold active:bg-white/40 transition-colors touch-manipulation"
                    onMouseDown={() => { aimingRight.current = true }}
                    onMouseUp={() => { aimingRight.current = false }}
                    onMouseLeave={() => { aimingRight.current = false }}
                    onTouchStart={(e) => { e.preventDefault(); aimingRight.current = true }}
                    onTouchEnd={() => { aimingRight.current = false }}
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Right - "You" Shoot Button */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-white/70 text-xs font-medium mb-1">You</span>
                <button
                  className="w-20 h-14 md:w-24 md:h-16 bg-white/30 backdrop-blur rounded-xl text-white text-3xl active:bg-white/50 active:scale-95 transition-all touch-manipulation"
                  onClick={(e) => { e.stopPropagation(); shootArrow() }}
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); shootArrow() }}
                >
                  💘
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
