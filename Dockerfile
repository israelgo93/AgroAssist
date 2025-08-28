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

# Configurar Nginx para Google Cloud Run
RUN cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
	worker_connections 1024;
	use epoll;
	multi_accept on;
}

http {
	include /etc/nginx/mime.types;
	default_type application/octet-stream;
	
	# Logging optimizado para Cloud Run
	log_format main '$remote_addr - $remote_user [$time_local] "$request" '
					'$status $body_bytes_sent "$http_referer" '
					'"$http_user_agent" "$http_x_forwarded_for"';
	
	access_log /var/log/nginx/access.log main;
	
	# Optimizaciones de rendimiento
	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	
	# Compresión para mejorar velocidad de carga
	gzip on;
	gzip_vary on;
	gzip_min_length 1024;
	gzip_types
		text/plain
		text/css
		text/xml
		text/javascript
		application/javascript
		application/xml+rss
		application/json;
	
	# Configuración del servidor
	server {
		listen 8080;
		server_name _;
		root /usr/share/nginx/html;
		index index.html;
		
		# Headers de seguridad
		add_header X-Frame-Options "SAMEORIGIN" always;
		add_header X-XSS-Protection "1; mode=block" always;
		add_header X-Content-Type-Options "nosniff" always;
		add_header Referrer-Policy "no-referrer-when-downgrade" always;
		add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
		
		# Configuración para SPA (Single Page Application)
		location / {
			try_files $uri $uri/ /index.html;
			expires 1y;
			add_header Cache-Control "public, immutable";
		}
		
		# Cache específico para assets
		location /assets/ {
			expires 1y;
			add_header Cache-Control "public, immutable";
		}
		
		# No cache para index.html
		location = /index.html {
			expires -1;
			add_header Cache-Control "no-cache, no-store, must-revalidate";
		}
		
		# Health check para Google Cloud Run
		location /health {
			access_log off;
			return 200 "healthy\n";
			add_header Content-Type text/plain;
		}
		
		# Bloquear acceso a archivos sensibles
		location ~ /\. {
			deny all;
		}
	}
}
EOF

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
