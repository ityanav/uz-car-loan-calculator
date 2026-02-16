import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Uz Car Loan Calculator | Калькулятор автокредитов',
  description: 'Рассчитайте автокредит от ТОП-5 банков Узбекистана. Сравните условия и найдите лучшее предложение!',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
