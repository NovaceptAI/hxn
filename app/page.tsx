'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ModalStep = 'landing' | 'modal1' | 'modal2' | 'modal3' | 'modal4' | 'modal5' | 'modal6'

interface Position {
  x: number
  y: number
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (currentStep !== 'landing') {
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }
    return () => document.body.classList.remove('no-scroll')
  }, [currentStep])

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ESC key handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentStep !== 'landing') {
        setEscPressCount(prev => prev + 1)
        if (currentStep === 'modal3') {
          // Don't close the yes/no modal with ESC, show exit modal instead
          if (escPressCount >= 2) {
            setCurrentStep('modal6')
          }
        } else if (currentStep !== 'modal6') {
          closeModal()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [currentStep, escPressCount])

  // Focus trap
  useEffect(() => {
    if (currentStep !== 'landing' && modalContentRef.current) {
      const focusableElements = modalContentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length > 0) {
        ;(focusableElements[0] as HTMLElement).focus()
      }
    }
  }, [currentStep])

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

  const getRandomPosition = useCallback((): Position => {
    if (!modalContentRef.current) return { x: 50, y: 50 }
    
    const modal = modalContentRef.current
    const bounds = modal.getBoundingClientRect()
    const padding = 16
    const buttonWidth = 100
    const buttonHeight = 44
    
    // Available space
    const maxX = bounds.width - buttonWidth - padding * 2
    const maxY = bounds.height - buttonHeight - padding * 2
    
    // Generate random position
    const x = Math.random() * maxX + padding
    const y = Math.random() * maxY + padding
    
    return { x, y }
  }, [])

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
      <>
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={currentStep !== 'modal3' ? closeModal : undefined}
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div
            ref={modalContentRef}
            className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full pointer-events-auto relative border border-valentine-rose/20"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {currentStep !== 'modal3' && currentStep !== 'modal6' && (
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-valentine-accent transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-valentine-pink focus:outline-none focus:ring-2 focus:ring-valentine-accent"
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
            {modalContent()}
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      {/* Landing Hero */}
      <AnimatePresence>
        {currentStep === 'landing' && (
          <motion.div
            className="text-center space-y-8 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-5xl md:text-6xl font-serif text-valentine-accent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Hi Himanshi 🌸
            </motion.h1>
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-xl text-gray-700 leading-relaxed">
                I made something small.
              </p>
              <p className="text-xl text-gray-700 leading-relaxed">
                Not important. Just curious.
              </p>
            </motion.div>
            <motion.button
              onClick={() => setCurrentStep('modal1')}
              className="px-12 py-4 bg-valentine-accent text-white rounded-full text-lg hover:bg-valentine-deep transition-all hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Open the Valentine message"
            >
              open it
            </motion.button>
          </motion.div>
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
