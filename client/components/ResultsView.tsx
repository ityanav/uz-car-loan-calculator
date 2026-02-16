'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { toast } from 'sonner'
import BankCard from './BankCard'

interface ResultsViewProps {
  results: any
  onBack: () => void
  telegram: any
}

export default function ResultsView({ results, onBack, telegram }: ResultsViewProps) {
  const [selectedBank, setSelectedBank] = useState<any>(null)
  const [sending, setSending] = useState(false)

  const eligibleBanks = results?.results?.eligible || []
  const bestOffer = results?.bestOffer

  const handleSelectBank = async (bank: any) => {
    setSelectedBank(bank)

    try {
      setSending(true)

      // Send application to Telegram
      await axios.post('http://localhost:3000/api/application', {
        ...results,
        selectedBank: bank,
      })

      toast.success(`Заявка в ${bank.name} отправлена!`)

      // Notify user via Telegram
      if (telegram) {
        telegram.showAlert(
          `✅ Заявка отправлена!\n\nБанк: ${bank.name}\nЕжемесячный платеж: ${Math.round(bank.monthlyPayment).toLocaleString('ru-RU')} сум\n\nМы свяжемся с вами в ближайшее время.`
        )
      }
    } catch (error) {
      console.error('Error sending application:', error)
      toast.error('Ошибка отправки заявки')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </motion.button>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          📊 Результаты расчета
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Стоимость авто</p>
            <p className="text-lg font-bold">
              {results.input.carPrice.toLocaleString('ru-RU')} {results.input.currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Первый взнос</p>
            <p className="text-lg font-bold">
              {results.input.downPayment.toLocaleString('ru-RU')} ({results.input.downPaymentPercent}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Сумма кредита</p>
            <p className="text-lg font-bold text-blue-400">
              {results.input.principal.toLocaleString('ru-RU')} сум
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Срок</p>
            <p className="text-lg font-bold">
              {results.input.loanTerm} месяцев
            </p>
          </div>
        </div>

        {bestOffer && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-2">✨ Лучшее предложение</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">{bestOffer.name}</span>
              <span className="text-green-400 font-bold">
                {Math.round(bestOffer.monthlyPayment).toLocaleString('ru-RU')} сум/мес
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bank Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          🏦 Предложения банков ({eligibleBanks.length})
        </h3>

        <AnimatePresence>
          {eligibleBanks.map((bank: any, index: number) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <BankCard
                bank={bank}
                isBest={index === 0}
                onSelect={() => handleSelectBank(bank)}
                isSelected={selectedBank?.id === bank.id}
                sending={sending && selectedBank?.id === bank.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ineligible Banks */}
      {results?.results?.ineligible?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-6"
        >
          <h3 className="text-lg font-bold mb-4 text-gray-400">
            ⚠️ Не подходят по условиям
          </h3>
          <div className="space-y-2">
            {results.results.ineligible.map((bank: any) => (
              <div key={bank.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{bank.name}</span>
                <span className="text-gray-500">{bank.reason}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
