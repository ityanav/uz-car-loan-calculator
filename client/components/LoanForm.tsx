'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { toast } from 'sonner'

interface LoanFormProps {
  onCalculate: (results: any) => void
  telegram: any
}

export default function LoanForm({ onCalculate, telegram }: LoanFormProps) {
  const [loading, setLoading] = useState(false)
  const [currencyRates, setCurrencyRates] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    carPrice: '',
    downPayment: '',
    currency: 'UZS',
    loanTerm: '36',
    isWorking: true,
  })

  useEffect(() => {
    // Get user data from Telegram
    if (telegram?.initDataUnsafe?.user) {
      const user = telegram.initDataUnsafe.user
      setFormData(prev => ({
        ...prev,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        username: user.username || 'unknown',
      }))
    }

    // Load currency rates
    loadCurrencyRates()
  }, [telegram])

  const loadCurrencyRates = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/currency')
      setCurrencyRates(response.data.data)
    } catch (error) {
      console.error('Error loading rates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:3000/api/calculate', {
        ...formData,
        carPrice: parseFloat(formData.carPrice),
        downPayment: parseFloat(formData.downPayment),
        loanTerm: parseInt(formData.loanTerm),
      })

      if (response.data.success) {
        onCalculate(response.data.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка расчета')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="glass-card rounded-3xl p-6 md:p-8 space-y-6"
    >
      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Имя
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500"
          placeholder="Введите ваше имя"
        />
      </div>

      {/* Car Price Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Стоимость автомобиля
        </label>
        <div className="relative">
          <input
            type="number"
            name="carPrice"
            value={formData.carPrice}
            onChange={handleInputChange}
            required
            min="0"
            step={formData.currency === 'USD' ? '100' : '1000000'}
            className="w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 pr-20"
            placeholder={formData.currency === 'USD' ? '10000' : '100000000'}
          />
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-gradient-primary text-white font-medium cursor-pointer"
          >
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>
        </div>
        {currencyRates && (
          <p className="mt-2 text-xs text-gray-400">
            Курс USD: {currencyRates.USD?.toLocaleString('ru-RU')} сум
          </p>
        )}
      </div>

      {/* Down Payment Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Первоначальный взнос
        </label>
        <input
          type="number"
          name="downPayment"
          value={formData.downPayment}
          onChange={handleInputChange}
          required
          min="0"
          step={formData.currency === 'USD' ? '100' : '1000000'}
          className="w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500"
          placeholder={formData.currency === 'USD' ? '2000' : '20000000'}
        />
      </div>

      {/* Loan Term Select */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Срок кредита
        </label>
        <select
          name="loanTerm"
          value={formData.loanTerm}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="12">12 месяцев</option>
          <option value="24">24 месяца</option>
          <option value="36">36 месяцев</option>
          <option value="48">48 месяцев</option>
          <option value="60">60 месяцев</option>
          <option value="72">72 месяца</option>
        </select>
      </div>

      {/* Working Status Toggle */}
      <div className="glass-card-light rounded-2xl p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-200">
            Работаете?
          </span>
          <div className="relative">
            <input
              type="checkbox"
              name="isWorking"
              checked={formData.isWorking}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, isWorking: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-gray-700 rounded-full peer peer-checked:bg-gradient-primary transition-all"></div>
            <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
          </div>
        </label>
        <p className="text-xs text-gray-400 mt-2">
          {formData.isWorking
            ? 'Ставка будет ниже при подтверждении дохода'
            : 'Ставка будет выше без подтверждения дохода'}
        </p>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileTap={{ scale: 0.98 }}
        className="w-full btn-gradient text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Расчет...
          </>
        ) : (
          <>
            <span>🔍</span>
            Рассчитать кредит
          </>
        )}
      </motion.button>
    </motion.form>
  )
}
