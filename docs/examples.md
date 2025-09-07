# Examples

Real-world examples demonstrating various use cases and patterns with **pinia-plugin-storage**.

## 🏪 E-commerce Application

A complete e-commerce store with different persistence strategies for different data types.

```typescript
// stores/ecommerce.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useEcommerceStore = defineStore('ecommerce', () => {
  // User authentication (cookies for server access)
  const authToken = ref('')
  const userId = ref('')
  
  // Shopping cart (localStorage for persistence)
  const cartItems = ref([])
  const cartTotal = computed(() => 
    cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  
  // Search and filters (sessionStorage for session only)
  const searchQuery = ref('')
  const selectedFilters = ref({
    category: '',
    priceRange: [0, 1000],
    inStock: false
  })
  
  // Recently viewed products (indexedDB for large datasets)
  const recentlyViewed = ref([])
  const viewedProductsCache = ref(new Map())
  
  // User preferences (localStorage for persistence)
  const userPreferences = ref({
    theme: 'light',
    language: 'en',
    currency: 'USD',
    newsletter: false
  })
  
  // Actions
  const addToCart = (product) => {
    const existing = cartItems.value.find(item => item.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      cartItems.value.push({ ...product, quantity: 1 })
    }
  }
  
  const removeFromCart = (productId) => {
    const index = cartItems.value.findIndex(item => item.id === productId)
    if (index > -1) {
      cartItems.value.splice(index, 1)
    }
  }
  
  const addToRecentlyViewed = (product) => {
    // Remove if already exists
    const index = recentlyViewed.value.findIndex(p => p.id === product.id)
    if (index > -1) {
      recentlyViewed.value.splice(index, 1)
    }
    
    // Add to beginning
    recentlyViewed.value.unshift(product)
    
    // Keep only last 50 items
    if (recentlyViewed.value.length > 50) {
      recentlyViewed.value = recentlyViewed.value.slice(0, 50)
    }
  }
  
  const login = (token, id) => {
    authToken.value = token
    userId.value = id
  }
  
  const logout = () => {
    authToken.value = ''
    userId.value = ''
    cartItems.value = []
  }
  
  return {
    // Auth
    authToken, userId, login, logout,
    // Cart
    cartItems, cartTotal, addToCart, removeFromCart,
    // Search
    searchQuery, selectedFilters,
    // Recently viewed
    recentlyViewed, addToRecentlyViewed, viewedProductsCache,
    // Preferences
    userPreferences
  }
}, {
  storage: {
    namespace: 'ecommerce-app',
    version: '2.1',
    debounceDelayMs: 150,
    buckets: [
      // Authentication - cookies for server access
      {
        adapter: 'cookies',
        key: 'auth',
        include: ['authToken', 'userId'],
        debounceDelayMs: 0, // Immediate for auth
        options: {
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
          path: '/'
        },
        beforeHydrate: (slice) => {
          // Validate token format
          if (slice.authToken && !isValidJWT(slice.authToken)) {
            return { authToken: '', userId: '' }
          }
          return slice
        }
      },
      
      // Shopping cart - localStorage for persistence
      {
        adapter: 'localStorage',
        key: 'cart',
        include: ['cartItems'],
        debounceDelayMs: 300,
        beforeHydrate: (slice) => {
          // Validate cart items structure
          if (slice.cartItems && Array.isArray(slice.cartItems)) {
            slice.cartItems = slice.cartItems.filter(item => 
              item.id && item.price && item.quantity > 0
            )
          }
          return slice
        }
      },
      
      // Search state - sessionStorage for session only
      {
        adapter: 'sessionStorage',
        key: 'search',
        include: ['searchQuery', 'selectedFilters'],
        debounceDelayMs: 100,
        beforeHydrate: (slice) => {
          // Reset search on new session if older than 1 hour
          const timestamp = slice.searchTimestamp
          if (timestamp && Date.now() - timestamp > 3600000) {
            return {
              searchQuery: '',
              selectedFilters: {
                category: '',
                priceRange: [0, 1000],
                inStock: false
              }
            }
          }
          return slice
        }
      },
      
      // Recently viewed - indexedDB for large datasets
      {
        adapter: 'indexedDB',
        key: 'history',
        include: ['recentlyViewed', 'viewedProductsCache'],
        debounceDelayMs: 500,
        options: {
          dbName: 'EcommerceApp',
          storeName: 'userHistory',
          dbVersion: 1
        },
        beforeHydrate: (slice) => {
          // Convert Map back from stored object
          if (slice.viewedProductsCache && typeof slice.viewedProductsCache === 'object') {
            slice.viewedProductsCache = new Map(Object.entries(slice.viewedProductsCache))
          }
          return slice
        }
      },
      
      // User preferences - localStorage for persistence
      {
        adapter: 'localStorage',
        key: 'preferences',
        include: ['userPreferences'],
        debounceDelayMs: 200,
        beforeHydrate: (slice) => {
          // Merge with defaults
          const defaults = {
            theme: 'light',
            language: 'en',
            currency: 'USD',
            newsletter: false
          }
          return {
            userPreferences: { ...defaults, ...slice.userPreferences }
          }
        }
      }
    ],
    
    onError: (error, ctx) => {
      console.warn(`🛒 E-commerce storage error:`, error, ctx)
      
      // Handle specific errors
      switch (ctx.adapter) {
        case 'cookies':
          if (ctx.operation === 'write') {
            console.warn('Cookie storage failed - user might have cookies disabled')
            // Fallback to localStorage for auth
            localStorage.setItem('fallback-auth', JSON.stringify({ authToken: '', userId: '' }))
          }
          break
          
        case 'localStorage':
          if (ctx.key?.includes('cart')) {
            // Show user notification about cart not being saved
            showNotification('Warning: Shopping cart not saved due to storage limits')
          }
          break
          
        case 'indexedDB':
          if (ctx.operation === 'write') {
            // Fallback to localStorage for recently viewed
            console.warn('IndexedDB failed, falling back to localStorage')
            // Could implement fallback logic here
          }
          break
      }
      
      // Send to analytics/error tracking
      analytics.track('storage_error', {
        adapter: ctx.adapter,
        stage: ctx.stage,
        operation: ctx.operation,
        storeId: ctx.storeId
      })
    }
  }
})

// Helper function
function isValidJWT(token: string): boolean {
  try {
    const parts = token.split('.')
    return parts.length === 3 && JSON.parse(atob(parts[1])).exp > Date.now() / 1000
  } catch {
    return false
  }
}
```

