# Dockerfile para AgroAssist IA - Google Cloud Run
# Adaptado para Vite + React + TypeScript

# Etapa 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Etapa 2: Builder de la aplicación Vite
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar node_modules desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# IMPORTANTE: Declarar ARG para recibir variables de build de Vite
ARG VITE_TAVUS_API_KEY
ARG VITE_REPLICA_ID
ARG VITE_PERSONA_ID

# Establecer como ENV para que Vite las use en build time
ENV VITE_TAVUS_API_KEY=${VITE_TAVUS_API_KEY}
ENV VITE_REPLICA_ID=${VITE_REPLICA_ID}
ENV VITE_PERSONA_ID=${VITE_PERSONA_ID}
ENV NODE_ENV=production

# Verificar que las variables estén presentes (debug)
RUN echo "Building with VITE_TAVUS_API_KEY: ${VITE_TAVUS_API_KEY}"
RUN echo "Building with VITE_REPLICA_ID: ${VITE_REPLICA_ID}"

# Build de Vite
RUN npm run build

# Etapa 3: Producción - Servidor web ligero
FROM nginx:alpine AS production

# Instalar dumb-init para manejo correcto de procesos
RUN apk add --no-cache dumb-init curl

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
	adduser -S agroassist -u 1001 -G nodejs

# Copiar archivos estáticos generados por Vite desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto 8080 (requerido por Google Cloud Run)
EXPOSE 8080

# Cambiar permisos para el usuario no-root
RUN chown -R agroassist:nodejs /var/cache/nginx && \
	chown -R agroassist:nodejs /var/log/nginx && \
	chown -R agroassist:nodejs /etc/nginx/conf.d

# Crear directorio temporal con permisos correctos
RUN mkdir -p /tmp/nginx && \
	chown -R agroassist:nodejs /tmp/nginx

# Configurar PID file en ubicación accesible para usuario no-root
RUN sed -i 's/pid \/var\/run\/nginx.pid;/pid \/tmp\/nginx\/nginx.pid;/' /etc/nginx/nginx.conf

# Cambiar a usuario no-root por seguridad
USER agroassist

# Variables de entorno para Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD curl -f http://localhost:8080/health || exit 1

# Comando de inicio con dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
