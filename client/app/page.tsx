'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LoanForm from '@/components/LoanForm'
import ResultsView from '@/components/ResultsView'
import { toast, Toaster } from 'sonner'

export default function Home() {
  const [showResults, setShowResults] = useState(false)
  const [calculationResults, setCalculationResults] = useState(null)
  const [tg, setTg] = useState<any>(null)

  useEffect(() => {
    // Initialize Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp
      webApp.ready()
      webApp.expand()
      setTg(webApp)

      // Apply Telegram theme
      if (webApp.themeParams) {
        document.documentElement.style.setProperty(
          '--tg-theme-bg-color',
          webApp.themeParams.bg_color || '#0a0e27'
        )
      }
    }
  }, [])

  const handleCalculate = (results: any) => {
    setCalculationResults(results)
    setShowResults(true)

    // Vibrate on calculation complete
    if (tg) {
      tg.HapticFeedback?.notificationOccurred('success')
    }

    toast.success('Расчет выполнен успешно!')
  }

  const handleBack = () => {
    setShowResults(false)
    setCalculationResults(null)

    if (tg) {
      tg.HapticFeedback?.impactOccurred('light')
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(26, 31, 58, 0.95)',
            border: '1px solid rgba(91, 141, 239, 0.3)',
            color: '#fff',
          },
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
            Калькулятор Автокредитов
          </h1>
          <p className="text-gray-400 text-lg">
            Сравните предложения от ТОП-5 банков Узбекистана
          </p>
        </motion.div>

        {/* Content */}
        {!showResults ? (
          <LoanForm onCalculate={handleCalculate} telegram={tg} />
        ) : (
          <ResultsView
            results={calculationResults}
            onBack={handleBack}
            telegram={tg}
          />
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-gray-500"
        >
          <p>🇺🇿 Made with ❤️ for Uzbekistan</p>
          <p className="mt-2">
            Актуальные условия уточняйте в банках
          </p>
        </motion.footer>
      </div>
    </main>
  )
}
