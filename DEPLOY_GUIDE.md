# 🌾 Guía de Despliegue - AgroAssist IA en Google Cloud Run

## 📋 Preparación Previa

### 1. Requisitos
- Cuenta de Google Cloud Platform activa
- Proyecto GCP configurado con facturación habilitada
- Repositorio GitHub del proyecto
- Variables de entorno configuradas:
  - `VITE_TAVUS_API_KEY`
  - `VITE_REPLICA_ID`
  - `VITE_PERSONA_ID`

### 2. APIs Necesarias en GCP
Activar las siguientes APIs en Google Cloud Console:
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## 🚀 Despliegue Automático desde GitHub

### Opción 1: Deploy Directo desde Cloud Console

1. **Ir a Cloud Run** en Google Cloud Console
2. **Crear Servicio** → "Deploy from repository"
3. **Configurar repositorio:**
   - Source: GitHub
   - Repository: `tu-usuario/agroassist-ia`
   - Branch: `main`
   - Build Type: Dockerfile

4. **Configurar servicio:**
   - Service name: `agroassist-ia`
   - Region: `us-central1` (o la región de tu preferencia)
   - CPU allocation: Only during request processing
   - Memory: `512Mi`
   - Max instances: `10`

5. **Variables de entorno:**
   ```
   VITE_TAVUS_API_KEY=tu_api_key_aqui
   VITE_REPLICA_ID=tu_replica_id_aqui
   VITE_PERSONA_ID=tu_persona_id_aqui
   NODE_ENV=production
   PORT=8080
   ```

6. **Configuración de red:**
   - Allow unauthenticated invocations: ✅
   - Port: `8080`

### Opción 2: Deploy con Cloud Build (Recomendado)

1. **Conectar repositorio a Cloud Build:**
   ```bash
   gcloud builds triggers create github \
     --repo-name=agroassist-ia \
     --repo-owner=tu-usuario \
     --branch-pattern="^main$" \
     --build-config=cloudbuild.yaml
   ```

2. **Configurar variables de entorno en Cloud Run:**
   ```bash
   gcloud run services update agroassist-ia \
     --region=us-central1 \
     --set-env-vars="VITE_TAVUS_API_KEY=tu_api_key,VITE_REPLICA_ID=tu_replica_id,VITE_PERSONA_ID=tu_persona_id"
   ```

## 🔧 Deploy Manual (Alternativo)

Si prefieres hacer el deploy manual:

```bash
# 1. Build local de la imagen
docker build -t gcr.io/tu-proyecto-id/agroassist-ia .

# 2. Push al Container Registry
docker push gcr.io/tu-proyecto-id/agroassist-ia

# 3. Deploy a Cloud Run
gcloud run deploy agroassist-ia \
  --image=gcr.io/tu-proyecto-id/agroassist-ia \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10
```

## 🧪 Prueba Local

Antes del deploy, puedes probar localmente:

```bash
# Con Docker Compose
docker-compose up --build

# O con Docker directo
docker build -t agroassist-local .
docker run -p 8080:8080 \
  -e VITE_TAVUS_API_KEY=tu_api_key \
  -e VITE_REPLICA_ID=tu_replica_id \
  -e VITE_PERSONA_ID=tu_persona_id \
  agroassist-local
```

Luego visita: `http://localhost:8080`

## ⚙️ Configuración de Variables de Entorno

### En Cloud Run Console:
1. Ve a tu servicio en Cloud Run
2. Clic en "Edit & Deploy New Revision"
3. En "Variables & Secrets" → "Environment variables"
4. Agregar:
   - `VITE_TAVUS_API_KEY`: Tu API key de Tavus
   - `VITE_REPLICA_ID`: ID de tu replica
   - `VITE_PERSONA_ID`: ID de tu persona

### Con gcloud CLI:
```bash
gcloud run services update agroassist-ia \
  --region=us-central1 \
  --update-env-vars="VITE_TAVUS_API_KEY=tu_api_key,VITE_REPLICA_ID=tu_replica_id,VITE_PERSONA_ID=tu_persona_id"
```

## 📊 Monitoreo y Logs

### Ver logs en tiempo real:
```bash
gcloud run services logs tail agroassist-ia --region=us-central1
```

### Métricas en Cloud Console:
- Ve a Cloud Run → Tu servicio → Métricas
- Monitorea: Requests, Latencia, CPU, Memoria

## 🔒 Seguridad

El Dockerfile incluye:
- Usuario no-root
- Headers de seguridad
- Health checks
- Configuración optimizada de Nginx

## 🚨 Troubleshooting

### Error: "dockerfile parse error line 57: unknown instruction: WORKER_PROCESSES"
**Solución**: Error de formato en configuración de Nginx. Ya corregido en la última versión del Dockerfile.

### Error: "Port not configured"
Asegúrate de que el puerto 8080 esté expuesto en el Dockerfile.

### Error: "Variables de entorno no encontradas"
Verifica que todas las variables estén configuradas en Cloud Run.

### Build falla:
Revisa los logs en Cloud Build Console para identificar el error específico.

### Error: "terser not found"
**Solución**: Instalar dependencia faltante:
```bash
npm install --save-dev terser
```

## 🌐 URL Final

Una vez desplegado, tu aplicación estará disponible en:
```
https://agroassist-ia-[hash]-uc.a.run.app
```

¡AgroAssist IA listo para ayudar al sector agroindustrial! 🌾🚜
