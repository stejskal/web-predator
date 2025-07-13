// API Types matching the Autotroph backend models

export interface EntityNode {
  id?: number
  name: string
  type: string
  description?: string
  createdAt: string
  updatedAt: string
  properties: Record<string, any>
  relatedEntities: number[]
}

export interface EntityResponse {
  id: number
  name: string
  type: string
  description?: string
  createdAt: string
  updatedAt: string
  properties: Record<string, any>
  relatedEntitiesCount: number
}

export interface CreateEntityRequest {
  name: string
  type: string
  description?: string
  properties?: Record<string, any>
}

export interface UpdateEntityRequest {
  name?: string
  type?: string
  description?: string
  properties?: Record<string, any>
}

export interface EntitySummary {
  id: number
  name: string
  type: string
  description?: string
}

export interface RelationshipResponse {
  id: string
  fromEntityId: number
  toEntityId: number
  relationshipType: string
  createdAt: string
  fromEntity?: EntitySummary
  toEntity?: EntitySummary
}

export interface EntityWithRelationshipsResponse {
  entity: EntityResponse
  relationships: RelationshipResponse[]
}

export interface ErrorResponse {
  code: string
  message: string
}

// Entity Types from the backend - ordered by display priority
export const ENTITY_TYPES = [
  'MealPlan',
  'Meal',
  'Recipe',
  'Ingredient',
  'Cuisine',
  'StoreLocation',
  'ShoppingList',
  'Source',
] as const

export type EntityType = (typeof ENTITY_TYPES)[number]

// API Response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: ErrorResponse
}

// Search and filter types
export interface SearchParams {
  name?: string
  type?: string
  nameFragment?: string
}

export interface PaginationParams {
  limit?: number
  offset?: number
}

// Schema types for the new schema endpoint
export interface EntitySchema {
  type: string
  label: string
  description: string
  properties: PropertySchema[]
}

export interface PropertySchema {
  name: string
  type: string
  required: boolean
  description: string
  enumValues?: string[]
}

export interface RelationshipSchema {
  name: string
  description: string
  isDirectional: boolean
}

export interface RelationshipMatrix {
  fromEntityType: string
  toEntityType: string
  relationshipName: string
  relationshipDescription: string
}

export interface SchemaResponse {
  entities: EntitySchema[]
  relationships: RelationshipSchema[]
  relationshipMatrix: RelationshipMatrix[]
  enums: Record<string, string[]>
}

// Ingredient similarity types
export interface FindSimilarIngredientsRequest {
  ingredientName: string
  topK?: number
}

// Recipe extraction types
export interface ExtractRecipeFromUrlRequest {
  url: string
}

export interface ExtractRecipeFromTextRequest {
  text: string
}

export interface ExtractedIngredientWithMatches {
  name: string
  similarIngredients: SimilarIngredientMatch[]
}

export interface ExtractedRecipeResponse {
  url: string
  simplifiedName: string | null
  ingredients: ExtractedIngredientWithMatches[]
  success: boolean
  errorMessage?: string
}

export interface IngredientResponse {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  purchaseFrequency?: string
  storeLocationsCount: number
  storeLocations: StoreLocationResponse[]
}

export interface StoreLocationResponse {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface SimilarIngredientResponse {
  ingredient: IngredientResponse
  similarity: number
}

// Simplified version for recipe extraction
export interface SimilarIngredientMatch {
  id: number
  name: string
  similarity: number
}