## 📱 Social Media App

Multi-user social media application with user-specific storage.

```typescript
// stores/social.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useSocialStore = defineStore('social', () => {
  // Current user
  const currentUser = ref(null)
  
  // Posts and timeline
  const timeline = ref([])
  const userPosts = ref([])
  const drafts = ref([])
  
  // Social interactions
  const friends = ref([])
  const notifications = ref([])
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  
  // App state
  const lastSyncTime = ref(null)
  const offlineQueue = ref([])
  const appSettings = ref({
    theme: 'auto',
    notifications: true,
    autoPlay: false,
    dataUsage: 'standard'
  })
  
  // Actions
  const setUser = (user) => {
    currentUser.value = user
  }
  
  const addPost = (post) => {
    userPosts.value.unshift({
      ...post,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      author: currentUser.value.id
    })
  }
  
  const saveDraft = (draft) => {
    const existingIndex = drafts.value.findIndex(d => d.id === draft.id)
    if (existingIndex > -1) {
      drafts.value[existingIndex] = draft
    } else {
      drafts.value.push({ ...draft, id: Date.now() })
    }
  }
  
  const addToOfflineQueue = (action) => {
    offlineQueue.value.push({
      ...action,
      timestamp: Date.now()
    })
  }
  
  return {
    currentUser, setUser,
    timeline, userPosts, drafts, addPost, saveDraft,
    friends, notifications, unreadCount,
    lastSyncTime, offlineQueue, addToOfflineQueue,
    appSettings
  }
}, {
  storage: {
    namespace: 'social-app',
    version: '3.2',
    buckets: [
      // User session - sessionStorage (auto-logout on tab close)
      {
        adapter: 'sessionStorage',
        key: 'session',
        include: ['currentUser', 'lastSyncTime'],
        debounceDelayMs: 0,
        beforeHydrate: (slice) => {
          // Check if session is still valid
          if (slice.currentUser && slice.lastSyncTime) {
            const timeDiff = Date.now() - new Date(slice.lastSyncTime).getTime()
            if (timeDiff > 8 * 60 * 60 * 1000) { // 8 hours
              return { currentUser: null, lastSyncTime: null }
            }
          }
          return slice
        }
      },
      
      // User content - indexedDB (can be large)
      {
        adapter: 'indexedDB',
        key: 'content',
        include: ['userPosts', 'drafts', 'friends'],
        debounceDelayMs: 1000, // Less frequent saves for large data
        options: {
          dbName: 'SocialApp',
          storeName: 'userContent',
          dbVersion: 2
        },
        beforeHydrate: (slice) => {
          // Filter out old drafts (older than 30 days)
          if (slice.drafts) {
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
            slice.drafts = slice.drafts.filter(draft => 
              new Date(draft.createdAt).getTime() > thirtyDaysAgo
            )
          }
          return slice
        }
      },
      
      // Offline queue - localStorage (reliable persistence)
      {
        adapter: 'localStorage', 
        key: 'offline',
        include: ['offlineQueue'],
        debounceDelayMs: 100, // Quick saves for offline actions
        beforeHydrate: (slice) => {
          // Remove old queued actions (older than 7 days)
          if (slice.offlineQueue) {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
            slice.offlineQueue = slice.offlineQueue.filter(action => 
              action.timestamp > weekAgo
            )
          }
          return slice
        }
      },
      
      // App settings - localStorage (user preferences)
      {
        adapter: 'localStorage',
        key: 'settings',
        include: ['appSettings'],
        debounceDelayMs: 300,
        beforeHydrate: (slice) => {
          // Merge with defaults and validate
          const defaults = {
            theme: 'auto',
            notifications: true,
            autoPlay: false,
            dataUsage: 'standard'
          }
          
          const settings = { ...defaults, ...slice.appSettings }
          
          // Validate enum values
          if (!['light', 'dark', 'auto'].includes(settings.theme)) {
            settings.theme = 'auto'
          }
          if (!['low', 'standard', 'high'].includes(settings.dataUsage)) {
            settings.dataUsage = 'standard'
          }
          
          return { appSettings: settings }
        }
      },
      
      // Notifications - sessionStorage (session-specific)
      {
        adapter: 'sessionStorage',
        key: 'notifications',
        include: ['notifications'],
        debounceDelayMs: 200,
        beforeHydrate: (slice) => {
          // Remove old notifications (older than 1 day)
          if (slice.notifications) {
            const dayAgo = Date.now() - 24 * 60 * 60 * 1000
            slice.notifications = slice.notifications.filter(notification =>
              new Date(notification.timestamp).getTime() > dayAgo
            )
          }
          return slice
        }
      }
    ],
    
    onError: (error, ctx) => {
      console.error(`📱 Social app storage error:`, error, ctx)
      
      // Different handling per bucket
      if (ctx.key === 'content' && ctx.adapter === 'indexedDB') {
        // Critical user content - try localStorage fallback
        console.warn('IndexedDB failed for user content, attempting localStorage fallback')
        try {
          const fallbackKey = `social-app-fallback-${ctx.storeId}`
          if (ctx.operation === 'write') {
            localStorage.setItem(fallbackKey, JSON.stringify({ error: 'IndexedDB unavailable' }))
          }
        } catch {
          console.error('Fallback storage also failed')
        }
      }
      
      // Send error telemetry
      if (window.analytics) {
        window.analytics.track('storage_error', {
          app: 'social',
          adapter: ctx.adapter,
          key: ctx.key,
          stage: ctx.stage,
          userId: currentUser.value?.id
        })
      }
    }
  }
})
```

