'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ModalStep = 'landing' | 'modal1' | 'modal2' | 'modal3' | 'modal4' | 'modal5' | 'modal6'

interface Position {
  x: number
  y: number
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<ModalStep>('landing')
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 })
  const [noButtonPos, setNoButtonPos] = useState<Position>({ x: 50, y: 50 })
  const [dodgeAttempts, setDodgeAttempts] = useState(0)
  const [showFloatingHearts, setShowFloatingHearts] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const [escPressCount, setEscPressCount] = useState(0)
  
  const noButtonRef = useRef<HTMLButtonElement>(null)
  const lastDodgeTime = useRef(0)
  const modalContentRef = useRef<HTMLDivElement>(null)

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
    } else {
      setCurrentStep('landing')
      setDodgeAttempts(0)
      setEscPressCount(0)
      setNoButtonPos({ x: 50, y: 50 })
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
  }

  const handleNoButtonTouchOrHover = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Always move on touch/hover
    const newPos = getRandomPosition()
    setNoButtonPos(newPos)
    setDodgeAttempts(prev => prev + 1)
  }

  const handleNoButtonPointerDown = (e: React.PointerEvent) => {
    // Catch all pointer events (touch, mouse, pen)
    e.preventDefault()
    e.stopPropagation()
    
    const newPos = getRandomPosition()
    setNoButtonPos(newPos)
    setDodgeAttempts(prev => prev + 1)
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
                  <>
                    <button
                      onClick={handleYesClick}
                      className="px-8 py-3 bg-valentine-accent text-white rounded-full hover:bg-valentine-deep transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-valentine-accent focus:ring-offset-2 z-10"
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
                  </>
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
    </main>
  )
}
