import { useState } from 'react'
import './App.css'
import { CVIProvider } from "./components/cvi/components/cvi-provider";
import { Conversation } from "./components/cvi/components/conversation";
import { tavusApi } from './services/tavusApi';
import type { ConversationState } from './types/tavus';

function App() {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setState] = useState<ConversationState>('idle');

  const createConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setState('loading');
      console.log('Creando conversación con Tavus CVI');
      
      const response = await tavusApi.createConversation();
      console.log('Conversación creada exitosamente:', response);
      
      setConversationUrl(response.conversation_url);
      setState('connected');
    } catch (error) {
      console.error('Error al crear conversación:', error);
      setError(`Error al crear conversación: ${error}`);
      setState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveConversation = () => {
    setConversationUrl(null);
    setError(null);
    setState('idle');
  };

  return (
    <CVIProvider>
      <div
        className="app-main-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(135deg, #2D5016 0%, #4A7C3A 50%, #5B8C47 100%)",
          color: "#fff",
          textAlign: "center",
          flexDirection: "column",
          margin: 0,
          padding: "20px",
          boxSizing: "border-box",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <div style={{ 
          marginBottom: conversationUrl ? "2rem" : "4rem", 
          textAlign: "center",
          position: "relative",
          width: "100%"
        }}>
          <div style={{ 
            position: "relative",
            display: "inline-block",
            marginBottom: conversationUrl ? "0.5rem" : "1rem"
          }}>
            <span 
              className="agro-icon"
              style={{ 
                fontSize: conversationUrl ? "2.5rem" : "3.5rem", 
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                transition: "all 0.3s ease",
                position: "absolute",
                left: conversationUrl ? "-3.5rem" : "-4.8rem",
                top: "50%",
                transform: "translateY(-50%)"
              }}>🌾</span>
            <h1 style={{ 
              margin: "0", 
              fontSize: conversationUrl ? "2.2rem" : "3.2rem", 
              fontWeight: "600",
              letterSpacing: "-0.01em",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              transition: "all 0.3s ease"
            }}>
              Agronomo IA
            </h1>
          </div>
          {!conversationUrl && (
            <p style={{
              fontSize: "1.2rem",
              opacity: 0.95,
              fontWeight: "400",
              margin: 0,
              letterSpacing: "0.01em",
              color: "#F0F7E8"
            }}>
              Intriago IA - Asistente NeoAgro
            </p>
          )}
        </div>
        
        {error && (
          <div style={{
            backgroundColor: "#D32F2F",
            color: "white",
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            maxWidth: "480px",
            fontSize: "0.95rem",
            boxShadow: "0 4px 16px rgba(211, 47, 47, 0.3)",
            border: "1px solid #C62828",
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ marginRight: "8px", fontSize: "1.1rem" }}>🚨</span>
              Error de conexión: {error}
            </div>
          </div>
        )}
        
        {!conversationUrl ? (
          <button
            onClick={createConversation}
            disabled={isLoading}
            style={{
              padding: "1.1rem 2.2rem",
              fontSize: "1.15rem",
              background: isLoading 
                ? "rgba(120, 120, 120, 0.9)" 
                : "#F4C430",
              color: isLoading ? "#fff" : "#2D5016",
              border: "2px solid transparent",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: isLoading 
                ? "0 4px 12px rgba(0, 0, 0, 0.2)" 
                : "0 4px 16px rgba(244, 196, 48, 0.4)",
              fontWeight: "600",
              minWidth: "260px",
              position: "relative",
              letterSpacing: "0.01em",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginRight: "8px"
                }}></div>
                Iniciando consulta...
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ marginRight: "8px", fontSize: "1.2rem" }}>🚜</span>
                Consultar Asistente
              </div>
            )}
          </button>
        ) : (
          <>
            <div 
              className="conversation-container"
              style={{ 
                width: "100%", 
                maxWidth: "1200px", 
                height: "85vh",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(45, 80, 22, 0.3)",
                border: "2px solid rgba(244, 196, 48, 0.2)",
                background: "rgba(255, 255, 255, 0.95)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
              <Conversation
                conversationUrl={conversationUrl}
                onLeave={handleLeaveConversation}
              />
            </div>
            <div style={{
              marginTop: "1rem",
              textAlign: "center",
              opacity: 0.8
            }}>
              <p style={{
                fontSize: "1rem",
                color: "#F0F7E8",
                margin: 0,
                fontWeight: "400",
                letterSpacing: "0.01em"
              }}>
                Intriago IA - Asistente NeoAgro
              </p>
            </div>
          </>
        )}
      </div>
    </CVIProvider>
  )
}

export default App
