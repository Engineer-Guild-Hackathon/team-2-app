export const en = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    map: 'Map',
    list: 'List',
    detail: 'Detail',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    free: 'Free',
    paid: 'Paid'
  },

  // Navigation
  nav: {
    home: 'Home',
    recommendations: 'Recommendations',
    profile: 'Profile',
    settings: 'Settings'
  },

  // Recommendation Page
  recommendations: {
    title: 'Recommendations',
    subtitle: 'Discover places perfect for you',
    todaysRecommendations: 'Today\'s Recommendations',
    nearbyRecommendations: 'Nearby Recommendations',
    categories: {
      all: 'All',
      park: 'Parks',
      museum: 'Museums',
      library: 'Libraries',
      book: 'Books',
      event: 'Events'
    },
    modes: {
      learner: 'Learner Mode',
      family: 'Family Mode'
    },
    distance: 'Distance',
    distanceUnit: 'km',
    openNow: 'Open Now',
    accessibility: 'Accessibility',
    price: 'Price',
    rating: 'Rating'
  },

  // Location
  location: {
    requestPermission: 'Allow Location Access',
    permissionTitle: 'Location Permission',
    permissionMessage: 'Please allow location access to provide better recommendations.',
    permissionDenied: 'Location access denied',
    permissionDeniedMessage: 'You can also set location manually.',
    currentLocation: 'Current Location',
    manualLocation: 'Set Location Manually',
    searchLocation: 'Search Location',
    useCurrentLocation: 'Use Current Location',
    locationError: 'Could not get location',
    locationUnavailable: 'Location service unavailable'
  },

  // Filters
  filters: {
    title: 'Filters',
    distance: {
      title: 'Distance',
      within1km: 'Within 1km',
      within3km: 'Within 3km',
      within5km: 'Within 5km',
      within10km: 'Within 10km'
    },
    category: {
      title: 'Category'
    },
    price: {
      title: 'Price',
      free: 'Free Only',
      paid: 'Include Paid'
    },
    openHours: {
      title: 'Open Hours',
      openNow: 'Open Now',
      openToday: 'Open Today'
    },
    accessibility: {
      title: 'Accessibility',
      strollerFriendly: 'Stroller Friendly',
      wheelchairAccessible: 'Wheelchair Accessible',
      quietArea: 'Quiet Area Available',
      nurseryRoom: 'Nursing Room Available'
    },
    environment: {
      title: 'Environment',
      indoor: 'Indoor',
      outdoor: 'Outdoor',
      rainOk: 'Rain OK'
    },
    clearAll: 'Clear All',
    apply: 'Apply'
  },

  // Sort
  sort: {
    title: 'Sort By',
    relevance: 'Relevance',
    distance: 'Distance',
    rating: 'Rating',
    newest: 'Newest',
    popular: 'Popular'
  },

  // Detail Page
  detail: {
    description: 'Description',
    location: 'Location',
    openHours: 'Opening Hours',
    access: 'Access',
    price: 'Price',
    accessibility: 'Accessibility',
    suggestedActivities: 'Suggested Activities',
    relatedItems: 'Related Items',
    relatedBooks: 'Related Books',
    relatedPlaces: 'Related Places',
    openingCalendar: 'Opening Calendar',
    directions: 'Directions',
    call: 'Call',
    website: 'Website',
    gallery: 'Gallery'
  },

  // Family Mode
  family: {
    mode: 'Family Mode',
    parentTips: 'Parent Tips',
    conversationStarters: 'Conversation Starters',
    safetyNotes: 'Safety Notes',
    whatToBring: 'What to Bring',
    ageAppropriate: 'Age-Appropriate Activities',
    learningOpportunities: 'Learning Opportunities'
  },

  // Empty States
  empty: {
    noResults: 'No results found',
    noResultsMessage: 'Try adjusting your search criteria',
    noLocation: 'No location set',
    noLocationMessage: 'Set your location to see nearby recommendations',
    noRecommendations: 'No recommendations',
    noRecommendationsMessage: 'No recommendations match your criteria'
  },

  // Error States
  error: {
    general: 'An error occurred',
    network: 'Network Error',
    networkMessage: 'Please check your internet connection',
    notFound: 'Not Found',
    notFoundMessage: 'The item you are looking for was not found',
    server: 'Server Error',
    serverMessage: 'Please try again later',
    location: 'Location Error',
    locationMessage: 'Could not get location information'
  },

  // Accessibility
  a11y: {
    skipToContent: 'Skip to content',
    menu: 'Menu',
    closeMenu: 'Close menu',
    openMenu: 'Open menu',
    searchButton: 'Search button',
    filterButton: 'Filter button',
    sortButton: 'Sort button',
    mapButton: 'Map button',
    listButton: 'List button',
    locationButton: 'Location button',
    backButton: 'Back button',
    closeButton: 'Close button',
    imageAlt: 'Image',
    recommendationCard: 'Recommendation card',
    filterModal: 'Filter modal',
    detailModal: 'Detail modal'
  }
} as const;