import type { TavusConversationRequest, TavusConversationResponse, TavusError } from '../types/tavus';

const TAVUS_API_BASE = 'https://tavusapi.com/v2';

class TavusApiService {
	private getApiKey(): string {
		const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
		if (!apiKey) {
			throw new Error('VITE_TAVUS_API_KEY no está configurada');
		}
		return apiKey;
	}

	private getReplicaId(): string {
		const replicaId = import.meta.env.VITE_REPLICA_ID;
		if (!replicaId) {
			throw new Error('VITE_REPLICA_ID no está configurada en las variables de entorno');
		}
		return replicaId;
	}

	private getPersonaId(): string {
		const personaId = import.meta.env.VITE_PERSONA_ID;
		if (!personaId) {
			throw new Error('VITE_PERSONA_ID no está configurada en las variables de entorno');
		}
		return personaId;
	}

	async createConversation(
		replicaId?: string,
		personaId?: string,
		language: string = 'spanish'
	): Promise<TavusConversationResponse> {
		const requestBody: TavusConversationRequest = {
			replica_id: replicaId || this.getReplicaId(),
			persona_id: personaId || this.getPersonaId(),
			properties: {
				participant_left_timeout: 0,
				language
			}
		};

		const response = await fetch(`${TAVUS_API_BASE}/conversations`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.getApiKey(),
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData: TavusError = await response.json();
			throw new Error(`Error ${response.status}: ${errorData.message || errorData.error}`);
		}

		return response.json();
	}
}

// Singleton para el servicio
export const tavusApi = new TavusApiService();