## 🎮 Gaming Application

Gaming app with high-frequency updates and complex state management.

```typescript
// stores/game.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', () => {
  // Player data (persistent across sessions)
  const playerProfile = ref({
    username: '',
    level: 1,
    experience: 0,
    coins: 0,
    achievements: [],
    statistics: {
      gamesPlayed: 0,
      totalScore: 0,
      highScore: 0,
      playTime: 0
    }
  })
  
  // Game state (temporary, session-only)
  const currentGame = ref({
    isPlaying: false,
    score: 0,
    lives: 3,
    level: 1,
    startTime: null,
    isPaused: false
  })
  
  // Settings (persistent)
  const gameSettings = ref({
    soundEnabled: true,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    difficulty: 'normal',
    graphics: 'high',
    controls: {
      moveLeft: 'ArrowLeft',
      moveRight: 'ArrowRight',
      jump: 'Space',
      pause: 'Escape'
    }
  })
  
  // Save data (complex, needs compression)
  const saveData = ref({
    worlds: [],
    inventory: [],
    quests: [],
    companions: []
  })
  
  // High scores and leaderboards (indexedDB for large datasets)
  const scores = ref([])
  const leaderboard = ref([])
  
  // Computed
  const nextLevelXP = computed(() => playerProfile.value.level * 1000)
  const experienceProgress = computed(() => 
    (playerProfile.value.experience % 1000) / 1000
  )
  
  // Actions
  const startGame = () => {
    currentGame.value = {
      isPlaying: true,
      score: 0,
      lives: 3,
      level: 1,
      startTime: Date.now(),
      isPaused: false
    }
  }
  
  const updateScore = (points) => {
    currentGame.value.score += points
    if (currentGame.value.score > playerProfile.value.statistics.highScore) {
      playerProfile.value.statistics.highScore = currentGame.value.score
    }
  }
  
  const endGame = () => {
    const gameTime = Date.now() - currentGame.value.startTime
    
    // Update player statistics
    playerProfile.value.statistics.gamesPlayed++
    playerProfile.value.statistics.totalScore += currentGame.value.score
    playerProfile.value.statistics.playTime += gameTime
    
    // Add experience
    const expGained = Math.floor(currentGame.value.score / 100)
    playerProfile.value.experience += expGained
    
    // Level up logic
    while (playerProfile.value.experience >= nextLevelXP.value) {
      playerProfile.value.level++
      playerProfile.value.coins += 100 // Level up reward
    }
    
    // Save score
    scores.value.push({
      score: currentGame.value.score,
      date: new Date().toISOString(),
      level: currentGame.value.level,
      gameTime
    })
    
    // Reset game state
    currentGame.value.isPlaying = false
  }
  
  return {
    playerProfile, currentGame, gameSettings, saveData,
    scores, leaderboard,
    nextLevelXP, experienceProgress,
    startGame, updateScore, endGame
  }
}, {
  storage: {
    namespace: 'epic-game',
    version: '4.1',
    buckets: [
      // Player profile - localStorage (important persistent data)
      {
        adapter: 'localStorage',
        key: 'player',
        include: ['playerProfile'],
        debounceDelayMs: 2000, // Less frequent saves to avoid performance impact
        beforeHydrate: (slice) => {
          // Validate and migrate player data
          if (slice.playerProfile) {
            const profile = slice.playerProfile
            
            // Ensure required fields exist
            if (!profile.statistics) {
              profile.statistics = {
                gamesPlayed: 0,
                totalScore: 0,
                highScore: 0,
                playTime: 0
              }
            }
            
            if (!profile.achievements) {
              profile.achievements = []
            }
            
            // Data validation
            profile.level = Math.max(1, profile.level || 1)
            profile.experience = Math.max(0, profile.experience || 0)
            profile.coins = Math.max(0, profile.coins || 0)
          }
          
          return slice
        }
      },
      
      // Game settings - localStorage (user preferences)
      {
        adapter: 'localStorage',
        key: 'settings',
        include: ['gameSettings'],
        debounceDelayMs: 500,
        beforeHydrate: (slice) => {
          // Merge with defaults
          const defaults = {
            soundEnabled: true,
            musicVolume: 0.7,
            sfxVolume: 0.8,
            difficulty: 'normal',
            graphics: 'high',
            controls: {
              moveLeft: 'ArrowLeft',
              moveRight: 'ArrowRight',
              jump: 'Space',
              pause: 'Escape'
            }
          }
          
          const settings = { ...defaults, ...slice.gameSettings }
          
          // Validate ranges
          settings.musicVolume = Math.max(0, Math.min(1, settings.musicVolume))
          settings.sfxVolume = Math.max(0, Math.min(1, settings.sfxVolume))
          
          return { gameSettings: settings }
        }
      },
      
      // Save data - indexedDB (large, complex data)
      {
        adapter: 'indexedDB',
        key: 'savedata',
        include: ['saveData'],
        debounceDelayMs: 5000, // Infrequent saves for large data
        options: {
          dbName: 'EpicGame',
          storeName: 'playerSaves',
          dbVersion: 3
        },
        beforeHydrate: (slice) => {
          // Decompress and validate save data
          if (slice.saveData) {
            // Validate data structure
            const saveData = slice.saveData
            
            if (!Array.isArray(saveData.worlds)) saveData.worlds = []
            if (!Array.isArray(saveData.inventory)) saveData.inventory = []
            if (!Array.isArray(saveData.quests)) saveData.quests = []
            if (!Array.isArray(saveData.companions)) saveData.companions = []
            
            // Remove invalid entries
            saveData.inventory = saveData.inventory.filter(item => 
              item.id && item.name && typeof item.quantity === 'number'
            )
          }
          
          return slice
        }
      },
      
      // Scores and leaderboard - indexedDB (large datasets)
      {
        adapter: 'indexedDB',
        key: 'scores',
        include: ['scores', 'leaderboard'],
        debounceDelayMs: 1000,
        options: {
          dbName: 'EpicGame',
          storeName: 'gameScores',
          dbVersion: 1
        },
        beforeHydrate: (slice) => {
          // Keep only recent scores (last 1000)
          if (slice.scores && slice.scores.length > 1000) {
            slice.scores = slice.scores
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 1000)
          }
          
          return slice
        }
      },
      
      // Current game state - sessionStorage (temporary)
      {
        adapter: 'sessionStorage',
        key: 'current-game',
        include: ['currentGame'],
        debounceDelayMs: 100, // Quick saves for game state
        beforeHydrate: (slice) => {
          // Don't restore active games (prevent weird states)
          if (slice.currentGame && slice.currentGame.isPlaying) {
            return {
              currentGame: {
                isPlaying: false,
                score: 0,
                lives: 3,
                level: 1,
                startTime: null,
                isPaused: false
              }
            }
          }
          return slice
        }
      }
    ],
    
    onError: (error, ctx) => {
      console.error(`🎮 Game storage error:`, error, ctx)
      
      // Critical error handling
      if (ctx.key === 'player' || ctx.key === 'savedata') {
        // Player data is critical - show warning
        showGameNotification(`Warning: Unable to save ${ctx.key} data`, 'error')
        
        // Try to create emergency backup
        try {
          const backupKey = `game-backup-${ctx.key}-${Date.now()}`
          const currentData = getCurrentStoreData(ctx.storeId, ctx.key)
          localStorage.setItem(backupKey, JSON.stringify(currentData))
          console.log(`Emergency backup created: ${backupKey}`)
        } catch {
          console.error('Emergency backup failed')
        }
      }
      
      // Performance monitoring
      if (ctx.adapter === 'indexedDB' && ctx.operation === 'write') {
        console.warn('IndexedDB write performance issue detected')
        // Could implement fallback or show performance warning
      }
      
      // Send to game analytics
      gameAnalytics.track('storage_error', {
        error_type: ctx.adapter,
        error_stage: ctx.stage,
        error_operation: ctx.operation,
        player_level: playerProfile.value.level,
        session_id: getCurrentSessionId()
      })
    }
  }
})

// Helper functions
function showGameNotification(message: string, type: 'info' | 'error' | 'warning') {
  // Implementation depends on your UI framework
  console.log(`[${type.toUpperCase()}] ${message}`)
}

function getCurrentStoreData(storeId: string, key: string) {
  // Get current store data for backup
  const store = getStoreById(storeId)
  return store ? store.$state : {}
}

function getCurrentSessionId(): string {
  // Implementation depends on your session management
  return 'session-' + Date.now()
}
```

