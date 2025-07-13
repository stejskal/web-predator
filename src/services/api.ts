import axios, { AxiosResponse } from 'axios'
import type {
  EntityResponse,
  CreateEntityRequest,
  UpdateEntityRequest,
  RelationshipResponse,
  EntityWithRelationshipsResponse,
  SearchParams,
  ErrorResponse,
  SchemaResponse,
  SimilarIngredientResponse,
  FindSimilarIngredientsRequest,
  ExtractRecipeFromUrlRequest,
  ExtractRecipeFromTextRequest,
  ExtractedRecipeResponse,
} from '@/types/api'

// Configure axios instance
const api = axios.create({
  baseURL: 'https://autotroph.onrender.com/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export class ApiService {
  // Entity CRUD operations
  static async getAllEntities(): Promise<EntityResponse[]> {
    const response: AxiosResponse<EntityResponse[]> = await api.get('/entities')
    return response.data
  }

  static async getEntityById(id: number): Promise<EntityResponse> {
    const response: AxiosResponse<EntityResponse> = await api.get(`/entities/${id}`)
    return response.data
  }

  static async searchEntities(params: SearchParams): Promise<EntityResponse[]> {
    const response: AxiosResponse<EntityResponse[]> = await api.get('/entities/search', {
      params,
    })
    return response.data
  }

  static async createEntity(entity: CreateEntityRequest): Promise<EntityResponse> {
    const response: AxiosResponse<EntityResponse> = await api.post('/entities', entity)
    return response.data
  }

  static async updateEntity(id: number, entity: UpdateEntityRequest): Promise<EntityResponse> {
    const response: AxiosResponse<EntityResponse> = await api.put(`/entities/${id}`, entity)
    return response.data
  }

  static async deleteEntity(id: number): Promise<void> {
    await api.delete(`/entities/${id}`)
  }

  // Relationship operations
  static async getRelatedEntities(entityId: number): Promise<EntityResponse[]> {
    const response: AxiosResponse<EntityResponse[]> = await api.get(`/entities/${entityId}/related`)
    return response.data
  }

  static async createRelationship(fromId: number, toId: number): Promise<void> {
    await api.post(`/entities/${fromId}/relationships/${toId}`)
  }

  static async deleteRelationship(fromId: number, toId: number): Promise<void> {
    await api.delete(`/entities/${fromId}/relationships/${toId}`)
  }

  // Schema operations
  static async getSchema(): Promise<SchemaResponse> {
    const response: AxiosResponse<SchemaResponse> = await api.get('/food-chain/schema')
    return response.data
  }

  // Ingredient similarity operations
  static async findSimilarIngredients(request: FindSimilarIngredientsRequest): Promise<SimilarIngredientResponse[]> {
    const response: AxiosResponse<SimilarIngredientResponse[]> = await api.post('/food-chain/ingredients/similar', request)
    return response.data
  }

  // Recipe extraction operations
  static async extractRecipeFromUrl(request: ExtractRecipeFromUrlRequest): Promise<ExtractedRecipeResponse> {
    const response: AxiosResponse<ExtractedRecipeResponse> = await api.post('/food-chain/recipes/extract-from-url', request)
    return response.data
  }

  static async extractRecipeFromText(request: ExtractRecipeFromTextRequest): Promise<ExtractedRecipeResponse> {
    const response: AxiosResponse<ExtractedRecipeResponse> = await api.post('/food-chain/recipes/extract-from-text', request)
    return response.data
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      await api.get('/health')
      return true
    } catch {
      return false
    }
  }
}

export default ApiService
