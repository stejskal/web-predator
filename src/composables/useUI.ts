import { ref, reactive, onMounted } from 'vue'

export function useUI() {
  // Initialize dark mode from localStorage or default to false
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')
  const isLoading = ref(false)
  const notifications = ref<
    Array<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }>
  >([])

  const uiState = reactive({
    // View states
    activeView: 'list', // 'list', 'detail', 'relationships'
    selectedEntityId: null as number | null,
  })

  // Initialize dark mode on mount
  const initializeDarkMode = () => {
    document.documentElement.classList.toggle('dark', isDarkMode.value)
  }

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    document.documentElement.classList.toggle('dark', isDarkMode.value)
    localStorage.setItem('darkMode', isDarkMode.value.toString())
  }

  // View controls
  const setActiveView = (view: 'list' | 'detail' | 'relationships') => {
    uiState.activeView = view
  }

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    const id = Date.now()
    notifications.value.push({ id, message, type })

    setTimeout(
      () => {
        notifications.value = notifications.value.filter(n => n.id !== id)
      },
      type === 'error' ? 5000 : 3000
    ) // Keep error messages longer
  }

  const dismissNotification = (id: number) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    isDarkMode,
    isLoading,
    notifications,
    uiState,

    // Actions
    initializeDarkMode,
    toggleDarkMode,
    setActiveView,
    showNotification,
    dismissNotification,
    setLoading,
  }
}
