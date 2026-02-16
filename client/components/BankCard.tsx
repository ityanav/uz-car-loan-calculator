'use client'

import { motion } from 'framer-motion'

interface BankCardProps {
  bank: any
  isBest: boolean
  onSelect: () => void
  isSelected: boolean
  sending: boolean
}

export default function BankCard({ bank, isBest, onSelect, isSelected, sending }: BankCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-3xl p-6
        ${isBest
          ? 'bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 border-2 border-green-400/50'
          : 'glass-card'
        }
        transition-all duration-300
        ${isSelected ? 'ring-4 ring-blue-500/50' : ''}
      `}
    >
      {/* Best Badge */}
      {isBest && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-green-500/50">
          <span>✓</span>
          <span>ЛУЧШЕЕ</span>
        </div>
      )}

      {/* Bank Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
            {bank.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold">{bank.name}</h3>
            <p className="text-sm text-gray-400">{bank.description}</p>
          </div>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="mb-4 p-3 rounded-2xl glass-card-light">
        <p className="text-sm text-gray-400 mb-1">Процентная ставка</p>
        <p className="text-2xl font-bold text-blue-400">{bank.interestRate}%</p>
      </div>

      {/* Payment Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-2xl glass-card-light">
          <p className="text-xs text-gray-400 mb-1">Ежемесячный платеж</p>
          <p className="text-lg font-bold text-green-400">
            {Math.round(bank.monthlyPayment).toLocaleString('ru-RU')}
            <span className="text-xs text-gray-400 ml-1">сум</span>
          </p>
        </div>

        <div className="p-3 rounded-2xl glass-card-light">
          <p className="text-xs text-gray-400 mb-1">Общая выплата</p>
          <p className="text-lg font-bold">
            {Math.round(bank.totalPayment).toLocaleString('ru-RU')}
            <span className="text-xs text-gray-400 ml-1">сум</span>
          </p>
        </div>

        <div className="p-3 rounded-2xl glass-card-light col-span-2">
          <p className="text-xs text-gray-400 mb-1">Переплата</p>
          <p className="text-xl font-bold text-orange-400">
            {Math.round(bank.overpayment).toLocaleString('ru-RU')}
            <span className="text-xs text-gray-400 ml-1">сум</span>
          </p>
        </div>
      </div>

      {/* Features */}
      {bank.features && bank.features.length > 0 && (
        <div className="mb-4 space-y-2">
          {bank.features.slice(0, 3).map((feature: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contact */}
      {bank.contactPhone && (
        <div className="mb-4 text-sm text-gray-400">
          📞 {bank.contactPhone}
        </div>
      )}

      {/* Select Button */}
      <motion.button
        onClick={onSelect}
        disabled={sending}
        whileTap={{ scale: 0.95 }}
        className={`
          w-full py-3 rounded-2xl font-bold text-white transition-all
          ${isBest
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30'
            : 'btn-gradient'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        `}
      >
        {sending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Отправка...</span>
          </>
        ) : isSelected ? (
          <>
            <span>✓</span>
            <span>Заявка отправлена</span>
          </>
        ) : (
          <>
            <span>📤</span>
            <span>Выбрать банк</span>
          </>
        )}
      </motion.button>
    </motion.div>
  )
}
