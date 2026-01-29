/**
 * Cliente para Google Places API (New)
 * 
 * Adaptado para el CRM con configuración dinámica.
 * Permite configurar sector, ubicación y cantidad de resultados.
 */

import type { Lead, PlaceResult, TextSearchResponse, SearchConfig } from '../types/lead-scraper.types';

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places';

export interface GooglePlacesConfig {
  apiKey: string;
  fieldMask?: string[];
  maxResultsPerQuery?: number;
}

export class GooglePlacesService {
  private apiKey: string;
  private fieldMask: string;
  private maxResultsPerQuery: number;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor(config: GooglePlacesConfig) {
    this.apiKey = config.apiKey;
    this.maxResultsPerQuery = config.maxResultsPerQuery ?? 60; // Máximo 3 páginas

    // Campos optimizados para coste/beneficio
    this.fieldMask = (config.fieldMask || [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.nationalPhoneNumber',
      'places.websiteUri',
      'places.rating',
      'places.userRatingCount',
      'places.primaryType',
      'places.googleMapsUri',
    ]).join(',');
  }

  /**
   * Rate limit: 5 requests por segundo
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Ejecuta una búsqueda de texto (una sola página)
   */
  private async textSearchPage(
    query: string,
    location?: { lat: number; lng: number },
    radiusMeters?: number,
    pageToken?: string
  ): Promise<TextSearchResponse> {
    await this.waitForRateLimit();

    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: 'es',
      regionCode: 'ES',
      maxResultCount: 20,
    };

    // Solo añadir locationBias si tenemos coordenadas
    if (location && radiusMeters) {
      body.locationBias = {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius: radiusMeters,
        },
      };
    }

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const response = await fetch(`${PLACES_API_BASE}:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': this.fieldMask + ',nextPageToken',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${error}`);
    }

    this.requestCount++;
    return await response.json();
  }

  /**
   * Busca negocios con paginación hasta alcanzar el límite deseado
   */
  async search(
    query: string,
    maxResults: number = 20,
    location?: { lat: number; lng: number },
    radiusMeters: number = 50000
  ): Promise<PlaceResult[]> {
    const allResults: PlaceResult[] = [];
    let pageToken: string | undefined = undefined;
    let pageNumber = 0;
    const maxPages = Math.ceil(maxResults / 20);

    try {
      do {
        pageNumber++;

        const response = await this.textSearchPage(query, location, radiusMeters, pageToken);
        const places = response.places || [];

        allResults.push(...places);
        pageToken = response.nextPageToken;

        // Si ya tenemos suficientes resultados, parar
        if (allResults.length >= maxResults) {
          break;
        }

        // Delay entre páginas
        if (pageToken) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

      } while (pageToken && pageNumber < maxPages);

    } catch (error) {
      console.error(`Error buscando "${query}":`, error);
      throw error;
    }

    // Recortar al número exacto pedido
    return allResults.slice(0, maxResults);
  }

  /**
   * Busca negocios según la configuración del usuario
   */
  async searchByConfig(config: SearchConfig): Promise<PlaceResult[]> {
    const query = `${config.sector} en ${config.ubicacion}`;
    
    // Por ahora buscamos sin coordenadas específicas
    // Google es bueno inferiendo la ubicación del texto
    const results = await this.search(query, config.cantidad);

    // Aplicar filtros
    let filtered = results;

    if (config.filtros.requiereWebsite) {
      filtered = filtered.filter(r => r.websiteUri);
    }

    if (config.filtros.ratingMinimo) {
      filtered = filtered.filter(r => (r.rating || 0) >= config.filtros.ratingMinimo!);
    }

    return filtered;
  }

  /**
   * Convierte resultado de Places a tipo Lead
   */
  static resultToLead(result: PlaceResult, categoria: string, ubicacion: string): Lead {
    return {
      id: result.id,
      nombre: result.displayName?.text || 'Sin nombre',
      categoria,
      direccion: result.formattedAddress || '',
      ubicacion,
      telefono: result.nationalPhoneNumber,
      email: undefined,
      website: result.websiteUri,
      rating: result.rating,
      totalReviews: result.userRatingCount,
      placeId: result.id,
      emailStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Estadísticas de uso
   */
  getStats(): { requestCount: number; estimatedCost: number } {
    const costPerRequest = 0.032;
    return {
      requestCount: this.requestCount,
      estimatedCost: this.requestCount * costPerRequest,
    };
  }
}

/**
 * Crea instancia del servicio
 */
export function createGooglePlacesService(): GooglePlacesService {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GOOGLE_PLACES_API_KEY no está configurada.\n' +
      'Configura en .env.local: GOOGLE_PLACES_API_KEY=tu-api-key'
    );
  }

  return new GooglePlacesService({ apiKey });
}