## 📊 Analytics Dashboard

Analytics application with real-time data and caching strategies.

```typescript
// stores/analytics.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAnalyticsStore = defineStore('analytics', () => {
  // Dashboard configuration (persistent)
  const dashboardConfig = ref({
    layout: 'grid',
    widgets: [],
    dateRange: '7d',
    refreshInterval: 30000,
    theme: 'light'
  })
  
  // Data cache (large, temporary)
  const dataCache = ref(new Map())
  const chartData = ref({})
  const reports = ref([])
  
  // User session (temporary)
  const currentView = ref('overview')
  const selectedMetrics = ref([])
  const filters = ref({})
  
  // Offline support
  const pendingRequests = ref([])
  const lastSyncTimestamp = ref(null)
  
  return {
    dashboardConfig, dataCache, chartData, reports,
    currentView, selectedMetrics, filters,
    pendingRequests, lastSyncTimestamp
  }
}, {
  storage: {
    namespace: 'analytics-dashboard',
    version: '2.3',
    buckets: [
      // Dashboard config - localStorage (user customization)
      {
        adapter: 'localStorage',
        key: 'config',
        include: ['dashboardConfig'],
        debounceDelayMs: 1000,
        beforeHydrate: (slice) => {
          const config = slice.dashboardConfig
          if (config) {
            // Validate widget configurations
            if (config.widgets) {
              config.widgets = config.widgets.filter(widget => 
                widget.type && widget.id && widget.position
              )
            }
            
            // Validate date range
            const validRanges = ['1d', '7d', '30d', '90d', '1y']
            if (!validRanges.includes(config.dateRange)) {
              config.dateRange = '7d'
            }
          }
          return slice
        }
      },
      
      // Data cache - indexedDB (large datasets)
      {
        adapter: 'indexedDB',
        key: 'cache',
        include: ['dataCache', 'chartData'],
        debounceDelayMs: 2000,
        options: {
          dbName: 'AnalyticsDashboard',
          storeName: 'dataCache',
          dbVersion: 1
        },
        beforeHydrate: (slice) => {
          // Convert Map back from storage
          if (slice.dataCache && typeof slice.dataCache === 'object') {
            slice.dataCache = new Map(Object.entries(slice.dataCache))
          }
          
          // Clean old cache entries (older than 1 hour)
          if (slice.dataCache instanceof Map) {
            const oneHourAgo = Date.now() - 60 * 60 * 1000
            for (const [key, value] of slice.dataCache.entries()) {
              if (value.timestamp < oneHourAgo) {
                slice.dataCache.delete(key)
              }
            }
          }
          
          return slice
        }
      },
      
      // Session state - sessionStorage
      {
        adapter: 'sessionStorage',
        key: 'session',
        include: ['currentView', 'selectedMetrics', 'filters'],
        debounceDelayMs: 200
      },
      
      // Offline requests - localStorage (reliable persistence)
      {
        adapter: 'localStorage',
        key: 'offline',
        include: ['pendingRequests', 'lastSyncTimestamp'],
        debounceDelayMs: 100,
        beforeHydrate: (slice) => {
          // Remove old pending requests (older than 24 hours)
          if (slice.pendingRequests) {
            const dayAgo = Date.now() - 24 * 60 * 60 * 1000
            slice.pendingRequests = slice.pendingRequests.filter(req =>
              req.timestamp > dayAgo
            )
          }
          return slice
        }
      }
    ],
    
    onError: (error, ctx) => {
      console.error(`📊 Analytics storage error:`, error, ctx)
      
      // Handle cache errors gracefully
      if (ctx.key === 'cache') {
        console.warn('Data cache storage failed - using memory-only cache')
        // Could implement memory-only fallback
      }
      
      // Track storage health
      analytics.track('storage_health', {
        adapter: ctx.adapter,
        error_type: error.name,
        operation: ctx.operation,
        timestamp: Date.now()
      })
    }
  }
})
```

## 🎨 Best Practices from Examples

### 1. **Bucket Strategy**
- Use **cookies** for server-accessible data (auth tokens)
- Use **localStorage** for important persistent data (user preferences, cart)
- Use **sessionStorage** for temporary session data (search state, current view)
- Use **indexedDB** for large datasets (cache, user content, complex objects)

### 2. **Error Handling**
- Always provide meaningful error handlers
- Implement fallback strategies for critical data
- Log errors to analytics/monitoring services
- Show user-friendly notifications for critical failures

### 3. **Performance Optimization**
- Use appropriate debounce delays per adapter
- Higher delays for large data (indexedDB)
- Lower delays for critical data (auth, current state)
- Clean up old data during hydration

### 4. **Data Validation**
- Always validate data structure in `beforeHydrate`
- Provide sensible defaults for missing properties
- Filter out invalid/corrupted entries
- Handle schema migrations gracefully

### 5. **Security Considerations**
- Never store sensitive data in plaintext
- Use secure cookie settings in production
- Validate data before hydration
- Clear sensitive data on logout

These examples demonstrate real-world patterns that you can adapt for your specific use cases.
