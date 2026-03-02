import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Предотвращаем дефолтное открытие файлов при drag-drop на страницу
document.addEventListener('dragover', (e) => {
  e.preventDefault()
})
document.addEventListener('drop', (e) => {
  e.preventDefault()
  console.log('[global drop]', e.dataTransfer?.files?.length, 'files')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
