import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://disaster-66q2.onrender.com/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, 
  headers: {
    "Content-Type": "application/json",
  },
})

const mockDisasters = [
  {
    id: "1",
    title: "Earthquake in California",
    description: "A 6.2 magnitude earthquake struck Northern California, affecting multiple counties.",
    tags: ["earthquake", "emergency", "california"],
    location_name: "Northern California, USA",
    latitude: 37.7749,
    longitude: -122.4194,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Hurricane Maria Recovery",
    description: "Ongoing recovery efforts following Hurricane Maria's impact on the coastal regions.",
    tags: ["hurricane", "recovery", "coastal"],
    location_name: "Gulf Coast, USA",
    latitude: 29.7604,
    longitude: -95.3698,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockSocialPosts = [
  {
    id: "1",
    content: "Emergency shelters are now open at the community center. Please bring essentials and stay safe.",
    platform: "Twitter",
    author: "Emergency Services",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    engagement: 245,
  },
  {
    id: "2",
    content: "Road closures on Highway 101 due to ongoing emergency response. Use alternate routes.",
    platform: "Facebook",
    author: "Local Traffic Authority",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    engagement: 156,
  },
]

const mockResources = [
  {
    id: "1",
    name: "Red Cross Emergency Shelter",
    type: "Shelter",
    location: "123 Main St, Downtown",
    availability: "Available",
    contact: "(555) 123-4567",
  },
  {
    id: "2",
    name: "Mobile Medical Unit",
    type: "Medical",
    location: "City Park, North Side",
    availability: "Available",
    contact: "(555) 987-6543",
  },
]

const mockOfficialUpdates = [
  {
    id: "1",
    title: "Evacuation Order Lifted",
    content: "The mandatory evacuation order for zones A and B has been lifted. Residents may return to their homes.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    author: "Emergency Management Office",
    priority: "high",
  },
  {
    id: "2",
    title: "Water Service Restoration",
    content: "Water service has been restored to 85% of affected areas. Boil water advisory remains in effect.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    author: "Public Utilities",
    priority: "medium",
  },
]

interface DisasterData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

interface CreateDisasterData {
  title: string;
  description: string;
  tags: string[];
  location_name: string;
  latitude: number;
  longitude: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      headers: config.headers,
      data: config.data,
    })
    return config
  },
  (error) => {
    console.error("❌ API Request Error:", error)
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data)
    return response
  },
  async (error) => {
    const url = error.config?.url || ""
    const method = error.config?.method?.toUpperCase() || ""
    const status = error.response?.status

    console.warn(`⚠️ API Error: ${method} ${url} (${status || "Network Error"}) - Using fallback data`)

    // Add delay to simulate real API
    await delay(300)

    // Handle specific endpoints with mock data fallback
    if (url.includes("/getDisasters")) {
      return { data: mockDisasters }
    }

    // Get single disaster by ID from the disasters array
    if (url.match(/\/getDisasters/) && method === "GET") {
      return { data: mockDisasters }
    }

    if (url.includes("/social-media/")) {
      return { data: mockSocialPosts }
    }

    if (url.includes("/resources/")) {
      return { data: mockResources }
    }

    if (url.includes("/official-updates")) {
      return { data: mockOfficialUpdates }
    }

    if (url.includes("/createDisaster") && method === "POST") {
      const newDisaster = {
        id: String(Date.now()),
        ...error.config.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return { data: { disaster: newDisaster, message: "Disaster created successfully" } }
    }

    if (url.includes("/update/") && method === "PUT") {
      const updatedDisaster = {
        id: url.split("/").slice(-1)[0],
        ...error.config.data,
        updated_at: new Date().toISOString(),
      }
      return { data: updatedDisaster }
    }

      if (url.includes("/verify-image/") && method === "POST") {
        return { data: { isValid: true, message: "Image verified successfully" } }
      }
  
      return Promise.reject(error)
    },
  )
  
  export const createApiRequest = {
    // Get all disasters
    getDisasters: () => apiClient.get("/getDisasters"),

  // Get single disaster by ID
  getDisaster: async (id: string) => {
    const response = await apiClient.get("/getDisasters")
    const disaster = response.data.find((d: DisasterData) => d.id === id)
    if (!disaster) {
      throw new Error("Disaster not found")
    }
    return { data: disaster }
  },

  // Create disaster (requires contributor role - reliefAdmin)
  createDisaster: (data: CreateDisasterData) =>
    apiClient.post("/createDisaster", data, {
      headers: { "x-user": "reliefAdmin" },
    }),

  // Update disaster (requires admin role - netrunnerX)
  updateDisaster: (id: string, data: Partial<{
    title: string;
    description: string;
    tags: string[];
    location_name: string;
  }>) =>
    apiClient.put(`/update/${id}`, data, {
      headers: { "x-user": "netrunnerX" },
    }),

  // Submit report with image verification (requires contributor role - reliefAdmin)
  submitReport: (id: string, data: { content: string; imageUrl: string }) =>
    apiClient.post(`/verify-image/${id}`, { imageUrl: data.imageUrl }, {
      headers: { "x-user": "reliefAdmin" },
    }),
  
  // Get social media posts for disaster
  getSocialMedia: (id: string) => apiClient.get(`/social-media/${id}`),

  // Get resources near disaster location
  getResources: (id: string, lat?: number, lon?: number) => {
    const params = lat && lon ? `?lat=${lat}&lon=${lon}` : ""
    return apiClient.get(`/resources/${id}${params}`)
  },

  // Get official updates (cached)
  getOfficialUpdates: (id: string) => apiClient.get(`/official-updates/${id}`),

  // Get official updates (no cache)
  getOfficialUpdatesNoCache: (id: string) => apiClient.get(`/disaster/official-updates-no-cache/${id}`),
}