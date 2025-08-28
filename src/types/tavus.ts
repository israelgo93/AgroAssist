// Tipos para la API de Tavus
export interface TavusConversationRequest {
	replica_id: string;
	persona_id: string;
	properties?: {
		participant_left_timeout?: number;
		language?: string;
	};
}

export interface TavusConversationResponse {
	conversation_url: string;
	conversation_id: string;
	status: string;
}

export interface TavusError {
	error: string;
	message: string;
	status_code: number;
}

// Estados de la aplicación
export type ConversationState = 'idle' | 'loading' | 'connected' | 'error';

export interface AppState {
	conversationUrl: string | null;
	isLoading: boolean;
	error: string | null;
	state: ConversationState;
}
